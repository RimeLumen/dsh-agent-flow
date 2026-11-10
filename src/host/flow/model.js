/*! dsh-agent-flow v0.1.0 | Copyright (c) 2026 RimeLumen | MIT License */
import { parseExpr } from './expr.js'
import { MIN_TITLE_FONT, NODE_HEIGHT, NODE_WIDTH, TITLE_AVAILABLE_WIDTH, minimumNodeTextWidth } from './textfit.js'

export const NODE_KINDS = Object.freeze([
  'inject.context',
  'inject.skill',
  'agent.task',
  'tool.call',
  'branch.condition',
  'flow.parallel',
  'flow.join',
  'flow.loop',
  'flow.wait',
  'human.checkpoint',
  'io.output',
  'subflow.call',
  'group.steps',
  'phase',
])

export const WORKFLOW_MODES = Object.freeze(['task', 'design'])

export const FLOW_LAYOUTS = Object.freeze(['chain', 'tb', 'star', 'radial'])

export const EDGE_SIDES = Object.freeze([
  'top',
  'top-right',
  'right',
  'bottom-right',
  'bottom',
  'bottom-left',
  'left',
  'top-left',
  'top-q1',
  'top-q3',
  'right-q1',
  'right-q3',
  'bottom-q1',
  'bottom-q3',
  'left-q1',
  'left-q3',
])

export const EDGE_PALETTE_SIZE = 12

export const PORT_SETS = Object.freeze({
  'branch.condition': ['true', 'false'],
  'flow.loop': ['body', 'exit'],
  'human.checkpoint': ['out', 'stop'],
  'phase': ['out'],
})

const TERMINAL_KINDS = new Set(['io.output', 'flow.join'])

