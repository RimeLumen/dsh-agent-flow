/*! dsh-agent-flow v0.1.0 | Copyright (c) 2026 RimeLumen | MIT License */
/**
 * 反向组合：画布 → 提示词。
 *
 * 与 decompose.js（提示词 → 画布）构成往返：用户在画布上增删节点、改标题、连好线之后，
 * 由本模块把图重新写成一段可交给 Agent 执行的提示词。
 *
 * 设计取舍：只输出「人能读、Agent 能执行」的结构化文本，不输出 JSON——提示词是给人看和改的。
 * 主次（mainPath）决定叙述顺序；边的结构决定顺序 / 并行 / 依赖的措辞。
 */

const PARALLEL_LABEL = '（与上一步同时进行）'

/** 节点类型 → 行动指引措辞。 */
function kindHint(node) {
  const name = node.params?.name
  const tool = typeof name === 'string' && name !== '' ? name : undefined
  switch (node.kind) {
    case 'tool.call':
      return tool ? `调用工具 ${tool}` : '调用工具'
    case 'human.checkpoint':
      return '请我人工确认后再继续'
    case 'branch.condition':
      return '根据条件选择分支'
    case 'flow.parallel':
      return '并行执行下列工作'
    case 'flow.join':
      return '汇总并行结果'
    case 'flow.loop':
      return '重复执行直到满足条件'
    case 'flow.wait':
      return '等待外部信号'
    case 'inject.context':
      return '载入约定的上下文'
    case 'inject.skill':
      return '按需载入技能'
    case 'io.output':
      return typeof node.params?.template === 'string' && node.params.template !== ''
        ? `产出：${node.params.template}`
        : '产出结果'
    case 'subflow.call':
      return '调用子流程'
    default:
      return ''
  }
}

/** 一句话描述一个节点：标题 + 类型指引。 */
function describe(node) {
  const hint = kindHint(node)
  const prompt = typeof node.params?.prompt === 'string' && node.params.prompt.trim() !== ''
    ? node.params.prompt.trim()
    : ''
  const body = prompt !== '' && prompt !== node.title ? prompt : node.title
  return hint === '' ? body : `${body}（${hint}）`
}

/**
 * 画布 → 提示词。
 * @param {object} workflow 归一化后的流程
 * @param {{ goal?: string, locale?: string, includeVars?: boolean }} [options]
 * @returns {{ text: string, sections: object, warnings: Array<{code:string,message:string}>, stats: object }}
 */
