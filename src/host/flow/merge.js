/*! dsh-agent-flow v0.1.0 | Copyright (c) 2026 RimeLumen | MIT License */
// 手动合并流程：把多个画布按选择顺序串成一张（每个源画布 = 一个 phase 容器）。
// 形状与 phasesToWorkflow 一致（phase 主干 + 子节点挂靠），布局/渲染零改动兼容。
import { normalizeWorkflow } from './model.js'

const MAX_MERGE_SOURCES = 12

export function mergeWorkflows(sources, context = {}) {
  const list = (Array.isArray(sources) ? sources : []).filter((item) => item && typeof item === 'object' && Array.isArray(item.nodes))
  if (list.length < 2) {
    return { workflow: null, error: 'merge 需要至少两个流程' }
  }
  const makeId = () => `n_${Math.random().toString(36).slice(2, 8)}`
  const nodes = []
  const edges = []
  const edgeKeys = new Set()
  const addEdge = (from, to, extra = {}) => {
    const key = `${from}>${to}:${extra.fromSide ?? ''}>${extra.toSide ?? ''}`
    if (edgeKeys.has(key)) return
    edgeKeys.add(key)
    edges.push({
      id: `e_${from}_${to}`,
      from,
      fromPort: 'out',
      to,
      fromSide: extra.fromSide ?? 'right',
      toSide: extra.toSide ?? 'left',
    })
  }
  const phases = []
  const mainIds = []
  let previous = null
  const pushSpine = (node) => {
    nodes.push(node)
    mainIds.push(node.id)
    if (previous) addEdge(previous, node.id)
    previous = node.id
  }
  const warnings = []
  list.slice(0, MAX_MERGE_SOURCES).forEach((source, order) => {
    const phaseId = makeId()
    const title = (typeof source.name === 'string' && source.name.trim() !== '' ? source.name.trim() : `流程 ${order + 1}`).slice(0, 120)
    phases.push({ id: phaseId, title, order })
    pushSpine({
      id: phaseId,
      kind: 'phase',
      phaseId: undefined,
      reliesOn: undefined,
      title,
      pos: { x: 80, y: 80 + order * 240 },
      params: { order },
      onError: 'fail',
    })
    // 克隆源画布非容器节点，挂到新 phase 下；容器节点跳过（防止嵌套容器）。
    const idMap = new Map()
    const cloned = []
    for (const raw of source.nodes) {
      if (!raw || typeof raw !== 'object' || raw.kind === 'phase') continue
      const nextId = makeId()
      idMap.set(raw.id, nextId)
      cloned.push({
        ...JSON.parse(JSON.stringify(raw)),
        id: nextId,
        phaseId,
        pos: { x: 380, y: 80 + order * 240 + cloned.length * 92 },
      })
    }
    for (const node of cloned) {
      nodes.push(node)
      if (previous) {
        addEdge(previous, node.id)
      }
      previous = node.id
      mainIds.push(node.id)
    }
    // 源画布内部连线：两端都被克隆的才保留（与主干顺序边按键去重）。
    for (const rawEdge of Array.isArray(source.edges) ? source.edges : []) {
      if (!rawEdge || typeof rawEdge !== 'object') continue
      const from = idMap.get(rawEdge.from)
      const to = idMap.get(rawEdge.to)
      if (!from || !to) continue
      addEdge(from, to, { fromSide: rawEdge.fromSide, toSide: rawEdge.toSide })
    }
    // 合并来源记录进描述，方便事后追溯。
    if (cloned.length === 0) warnings.push({ code: 'MERGE_EMPTY_SOURCE', message: `「${title}」没有可合并的节点` })
  })
  const workflow = normalizeWorkflow({
    id: context.workflowId,
    sessionId: context.sessionId,
    name: typeof context.name === 'string' && context.name.trim() !== '' ? context.name.trim().slice(0, 80) : `合并流程 ${new Date().toLocaleString('zh-CN')}`,
    description: `由 ${list.length} 个流程合并：${list.map((item) => item.name ?? '').join(' → ')}`.slice(0, 1000),
    origin: 'merge',
    // 多个源画布的 pos 空间互相重叠，标记客户端重新布局。
    needsLayout: true,
    phases,
    entry: nodes[0]?.id ?? '',
    nodes,
    edges,
    mainPath: mainIds.length > 1 ? mainIds : undefined,
    vars: {},
  })
  return { workflow, warnings }
}
