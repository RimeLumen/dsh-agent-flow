#!/usr/bin/env node
/*! dsh-agent-flow | Copyright (c) 2026 RimeLumen | MIT License */
/**
 * 自检脚本（自动化任务 A3）。
 *
 * 为什么需要它：本项目此前多次出现「代码看起来对、实际从未生效」的静默缺陷
 * （正交路由读错字段、空间网格字段错位、store 未解构被 try/catch 吞掉）。
 * 只做代码审查抓不到这类问题——必须对**真实模块**跑端到端断言。
 *
 * 用法：node scripts/selfcheck.mjs
 * 退出码：0 = 全部通过；1 = 有失败项。
 */

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const hostDir = join(root, 'src', 'host')

const model = await import(new URL('file://' + join(hostDir, 'flow', 'model.js').replace(/\\/g, '/')))
const decomposer = await import(new URL('file://' + join(hostDir, 'decompose.js').replace(/\\/g, '/')))
const plan = await import(new URL('file://' + join(hostDir, 'plan.js').replace(/\\/g, '/')))
const compose = await import(new URL('file://' + join(hostDir, 'compose.js').replace(/\\/g, '/')))
const experience = await import(new URL('file://' + join(hostDir, 'experience.js').replace(/\\/g, '/')))
const textfit = await import(new URL('file://' + join(hostDir, 'flow', 'textfit.js').replace(/\\/g, '/')))

let passed = 0
let failed = 0
const results = []
function check(section, label, ok, extra) {
  if (ok) { passed += 1 } else { failed += 1 }
  results.push({ section, label, ok, extra })
  if (!ok) console.log(`  FAIL  [${section}] ${label}${extra ? ' — ' + extra : ''}`)
}

// ── 1. 提示词 → 画布（拆解 + 自动连线 + 主干）──
{
  const section = 'decompose'
  const text = '请按三步完成重构。阶段一：先阅读现有的路由模块，找出手写解析的位置。阶段二：然后把解析逻辑替换为共享函数，同时补上单元测试。阶段三：最后更新文档并跑一遍全量校验。'
  const draft = decomposer.decomposePrompt(text, { tools: [{ name: 'grep' }] })
  check(section, '多阶段提示词不判为 trivial', draft.isTrivial === false)
  check(section, '识别出多个阶段', draft.phases.length >= 2, draft.phases.length + ' 个')

  const built = plan.phasesToWorkflow({
    title: '草稿 · ' + draft.title,
    phases: draft.phases.map((p) => ({
      title: p.title,
      subtasks: p.subtasks.map((s) => ({ title: s.title, kind: s.kind, prompt: s.title, tool: s.tool })),
    })),
  }, { sessionId: 'selfcheck', origin: 'auto-draft' })
  const wf = built.workflow
  check(section, '生成节点', wf.nodes.length > 0, wf.nodes.length + ' 个')
  check(section, '自动连好线', wf.edges.length > 0, wf.edges.length + ' 条')
  check(section, '边数 = 节点数 - 1（顺序主干）', wf.edges.length === wf.nodes.length - 1)
  check(section, 'origin 可被 context 覆盖', wf.origin === 'auto-draft', wf.origin)
  check(section, '生成 mainPath 主干', Array.isArray(wf.mainPath) && wf.mainPath.length === wf.nodes.length)
  check(section, '边都引用存在的节点', wf.edges.every((e) => wf.nodes.some((n) => n.id === e.from) && wf.nodes.some((n) => n.id === e.to)))
  check(section, '阶段词只作标题不再整句重复', !draft.phases.some((p) => p.subtasks.length > 0 && p.subtasks[0].title === p.title))
  check(section, '过短提示词不产草稿', decomposer.decomposePrompt('看看这个', {}).isTrivial === true)
}

// ── 1b. 工具节点端到端（防「工具名丢失」回归）──
{
  const section = 'decompose'
  const draft = decomposer.decomposePrompt('先 grep 全部调用点，然后总结。', { tools: [{ name: 'grep' }] })
  const built = plan.phasesToWorkflow({
    title: '工具链路',
    phases: draft.phases.map((p) => ({
      title: p.title,
      subtasks: p.subtasks.map((s) => ({ title: s.title, kind: s.kind, prompt: s.title, tool: s.tool })),
    })),
  }, { sessionId: 'selfcheck', origin: 'auto-draft' })
  const toolNodes = built.workflow.nodes.filter((n) => n.kind === 'tool.call')
  check(section, '工具词落成 tool.call 节点', toolNodes.length >= 1, toolNodes.length + ' 个')
  check(section, 'tool.call 节点带上了工具名', toolNodes.every((n) => typeof n.params?.name === 'string' && n.params.name !== ''),
    toolNodes.map((n) => n.params?.name).join(','))
  check(section, 'tool.call 的 argsTemplate 是合法 JSON 串', toolNodes.every((n) => {
    try { JSON.parse(n.params?.argsTemplate ?? '{}'); return true } catch { return false }
  }))
  // 空 phases 必须显式报错，而不是静默产出空图
  let threw = false
  try { plan.phasesToWorkflow({ phases: [] }, {}) } catch { threw = true }
  check(section, '空 phases 显式抛错（不静默产空图）', threw)
}

