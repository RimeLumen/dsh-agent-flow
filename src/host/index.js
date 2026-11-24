/*! dsh-agent-flow v0.1.0 | Copyright (c) 2026 RimeLumen | MIT License */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_PREFS, Store, strList } from './store.js'
import { createErrorSink } from './errors.js'
import { buildCatalog, catalogCacheFrom, loadSkillBody, scopeFor } from './catalog.js'
import {
  ESCAPE_TOOLS,
  attachSelectionLifecycle,
  buildSelectionText,
  ensureDefaultProfile,
  resolveEffective,
} from './selection.js'
import { RunRegistry } from './flow/scheduler.js'
import { createEmptyWorkflow, normalizeWorkflow } from './flow/model.js'
import { createPlanManager, phasesToWorkflow } from './plan.js'
import { decomposePrompt } from './decompose.js'
import { composePrompt } from './compose.js'
import { registerRoutes } from './routes/index.js'

export const PLAN_FIRST_TEXT = [
  '【Agent Flow · 计划先行（本轮必做）】',
  '在开始本轮任何实际工作之前：',
  '1) 调用 flow_plan，用 steps 数组把本轮流程画到画布上：每步至少一个 title，可按需给 kind / prompt / detail / optional / substeps；',
  '1b) 有阶段的任务改用 phases：Phase1/2/3 + 各自的 subtasks，逻辑前置用 reliesOn（写别的步骤标题）表达——顺序边是虚线、依赖边是实线带箭头，两者可以同时存在；还可以给 mode（task/design）与 layout（chain/star/radial）；',
  '2) flow_plan 的返回里 status 说明用户的选择：confirmed 或 adjusted → 按画布上的流程开始执行（adjust 后以返回的 steps 为准）；skipped → 用户不想等待，直接开始；timeout → 按你画的流程继续，并在回复里说明未获确认；',
  '3) 用户可能直接在画布上改流程或连线，执行时以流程节点为准，不要照抄最初的草稿；',
  '4) 每轮只画一次；本轮流程发生实质变化时重新调用 flow_plan 更新画布。',
  '5) 用户确认计划后开始执行时：用 flow_progress 上报进度——优先传 flow_plan 返回的节点 id（省 token）：{ nodeId, status: "running" }，完成 "succeeded"，失败 "failed"；连续多个状态变化可合并为一次 items 批量上报。画布会实时点亮对应节点与连线。',
].join('\n')

export const name = 'agent-flow'

export const inject = []

export const VERSION = (() => {
  try {
    // 从 src/host/ 到仓库根是两级（此前写成一级 '../package.json'，
    // 会解析到不存在的 src/package.json，被 catch 吞掉 → VERSION 恒为 unknown）
    const url = new URL('../../package.json', import.meta.url)
    return JSON.parse(readFileSync(fileURLToPath(url), 'utf8')).version ?? 'unknown'
  } catch {
    return 'unknown'
  }
})()

function normalizeConfig(config) {
  const input = config !== null && typeof config === 'object' ? config : {}
  const mode = ['index', 'preload', 'whitelist'].includes(input.mode) ? input.mode : DEFAULT_PREFS.mode
  return {
    mode,
    promptBudget: Number.isFinite(Number(input.promptBudget))
      ? Math.max(1000, Math.min(200000, Math.floor(Number(input.promptBudget))))
      : DEFAULT_PREFS.promptBudget,
    lockoutGuard: input.lockoutGuard !== false,
    maxParallel: Number.isFinite(Number(input.maxParallel))
      ? Math.max(1, Math.min(8, Math.floor(Number(input.maxParallel))))
      : DEFAULT_PREFS.maxParallel,
    nodeTimeoutMs: Number.isFinite(Number(input.nodeTimeoutMs))
      ? Math.max(1000, Math.min(3600000, Math.floor(Number(input.nodeTimeoutMs))))
      : DEFAULT_PREFS.nodeTimeoutMs,
    escapeTools: Array.isArray(input.escapeTools) ? strList(input.escapeTools) : [...ESCAPE_TOOLS],

    planFirst: input.planFirst !== false,

    planTimeoutMs: Number.isFinite(Number(input.planTimeoutMs))
      ? Math.max(5000, Math.min(3600000, Math.floor(Number(input.planTimeoutMs))))
      : 120000,
  }
}

