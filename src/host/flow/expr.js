/*! dsh-agent-flow v0.1.0 | Copyright (c) 2026 RimeLumen | MIT License */
export class ExprError extends Error {

  constructor(message, where) {
    super(message)
    this.name = 'ExprError'
    this.index = where?.index
  }
}

export const EXPR_FUNCTIONS = Object.freeze({
  exists: (args) => args[0] !== undefined && args[0] !== null,
  truthy: (args) => Boolean(args[0]),
  equals: (args) => args[0] === args[1],
  notEquals: (args) => args[0] !== args[1],
  contains: (args) => String(args[0] ?? '').includes(String(args[1] ?? '')),
  matches: (args) => {
    const input = String(args[0] ?? '')
    const pattern = String(args[1] ?? '')
    try {
      return new RegExp(pattern).test(input)
    } catch (error) {
      throw new ExprError(`matches(): invalid regular expression "${pattern}": ${error instanceof Error ? error.message : String(error)}`)
    }
  },
  len: (args) => (typeof args[0] === 'string' ? args[0].length : Array.isArray(args[0]) ? args[0].length : 0),
  gt: (args) => Number(args[0]) > Number(args[1]),
  gte: (args) => Number(args[0]) >= Number(args[1]),
  lt: (args) => Number(args[0]) < Number(args[1]),
  lte: (args) => Number(args[0]) <= Number(args[1]),
  number: (args) => Number(args[0]),
  text: (args) => (args[0] === undefined || args[0] === null ? '' : String(args[0])),
})

const KEYWORDS = new Set(['true', 'false', 'null'])

function tokenize(src) {
  const tokens = []
  let i = 0
  while (i < src.length) {
    const ch = src[i]
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i += 1
      continue
    }
    if (ch === '(' || ch === ')' || ch === ',' || ch === '.') {
      tokens.push({ type: ch, value: ch, index: i })
      i += 1
      continue
    }
    if (ch === '&' || ch === '|') {
      if (src[i + 1] !== ch) throw new ExprError(`single "${ch}" is not an operator; use "${ch}${ch}"`, { index: i })
      tokens.push({ type: ch + ch, value: ch + ch, index: i })
      i += 2
      continue
    }
    if (ch === '!' || ch === '=' || ch === '<' || ch === '>') {
      const two = src.slice(i, i + 2)
      if (two === '!=' || two === '==' || two === '<=' || two === '>=') {
        tokens.push({ type: two, value: two, index: i })
        i += 2
        continue
      }
      if (ch === '!') {
        tokens.push({ type: '!', value: '!', index: i })
        i += 1
        continue
      }
      if (ch === '<' || ch === '>') {
        tokens.push({ type: ch, value: ch, index: i })
        i += 1
        continue
      }
      throw new ExprError(`unexpected "${two}"`, { index: i })
    }
    if (ch === '"' || ch === "'") {
      let out = ''
      let j = i + 1
      let closed = false
      while (j < src.length) {
        const c = src[j]
        if (c === '\\' && j + 1 < src.length) {
          out += src[j + 1]
          j += 2
          continue
        }
        if (c === ch) {
          closed = true
          j += 1
          break
        }
        out += c
        j += 1
      }
      if (!closed) throw new ExprError('unterminated string literal', { index: i })
      tokens.push({ type: 'string', value: out, index: i })
      i = j
      continue
    }
    if (/[0-9]/.test(ch)) {
      let j = i
      while (j < src.length && /[0-9.]/.test(src[j])) j += 1
      const raw = src.slice(i, j)
      const num = Number(raw)
      if (!Number.isFinite(num)) throw new ExprError(`invalid number "${raw}"`, { index: i })
      tokens.push({ type: 'number', value: num, index: i })
      i = j
      continue
    }
    if (/[A-Za-z_$]/.test(ch)) {
      let j = i
      while (j < src.length && /[A-Za-z0-9_$-]/.test(src[j])) j += 1
      const word = src.slice(i, j)
      tokens.push({ type: KEYWORDS.has(word) ? 'keyword' : 'ident', value: word, index: i })
      i = j
      continue
    }
    throw new ExprError(`unexpected character "${ch}"`, { index: i })
  }
  tokens.push({ type: 'eof', value: '', index: src.length })
  return tokens
}

