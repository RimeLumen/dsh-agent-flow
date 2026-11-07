/*! dsh-agent-flow v0.1.0 | Copyright (c) 2026 RimeLumen | MIT License */
import { DEFAULT_PREFS, strList } from './store.js'

export const SECTION_ORDER = 152

export const ESCAPE_TOOLS = Object.freeze([
  'ask_user_question',
  'read',
  'glob',
  'grep',
  'todo_write',
  'update_goal',
  'get_goal',
  'list_agents',
  'wait_agent',
  'send_message',
  'flow_status',
])

const MODES = new Set(['index', 'preload', 'whitelist'])

export class SelectionError extends Error {

  constructor(kind, message) {
    super(message)
    this.kind = kind
  }
}

function shortId(prefix) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < 8; i += 1) out += alphabet[Math.floor(Math.random() * alphabet.length)]
  return `${prefix}_${out}`
}

export function normalizeProfile(input, existingId) {
  if (input === null || typeof input !== 'object') {
    throw new SelectionError('validation', 'profile must be an object')
  }
  const name = typeof input.name === 'string' ? input.name.trim() : ''
  if (name === '') throw new SelectionError('validation', 'profile.name is required')
  if (name.length > 80) throw new SelectionError('validation', 'profile.name is too long (max 80)')

  const scopeRaw = input.scope && typeof input.scope === 'object' ? input.scope : { kind: 'global' }
  const kind = scopeRaw.kind === 'session' ? 'session' : scopeRaw.kind === 'workspace' ? 'workspace' : 'global'
  const scope =
    kind === 'session'
      ? { kind, sessionId: String(scopeRaw.sessionId ?? '') }
      : kind === 'workspace'
        ? { kind, workspaceId: String(scopeRaw.workspaceId ?? '') }
        : { kind: 'global' }
  if (kind === 'session' && scope.sessionId === '') {
    throw new SelectionError('validation', 'session scope needs sessionId')
  }
  if (kind === 'workspace' && scope.workspaceId === '') {
    throw new SelectionError('validation', 'workspace scope needs workspaceId')
  }

  const mode = MODES.has(input.mode) ? input.mode : 'index'
  const toolsIn = input.tools && typeof input.tools === 'object' ? input.tools : {}
  const skillsIn = input.skills && typeof input.skills === 'object' ? input.skills : {}
  const budgetRaw = Number(input.promptBudget)

  return {
    schemaVersion: 1,
    id: typeof existingId === 'string' && existingId !== '' ? existingId : typeof input.id === 'string' && input.id !== '' ? input.id : shortId('prof'),
    name,
    note: typeof input.note === 'string' ? input.note.slice(0, 400) : undefined,
    scope,
    mode,
    tools: { allow: strList(toolsIn.allow), deny: strList(toolsIn.deny) },
    skills: { preload: strList(skillsIn.preload), index: strList(skillsIn.index) },
    origin: input.origin === 'ai-default' ? 'ai-default' : 'user',
    auto: input.auto === true,
    isDefault: input.isDefault === true,
    promptBudget: Number.isFinite(budgetRaw) && budgetRaw > 0 ? Math.min(Math.floor(budgetRaw), 200000) : DEFAULT_PREFS.promptBudget,
    updatedAt: new Date().toISOString(),
  }
}

export const DEFAULT_PROFILE_NAME = 'Default'