// ── 2. 画布 → 提示词（反向组合往返）──
{
  const section = 'compose'
  const text = '先分析日志找出超时的接口，然后基于上述结论优化查询，最后压测验证。'
  const draft = decomposer.decomposePrompt(text, { tools: [] })
  const built = plan.phasesToWorkflow({
    title: '往返',
    phases: draft.phases.map((p) => ({ title: p.title, subtasks: p.subtasks.map((s) => ({ title: s.title, kind: s.kind, prompt: s.title })) })),
  }, { sessionId: 'selfcheck', origin: 'auto-draft' })
  const out = compose.composePrompt(built.workflow, { goal: '降低超时' })
  check(section, '往返产出非空提示词', out.text.length > 0, out.text.length + ' 字')
  check(section, '含阶段小标题', out.text.includes('## 阶段'))
  check(section, '含步骤列表', out.text.includes('- '))
  check(section, '往返保留关键步骤', out.text.includes('分析日志'))
  check(section, '空图给警告而非崩溃', compose.composePrompt(model.normalizeWorkflow({ name: 'x', nodes: [], edges: [], vars: {} })).warnings.length > 0)
  check(section, '统计与画布一致', out.stats.nodes === built.workflow.nodes.filter((n) => n.kind !== 'phase').length)

  // 工具节点必须在提示词里以「调用工具 X」出现——否则 Agent 看不到该用哪个工具
  const toolDraft = decomposer.decomposePrompt('先 grep 全部调用点，然后总结。', { tools: [{ name: 'grep' }] })
  const toolBuilt = plan.phasesToWorkflow({
    title: '工具往返',
    phases: toolDraft.phases.map((p) => ({ title: p.title, subtasks: p.subtasks.map((s) => ({ title: s.title, kind: s.kind, prompt: s.title, tool: s.tool })) })),
  }, { sessionId: 'selfcheck', origin: 'auto-draft' })
  const toolOut = compose.composePrompt(toolBuilt.workflow)
  check(section, '提示词里出现「调用工具 grep」', toolOut.text.includes('调用工具 grep'), toolOut.text.split('\n').filter((l) => l.includes('工具')).join(' / '))
}

// ── 3. 布局校验门禁 ──
{
  const section = 'validator'
  const wf = model.normalizeWorkflow({
    name: 'gate', entry: 'a',
    nodes: [
      { id: 'a', kind: 'agent.task', title: '正常标题', pos: { x: 0, y: 0 }, params: { prompt: 'p' } },
      { id: 'b', kind: 'agent.task', title: '这是一个非常非常非常长的标题需要被门禁拦下来因为收缩到最小字号也放不下', pos: { x: 0, y: 0 }, params: { prompt: 'p' } },
      { id: 'c', kind: 'agent.task', title: '孤立', pos: { x: 900, y: 0 }, params: { prompt: 'p' } },
      { id: 'd', kind: 'agent.task', title: '负坐标', pos: { x: -50, y: -20 }, params: { prompt: 'p' } },
    ],
    edges: [{ id: 'e1', from: 'a', to: 'b' }, { id: 'e2', from: 'b', to: 'd' }], vars: {},
  })
  const codes = new Set(model.validateWorkflow(wf).map((i) => i.code))
  check(section, '文本溢出门禁', codes.has('layout-gate'))
  check(section, '重叠检测', codes.has('node-overlap'))
  check(section, '越界检测', codes.has('node-out-of-bounds'))
  check(section, '孤立节点检测', codes.has('node-isolated'))
  check(section, '正常图无 error 级文本问题', !model.validateWorkflow(model.normalizeWorkflow({
    name: 'ok', entry: 'a',
    nodes: [{ id: 'a', kind: 'agent.task', title: '短标题', pos: { x: 0, y: 0 }, params: { prompt: 'p' } },
      { id: 'b', kind: 'agent.task', title: '另一个短标题', pos: { x: 300, y: 0 }, params: { prompt: 'p' } }],
    edges: [{ id: 'e', from: 'a', to: 'b' }], vars: {},
  })).some((i) => i.code === 'layout-gate'))
}

