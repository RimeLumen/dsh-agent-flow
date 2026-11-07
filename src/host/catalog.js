/*! dsh-agent-flow v0.1.0 | Copyright (c) 2026 RimeLumen | MIT License */
const OFFICIAL_TOOL_NAMES = new Set([
  'ask_user_question', 'bash', 'create_goal', 'edit', 'exit_plan_mode', 'get_goal', 'glob', 'grep',
  'interrupt_agent', 'list_agents', 'list_subagent_models', 'lsp', 'present', 'pwsh', 'ralph', 'read',
  'read_image', 'send_message', 'skill', 'spawn_teammate', 'subagent', 'subagent_fork', 'todo_write',
  'update_goal', 'wait_agent', 'web_fetch', 'web_search', 'workflow', 'write', 'analyze_image_prompt',
  'validate_configs', 'diagnose_knowledge_base', 'rebuild_knowledge_base', 'preview_model_profile',
  'manage_experiences',
])
const OFFICIAL_TOOL_PREFIXES = [
  'cordis_', 'job_', 'schedule_', 'session_', 'subagent_', 'task_board_', 'team_task_', 'terminal_',
  'flow_',
]

export function isOfficialTool(name) {
  const lowered = String(name || '').toLowerCase()
  if (OFFICIAL_TOOL_NAMES.has(lowered)) return true
  return OFFICIAL_TOOL_PREFIXES.some((prefix) => lowered.startsWith(prefix))
}

export function isOfficialSkillSource(source) {
  return source === 'bundled'
}

const PREFIX_SOURCES = [
  ['cordis_', 'cordis-runtime'],
  ['flow_', 'agent-flow'],
  ['mcp', 'mcp'],
  ['dsh_', 'dsh'],
]

const TOOL_CATEGORY_RULES = [
  ['files', ['read', 'write', 'edit', 'glob', 'grep', 'lsp', 'ops_read_files', 'ops_inspect_local_file', 'ops_glob', 'ops_grep']],
  ['process', ['bash', 'pwsh']],
  ['agents', ['subagent', 'subagent_fork', 'spawn_teammate', 'send_message', 'list_agents', 'wait_agent', 'interrupt_agent', 'list_subagent_models']],
  ['goals', ['create_goal', 'get_goal', 'update_goal', 'exit_plan_mode', 'ralph']],
  ['interaction', ['ask_user_question', 'present', 'todo_write', 'read_image', 'analyze_image_prompt', 'sidebar_open', 'working_directory']],
  ['web', ['web_search', 'web_fetch']],
  ['flow', ['skill', 'workflow', 'flow_status', 'flow_plan']],
  ['knowledge', ['diagnose_knowledge_base', 'rebuild_knowledge_base', 'preview_model_profile', 'manage_experiences']],
  ['plugin', ['plugin_manager', 'validate_configs']],
]

const TOOL_CATEGORY_PREFIXES = [
  ['process', ['terminal_', 'job_']],
  ['agents', ['team_task_', 'task_board_']],
  ['sessions', ['session_']],
  ['schedule', ['schedule_']],
  ['plugin', ['cordis_']],
]

const DESCRIPTION_KEYWORDS = [
  ['files', ['文件', '读取', '写入', '编辑', 'file']],
  ['process', ['终端', '命令', 'shell', 'command']],
  ['web', ['网页', '搜索', '抓取', 'http', 'url']],
  ['agents', ['代理', '团队', 'agent', 'teammate']],
  ['goals', ['目标', 'goal']],
  ['knowledge', ['知识库', '校验', '配置', 'config']],
]

export function toolCategory(name, description = '') {
  const lowered = String(name || '').toLowerCase()
  for (const [category, names] of TOOL_CATEGORY_RULES) {
    if (names.includes(lowered)) return category
  }
  for (const [category, prefixes] of TOOL_CATEGORY_PREFIXES) {
    if (prefixes.some((prefix) => lowered.startsWith(prefix))) return category
  }
  const text = String(description || '').toLowerCase()
  for (const [category, keywords] of DESCRIPTION_KEYWORDS) {
    if (keywords.some((keyword) => text.includes(keyword))) return category
  }
  return 'other'
}

export function skillParent(entry) {
  const provider = typeof entry?.provider === 'string' && entry.provider !== 'unknown' ? entry.provider : ''
  if (provider !== '') return provider
  if (entry?.source === 'bundled') return 'dsh-bundled'
  if (typeof entry?.source === 'string' && entry.source !== 'unknown') return entry.source
  return 'other'
}

export function inferToolSource(name) {
  const lowered = String(name || '').toLowerCase()
  for (const [prefix, source] of PREFIX_SOURCES) {
    if (lowered.startsWith(prefix)) return source
  }
  return 'unknown'
}

