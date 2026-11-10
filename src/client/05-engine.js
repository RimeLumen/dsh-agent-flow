/* @client-shard: 05-engine */
    const POLL_MAX = 30000
    const pollDelay = (base, failures) => {
      if (typeof document !== 'undefined' && document.hidden) return POLL_MAX
      return Math.min(POLL_MAX, base * (2 ** Math.min(failures, 4)))
    }
    const samePlan = (a, b) => a?.status === b?.status
      && a?.turn === b?.turn
      && a?.workflowId === b?.workflowId
      && a?.updatedAt === b?.updatedAt
      && (a?.steps ?? []).length === (b?.steps ?? []).length
      && (a?.warnings ?? []).length === (b?.warnings ?? []).length

    const PARENT_LABELS = {
      superpowers: { zh: 'Superpower', en: 'Superpower' },
      'dsh-windows-acl': { zh: 'DSH 平台', en: 'DSH platform' },
      'dsh-bundled': { zh: 'DSH 内置', en: 'DSH bundled' },
      other: { zh: '未归类', en: 'Uncategorized' },
    }
    const CATEGORY_LABELS = {
      files: { zh: '文件与编辑', en: 'Files & editing' },
      process: { zh: '终端与进程', en: 'Terminal & processes' },
      agents: { zh: '子代理与团队', en: 'Agents & teams' },
      goals: { zh: '目标与计划', en: 'Goals & plans' },
      interaction: { zh: '交互与展示', en: 'Interaction & display' },
      web: { zh: '网络检索', en: 'Web' },
      flow: { zh: '流程与技能', en: 'Flow & skills' },
      knowledge: { zh: '知识与配置', en: 'Knowledge & config' },
      plugin: { zh: '插件运行时', en: 'Plugin runtime' },
      sessions: { zh: '会话', en: 'Sessions' },
      schedule: { zh: '定时任务', en: 'Scheduled tasks' },
      other: { zh: '其他', en: 'Other' },
    }
    const groupLabelOf = (kind, key, locale) => {
      const table = kind === 'skill' ? PARENT_LABELS : CATEGORY_LABELS
      const entry = table[key]
      if (!entry) return key
      return locale === 'en' ? entry.en : entry.zh
    }

    const KIND_LABELS = {
      'inject.context': { zh: '加载上下文', en: 'Inject context' },
      'inject.skill': { zh: '预载技能', en: 'Load skills' },
      'agent.task': { zh: 'Agent 任务', en: 'Agent task' },
      'tool.call': { zh: '调用工具', en: 'Call tool' },
      'branch.condition': { zh: '条件分支', en: 'Branch' },
      'flow.parallel': { zh: '并行', en: 'Parallel' },
      'flow.join': { zh: '汇合', en: 'Join' },
      'flow.loop': { zh: '循环', en: 'Loop' },
      'flow.wait': { zh: '等待', en: 'Wait' },
      'human.checkpoint': { zh: '人工确认', en: 'Checkpoint' },
      'io.output': { zh: '输出', en: 'Output' },
      'subflow.call': { zh: '子流程', en: 'Subflow' },
      'group.steps': { zh: '父级流程', en: 'Parent flow' },
    }

    function usePlan(sessionId) {
      const [plan, setPlan] = useState({ status: 'idle' })
      useEffect(() => {
        if (!sessionId) {
          setPlan({ status: 'idle' })
          return undefined
        }
        let closed = false
        let timer = null
        let failures = 0
        const tick = async () => {
          let base = 4000
          if (typeof document !== 'undefined' && document.hidden) {
            if (!closed) timer = setTimeout(tick, POLL_MAX)
            return
          }
          try {
            const result = await request('GET', `/plan?sessionId=${encodeURIComponent(sessionId)}`)
            const next = result?.plan ?? { status: 'idle' }
            base = next.status === 'awaiting' ? 1500 : 4000
            failures = 0
            if (!closed) setPlan((prev) => (samePlan(prev, next) ? prev : next))
          } catch {
            failures += 1
          }
          if (!closed) timer = setTimeout(tick, pollDelay(base, failures))
        }
        void tick()
        return () => {
          closed = true
          if (timer) clearTimeout(timer)
        }
      }, [sessionId])
      return plan
    }

    async function resolvePlan(action, sessionId, workflow) {
      if (action === 'confirm') return request('POST', '/plan/confirm', { sessionId, workflow })
      return request('POST', '/plan/skip', { sessionId, reason: '用户在画布上选择跳过' })
    }

    const NODE_KINDS = Object.keys(KIND_LABELS)
    const NODE_WIDTH = 220
    const NODE_HEIGHT = 96

    function kindLabel(kind, ctx) {
      const entry = KIND_LABELS[kind]
      if (!entry) return kind
      return langOf(ctx) === 'en' ? entry.en : entry.zh
    }

    function nodeSummary(node, ctx) {
      const t = dictFor(ctx)
      const params = node.params ?? {}
      switch (node.kind) {
        case 'inject.context':
          return `profile=${params.profileId ?? t.effective} · skills=${params.includeSkills !== false} · tools=${params.includeTools !== false}`
        case 'inject.skill':
          return `skills=${(params.names ?? []).join(', ') || '—'} · body=${params.body !== false}`
        case 'agent.task':
          return `${params.target === 'session' ? t.targetSession : t.targetSubagent} · ${String(params.prompt ?? '').slice(0, 90)}`
        case 'tool.call':
          return `${params.name ?? '—'}${params.allowDangerous === true ? ` · ⚠${t.dangerousAllowed}` : ''}`
        case 'branch.condition':
          return (params.cases ?? []).map((item) => `${item.port}: ${item.when}`).join(' | ') || '—'
        case 'flow.loop':
          return `max=${params.maxIterations ?? 5}${params.untilExpr ? ` · until ${params.untilExpr}` : ''}`
        case 'flow.wait':
          return params.untilIso ? `until ${params.untilIso}` : `${params.ms ?? 1000}ms`
        case 'human.checkpoint':
          return `${String(params.question ?? '').slice(0, 90)} · ${(params.options ?? []).join('/') || '继续/停止'}`
        case 'io.output':
          return String(params.template ?? '').slice(0, 110)
        case 'subflow.call':
          return `flow=${params.workflowId ?? '—'}`
        default:
          return ''
      }
    }

    const EDGE_SIDES = [
      'top', 'top-right', 'right', 'bottom-right', 'bottom', 'bottom-left', 'left', 'top-left',
      'top-q1', 'top-q3', 'right-q1', 'right-q3', 'bottom-q1', 'bottom-q3', 'left-q1', 'left-q3',
    ]
    const FACE_OF = (side) => {
      const s = String(side || '')
      if (s.startsWith('right')) return 'right'
      if (s.startsWith('left')) return 'left'
      if (s.startsWith('top')) return 'top'
      return 'bottom'
    }

    const EDGE_PALETTE_SIZE = 12

  const keyOf = (p) => `${Math.round(p.x)}:${Math.round(p.y)}`

  function segmentHitsRect(a, b, rect, gap) {
    const x1 = rect.x - gap, y1 = rect.y - gap, x2 = rect.x + rect.w + gap, y2 = rect.y + rect.h + gap
    const inBox = (p) => p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2
    if (inBox(a) || inBox(b)) return true
    const ccw = (p1, p2, p3) => (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x)
    const corners = [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]
    for (let i = 0; i < 4; i += 1) {
      const c1 = { x: corners[i][0], y: corners[i][1] }
      const c2 = { x: corners[(i + 1) % 4][0], y: corners[(i + 1) % 4][1] }
      const d1 = ccw(a, b, c1), d2 = ccw(a, b, c2), d3 = ccw(c1, c2, a), d4 = ccw(c1, c2, b)
      if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true
    }
    return false
  }

  function segmentClear(a, b, rects, gap) {
    for (const rect of rects) if (segmentHitsRect(a, b, rect, gap)) return false
    return true
  }

  function moveOutward(point, side, distance) {
    if (side === 'right') return { x: point.x + distance, y: point.y }
    if (side === 'left') return { x: point.x - distance, y: point.y }
    if (side === 'top') return { x: point.x, y: point.y - distance }
    return { x: point.x, y: point.y + distance }
  }

  /**
   * 均匀空间网格：
   * 按格子索引矩形，查询只返回可能与框相交的候选。该实现的格子边长 160。
   * insert/query 都用矩形包围盒；all() 返回全部条目，供需要全量时的兜底。
   */
  function createSpatialGrid(cellSize) {
    const buckets = new Map()
    const items = []
    const keyOf = (x, y) => x + ':' + y
    // 同时接受 {x,y,w,h} 与 {minX,maxX,minY,maxY} 两种矩形写法——
    // 调用点传的是节点矩形（x/y/w/h），读错字段会让索引为空、查询恒空（路由静默失效）。
    const toBounds = (value) => (Number.isFinite(value?.w) && Number.isFinite(value?.h))
      ? { minX: value.x, maxX: value.x + value.w, minY: value.y, maxY: value.y + value.h }
      : value
    const rangeOf = (value) => {
      const box = toBounds(value)
      return {
        x0: Math.floor(box.minX / cellSize), x1: Math.floor(box.maxX / cellSize),
        y0: Math.floor(box.minY / cellSize), y1: Math.floor(box.maxY / cellSize),
      }
    }
    return {
      insert(box, item) {
        items.push(item)
        const range = rangeOf(box)
        for (let x = range.x0; x <= range.x1; x += 1) {
          for (let y = range.y0; y <= range.y1; y += 1) {
            const key = keyOf(x, y)
            let bucket = buckets.get(key)
            if (!bucket) { bucket = []; buckets.set(key, bucket) }
            bucket.push(item)
          }
        }
      },
      query(box) {
        const range = rangeOf(box)
        const seen = new Set()
        const found = []
        for (let x = range.x0; x <= range.x1; x += 1) {
          for (let y = range.y0; y <= range.y1; y += 1) {
            const bucket = buckets.get(keyOf(x, y))
            if (!bucket) continue
            for (const item of bucket) {
              if (seen.has(item)) continue
              seen.add(item)
              found.push(item)
            }
          }
        }
        return found
      },
      all: () => items,
    }
  }

  function orthogonalRoute(fromRect, toRect, fromSide, toSide, obstacles, options) {
    const clearance = options.clearance ?? 10
    const bendPenalty = options.bendPenalty ?? 40
    const stub = (options.stub ?? clearance) + 2
    const obs = obstacles ?? []
    const start = { x: fromRect.x + fromRect.w / 2, y: fromRect.y + fromRect.h / 2 }
    const end = { x: toRect.x + toRect.w / 2, y: toRect.y + toRect.h / 2 }
    const startBase = {
      x: fromSide === 'right' ? fromRect.x + fromRect.w : fromSide === 'left' ? fromRect.x : start.x,
      y: fromSide === 'bottom' ? fromRect.y + fromRect.h : fromSide === 'top' ? fromRect.y : start.y,
    }
    const endBase = {
      x: toSide === 'right' ? toRect.x + toRect.w : toSide === 'left' ? toRect.x : end.x,
      y: toSide === 'bottom' ? toRect.y + toRect.h : toSide === 'top' ? toRect.y : end.y,
    }
    const startStub = moveOutward(startBase, fromSide, stub)
    const endStub = moveOutward(endBase, toSide, stub)
    const expanded = obs
      .filter((r) => r && Number.isFinite(r.x) && Number.isFinite(r.w))
      .map((r) => ({ x: r.x - clearance, y: r.y - clearance, w: r.w + clearance * 2, h: r.h + clearance * 2 }))
    const xs = new Set([startStub.x, endStub.x])
    const ys = new Set([startStub.y, endStub.y])
    for (const r of expanded) {
      xs.add(r.x - 1); xs.add(r.x + r.w + 1)
      ys.add(r.y - 1); ys.add(r.y + r.h + 1)
    }
    const MIN_SEG = 8
    const coalesce = (values, keep) => {
      const sorted = [...values].sort((a, b) => a - b)
      return sorted.reduce((kept, value) => {
        if (keep.has(value) || !kept.length || value - kept[kept.length - 1] >= MIN_SEG) kept.push(value)
        return kept
      }, [])
    }
    const orderedX = coalesce(xs, new Set([startStub.x, endStub.x]))
    const orderedY = coalesce(ys, new Set([startStub.y, endStub.y]))
    const budget = 1200
    if (orderedX.length * orderedY.length > budget) return null
    const blocked = (p) => expanded.some((r) => p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h)
    const nodes = new Map()
    for (const x of orderedX) {
      for (const y of orderedY) {
        const point = { x, y }
        if (!blocked(point)) nodes.set(keyOf(point), point)
      }
    }
    if (!nodes.has(keyOf(startStub)) || !nodes.has(keyOf(endStub))) return null
    const adjacency = new Map([...nodes.keys()].map((k) => [k, []]))
    const connectLine = (line, axis) => {
      for (let i = 0; i < line.length - 1; i += 1) {
        const left = line[i], right = line[i + 1]
        if (!segmentClear(left, right, expanded, 0)) continue
        const distance = Math.abs(right.x - left.x) + Math.abs(right.y - left.y)
        const axisChar = axis === 'h' ? 'R' : 'D'
        adjacency.get(keyOf(left)).push([keyOf(right), distance, axisChar])
        adjacency.get(keyOf(right)).push([keyOf(left), distance, axisChar === 'R' ? 'L' : 'U'])
      }
    }
    for (const y of orderedY) connectLine(orderedX.map((x) => nodes.get(keyOf({ x, y }))).filter(Boolean), 'h')
    for (const x of orderedX) connectLine(orderedY.map((y) => nodes.get(keyOf({ x, y }))).filter(Boolean), 'v')
    const opposite = { R: 'L', L: 'R', D: 'U', U: 'D' }
    const OUTWARD = { right: 'R', left: 'L', top: 'U', bottom: 'D' }
    const stateKey = (key, dir) => `${key}|${dir}`
    const sourceDir = OUTWARD[fromSide]
    const targetDir = opposite[OUTWARD[toSide]]
    const source = keyOf(startStub)
    const target = keyOf(endStub)
    const distances = new Map([[stateKey(source, sourceDir), 0]])
    const previous = new Map()
    const heap = [[0, stateKey(source, sourceDir)]]
    let visited = 0
    while (heap.length) {
      heap.sort((a, b) => a[0] - b[0])
      const [distance, current] = heap.shift()
      if (distance !== distances.get(current)) continue
      visited += 1
      if (visited > budget) return null
      const parts = current.split('|')
      for (const [nextKey, weight, dir] of adjacency.get(parts[0]) ?? []) {
        const turnCost = dir === parts[1] ? 0 : bendPenalty
        const nextDistance = distance + weight + turnCost
        const nextState = stateKey(nextKey, dir)
        if (nextDistance < (distances.get(nextState) ?? Infinity)) {
          distances.set(nextState, nextDistance)
          previous.set(nextState, current)
          heap.push([nextDistance, nextState])
        }
      }
    }
    let bestState = null
    let bestDistance = Infinity
    for (const dir of [targetDir, ...Object.keys(opposite)]) {
      const state = stateKey(target, dir)
      const distance = distances.get(state)
      if (distance !== undefined && distance < bestDistance) { bestDistance = distance; bestState = state }
    }
    if (bestState === null) return null
    const points = []
    let cursor = bestState
    while (cursor) {
      points.unshift(nodes.get(cursor.split('|')[0]))
      cursor = previous.get(cursor)
      if (points.length > 64) return null
    }
    points.push({ x: end.x, y: end.y })
    return points.every(Boolean) && points.length >= 2 ? points : null
  }

  function polylineToPath(points) {
    return points.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ')
  }


    // 文本适配：
    // 按可用宽度收缩字号，而不是直接省略号截断——普通超长文本"变小"而不是溢出/被切。
    // 口径与 一致：全角字符 2 个单位、其余 1 个单位（emoji 2），
    // 每单位每字号占 0.6px 宽，左右内边距合计 8px。
    const TEXT_FIT = { widthFactor: 0.6, horizontalPadding: 8 }
    const FULLWIDTH_RE = /[\u1100-\u115F\u2E80-\u303E\u3041-\u33FF\u3400-\u4DBF\u4E00-\u9FFF\uA000-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE6F\uFF00-\uFF60\uFFE0-\uFFE6]/
    function textUnits(text) {
      let units = 0
      for (const ch of String(text ?? '')) {
        const cp = ch.codePointAt(0)
        if (cp >= 0xfe00 && cp <= 0xfe0f) continue
        units += FULLWIDTH_RE.test(ch) ? 2 : 1
      }
      return units
    }
    function fittedFontSize(text, width, preferred, minimum) {
      const units = Math.max(1, textUnits(text))
      const available = Math.max(1, width - TEXT_FIT.horizontalPadding)
      const fitted = Math.min(preferred, available / (units * TEXT_FIT.widthFactor))
      return Math.max(minimum, Math.floor(fitted * 10) / 10)
    }

    function nodeHeight() {
      return NODE_HEIGHT
    }

    function rectOf(node, childCount = 0) {
      return { x: node.pos.x, y: node.pos.y, w: NODE_WIDTH, h: nodeHeight(node, childCount) }
    }

    function anchorPoint(rect, side) {
      const midX = rect.x + rect.w / 2
      const midY = rect.y + rect.h / 2
      const qx1 = rect.x + rect.w * 0.25
      const qx3 = rect.x + rect.w * 0.75
      const qy1 = rect.y + rect.h * 0.25
      const qy3 = rect.y + rect.h * 0.75
      const right = rect.x + rect.w
      const bottom = rect.y + rect.h
      switch (side) {
        case 'top':
          return { x: midX, y: rect.y, dir: 'up' }
        case 'top-q1':
          return { x: qx1, y: rect.y, dir: 'up' }
        case 'top-q3':
          return { x: qx3, y: rect.y, dir: 'up' }
        case 'top-right':
          return { x: right, y: rect.y, dir: 'right' }
        case 'right':
          return { x: right, y: midY, dir: 'right' }
        case 'right-q1':
          return { x: right, y: qy1, dir: 'right' }
        case 'right-q3':
          return { x: right, y: qy3, dir: 'right' }
        case 'bottom-right':
          return { x: right, y: bottom, dir: 'right' }
        case 'bottom':
          return { x: midX, y: bottom, dir: 'down' }
        case 'bottom-q1':
          return { x: qx1, y: bottom, dir: 'down' }
        case 'bottom-q3':
          return { x: qx3, y: bottom, dir: 'down' }
        case 'bottom-left':
          return { x: rect.x, y: bottom, dir: 'left' }
        case 'left':
          return { x: rect.x, y: midY, dir: 'left' }
        case 'left-q1':
          return { x: rect.x, y: qy1, dir: 'left' }
        case 'left-q3':
          return { x: rect.x, y: qy3, dir: 'left' }
        case 'top-left':
        default:
          return { x: rect.x, y: rect.y, dir: 'left' }
      }
    }

    function anchorStyle(side) {
      const positions = {
        top: { left: '50%', top: -10, transform: 'translateX(-50%)' },
        'top-q1': { left: '25%', top: -10, transform: 'translateX(-50%)' },
        'top-q3': { left: '75%', top: -10, transform: 'translateX(-50%)' },
        'top-right': { right: -10, top: -10 },
        right: { right: -10, top: '50%', transform: 'translateY(-50%)' },
        'right-q1': { right: -10, top: '25%', transform: 'translateY(-50%)' },
        'right-q3': { right: -10, top: '75%', transform: 'translateY(-50%)' },
        'bottom-right': { right: -10, bottom: -10 },
        bottom: { left: '50%', bottom: -10, transform: 'translateX(-50%)' },
        'bottom-q1': { left: '25%', bottom: -10, transform: 'translateX(-50%)' },
        'bottom-q3': { left: '75%', bottom: -10, transform: 'translateX(-50%)' },
        'bottom-left': { left: -10, bottom: -10 },
        left: { left: -10, top: '50%', transform: 'translateY(-50%)' },
        'left-q1': { left: -10, top: '25%', transform: 'translateY(-50%)' },
        'left-q3': { left: -10, top: '75%', transform: 'translateY(-50%)' },
        'top-left': { left: -10, top: -10 },
      }
      return positions[side] ?? positions.left
    }

    // ── 锚点吸附（核心逻辑变更）──
    // 连接线必须绑定在锚点上：吸附候选只有 16 个锚点，节点矩形本身不参与判定。
    // 半径按屏幕像素给出，换算到画布坐标时除以 zoom，保证手感不随缩放变化。
    const ANCHOR_SNAP_PX = 16

    // 导出底色：导出物是脱离界面的独立产物，需要固定的实心底色
    // （透明 PNG 在不同查看器里表现不一致；导出图也不应跟随界面主题变暗）。
    // 这是唯一允许出现硬编码白色的地方，界面本身一律走主题变量。
    const EXPORT_BACKGROUND = '#ffffff'

    /** 找离 point 最近的锚点；**超出半径返回 null**——矩形不在候选内。 */
    function nearestAnchor(rect, point, radius) {
      let bestSide = null
      let bestDistance = Infinity
      for (const side of EDGE_SIDES) {
        const anchor = anchorPoint(rect, side)
        const distance = Math.hypot(anchor.x - point.x, anchor.y - point.y)
        if (distance < bestDistance) {
          bestDistance = distance
          bestSide = side
        }
      }
      if (bestSide === null || bestDistance > radius) return null
      return { side: bestSide, distance: bestDistance }
    }

    function edgePath(fromRect, toRect, edge, obstaclesOrGrid = [], startOffset = 0, endOffset = 0) {
      const fromSide = edge?.fromSide && EDGE_SIDES.includes(edge.fromSide) ? edge.fromSide : 'right'
      const toSide = edge?.toSide && EDGE_SIDES.includes(edge.toSide) ? edge.toSide : 'left'
      const offset = (pt, side, amount) => {
        if (!amount) return pt
        const face = FACE_OF(side)
        if (face === 'left' || face === 'right') return { ...pt, y: pt.y + amount }
        return { ...pt, x: pt.x + amount }
      }
      const a = offset(anchorPoint(fromRect, fromSide), fromSide, startOffset)
      const b = offset(anchorPoint(toRect, toSide), toSide, endOffset)
      const custom = edge?.customPath
      if (custom && Number.isFinite(Number(custom.c1?.x)) && Number.isFinite(Number(custom.c2?.x))) {
        return `M ${a.x} ${a.y} C ${custom.c1.x} ${custom.c1.y}, ${custom.c2.x} ${custom.c2.y}, ${b.x} ${b.y}`
      }
      const grid = obstaclesOrGrid && typeof obstaclesOrGrid.query === 'function' ? obstaclesOrGrid : null
      const obstacles = Array.isArray(obstaclesOrGrid) ? obstaclesOrGrid : []
      if (grid) {
        // 快路径 + 精确前筛：直线是否被挡，只需查线段包围盒覆盖的格子。
        // 线段与矩形相交 ⇒ 两者包围盒必然相交，所以"查无命中"必然安全——
        // 无阻挡时直接返回直线，完全不启动 Dijkstra（绝大多数边走这条路）。
        const box = {
          minX: Math.min(a.x, b.x), maxX: Math.max(a.x, b.x),
          minY: Math.min(a.y, b.y), maxY: Math.max(a.y, b.y),
        }
        const blocked = grid.query(box).some((item) => item.id !== edge.from && item.id !== edge.to
          && segmentHitsRect(a, b, item.rect, 0))
        if (!blocked) return `M ${a.x} ${a.y} L ${b.x} ${b.y}`
        // 被挡住才做网格路由；此时用全量障碍，保证绕行不会漏掉远处节点。
        const full = grid.all()
          .filter((item) => item.id !== edge.from && item.id !== edge.to)
          .map((item) => item.rect)
        const route = orthogonalRoute(fromRect, toRect, fromSide, toSide, full, { clearance: 10 })
        if (route) {
          // 路由质检（吸收 route-quality）：折线超过直线 2.5 倍视为过度绕行，回退直线。
          const straight = Math.hypot(b.x - a.x, b.y - a.y) || 1
          let polyline = 0
          for (let i = 1; i < route.length; i += 1) polyline += Math.hypot(route[i].x - route[i - 1].x, route[i].y - route[i - 1].y)
          if (polyline / straight <= 2.5) return polylineToPath(route)
        }
        return `M ${a.x} ${a.y} L ${b.x} ${b.y}`
      }
      if (obstacles.length > 0) {
        const route = orthogonalRoute(fromRect, toRect, fromSide, toSide, obstacles, { clearance: 10 })
        if (route) return polylineToPath(route)
      }
      return `M ${a.x} ${a.y} L ${b.x} ${b.y}`
    }

    function edgeMidpoint(fromRect, toRect, edge) {
      const fromSide = edge?.fromSide && EDGE_SIDES.includes(edge.fromSide) ? edge.fromSide : 'right'
      const toSide = edge?.toSide && EDGE_SIDES.includes(edge.toSide) ? edge.toSide : 'left'
      const a = anchorPoint(fromRect, fromSide)
      const b = anchorPoint(toRect, toSide)
      const custom = edge?.customPath
      if (custom && Number.isFinite(Number(custom.c1?.x)) && Number.isFinite(Number(custom.c2?.x))) {
        return {
          x: 0.125 * a.x + 0.375 * custom.c1.x + 0.375 * custom.c2.x + 0.125 * b.x,
          y: 0.125 * a.y + 0.375 * custom.c1.y + 0.375 * custom.c2.y + 0.125 * b.y,
        }
      }
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    }

    function edgeColorStyle(edge) {
      if (!Number.isFinite(Number(edge?.color))) return undefined
      return { stroke: `var(--daf-edge-${Number(edge.color) % EDGE_PALETTE_SIZE})` }
    }

    function layoutWorkflow(workflow, mode) {
      if (!workflow) return workflow
      const layout = mode === 'star' || mode === 'radial' ? mode : 'chain'
      const positions = layoutPositions(workflow, layout)
      const nodes = workflow.nodes.map((node) => (node.pos?.pinned === true
        ? node
        : { ...node, pos: { ...node.pos, ...(positions.get(node.id) ?? {}) } }))
      return { ...workflow, layout, nodes }
    }

    /**
     * 统一布局引擎：先定结构，再投影。
     *
     * 第一步 分组：容器节点（阶段 / 组）与其子节点构成一个单元，单元整体参与排序
     *         ——从属关系不再被遍历深度打散，子节点始终跟着父容器走。
     * 第二步 排序：按连线方向给单元定层（单元级拓扑，环上单元放最后）；主干节点
     *         按主干序号插队；同层按「主干序 → 标题」稳定排序。
     * 第三步 投影：四种布局共享同一结构，只改坐标映射。
     *         从左到右 / 从上到下是同构投影（仅交换轴）；星图按深度分环；辐射图整圈。
     * 第四步 由调用方做重叠修复。
     */
    function layoutPositions(workflow, layout) {
      const positions = new Map()
      if (!workflow) return positions
      const nodes = workflow.nodes
      const isContainer = (node) => node.kind === 'phase' || node.kind === 'group.steps'
      const childrenOf = (id) => nodes.filter((node) => node.phaseId === id || node.parentId === id)

      // ── 单元划分 ──
      const containers = nodes.filter(isContainer)
      const unitOf = new Map()
      for (const container of containers) {
        unitOf.set(container.id, container.id)
        for (const child of childrenOf(container.id)) unitOf.set(child.id, container.id)
      }
      const units = [
        ...containers.map((container) => ({ id: container.id, members: [container.id, ...childrenOf(container.id).map((child) => child.id)] })),
        ...nodes.filter((node) => !unitOf.has(node.id)).map((node) => ({ id: node.id, members: [node.id] })),
      ]
      const unitByNode = new Map()
      for (const unit of units) for (const member of unit.members) unitByNode.set(member, unit.id)

      // ── 单元级拓扑分层 ──
      const outEdges = new Map(units.map((unit) => [unit.id, []]))
      const inDegree = new Map(units.map((unit) => [unit.id, 0]))
      for (const edge of workflow.edges ?? []) {
        const fromUnit = unitByNode.get(edge.from)
        const toUnit = unitByNode.get(edge.to)
        if (!fromUnit || !toUnit || fromUnit === toUnit) continue
        outEdges.get(fromUnit).push(toUnit)
        inDegree.set(toUnit, (inDegree.get(toUnit) ?? 0) + 1)
      }
      const depth = new Map()
      const queue = units.filter((unit) => (inDegree.get(unit.id) ?? 0) === 0).map((unit) => unit.id)
      for (const id of queue) depth.set(id, 0)
      const seen = new Set(queue)
      while (queue.length > 0) {
        const id = queue.shift()
        for (const next of outEdges.get(id) ?? []) {
          const candidate = (depth.get(id) ?? 0) + 1
          if (candidate > (depth.get(next) ?? 0)) depth.set(next, candidate)
          inDegree.set(next, (inDegree.get(next) ?? 0) - 1)
          if ((inDegree.get(next) ?? 0) === 0 && !seen.has(next)) { seen.add(next); queue.push(next) }
        }
      }
      // 环上的单元（入度永不为 0）与入口不可达的孤岛都排到最后——
      // 否则无入边的孤岛会被当成根，挤进第一层与主干抢位置。
      const entryUnit = workflow.entry ? unitByNode.get(workflow.entry) : null
      const reachable = new Set()
      if (entryUnit) {
        const todo = [entryUnit]
        while (todo.length > 0) {
          const id = todo.pop()
          if (reachable.has(id)) continue
          reachable.add(id)
          for (const next of outEdges.get(id) ?? []) if (!reachable.has(next)) todo.push(next)
        }
      }
      for (const unit of units) if (!depth.has(unit.id) || !reachable.has(unit.id)) depth.set(unit.id, units.length)

      // ── 层内稳定排序：主干序 → 标题 ──
      const mainIndex = new Map((Array.isArray(workflow.mainPath) ? workflow.mainPath : []).map((id, index) => [id, index]))
      const layers = new Map()
      for (const unit of units) {
        const d = depth.get(unit.id) ?? 0
        if (!layers.has(d)) layers.set(d, [])
        layers.get(d).push(unit)
      }
      const stableKey = (unit) => {
        let mainOrder = Infinity
        for (const id of unit.members) {
          const index = mainIndex.get(id)
          if (index !== undefined) mainOrder = Math.min(mainOrder, index)
        }
        return { mainOrder: mainOrder === Infinity ? 1e9 : mainOrder, title: byId(unit.id)?.title ?? '' }
      }
      const byId = (id) => nodes.find((node) => node.id === id)
      for (const [d, list] of layers) {
        list.sort((a, b) => stableKey(a).mainOrder - stableKey(b).mainOrder || stableKey(a).title.localeCompare(stableKey(b).title))
        layers.set(d, list)
      }

      // ── 投影 ──
      const GAP = 40
      const AXIS = 480
      if (layout === 'chain' || layout === 'tb') {
        // 从左到右 / 从上到下：同构投影，仅交换轴。
        const horizontal = layout === 'chain'
        const ALONG_STEP = horizontal ? 280 : NODE_HEIGHT + 140
        const ORIGIN = 60
        const CROSS_GAP = 40
        const crossSize = horizontal ? NODE_HEIGHT : NODE_WIDTH
        for (const [d, list] of layers) {
          const totalSpan = list.reduce((sum, unit) => {
            const members = horizontal ? unit.members.length : unit.members.length
            return sum + members * crossSize + CROSS_GAP * Math.max(0, members - 1)
          }, 0) + CROSS_GAP * Math.max(0, list.length - 1)
          let cross = (horizontal ? AXIS : 640) - totalSpan / 2
          for (const unit of list) {
            // 子节点排在容器右侧（横向）或下侧（纵向）一格——从属关系在坐标上可见。
            unit.members.forEach((id, memberIndex) => {
              const memberOffset = memberIndex === 0 ? 0 : (horizontal ? 120 : NODE_HEIGHT + 20)
              const along = ORIGIN + d * ALONG_STEP + memberOffset
              if (horizontal) positions.set(id, { x: along, y: Math.round(cross + crossSize / 2) })
              else positions.set(id, { x: Math.round(cross + crossSize / 2), y: along })
              cross += crossSize + CROSS_GAP
            })
            cross += CROSS_GAP
          }
        }
        return positions
      }

      if (layout === 'star') {
        // 星图：入口（或首单元）居中，其余按深度分环；环内按稳定序排角度。
        const hubUnit = layers.get(0)?.[0] ?? units[0]
        const cx = 560, cy = 440
        hubUnit.members.forEach((id, index) => {
          if (index === 0) { positions.set(id, { x: cx, y: cy }); return }
          // hub 的子节点小半径环绕中心，避免全部叠在中心点
          const angle = (Math.PI * 2 * (index - 1)) / Math.max(1, hubUnit.members.length - 1) - Math.PI / 2
          positions.set(id, { x: Math.round(cx + Math.cos(angle) * 130), y: Math.round(cy + Math.sin(angle) * 130) })
        })
        const byRing = new Map()
        for (const unit of units) {
          if (unit.id === hubUnit.id) continue
          const ring = Math.max(0, (depth.get(unit.id) ?? 1) - 1)
          if (!byRing.has(ring)) byRing.set(ring, [])
          byRing.get(ring).push(unit)
        }
        for (const [ring, list] of byRing) {
          const radius = 200 + ring * 170
          const totalSlots = list.reduce((sum, unit) => sum + unit.members.length, 0)
          // 环间错开起始角：否则每个环都从正上方开始，多环时全部叠成一条垂直线
          const startAngle = -Math.PI / 2 + ring * (Math.PI / Math.max(3, totalSlots))
          let slot = 0
          for (const unit of list) {
            for (const id of unit.members) {
              const angle = startAngle + (Math.PI * 2 * slot) / Math.max(1, totalSlots)
              positions.set(id, { x: Math.round(cx + Math.cos(angle) * radius), y: Math.round(cy + Math.sin(angle) * radius) })
              slot += 1
            }
          }
        }
        return positions
      }

      // 辐射图：全部节点按稳定序放一圈。
      const cx = 560, cy = 440
      const all = units.flatMap((unit) => unit.members)
      const radius = Math.max(240, 90 + all.length * 22)
      all.forEach((id, index) => {
        const angle = (Math.PI * 2 * index) / Math.max(1, all.length) - Math.PI / 2
        positions.set(id, { x: Math.round(cx + Math.cos(angle) * radius), y: Math.round(cy + Math.sin(angle) * radius) })
      })
      return positions
    }


    function autoLayout(workflow) {
      return resolveOverlaps(layoutWorkflow(workflow, workflow?.layout ?? 'chain'))
    }

    /** 布局修复：重叠节点沿 y 网格下移到空位；钉住的不动。 */
    function resolveOverlaps(workflow) {
      if (!workflow) return workflow
      const placed = []
      const nodes = workflow.nodes.map((node) => {
        if (node.pos?.pinned === true) { placed.push({ x: node.pos.x, y: node.pos.y, w: NODE_WIDTH, h: NODE_HEIGHT }); return node }
        let { x, y } = node.pos
        let guard = 0
        while (placed.some((r) => x < r.x + r.w && x + NODE_WIDTH > r.x && y < r.y + r.h && y + NODE_HEIGHT > r.y) && guard < 40) {
          y += NODE_HEIGHT / 2
          guard += 1
        }
        placed.push({ x, y, w: NODE_WIDTH, h: NODE_HEIGHT })
        return { ...node, pos: { ...node.pos, y } }
      })
      return { ...workflow, nodes }
    }

    function orderByLayer(workflow) {
      if (!workflow) return []
      const out = new Map(workflow.nodes.map((node) => [node.id, []]))
      for (const edge of workflow.edges) out.get(edge.from)?.push(edge.to)
      const seen = new Map()
      const queue = [workflow.entry]
      seen.set(workflow.entry, 0)
      let guard = 0
      while (queue.length > 0 && guard < 10000) {
        guard += 1
        const id = queue.shift()
        for (const next of out.get(id) ?? []) {
          if (seen.has(next)) continue
          seen.set(next, (seen.get(id) ?? 0) + 1)
          queue.push(next)
        }
      }
      return [...workflow.nodes].sort((a, b) => {
        const la = seen.get(a.id) ?? 0
        const lb = seen.get(b.id) ?? 0
        if (la !== lb) return la - lb
        return a.pos.y - b.pos.y
      })
    }

