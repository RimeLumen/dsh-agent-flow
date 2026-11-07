/*! dsh-agent-flow v0.1.0 | Copyright (c) 2026 RimeLumen | MIT License */
import { toErrorEnvelope } from '../errors.js'
import { HANDLERS, NodeError } from './handlers.js'
import { buildGraph, edgesFromPort, reachableFrom, validateWorkflow } from './model.js'
import { runExpr } from './expr.js'

const MAX_FRAMES = 2000

const MAX_RUNS = 20

export class RunRegistry {
  constructor(options = {}) {
    this.maxRuns = options.maxRuns ?? MAX_RUNS
    this.maxFrames = options.maxFrames ?? MAX_FRAMES

    this.runs = new Map()

    this.subscribers = new Map()

    this.checkpoints = new Map()
  }

  add(record) {
    this.runs.set(record.id, record)
    const ids = [...this.runs.keys()]
    while (ids.length > this.maxRuns) {
      const oldest = ids.shift()
      if (oldest === undefined) break
      const candidate = this.runs.get(oldest)
      if (candidate && candidate.status === 'running') {
        ids.push(oldest)
        break
      }
      this.runs.delete(oldest)
      this.subscribers.delete(oldest)
    }
    return record
  }

  get(id) {
    return this.runs.get(id)
  }

  list() {
    return [...this.runs.values()].sort((a, b) => b.startedAt - a.startedAt)
  }

  emit(runId, frame) {
    const record = this.runs.get(runId)
    if (!record) return null
    const full = {
      seq: record.nextSeq++,
      ts: Date.now(),
      type: frame.type,
      nodeId: frame.nodeId,
      edgeId: frame.edgeId,
      data: frame.data,
    }
    record.frames.push(full)
    if (record.frames.length > this.maxFrames) record.frames.splice(0, record.frames.length - this.maxFrames)
    for (const listener of this.subscribers.get(runId) ?? []) {
      try {
        listener(full)
      } catch {
      }
    }
    return full
  }

  subscribe(runId, listener) {
    if (!this.subscribers.has(runId)) this.subscribers.set(runId, new Set())
    this.subscribers.get(runId).add(listener)
    return () => {
      this.subscribers.get(runId)?.delete(listener)
    }
  }

  framesSince(runId, since) {
    const record = this.runs.get(runId)
    if (!record) return []
    const from = Number.isFinite(Number(since)) ? Number(since) : 0
    return record.frames.filter((frame) => frame.seq > from)
  }

  requestCheckpoint(runId, nodeId, resolve) {
    this.checkpoints.set(`${runId}:${nodeId}`, { resolve, nodeId })
  }

  answerCheckpoint(runId, nodeId, answer) {
    const key = `${runId}:${nodeId}`
    const entry = this.checkpoints.get(key)
    if (!entry) return false
    this.checkpoints.delete(key)
    entry.resolve(answer)
    return true
  }

  clearCheckpoints(runId) {
    for (const [key, entry] of [...this.checkpoints.entries()]) {
      if (key.startsWith(`${runId}:`)) {
        this.checkpoints.delete(key)
        entry.resolve('（运行已结束，未收到回答）')
      }
    }
  }
}

export function createRunRecord(options) {
  return {
    id: options.id,
    workflowId: options.workflowId,
    workflowName: options.workflowName ?? '',
    workflowRevision: options.workflowRevision ?? '',
    parentRunId: options.parentRunId ?? null,
    sessionId: options.sessionId ?? null,
    status: 'queued',
    startedAt: Date.now(),
    endedAt: null,
    nodes: {},
    cursor: [],
    vars: Object.fromEntries(Object.entries(options.vars ?? {}).filter(([, value]) => typeof value === 'string')),
    frames: [],
    nextSeq: 1,
    error: null,
    paused: false,
    controller: new AbortController(),
  }
}