export function ensureDefaultProfile(state, catalog = {}) {
  const toolNames = Array.isArray(catalog.officialToolNames) && catalog.officialToolNames.length > 0
    ? catalog.officialToolNames
    : catalog.allToolNames ?? []
  const skillNames = Array.isArray(catalog.modelInvocableSkillNames) && catalog.modelInvocableSkillNames.length > 0
    ? catalog.modelInvocableSkillNames
    : catalog.allSkillNames ?? []
  let profile = state.profiles.find((item) => item.origin === 'ai-default' || item.name === DEFAULT_PROFILE_NAME)
  if (!profile) {
    profile = normalizeProfile({
      name: DEFAULT_PROFILE_NAME,
      note: '由 Agent Flow 按当前已安装的工具与技能自动配置；可直接编辑，编辑后不再自动覆盖。',
      scope: { kind: 'global' },
      mode: 'index',
      tools: { allow: toolNames, deny: [] },
      skills: { preload: [], index: skillNames },
    }, undefined)
    profile.origin = 'ai-default'
    profile.auto = true
    profile.isDefault = true
    state.profiles.push(profile)
    return { changed: true, profile }
  }
  if (profile.auto !== true) return { changed: false, profile }
  const before = JSON.stringify([profile.tools?.allow ?? [], profile.skills?.index ?? []])
  profile.tools = { allow: toolNames, deny: profile.tools?.deny ?? [] }
  profile.skills = { preload: [], index: skillNames }
  profile.origin = 'ai-default'
  profile.isDefault = true
  const after = JSON.stringify([profile.tools.allow, profile.skills.index])
  if (before === after) return { changed: false, profile }
  profile.updatedAt = new Date().toISOString()
  return { changed: true, profile }
}

export function listProfiles(state) {
  return state.profiles.map((profile) => ({ ...profile }))
}

export function upsertProfile(state, input) {
  const id = typeof input?.id === 'string' && input.id !== '' ? input.id : undefined
  const profile = normalizeProfile(input, id)
  if (input?.keepAuto !== true) profile.auto = false
  const clash = state.profiles.find((p) => p.name === profile.name && p.id !== profile.id)
  if (clash) throw new SelectionError('conflict', `a profile named "${profile.name}" already exists`)
  const index = state.profiles.findIndex((p) => p.id === profile.id)
  if (index >= 0) state.profiles[index] = profile
  else state.profiles.push(profile)
  return profile
}

export function deleteProfile(state, id) {
  const index = state.profiles.findIndex((p) => p.id === id)
  if (index < 0) throw new SelectionError('not-found', `no profile with id ${id}`)
  const [removed] = state.profiles.splice(index, 1)
  for (const workflow of state.workflows) {
    if (workflow?.selectionProfileId === id) workflow.selectionProfileId = undefined
  }
  return removed
}

export function resolveEffective(state, target = {}) {
  const prefs = { ...DEFAULT_PREFS, ...(state.prefs ?? {}) }

  let picked
  let source = 'default'
  const bySession = target.sessionId
    ? state.profiles.find((p) => p.scope?.kind === 'session' && p.scope.sessionId === target.sessionId)
    : undefined
  const byWorkspace = target.workspaceId
    ? state.profiles.find((p) => p.scope?.kind === 'workspace' && p.scope.workspaceId === target.workspaceId)
    : undefined
  const byGlobal = state.profiles.find((p) => p.scope?.kind === 'global')
  if (bySession) {
    picked = bySession
    source = 'session'
  } else if (byWorkspace) {
    picked = byWorkspace
    source = 'workspace'
  } else if (byGlobal) {
    picked = byGlobal
    source = 'global'
  }
  const mode = picked && MODES.has(picked.mode) ? picked.mode : prefs.mode
  const toolAllowRaw = picked ? strList(picked.tools?.allow) : []
  return {
    profileId: picked?.id,
    profileName: picked?.name,
    mode,

    includeAll: picked === undefined
      || (mode === 'index'
        && toolAllowRaw.length === 0
        && strList(picked?.tools?.deny).length === 0
        && strList(picked?.skills?.preload).length === 0
        && strList(picked?.skills?.index).length === 0),
    toolAllow: mode === 'whitelist' ? toolAllowRaw : null,

    toolIndex: toolAllowRaw,
    profileOrigin: picked?.origin ?? (picked ? 'user' : 'none'),
    toolDeny: picked ? strList(picked.tools?.deny) : [],
    skillPreload: picked ? strList(picked.skills?.preload) : [],
    skillIndex: picked ? strList(picked.skills?.index) : [],
    promptBudget: picked?.promptBudget ?? prefs.promptBudget,
    lockoutGuard: prefs.lockoutGuard !== false,
    source,
  }
}

function clampBudget(text, budget) {
  if (text.length <= budget) return { text, truncated: false, dropped: 0 }
  return { text: `${text.slice(0, budget)}\n…（Agent Flow：内容超过预算已截断）`, truncated: true, dropped: text.length - budget }
}