function parseTokens(tokens) {
  let pos = 0
  const peek = () => tokens[pos]
  const next = () => tokens[pos++]

  function parseOr() {
    let left = parseAnd()
    while (peek().type === '||') {
      next()
      left = { k: 'bin', op: '||', l: left, r: parseAnd() }
    }
    return left
  }
  function parseAnd() {
    let left = parseCompare()
    while (peek().type === '&&') {
      next()
      left = { k: 'bin', op: '&&', l: left, r: parseCompare() }
    }
    return left
  }
  function parseCompare() {
    let left = parseUnary()
    while (['==', '!=', '<', '>', '<=', '>='].includes(peek().type)) {
      const op = next().type
      left = { k: 'bin', op, l: left, r: parseUnary() }
    }
    return left
  }
  function parseUnary() {
    if (peek().type === '!') {
      next()
      return { k: 'un', op: '!', e: parseUnary() }
    }
    return parsePrimary()
  }
  function parsePath(first) {
    const parts = [first]
    while (peek().type === '.') {
      next()
      const part = next()
      if (part.type !== 'ident' && part.type !== 'keyword') {
        throw new ExprError('expected a property name after "."', { index: part.index })
      }
      parts.push(part.value)
    }
    return parts
  }
  function parsePrimary() {
    const token = peek()
    if (token.type === 'number' || token.type === 'string') {
      next()
      return { k: 'lit', v: token.value }
    }
    if (token.type === 'keyword') {
      next()
      if (token.value === 'true') return { k: 'lit', v: true }
      if (token.value === 'false') return { k: 'lit', v: false }
      return { k: 'lit', v: null }
    }
    if (token.type === 'ident') {
      next()
      if (peek().type === '(') {
        next()
        const args = []
        if (peek().type !== ')') {
          for (;;) {
            args.push(parseOr())
            if (peek().type === ',') {
              next()
              continue
            }
            break
          }
        }
        const close = next()
        if (close.type !== ')') throw new ExprError('expected ")"', { index: close.index })
        return { k: 'call', name: token.value, args }
      }
      return { k: 'path', parts: parsePath(token.value) }
    }
    if (token.type === '(') {
      next()
      const inner = parseOr()
      const close = next()
      if (close.type !== ')') throw new ExprError('expected ")"', { index: close.index })
      return inner
    }
    throw new ExprError(token.type === 'eof' ? 'unexpected end of expression' : `unexpected token "${token.value}"`, { index: token.index })
  }

  const ast = parseOr()
  if (peek().type !== 'eof') throw new ExprError(`unexpected trailing token "${peek().value}"`, { index: peek().index })
  return ast
}

export function parseExpr(src) {
  const text = typeof src === 'string' ? src.trim() : ''
  if (text === '') return { error: 'expression is empty' }
  if (text.length > 600) return { error: 'expression is too long (max 600 characters)' }
  try {
    const ast = parseTokens(tokenize(text))
    collectFunctions(ast)
    return { ast }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

function collectFunctions(ast) {
  if (!ast || typeof ast !== 'object') return
  if (ast.k === 'call') {
    if (!Object.prototype.hasOwnProperty.call(EXPR_FUNCTIONS, ast.name)) {
      throw new ExprError(`unknown function "${ast.name}"`)
    }
    for (const arg of ast.args) collectFunctions(arg)
    return
  }
  if (ast.k === 'bin') {
    collectFunctions(ast.l)
    collectFunctions(ast.r)
    return
  }
  if (ast.k === 'un') collectFunctions(ast.e)
}

function resolvePath(parts, scope) {
  let current = scope
  for (const part of parts) {
    if (current === undefined || current === null) return undefined
    if (typeof current !== 'object') return undefined
    current = current[part]
  }
  return current
}

export function evaluate(ast, scope) {
  switch (ast.k) {
    case 'lit':
      return ast.v
    case 'path':
      return resolvePath(ast.parts, scope)
    case 'call': {
      const fn = EXPR_FUNCTIONS[ast.name]
      if (typeof fn !== 'function') throw new ExprError(`unknown function "${ast.name}"`)
      return fn(ast.args.map((arg) => evaluate(arg, scope)))
    }
    case 'un': {
      const value = evaluate(ast.e, scope)
      return ast.op === '!' ? !value : value
    }
    case 'bin': {
      if (ast.op === '&&') {
        const left = evaluate(ast.l, scope)
        return left ? evaluate(ast.r, scope) : left
      }
      if (ast.op === '||') {
        const left = evaluate(ast.l, scope)
        return left ? left : evaluate(ast.r, scope)
      }
      const left = evaluate(ast.l, scope)
      const right = evaluate(ast.r, scope)
      switch (ast.op) {
        case '==':
          return left === right
        case '!=':
          return left !== right
        case '<':
          return Number(left) < Number(right)
        case '>':
          return Number(left) > Number(right)
        case '<=':
          return Number(left) <= Number(right)
        case '>=':
          return Number(left) >= Number(right)
        default:
          throw new ExprError(`unsupported operator "${ast.op}"`)
      }
    }
    default:
      throw new ExprError('malformed expression')
  }
}

export function runExpr(src, scope) {
  const parsed = parseExpr(src)
  if (parsed.error) return { ok: false, error: parsed.error }
  try {
    return { ok: true, value: evaluate(parsed.ast, scope) }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}
