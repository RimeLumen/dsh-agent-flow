/*! dsh-agent-flow v0.1.0 | Copyright (c) 2026 RimeLumen | MIT License */
import { ERROR_CODES, FlowError } from '../errors.js'
import { queryParam, writeError, writeJson } from './http.js'

export function errorRoutes(deps) {
  const { errors } = deps

  return [
    {
      method: 'GET',
      pattern: '/errors',
      handler: async ({ res, url }) => {
        const limit = Number(queryParam(url, 'limit') ?? 50)
        const [items, stats] = await Promise.all([errors.list(limit), errors.stats()])
        writeJson(res, 200, { stats, items })
      },
    },
    {
      method: 'GET',
      pattern: '/errors/:id',
      handler: async ({ res, params }) => {
        const items = await errors.list(200)
        const found = items.find((item) => item.id === params.id)
        if (!found) {
          writeError(res, 404, new FlowError(ERROR_CODES.NOT_FOUND, `找不到错误记录 ${params.id}`, { kind: 'not-found', source: 'route' }))
          return
        }
        writeJson(res, 200, { item: found })
      },
    },
    {
      method: 'POST',
      pattern: '/errors/clear',
      handler: async ({ res }) => {
        await errors.clear()
        writeJson(res, 200, { ok: true })
      },
    },
  ]
}
