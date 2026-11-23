/*! dsh-agent-flow v0.1.0 | Copyright (c) 2026 RimeLumen | MIT License */
export const EXPERIENCE_LIMIT = 24

export const EXPERIENCE_GLOBAL_KEY = 'global'

export function experienceKey(workspaceId, cwd) {
  const key = typeof workspaceId === 'string' && workspaceId !== '' ? workspaceId : (typeof cwd === 'string' && cwd !== '' ? cwd : '')
  return key === '' ? EXPERIENCE_GLOBAL_KEY : key
}

export function normalizeExperience(input, id) {
  if (input === null || typeof input !== 'object') return null
  const now = Date.now()
  return {
    id: typeof id === 'string' && id !== '' ? id : `exp_${Math.random().toString(36).slice(2, 10)}`,
    key: typeof input.key === 'string' && input.key !== '' ? input.key : EXPERIENCE_GLOBAL_KEY,
    title: typeof input.title === 'string' && input.title.trim() !== '' ? input.title.trim().slice(0, 80) : '未命名经验',

    workflowJson: input.workflowJson !== null && typeof input.workflowJson === 'object' ? input.workflowJson : null,
    tags: Array.isArray(input.tags) ? input.tags.filter((tag) => typeof tag === 'string' && tag !== '').slice(0, 8) : [],
    pinned: input.pinned === true,
    adoptions: Number.isFinite(Number(input.adoptions)) ? Math.max(0, Math.floor(Number(input.adoptions))) : 0,
    lastUsedAt: Number.isFinite(Number(input.lastUsedAt)) ? Number(input.lastUsedAt) : now,
    createdAt: Number.isFinite(Number(input.createdAt)) ? Number(input.createdAt) : now,

    turn: Number.isFinite(Number(input.turn)) ? Math.max(0, Math.floor(Number(input.turn))) : undefined,
    // 自动入库用（批次 5）：拓扑指纹用于去重，origin 记录来源，便于解释与清理。
    hash: typeof input.hash === 'string' && input.hash !== '' ? input.hash.slice(0, 32) : undefined,
    origin: typeof input.origin === 'string' && input.origin !== '' ? input.origin.slice(0, 40) : undefined,
  }
}

/**
 * 拓扑指纹（批次 5 防噪）：按「节点类型+标题」与「边（用标题而非随机 id）」的规范化文本哈希。
 * 必须用标题而非节点 id——id 是随机生成的，同一结构两次创建的 id 不同，用 id 就永远去不掉重。
 */
export function topologyHash(workflow) {
  if (!workflow || !Array.isArray(workflow.nodes) || workflow.nodes.length === 0) return ''
  const byId = new Map(workflow.nodes.map((node) => [node.id, node]))
  const nodePart = workflow.nodes
    .map((node) => `${node.kind}:${node.title}`)
    .slice()
    .sort()
    .join('|')
  const edgePart = (workflow.edges ?? [])
    .map((edge) => `${byId.get(edge.from)?.title ?? edge.from}>${byId.get(edge.to)?.title ?? edge.to}`)
    .slice()
    .sort()
    .join('|')
  const text = `${workflow.name ?? ''}#${nodePart}#${edgePart}`
  let hash = 5381
  for (let i = 0; i < text.length; i += 1) hash = ((hash * 33) ^ text.charCodeAt(i)) >>> 0
  return hash.toString(36)
}

/**
 * 自动入库（批次 5）：带防噪。
 *
 * 噪声来源：每轮 flow_plan 都产生新画布，同一任务的连续迭代彼此高度相似；
 * 若逐轮入库，24 条上限会被同一个任务迅速占满。
 *
 * 四条防噪规则：
 *   1. 一任务一键：key = 'session:<会话>'，同一任务的迭代**覆盖**同键条目，不新增；
 *   2. 拓扑去重：指纹相同则只更新 lastUsedAt（措辞微调不会产生新条目）；
 *   3. 只存被采用的：由调用方保证只在用户确认/调整后调用（skipped/timeout 不调用）；
 *   4. 来源可解释：写入 turn 与 origin，供列表展示与清理。
 *
 * @returns {{ saved: boolean, reason: string, experience?: object, evicted?: number }}
 */
