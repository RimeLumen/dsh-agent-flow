/*! dsh-agent-flow v0.1.0 | Copyright (c) 2026 RimeLumen | MIT License */
import { toErrorEnvelope, statusForKind } from '../errors.js'
import { SelectionError } from '../selection.js'

export const MAX_JSON_BODY_BYTES = 512 * 1024

export function isLoopbackRequest(request) {
  const address = request.socket?.remoteAddress
  if (address !== '127.0.0.1' && address !== '::1' && address !== '::ffff:127.0.0.1') return false
  const host = request.headers?.host
  if (typeof host !== 'string') return false
  let hostUrl
  try {
    hostUrl = new URL(`http://${host}`)
  } catch {
    return false
  }
  if (hostUrl.hostname !== '127.0.0.1' && hostUrl.hostname !== 'localhost' && hostUrl.hostname !== '[::1]') return false
  if (request.headers['sec-fetch-site'] === 'cross-site') return false
  const origin = request.headers.origin
  if (origin === undefined) return true
  try {
    return new URL(origin).host === hostUrl.host
  } catch {
    return false
  }
}

export function writeJson(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'referrer-policy': 'no-referrer',
  })
  res.end(payload)
}

export function writeError(res, status, error, context = {}) {
  const envelope = toErrorEnvelope(error, context)
  writeJson(res, status, {
    error: envelope.message,
    code: envelope.code,
    kind: envelope.kind,
    json: envelope,
  })
}

const STORE_ERROR_STATUS = { validation: 400, 'not-found': 404, conflict: 409 }

export function writeRouteError(res, error, sink, context = {}) {
  const envelope = toErrorEnvelope(error, context)
  if (sink && typeof sink.record === 'function' && envelope.kind !== 'not-found') {
    void sink.record(error, { ...context, id: envelope.id })
  }
  if (error instanceof SelectionError) {
    writeError(res, STORE_ERROR_STATUS[error.kind] ?? 400, error, context)
    return
  }
  writeError(res, statusForKind(envelope.kind), error, context)
}

export async function readJsonBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_JSON_BODY_BYTES) return undefined
    chunks.push(chunk)
  }
  if (size === 0) return {}
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    return parsed !== null && typeof parsed === 'object' ? parsed : undefined
  } catch {
    return undefined
  }
}

export function queryParam(url, name) {
  const value = url.searchParams.get(name)
  return value === null ? undefined : value
}

export function readString(body, key) {
  const value = body?.[key]
  return typeof value === 'string' ? value : ''
}

export function shortId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 12)}`
}

export function compilePattern(pattern) {
  const names = []
  const source = pattern
    .split('/')
    .map((segment) => {
      if (segment.startsWith(':')) {
        names.push(segment.slice(1))
        return '([^/]+)'
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    })
    .join('/')
  return { re: new RegExp(`^${source}$`), names }
}