export function normalizeWorkflow(input, options = {}) {
  const makeId = typeof options.idFactory === 'function' ? options.idFactory : () => `n_${Math.random().toString(36).slice(2, 8)}`
  if (input === null || typeof input !== 'object') return null
  const nodesIn = Array.isArray(input.nodes) ? input.nodes : []
  const edgesIn = Array.isArray(input.edges) ? input.edges : []
  const seen = new Set()
  const nodes = []
  for (const raw of nodesIn) {
    if (raw === null || typeof raw !== 'object') continue
    const id = typeof raw.id === 'string' && raw.id !== '' ? raw.id : makeId()
    if (seen.has(id)) continue
    seen.add(id)
    const kind = NODE_KINDS.includes(raw.kind) ? raw.kind : 'io.output'
    nodes.push({
      id,
      kind,
      parentId: typeof raw.parentId === 'string' && raw.parentId !== '' && raw.parentId !== id ? raw.parentId : undefined,
      phaseId: typeof raw.phaseId === 'string' && raw.phaseId !== '' && raw.phaseId !== id ? raw.phaseId : undefined,
      reliesOn: Array.isArray(raw.reliesOn)
        ? [...new Set(raw.reliesOn.filter((ref) => typeof ref === 'string' && ref !== ''))].slice(0, 16)
        : undefined,
      title: typeof raw.title === 'string' && raw.title !== '' ? raw.title.slice(0, 120) : kind,
      pos: {
        x: Number.isFinite(Number(raw.pos?.x)) ? Number(raw.pos.x) : 40,
        y: Number.isFinite(Number(raw.pos?.y)) ? Number(raw.pos.y) : 40,
        ...(raw.pos?.pinned === true ? { pinned: true } : {}),
      },
      params: raw.params !== null && typeof raw.params === 'object' ? raw.params : {},
      onError: raw.onError === 'skip' || raw.onError === 'fallback' ? raw.onError : 'fail',
      fallbackTo: typeof raw.fallbackTo === 'string' && raw.fallbackTo !== '' ? raw.fallbackTo : undefined,
      retry: raw.retry !== null && typeof raw.retry === 'object' ? {
        max: Number.isFinite(Number(raw.retry.max)) ? Math.max(0, Math.min(5, Math.floor(Number(raw.retry.max)))) : 0,
        backoffMs: Number.isFinite(Number(raw.retry.backoffMs)) ? Math.max(0, Math.min(60000, Math.floor(Number(raw.retry.backoffMs)))) : 500,
      } : undefined,
      timeoutMs: Number.isFinite(Number(raw.timeoutMs)) ? Math.max(1000, Math.min(3600000, Math.floor(Number(raw.timeoutMs)))) : undefined,
      note: typeof raw.note === 'string' ? raw.note.slice(0, 1000) : undefined,
    })
  }
  const phases = []
  const phaseSeen = new Set()
  for (const raw of (Array.isArray(input.phases) ? input.phases : []).slice(0, 12)) {
    if (raw === null || typeof raw !== 'object') continue
    const id = typeof raw.id === 'string' && raw.id !== '' ? raw.id : `p_${Math.random().toString(36).slice(2, 8)}`
    if (phaseSeen.has(id)) continue
    phaseSeen.add(id)
    phases.push({
      id,
      title: typeof raw.title === 'string' && raw.title !== '' ? raw.title.slice(0, 120) : `Phase ${phases.length + 1}`,
      goal: typeof raw.goal === 'string' && raw.goal !== '' ? raw.goal.slice(0, 500) : undefined,
      order: Number.isFinite(Number(raw.order)) ? Math.max(0, Math.floor(Number(raw.order))) : phases.length,
    })
  }
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  for (const node of nodes) {
    if (node.kind !== 'phase' || phaseSeen.has(node.id)) continue
    phaseSeen.add(node.id)
    const goal = typeof node.params?.goal === 'string' && node.params.goal !== '' ? node.params.goal : undefined
    phases.push({ id: node.id, title: node.title, goal, order: phases.length })
  }
  for (const [index, phase] of phases.entries()) {
    const existing = nodeById.get(phase.id)
    if (!existing) {
      const node = {
        id: phase.id,
        kind: 'phase',
        phaseId: undefined,
        reliesOn: undefined,
        title: phase.title,
        pos: { x: 80, y: 80 + index * 180 },
        params: { goal: phase.goal, order: phase.order },
        onError: 'fail',
        fallbackTo: undefined,
        retry: undefined,
        timeoutMs: undefined,
        note: undefined,
      }
      nodes.push(node)
      nodeById.set(node.id, node)
      continue
    }
    existing.params = { ...(existing.params ?? {}) }
    if (existing.params.goal === undefined && phase.goal !== undefined) existing.params.goal = phase.goal
    if (existing.params.order === undefined) existing.params.order = phase.order
  }
  phases.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))

  const nodeIds = new Set(nodes.map((n) => n.id))
  const kindById = new Map(nodes.map((n) => [n.id, n.kind]))
  for (const node of nodes) {
    if (node.parentId === undefined) continue
    if (!nodeIds.has(node.parentId) || kindById.get(node.parentId) !== 'group.steps') node.parentId = undefined
  }
  const phaseIds = new Set(phases.map((phase) => phase.id))
  for (const node of nodes) {
    if (node.phaseId !== undefined && (!phaseIds.has(node.phaseId) || node.kind === 'phase')) node.phaseId = undefined
  }
  const idByTitle = new Map()
  for (const node of nodes) if (!idByTitle.has(node.title)) idByTitle.set(node.title, node.id)
  for (const node of nodes) {
    if (!Array.isArray(node.reliesOn) || node.reliesOn.length === 0) continue
    node.reliesOn = node.reliesOn
      .map((ref) => (nodeIds.has(ref) ? ref : (idByTitle.get(ref) ?? ref)))
      .filter((ref, index, all) => ref !== node.id && all.indexOf(ref) === index)
  }
  const edges = []
  for (const raw of edgesIn) {
    if (raw === null || typeof raw !== 'object') continue
    const from = typeof raw.from === 'string' ? raw.from : ''
    const to = typeof raw.to === 'string' ? raw.to : ''
    if (!nodeIds.has(from) || !nodeIds.has(to) || from === to) continue
    const colorRaw = Number(raw.color)
    edges.push({
      id: typeof raw.id === 'string' && raw.id !== '' ? raw.id : `e_${from}_${to}_${Math.random().toString(36).slice(2, 6)}`,
      from,
      fromPort: typeof raw.fromPort === 'string' && raw.fromPort !== '' ? raw.fromPort : 'out',
      to,
      ...(EDGE_SIDES.includes(raw.fromSide) ? { fromSide: raw.fromSide } : {}),
      ...(EDGE_SIDES.includes(raw.toSide) ? { toSide: raw.toSide } : {}),
      ...(Number.isFinite(colorRaw) ? { color: ((Math.floor(colorRaw) % EDGE_PALETTE_SIZE) + EDGE_PALETTE_SIZE) % EDGE_PALETTE_SIZE } : {}),
    })
  }
  const entry = typeof input.entry === 'string' && nodeIds.has(input.entry) ? input.entry : nodes[0]?.id ?? ''
  return {
    schemaVersion: 1,
    id: typeof input.id === 'string' && input.id !== '' ? input.id : `wf_${Math.random().toString(36).slice(2, 10)}`,
    name: typeof input.name === 'string' && input.name.trim() !== '' ? input.name.trim().slice(0, 80) : '未命名流程',
    description: typeof input.description === 'string' ? input.description.slice(0, 1000) : undefined,
    entry,
    nodes,
    edges,
    vars: input.vars !== null && typeof input.vars === 'object' && !Array.isArray(input.vars)
      ? Object.fromEntries(Object.entries(input.vars).filter(([, v]) => typeof v === 'string').slice(0, 100))
      : {},
    selectionProfileId: typeof input.selectionProfileId === 'string' && input.selectionProfileId !== '' ? input.selectionProfileId : undefined,
    mode: WORKFLOW_MODES.includes(input.mode) ? input.mode : 'task',
    layout: FLOW_LAYOUTS.includes(input.layout) ? input.layout : 'chain',
    turn: Number.isFinite(Number(input.turn)) ? Math.max(0, Math.floor(Number(input.turn))) : 0,
    phases: phases.length > 0 ? phases : undefined,
    // 主干：有序节点 id = 流程脊椎，其余节点为支线。
    // 布局与视觉据此区分主次；不存在的 id 直接丢弃，避免悬空引用。
    mainPath: Array.isArray(input.mainPath)
      ? input.mainPath
        .filter((id) => typeof id === 'string' && nodes.some((node) => node.id === id))
        .slice(0, 500)
      : undefined,
    // 节点实时状态（Agent 执行时经 flow_progress 上报）：{ [nodeId]: 'running'|'succeeded'|'failed' }
    nodeStatus: input.nodeStatus !== null && typeof input.nodeStatus === 'object' && !Array.isArray(input.nodeStatus)
      ? Object.fromEntries(Object.entries(input.nodeStatus)
        .filter(([id, status]) => typeof status === 'string' && ['running', 'succeeded', 'failed'].includes(status))
        .slice(0, 200))
      : undefined,
    sessionId: typeof input.sessionId === 'string' && input.sessionId !== '' ? input.sessionId.slice(0, 120) : undefined,
    archivedAt: typeof input.archivedAt === 'string' && input.archivedAt !== '' ? input.archivedAt.slice(0, 40) : undefined,
    origin: typeof input.origin === 'string' && input.origin !== '' ? input.origin.slice(0, 40) : 'user',
    updatedAt: new Date().toISOString(),
  }
}

