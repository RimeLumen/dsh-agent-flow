/*! dsh-agent-flow v0.1.0 | Copyright (c) 2026 RimeLumen | MIT License */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { homedir } from 'node:os'

export const SCHEMA_VERSION = 1

export const DEFAULT_PREFS = Object.freeze({
  mode: 'index',
  promptBudget: 12000,
  lockoutGuard: true,
  maxParallel: 3,
  nodeTimeoutMs: 600000,
  appendOutputToChat: false,

  planTimeoutMs: 120000,

  highContrast: false,

  canvasZoom: 1,

  showDevPanels: false,
})

export function resolveDataDir(env = process.env) {
  const base = env.DSH_PROFILE_DIR || env.DSH_HOME || join(homedir(), '.dsh')
  return join(base, 'agent-flow')
}

function emptyState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    profiles: [],
    workflows: [],
    groups: [],

    experiences: [],
    prefs: { ...DEFAULT_PREFS },

    prefsLocked: false,
    updatedAt: null,
  }
}

function strList(value) {
  if (!Array.isArray(value)) return []
  const out = []
  const seen = new Set()
  for (const item of value) {
    if (typeof item !== 'string' || item === '' || seen.has(item)) continue
    seen.add(item)
    out.push(item)
  }
  return out
}

function migrate(raw) {
  const state = emptyState()
  const notes = []
  if (raw === null || typeof raw !== 'object') {
    notes.push('state file did not contain an object; started from an empty state')
    return { state, notes }
  }
  const version = Number(raw.schemaVersion)
  if (Number.isFinite(version) && version > SCHEMA_VERSION) {
    notes.push(`state schemaVersion ${version} is newer than supported ${SCHEMA_VERSION}; read what is understood`)
  } else if (Number.isFinite(version) && version < SCHEMA_VERSION) {
    notes.push(`state schemaVersion ${version} migrated to ${SCHEMA_VERSION}`)
  }
  if (Array.isArray(raw.profiles)) {
    state.profiles = raw.profiles.filter((p) => p !== null && typeof p === 'object' && typeof p.id === 'string')
  }
  if (Array.isArray(raw.experiences)) {
    state.experiences = raw.experiences.filter((e) => e !== null && typeof e === 'object' && typeof e.id === 'string')
  }
  if (Array.isArray(raw.workflows)) {
    state.workflows = raw.workflows.filter((w) => w !== null && typeof w === 'object' && typeof w.id === 'string')
  }
  if (Array.isArray(raw.groups)) {
    state.groups = raw.groups.filter((g) => g !== null && typeof g === 'object' && typeof g.id === 'string')
  }
  if (raw.prefs !== null && typeof raw.prefs === 'object') {
    for (const [key, fallback] of Object.entries(DEFAULT_PREFS)) {
      const value = raw.prefs[key]
      state.prefs[key] = typeof value === typeof fallback ? value : fallback
    }
  }
  state.prefsLocked = raw.prefsLocked === true
  state.updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : null
  return { state, notes }
}

export class Store {

  constructor(options = {}) {
    this.dir = options.dir || resolveDataDir()
    this.file = join(this.dir, 'state.json')
    this.state = emptyState()

    this.loadError = null

    this.lastWriteError = null

    this.loadNotes = []
    this.loaded = false

    this._queue = Promise.resolve()

    this._listeners = new Set()

    this.catalogCache = null
  }

  async load() {
    try {
      const text = await readFile(this.file, 'utf8')
      const parsed = JSON.parse(text)
      const { state, notes } = migrate(parsed)
      this.state = state
      this.loadNotes = notes
      this.loadError = null
    } catch (error) {
      const code = error && typeof error === 'object' ? error.code : undefined
      if (code === 'ENOENT') {
        this.loadError = null
        this.loadNotes = ['no state file yet; started from an empty state']
      } else {
        this.loadError = error instanceof Error ? error.message : String(error)
      }
    }
    this.loaded = true
    this.emit()
    return this.state
  }

  flush() {
    const payload = JSON.stringify(this.state, null, 2)
    const dir = this.dir
    const file = this.file
    const write = this._queue.then(async () => {
      await mkdir(dir, { recursive: true })
      // 原子写：先写临时文件再 rename，进程崩溃不会把 state.json 截断成半截（丢全量数据）。
      const tmp = `${file}.tmp`
      await writeFile(tmp, payload, 'utf8')
      const { rename } = await import('node:fs/promises')
      await rename(tmp, file)
    })
    this._queue = write.catch((error) => {
      this.lastWriteError = error instanceof Error ? error.message : String(error)
    })
    return write
  }

  async mutate(fn) {
    const result = fn(this.state)
    this.state.updatedAt = new Date().toISOString()
    await this.flush()
    this.emit()
    return result
  }

  subscribe(listener) {
    this._listeners.add(listener)
    return () => this._listeners.delete(listener)
  }

  emit() {
    for (const listener of [...this._listeners]) {
      try {
        listener()
      } catch {
      }
    }
  }

  describe() {
    return {
      dir: this.dir,
      file: this.file,
      loaded: this.loaded,
      loadError: this.loadError,
      lastWriteError: this.lastWriteError,
      loadNotes: [...this.loadNotes],
      profiles: this.state.profiles.length,
      workflows: this.state.workflows.length,
      groups: this.state.groups.length,
      prefs: { ...this.state.prefs },
    }
  }
}

export { strList, migrate, emptyState }
