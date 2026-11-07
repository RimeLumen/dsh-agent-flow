/*! dsh-agent-flow v0.1.0 | Copyright (c) 2026 RimeLumen | MIT License */
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export const ERROR_SCHEMA_VERSION = 1

export const ERROR_KEEP = 200

export const ERROR_FILE_LIMIT_BYTES = 2 * 1024 * 1024

export const ERROR_CODES = Object.freeze({
  VALIDATION: 'VALIDATION',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  DANGEROUS_TOOL: 'DANGEROUS_TOOL',
  WHITELIST_BLOCKED: 'WHITELIST_BLOCKED',
  NO_AGENT: 'NO_AGENT',
  NO_SUBAGENTS: 'NO_SUBAGENTS',
  NO_TOOL: 'NO_TOOL',
  TOOL_FAILED: 'TOOL_FAILED',
  BAD_ARGS: 'BAD_ARGS',
  BAD_EXPR: 'BAD_EXPR',
  TIMEOUT: 'TIMEOUT',
  CANCELLED: 'CANCELLED',
  NODE_FAILED: 'NODE_FAILED',
  NO_HANDLER: 'NO_HANDLER',
  LOOP_ABORTED: 'LOOP_ABORTED',
  SUBFLOW_DEPTH: 'SUBFLOW_DEPTH',
  PLAN_TIMEOUT: 'PLAN_TIMEOUT',
  HTTP_LOOPBACK_ONLY: 'HTTP_LOOPBACK_ONLY',
  HTTP_METHOD: 'HTTP_METHOD',
  HTTP_BODY: 'HTTP_BODY',
  STORE_WRITE: 'STORE_WRITE',
  STORE_LOAD: 'STORE_LOAD',
  CATALOG: 'CATALOG',
  INTERNAL: 'INTERNAL',

  EXPERIENCE_FULL: 'EXPERIENCE_FULL',
})

export class FlowError extends Error {

  constructor(code, message, options = {}) {
    super(message)
    this.name = 'FlowError'
    this.code = code
    this.kind = options.kind ?? 'runtime'
    this.severity = options.severity ?? 'error'
    this.retryable = options.retryable === true
    this.details = options.details ?? {}
    this.hints = Array.isArray(options.hints) ? options.hints : []
    this.source = options.source ?? 'host'
    if (options.sessionId) this.sessionId = options.sessionId
    if (options.runId) this.runId = options.runId
    if (options.nodeId) this.nodeId = options.nodeId
    if (options.workflowId) this.workflowId = options.workflowId
    if (options.tool) this.tool = options.tool
    if (options.cause !== undefined) this.cause = options.cause
  }
}

const CODE_KINDS = Object.freeze({
  VALIDATION: 'validation',
  BAD_ARGS: 'validation',
  BAD_EXPR: 'validation',
  NO_TOOL: 'validation',
  NO_PROMPT: 'validation',
  NO_SKILL: 'validation',
  NO_SUBFLOW: 'validation',
  SELF_SUBFLOW: 'validation',
  NOT_FOUND: 'not-found',
  CONFLICT: 'conflict',
  DANGEROUS: 'permission',
  DANGEROUS_TOOL: 'permission',
  WHITELIST_BLOCKED: 'permission',
  TIMEOUT: 'timeout',
  PLAN_TIMEOUT: 'timeout',
  CANCELLED: 'cancelled',
  TOOL_FAILED: 'runtime',
  NODE_FAILED: 'runtime',
  NO_AGENT: 'runtime',
  NO_SUBAGENTS: 'runtime',
  NO_PROVIDER: 'runtime',
  NO_HANDLER: 'internal',
  LOOP_ABORTED: 'runtime',
  SUBFLOW_DEPTH: 'validation',
  INTERNAL: 'internal',
})

function kindFromError(error) {
  if (error instanceof FlowError) return error.kind
  const kind = error && typeof error === 'object' ? error.kind : undefined
  if (kind === 'validation') return 'validation'
  if (kind === 'not-found') return 'not-found'
  if (kind === 'conflict') return 'conflict'
  const code = error && typeof error === 'object' && typeof error.code === 'string' ? error.code : undefined
  if (code && CODE_KINDS[code]) return CODE_KINDS[code]
  if (code) return 'runtime'
  return 'internal'
}

export function statusForKind(kind) {
  switch (kind) {
    case 'validation':
      return 400
    case 'not-found':
      return 404
    case 'conflict':
      return 409
    case 'permission':
      return 403
    case 'timeout':
      return 504
    case 'cancelled':
      return 499
    default:
      return 500
  }
}

function shortId() {
  return `err_${Math.random().toString(36).slice(2, 10)}`
}

