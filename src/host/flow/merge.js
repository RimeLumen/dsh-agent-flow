/*! dsh-agent-flow v0.1.0 | Copyright (c) 2026 RimeLumen | MIT License */
// 手动合并流程（V0.1 泳道版，用户指令①）：按「合并前的多个会话（源画布）」分配泳道，
// 每个源画布占据一个水平条带（band），条带内保留源画布的相对布局——天然避免节点叠加。
// 条带之间按选择顺序串行衔接（上一条带出口 → 下一条带入口），逻辑关系后续可扩展并行。
// lanes 元数据驱动客户端背景带渲染（laneBandsView），needsLayout 触发客户端自动布局兜底。
import { normalizeWorkflow } from './model.js'

const MAX_MERGE_SOURCES = 12
const BAND_GAP = 200 // 条带间距（垂直方向，容纳衔接边与背景带 padding）
const BAND_X = 80

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
  const lanes = []
  const warnings = []
  let previousExit = null // 上一条带的出口节点（串行衔接点）
  let bandTop = 80
  let bandBottom = bandTop

  list.slice(0, MAX_MERGE_SOURCES).forEach((source, order) => {
    const label = (typeof source.name === 'string' && source.name.trim() !== '' ? source.name.trim() : `流程 ${order + 1}`).slice(0, 60)
    const real = source.nodes.filter((n) => n && typeof n === 'object')
    if (real.length === 0) {
      warnings.push({ code: 'MERGE_EMPTY_SOURCE', message: `「${label}」没有可合并的节点` })
      return
    }
    const minX = Math.min(...real.map((n) => Number(n.pos?.x) || 0))
    const minY = Math.min(...real.map((n) => Number(n.pos?.y) || 0))
    const maxY = Math.max(...real.map((n) => (Number(n.pos?.y) || 0) + (Number(n.pos?.h) || 96)))
    bandTop = lanes.length === 0 ? 80 : bandBottom + BAND_GAP
    const bandBottomNew = bandTop + (maxY - minY)
    const idMap = new Map()
    const laneNodeIds = []
    // 克隆源画布全部节点（保留内部拓扑与 pinned），坐标平移进本条带
    for (const raw of source.nodes) {
      if (!raw || typeof raw !== 'object' || raw.kind === 'phase') continue
      const nextId = makeId()
      idMap.set(raw.id, nextId)
      const clone = { ...JSON.parse(JSON.stringify(raw)), id: nextId, phaseId: undefined }
      clone.pos = {
        x: (Number(raw.pos?.x) || 0) - minX + BAND_X,
        y: (Number(raw.pos?.y) || 0) - minY + bandTop,
      }
      nodes.push(clone)
      laneNodeIds.push(nextId)
    }
    // 源画布内部连线：两端都被克隆的才保留
    for (const rawEdge of Array.isArray(source.edges) ? source.edges : []) {
      if (!rawEdge || typeof rawEdge !== 'object') continue
      const from = idMap.get(rawEdge.from)
      const to = idMap.get(rawEdge.to)
      if (!from || !to) continue
      addEdge(from, to, { fromSide: rawEdge.fromSide, toSide: rawEdge.toSide })
    }
    lanes.push({ id: `src${order}`, label, nodeIds: laneNodeIds })
    // 串行衔接：上一条带出口 → 本条带入口（源画布 entry 的克隆）
    const entryId = idMap.get(source.entry) ?? laneNodeIds[0]
    if (previousExit && entryId) addEdge(previousExit, entryId)
    // 出口启发式：源画布中「没有出边」的克隆节点（末端/汇点）取最右者；退化取最后一个
    const froms = new Set((source.edges ?? []).map((e) => e.from))
    const exitCandidates = laneNodeIds.filter((clonedId) => {
      const rawId = [...idMap.entries()].find(([, v]) => v === clonedId)?.[0]
      return rawId ? !froms.has(rawId) : true
    })
    let exitNode = null
    let exitX = -Infinity
    for (const clonedId of exitCandidates) {
      const cloned = nodes.find((n) => n.id === clonedId)
      if (cloned && cloned.pos.x > exitX) { exitX = cloned.pos.x; exitNode = clonedId }
    }
    previousExit = exitNode ?? laneNodeIds[laneNodeIds.length - 1]
    bandBottom = Math.max(bandBottomNew, bandTop + 96)
  })

  const workflow = normalizeWorkflow({
    id: context.workflowId,
    sessionId: context.sessionId,
    name: typeof context.name === 'string' && context.name.trim() !== '' ? context.name.trim().slice(0, 80) : `合并流程 ${new Date().toLocaleString('zh-CN')}`,
    description: `由 ${lanes.length} 个会话泳道合并：${lanes.map((l) => l.label).join(' → ')}`.slice(0, 1000),
    origin: 'merge',
    entry: nodes[0]?.id ?? '',
    nodes,
    edges,
    mainPath: undefined,
    vars: {},
    lanes,
    // 注意：不置 needsLayout——条带坐标即最终布局（泳道分带是本合并的核心产出），
    // 若交由客户端 autoLayout 按 chain 重排会完全打乱条带分区。
    // 源画布内部布局原样保留；如个别重叠，用户手动微调（pinned 已受尊重）。
  })
  return { workflow, warnings }
}
