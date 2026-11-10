/*! dsh-agent-flow v0.1.0 | Copyright (c) 2026 RimeLumen | MIT License */
import { DEFAULT_PREFS } from '../store.js'
import { SelectionError } from '../selection.js'
import { createRunRecord, executeRun } from '../flow/scheduler.js'
import { queryParam, readString, shortId, writeError, writeJson } from './http.js'

export function runsRoutes(deps) {
  const { store, registry, ctx, errors, log, effectiveFor } = deps

  const runOr404 = (res, id) => {
    const record = registry.get(id)
    if (!record) writeError(res, 404, new SelectionError('not-found', `找不到运行 ${id}`))
    return record ?? null
  }

  return [
    {
      method: 'GET',
      pattern: '/runs',
      handler: async ({ res, url }) => {
        const sessionId = queryParam(url, 'sessionId') ?? ''
        const runs = registry.list()
          .filter((run) => sessionId === '' || run.sessionId === sessionId)
          .map((run) => ({
            id: run.id,
            workflowId: run.workflowId,
            workflowName: run.workflowName,
            sessionId: run.sessionId,
            status: run.status,
            startedAt: run.startedAt,
            endedAt: run.endedAt,
            error: run.error,
            nodes: Object.keys(run.nodes).length,
          }))
        writeJson(res, 200, { runs })
      },
    },
    {
      method: 'POST',
      pattern: '/runs',
      handler: async ({ res, body }) => {
        const workflowId = readString(body, 'workflowId')
        const workflow = store.state.workflows.find((item) => item.id === workflowId)
        if (!workflow) {
          writeError(res, 404, new SelectionError('not-found', `找不到流程 ${workflowId}`))
          return
        }
        const sessionId = readString(body, 'sessionId')
        const vars = body.vars !== null && typeof body.vars === 'object' ? body.vars : {}
        const record = createRunRecord({
          id: shortId('run'),
          workflowId: workflow.id,
          workflowName: workflow.name,
          workflowRevision: workflow.updatedAt ?? '',
          sessionId: sessionId === '' ? null : sessionId,
          vars,
        })
        registry.add(record)
        const cache = store.catalogCache
        log(`run ${record.id} queued for workflow ${workflow.name}`)
        void executeRun({
          registry,
          record,
          workflow: JSON.parse(JSON.stringify(workflow)),
          workflows: new Map(store.state.workflows.map((item) => [item.id, item])),
          services: ctx,
          store,
          errors,
          limits: { ...DEFAULT_PREFS, ...(store.state.prefs ?? {}) },
          logger: log,
          selection: { resolve: (target) => effectiveFor(target?.sessionId, target?.workspaceId) },
          cwd: readString(body, 'cwd') || undefined,
          workspaceId: readString(body, 'workspaceId') || undefined,
          agent: deps.agentFor ? deps.agentFor(sessionId) : undefined,
          knownToolNames: cache?.knownToolNames ?? [],
          knownSkillNames: cache?.knownSkillNames ?? [],
        }).catch((error) => {
          record.status = 'failed'
          record.error = { message: error instanceof Error ? error.message : String(error), code: 'BOOT' }
          registry.emit(record.id, { type: 'run.end', data: { status: 'failed', error: record.error } })
          log(`run ${record.id} failed to start: ${record.error.message}`)
        })
        writeJson(res, 200, { runId: record.id })
      },
    },
    {
      method: 'GET',
      pattern: '/runs/:id',
      handler: async ({ res, params, url }) => {
        const record = runOr404(res, params.id)
        if (!record) return
        const since = Number(queryParam(url, 'since') ?? 0)
        writeJson(res, 200, {
          run: {
            id: record.id,
            workflowId: record.workflowId,
            workflowName: record.workflowName,
            sessionId: record.sessionId,
            status: record.status,
            startedAt: record.startedAt,
            endedAt: record.endedAt,
            paused: record.paused,
            cursor: [...record.cursor],
            vars: { ...record.vars },
            nodes: record.nodes,
            error: record.error,
            nextSeq: record.nextSeq,
          },
          frames: registry.framesSince(params.id, since),
        })
      },
    },
    {
      method: 'POST',
      pattern: '/runs/:id/control',
      handler: async ({ res, params, body }) => {
        const record = runOr404(res, params.id)
        if (!record) return
        const action = readString(body, 'action')
        if (action === 'pause') {
          record.paused = true
        } else if (action === 'resume') {
          record.paused = false
        } else if (action === 'cancel') {
          record.controller.abort()
        } else if (action === 'answer') {
          const nodeId = readString(body, 'nodeId')
          const answer = readString(body, 'answer')
          const answered = registry.answerCheckpoint(params.id, nodeId, answer)
          if (!answered) {
            writeError(res, 409, new SelectionError('conflict', '这个检查点已经不需要回答了'))
            return
          }
        } else {
          writeError(res, 400, new SelectionError('validation', `未知动作 ${action}`))
          return
        }
        writeJson(res, 200, { ok: true, status: record.status, paused: record.paused })
      },
    },
    {
      method: 'GET',
      pattern: '/runs/:id/stream',
      handler: async ({ res, params, url, req }) => {
        const record = runOr404(res, params.id)
        if (!record) return
        const since = Number(queryParam(url, 'since') ?? 0)
        res.writeHead(200, {
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-store',
          connection: 'keep-alive',
          'x-accel-buffering': 'no',
        })
        res.write(': dsh-agent-flow stream\n\n')
        const send = (frame) => {
          res.write(`id: ${frame.seq}\nevent: frame\ndata: ${JSON.stringify(frame)}\n\n`)
        }
        for (const frame of registry.framesSince(params.id, since)) send(frame)
        const unsubscribe = registry.subscribe(params.id, send)
        const heartbeat = setInterval(() => {
          try {
            res.write(`event: ping\ndata: ${Date.now()}\n\n`)
          } catch {
          }
        }, 15000)
        const cleanup = () => {
          clearInterval(heartbeat)
          unsubscribe()
        }
        req.on('close', cleanup)
        res.on('close', cleanup)
        if (record.status !== 'running') {
          setTimeout(cleanup, 200)
        }
      },
    },
  ]
}
