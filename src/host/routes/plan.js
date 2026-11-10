/*! dsh-agent-flow v0.1.0 | Copyright (c) 2026 RimeLumen | MIT License */
import { ERROR_CODES, FlowError } from '../errors.js'
import { queryParam, readString, writeError, writeJson } from './http.js'
import { autoCaptureExperience } from '../experience.js'

export function planRoutes(deps) {

  // store 必须从 deps 解构：此前漏了它，store.state 会抛 ReferenceError，
  // 而 try/catch 会把这个错误吞掉——自动入库会静默永不生效。
  const { store } = deps

  const planUnavailable = (res) => writeError(res, 503, new FlowError(ERROR_CODES.INTERNAL, '计划服务不可用', { kind: 'internal', source: 'plan' }))
  return [
    {
      method: 'GET',
      pattern: '/plan',
      handler: async ({ res, url }) => {
        const sessionId = queryParam(url, 'sessionId') ?? ''
        // 版本号短路（性能审计 R-A）：客户端带上次见到的 updatedAt，无变化时
        // 只回一个空壳——省掉 steps/phases 的全量序列化与传输（稳态轮询 99% 命中）。
        const since = queryParam(url, 'since') ?? ''
        if (since !== '') {
          const plan = deps.plans ? deps.plans.describe(sessionId) : null
          const current = plan?.updatedAt ?? ''
          if (current !== '' && current === since) {
            writeJson(res, 200, { same: true, updatedAt: current })
            return
          }
        }
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
        // 自动入库（批次 5）：只在用户**确认/调整**后落库——skipped / timeout 不落，
        // 未采纳的草稿不会变成噪声。落库在确认之后，也满足"延后落库"（不写半成品）。
        try {
          const active = store.state.workflows.find((item) => item.sessionId === sessionId && !item.archivedAt)
          if (active) autoCaptureExperience(store.state, active, {})
        } catch (error) {
          // 自动入库是附带能力，失败不该让确认失败；但必须留痕——
          // 静默吞掉会让「经验库不再增长」这种失效无人发现。
          deps.logger?.('auto capture failed: ' + (error instanceof Error ? error.message : String(error)))
        }
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
