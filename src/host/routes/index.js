/*! dsh-agent-flow v0.1.0 | Copyright (c) 2026 RimeLumen | MIT License */
import { dirname, join } from 'node:path'
import { ERROR_CODES, FlowError, createErrorSink } from '../errors.js'
import { SelectionError, resolveEffective } from '../selection.js'
import { compilePattern, isLoopbackRequest, readJsonBody, writeError, writeRouteError } from './http.js'
import { catalogCacheFrom } from '../catalog.js'
import { selectionRoutes } from './selection.js'
import { workflowRoutes } from './workflow.js'
import { runsRoutes } from './runs.js'
import { dataRoutes } from './data.js'
import { planRoutes } from './plan.js'
import { errorRoutes } from './errors.js'
import { experienceRoutes } from './experience.js'

export function registerRoutes(deps) {
  const { ctx, store, registry, logger } = deps
  const log = typeof logger === 'function' ? logger : () => {}

  const errors = deps.errors ?? createErrorSink({ dir: join(dirname(store.file), 'errors') })

  const effectiveFor = (sessionId, workspaceId) => resolveEffective(store.state, {
    sessionId: sessionId || undefined,
    workspaceId: workspaceId || undefined,
  })

  const refreshCatalog = async (options = {}) => {
    if (typeof deps.buildCatalog !== 'function') return null
    const snapshot = await deps.buildCatalog({ sessionId: options.sessionId, cwd: options.cwd })
    store.catalogCache = catalogCacheFrom(snapshot)
    return snapshot
  }

  const shared = { ...deps, ctx, store, registry, log, errors, effectiveFor, refreshCatalog }

  const routes = [
    ...selectionRoutes(shared),
    ...workflowRoutes(shared),
    ...runsRoutes(shared),
    ...dataRoutes(shared),
    ...planRoutes(shared),
    ...errorRoutes(shared),
    ...experienceRoutes(shared),
  ]

  const compiled = routes.map((route) => ({ ...route, ...compilePattern(route.pattern) }))

  const handler = async (req, res) => {
    try {
      if (!isLoopbackRequest(req)) {
        writeError(res, 403, new FlowError(ERROR_CODES.HTTP_LOOPBACK_ONLY, 'agent-flow 只接受本机回环请求', { kind: 'permission', source: 'route' }))
        return
      }
      // 就绪门（批次 6）：state 未加载完就先等一下，避免首帧读到空 state 而显示"没有流程"。
      if (deps.store && typeof deps.store.ready === 'function') {
        try {
          await deps.store.ready()
        } catch (error) {
          deps.logger?.('store readiness gate failed: ' + (error instanceof Error ? error.message : String(error)))
        }
      }
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      const path = url.pathname.replace(/^\/api\/agent-flow/, '') || '/'
      const pathMatches = compiled.filter((route) => route.re.test(path))
      if (pathMatches.length === 0) {
        writeError(res, 404, new SelectionError('not-found', `没有这个接口：${url.pathname}`))
        return
      }
      const match = pathMatches.find((route) => route.method === req.method)
      if (!match) {
        writeError(res, 405, new SelectionError('validation', `${url.pathname} 只接受 ${pathMatches.map((route) => route.method).join(' / ')}`))
        return
      }
      const params = {}
      const matched = match.re.exec(path)
      match.names.forEach((name, index) => {
        params[name] = decodeURIComponent(matched[index + 1] ?? '')
      })
      let body = {}
      if (match.method !== 'GET') {
        const parsed = await readJsonBody(req)
        if (parsed === undefined) {
          writeError(res, 400, new SelectionError('validation', '请求体不是合法 JSON 或过大'))
          return
        }
        body = parsed
      }
      await match.handler({ req, res, url, body, params })
    } catch (error) {
      log(`route error: ${error instanceof Error ? error.message : String(error)}`)
      if (!res.headersSent) writeRouteError(res, error, errors, { source: 'route', route: `${req.method} ${req.url ?? ''}` })
      else res.end()
    }
  }

  const disposer = ctx.webServer.register({ kind: 'prefix', path: '/api/agent-flow', handler })
  return { disposer, refreshCatalog }
}

export { RunRegistry } from '../flow/scheduler.js'
export { MAX_JSON_BODY_BYTES } from './http.js'