export function composePrompt(workflow, options = {}) {
  const warnings = []
  if (!workflow || !Array.isArray(workflow.nodes) || workflow.nodes.length === 0) {
    return { text: '', sections: {}, warnings: [{ code: 'EMPTY_WORKFLOW', message: '画布为空，无法组合成提示词' }], stats: { nodes: 0, edges: 0, phases: 0 } }
  }
  const nodes = workflow.nodes
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const edges = Array.isArray(workflow.edges) ? workflow.edges : []

  // 主干顺序：mainPath 优先；没有就用入口做 BFS 层序（保证叙述有确定顺序）
  const mainPath = (Array.isArray(workflow.mainPath) ? workflow.mainPath : []).filter((id) => byId.has(id))
  let order = mainPath
  if (order.length === 0) {
    const incoming = new Map(nodes.map((node) => [node.id, 0]))
    for (const edge of edges) if (incoming.has(edge.to)) incoming.set(edge.to, incoming.get(edge.to) + 1)
    const start = nodes.find((node) => node.id === workflow.entry) ?? nodes.find((node) => incoming.get(node.id) === 0) ?? nodes[0]
    const seen = new Set()
    const queue = [start.id]
    order = []
    while (queue.length > 0) {
      const id = queue.shift()
      if (seen.has(id) || !byId.has(id)) continue
      seen.add(id)
      order.push(id)
      for (const edge of edges) if (edge.from === id) queue.push(edge.to)
    }
    for (const node of nodes) if (!seen.has(node.id)) order.push(node.id)
  }

  // 并行识别：同一阶段内，前驱集合完全相同的节点互为并行（结构性判断，不依赖额外字段）
  const predsOf = new Map()
  for (const node of nodes) {
    predsOf.set(node.id, edges.filter((edge) => edge.to === node.id).map((edge) => edge.from).sort().join(','))
  }
  const parallelIds = new Set()
  const groups = new Map()
  // 注意：必须遍历全部节点而不是 order——支线节点不在主干里，漏掉它们会
  // 让"同一前驱的两个后继"（真正的并行）识别不出来。
  const stableOrder = [...order, ...nodes.filter((node) => !order.includes(node.id)).map((node) => node.id)]
  for (const id of stableOrder) {
    const key = `${byId.get(id)?.phaseId ?? ''}|${predsOf.get(id) ?? ''}|${byId.get(id)?.kind === 'phase' ? 'p' : 'n'}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(id)
  }
  for (const members of groups.values()) {
    if (members.length > 1) for (const id of members.slice(1)) parallelIds.add(id)
  }

  // 阶段分组：阶段节点自身不单独成行，只作标题
  const phaseNodes = nodes.filter((node) => node.kind === 'phase')
  const phaseOrder = (phaseNodes.length > 0 ? phaseNodes : [{ id: '', title: '' }])
    .map((phaseNode) => phaseNode.id)
  const buckets = new Map()
  for (const node of nodes) {
    if (node.kind === 'phase') continue
    const key = node.phaseId && byId.has(node.phaseId) ? node.phaseId : ''
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key).push(node)
  }
  // 无阶段归属的节点若存在，作为独立一节放在最前
  const orderedKeys = []
  if (buckets.has('')) orderedKeys.push('')
  for (const id of phaseOrder) if (id !== '' && buckets.has(id)) orderedKeys.push(id)
  for (const key of buckets.keys()) if (!orderedKeys.includes(key)) orderedKeys.push(key)

  const lines = []
  const goal = typeof options.goal === 'string' && options.goal.trim() !== ''
    ? options.goal.trim()
    : (typeof workflow.description === 'string' && workflow.description !== '' ? workflow.description : '')
  lines.push(`# ${workflow.name || '未命名流程'}`)
  if (goal !== '') lines.push('', `目标：${goal}`)
  lines.push('', '按下面的顺序执行；标了「同时」的步骤可以并行。')

  let phaseNo = 0
  const sectionText = {}
  for (const key of orderedKeys) {
    const members = (buckets.get(key) ?? [])
      .slice()
      .sort((a, b) => {
        const ia = order.indexOf(a.id)
        const ib = order.indexOf(b.id)
        return (ia < 0 ? Number.MAX_SAFE_INTEGER : ia) - (ib < 0 ? Number.MAX_SAFE_INTEGER : ib)
      })
    if (members.length === 0) continue
    const phaseNode = key !== '' ? byId.get(key) : null
    const title = phaseNode?.title ?? '工作项'
    // 标题若本身就是「阶段 N / 阶段一」这类通用名，不再拼一次，避免「阶段 1：阶段 1」
    const generic = /^阶段\s*[一二三四五六七八九十\d]*$/.test(title.trim())
    const numbering = phaseNode ? `## 阶段 ${++phaseNo}${generic ? '' : `：${title}`}` : '## 工作项'
    lines.push('', numbering)
    const linesOut = []
    members.forEach((node) => {
      const badge = parallelIds.has(node.id) ? PARALLEL_LABEL : ''
      linesOut.push(`- ${describe(node)}${badge}`)
      // 显式依赖：被本节点依赖、且不在同一阶段内的节点，单列说明
      const relies = Array.isArray(node.reliesOn) ? node.reliesOn : []
      const external = relies
        .map((ref) => byId.get(ref) ?? nodes.find((candidate) => candidate.title === ref))
        .filter((dep) => dep && (dep.phaseId ?? '') !== (node.phaseId ?? ''))
        .map((dep) => dep.title)
      if (external.length > 0) linesOut.push(`  - 依赖：${external.join('、')} 已完成`)
    })
    lines.push(...linesOut)
    sectionText[title] = linesOut.join('\n')
  }

  // 变量：Agent 执行时需要知道的输入
  const vars = workflow.vars && typeof workflow.vars === 'object' ? Object.entries(workflow.vars) : []
  if (options.includeVars !== false && vars.length > 0) {
    lines.push('', '## 参数')
    for (const [key, value] of vars.slice(0, 50)) lines.push(`- ${key} = ${value}`)
  }

  // 校验提醒：图上找不到的实现细节，交给 Agent 自行决定；但结构性缺陷要明说
  const orphan = nodes.filter((node) => node.kind !== 'phase'
    && edges.every((edge) => edge.from !== node.id && edge.to !== node.id))
  if (orphan.length > 0) {
    warnings.push({ code: 'ORPHAN_NODES', message: `${orphan.length} 个节点没有任何连线：${orphan.slice(0, 5).map((node) => node.title).join('、')}` })
  }
  if (phaseNodes.length > 0 && !nodes.some((node) => node.kind !== 'phase' && node.phaseId)) {
    warnings.push({ code: 'PHASE_EMPTY', message: '阶段没有任何子步骤，提示词里只会出现阶段标题' })
  }

  return {
    text: lines.join('\n'),
    sections: sectionText,
    warnings,
    stats: { nodes: nodes.filter((node) => node.kind !== 'phase').length, edges: edges.length, phases: phaseNodes.length },
  }
}