export function apply(ctx, config) {
  const configDefaults = normalizeConfig(config)
  const log = (message) => {
    try {
      console.log(`[agent-flow] ${message}`)
    } catch {
    }
  }

  const store = new Store()
  const registry = new RunRegistry()

  const errors = createErrorSink({ dir: join(store.dir, 'errors') })

  const plans = createPlanManager({ store, errors, log })

  const runtime = {}

  const toolRegistration = { flow_status: false, flow_plan: false }

  const effectiveFor = (sessionId) => {
    const state = store.state
    const eff = resolveEffective(state, { sessionId })
    if (state.prefsLocked !== true) {
      return {
        ...eff,
        mode: state.profiles.length === 0 ? configDefaults.mode : eff.mode,
        promptBudget: state.profiles.length === 0 ? configDefaults.promptBudget : eff.promptBudget,
        lockoutGuard: configDefaults.lockoutGuard && eff.lockoutGuard !== false,
      }
    }
    return { ...eff, lockoutGuard: configDefaults.lockoutGuard && eff.lockoutGuard !== false }
  }

  const textFor = async (eff) => {
    if (!eff) return ''
    const cache = store.catalogCache ?? {}

    const bodies = []
    if (eff.mode === 'preload' && Array.isArray(eff.skillPreload) && eff.skillPreload.length > 0) {
      let used = 0
      for (const skillName of eff.skillPreload) {
        if (used >= eff.promptBudget) break
        const body = await loadSkillBody(ctx, skillName, {})
        if (!body) continue
        const remaining = eff.promptBudget - used
        const content = body.content.length > remaining ? `${body.content.slice(0, remaining)}\n…（截断）` : body.content
        used += content.length
        bodies.push({ name: skillName, content })
      }
    }
    return buildSelectionText(eff, cache, bodies)
  }

  const lifecycle = attachSelectionLifecycle(ctx, {
    getEffective: effectiveFor,
    getText: textFor,
    knownToolNames: () => store.catalogCache?.knownToolNames ?? [],
    escapeTools: configDefaults.escapeTools,
    logger: log,
  })

  let refreshTimer = null
  const scheduleRefresh = () => {
    if (refreshTimer) clearTimeout(refreshTimer)
    refreshTimer = setTimeout(() => {
      refreshTimer = null
      void refresh().catch((error) => log(`catalog refresh failed: ${error instanceof Error ? error.message : String(error)}`))
    }, 1200)
  }
  const refresh = async (options = {}) => {
    const snapshot = await buildCatalog(ctx, { sessionId: options.sessionId, cwd: options.cwd, groups: store.state.groups })
    const defaultResult = ensureDefaultProfile(store.state, {
      officialToolNames: snapshot.officialToolNames,
      modelInvocableSkillNames: snapshot.modelInvocableSkillNames,
      allToolNames: snapshot.knownToolNames,
      allSkillNames: snapshot.knownSkillNames,
    })
    if (defaultResult.changed) {
      await store.flush()
      store.emit()
      log(`default profile ready (${defaultResult.profile.tools.allow.length} tools / ${defaultResult.profile.skills.index.length} skills, auto=${defaultResult.profile.auto === true})`)
    }
    store.catalogCache = catalogCacheFrom(snapshot)
    for (const warning of snapshot.warnings) log(`catalog: ${warning}`)
    for (const error of snapshot.errors) log(`catalog error: ${error}`)
    return snapshot
  }
  runtime.refreshCatalog = refresh

  ctx.on('tools/change', scheduleRefresh)
  ctx.on('skills/change', scheduleRefresh)

  const registerPlanFirst = (agent) => {
    if (!agent || !agent.ctx) return false
    if (configDefaults.planFirst === false) return false
    if (agent.session && agent.session.parentSession) return false
    try {
      agent.ctx.systemPrompt.section({ name: 'agent-flow/plan-first', order: 153, text: PLAN_FIRST_TEXT })
      log(`plan-first section registered for session ${agent.id}`)
      return true
    } catch (error) {
      log(`plan-first section was not registered: ${error instanceof Error ? error.message : String(error)}`)
      return false
    }
  }

  // 子代理画布继承（用户指令②）：子代理（session.parentSession 有值）创建时，
  // 复制父会话最新活动画布为子会话画布（origin='inherit'，lanes.main=父级快照）。
  // 子代理后续 flow_plan 的产出由 plan.js 的追加分支写进 sub 泳道，父级节点永保留。
  const inheritParentCanvas = (agent) => {
    try {
      const sessionId = agent?.id ?? ''
      const parentSessionId = agent?.session?.parentSession ?? null
      if (!sessionId || !parentSessionId) return
      if (store.state.workflows.some((item) => item.sessionId === sessionId && !item.archivedAt)) return
      const parent = [...store.state.workflows].reverse().find((item) => item.sessionId === parentSessionId && !item.archivedAt)
      if (!parent) return
      const makeId = () => `n_${Math.random().toString(36).slice(2, 8)}`
      const workflow = normalizeWorkflow({
        ...JSON.parse(JSON.stringify(parent)),
        id: `wf_${Math.random().toString(36).slice(2, 10)}`,
        sessionId,
        origin: 'inherit',
        inheritedFrom: parentSessionId,
        archivedAt: undefined,
        updatedAt: undefined,
      })
      const idMap = new Map()
      for (const node of workflow.nodes) {
        const nextId = makeId()
        idMap.set(node.id, nextId)
        node.id = nextId
      }
      workflow.entry = idMap.get(parent.entry) ?? workflow.nodes[0]?.id ?? ''
      for (const edge of workflow.edges) {
        edge.from = idMap.get(edge.from) ?? edge.from
        edge.to = idMap.get(edge.to) ?? edge.to
        edge.id = `e_${edge.from}_${edge.to}`
      }
      workflow.lanes = [{ id: 'main', label: '父级', nodeIds: workflow.nodes.map((node) => node.id) }]
      void store.mutate((state) => {
        if (!state.workflows.some((item) => item.sessionId === sessionId)) state.workflows.push(workflow)
      }).catch((error) => {
        log(`inherit canvas was not persisted: ${error instanceof Error ? error.message : String(error)}`)
      })
      log(`inherit canvas for subagent ${sessionId.slice(-6)} from ${parentSessionId.slice(-6)} (${workflow.nodes.length} nodes)`)
    } catch (error) {
      log(`inherit canvas failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  ctx.on('agent/created', (payload) => {
    registerPlanFirst(payload?.agent)
    inheritParentCanvas(payload?.agent)
  })

  // R4.2 会话结束清理：draftTurns 按 sessionId 累积（长驻宿主缓慢泄漏），agent 离开注册表时摘除
  ctx.on('agent/disposed', (payload) => {
    const sessionId = payload?.agent?.id ?? ''
    if (sessionId) draftTurns.delete(sessionId)
  })

  // 插件自主拆解（Q1/Q4）：用户消息进入 inbox 时，插件自己把提示词拆成阶段+子任务，
  // 连好线（复用 phasesToWorkflow 的边生成），产出 'auto-draft' 草稿画布。
  // 已有的 agent-plan 画布优先——不覆盖 Agent 自己画的流程。
  const draftTurns = new Map()
  ctx.on('agent/inbox/inserted', ({ agent, message } = {}) => {
    try {
      const sessionId = agent?.id ?? ''
      if (!sessionId) return
      // 防御式取文本：content 可能是字符串，也可能是内容块数组（DSH 实际为 ContentBlock[]）
      const content = message?.content
      const text = typeof content === 'string'
        ? content
        : (Array.isArray(content)
          ? content.filter((block) => block && (block.type === 'text' || typeof block.text === 'string'))
            .map((block) => String(block.text ?? '')).join(' ')
          : '')
      if (text.trim().length < 12) return
      // 同一条消息只拆一次
      const seen = draftTurns.get(sessionId)
      if (seen === message?.id) return
      draftTurns.set(sessionId, message?.id)
      // Agent 已发布计划则不打扰
      const existing = store.state.workflows.filter((item) => item.sessionId === sessionId && !item.archivedAt)
      if (existing.some((item) => item.origin === 'agent-plan')) return
      const toolNames = [...(store.catalogCache?.tools?.values() ?? [])].map((tool) => tool.name)
      const draft = decomposePrompt(text, { tools: toolNames })
      if (draft.isTrivial || draft.phases.length === 0) return
      const built = phasesToWorkflow({
        title: '草稿 · ' + draft.title,
        phases: draft.phases.map((phase) => ({
          title: phase.title,
          subtasks: phase.subtasks.map((sub) => ({ title: sub.title, kind: sub.kind, prompt: sub.title, tool: sub.tool })),
        })),
      }, { sessionId, origin: 'auto-draft' })
      const workflow = built.workflow
      void store.mutate((state) => {
        // 同会话已有草稿：替换（不堆积）
        const before = state.workflows.length
        state.workflows = state.workflows.filter((item) => !(item.sessionId === sessionId && item.origin === 'auto-draft'))
        state.workflows.push(workflow)
        return state.workflows.length - before
      }).catch(() => {})
      log('auto-draft canvas: ' + workflow.nodes.length + ' nodes, ' + workflow.edges.length + ' edges')
    } catch (error) {
      log('auto-draft failed: ' + (error instanceof Error ? error.message : String(error)))
    }
  })

  // 执行氛围（用户反馈②）：Agent 工作状态全局可见，画布据此点亮执行中。
  ctx.on('agent/status', (payload) => {
    try {
      const sessionId = payload?.agent?.id ?? ''
      if (!sessionId) return
      store.state.sessionBusy = { ...(store.state.sessionBusy ?? {}), [sessionId]: payload?.status === 'running' }
      store.emit()
    } catch (error) {
      // R6 审计修正：status 广播失败不再无痕吞掉（sessionBusy 驱动画布执行中态）
      log(`sessionBusy update failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  })

  ctx.on('session/created', (session) => {
    let workflow = null
    try {
      const sessionId = typeof session?.id === 'string' ? session.id : ''
      if (sessionId === '') return
      const header = session?.header
      if (header?.origin === 'subagent' || header?.parentSession) return
      if (store.state.workflows.some((item) => item.sessionId === sessionId && !item.archivedAt)) return
      workflow = createEmptyWorkflow(`新对话 · ${sessionId.slice(-6)}`, { sessionId, origin: 'session' })
    } catch (error) {
      log(`session canvas was not created: ${error instanceof Error ? error.message : String(error)}`)
      return
    }
    void store.mutate((state) => {
      if (!state.workflows.some((item) => item.sessionId === workflow.sessionId)) state.workflows.push(workflow)
    }).catch((error) => {
      log(`session canvas was not persisted: ${error instanceof Error ? error.message : String(error)}`)
    })
  })
  ctx.effect(() => () => {
    lifecycle.disposeAll()
    if (refreshTimer) clearTimeout(refreshTimer)
  })

  ctx.inject(['webServer'], (injected) => {
    const routes = registerRoutes({
      ctx: injected,
      store,
      registry,
      errors,
      plans,
      toolRegistration,
      version: VERSION,
      logger: log,
      lifecycle,
      escapeTools: configDefaults.escapeTools,
      planFirst: configDefaults.planFirst,
      planTimeoutMs: () => (Number(store.state.prefs?.planTimeoutMs) > 0 ? Number(store.state.prefs.planTimeoutMs) : configDefaults.planTimeoutMs),
      buildCatalog: (options) => buildCatalog(injected, { ...options, groups: store.state.groups }),
      agentFor: (sessionId) => scopeFor(injected, sessionId),
    })
    log('routes mounted at /api/agent-flow')
    return () => {
      try {
        routes?.disposer?.()
      } catch {
      }
    }
  })

  ctx.inject(['tools'], (injected) => {
    const tools = injected.get('tools')
    if (!tools || typeof tools.register !== 'function') return undefined
    // R6.1 工具定义文件化：注册流程移入 flow-tools.js（setupFlowTools），deps 显式注入
    return setupFlowTools({ store, registry, plans, effectiveFor, configDefaults, log, toolRegistration }, (def) => tools.register(def))
  })

  void store
    .load()
    .then(async () => {
      if (!store.state.prefsLocked) {
        store.state.prefs = {
          ...DEFAULT_PREFS,
          mode: configDefaults.mode,
          promptBudget: configDefaults.promptBudget,
          lockoutGuard: configDefaults.lockoutGuard,
          maxParallel: configDefaults.maxParallel,
          nodeTimeoutMs: configDefaults.nodeTimeoutMs,
        }
      }
      if (store.loadError) log(`state load error: ${store.loadError}`)
      for (const note of store.loadNotes) log(`state: ${note}`)
      log(`state loaded from ${store.file} (${store.state.profiles.length} profiles, ${store.state.workflows.length} flows)`)
      // 启动并行（性能审计 S-A）：目录构建与逐会话恢复互不依赖，串行会让
      // 大目录场景的会话恢复被线性拖后。allSettled 保证互不影响，失败各自留痕。
      // registerPlanFirst 必须同步先行（计划协议注册先于恢复）。
      const agents = ctx.get('agents')
      const reapplyTasks = agents && typeof agents.list === 'function'
        ? agents.list().map((agent) => {
          registerPlanFirst(agent)
          return lifecycle.reapply(agent.id)
            .catch((error) => log(`reapply failed for ${agent.id}: ${error instanceof Error ? error.message : String(error)}`))
        })
        : []
      await Promise.allSettled([
        refresh().catch((error) => log(`initial catalog refresh failed: ${error instanceof Error ? error.message : String(error)}`)),
        ...reapplyTasks,
      ])
    })
    .catch((error) => log(`state load failed: ${error instanceof Error ? error.message : String(error)}`))
}
