/*! dsh-agent-flow v0.1.0 | Copyright (c) 2026 RimeLumen | MIT License */
import { FlowError, ERROR_CODES } from '../errors.js'
import {
  EXPERIENCE_LIMIT,
  evictExperiences,
  experienceKey,
  listExperiences,
  touchExperience,
  upsertExperience,
} from '../experience.js'
import { queryParam, readString, writeError, writeJson } from './http.js'

export function experienceRoutes(deps) {
  const { store } = deps

  return [
    {
      method: 'GET',
      pattern: '/experiences',
      handler: async ({ res, url }) => {
        const key = experienceKey(queryParam(url, 'workspaceId'), queryParam(url, 'cwd'))
        writeJson(res, 200, { key, experiences: listExperiences(store.state, key) })
      },
    },
    {
      method: 'POST',
      pattern: '/experiences',
      handler: async ({ res, body }) => {
        const key = experienceKey(readString(body, 'workspaceId'), readString(body, 'cwd'))
        const experience = await store.mutate((state) => {
          const result = upsertExperience(state, {
            ...body,
            key,
            turn: Number.isFinite(Number(body.turn)) ? Number(body.turn) : undefined,
          })
          const evicted = evictExperiences(state, key, EXPERIENCE_LIMIT, result.experience.id)
          if (evicted.full) {
            const index = state.experiences.findIndex((item) => item.id === result.experience.id && result.replaced === false)
            if (index >= 0) state.experiences.splice(index, 1)
          }
          return { experience: evicted.full ? null : result.experience, evicted: evicted.evicted, full: evicted.full }
        })
        if (experience.full) {
          writeError(res, 409, new FlowError(ERROR_CODES.EXPERIENCE_FULL, '经验库已满且全部置顶：请先取消置顶或删除旧经验', {
            kind: 'conflict',
            source: 'experience',
            hints: ['右键经验卡取消置顶，或在设置里删除不再需要的经验'],
          }))
          return
        }
        writeJson(res, 200, { ok: true, experience: experience.experience, evicted: experience.evicted.length })
      },
    },
    {
      method: 'POST',
      pattern: '/experiences/:id/pin',
      handler: async ({ res, params }) => {
        const experience = await store.mutate((state) => {
          const item = (state.experiences ?? []).find((entry) => entry.id === params.id)
          if (!item) return null
          item.pinned = item.pinned !== true
          return item
        })
        if (!experience) {
          writeError(res, 404, new FlowError(ERROR_CODES.NOT_FOUND, `找不到经验 ${params.id}`, { kind: 'not-found', source: 'experience' }))
          return
        }
        writeJson(res, 200, { ok: true, experience })
      },
    },
    {
      method: 'POST',
      pattern: '/experiences/:id/adopt',
      handler: async ({ res, params }) => {
        const experience = await store.mutate((state) => touchExperience(state, params.id, 'adopt'))
        if (!experience) {
          writeError(res, 404, new FlowError(ERROR_CODES.NOT_FOUND, `找不到经验 ${params.id}`, { kind: 'not-found', source: 'experience' }))
          return
        }
        writeJson(res, 200, { ok: true, experience })
      },
    },
    {
      method: 'DELETE',
      pattern: '/experiences/:id',
      handler: async ({ res, params }) => {
        const removed = await store.mutate((state) => {
          const experiences = state.experiences ?? (state.experiences = [])
          const index = experiences.findIndex((entry) => entry.id === params.id)
          if (index < 0) return null
          return experiences.splice(index, 1)[0]
        })
        if (!removed) {
          writeError(res, 404, new FlowError(ERROR_CODES.NOT_FOUND, `找不到经验 ${params.id}`, { kind: 'not-found', source: 'experience' }))
          return
        }
        writeJson(res, 200, { ok: true })
      },
    },
  ]
}