export function toErrorEnvelope(error, context = {}) {
  const isFlow = error instanceof FlowError
  const kind = kindFromError(error)
  const cause = error instanceof Error && error.cause && !isFlow ? error.cause : undefined
  const causeError = isFlow ? error.cause : cause
  const stack = error instanceof Error && typeof error.stack === 'string'
    ? error.stack.split('\n').slice(0, 6)
    : undefined
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : 'unknown error'
  const rawCode = !isFlow && error && typeof error === 'object' && typeof error.code === 'string' ? error.code : undefined
  return {
    schemaVersion: ERROR_SCHEMA_VERSION,
    id: typeof context.id === 'string' && context.id !== '' ? context.id : shortId(),
    at: new Date().toISOString(),
    code: isFlow ? error.code : rawCode ?? (kind === 'internal' ? ERROR_CODES.INTERNAL : String(kind).toUpperCase().replace(/-/g, '_')),
    kind,
    severity: isFlow ? error.severity : 'error',
    retryable: isFlow ? error.retryable : false,
    source: (isFlow && error.source) || context.source || 'host',
    message,
    ...(context.sessionId || (isFlow && error.sessionId) ? { sessionId: context.sessionId ?? error.sessionId } : {}),
    ...(context.runId || (isFlow && error.runId) ? { runId: context.runId ?? error.runId } : {}),
    ...(context.nodeId || (isFlow && error.nodeId) ? { nodeId: context.nodeId ?? error.nodeId } : {}),
    ...(context.workflowId || (isFlow && error.workflowId) ? { workflowId: context.workflowId ?? error.workflowId } : {}),
    ...(context.tool || (isFlow && error.tool) ? { tool: context.tool ?? error.tool } : {}),
    ...(context.route ? { route: context.route } : {}),
    ...(isFlow && Object.keys(error.details).length > 0 ? { details: error.details } : {}),
    ...(context.details ? { details: { ...(isFlow ? error.details : {}), ...context.details } } : {}),
    ...(isFlow && error.hints.length > 0 ? { hints: error.hints } : {}),
    ...(causeError !== undefined
      ? {
          cause: {
            name: causeError instanceof Error ? causeError.name : typeof causeError,
            message: causeError instanceof Error ? causeError.message : String(causeError),
            ...(causeError instanceof Error && typeof causeError.stack === 'string'
              ? { stack: causeError.stack.split('\n').slice(0, 6) }
              : {}),
          },
        }
      : {}),
    ...(stack ? { stack } : {}),
  }
}

export function createErrorSink(options) {
  const dir = options.dir
  const file = join(dir, 'errors.jsonl')

  let memory = []
  let loaded = false
  let writing = Promise.resolve()
  let lastError = null

  let bytes = 0

  const load = async () => {
    if (loaded) return
    loaded = true
    try {
      const text = await readFile(file, 'utf8')
      bytes = text.length
      memory = text
        .split('\n')
        .filter((line) => line.trim() !== '')
        .slice(-ERROR_KEEP)
        .map((line) => {
          try {
            return JSON.parse(line)
          } catch {
            return null
          }
        })
        .filter(Boolean)
    } catch (error) {
      if (!(error && typeof error === 'object' && error.code === 'ENOENT')) {
        lastError = error instanceof Error ? error.message : String(error)
      }
      memory = []
    }
  }

  const rewrite = async () => {
    await mkdir(dir, { recursive: true })
    await writeFile(file, memory.map((item) => JSON.stringify(item)).join('\n') + (memory.length > 0 ? '\n' : ''), 'utf8')
  }

  return {

    async record(error, context = {}) {
      await load()
      const envelope = toErrorEnvelope(error, context)
      memory.push(envelope)
      if (memory.length > ERROR_KEEP) memory = memory.slice(-ERROR_KEEP)
      const line = `${JSON.stringify(envelope)}\n`
      writing = writing.then(async () => {
        try {
          await mkdir(dir, { recursive: true })
          await appendFile(file, line, 'utf8')
          bytes += line.length
          if (bytes > ERROR_FILE_LIMIT_BYTES) {
            await rewrite()
            bytes = memory.reduce((total, item) => total + JSON.stringify(item).length + 1, 0)
          }
        } catch (writeError) {
          lastError = writeError instanceof Error ? writeError.message : String(writeError)
        }
      })
      await writing
      return envelope
    },

    envelope(error, context = {}) {
      return toErrorEnvelope(error, context)
    },
    async list(limit = 50) {
      await load()
      return memory.slice(-Math.max(1, Math.min(ERROR_KEEP, limit))).reverse()
    },
    async stats() {
      await load()
      const byCode = {}
      const byKind = {}
      for (const item of memory) {
        byCode[item.code] = (byCode[item.code] ?? 0) + 1
        byKind[item.kind] = (byKind[item.kind] ?? 0) + 1
      }
      return { file, kept: memory.length, limit: ERROR_KEEP, byCode, byKind, lastError }
    },
    async clear() {
      memory = []
      writing = writing.then(async () => {
        await rewrite()
        bytes = 0
      })
      await writing
      return true
    },
    describe() {
      return { file, kept: memory.length, limit: ERROR_KEEP, fileLimitBytes: ERROR_FILE_LIMIT_BYTES, lastError }
    },
  }
}