function nodeSlot(node) {
  return {
    nodeId: node.id,
    kind: node.kind,
    title: node.title,
    status: 'pending',
    attempt: 0,
    startedAt: null,
    endedAt: null,
    input: null,
    output: null,
    branch: null,
    error: null,
    toolCalls: [],
    iterations: 0,
  }
}

class GraphRunner {

  constructor(deps) {
    this.record = deps.record
    this.registry = deps.registry
    this.workflow = deps.workflow
    this.graph = deps.graph
    this.services = deps.services
    this.store = deps.store
    this.errors = deps.errors
    this.limits = deps.limits
    this.logger = deps.logger
    this.selection = deps.selection
    this.cwd = deps.cwd
    this.workspaceId = deps.workspaceId
    this.runSubflow = deps.runSubflow
    this.depth = deps.depth ?? 0
    this.sessionId = this.record.sessionId ?? undefined
    this.agent = deps.agent

    this.allowed = deps.allowed

    this.pending = new Set(deps.initial ?? [])

    this.settled = new Map()

    this.activatedEdges = new Set()
  }

  get aborted() {
    return this.record.controller.signal.aborted
  }

  inEdges(id) {
    return (this.graph.inc.get(id) ?? []).filter((edge) => this.allowed.has(edge.from))
  }

  outEdges(id) {
    return (this.graph.out.get(id) ?? []).filter((edge) => this.allowed.has(edge.to))
  }

  maybeEnqueue(id) {
    if (!this.allowed.has(id) || this.settled.has(id) || this.pending.has(id)) return
    const ins = this.inEdges(id)
    if (ins.length === 0) {
      this.pending.add(id)
      return
    }
    const node = this.graph.nodes.get(id)
    const mode = node?.kind === 'flow.join' ? node.params?.mode : 'all'
    const anySettled = ins.some((edge) => this.settled.has(edge.from))
    const anyActivated = ins.some((edge) => this.activatedEdges.has(edge.id))
    if ((mode === 'any' || mode === 'first') && anySettled && anyActivated) {
      this.pending.add(id)
      return
    }
    const allSettled = ins.every((edge) => this.settled.has(edge.from))
    if (allSettled && anyActivated) this.pending.add(id)
  }

  activate(nodeId, ports) {
    for (const port of ports) {
      for (const edge of this.outEdges(nodeId)) {
        if (edge.fromPort !== port) continue
        this.activatedEdges.add(edge.id)
        this.registry.emit(this.record.id, { type: 'edge.traverse', nodeId, edgeId: edge.id, data: { port } })
        this.maybeEnqueue(edge.to)
      }
    }
  }

  async waitWhilePaused() {
    while (this.record.paused && !this.aborted) {
      await new Promise((resolve) => setTimeout(resolve, 120))
    }
    return !this.aborted
  }

  async run() {
    while (this.pending.size > 0) {
      if (!(await this.waitWhilePaused())) return 'cancelled'
      const wave = [...this.pending]
      this.pending.clear()
      const chunk = Math.max(1, Math.min(8, Number(this.limits.maxParallel) || 3))
      for (let index = 0; index < wave.length; index += chunk) {
        if (!(await this.waitWhilePaused())) return 'cancelled'
        const slice = wave.slice(index, index + chunk)
        await Promise.all(slice.map((id) => this.runNode(id)))
        if (this.record.status === 'failed') return 'failed'
      }
    }
    return this.record.status === 'failed' ? 'failed' : 'ok'
  }

