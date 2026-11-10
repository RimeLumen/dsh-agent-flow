/*! dsh-agent-flow v0.1.0 | Copyright (c) 2026 RimeLumen | MIT License */
import { SelectionError } from '../selection.js'
import { createEmptyWorkflow, normalizeWorkflow, validateWorkflow } from '../flow/model.js'
import { toMermaid, fromMermaid } from '../mermaid.js'
import { composePrompt } from '../compose.js'
import { queryParam, readString, shortId, writeError, writeJson } from './http.js'

export function workflowRoutes(deps) {
  const { store, registry, refreshCatalog } = deps

  const activeRun = (workflowId) => registry?.list?.().find((run) => run.workflowId === workflowId && run.status === 'running')

  const workflowOr404 = (res, id) => {
    const workflow = store.state.workflows.find((item) => item.id === id)
    if (!workflow) writeError(res, 404, new SelectionError('not-found', `找不到流程 ${id}`))
    return workflow ?? null
  }

  return [
    {
      method: 'GET',
      pattern: '/workflows',
      handler: async ({ res, url }) => {
        const archived = queryParam(url, 'archived') ?? '0'
        const wanted = archived === 'all'
          ? () => true
          : archived === 'only'
            ? (workflow) => Boolean(workflow.archivedAt)
            : (workflow) => !workflow.archivedAt
        writeJson(res, 200, {
          workflows: store.state.workflows.filter(wanted).map((workflow) => ({
            id: workflow.id,
            name: workflow.name,
            description: workflow.description ?? '',
            nodes: Array.isArray(workflow.nodes) ? workflow.nodes.length : 0,
            updatedAt: workflow.updatedAt ?? null,
            sessionId: workflow.sessionId ?? null,
            origin: workflow.origin ?? 'user',
            mode: workflow.mode === 'design' ? 'design' : 'task',
            layout: ['chain', 'star', 'radial'].includes(workflow.layout) ? workflow.layout : 'chain',
            turn: Number.isFinite(Number(workflow.turn)) ? Number(workflow.turn) : 0,
            phases: Array.isArray(workflow.phases) ? workflow.phases.length : 0,
            archivedAt: workflow.archivedAt ?? null,
          })),
        })
      },
    },
    {
      method: 'POST',
      pattern: '/workflows',
      handler: async ({ res, body }) => {
        const name = readString(body, 'name') || `新流程 ${new Date().toLocaleString('zh-CN')}`
        const fromId = readString(body, 'from')
        const sessionId = readString(body, 'sessionId')
        let workflow
        if (fromId !== '') {
          const source = workflowOr404(res, fromId)
          if (!source) return
          workflow = normalizeWorkflow({ ...JSON.parse(JSON.stringify(source)), id: shortId('wf'), name, sessionId: undefined, archivedAt: undefined, updatedAt: undefined })
          const idMap = new Map()
          for (const node of workflow.nodes) {
            const nextId = shortId('n')
            idMap.set(node.id, nextId)
            node.id = nextId
          }
          workflow.entry = idMap.get(source.entry) ?? workflow.nodes[0]?.id ?? ''
          for (const edge of workflow.edges) {
            edge.from = idMap.get(edge.from) ?? edge.from
            edge.to = idMap.get(edge.to) ?? edge.to
            edge.id = `e_${edge.from}_${edge.to}`
          }
        } else {
          workflow = createEmptyWorkflow(name, sessionId === '' ? {} : { sessionId, origin: 'session' })
        }
        await store.mutate((state) => {
          state.workflows.push(workflow)
        })
        writeJson(res, 200, { workflow })
      },
    },
    {
      method: 'GET',
      pattern: '/workflows/:id',
      handler: async ({ res, params }) => {
        const workflow = workflowOr404(res, params.id)
        if (!workflow) return
        writeJson(res, 200, { workflow })
      },
    },
    {
      method: 'PUT',
      pattern: '/workflows/:id',
      handler: async ({ res, params, body }) => {
        const incoming = body.workflow && typeof body.workflow === 'object' ? body.workflow : body
        const normalized = normalizeWorkflow({ ...incoming, id: params.id })
        if (!normalized) {
          writeError(res, 400, new SelectionError('validation', 'workflow must be an object'))
          return
        }
        const result = await store.mutate((state) => {
          const index = state.workflows.findIndex((item) => item.id === params.id)
          if (index < 0) throw new SelectionError('not-found', `找不到流程 ${params.id}`)
          if (incoming.archivedAt === undefined) normalized.archivedAt = state.workflows[index].archivedAt
          if (incoming.sessionId === undefined) normalized.sessionId = state.workflows[index].sessionId
          state.workflows[index] = normalized
          return normalized
        })
        writeJson(res, 200, { ok: true, workflow: result, revision: result.updatedAt })
      },
    },
    {
      // 反向组合（批次 3）：画布 → 提示词。
      method: 'POST',
      pattern: '/workflows/:id/compose',
      handler: async ({ res, params, body }) => {
        const workflow = store.state.workflows.find((item) => item.id === params.id)
        if (!workflow) {
          writeError(res, 404, new SelectionError('not-found', '找不到该流程'))
          return
        }
        const result = composePrompt(workflow, {
          goal: typeof body?.goal === 'string' ? body.goal : undefined,
          includeVars: body?.includeVars !== false,
        })
        if (result.text === '') {
          writeError(res, 400, new SelectionError('validation', result.warnings[0]?.message ?? '画布为空'))
          return
        }
        writeJson(res, 200, result)
      },
    },
    {
      method: 'POST',
      pattern: '/workflows/:id/archive',
      handler: async ({ res, params }) => {
        const found = workflowOr404(res, params.id)
        if (!found) return
        const running = activeRun(params.id)
        if (running) {
          writeError(res, 409, new SelectionError('conflict', `这条流程正在运行（${running.id}）：先取消运行再归档`))
          return
        }
        const result = await store.mutate((state) => {
          const workflow = state.workflows.find((item) => item.id === params.id)
          if (!workflow) throw new SelectionError('not-found', `找不到流程 ${params.id}`)
          if (!workflow.archivedAt) workflow.archivedAt = new Date().toISOString()
          return workflow
        })
        writeJson(res, 200, { ok: true, workflow: result })
      },
    },
    {
      method: 'POST',
      pattern: '/workflows/:id/restore',
      handler: async ({ res, params }) => {
        const result = await store.mutate((state) => {
          const workflow = state.workflows.find((item) => item.id === params.id)
          if (!workflow) throw new SelectionError('not-found', `找不到流程 ${params.id}`)
          workflow.archivedAt = undefined
          return workflow
        })
        writeJson(res, 200, { ok: true, workflow: result })
      },
    },
    {
      method: 'DELETE',
      pattern: '/workflows/:id',
      handler: async ({ res, params }) => {
        const found = workflowOr404(res, params.id)
        if (!found) return
        if (!found.archivedAt) {
          writeError(res, 409, new SelectionError('conflict', '这条流程还没有归档：先归档，再从回收站永久删除'))
          return
        }
        const running = activeRun(params.id)
        if (running) {
          writeError(res, 409, new SelectionError('conflict', `这条流程正在运行（${running.id}）：先取消运行再删除`))
          return
        }
        await store.mutate((state) => {
          const index = state.workflows.findIndex((item) => item.id === params.id)
          if (index < 0) throw new SelectionError('not-found', `找不到流程 ${params.id}`)
          state.workflows.splice(index, 1)
        })
        writeJson(res, 200, { ok: true })
      },
    },
    {
      method: 'GET',
      pattern: '/workflows/:id/mermaid',
      handler: async ({ res, params }) => {
        const workflow = workflowOr404(res, params.id)
        if (!workflow) return
        writeJson(res, 200, { mermaid: toMermaid(workflow) })
      },
    },
    {
      method: 'POST',
      pattern: '/workflows/import-mermaid',
      handler: async ({ res, body }) => {
        const text = readString(body, 'mermaid')
        if (text === '') {
          writeError(res, 400, new SelectionError('validation', 'mermaid 源码为空'))
          return
        }
        const name = readString(body, 'name')
        const { workflow, issues } = fromMermaid(text, { name: name === '' ? undefined : name })
        if (workflow.nodes.length === 0) {
          writeError(res, 400, new SelectionError('validation', '没有解析出任何节点：请检查 Mermaid 语法'))
          return
        }
        const normalized = normalizeWorkflow({ ...workflow, id: undefined })
        await store.mutate((state) => {
          state.workflows.push(normalized)
        })
        writeJson(res, 200, { ok: true, workflow: normalized, issues })
      },
    },
    {
      method: 'POST',
      pattern: '/workflows/:id/validate',
      handler: async ({ res, params, url }) => {
        const workflow = workflowOr404(res, params.id)
        if (!workflow) return
        if (typeof deps.buildCatalog === 'function') await refreshCatalog({ sessionId: queryParam(url, 'sessionId') ?? '' })
        const cache = store.catalogCache
        const issues = validateWorkflow(workflow, {
          knownToolNames: cache?.knownToolNames ?? [],
          knownSkillNames: cache?.knownSkillNames ?? [],
          knownWorkflowIds: store.state.workflows.map((item) => item.id),
        })
        writeJson(res, 200, { issues })
      },
    },
  ]
}