export function buildSelectionText(eff, cache = {}, bodies = [], options = {}) {
  const includeSkills = options.includeSkills !== false
  const includeTools = options.includeTools !== false
  const lines = []
  lines.push('【Agent Flow · 本轮上下文】')
  lines.push('本轮的技能与工具范围由用户在 Agent Flow 容器中设定。')

  const includeAll = eff.includeAll === true || options.includeAll === true
  const cap = Number(options.listCap) > 0 ? Number(options.listCap) : 200
  const allSkills = includeAll && cache.skills instanceof Map ? [...cache.skills.values()] : null
  const skillNames = includeSkills
    ? allSkills ? allSkills.map((item) => item.name) : [...new Set([...eff.skillPreload, ...eff.skillIndex])]
    : []
  if (skillNames.length > 0) {
    lines.push('')
    lines.push(allSkills
      ? `可用技能（默认加载本机全部 ${skillNames.length} 项）：`
      : `可用技能（${skillNames.length}）：`)
    for (const name of skillNames.slice(0, cap)) {
      const meta = cache.skills?.get?.(name)
      const description = typeof meta?.description === 'string' && meta.description !== '' ? meta.description : ''
      const whenToUse = typeof meta?.whenToUse === 'string' && meta.whenToUse !== '' ? `｜何时用：${meta.whenToUse}` : ''
      const official = meta?.official === true ? '[官方] ' : ''
      lines.push(`- ${official}${name}${description ? `：${description}` : ''}${whenToUse}`)
    }
    if (skillNames.length > cap) lines.push(`（其余 ${skillNames.length - cap} 项未列出，可用搜索或直接问）`)
    lines.push('需要某个技能的完整步骤时，用 skill 工具加载它的正文。')
  }

  if (eff.toolAllow && includeTools) {
    lines.push('')
    lines.push(`可用工具（白名单，${eff.toolAllow.length}）：${eff.toolAllow.join('、')}`)
    if (eff.toolDeny.length > 0) lines.push(`显式禁用：${eff.toolDeny.join('、')}`)
    lines.push('清单之外的任何工具都不可用：不要尝试调用，直接说明做不到并给出替代方案。')
  } else if (eff.toolDeny.length > 0 && includeTools) {
    lines.push('')
    lines.push(`本轮显式禁用的工具：${eff.toolDeny.join('、')}（不要调用它们）。`)
  } else if (includeTools && Array.isArray(eff.toolIndex) && eff.toolIndex.length > 0) {
    const marked = eff.toolIndex.slice(0, cap).map((name) => (cache.tools?.get?.(name)?.official === true ? `★${name}` : name))
    lines.push('')
    lines.push(`本轮优先使用的工具（${eff.toolIndex.length} 项，来源：${eff.profileName ?? '默认方案'}）：`)
    lines.push(`- ${marked.join('、')}`)
    lines.push('（当前不是白名单模式：清单之外的工具同样可用，请优先使用上面的这些。）')
  } else if (includeAll && includeTools && cache.tools instanceof Map) {
    const tools = [...cache.tools.values()]
    const official = tools.filter((item) => item.official === true)
    const others = tools.filter((item) => item.official !== true)
    lines.push('')
    lines.push(`可用工具（默认加载本机全部 ${tools.length} 项，未做限制）：`)
    lines.push(`- 官方/内置（${official.length}）：${official.slice(0, cap).map((item) => item.name).join('、')}`)
    if (others.length > 0) {
      lines.push(`- 其他来源（${others.length}）：${others.slice(0, cap).map((item) => item.name).join('、')}`)
    }
    if (tools.length > cap * 2) lines.push('（列表已按长度截断）')
  }

  if (bodies.length > 0) {
    lines.push('')
    lines.push('已预载技能正文：')
    for (const body of bodies) {
      lines.push('')
      lines.push(`--- ${body.name} ---`)
      lines.push(body.content)
    }
  }

  return clampBudget(lines.join('\n'), Math.max(1000, eff.promptBudget))
}