  async runNode(id) {
    const node = this.graph.nodes.get(id)
    if (!node) {
      this.settled.set(id, 'skipped')
      return
    }
    const slot = this.record.nodes[id] ?? (this.record.nodes[id] = nodeSlot(node))
    const handler = HANDLERS[node.kind]
    if (!handler || typeof handler.run !== 'function') {
      this.settleFailed(id, slot, new NodeError('NO_HANDLER', `没有 ${node.kind} 的处理器`), node)
      return
    }

    const last = this.lastOutputOf(id)
    const retryMax = Math.max(0, Number(node.retry?.max) || 0)
    let attempt = 0
    for (;;) {
      attempt += 1
      slot.attempt = attempt
      slot.status = 'running'
      slot.startedAt = Date.now()
      if (!this.record.cursor.includes(id)) this.record.cursor.push(id)
      this.registry.emit(this.record.id, { type: 'node.enter', nodeId: id, data: { attempt, kind: node.kind, title: node.title } })

      try {
        const result = await this.invokeHandler(node, handler, last, slot)
        slot.status = 'succeeded'
        slot.endedAt = Date.now()
        slot.output = result?.output ?? null
        slot.branch = Array.isArray(result?.ports) ? result.ports.join(',') : null
        this.settled.set(id, 'succeeded')
        this.removeCursor(id)
        this.registry.emit(this.record.id, {
          type: 'node.exit',
          nodeId: id,
          data: { status: 'succeeded', ports: result?.ports ?? ['out'], output: summarize(slot.output), ms: slot.endedAt - slot.startedAt },
        })
        this.activate(id, Array.isArray(result?.ports) ? result.ports : ['out'])
        return
      } catch (error) {
        const isTimeout = error instanceof NodeError && error.code === 'TIMEOUT'
        const isCancelled = error instanceof NodeError && error.code === 'CANCELLED'
        if (isCancelled && this.aborted) {
          slot.status = 'cancelled'
          slot.endedAt = Date.now()
          slot.error = { message: '已取消', code: 'CANCELLED' }
          this.settled.set(id, 'cancelled')
          this.removeCursor(id)
          this.registry.emit(this.record.id, { type: 'node.exit', nodeId: id, data: { status: 'cancelled' } })
          return
        }
        const retryable = !(node.kind === 'tool.call' && node.params?.allowRetry !== true)
        if (!isTimeout && retryMax > 0 && !retryable && attempt === 1) {
          this.registry.emit(this.record.id, { type: 'log', nodeId: id, data: { level: 'warn', message: '该节点有副作用，按策略不重试（可在节点参数里打开 allowRetry）' } })
        }
        if (!isTimeout && attempt <= retryMax && retryable) {
          const backoff = Math.max(0, Number(node.retry?.backoffMs) || 500) * Math.max(1, attempt)
          this.registry.emit(this.record.id, { type: 'log', nodeId: id, data: { level: 'warn', message: `第 ${attempt} 次失败，${backoff}ms 后重试：${messageOf(error)}` } })
          await new Promise((resolve) => setTimeout(resolve, Math.min(backoff, 30000)))
          continue
        }
        this.settleFailed(id, slot, error, node)
        return
      }
    }
  }

