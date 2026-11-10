/*! dsh-agent-flow v0.1.0 | Copyright (c) 2026 RimeLumen | MIT License */
import { loadSkillBody } from '../catalog.js'
import { buildSelectionText, resolveEffective } from '../selection.js'
import { runExpr } from './expr.js'
import { edgesFromPort } from './model.js'

const DANGEROUS_TOOL_PATTERNS = [
  /^write$/,
  /^edit$/,
  /^bash$/,
  /^pwsh$/,
  /^terminal_/,
  /^kill_/,
  /^job_kill$/,
  /^subagent$/,
  /^spawn_teammate$/,
  /^team_task_/,
  /^workflow$/,
  /^plugin_manager$/,
  /^task_board_/,
  /^schedule_/,
  /^cordis_/,
  /^lsp$/,
]

export function isDangerousTool(name) {
  return DANGEROUS_TOOL_PATTERNS.some((pattern) => pattern.test(String(name || '')))
}

export class NodeError extends Error {

  constructor(code, message) {
    super(message)
    this.name = 'NodeError'
    this.code = code
  }
}

export function blocksToText(blocks) {
  if (!Array.isArray(blocks)) return ''
  const parts = []
  for (const block of blocks) {
    if (block === null || typeof block !== 'object') continue
    if (block.type === 'text' && typeof block.text === 'string') parts.push(block.text)
  }
  return parts.join('\n').trim()
}

export function userMessage(text) {
  return {
    id: `msg_${Math.random().toString(36).slice(2, 12)}`,
    role: 'user',
    content: [{ type: 'text', text: String(text ?? '') }],
    source: { kind: 'user' },
  }
}

export function renderTemplate(template, scope) {
  const source = String(template ?? '')
  return source.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, rawPath) => {
    const parsed = runExpr(rawPath, scope)
    if (!parsed.ok) return `{{${rawPath}}}`
    const value = parsed.value
    if (value === undefined || value === null) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  })
}

function renderArgs(template, scope) {
  const raw = typeof template === 'string' ? template.trim() : ''
  if (raw === '') return {}
  const rendered = renderTemplate(raw, scope)
  let parsed
  try {
    parsed = JSON.parse(rendered)
  } catch (error) {
    throw new NodeError('BAD_ARGS', `参数模板渲染后不是合法 JSON：${error instanceof Error ? error.message : String(error)}`)
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new NodeError('BAD_ARGS', '参数模板必须渲染成一个 JSON 对象')
  }
  return parsed
}

function agentOf(runCtx) {
  if (runCtx.agent) return runCtx.agent
  const agents = runCtx.services.get('agents')
  if (agents && typeof agents.get === 'function' && runCtx.sessionId) return agents.get(runCtx.sessionId)
  return undefined
}

function requireAgent(runCtx, node) {
  const agent = agentOf(runCtx)
  if (!agent) {
    throw new NodeError('NO_AGENT', `${node.kind} 需要绑定一个会话（agent）；本次运行没有 sessionId 或会话已结束`)
  }
  return agent
}

function injectContext(runCtx, text, label = '注入上下文') {
  const agent = requireAgent(runCtx, { kind: label })
  if (typeof agent.inject !== 'function') throw new NodeError('NO_INJECT', '当前 agent 不支持 inject()')
  agent.inject(userMessage(text))
}

