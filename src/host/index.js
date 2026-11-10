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
import { createEmptyWorkflow } from './flow/model.js'
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
  '5) 用户确认计划后开始执行时：每开始一个步骤调用 flow_progress({ title: 步骤标题, status: "running" })，完成时 status: "succeeded"（失败 status: "failed"）——画布会实时点亮对应节点与连线，用户能看到你的进度。',
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

  ctx.on('agent/created', (payload) => {
    registerPlanFirst(payload?.agent)
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
    } catch {
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
    try {
      const dispose = tools.register({
        name: 'flow_status',
        description:
          'Read-only Agent Flow status for this session: saved flow definitions, recent runs, and the currently injected context selection. Use it before starting or debugging a flow from the canvas.',
        parameters: {
          type: 'object',
          properties: {
            workflowId: { type: 'string', description: 'Optional: report one flow definition in detail.' },
            includeDefinitions: { type: 'boolean', description: 'Include every saved flow definition with its node kinds.' },
          },
          additionalProperties: false,
        },
        output: {
          schema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] },
          render: (_args, value) => [{ type: 'text', text: String(value?.text ?? '') }],
        },
        async execute(args = {}, exec) {
          const sessionId = exec?.agent?.id ?? ''
          const lines = []
          const eff = effectiveFor(sessionId)
          lines.push(`当前注入：模式=${eff.mode} 预设=${eff.profileName ?? '（无）'} 作用域=${eff.source}`)
          lines.push(`技能：预载 ${eff.skillPreload.length} / 索引 ${eff.skillIndex.length}；工具白名单：${eff.toolAllow ? `${eff.toolAllow.length} 项` : '未限制'}`)
          const runs = registry.list().filter((run) => !sessionId || run.sessionId === sessionId).slice(0, 5)
          const bound = sessionId ? store.state.workflows.filter((item) => item.sessionId === sessionId) : []
          if (sessionId) {
            if (bound.length === 0) lines.push('会话画布：本会话还没有绑定流程（首次 flow_plan 会自动创建并绑定）。')
            else {
              const latest = bound[bound.length - 1]
              lines.push(`会话画布：${bound.length} 条绑定本会话；当前轮次 turn=${latest.turn ?? 0}（${latest.name} · ${latest.id}）`)
            }
          }
          if (runs.length === 0) lines.push('本会话没有运行记录。')
          else {
            lines.push('最近运行：')
            for (const run of runs) {
              const running = run.cursor.length > 0 ? ` 当前节点 ${run.cursor.join('、')}` : ''
              lines.push(`- ${run.id}｜${run.workflowName || run.workflowId}｜${run.status}${running}`)
            }
          }
          const wanted = typeof args.workflowId === 'string' && args.workflowId !== ''
            ? store.state.workflows.filter((item) => item.id === args.workflowId)
            : args.includeDefinitions === true
              ? store.state.workflows
              : []
          for (const workflow of wanted) {
            lines.push(`流程 ${workflow.id}「${workflow.name}」：${workflow.nodes.length} 个节点`)
            for (const node of workflow.nodes) lines.push(`  - ${node.id} [${node.kind}] ${node.title}`)
          }
          return { text: lines.join('\n') }
        },
      })
      toolRegistration.flow_status = true
      log('flow_status tool registered')

      try {
        const disposePlan = tools.register({
          name: 'flow_plan',
          description:
            'Publish this turn\'s plan as a node graph on the Agent Flow canvas and wait for the user to confirm or adjust it. Call this BEFORE doing the work of a turn. Returns a status: confirmed/adjusted (proceed with the returned steps), skipped (the user does not want to wait), or timeout (proceed and say it was not confirmed).',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Short plan title shown on the canvas.' },
              summary: { type: 'string', description: 'One or two lines on what this turn will do.' },
              steps: {
                type: 'array',
                description: 'The steps of this turn, in order. Each becomes a node; substeps become child steps bound to the parent node.',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string', description: 'Step title (required).' },
                    kind: { type: 'string', description: 'Optional node kind: agent.task (default), tool.call, human.checkpoint, io.output, inject.skill, flow.wait, flow.parallel, branch.condition…' },
                    prompt: { type: 'string', description: 'What to do in this step (for agent.task / human.checkpoint).' },
                    detail: { type: 'string', description: 'Extra detail for the node summary.' },
                    optional: { type: 'boolean', description: 'When true the step may be skipped on failure.' },
                    tool: { type: 'string', description: 'Tool name for kind=tool.call.' },
                    args: { type: 'string', description: 'JSON string of tool arguments for kind=tool.call.' },
                    allowDangerous: { type: 'boolean', description: 'Set true only for a deliberately dangerous tool call.' },
                    substeps: {
                      type: 'array',
                      description: 'Child steps (a/b/c) bound to this parent step.',
                      items: {
                        type: 'object',
                        properties: {
                          title: { type: 'string' },
                          kind: { type: 'string' },
                          prompt: { type: 'string' },
                        },
                        required: ['title'],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ['title'],
                  additionalProperties: false,
                },
              },
            },
            mode: { type: 'string', enum: ['task', 'design'], description: 'task (default): a plan produced from this turn\'s text. design: rebuild a plan from a saved experience skeleton.' },
            layout: { type: 'string', enum: ['chain', 'star', 'radial'], description: 'Preferred canvas layout; switching it later only changes coordinates, not data.' },
            phases: {
              type: 'array',
              description: 'Structured plan: Phase 1/2/3, each with its own subtasks. Prefer this over steps for anything with stages. Write logical prerequisites as reliesOn: ["<title of another step>"]; unresolvable titles are reported back as warnings instead of being dropped silently.',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string', description: 'Phase title, e.g. "Phase 1 现状梳理".' },
                  goal: { type: 'string', description: 'What this phase must achieve, one line.' },
                  subtasks: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        kind: { type: 'string' },
                        prompt: { type: 'string' },
                        detail: { type: 'string' },
                        tool: { type: 'string' },
                        args: { type: 'string' },
                        allowDangerous: { type: 'boolean' },
                        reliesOn: {
                          type: 'array',
                          items: { type: 'string' },
                          description: 'Titles (or node ids) this subtask logically depends on; drawn as a solid dependency arrow.',
                        },
                      },
                      required: ['title'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['title'],
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
          output: {
            schema: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                text: { type: 'string' },
                workflowId: { type: 'string' },
                warnings: { type: 'array', items: { type: 'object' } },
              },
              required: ['text'],
            },
            render: (_args, value) => [{ type: 'text', text: String(value?.text ?? '') }],
          },
          timeoutMs: configDefaults.planTimeoutMs + 15000,
          async execute(args = {}, exec) {
            const sessionId = exec?.agent?.id ?? ''
            const published = await plans.publish(sessionId, args)
            const timeoutMs = Number(store.state.prefs?.planTimeoutMs) > 0
              ? Number(store.state.prefs.planTimeoutMs)
              : configDefaults.planTimeoutMs
            const result = await plans.waitFor(sessionId, timeoutMs, exec?.signal)
            const lines = []
            if (result.status === 'confirmed') lines.push('用户已确认你的计划。'
              )
            else if (result.status === 'adjusted') lines.push('用户在画布上调整了计划，请以下面的步骤为准。')
            else if (result.status === 'skipped') lines.push('用户选择跳过确认（不想等待）。直接开始工作，不要再来问一次。')
            else if (result.status === 'replaced') lines.push('这份计划已被同一会话的下一轮计划替换（可能你在同一轮里调用了两次）。以最新一次画布内容为准，不要重复等待。')
            else if (result.status === 'timeout') lines.push(`等待确认超时（${timeoutMs}ms）：按你画的计划继续，并在回复中说明这一步未获人工确认。`)
            else lines.push('计划确认流程被中断：按你画的计划继续。')
            lines.push(`画布上的流程：${published.workflow.name}（${published.workflow.nodes.length} 个节点）`)
            for (const step of published.plan.steps) {
              lines.push(`- ${step.title}${Array.isArray(step.children) && step.children.length > 0 ? `（含 ${step.children.length} 个子步骤）` : ''}`)
            }
            if (Array.isArray(published.plan.phases) && published.plan.phases.length > 0) {
              const modeLabel = published.plan.mode === 'design' ? '设计' : '任务'
              lines.push(`阶段（${modeLabel}模式 · 布局 ${published.plan.layout}）：${published.plan.phases.map((phase) => phase.title).join(' / ')}`)
            }
            const warnings = Array.isArray(published.plan.warnings) ? published.plan.warnings : []
            if (warnings.length > 0) {
              lines.push('引用警告（这些 reliesOn 没找到对应节点，依赖边已跳过；改成图里真实存在的标题即可）：')
              for (const warning of warnings.slice(0, 8)) lines.push(`- ${warning.message}`)
            }
            return { status: result.status, text: lines.join('\n'), workflowId: published.workflow.id, warnings }
          },
        })
        toolRegistration.flow_plan = true
        log('flow_plan tool registered')

      // 用户反馈：工作中实时更新画布——Agent 执行时经 flow_progress 上报节点状态，画布实时点亮。
      try {
        const disposeProgress = tools.register({
          name: 'flow_progress',
          description: 'Report step progress for this session\'s flow canvas while executing the confirmed plan. Call when a step starts (status "running"), succeeds ("succeeded") or fails ("failed"). The canvas lights up the matching node and its edges in real time.',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Step title exactly as drawn on the canvas (matches by title, first hit).' },
              status: { type: 'string', enum: ['running', 'succeeded', 'failed'], description: 'New status of the step.' },
            },
            required: ['title', 'status'],
            additionalProperties: false,
          },
          output: {
            schema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] },
            render: (_args, value) => [{ type: 'text', text: String(value?.text ?? '') }],
          },
          async execute(args = {}, exec) {
            const sessionId = exec?.agent?.id ?? ''
            const status = ['running', 'succeeded', 'failed'].includes(args.status) ? args.status : 'running'
            const title = String(args.title ?? '')
            const updated = await store.mutate((state) => {
              const workflow = state.workflows.find((item) => item.sessionId === sessionId && !item.archivedAt)
                ?? state.workflows.find((item) => item.sessionId === sessionId)
              if (!workflow) return null
              // 同名节点（用户手画可能撞名）：优先命中尚未完成的第一个，避免重复标题永远点亮同一个。
              const node = workflow.nodes.find((item) => item.title === title && (workflow.nodeStatus?.[item.id] ?? 'idle') !== 'succeeded')
                ?? workflow.nodes.find((item) => item.title.toLowerCase() === title.toLowerCase() && (workflow.nodeStatus?.[item.id] ?? 'idle') !== 'succeeded')
                ?? workflow.nodes.find((item) => item.title === title)
                ?? workflow.nodes.find((item) => item.title.toLowerCase() === title.toLowerCase())
              if (!node) return null
              const nodeStatus = { ...(workflow.nodeStatus ?? {}) }
              if (status === 'running') {
                for (const [id, previous] of Object.entries(nodeStatus)) {
                  if (previous === 'running' && id !== node.id) nodeStatus[id] = 'succeeded'
                }
              }
              nodeStatus[node.id] = status
              workflow.nodeStatus = nodeStatus
              workflow.updatedAt = new Date().toISOString()
              return { workflowId: workflow.id, nodeId: node.id, status }
            })
            const text = updated
              ? `画布已更新：${title} → ${status}`
              : `画布上没有找到步骤「${title}」——请用画布上真实存在的步骤标题。`
            return { text }
          },
        })
        toolRegistration.flow_progress = true
        log('flow_progress tool registered')
      } catch (error) {
        toolRegistration.flow_progress = false
        log(`flow_progress tool was not registered: ${error instanceof Error ? error.message : String(error)}`)
      }

      // 反向组合（批次 3）：把当前画布组合成可执行的提示词，交回给 Agent。
      try {
        const disposeCompose = tools.register({
          name: 'flow_compose',
          description: 'Turn the current session\'s flow canvas into an executable prompt, so the arrangement on the canvas becomes work the agent can run. Use it after the user edits the canvas.',
          parameters: {
            type: 'object',
            properties: {
              goal: { type: 'string', description: 'Optional one-line goal placed at the top of the composed prompt.' },
              workflowId: { type: 'string', description: 'Optional flow id; defaults to this session\'s active canvas.' },
            },
            additionalProperties: false,
          },
          output: {
            schema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] },
            render: (_args, value) => [{ type: 'text', text: String(value?.text ?? '') }],
          },
          async execute(args = {}, exec) {
            const sessionId = exec?.agent?.id ?? ''
            const workflow = args.workflowId
              ? store.state.workflows.find((item) => item.id === args.workflowId)
              : (store.state.workflows.find((item) => item.sessionId === sessionId && !item.archivedAt)
                ?? store.state.workflows.find((item) => item.sessionId === sessionId))
            if (!workflow) return { text: '当前会话还没有画布：先用 flow_plan 画一张，或在画布上手工搭一个流程。' }
            const result = composePrompt(workflow, { goal: args.goal })
            const warns = result.warnings.length > 0
              ? '\n\n> 图的结构提醒：' + result.warnings.map((item) => item.message).join('；')
              : ''
            return { text: result.text + warns }
          },
        })
        toolRegistration.flow_compose = true
        log('flow_compose tool registered')
      } catch (error) {
        toolRegistration.flow_compose = false
        log(`flow_compose tool was not registered: ${error instanceof Error ? error.message : String(error)}`)
      }

        return () => {
          try {
            disposePlan?.()
          } catch {
          }
          try {
            dispose?.()
          } catch {
          }
        }
      } catch (error) {
        log(`flow_plan tool was not registered: ${error instanceof Error ? error.message : String(error)}`)
      }

      return () => {
        try {
          dispose?.()
        } catch {
        }
      }
    } catch (error) {
      log(`flow_status tool was not registered: ${error instanceof Error ? error.message : String(error)}`)
      return undefined
    }
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
      await refresh().catch((error) => log(`initial catalog refresh failed: ${error instanceof Error ? error.message : String(error)}`))
      const agents = ctx.get('agents')
      if (agents && typeof agents.list === 'function') {
        for (const agent of agents.list()) {
          try {
            await lifecycle.reapply(agent.id)
          } catch (error) {
            log(`reapply failed for ${agent.id}: ${error instanceof Error ? error.message : String(error)}`)
          }
          registerPlanFirst(agent)
        }
      }
    })
    .catch((error) => log(`state load failed: ${error instanceof Error ? error.message : String(error)}`))
}