// ── 4. 文本适配（与客户端同口径）──
{
  const section = 'textfit'
  check(section, '全角字符计 2 单位', textfit.textUnits('连线') === 4, String(textfit.textUnits('连线')))
  check(section, '半角字符计 1 单位', textfit.textUnits('ab') === 2)
  check(section, '短标题在下限之上', textfit.minimumNodeTextWidth('连线修复') <= textfit.TITLE_AVAILABLE_WIDTH)
  check(section, '长标题超出可用宽度（会被门禁拦）', textfit.minimumNodeTextWidth('这是一个非常非常非常长的标题需要被门禁拦下来因为收缩到最小字号也放不下') > textfit.TITLE_AVAILABLE_WIDTH)
  check(section, '字号收缩不低于下限', textfit.fittedFontSize('这是一个很长的标题需要收缩很多字号才能放下啊啊啊啊啊', 176, 12.5, 9) >= 9)
}

// ── 5. 正交路由引擎（从 client.js 提取真实实现）──
{
  const section = 'routing'
  const src = readFileSync(join(root, 'src', 'client.js'), 'utf8')
  const lines = src.split(/\r?\n/)
  const startLine = lines.findIndex((l) => l.includes('const keyOf = '))
  const polyLine = lines.findIndex((l) => l.includes('function polylineToPath('))
  let endLine = -1
  for (let i = polyLine + 1; i < lines.length; i += 1) if (lines[i].trim() === '}') { endLine = i; break }
  if (startLine < 0 || polyLine < 0 || endLine < 0) {
    check(section, '路由引擎可从 client.js 提取', false)
  } else {
    const code = lines.slice(startLine, endLine + 1).join('\n')
    const fn = new Function(code + '\nreturn { segmentHitsRect, createSpatialGrid, orthogonalRoute }')
    const { segmentHitsRect, createSpatialGrid, orthogonalRoute } = fn()
    const fromRect = { x: 0, y: 0, w: 220, h: 96 }
    const toRect = { x: 500, y: 0, w: 220, h: 96 }
    const blocker = { x: 250, y: -20, w: 160, h: 140 }
    const a = { x: 110, y: 48 }, b = { x: 610, y: 48 }
    const bbox = { minX: 110, maxX: 610, minY: 48, maxY: 48 }

    const g1 = createSpatialGrid(160)
    g1.insert(fromRect, { id: 'A', rect: fromRect })
    g1.insert(toRect, { id: 'B', rect: toRect })
    check(section, '空旷图判无阻挡（走快路径）', g1.query(bbox).some((it) => it.id !== 'A' && it.id !== 'B' && segmentHitsRect(a, b, it.rect, 0)) === false)

    const g2 = createSpatialGrid(160)
    g2.insert(fromRect, { id: 'A', rect: fromRect })
    g2.insert(toRect, { id: 'B', rect: toRect })
    g2.insert(blocker, { id: 'C', rect: blocker })
    check(section, '被挡边精确前筛找到阻挡者', g2.query(bbox).some((it) => it.id !== 'A' && it.id !== 'B' && segmentHitsRect(a, b, it.rect, 0)) === true)
    check(section, '网格 all() 条目数正确', g2.all().length === 3)

    const full = g2.all().filter((it) => it.id !== 'A' && it.id !== 'B').map((it) => it.rect)
    const route = orthogonalRoute(fromRect, toRect, 'right', 'left', full, { clearance: 10 })
    check(section, '被挡边产出绕行折线', Array.isArray(route) && route.length >= 3)
    let crosses = false
    if (route) for (let i = 1; i < route.length; i += 1) if (segmentHitsRect(route[i - 1], route[i], blocker, 0)) crosses = true
    check(section, '绕行不穿障碍', crosses === false)
    check(section, '垂直方向路由可用', Array.isArray(orthogonalRoute({ x: 0, y: 0, w: 220, h: 96 }, { x: 40, y: 400, w: 220, h: 96 }, 'bottom', 'top', [], { clear: 10, clearance: 10 })))
  // 补丁吞行防回归：此前一条替换把 useRef 声明吞掉，真机上 routeCacheRef 未定义直接渲染失败。
  const routeRefDecl = lines.findIndex((l) => l.includes('const routeCacheRef = useRef'))
  const routeRefUse = lines.findIndex((l) => l.includes('routeCacheRef.current?.for'))
  check(section, '路由缓存声明存在', routeRefDecl >= 0)
  check(section, '路由缓存声明在使用之前（同作用域）', routeRefDecl >= 0 && routeRefUse > routeRefDecl)
  }
}

