/*! dsh-agent-flow v0.1.0 | Copyright (c) 2026 RimeLumen | MIT License */
import {
  DEFAULT_PROFILE_NAME,
  SelectionError,
  deleteProfile,
  ensureDefaultProfile,
  listProfiles,
  upsertProfile,
} from '../selection.js'
import { queryParam, readString, writeError, writeJson } from './http.js'

export function selectionRoutes(deps) {
  const { store, effectiveFor, refreshCatalog } = deps

  const profileOr404 = (res, id) => {
    const profile = store.state.profiles.find((item) => item.id === id)
    if (!profile) writeError(res, 404, new SelectionError('not-found', `找不到方案 ${id}`))
    return profile ?? null
  }

  return [
    {
      method: 'GET',
      pattern: '/catalog',
      handler: async ({ res, url }) => {
        const sessionId = queryParam(url, 'sessionId') ?? ''
        const cwd = queryParam(url, 'cwd') || undefined
        const snapshot = await refreshCatalog({ sessionId, cwd })
        if (!snapshot) {
          writeJson(res, 200, { tools: [], skills: [], complete: false, warnings: ['catalog service is unavailable'], errors: [] })
          return
        }
        writeJson(res, 200, snapshot)
      },
    },
    {
      method: 'GET',
      pattern: '/selection',
      handler: async ({ res }) => {
        writeJson(res, 200, { profiles: listProfiles(store.state) })
      },
    },
    {
      method: 'PUT',
      pattern: '/selection',
      handler: async ({ res, body, url }) => {
        const input = body.profile && typeof body.profile === 'object' ? body.profile : body
        const profile = await store.mutate((state) => upsertProfile(state, input))
        const sessionId = queryParam(url, 'sessionId') ?? ''
        if (sessionId !== '' && deps.lifecycle) await deps.lifecycle.reapply(sessionId)
        writeJson(res, 200, { ok: true, profile })
      },
    },
    {
      method: 'DELETE',
      pattern: '/selection/:id',
      handler: async ({ res, params }) => {
        await store.mutate((state) => {
          deleteProfile(state, params.id)
          for (const workflow of state.workflows) {
            if (workflow.selectionProfileId === params.id) workflow.selectionProfileId = undefined
          }
        })
        writeJson(res, 200, { ok: true })
      },
    },
    {
      method: 'POST',
      pattern: '/selection/default',
      handler: async ({ res }) => {
        const cache = store.catalogCache
        const profile = await store.mutate((state) => {
          const existing = state.profiles.find((item) => item.origin === 'ai-default' || item.name === DEFAULT_PROFILE_NAME)
          if (existing) {
            existing.auto = true
            existing.origin = 'ai-default'
            existing.isDefault = true
          }
          const result = ensureDefaultProfile(state, {
            officialToolNames: cache?.officialToolNames,
            modelInvocableSkillNames: cache?.modelInvocableSkillNames,
            allToolNames: cache?.knownToolNames,
            allSkillNames: cache?.knownSkillNames,
          })
          return result.profile
        })
        writeJson(res, 200, { ok: true, profile })
      },
    },
    {
      method: 'POST',
      pattern: '/selection/:id/duplicate',
      handler: async ({ res, params, body }) => {
        const source = profileOr404(res, params.id)
        if (!source) return
        const requested = readString(body, 'name').trim()
        const profile = await store.mutate((state) => {
          const base = requested !== '' ? requested : `${source.name} 副本`
          let name = base
          let counter = 2
          while (state.profiles.some((item) => item.name === name)) {
            name = `${base} ${counter}`
            counter += 1
          }
          return upsertProfile(state, {
            ...JSON.parse(JSON.stringify(source)),
            id: undefined,
            name,
            origin: 'user',
            auto: false,
            isDefault: false,
          })
        })
        writeJson(res, 200, { ok: true, profile })
      },
    },
    {
      method: 'POST',
      pattern: '/selection/:id/apply',
      handler: async ({ res, params, body }) => {
        const source = profileOr404(res, params.id)
        if (!source) return
        const sessionId = readString(body, 'sessionId')
        const workspaceId = readString(body, 'workspaceId')
        const scope = sessionId !== ''
          ? { kind: 'session', sessionId }
          : workspaceId !== ''
            ? { kind: 'workspace', workspaceId }
            : { kind: 'global' }
        const profile = await store.mutate((state) => {
          const existing = state.profiles.find((item) => {
            if (item.scope?.kind !== scope.kind) return false
            if (scope.kind === 'session') return item.scope.sessionId === scope.sessionId
            if (scope.kind === 'workspace') return item.scope.workspaceId === scope.workspaceId
            return true
          })
          return upsertProfile(state, {
            ...JSON.parse(JSON.stringify(source)),
            id: existing?.id,
            name: existing?.name ?? (scope.kind === 'global' ? source.name : `${source.name} · ${scope.kind}`),
            scope,
            origin: source.origin === 'ai-default' && scope.kind === 'global' ? 'ai-default' : 'user',
            keepAuto: false,
          })
        })
        if (sessionId !== '' && deps.lifecycle) await deps.lifecycle.reapply(sessionId)
        writeJson(res, 200, { ok: true, profile })
      },
    },
    {
      method: 'GET',
      pattern: '/selection/effective',
      handler: async ({ res, url }) => {
        const eff = effectiveFor(queryParam(url, 'sessionId') ?? '', queryParam(url, 'workspaceId') ?? '')
        writeJson(res, 200, eff)
      },
    },
  ]
}