export function applySelection(ctx, agent, eff, options = {}) {
  const warn = typeof options.onWarn === 'function' ? options.onWarn : () => {}

  const disposers = []
  const agentCtx = agent?.ctx
  if (!agentCtx) {
    warn('agent has no ctx; selection not applied')
    return () => {}
  }

  if (typeof options.text === 'string' && options.text !== '') {
    const systemPrompt = agentCtx.systemPrompt ?? (typeof ctx.get === 'function' ? ctx.get('systemPrompt') : undefined)
    if (systemPrompt && typeof systemPrompt.section === 'function') {
      try {
        disposers.push(systemPrompt.section({ name: 'agent-flow/selection', order: SECTION_ORDER, text: options.text }))
      } catch (error) {
        warn(`systemPrompt.section failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    } else {
      warn('systemPrompt is unavailable; the selection text was not injected')
    }
  }

  if (eff.mode === 'whitelist' && Array.isArray(eff.toolAllow)) {
    const tools = agentCtx.tools ?? (typeof ctx.get === 'function' ? ctx.get('tools') : undefined)
    if (tools && typeof tools.restrict === 'function') {
      const known = new Set(Array.isArray(options.knownToolNames) ? options.knownToolNames : [])
      const knownFilter = (name) => known.size === 0 || known.has(name)
      const escape = (options.escapeTools ?? ESCAPE_TOOLS).filter(knownFilter)
      const allow = [...new Set([...(options.lockoutGuard === false ? [] : escape), ...eff.toolAllow.filter(knownFilter)])]
      const deny = eff.toolDeny.filter(knownFilter)
      const filter = {}
      if (allow.length > 0) filter.allow = allow
      if (deny.length > 0) filter.deny = deny
      if (Object.keys(filter).length === 0) {
        warn('whitelist filter was empty; nothing restricted')
      } else {
        try {
          disposers.push(tools.restrict(filter))
        } catch (error) {
          warn(`tools.restrict failed: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
    } else {
      warn('tools service is unavailable; the whitelist was not applied')
    }
  }

  let disposed = false
  return () => {
    if (disposed) return
    disposed = true
    for (const dispose of disposers.reverse()) {
      try {
        dispose()
      } catch {
      }
    }
    disposers.length = 0
  }
}

export function attachSelectionLifecycle(ctx, deps) {

  const applied = new Map()
  const log = typeof deps.logger === 'function' ? deps.logger : () => {}

  const onCreated = async (payload) => {
    const agent = payload?.agent
    const sessionId = agent?.id
    if (!agent || typeof sessionId !== 'string') return
    release(sessionId)
    const eff = deps.getEffective(sessionId)
    let text = ''
    try {
      text = await deps.getText(eff)
    } catch (error) {
      log(`[session ${sessionId}] selection text failed: ${error instanceof Error ? error.message : String(error)}`)
    }
    const dispose = applySelection(ctx, agent, eff, {
      text,
      knownToolNames: typeof deps.knownToolNames === 'function' ? deps.knownToolNames() : [],
      escapeTools: deps.escapeTools,
      lockoutGuard: eff.lockoutGuard,
      onWarn: (message) => log(`[session ${sessionId}] ${message}`),
    })
    applied.set(sessionId, dispose)
    log(`selection applied to session ${sessionId} (profile=${eff.profileId ?? 'none'} mode=${eff.mode})`)
  }

  const onDisposed = (payload) => {
    const sessionId = payload?.agent?.id
    if (typeof sessionId === 'string') release(sessionId)
  }

  function release(sessionId) {
    const dispose = applied.get(sessionId)
    if (!dispose) return
    applied.delete(sessionId)
    try {
      dispose()
    } catch {
    }
  }

  ctx.on('agent/created', onCreated)
  ctx.on('agent/disposed', onDisposed)

  return {

    async reapply(sessionId) {
      const agents = typeof ctx.get === 'function' ? ctx.get('agents') : undefined
      const agent = agents && typeof agents.get === 'function' ? agents.get(sessionId) : undefined
      if (!agent) return false
      try {
        await onCreated({ agent })
        return true
      } catch (error) {
        log(`[session ${sessionId}] reapply failed: ${error instanceof Error ? error.message : String(error)}`)
        return false
      }
    },

    disposeAll() {
      for (const sessionId of [...applied.keys()]) release(sessionId)
    },
    appliedSessions() {
      return [...applied.keys()]
    },
  }
}