  async invokeHandler(node, handler, last, slot) {
    const timeoutMs = Number(node.timeoutMs) > 0 ? Number(node.timeoutMs) : Number(this.limits.nodeTimeoutMs) || 600000
    const controller = new AbortController()
    const onOuterAbort = () => controller.abort()
    this.record.controller.signal.addEventListener('abort', onOuterAbort, { once: true })
    let timer
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => {
        controller.abort()
        reject(new NodeError('TIMEOUT', `节点超时（${timeoutMs}ms）`))
      }, timeoutMs)
    })
    const runCtx = {
      runId: this.record.id,
      workflow: this.workflow,
      node,
      sessionId: this.sessionId,
      workspaceId: this.workspaceId,
      cwd: this.cwd,
      agent: this.agent,
      vars: this.record.vars,
      outputs: this.outputsView(),
      last,
      signal: controller.signal,
      emit: (frame) => this.registry.emit(this.record.id, { ...frame, nodeId: frame.nodeId ?? node.id }),
      log: (level, message) => this.registry.emit(this.record.id, { type: 'log', nodeId: node.id, data: { level, message } }),
      checkpoint: (request) => this.checkpoint(node, request),
      services: this.services,
      store: this.store,
      selection: this.selection,
      limits: this.limits,
      depth: this.depth,
      runSubflow: this.runSubflow,
    }
    try {
      if (node.kind === 'tool.call') slot.toolCalls.push({ callId: `${node.id}:pending`, name: String(node.params?.name ?? ''), status: 'running' })
      if (node.kind === 'flow.loop') return await this.runLoop(node, runCtx, handler)
      if (node.kind === 'group.steps') return await this.runGroup(node, runCtx, handler)
      return await Promise.race([handler.run(node, runCtx), timeout])
    } finally {
      clearTimeout(timer)
      this.record.controller.signal.removeEventListener('abort', onOuterAbort)
    }
  }

  async runLoop(node, runCtx, handler) {
    const base = await handler.run(node, runCtx)
    const maxIterations = Math.max(1, Math.min(50, Number(base?.output?.maxIterations) || 5))
    const bodyTargets = edgesFromPort(this.workflow, node.id, 'body').map((edge) => edge.to).filter((id) => this.allowed.has(id))
    const subAllowed = new Set(bodyTargets.flatMap((id) => [...reachableFrom(this.workflow, id)]).filter((id) => this.allowed.has(id)))
    const untilExpr = typeof node.params?.untilExpr === 'string' ? node.params.untilExpr : ''
    const slot = this.record.nodes[node.id]
    let iterations = 0
    let untilHit = false
    for (let i = 0; i < maxIterations; i += 1) {
      if (this.aborted) throw new NodeError('CANCELLED', '循环被取消')
      iterations += 1
      slot.iterations = iterations
      this.registry.emit(this.record.id, { type: 'log', nodeId: node.id, data: { level: 'info', message: `循环第 ${iterations} 轮` } })
      const nested = new GraphRunner({
        ...this.describe(),
        allowed: subAllowed,
        initial: bodyTargets,
      })
      const outcome = await nested.run()
      for (const [id2, status] of nested.settled) {
        this.settled.set(id2, status)
        const target = this.graph.inc.get(id2) ?? []
        for (const edge of target) this.activatedEdges.add(edge.id)
      }
      if (outcome !== 'ok') throw new NodeError('LOOP_ABORTED', '循环体执行未正常完成')
      if (untilExpr.trim() !== '') {
        const parsed = runExpr(untilExpr, { vars: this.record.vars, last: this.lastOutputOf(node.id), node: this.outputsView() })
        if (!parsed.ok) throw new NodeError('BAD_EXPR', `循环条件求值失败：${parsed.error}`)
        if (Boolean(parsed.value)) {
          untilHit = true
          break
        }
      }
    }
    return { output: { iterations, untilHit, maxIterations }, ports: ['exit'] }
  }

  async runGroup(node, runCtx, handler) {
    const base = await handler.run(node, runCtx)
    const depth = (this.groupDepth ?? 0) + 1
    if (depth > 3) throw new NodeError('GROUP_DEPTH', '父级流程嵌套超过 3 层')
    this.groupDepth = depth
    try {
      const children = this.workflow.nodes
        .filter((item) => item.parentId === node.id)
        .sort((a, b) => (Number(a.pos?.y) || 0) - (Number(b.pos?.y) || 0) || a.id.localeCompare(b.id))
      const steps = []
      let last = this.lastOutputOf(node.id)
      for (const child of children) {
        if (this.aborted) throw new NodeError('CANCELLED', '父级流程被取消')
        const result = await this.runChild(child, last)
        last = result?.output ?? last
        steps.push({ id: child.id, title: child.title, kind: child.kind, output: summarize(result?.output ?? null) })
      }
      return { output: { ...(base?.output ?? {}), count: children.length, steps }, ports: ['out'] }
    } finally {
      this.groupDepth = depth - 1
    }
  }

  async runChild(child, last) {
    const slot = this.record.nodes[child.id] ?? (this.record.nodes[child.id] = nodeSlot(child))
    const handler = HANDLERS[child.kind]
    if (!handler || typeof handler.run !== 'function') {
      throw new NodeError('NO_HANDLER', `没有 ${child.kind} 的处理器`)
    }
    slot.status = 'running'
    slot.attempt = (slot.attempt ?? 0) + 1
    slot.startedAt = Date.now()
    if (!this.record.cursor.includes(child.id)) this.record.cursor.push(child.id)
    this.registry.emit(this.record.id, {
      type: 'node.enter',
      nodeId: child.id,
      data: { attempt: slot.attempt, kind: child.kind, title: child.title, parentId: child.parentId },
    })
    try {
      const result = await this.invokeHandler(child, handler, last, slot)
      slot.status = 'succeeded'
      slot.endedAt = Date.now()
      slot.output = result?.output ?? null
      slot.branch = Array.isArray(result?.ports) ? result.ports.join(',') : null
      this.removeCursor(child.id)
      this.registry.emit(this.record.id, {
        type: 'node.exit',
        nodeId: child.id,
        data: { status: 'succeeded', ports: result?.ports ?? ['out'], output: summarize(slot.output), ms: slot.endedAt - slot.startedAt },
      })
      return result
    } catch (error) {
      const policy = child.onError === 'skip' ? 'skip' : 'fail'
      slot.status = policy === 'skip' ? 'skipped' : 'failed'
      slot.endedAt = Date.now()
      const envelope = toErrorEnvelope(error, {
        source: 'node',
        runId: this.record.id,
        nodeId: child.id,
        sessionId: this.sessionId,
        workflowId: this.workflow.id,
        details: { nodeKind: child.kind, nodeTitle: child.title, parentId: child.parentId },
      })
      slot.error = { message: messageOf(error), code: error instanceof NodeError ? error.code : 'ERROR', json: envelope }
      this.removeCursor(child.id)
      this.registry.emit(this.record.id, { type: 'error', nodeId: child.id, data: envelope })
      this.registry.emit(this.record.id, { type: 'node.exit', nodeId: child.id, data: { status: slot.status, error: slot.error } })
      void this.errors?.record(error, {
        id: envelope.id,
        source: 'node',
        runId: this.record.id,
        nodeId: child.id,
        details: { nodeKind: child.kind, nodeTitle: child.title, parentId: child.parentId },
      })
      if (policy === 'skip') return { output: { skipped: true, error: slot.error }, ports: [] }
      throw error
    }
  }

  async checkpoint(node, request) {
    const timeoutMs = Number(request.timeoutMs) > 0 ? Number(request.timeoutMs) : 0
    this.registry.emit(this.record.id, {
      type: 'checkpoint.ask',
      nodeId: node.id,
      data: { question: request.question, options: request.options, timeoutMs: timeoutMs || null },
    })
    const answer = await new Promise((resolve, reject) => {
      let timer
      const onAbort = () => {
        clearTimeout(timer)
        reject(new NodeError('CANCELLED', '检查点等待被取消'))
      }
      this.registry.requestCheckpoint(this.record.id, node.id, (value) => {
        clearTimeout(timer)
        this.record.controller.signal.removeEventListener('abort', onAbort)
        this.registry.emit(this.record.id, { type: 'checkpoint.answer', nodeId: node.id, data: { answer: value } })
        resolve(value)
      })
      this.record.controller.signal.addEventListener('abort', onAbort, { once: true })
      if (timeoutMs > 0) {
        timer = setTimeout(() => {
          this.registry.answerCheckpoint(this.record.id, node.id, `（超时 ${timeoutMs}ms，按默认继续）`)
        }, timeoutMs)
      }
    })
    return answer
  }

  settleFailed(id, slot, error, node) {
    const message = messageOf(error)
    const code = error instanceof NodeError ? error.code : 'ERROR'
    const envelope = toErrorEnvelope(error, {
      source: 'node',
      runId: this.record.id,
      nodeId: id,
      sessionId: this.sessionId,
      workflowId: this.workflow.id,
      tool: node.kind === 'tool.call' ? String(node.params?.name ?? '') || undefined : undefined,
      details: { nodeKind: node.kind, nodeTitle: node.title, attempt: slot.attempt },
    })
    slot.status = 'failed'
    slot.endedAt = Date.now()
    slot.error = { message, code, json: envelope }
    this.removeCursor(id)
    this.registry.emit(this.record.id, { type: 'error', nodeId: id, data: envelope })
    void this.errors?.record(error, {
      id: envelope.id,
      source: 'node',
      runId: this.record.id,
      nodeId: id,
      sessionId: this.sessionId,
      workflowId: this.workflow.id,
      details: { nodeKind: node.kind, nodeTitle: node.title, attempt: slot.attempt },
    })
    const policy = node.onError ?? 'fail'
    if (policy === 'skip') {
      this.settled.set(id, 'skipped')
      this.registry.emit(this.record.id, { type: 'node.exit', nodeId: id, data: { status: 'skipped', error: slot.error } })
      this.activate(id, ['out'])
      return
    }
    if (policy === 'fallback' && typeof node.fallbackTo === 'string' && this.allowed.has(node.fallbackTo)) {
      this.settled.set(id, 'failed')
      this.registry.emit(this.record.id, { type: 'node.exit', nodeId: id, data: { status: 'failed', error: slot.error, fallbackTo: node.fallbackTo } })
      this.maybeEnqueue(node.fallbackTo)
      if (!this.pending.has(node.fallbackTo)) this.pending.add(node.fallbackTo)
      return
    }
    this.settled.set(id, 'failed')
    this.record.status = 'failed'
    this.record.error = { message, code, nodeId: id }
    this.registry.emit(this.record.id, { type: 'node.exit', nodeId: id, data: { status: 'failed', error: slot.error } })
    this.record.controller.abort()
  }

  removeCursor(id) {
    const index = this.record.cursor.indexOf(id)
    if (index >= 0) this.record.cursor.splice(index, 1)
  }

  lastOutputOf(id) {
    const ins = this.inEdges(id)
    for (const edge of ins) {
      if (!this.activatedEdges.has(edge.id)) continue
      const source = this.record.nodes[edge.from]
      if (source && source.output !== null && source.output !== undefined) return source.output
    }
    return null
  }

  outputsView() {
    const view = {}
    for (const [id, slot] of Object.entries(this.record.nodes)) {
      if (slot.output !== null && slot.output !== undefined) view[id] = slot.output
    }
    return view
  }

  describe() {
    return {
      record: this.record,
      registry: this.registry,
      workflow: this.workflow,
      graph: this.graph,
      services: this.services,
      store: this.store,
      errors: this.errors,
      limits: this.limits,
      logger: this.logger,
      selection: this.selection,
      cwd: this.cwd,
      workspaceId: this.workspaceId,
      runSubflow: this.runSubflow,
      depth: this.depth,
      agent: this.agent,
    }
  }
}