export function createEmptyWorkflow(name, options = {}) {
  const a = `n_${Math.random().toString(36).slice(2, 8)}`
  const b = `n_${Math.random().toString(36).slice(2, 8)}`
  return normalizeWorkflow({
    name: name || '新流程',
    sessionId: options.sessionId,
    origin: options.origin,
    entry: a,
    nodes: [
      { id: a, kind: 'inject.context', title: '加载选定技能与工具', pos: { x: 80, y: 120 }, params: { includeSkills: true, includeTools: true } },
      { id: b, kind: 'io.output', title: '汇总输出', pos: { x: 420, y: 120 }, params: { template: '流程完成', appendToChat: false } },
    ],
    edges: [{ id: `e_${a}_${b}`, from: a, fromPort: 'out', to: b }],
  })
}

export function buildGraph(workflow) {
  const nodes = new Map(workflow.nodes.map((n) => [n.id, n]))
  const out = new Map()
  const inc = new Map()
  for (const node of workflow.nodes) {
    out.set(node.id, [])
    inc.set(node.id, [])
  }
  for (const edge of workflow.edges) {
    if (!out.has(edge.from) || !inc.has(edge.to)) continue
    out.get(edge.from).push(edge)
    inc.get(edge.to).push(edge)
  }
  return { nodes, out, inc }
}

export function reachableFrom(workflow, startId) {
  const { out } = buildGraph(workflow)
  const seen = new Set()
  const stack = [startId]
  while (stack.length > 0) {
    const id = stack.pop()
    if (seen.has(id)) continue
    seen.add(id)
    for (const edge of out.get(id) ?? []) stack.push(edge.to)
  }
  return seen
}

