/*! dsh-agent-flow v0.1.0 | Copyright (c) 2026 RimeLumen | MIT License */
import { DEFAULT_PREFS } from '../store.js'
import { normalizeProfile } from '../selection.js'
import { normalizeWorkflow } from '../flow/model.js'
import { queryParam, readString, writeJson } from './http.js'

export function dataRoutes(deps) {
  const { store, registry, ctx, errors } = deps

  return [
    {
      method: 'GET',
      pattern: '/prefs',
      handler: async ({ res }) => {
        writeJson(res, 200, { prefs: { ...DEFAULT_PREFS, ...(store.state.prefs ?? {}) }, locked: store.state.prefsLocked === true })
      },
    },
    {
      method: 'PUT',
      pattern: '/prefs',
      handler: async ({ res, body }) => {
        const next = await store.mutate((state) => {
          const prefs = { ...DEFAULT_PREFS, ...(state.prefs ?? {}) }
          if (typeof body.mode === 'string' && ['index', 'preload', 'whitelist'].includes(body.mode)) prefs.mode = body.mode
          if (Number.isFinite(Number(body.promptBudget))) prefs.promptBudget = Math.max(1000, Math.min(200000, Math.floor(Number(body.promptBudget))))
          if (typeof body.lockoutGuard === 'boolean') prefs.lockoutGuard = body.lockoutGuard
          if (Number.isFinite(Number(body.maxParallel))) prefs.maxParallel = Math.max(1, Math.min(8, Math.floor(Number(body.maxParallel))))
          if (Number.isFinite(Number(body.nodeTimeoutMs))) prefs.nodeTimeoutMs = Math.max(1000, Math.min(3600000, Math.floor(Number(body.nodeTimeoutMs))))
          if (typeof body.appendOutputToChat === 'boolean') prefs.appendOutputToChat = body.appendOutputToChat
          if (typeof body.highContrast === 'boolean') prefs.highContrast = body.highContrast
          if (Number.isFinite(Number(body.planTimeoutMs))) prefs.planTimeoutMs = Math.max(5000, Math.min(3600000, Math.floor(Number(body.planTimeoutMs))))
          if (Number.isFinite(Number(body.canvasZoom))) prefs.canvasZoom = Math.max(0.35, Math.min(2.5, Number(body.canvasZoom)))
          if (typeof body.showDevPanels === 'boolean') prefs.showDevPanels = body.showDevPanels
          state.prefs = prefs
          state.prefsLocked = true
          return prefs
        })
        writeJson(res, 200, { ok: true, prefs: next })
      },
    },
    {
      method: 'GET',
      pattern: '/diagnostics',
      handler: async ({ res, url }) => {
        writeJson(res, 200, {
          version: deps.version ?? 'unknown',
          store: store.describe(),
          runs: registry.list().map((run) => ({ id: run.id, status: run.status, workflowId: run.workflowId, startedAt: run.startedAt })),
          services: {
            webServer: Boolean(ctx.get('webServer')),
            tools: Boolean(ctx.get('tools')),
            skills: Boolean(ctx.get('skills')),
            systemPrompt: Boolean(ctx.get('systemPrompt')),
            agents: Boolean(ctx.get('agents')),
            subagents: Boolean(ctx.get('subagents')),
            userQuestions: Boolean(ctx.get('userQuestions')),
            approval: Boolean(ctx.get('approval')),
          },
          limits: { ...DEFAULT_PREFS, ...(store.state.prefs ?? {}) },
          catalogCacheAt: store.catalogCache?.at ?? null,
          tools: deps.toolRegistration ?? null,
          plan: deps.plans ? deps.plans.describe(queryParam(url, 'sessionId') ?? '') : null,
          errors: await errors.stats(),
          sessionsWithSelection: deps.lifecycle ? deps.lifecycle.appliedSessions() : [],
          escapeTools: Array.isArray(deps.escapeTools) ? deps.escapeTools : [],
          sessionBusy: store.state.sessionBusy ?? {},
        })
      },
    },
    {
      method: 'GET',
      pattern: '/export',
      handler: async ({ res }) => {
        writeJson(res, 200, {
          exportedAt: new Date().toISOString(),
          schemaVersion: store.state.schemaVersion,
          profiles: store.state.profiles,
          workflows: store.state.workflows,
          groups: store.state.groups,
          prefs: store.state.prefs,
        })
      },
    },
    {
      method: 'POST',
      pattern: '/import',
      handler: async ({ res, body }) => {
        const payload = body.data && typeof body.data === 'object' ? body.data : body
        const mode = readString(body, 'mode') === 'replace' ? 'replace' : 'merge'
        const counts = await store.mutate((state) => {
          const profiles = Array.isArray(payload.profiles) ? payload.profiles : []
          const workflows = Array.isArray(payload.workflows) ? payload.workflows : []
          let addedProfiles = 0
          let addedWorkflows = 0
          if (mode === 'replace') {
            state.profiles = []
            state.workflows = []
          }
          for (const raw of profiles) {
            try {
              const profile = normalizeProfile(raw, raw?.id)
              if (!state.profiles.some((item) => item.id === profile.id)) {
                state.profiles.push(profile)
                addedProfiles += 1
              }
            } catch {
            }
          }
          for (const raw of workflows) {
            const workflow = normalizeWorkflow(raw)
            if (workflow && !state.workflows.some((item) => item.id === workflow.id)) {
              state.workflows.push(workflow)
              addedWorkflows += 1
            }
          }
          return { addedProfiles, addedWorkflows }
        })
        writeJson(res, 200, { ok: true, ...counts })
      },
    },
  ]
}