function summarize(output) {
  if (output === null || output === undefined) return null
  try {
    const text = JSON.stringify(output)
    return text.length > 400 ? `${text.slice(0, 400)}…` : JSON.parse(text)
  } catch {
    return null
  }
}

function messageOf(error) {
  if (error instanceof Error) return error.message
  return String(error)
}

export async function executeRun(options) {
  const { registry, record, workflow, services, store, limits, logger, selection, cwd, workspaceId, runSubflow } = options
  const graph = buildGraph(workflow)
  const entry = workflow.entry && graph.nodes.has(workflow.entry) ? workflow.entry : workflow.nodes[0]?.id

  record.status = 'running'
  registry.emit(record.id, { type: 'run.start', data: { workflowId: workflow.id, workflowName: workflow.name, entry } })

  const issues = validateWorkflow(workflow, { knownToolNames: options.knownToolNames ?? [], knownSkillNames: options.knownSkillNames ?? [] })
  const errors = issues.filter((issue) => issue.level === 'error')
  if (errors.length > 0) {
    logger(`run ${record.id}: workflow has ${errors.length} validation error(s); running anyway per plan (validation is not a gate)`)
    registry.emit(record.id, { type: 'log', data: { level: 'warn', message: `流程校验有 ${errors.length} 处错误，仍按用户意愿执行` } })
  }

  const initial = []
  if (entry) initial.push(entry)
  for (const node of workflow.nodes) {
    if (node.kind === 'inject.context' && (graph.inc.get(node.id) ?? []).length === 0 && node.id !== entry) initial.push(node.id)
  }

  const subflowRunner = runSubflow ?? (async (workflowId, inputMap, depth) => {
    const child = options.workflows?.get(workflowId)
    if (!child) throw new NodeError('NO_SUBFLOW', `找不到流程 ${workflowId}`)
    if (depth >= 3) throw new NodeError('SUBFLOW_DEPTH', '子流程嵌套超过 3 层')
    const childVars = {}
    for (const [key, value] of Object.entries(inputMap ?? {})) {
      if (typeof value !== 'string') continue
      const rendered = value.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, path) => {
        const parsed = runExpr(path, { vars: record.vars, last: null, node: {} })
        return parsed.ok && parsed.value !== undefined && parsed.value !== null ? String(parsed.value) : ''
      })
      childVars[key] = rendered
    }
    const childRecord = createRunRecord({
      id: `run_${Math.random().toString(36).slice(2, 12)}`,
      workflowId: child.id,
      workflowName: child.name,
      workflowRevision: child.updatedAt,
      parentRunId: record.id,
      sessionId: record.sessionId,
      vars: childVars,
    })
    registry.add(childRecord)
    const result = await executeRun({
      ...options,
      record: childRecord,
      workflow: child,
      depth: depth + 1,
      runSubflow: subflowRunner,
    })
    return {
      runId: childRecord.id,
      status: result.status,
      text: summarizeOutputText(result),
    }
  })

  const runner = new GraphRunner({
    record,
    registry,
    workflow,
    graph,
    services,
    store,
    limits,
    logger,
    selection,
    cwd,
    workspaceId,
    agent: options.agent,
    allowed: new Set(workflow.nodes.filter((node) => !node.parentId).map((node) => node.id)),
    initial,
    depth: options.depth ?? 0,
    runSubflow: (workflowId, inputMap) => subflowRunner(workflowId, inputMap, (options.depth ?? 0) + 0),
  })

  let outcome = 'ok'
  try {
    outcome = await runner.run()
  } catch (error) {
    outcome = 'failed'
    record.status = 'failed'
    const envelope = toErrorEnvelope(error, { source: 'scheduler', runId: record.id, workflowId: workflow.id, sessionId: record.sessionId ?? undefined })
    record.error = { message: messageOf(error), code: 'RUNNER', json: envelope }
    registry.emit(record.id, { type: 'error', data: envelope })
    registry.emit(record.id, { type: 'log', data: { level: 'error', message: messageOf(error) } })
    void options.errors?.record(error, { id: envelope.id, source: 'scheduler', runId: record.id, workflowId: workflow.id })
  }

  record.endedAt = Date.now()
  if (record.status !== 'failed') {
    record.status = outcome === 'cancelled' || record.controller.signal.aborted ? 'cancelled' : 'succeeded'
  }
  record.cursor = []
  registry.clearCheckpoints(record.id)
  for (const slot of Object.values(record.nodes)) {
    if (slot.status === 'running' || slot.status === 'pending') {
      slot.status = record.status === 'cancelled' ? 'cancelled' : 'skipped'
      slot.endedAt = slot.endedAt ?? Date.now()
    }
  }
  registry.emit(record.id, {
    type: 'run.end',
    data: { status: record.status, error: record.error, ms: record.endedAt - record.startedAt },
  })
  return record
}

function summarizeOutputText(record) {
  let text = ''
  for (const slot of Object.values(record.nodes)) {
    if (slot.kind === 'io.output' && slot.output && typeof slot.output.text === 'string' && slot.output.text !== '') text = slot.output.text
  }
  return text
}

export { GraphRunner, summarize }