export function findCycle(workflow) {
  const { out } = buildGraph(workflow)
  const state = new Map()
  const stack = []
  let found = null
  const visit = (id) => {
    if (found) return
    state.set(id, 1)
    stack.push(id)
    for (const edge of out.get(id) ?? []) {
      const next = state.get(edge.to) ?? 0
      if (next === 1) {
        found = [...stack.slice(stack.indexOf(edge.to)), edge.to]
        return
      }
      if (next === 0) visit(edge.to)
      if (found) return
    }
    stack.pop()
    state.set(id, 2)
  }
  for (const node of workflow.nodes) {
    if ((state.get(node.id) ?? 0) === 0) visit(node.id)
    if (found) break
  }
  return found
}

export function edgesFromPort(workflow, nodeId, port) {
  return workflow.edges.filter((edge) => edge.from === nodeId && edge.fromPort === port)
}

export function validateWorkflow(workflow, context = {}) {

  const issues = []
  const add = (level, code, message, where = {}) => issues.push({ level, code, message, ...where })

  if (!workflow || !Array.isArray(workflow.nodes) || workflow.nodes.length === 0) {
    add('error', 'empty', '流程没有任何节点')
    return issues
  }
  const ids = new Set()
  for (const node of workflow.nodes) {
    if (ids.has(node.id)) add('error', 'duplicate-node', `节点 id 重复：${node.id}`, { nodeId: node.id })
    ids.add(node.id)
  }
  const nodeById = new Map(workflow.nodes.map((node) => [node.id, node]))
  if (!ids.has(workflow.entry)) {
    add('error', 'bad-entry', '起始节点不存在')
  }

  const { out, inc } = buildGraph(workflow)
  const reachable = workflow.entry && ids.has(workflow.entry) ? reachableFrom(workflow, workflow.entry) : new Set()

  const knownTools = Array.isArray(context.knownToolNames) ? new Set(context.knownToolNames) : null
  const knownSkills = Array.isArray(context.knownSkillNames) ? new Set(context.knownSkillNames) : null
  const knownWorkflows = Array.isArray(context.knownWorkflowIds) ? new Set(context.knownWorkflowIds) : null

  for (const edge of workflow.edges) {
    const from = nodeById.get(edge.from)
    if (!from) {
      add('error', 'dangling-edge', `连线指向不存在的来源节点：${edge.from}`, { edgeId: edge.id })
      continue
    }
    let allowed = PORT_SETS[from.kind] ?? ['out']
    if (from.kind === 'branch.condition') {
      const casePorts = (Array.isArray(from.params?.cases) ? from.params.cases : [])
        .map((item) => (typeof item?.port === 'string' && item.port !== '' ? item.port : null))
        .filter(Boolean)
      allowed = [...new Set([...allowed, ...casePorts])]
    }
    if (!allowed.includes(edge.fromPort)) {
      add('error', 'bad-port', `${from.kind} 的端口只能是 ${allowed.join(' / ')}，实际是 ${edge.fromPort}`, { nodeId: from.id, edgeId: edge.id })
    }
  }

  const childCount = new Map()
  for (const node of workflow.nodes) {
    if (node.parentId) childCount.set(node.parentId, (childCount.get(node.parentId) ?? 0) + 1)
  }

  for (const node of workflow.nodes) {
    const outs = out.get(node.id) ?? []
    const ins = inc.get(node.id) ?? []
    if (node.parentId) {
      const parent = nodeById.get(node.parentId)
      if (!parent) add('error', 'orphan-child', '子步骤的父级节点不存在', { nodeId: node.id })
      continue
    }
    if (workflow.entry && !reachable.has(node.id)) {
      add('warn', 'unreachable', '从起始节点走不到这个节点', { nodeId: node.id })
    }
    if (outs.length === 0 && !TERMINAL_KINDS.has(node.kind) && node.kind !== 'group.steps' && node.kind !== 'phase') {
      add('warn', 'dead-end', '没有下游连线，执行到这里就结束', { nodeId: node.id })
    }
    if (ins.length === 0 && node.id !== workflow.entry) {
      add('warn', 'orphan', '没有任何上游连线', { nodeId: node.id })
    }
    if (node.kind === 'group.steps' && (childCount.get(node.id) ?? 0) === 0) {
      add('warn', 'no-steps', '父级流程还没有子步骤（a/b/c）', { nodeId: node.id })
    }

    const params = node.params ?? {}
    switch (node.kind) {
      case 'inject.skill': {
        const names = Array.isArray(params.names) ? params.names : []
        if (names.length === 0) add('warn', 'no-skill', '没有选择任何技能', { nodeId: node.id })
        if (knownSkills) {
          for (const name of names) {
            if (!knownSkills.has(name)) add('warn', 'unknown-skill', `目录里没有技能「${name}」`, { nodeId: node.id })
          }
        }
        break
      }
      case 'agent.task': {
        if (typeof params.prompt !== 'string' || params.prompt.trim() === '') {
          add('error', 'no-prompt', 'agent.task 需要 prompt', { nodeId: node.id })
        }
        break
      }
      case 'tool.call': {
        const name = typeof params.name === 'string' ? params.name : ''
        if (name === '') add('error', 'no-tool', 'tool.call 需要工具名', { nodeId: node.id })
        else if (knownTools && !knownTools.has(name)) add('warn', 'unknown-tool', `当前目录里没有工具「${name}」`, { nodeId: node.id })
        const template = params.argsTemplate
        if (typeof template === 'string' && template.trim() !== '') {
          try {
            JSON.parse(template)
          } catch (error) {
            add('error', 'bad-args', `argsTemplate 不是合法 JSON：${error instanceof Error ? error.message : String(error)}`, { nodeId: node.id })
          }
        }
        break
      }
      case 'branch.condition': {
        const cases = Array.isArray(params.cases) ? params.cases : []
        if (cases.length === 0) add('error', 'no-case', 'branch.condition 至少需要一个分支条件', { nodeId: node.id })
        const ports = new Set()
        for (const item of cases) {
          const port = typeof item?.port === 'string' && item.port !== '' ? item.port : ''
          if (port === '') {
            add('error', 'bad-case-port', '分支条件缺少 port', { nodeId: node.id })
            continue
          }
          if (ports.has(port)) add('warn', 'duplicate-case-port', `分支端口重复：${port}`, { nodeId: node.id })
          ports.add(port)
          const parsedCase = parseExpr(item?.when)
          if (parsedCase.error) add('error', 'bad-expr', `分支条件语法错误：${parsedCase.error}`, { nodeId: node.id })
      }
        for (const edge of out.get(node.id) ?? []) {
          const allowed = [...ports, 'false']
          if (!allowed.includes(edge.fromPort)) {
            add('warn', 'unused-port', `没有条件对应端口「${edge.fromPort}」`, { nodeId: node.id, edgeId: edge.id })
          }
        }
        break
      }
      case 'flow.loop': {
        const max = Number(params.maxIterations)
        if (!Number.isFinite(max) || max <= 0) add('warn', 'loop-default', '未设置循环上限，将使用默认值 5', { nodeId: node.id })
        else if (max > 50) add('error', 'loop-too-big', '循环上限最大 50', { nodeId: node.id })
        if (typeof params.untilExpr === 'string' && params.untilExpr.trim() !== '') {
          const parsedLoop = parseExpr(params.untilExpr)
          if (parsedLoop.error) add('error', 'bad-expr', `循环条件语法错误：${parsedLoop.error}`, { nodeId: node.id })
        }
        const bodyEdges = out.get(node.id)?.filter((edge) => edge.fromPort === 'body') ?? []
        const exitEdges = out.get(node.id)?.filter((edge) => edge.fromPort === 'exit') ?? []
        if (bodyEdges.length === 0) add('error', 'loop-no-body', 'flow.loop 缺少 body 连线', { nodeId: node.id })
        if (exitEdges.length === 0) add('warn', 'loop-no-exit', 'flow.loop 没有 exit 连线，循环结束后流程就结束', { nodeId: node.id })
        break
      }
      case 'flow.wait': {
        const ms = Number(params.ms)
        const everyMs = Number(params.everyMs)
        if ((!Number.isFinite(ms) || ms <= 0) && (!Number.isFinite(everyMs) || everyMs <= 0) && typeof params.untilIso !== 'string') {
          add('warn', 'wait-default', '未设置等待方式，将默认等待 1 秒', { nodeId: node.id })
        }
        if (Number.isFinite(ms) && ms > 3600000) add('error', 'wait-too-long', '单次等待最多 1 小时', { nodeId: node.id })
        break
      }
      case 'human.checkpoint': {
        if (typeof params.question !== 'string' || params.question.trim() === '') {
          add('error', 'no-question', 'human.checkpoint 需要 question', { nodeId: node.id })
        }
        break
      }
      case 'io.output': {
        if (typeof params.template !== 'string' || params.template.trim() === '') {
          add('warn', 'no-template', '输出内容为空', { nodeId: node.id })
        }
        break
      }
      case 'phase': {
        const children = workflow.nodes.filter((item) => item.phaseId === node.id)
        if (children.length === 0) add('warn', 'PHASE_EMPTY', '这个 Phase 下还没有子工作', { nodeId: node.id })
        break
      }
      case 'group.steps': {
        const children = workflow.nodes.filter((item) => item.parentId === node.id)
        if (children.length === 0) {
          add('warn', 'no-steps', '父级流程没有子步骤：加几个子步骤（a/b/c）后再运行', { nodeId: node.id })
        }
        break
      }
      case 'subflow.call': {
        const workflowId = typeof params.workflowId === 'string' ? params.workflowId : ''
        if (workflowId === '') add('error', 'no-subflow', 'subflow.call 需要 workflowId', { nodeId: node.id })
        else if (knownWorkflows && !knownWorkflows.has(workflowId)) add('error', 'unknown-subflow', `找不到流程 ${workflowId}`, { nodeId: node.id })
        else if (knownWorkflows && workflowId === workflow.id) add('error', 'self-subflow', '不能调用自己', { nodeId: node.id })
        break
      }
      default:
        break
    }
  }

  const titleIds = new Map()
  for (const node of workflow.nodes) if (!titleIds.has(node.title)) titleIds.set(node.title, node.id)
  for (const node of workflow.nodes) {
    for (const ref of Array.isArray(node.reliesOn) ? node.reliesOn : []) {
      if (ids.has(ref) || titleIds.has(ref)) continue
      add('warn', 'PHASE_REF_MISSING', `依赖的「${ref}」在图里找不到对应节点`, { nodeId: node.id })
    }
  }

  const cycle = findCycle(workflow)
  if (cycle) {
    add('warn', 'cycle', `图里存在环：${cycle.join(' → ')}（只有 flow.loop 的循环是被支持的）`)
  }
  // ── 布局门禁──
  // 客户端的 fittedFontSize 只负责"收缩到可读下限"；这里负责拒绝**收缩也救不了**的输入。
  // 缺了这一半，超长标题会静默溢出/被截，而校验仍报干净——本项目此前正是这个状态。
  const drawable = workflow.nodes.filter((node) => node.kind !== 'phase' || node.title !== '')
  for (const node of drawable) {
    const need = minimumNodeTextWidth(node.title, MIN_TITLE_FONT)
    if (need > TITLE_AVAILABLE_WIDTH) {
      add('error', 'layout-gate', `标题过长：${node.title.slice(0, 20)}… 收缩到 ${MIN_TITLE_FONT}px 仍需 ${Math.round(need)}px，可用仅 ${TITLE_AVAILABLE_WIDTH}px——请改短标题或拆分节点`, { nodeId: node.id, need: Math.round(need), available: TITLE_AVAILABLE_WIDTH })
    }
  }

  // 重叠检测：按 x 排序后只在可能相交的窗口内两两比较（避免 O(N²) 全比）
  const sorted = [...workflow.nodes].sort((a, b) => a.pos.x - b.pos.x)
  for (let i = 0; i < sorted.length; i += 1) {
    const a = sorted[i]
    for (let j = i + 1; j < sorted.length; j += 1) {
      const b = sorted[j]
      if (b.pos.x >= a.pos.x + NODE_WIDTH) break
      if (b.pos.y < a.pos.y + NODE_HEIGHT && b.pos.y + NODE_HEIGHT > a.pos.y) {
        add('error', 'node-overlap', `节点重叠：「${a.title}」与「${b.title}」`, { nodeId: a.id, otherId: b.id })
      }
    }
  }

  // 越界：负坐标会让节点渲染到内容区外，用户看不到但图里有
  for (const node of workflow.nodes) {
    if (node.pos.x < 0 || node.pos.y < 0) {
      add('warning', 'node-out-of-bounds', `节点坐标为负：「${node.title}」在 (${Math.round(node.pos.x)}, ${Math.round(node.pos.y)})`, { nodeId: node.id })
    }
  }

  // 孤立节点：既不出发也不到达，说明它不会被执行
  for (const node of workflow.nodes) {
    if (node.kind === 'phase') continue
    const touched = workflow.edges.some((edge) => edge.from === node.id || edge.to === node.id)
    if (!touched && workflow.nodes.length > 1) {
      add('warning', 'node-isolated', `节点未接入流程：「${node.title}」没有任何连线`, { nodeId: node.id })
    }
  }

  return issues
}