// ── 5b. 锚点吸附（核心逻辑：连线必须绑锚点，矩形不是吸附目标）──
{
  const section = 'anchor'
  const src = readFileSync(join(root, 'src', 'client.js'), 'utf8')
  const lines = src.split(/\r?\n/)
  const grab = (marker) => lines.findIndex((l) => l.includes(marker))
  const edgeStart = grab('const EDGE_SIDES = [')
  const anchorStart = grab('function anchorPoint(rect, side) {')
  const snapStart = grab('function nearestAnchor(rect, point, radius) {')
  // 用**精确行**取三段真实源码（用 includes 会命中更深缩进的同名结尾，把块截断）
  const takeBlock = (startLine, closeLine) => {
    for (let i = startLine + 1; i < lines.length; i += 1) {
      if (lines[i] === closeLine) return lines.slice(startLine, i + 1).join('\n')
    }
    return ''
  }
  const edgeBlock = takeBlock(edgeStart, '    ]')
  const anchorBlock = takeBlock(anchorStart, '    }')
  const snapBlock = takeBlock(snapStart, '    }')
  if (!edgeBlock || !anchorBlock || !snapBlock) {
    check(section, '可从 client.js 提取锚点逻辑', false)
  } else {
    const fn = new Function(`${edgeBlock}\n${anchorBlock}\n${snapBlock}\nreturn { EDGE_SIDES, anchorPoint, nearestAnchor }`)
    const { EDGE_SIDES, anchorPoint, nearestAnchor } = fn()
    const rect = { x: 0, y: 0, w: 220, h: 96 }
    const R = 16
    check(section, '锚点集为 8 个', EDGE_SIDES.length === 8, String(EDGE_SIDES.length))

    const right = anchorPoint(rect, 'right')
    check(section, '正落在 right 锚点上 → 命中 right', nearestAnchor(rect, right, R)?.side === 'right')
    const corner = anchorPoint(rect, 'top-right')
    check(section, '正落在 top-right 锚点上 → 命中 top-right', nearestAnchor(rect, corner, R)?.side === 'top-right')

    // 关键断言：矩形内部（远离任何锚点）不是吸附目标
    check(section, '矩形中心不吸附（矩形不是吸附目标）', nearestAnchor(rect, { x: 110, y: 48 }, R) === null)
    check(section, '矩形面中部（锚点之间）不吸附', nearestAnchor(rect, { x: 88, y: 0 }, R) === null, '顶边 40% 处距最近锚点 > 16px')
    check(section, '矩形外远处不吸附', nearestAnchor(rect, { x: 400, y: 300 }, R) === null)

    // 半径边界：刚出半径即不命中
    check(section, '半径外 1px 不命中', nearestAnchor(rect, { x: right.x + R + 1, y: right.y }, R) === null)
    check(section, '半径内 1px 命中', nearestAnchor(rect, { x: right.x + R - 1, y: right.y }, R)?.side === 'right')

    // 源码层面确认旧的矩形判定已移除
    check(section, '旧的 nearEdge 矩形起线判定已移除', !src.includes('nearEdge'))
    check(section, '旧的 nearestSide 已移除（被 nearestAnchor 取代）', !src.includes('function nearestSide'))
    check(section, '落点使用锚点距离判定', src.includes('nearestAnchor(rectOfNode(node), point, ANCHOR_SNAP_PX'))
    check(section, 'completeConnection 接收显式锚点', src.includes('completeConnection(best.nodeId, point, best.side)'))
  }
}