export function scopeFor(ctx, sessionId) {
  if (!sessionId) return undefined
  const agents = typeof ctx.get === 'function' ? ctx.get('agents') : undefined
  if (!agents || typeof agents.get !== 'function') return undefined
  try {
    return agents.get(sessionId) || undefined
  } catch {
    return undefined
  }
}

function toToolEntry(schema) {
  const name = String(schema?.name ?? '')
  return {
    name,
    description: typeof schema?.description === 'string' ? schema.description : '',
    parameters: schema?.parameters ?? { type: 'object', properties: {} },
    deferLoading: schema?.deferLoading === true,
    source: inferToolSource(name),
    sourceGuessed: true,
    official: isOfficialTool(name),
    category: toolCategory(name, schema?.description),
  }
}

function toSkillEntry(summary) {
  return {
    name: String(summary?.name ?? ''),
    description: typeof summary?.description === 'string' ? summary.description : '',
    whenToUse: typeof summary?.whenToUse === 'string' ? summary.whenToUse : undefined,
    source: typeof summary?.source === 'string' ? summary.source : 'unknown',
    provider: typeof summary?.provider === 'string' ? summary.provider : 'unknown',
    invocation: {
      modelInvocable: summary?.invocation?.modelInvocable !== false,
      userInvocable: summary?.invocation?.userInvocable !== false,
    },
    path: typeof summary?.path === 'string' ? summary.path : undefined,
    resourceBase: summary?.resourceBase,
    official: isOfficialSkillSource(typeof summary?.source === 'string' ? summary.source : 'unknown'),
    parent: skillParent(summary),
  }
}

export async function buildCatalog(ctx, options = {}) {
  const scope = scopeFor(ctx, options.sessionId)

  const warnings = []

  const errors = []

  let tools = []

  let skills = []
  let complete = true

  const toolsApi = typeof ctx.get === 'function' ? ctx.get('tools') : ctx.tools
  if (toolsApi && typeof toolsApi.schemas === 'function') {
    try {
      const schemas = toolsApi.schemas(scope)
      tools = (Array.isArray(schemas) ? schemas : []).map(toToolEntry)
    } catch (error) {
      errors.push(`tools.schemas failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  } else {
    warnings.push('tools service is unavailable; the tool list is empty')
  }

  const skillsApi = typeof ctx.get === 'function' ? ctx.get('skills') : ctx.skills
  if (skillsApi && typeof skillsApi.snapshot === 'function') {
    try {
      const snapshot = await skillsApi.snapshot({ scope, cwd: options.cwd })
      skills = (Array.isArray(snapshot?.skills) ? snapshot.skills : []).map(toSkillEntry)
      complete = snapshot?.complete !== false
    } catch (error) {
      errors.push(`skills.snapshot failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  } else {
    warnings.push('skills service is unavailable; the skill list is empty')
  }

  tools.sort((a, b) => a.name.localeCompare(b.name))
  skills.sort((a, b) => a.name.localeCompare(b.name))

  const groups = Array.isArray(options.groups) ? options.groups : []
  const knownToolNames = new Set(tools.map((t) => t.name))
  const knownSkillNames = new Set(skills.map((s) => s.name))

  return {
    revision: `${tools.length}.${skills.length}.${Date.now().toString(36)}`,

    officialToolNames: tools.filter((tool) => tool.official === true).map((tool) => tool.name),
    modelInvocableSkillNames: skills.filter((skill) => skill.invocation?.modelInvocable !== false).map((skill) => skill.name),
    sessionId: options.sessionId ?? null,
    scopedToAgent: scope !== undefined,
    tools,
    skills,
    groups,
    knownToolNames: [...knownToolNames],
    knownSkillNames: [...knownSkillNames],
    complete,
    warnings,
    errors,
    fetchedAt: Date.now(),
  }
}

export function catalogCacheFrom(snapshot) {
  return {
    at: Date.now(),
    tools: new Map(snapshot.tools.map((tool) => [tool.name, tool])),
    skills: new Map(snapshot.skills.map((skill) => [skill.name, skill])),
    knownToolNames: snapshot.knownToolNames,
    knownSkillNames: snapshot.knownSkillNames,
    officialToolNames: snapshot.officialToolNames,
    modelInvocableSkillNames: snapshot.modelInvocableSkillNames,
  }
}

export async function loadSkillBody(ctx, name, options = {}) {
  const skillsApi = typeof ctx.get === 'function' ? ctx.get('skills') : ctx.skills
  if (!skillsApi || typeof skillsApi.get !== 'function') return null
  try {
    const definition = await skillsApi.get(name, { scope: scopeFor(ctx, options.sessionId), cwd: options.cwd })
    if (!definition || typeof definition.content !== 'string') return null
    return { name: definition.name ?? name, content: definition.content }
  } catch {
    return null
  }
}
