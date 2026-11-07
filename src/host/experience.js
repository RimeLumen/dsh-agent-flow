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
  }
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
  const inKey = experiences.filter((item) => item.key === (key ?? EXPERIENCE_GLOBAL_KEY))
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