export const HANDLERS = Object.freeze({

  'phase': {
    async run(node) {
      return {
        output: { phase: node.title, goal: typeof node.params?.goal === 'string' ? node.params.goal : null },
        ports: ['out'],
      }
    },
  },

  'inject.context': {
    async run(node, runCtx) {
      const store = runCtx.store
      const selection = runCtx.selection ?? {
        resolve: (target) => resolveEffective(store.state, target),
      }
      const profileId = typeof node.params.profileId === 'string' && node.params.profileId !== '' ? node.params.profileId : undefined
      let eff
      if (profileId) {
        const profile = store.state.profiles.find((p) => p.id === profileId)
        if (!profile) throw new NodeError('NO_PROFILE', `找不到注入配置 ${profileId}`)
        eff = resolveEffective({ profiles: [profile], prefs: store.state.prefs }, {})
      } else {
        eff = selection.resolve({ sessionId: runCtx.sessionId, workspaceId: runCtx.workspaceId })
      }
      const cache = store.catalogCache ?? {}
      const includeSkills = node.params.includeSkills !== false
      const includeTools = node.params.includeTools !== false
      const payload = buildSelectionText(eff, cache, [], { includeSkills, includeTools })
      injectContext(runCtx, payload, '加载本轮上下文')
      return {
        output: {
          mode: eff.mode,
          profileId: eff.profileId ?? null,
          skillCount: eff.skillPreload.length + eff.skillIndex.length,
          toolCount: eff.toolAllow ? eff.toolAllow.length : null,
          chars: payload.length,
        },
        ports: ['out'],
      }
    },
  },

  'inject.skill': {
    async run(node, runCtx) {
      const names = Array.isArray(node.params.names) ? node.params.names.filter((n) => typeof n === 'string' && n !== '') : []
      if (names.length === 0) throw new NodeError('NO_SKILL', '没有选择任何技能')
      const wantBody = node.params.body !== false
      const budget = Number(node.params.budget) > 0 ? Number(node.params.budget) : 8000

      const bodies = []
      const missing = []
      if (wantBody) {
        let used = 0
        for (const name of names) {
          if (used >= budget) {
            missing.push(`${name}（超出预算未加载）`)
            continue
          }
          const body = await loadSkillBody(runCtx.services, name, { sessionId: runCtx.sessionId, cwd: runCtx.cwd })
          if (!body) {
            missing.push(name)
            continue
          }
          const remaining = budget - used
          const content = body.content.length > remaining ? `${body.content.slice(0, remaining)}\n…（截断）` : body.content
          used += content.length
          bodies.push({ name, content })
        }
      }
      const header = wantBody && bodies.length > 0
        ? `【Agent Flow · 预载技能】\n${bodies.map((b) => `--- ${b.name} ---\n${b.content}`).join('\n\n')}`
        : `【Agent Flow · 技能清单】\n${names.join('、')}`
      const payload = missing.length > 0 ? `${header}\n\n未能加载：${missing.join('、')}` : header
      injectContext(runCtx, payload)
      return { output: { names, loaded: bodies.map((b) => b.name), missing, chars: payload.length }, ports: ['out'] }
    },
  },

  'agent.task': {
    async run(node, runCtx) {
      const prompt = typeof node.params.prompt === 'string' ? node.params.prompt : ''
      if (prompt.trim() === '') throw new NodeError('NO_PROMPT', 'agent.task 需要 prompt')
      const scope = { vars: runCtx.vars, last: runCtx.last, node: runCtx.outputs }
      const rendered = renderTemplate(prompt, scope)
      const target = node.params.target === 'session' ? 'session' : 'subagent'

      if (target === 'session') {
        const agent = requireAgent(runCtx, node)
        if (typeof agent.followup !== 'function') throw new NodeError('NO_FOLLOWUP', '当前 agent 不支持 followup()')
        agent.followup(userMessage(rendered))
        let waited = false
        if (node.params.waitForIdle !== false && typeof agent.whenIdle === 'function') {
          await agent.whenIdle()
          waited = true
        }
        return { output: { target, dispatched: true, waited, prompt: rendered }, ports: ['out'] }
      }

      const subagents = runCtx.services.get('subagents')
      if (!subagents || typeof subagents.start !== 'function') {
        throw new NodeError('NO_SUBAGENTS', 'subagents 服务不可用；可把节点目标改成「当前会话」')
      }
      const providers = typeof subagents.list === 'function' ? subagents.list() : []
      const provider = typeof node.params.provider === 'string' && node.params.provider !== ''
        ? node.params.provider
        : Array.isArray(providers) && providers.length > 0 ? providers[0] : ''
      if (provider === '') throw new NodeError('NO_PROVIDER', '没有可用的子代理 provider')
      const parent = agentOf(runCtx)
      if (!parent) throw new NodeError('NO_AGENT', 'agent.task(subagent) 需要父会话的 agent')
      const run = await subagents.start(provider, {
        label: typeof node.params.label === 'string' && node.params.label !== '' ? node.params.label : node.title,
        prompt: [{ type: 'text', text: rendered }],
        parent,
        signal: runCtx.signal,
      })
      try {
        const result = await run.result
        const text = blocksToText(result?.output)
        const stopReason = String(result?.stopReason ?? 'unknown')
        if (stopReason !== 'completed' && text === '') {
          throw new NodeError('SUBAGENT_FAILED', `子代理结束原因：${stopReason}${result?.diagnostic ? `（${result.diagnostic}）` : ''}`)
        }
        return {
          output: { target, provider, childId: run.id ?? null, stopReason, text, structured: result?.structured ?? null },
          ports: ['out'],
        }
      } finally {
        try {
          await run.dispose()
        } catch {
        }
      }
    },
  },

  'tool.call': {
    async run(node, runCtx) {
      const name = typeof node.params.name === 'string' ? node.params.name.trim() : ''
      if (name === '') throw new NodeError('NO_TOOL', 'tool.call 需要工具名')
      if (isDangerousTool(name) && node.params.allowDangerous !== true) {
        throw new NodeError('DANGEROUS', `「${name}」被视为危险工具：请在节点里显式勾选"允许危险工具"后再运行`)
      }
      const tools = runCtx.services.get('tools')
      if (!tools || typeof tools.execute !== 'function') throw new NodeError('NO_TOOLS', 'tools 服务不可用')
      const args = renderArgs(node.params.argsTemplate, { vars: runCtx.vars, last: runCtx.last, node: runCtx.outputs })
      const agent = agentOf(runCtx)
      runCtx.emit({ type: 'tool.call', nodeId: node.id, data: { name, args } })
      const callId = `flow_${Math.random().toString(36).slice(2, 10)}`
      const result = await tools.execute({ callId, name, arguments: args, agent, signal: runCtx.signal })
      const text = blocksToText(result?.content)
      runCtx.emit({ type: 'tool.result', nodeId: node.id, data: { name, isError: result?.isError === true, text: text.slice(0, 500) } })
      if (result?.isError) {
        const reason = result?.error?.message ?? text ?? '工具执行失败'
        throw new NodeError('TOOL_FAILED', `工具「${name}」执行失败：${String(reason).slice(0, 500)}`)
      }
      return { output: { name, text, value: result?.value ?? null }, ports: ['out'] }
    },
  },

  'branch.condition': {
    async run(node, runCtx) {
      const cases = Array.isArray(node.params.cases) ? node.params.cases : []
      const scope = { vars: runCtx.vars, last: runCtx.last, node: runCtx.outputs, env: undefined }

      const evaluated = {}
      let matched = 'false'
      for (const item of cases) {
        const port = typeof item?.port === 'string' && item.port !== '' ? item.port : ''
        if (port === '') continue
        const parsed = runExpr(item?.when, scope)
        evaluated[port] = parsed.ok ? parsed.value : { error: parsed.error }
        if (matched === 'false' && parsed.ok && Boolean(parsed.value)) matched = port
      }
      const available = new Set((runCtx.workflow.edges ?? []).filter((e) => e.from === node.id).map((e) => e.fromPort))
      const chosen = available.has(matched) ? matched : available.has('false') ? 'false' : matched
      runCtx.emit({ type: 'log', nodeId: node.id, data: { level: 'info', message: `分支命中：${chosen}` } })
      return { output: { matched: chosen, evaluated }, ports: [chosen] }
    },
  },

  'flow.parallel': {
    async run(node, runCtx) {
      const branches = (runCtx.workflow.edges ?? []).filter((e) => e.from === node.id && e.fromPort === 'out')
      if (branches.length === 0) throw new NodeError('NO_BRANCH', 'flow.parallel 没有下游连线')
      return { output: { branches: branches.length, targets: branches.map((e) => e.to) }, ports: ['out'] }
    },
  },

  'flow.join': {
    async run(node, runCtx) {
      const mode = node.params.mode === 'any' || node.params.mode === 'first' ? node.params.mode : 'all'
      return { output: { mode, upstreams: (runCtx.workflow.edges ?? []).filter((e) => e.to === node.id).length }, ports: ['out'] }
    },
  },

  'flow.loop': {
    async run(node, runCtx) {
      const maxIterations = Number.isFinite(Number(node.params.maxIterations)) ? Math.max(1, Math.min(50, Math.floor(Number(node.params.maxIterations)))) : 5
      return { output: { maxIterations, untilExpr: node.params.untilExpr ?? null }, ports: ['body', 'exit'] }
    },
  },

  'flow.wait': {
    async run(node, runCtx) {
      const msRaw = Number(node.params.ms)
      const everyMs = Number.isFinite(Number(node.params.everyMs)) && Number(node.params.everyMs) > 0 ? Math.floor(Number(node.params.everyMs)) : 500
      const untilIso = typeof node.params.untilIso === 'string' && node.params.untilIso !== '' ? node.params.untilIso : ''
      const until = untilIso ? Date.parse(untilIso) : NaN
      if (untilIso && !Number.isFinite(until)) throw new NodeError('BAD_UNTIL', `untilIso 不是合法时间：${untilIso}`)
      const sleep = (duration) => new Promise((resolve, reject) => {
        if (runCtx.signal.aborted) {
          reject(new NodeError('CANCELLED', '等待被取消'))
          return
        }
        const timer = setTimeout(() => {
          runCtx.signal.removeEventListener('abort', onAbort)
          resolve()
        }, duration)
        const onAbort = () => {
          clearTimeout(timer)
          reject(new NodeError('CANCELLED', '等待被取消'))
        }
        runCtx.signal.addEventListener('abort', onAbort, { once: true })
      })
      if (Number.isFinite(until)) {
        let waited = 0
        while (Date.now() < until) {
          const step = Math.min(everyMs, until - Date.now())
          await sleep(Math.max(1, step))
          waited += step
          if (waited > 3600000) break
        }
        return { output: { untilIso, waitedMs: waited }, ports: ['out'] }
      }
      const ms = Number.isFinite(msRaw) && msRaw > 0 ? Math.floor(msRaw) : 1000
      await sleep(Math.min(ms, 3600000))
      return { output: { ms }, ports: ['out'] }
    },
  },

  'human.checkpoint': {
    async run(node, runCtx) {
      const question = typeof node.params.question === 'string' && node.params.question !== '' ? node.params.question : '继续吗？'
      const options = Array.isArray(node.params.options) && node.params.options.length > 0
        ? node.params.options.filter((o) => typeof o === 'string')
        : ['继续', '停止']
      const timeoutMs = Number.isFinite(Number(node.params.timeoutMs)) && Number(node.params.timeoutMs) > 0
        ? Math.min(Math.floor(Number(node.params.timeoutMs)), 3600000)
        : undefined
      const answer = await runCtx.checkpoint({ question, options, timeoutMs, nodeId: node.id })
      const stopOption = options.length > 1 && answer === options[options.length - 1]
      return { output: { question, answer, options }, ports: [stopOption ? 'stop' : 'out'] }
    },
  },

  'io.output': {
    async run(node, runCtx) {
      const scope = { vars: runCtx.vars, last: runCtx.last, node: runCtx.outputs }
      const text = renderTemplate(typeof node.params.template === 'string' ? node.params.template : '', scope).trim()
      if (node.params.appendToChat === true && text !== '') {
        try {
          injectContext(runCtx, `【Agent Flow · 流程结果】\n${text}`)
        } catch (error) {
          runCtx.log('warn', `结果未能写入对话：${error instanceof Error ? error.message : String(error)}`)
        }
      }
      return { output: { text }, ports: ['out'] }
    },
  },

  'group.steps': {
    async run(node, runCtx) {
      const children = (runCtx.workflow.nodes ?? []).filter((item) => item.parentId === node.id)
      return {
        output: {
          declared: children.length,
          steps: children.map((item) => ({ id: item.id, title: item.title, kind: item.kind })),
        },
        ports: ['out'],
      }
    },
  },

  'subflow.call': {
    async run(node, runCtx) {
      const workflowId = typeof node.params.workflowId === 'string' ? node.params.workflowId : ''
      if (workflowId === '') throw new NodeError('NO_SUBFLOW', 'subflow.call 需要 workflowId')
      if (workflowId === runCtx.workflow.id) throw new NodeError('SELF_SUBFLOW', '流程不能调用自己')
      if (typeof runCtx.runSubflow !== 'function') throw new NodeError('NO_SUBFLOW_RUNNER', '当前运行不支持子流程')
      const result = await runCtx.runSubflow(workflowId, node.params.inputMap ?? {})
      return { output: result, ports: ['out'] }
    },
  },
})
