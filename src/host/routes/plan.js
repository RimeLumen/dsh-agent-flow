/*! dsh-agent-flow v0.1.0 | Copyright (c) 2026 RimeLumen | MIT License */
import { ERROR_CODES, FlowError } from '../errors.js'
import { queryParam, readString, writeError, writeJson } from './http.js'

export function planRoutes(deps) {

  const planUnavailable = (res) => writeError(res, 503, new FlowError(ERROR_CODES.INTERNAL, '计划服务不可用', { kind: 'internal', source: 'plan' }))
  return [
    {
      method: 'GET',
      pattern: '/plan',
      handler: async ({ res, url }) => {
        const sessionId = queryParam(url, 'sessionId') ?? ''
        writeJson(res, 200, {
          plan: deps.plans ? deps.plans.describe(sessionId) : { status: 'idle' },
          enabled: deps.planFirst !== false,
          timeoutMs: typeof deps.planTimeoutMs === 'function' ? deps.planTimeoutMs() : undefined,
        })
      },
    },
    {
      method: 'POST',
      pattern: '/plan/confirm',
      handler: async ({ res, body }) => {
        if (!deps.plans) {
          planUnavailable(res)
          return
        }
        const sessionId = readString(body, 'sessionId')
        const workflow = body.workflow && typeof body.workflow === 'object' ? body.workflow : undefined
        const result = await deps.plans.confirm(sessionId, workflow)
        writeJson(res, 200, { ok: true, result, plan: deps.plans.describe(sessionId) })
      },
    },
    {
      method: 'POST',
      pattern: '/plan/skip',
      handler: async ({ res, body }) => {
        if (!deps.plans) {
          planUnavailable(res)
          return
        }
        const sessionId = readString(body, 'sessionId')
        const result = deps.plans.skip(sessionId, readString(body, 'reason') || '用户选择跳过')
        writeJson(res, 200, { ok: true, result, plan: deps.plans.describe(sessionId) })
      },
    },
  ]
}