export function autoCaptureExperience(state, workflow, options = {}) {
  if (!workflow || !Array.isArray(workflow.nodes) || workflow.nodes.length === 0) {
    return { saved: false, reason: 'empty' }
  }
  const key = typeof options.key === 'string' && options.key !== ''
    ? options.key
    : (typeof workflow.sessionId === 'string' && workflow.sessionId !== '' ? `session:${workflow.sessionId}` : EXPERIENCE_GLOBAL_KEY)
  const experiences = state.experiences ?? (state.experiences = [])
  const hash = topologyHash(workflow)
  const sameKey = experiences.filter((item) => item.key === key)

  const identical = sameKey.find((item) => item.hash === hash)
  if (identical) {
    identical.lastUsedAt = Date.now()
    if (Number.isFinite(Number(workflow.turn))) identical.turn = Number(workflow.turn)
    return { saved: false, reason: 'duplicate', experience: identical }
  }

  // 一任务一经验：同键已有条目就覆盖（优先覆盖未置顶的；全置顶时覆盖第一个）
  const target = sameKey.find((item) => item.pinned !== true) ?? sameKey[0]
  if (target) {
    Object.assign(target, normalizeExperience({
      ...target,
      title: workflow.name || target.title,
      workflowJson: workflow,
      hash,
      turn: workflow.turn,
      origin: workflow.origin,
      lastUsedAt: Date.now(),
    }, target.id))
    const globalEvicted = evictExperiences(state, null, EXPERIENCE_LIMIT, target.id)
    return { saved: true, reason: 'replaced', experience: target, evicted: globalEvicted.evicted.length }
  }

  const created = upsertExperience(state, {
    key,
    title: workflow.name || '自动记录',
    workflowJson: workflow,
    hash,
    turn: workflow.turn,
    origin: workflow.origin,
    tags: ['auto'],
  })
  // 先按同键约束（其实已由覆盖逻辑保证 1 条），再按全局 LRU 约束总量
  evictExperiences(state, key, EXPERIENCE_LIMIT, created.experience.id)
  const globalEvicted = evictExperiences(state, null, EXPERIENCE_LIMIT, created.experience.id)
  return { saved: true, reason: 'created', experience: created.experience, evicted: globalEvicted.evicted.length }
}

export function experienceScore(experience, now = Date.now()) {
  const hours = Math.max(0, (now - Number(experience.lastUsedAt ?? now)) / 3600000)
  return (experience.adoptions ?? 0) / (1 + hours)
}

export function listExperiences(state, key) {
  const now = Date.now()
  return (state.experiences ?? [])
    .filter((item) => item.key === (key ?? EXPERIENCE_GLOBAL_KEY))
    .sort((a, b) => experienceScore(b, now) - experienceScore(a, now))
}

export function upsertExperience(state, input) {
  const experiences = state.experiences ?? (state.experiences = [])
  const normalized = normalizeExperience(input, input?.id)
  if (!normalized) throw new Error('experience must be an object')
  const existing = experiences.find((item) => item.id === normalized.id
    || (item.key === normalized.key && item.title === normalized.title))
  if (existing) {
    const merged = normalizeExperience({ ...existing, ...normalized, id: existing.id, createdAt: existing.createdAt }, existing.id)
    Object.assign(existing, merged)
    return { experience: existing, replaced: true }
  }
  experiences.push(normalized)
  return { experience: normalized, replaced: false }
}

export function evictExperiences(state, key, limit = EXPERIENCE_LIMIT, protectId = null) {
  const experiences = state.experiences ?? (state.experiences = [])
  // key === null → 全局淘汰（跨任务）：自动入库每个任务都有独立 key，
  // 只按 key 淘汰约束不了总量，必须同时有全局上限。
  const inKey = key === null ? experiences : experiences.filter((item) => item.key === (key ?? EXPERIENCE_GLOBAL_KEY))
  const evicted = []
  let overflow = inKey.length - Math.max(1, limit)
  if (overflow <= 0) return { evicted, full: false }
  const ordered = [...inKey].sort((a, b) => experienceScore(a) - experienceScore(b))
  for (const item of ordered) {
    if (overflow <= 0) break
    if (item.pinned === true) continue
    if (protectId !== null && item.id === protectId) continue
    const index = experiences.indexOf(item)
    if (index >= 0) {
      experiences.splice(index, 1)
      evicted.push(item)
      overflow -= 1
    }
  }
  return { evicted, full: overflow > 0 }
}

export function touchExperience(state, id, kind = 'render') {
  const experiences = state.experiences ?? (state.experiences = [])
  const item = experiences.find((entry) => entry.id === id)
  if (!item) return null
  item.lastUsedAt = Date.now()
  if (kind === 'adopt') item.adoptions = (item.adoptions ?? 0) + 1
  return item
}