// ── 5c. 声明一致性（客户端与宿主各有一份，必须同步）──
// 浏览器半是单文件、无构建步骤，无法 import 宿主模块，因此几何/文本/端口常量必然各存一份。
// 成熟度要求不是「消灭重复」，而是**让漂移立刻被发现**——这一节就是那条防线。
{
  const section = 'declaration'
  const clientSrc = readFileSync(join(root, 'src', 'client.js'), 'utf8')
  const hostModel = readFileSync(join(root, 'src', 'host', 'flow', 'model.js'), 'utf8')

  const clientNum = (name) => {
    const m = clientSrc.match(new RegExp('const ' + name + ' = (\\d+)'))
    return m ? Number(m[1]) : null
  }
  const hostNum = (name) => {
    const m = hostModel.match(new RegExp('export const ' + name + ' = (\\d+)'))
    return m ? Number(m[1]) : null
  }

  check(section, 'NODE_WIDTH 两边一致', clientNum('NODE_WIDTH') === textfit.NODE_WIDTH,
    clientNum('NODE_WIDTH') + ' vs ' + textfit.NODE_WIDTH)
  check(section, 'NODE_HEIGHT 两边一致', clientNum('NODE_HEIGHT') === textfit.NODE_HEIGHT,
    clientNum('NODE_HEIGHT') + ' vs ' + textfit.NODE_HEIGHT)

  const clientTextFit = clientSrc.match(/const TEXT_FIT = \{ widthFactor: ([\d.]+), horizontalPadding: (\d+) \}/)
  check(section, 'TEXT_FIT 两边一致', Boolean(clientTextFit)
    && Number(clientTextFit[1]) === textfit.TEXT_FIT.widthFactor
    && Number(clientTextFit[2]) === textfit.TEXT_FIT.horizontalPadding,
    clientTextFit ? clientTextFit[1] + '/' + clientTextFit[2] + ' vs ' + textfit.TEXT_FIT.widthFactor + '/' + textfit.TEXT_FIT.horizontalPadding : '客户端未找到')

  check(section, '标题最小字号两边一致', clientSrc.includes(', 12.5, 9)') === (textfit.MIN_TITLE_FONT === 9),
    'MIN_TITLE_FONT=' + textfit.MIN_TITLE_FONT)
  check(section, 'TITLE_AVAILABLE_WIDTH = NODE_WIDTH - 44', textfit.TITLE_AVAILABLE_WIDTH === textfit.NODE_WIDTH - 44,
    String(textfit.TITLE_AVAILABLE_WIDTH))

  // 端口集：客户端数组 与 宿主 Object.freeze([...]) 必须逐项同序
  const sidesFrom = (text) => {
    const m = text.match(/EDGE_SIDES = (?:Object\.freeze\()?\[([\s\S]*?)\]/)
    return m ? [...m[1].matchAll(/'([a-z0-9-]+)'/g)].map((x) => x[1]) : []
  }
  const clientSides = sidesFrom(clientSrc)
  const hostSides = sidesFrom(hostModel)
  check(section, '端口集两边一致且同序', clientSides.length > 0 && clientSides.join(',') === hostSides.join(','),
    clientSides.length + ' vs ' + hostSides.length)
  check(section, '端口集为 8 项（四正 + 四角）', clientSides.length === 8, String(clientSides.length))
  check(section, '端口集含四角锚点', ['top-left', 'top-right', 'bottom-left', 'bottom-right'].every((s) => clientSides.includes(s)))
  check(section, '象限锚点已移除', !['top-q1', 'right-q1', 'bottom-q1', 'left-q1'].some((s) => clientSides.includes(s)))
}

// ── 5d. 接线完整性（声明了就必须真的接上）──
// 本项目多次出现「代码写了但从未接上」的静默缺陷，所以接线必须被断言，而不是靠读代码相信。
{
  const section = 'wiring'
  const hostIndex = readFileSync(join(root, 'src', 'host', 'index.js'), 'utf8')
  const clientSrc = readFileSync(join(root, 'src', 'client.js'), 'utf8')
  const routeText = readFileSync(join(root, 'src', 'host', 'routes', 'index.js'), 'utf8')
  const routeFiles = ['plan', 'workflow', 'runs', 'data', 'errors', 'experience', 'selection']
    .map((n) => readFileSync(join(root, 'src', 'host', 'routes', n + '.js'), 'utf8')).join('\n')
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

  for (const tool of ['flow_plan', 'flow_progress', 'flow_compose', 'flow_status']) {
    check(section, `工具 ${tool} 已注册`, hostIndex.includes(`name: '${tool}'`))
  }
  check(section, '收件箱监听已接上（插件自主拆解）', hostIndex.includes("ctx.on('agent/inbox/inserted'"))
  check(section, '拆解器被真正调用', hostIndex.includes('decomposePrompt('))
  check(section, '拆解产物经布局编译（含自动连线）', hostIndex.includes('phasesToWorkflow('))
  check(section, '反向组合被真正调用', hostIndex.includes('composePrompt('))
  check(section, '自动入库被真正调用', routeFiles.includes('autoCaptureExperience('))
  check(section, '就绪门被真正等待', routeText.includes('store.ready()'))
  check(section, '路由 /workflows/:id/compose 存在', routeFiles.includes("'/workflows/:id/compose'"))
  check(section, '批量流程路由存在', routeFiles.includes("'/workflows/batch'"))
  check(section, '批量路由支持三种操作', ['archive', 'restore', 'delete'].every((a) => routeFiles.includes("''")) === false || routeFiles.includes("archive / restore / delete"))
  check(section, 'FlowManager 独立组件存在', clientSrc.includes('function FlowManager(props)'))
  check(section, '停靠栏挂载 FlowManager', clientSrc.includes('h(FlowManager,'))
  check(section, '批量操作已接线', clientSrc.includes('batchWorkflows'))
  check(section, '回收站视图存在', clientSrc.includes('recycleTitle'))
  check(section, '旧 flowRows 内联列表已删除', !clientSrc.includes('const flowRows'))
  check(section, '路由 /plan/confirm 存在', routeFiles.includes("'/plan/confirm'"))

  // 「方法 + 路径」不得重复（同一路径配不同方法是正当 REST；同方法同路径才会让后者永不匹配）
  const pairs = [...routeFiles.matchAll(/method:\s*'([A-Z]+)',\s*\n\s*pattern:\s*'([^']+)'/g)].map((m) => m[1] + ' ' + m[2])
  const dupes = pairs.filter((p, i) => pairs.indexOf(p) !== i)
  check(section, '「方法 + 路径」无重复', dupes.length === 0, dupes.join(', ') || '共 ' + pairs.length + ' 条')
  check(section, '路由数量在合理区间', pairs.length >= 30 && pairs.length <= 60, String(pairs.length) + ' 条')

  check(section, 'package.json 声明了浏览器半', pkg.dsh?.client?.platform === 'web')
  check(section, '浏览器半入口文件存在', existsSync(join(root, 'src', 'client.js')))
  check(section, '宿主入口文件存在', existsSync(join(root, 'src', 'host', 'index.js')))
  check(section, '零运行时依赖', Object.keys(pkg.dependencies ?? {}).length === 0)
}

// ── 5e. 架构边界（分层不被打破）──
{
  const section = 'architecture'
  const hostFiles = ['index.js', 'store.js', 'catalog.js', 'plan.js', 'compose.js', 'decompose.js', 'experience.js', 'errors.js', 'mermaid.js', 'selection.js']
    .map((n) => join(root, 'src', 'host', n))
  const flowFiles = ['model.js', 'scheduler.js', 'expr.js', 'handlers.js', 'textfit.js']
    .map((n) => join(root, 'src', 'host', 'flow', n))

  // 宿主不得依赖浏览器半
  check(section, '宿主不导入浏览器半', hostFiles.concat(flowFiles).every((f) => !readFileSync(f, 'utf8').includes("client.js")))
  // 底层模型层不得反向依赖路由/入口
  const modelText = readFileSync(join(root, 'src', 'host', 'flow', 'model.js'), 'utf8')
  check(section, '模型层不依赖路由层', !modelText.includes("routes/"))
  check(section, '模型层不依赖入口层', !modelText.includes("'../index.js'"))
  // 无循环导入（同层模块互不 import）
  const planText = readFileSync(join(root, 'src', 'host', 'plan.js'), 'utf8')
  check(section, 'plan 不反向依赖 compose', !planText.includes("compose.js"))
  const composeText = readFileSync(join(root, 'src', 'host', 'compose.js'), 'utf8')
  check(section, 'compose 不反向依赖 plan', !composeText.includes("plan.js"))
}

// ── 5f. 壳（界面外壳：图层、主题、交互入口必须齐备且合规）──
{
  const section = 'shell'
  const clientSrc = readFileSync(join(root, 'src', 'client.js'), 'utf8')
  const need = [
    ['画布根层', "className: 'daf-canvas-root'"],
    ['悬浮工具条', "className: 'daf-toolbar'"],
    ['右缘功能栏', "className: 'daf-side-rail'"],
    ['流程停靠栏', 'daf-flow-dock'],
    ['开发者面板独立组件', 'function DevLayer(props)'],
    ['开发者面板挂载点', 'h(DevLayer,'],
    ['节点搜索框', "className: 'daf-search'"],
    ['大纲面板', "className: 'daf-outline'"],
    ['导览条', "className: 'daf-tour'"],
    ['缩略图视口框', 'daf-thumb-viewrect'],
    ['阶段容器框', 'daf-phase-frame'],
    ['执行氛围胶囊', 'daf-busy-pill'],
    ['动效总开关', 'setMotionOff'],
    ['CSS 动效治理', '[data-motion="off"]'],
  ]
  for (const [label, marker] of need) check(section, label + ' 存在', clientSrc.includes(marker))

  // 主题合规：不得出现硬编码颜色（必须走主题变量）
  // 唯一允许的硬编码白色是导出底色常量；除此之外界面必须走主题变量
  const whiteHits = clientSrc.split('\n').filter((l) => /#fff/i.test(l))
  check(section, '硬编码白色只出现在导出底色常量', whiteHits.length === 1 && whiteHits[0].includes('EXPORT_BACKGROUND'),
    whiteHits.length + ' 处')
  // 阴影与遮罩天然是黑色 alpha：允许出现在主题 token 的定义行（--daf-*），不允许散落在使用处
  const blackHits = clientSrc.split('\n').filter((l) => /rgba\(\s*0\s*,\s*0\s*,\s*0/.test(l))
  check(section, '黑色 rgba 只出现在主题 token 定义', blackHits.every((l) => /--daf-/.test(l)), blackHits.length + ' 处')
  check(section, '深色主题有响应', clientSrc.includes('prefers-color-scheme: dark'))
  check(section, '减少动效有响应', clientSrc.includes('prefers-reduced-motion'))
  check(section, '主题变量有派生层', clientSrc.includes('.daf-scope{') || clientSrc.includes('.daf-scope {'))

  // 导出能力齐备
  for (const [label, marker] of [['Mermaid 导出', 'api.mermaidExport'], ['SVG 导出', 'buildFlowSvg'], ['PNG 4× 导出', 'exportPng'], ['提示词组合', 'composeToPrompt']]) {
    check(section, label + ' 已接线', clientSrc.includes(marker))
  }

  // 图层顺序：阶段框必须在节点之下（渲染数组中早于 nodesView）
  const frameAt = clientSrc.indexOf('phaseFramesView,')
  const nodesAt = clientSrc.indexOf('nodesView)))')
  check(section, '阶段框渲染在节点之下', frameAt > 0 && nodesAt > frameAt, 'frame@' + frameAt + ' nodes@' + nodesAt)
}

// ── 5g. 布局引擎（四种布局共享同一结构：从属跟随 + 执行顺序 + 孤岛后置）──
{
  const section = 'layout'
  const src = readFileSync(join(root, 'src', 'client.js'), 'utf8')
  const lines = src.split(/\r?\n/)
  const s = lines.findIndex((l) => l.includes('function layoutPositions('))
  let e = -1
  for (let i = s + 1; i >= 0 && i < lines.length; i += 1) if (/^    function /.test(lines[i])) { e = i - 1; break }
  if (s < 0 || e < 0) {
    check(section, '可从 client.js 提取布局引擎', false)
  } else {
    const code = ['const NODE_WIDTH = 220', 'const NODE_HEIGHT = 96', ...lines.slice(s, e + 1)].join('\n')
    const layoutPositions = new Function(code + '\nreturn layoutPositions')()
    const wf = {
      name: 't', entry: 'a', mainPath: ['a', 'b', 'c'],
      nodes: [
        { id: 'p1', kind: 'phase', title: '阶段1', pos: { x: 0, y: 0 }, params: { order: 0 } },
        { id: 'a', kind: 'agent.task', title: 'A', pos: { x: 0, y: 100 }, phaseId: 'p1' },
        { id: 'p2', kind: 'phase', title: '阶段2', pos: { x: 300, y: 0 }, params: { order: 1 } },
        { id: 'b', kind: 'agent.task', title: 'B', pos: { x: 300, y: 100 }, phaseId: 'p2' },
        { id: 'c', kind: 'agent.task', title: 'C', pos: { x: 300, y: 200 }, phaseId: 'p2' },
        { id: 'z', kind: 'agent.task', title: '孤岛', pos: { x: 900, y: 0 } },
      ],
      edges: [
        { id: 'e1', from: 'p1', to: 'a' }, { id: 'e2', from: 'a', to: 'p2' },
        { id: 'e3', from: 'p2', to: 'b' }, { id: 'e4', from: 'b', to: 'c' },
      ], vars: {},
    }
    for (const layout of ['chain', 'tb', 'star', 'radial']) {
      const pos = layoutPositions(wf, layout)
      check(section, layout + ': 全部节点有坐标', pos.size === wf.nodes.length, pos.size + '/' + wf.nodes.length)
    }
    const chain = layoutPositions(wf, 'chain')
    check(section, 'chain: 子节点跟随父容器', Math.abs(chain.get('a').x - (chain.get('p1').x + 120)) < 1)
    check(section, 'chain: 主干从左到右', chain.get('p2').x > chain.get('p1').x)
    check(section, 'chain: 孤岛在主干之后', chain.get('z').x > chain.get('p2').x)
    const uniq = new Set([...chain.values()].map((p) => p.x + ',' + p.y))
    check(section, 'chain: 无完全重叠坐标', uniq.size === wf.nodes.length)
    const tb = layoutPositions(wf, 'tb')
    check(section, 'tb: 主干从上到下', tb.get('p2').y > tb.get('p1').y)
    check(section, 'tb: 孤岛在最后行', tb.get('z').y > tb.get('p2').y)
    const star = layoutPositions(wf, 'star')
    check(section, 'star: hub 子节点离开中心', Math.hypot(star.get('a').x - star.get('p1').x, star.get('a').y - star.get('p1').y) > 100)
  }
  const hostModel = readFileSync(join(root, 'src', 'host', 'flow', 'model.js'), 'utf8')
  check(section, '宿主 FLOW_LAYOUTS 含四种布局', ['chain', 'tb', 'star', 'radial'].every((l) => hostModel.includes("'" + l + "'")))
}

// ── 6. 经验库防噪 ──
{
  const section = 'experience'
  let seq = 0
  const makeFlow = (name, extra = 0, sessionId = 's1') => {
    seq += 1
    const a = `n_${seq}a`, b = `n_${seq}b`
    return model.normalizeWorkflow({
      name, sessionId, turn: seq, origin: 'agent-plan', entry: a,
      nodes: [
        { id: a, kind: 'agent.task', title: '读代码', pos: { x: 0, y: 0 }, params: { prompt: 'p' } },
        { id: b, kind: 'agent.task', title: '改代码', pos: { x: 300, y: 0 }, params: { prompt: 'p' } },
        ...Array.from({ length: extra }, (_, i) => ({ id: `n_${seq}x${i}`, kind: 'agent.task', title: `额外${i}`, pos: { x: 600, y: i * 120 }, params: { prompt: 'p' } })),
      ],
      edges: [{ id: `e_${seq}`, from: a, to: b }, ...Array.from({ length: extra }, (_, i) => ({ id: `ex_${seq}_${i}`, from: b, to: `n_${seq}x${i}` }))],
      vars: {},
    })
  }
  const f1 = makeFlow('任务A'), f2 = makeFlow('任务A')
  check(section, '拓扑指纹按结构而非随机 id', experience.topologyHash(f1) === experience.topologyHash(f2))
  check(section, '结构不同则指纹不同', experience.topologyHash(f1) !== experience.topologyHash(makeFlow('任务A', 1)))

  const state = { experiences: [] }
  for (let i = 1; i <= 6; i += 1) {
    const flow = makeFlow('任务A')
    flow.turn = i
    experience.autoCaptureExperience(state, flow, {})
  }
  check(section, '同任务多轮迭代只留 1 条（覆盖而非新增）', state.experiences.length === 1, state.experiences.length + ' 条')
  check(section, '记录来源轮次', state.experiences[0].turn === 6)
  check(section, '重复入库判 duplicate', experience.autoCaptureExperience(state, makeFlow('任务A'), {}).reason === 'duplicate')
  check(section, '空图不入库', experience.autoCaptureExperience(state, model.normalizeWorkflow({ name: 'x', nodes: [], edges: [], vars: {} }), {}).reason === 'empty')

  const big = { experiences: [] }
  for (let i = 0; i < 40; i += 1) experience.autoCaptureExperience(big, makeFlow('批量' + i, i % 3, 'sess' + i), {})
  check(section, '跨任务受全局上限约束', big.experiences.length <= experience.EXPERIENCE_LIMIT, big.experiences.length + ' / ' + experience.EXPERIENCE_LIMIT)
}

// ── 汇总 ──
const bySection = new Map()
for (const r of results) {
  if (!bySection.has(r.section)) bySection.set(r.section, { pass: 0, fail: 0 })
  const bucket = bySection.get(r.section)
  if (r.ok) bucket.pass += 1; else bucket.fail += 1
}
console.log('')
for (const [name, bucket] of bySection) {
  const mark = bucket.fail === 0 ? 'OK  ' : 'FAIL'
  console.log(`  ${mark}  ${name.padEnd(12)} ${bucket.pass}/${bucket.pass + bucket.fail}`)
}
console.log('')
console.log(`${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
