/*! dsh-agent-flow v0.1.0 | Copyright (c) 2026 RimeLumen | MIT License */
import { ERROR_CODES, FlowError } from './errors.js'
import { NODE_KINDS, normalizeWorkflow } from './flow/model.js'

export const PLAN_STATUS = Object.freeze({
  IDLE: 'idle',
  AWAITING: 'awaiting',
  CONFIRMED: 'confirmed',
  ADJUSTED: 'adjusted',
  SKIPPED: 'skipped',
  TIMEOUT: 'timeout',

  REPLACED: 'replaced',
})

export function phasesToWorkflow(input, context = {}) {
  const makeId = () => `n_${Math.random().toString(36).slice(2, 8)}`
  const phasesIn = (Array.isArray(input?.phases) ? input.phases : []).filter((phase) => phase && typeof phase === 'object')
  if (phasesIn.length === 0) {
    throw new FlowError(ERROR_CODES.VALIDATION, 'phases 至少需要一个阶段', {
      kind: 'validation',
      source: 'plan',
      hints: ['每个阶段给 title，子工作放进 subtasks'],
    })
  }
  const nodes = []
  const edges = []

  const index = []
  const phases = []
  // 主干收集：push 的先后顺序就是流程脊椎，即 mainPath。
  const mainIds = []
  let previous = null
  const push = (node) => {
    nodes.push(node)
    index.push({ id: node.id, title: node.title, phaseId: node.phaseId, reliesOn: node.reliesOn })
    mainIds.push(node.id)
    if (previous) {
      edges.push({ id: `e_${previous}_${node.id}`, from: previous, fromPort: 'out', to: node.id, fromSide: 'right', toSide: 'left' })
    }
    previous = node.id
  }
  phasesIn.slice(0, 12).forEach((rawPhase, phaseOrder) => {
    const phaseId = makeId()
    const title = typeof rawPhase.title === 'string' && rawPhase.title.trim() !== ''
      ? rawPhase.title.trim().slice(0, 120)
      : `Phase ${phaseOrder + 1}`
    const goal = typeof rawPhase.goal === 'string' && rawPhase.goal !== '' ? rawPhase.goal.slice(0, 500) : undefined
    phases.push({ id: phaseId, title, goal, order: phaseOrder })
    push({
      id: phaseId,
      kind: 'phase',
      phaseId: undefined,
      reliesOn: undefined,
      title,
      pos: { x: 80, y: 80 + phaseOrder * 240 },
      params: { goal, order: phaseOrder },
      onError: 'fail',
    })
    const subtasks = (Array.isArray(rawPhase.subtasks) ? rawPhase.subtasks : []).filter((item) => item && typeof item === 'object')
    subtasks.slice(0, 20).forEach((raw, subtaskIndex) => {
      const stepTitle = typeof raw.title === 'string' && raw.title.trim() !== '' ? raw.title.trim().slice(0, 120) : `工作 ${subtaskIndex + 1}`
      const kind = NODE_KINDS.includes(raw.kind) ? raw.kind : 'agent.task'
      const params = kind === 'agent.task'
        ? { target: 'session', prompt: typeof raw.prompt === 'string' && raw.prompt !== '' ? raw.prompt : stepTitle, waitForIdle: false }
        : kind === 'tool.call'
          ? {
              name: typeof raw.tool === 'string' ? raw.tool : '',
              argsTemplate: typeof raw.args === 'string' && raw.args.trim() !== '' ? raw.args : '{}',
              allowDangerous: raw.allowDangerous === true,
            }
          : kind === 'human.checkpoint'
            ? { question: typeof raw.prompt === 'string' && raw.prompt !== '' ? raw.prompt : stepTitle, options: ['继续', '停止'] }
            : { ...(raw.params && typeof raw.params === 'object' ? raw.params : {}) }
      push({
        id: makeId(),
        kind,
        phaseId,
        reliesOn: Array.isArray(raw.reliesOn) ? raw.reliesOn.filter((ref) => typeof ref === 'string' && ref !== '') : undefined,
        title: stepTitle,
        pos: { x: 380, y: 80 + phaseOrder * 240 + subtaskIndex * 92 },
        params,
        onError: 'fail',
        note: typeof raw.detail === 'string' ? raw.detail.slice(0, 1000) : undefined,
      })
    })
  })
  const workflow = normalizeWorkflow({
    id: context.workflowId,
    sessionId: context.sessionId,
    name: typeof input?.title === 'string' && input.title !== '' ? input.title.slice(0, 80) : `本轮流程 ${new Date().toLocaleTimeString('zh-CN')}`,
    description: typeof input?.summary === 'string' ? input.summary.slice(0, 1000) : undefined,
    origin: context.origin ?? 'agent-plan',
    mode: input?.mode,
    layout: input?.layout,
    turn: context.turn,
    phases,
    entry: index[0]?.id,
    nodes,
    edges,
    mainPath: mainIds.length > 1 ? mainIds : undefined,
    vars: {},
  })
  const knownIds = new Set(workflow.nodes.map((node) => node.id))
  const titleIds = new Map()
  for (const node of workflow.nodes) if (!titleIds.has(node.title)) titleIds.set(node.title, node.id)
  const warnings = []
  for (const node of workflow.nodes) {
    for (const ref of Array.isArray(node.reliesOn) ? node.reliesOn : []) {
      if (knownIds.has(ref) || titleIds.has(ref)) continue
      warnings.push({ code: 'PHASE_REF_MISSING', message: `「${node.title}」依赖的「${ref}」在图里找不到`, nodeId: node.id, ref })
    }
  }
  return { workflow, index, warnings, phases }
}

export function stepsToWorkflow(input, context = {}) {
  if (Array.isArray(input?.phases) && input.phases.length > 0) return phasesToWorkflow(input, context)
  const makeId = () => `n_${Math.random().toString(36).slice(2, 8)}`
  const steps = Array.isArray(input?.steps) ? input.steps.filter((step) => step && typeof step === 'object') : []
  if (steps.length === 0) {
    throw new FlowError(ERROR_CODES.VALIDATION, 'flow_plan 至少需要一个步骤', {
      kind: 'validation',
      source: 'plan',
      hints: ['把本轮要做的事拆成 steps 数组，每项至少给 title'],
    })
  }
  const nodes = []
  const edges = []

  const index = []
  let previous = null
  let y = 80
  for (const step of steps.slice(0, 40)) {
    const title = typeof step.title === 'string' && step.title.trim() !== '' ? step.title.trim().slice(0, 120) : `步骤 ${nodes.length + 1}`
    const kind = NODE_KINDS.includes(step.kind) ? step.kind : 'agent.task'
    const substeps = Array.isArray(step.substeps) ? step.substeps.filter((item) => item && typeof item === 'object') : []
    const params = kind === 'agent.task'
      ? { target: 'session', prompt: typeof step.prompt === 'string' && step.prompt !== '' ? step.prompt : title, waitForIdle: false }
      : kind === 'tool.call'
        ? {
            name: typeof step.tool === 'string' ? step.tool : '',
            argsTemplate: typeof step.args === 'string' && step.args.trim() !== '' ? step.args : '{}',
            allowDangerous: step.allowDangerous === true,
          }
        : kind === 'human.checkpoint'
          ? { question: typeof step.prompt === 'string' && step.prompt !== '' ? step.prompt : title, options: ['继续', '停止'] }
          : { ...(step.params && typeof step.params === 'object' ? step.params : {}) }
    const id = makeId()
    if (kind === 'group.steps' || substeps.length > 0) {
      const groupId = makeId()
      nodes.push({
        id: groupId,
        kind: 'group.steps',
        title,
        pos: { x: 80, y },
        params: { note: typeof step.detail === 'string' ? step.detail.slice(0, 500) : undefined },
        onError: 'fail',
        parentId: undefined,
      })
      let childY = y
      const childIds = []
      for (const [childIndex, child] of substeps.slice(0, 20).entries()) {
        const childId = makeId()
        const childTitle = typeof child.title === 'string' && child.title !== '' ? child.title.slice(0, 120) : `${title} · ${String.fromCharCode(97 + childIndex)}`
        nodes.push({
          id: childId,
          kind: NODE_KINDS.includes(child.kind) ? child.kind : 'agent.task',
          title: childTitle,
          pos: { x: 400, y: childY },
          params: { target: 'session', prompt: typeof child.prompt === 'string' && child.prompt !== '' ? child.prompt : childTitle, waitForIdle: false },
          onError: 'fail',
          parentId: groupId,
        })
        childIds.push(childId)
        childY += 104
      }
      y += 140
      if (previous) edges.push({ id: `e_${previous}_${groupId}`, from: previous, fromPort: 'out', to: groupId, fromSide: 'right', toSide: 'left' })
      previous = groupId
      index.push({ id: groupId, title, children: childIds })
      continue
    }
    nodes.push({
      id,
      kind,
      title,
      pos: { x: 80, y },
      params,
      onError: step.optional === true ? 'skip' : 'fail',
      parentId: undefined,
    })
    if (previous) edges.push({ id: `e_${previous}_${id}`, from: previous, fromPort: 'out', to: id, fromSide: 'right', toSide: 'left' })
    previous = id
    index.push({ id, title })
    y += 130
  }
  const entry = index[0]?.id
  return {
    workflow: normalizeWorkflow({
      id: context.workflowId,
      sessionId: context.sessionId,
      mode: input?.mode,
      layout: input?.layout,
      turn: context.turn,
      name: typeof input?.title === 'string' && input.title !== '' ? input.title.slice(0, 80) : `本轮流程 ${new Date().toLocaleTimeString('zh-CN')}`,
      description: typeof input?.summary === 'string' ? input.summary.slice(0, 1000) : undefined,
      origin: 'agent-plan',
      entry,
      nodes,
      edges,
      vars: {},
    }),
    index,
    warnings: [],
    phases: [],
  }
}

export function createPlanManager(deps) {
  const { store } = deps
  const log = typeof deps.log === 'function' ? deps.log : () => {}

  const plans = new Map()

  const keyOf = (sessionId) => sessionId || 'global'

  const read = (sessionId) => plans.get(keyOf(sessionId)) ?? null

  async function publish(sessionId, input) {
    const previous = read(sessionId)
    if (previous && previous.waiters.length > 0) {
      settle(sessionId, PLAN_STATUS.REPLACED, { reason: '被本轮的新计划替换' })
    }
    const turn = (previous?.turn ?? 0) + 1
    const adopted = previous?.workflowId
      ?? store.state.workflows.find((item) => item.sessionId === sessionId && item.origin === 'session' && !item.archivedAt)?.id
    const { workflow, index, warnings } = stepsToWorkflow(input, { workflowId: adopted, sessionId, turn })
    const saved = await store.mutate((state) => {
      const existing = state.workflows.findIndex((item) => item.id === workflow.id)
      if (existing >= 0) state.workflows[existing] = workflow
      else state.workflows.push(workflow)
      return workflow
    })
    const plan = {
      sessionId,
      workflowId: saved.id,
      workflowName: saved.name,
      turn,
      status: PLAN_STATUS.AWAITING,
      updatedAt: new Date().toISOString(),
      steps: index,

      mode: workflow.mode,
      layout: workflow.layout,
      phases: Array.isArray(workflow.phases) ? workflow.phases : [],
      warnings: Array.isArray(warnings) ? warnings : [],

      waiters: [],
    }
    plans.set(keyOf(sessionId), plan)
    log(`plan published for session ${sessionId || '(none)'} turn ${turn} (${index.length} steps, workflow ${saved.id})`)
    return { plan, workflow: saved }
  }

  function settle(sessionId, status, extra = {}) {
    const plan = read(sessionId)
    if (!plan) return null
    plan.status = status
    plan.updatedAt = new Date().toISOString()
    const waiters = plan.waiters.splice(0, plan.waiters.length)
    const result = {
      status,
      turn: plan.turn,
      workflowId: plan.workflowId,
      workflowName: plan.workflowName,
      steps: plan.steps,
      ...extra,
    }
    for (const resolve of waiters) {
      try {
        resolve(result)
      } catch {
      }
    }
    return result
  }

  async function confirm(sessionId, workflowInput) {
    const plan = read(sessionId)
    if (!plan) {
      throw new FlowError(ERROR_CODES.NOT_FOUND, '当前没有等待确认的计划', { kind: 'not-found', source: 'plan' })
    }
    let adjusted = false
    if (workflowInput && typeof workflowInput === 'object') {
      const normalized = normalizeWorkflow({ ...workflowInput, id: plan.workflowId })
      await store.mutate((state) => {
        const index = state.workflows.findIndex((item) => item.id === plan.workflowId)
        if (index >= 0) state.workflows[index] = normalized
      })
      adjusted = true
    }
    return settle(sessionId, adjusted ? PLAN_STATUS.ADJUSTED : PLAN_STATUS.CONFIRMED)
  }

  function skip(sessionId, reason) {
    return settle(sessionId, PLAN_STATUS.SKIPPED, { reason })
  }

  function waitFor(sessionId, timeoutMs, signal) {
    const plan = read(sessionId)
    if (!plan) return Promise.resolve({ status: PLAN_STATUS.IDLE })
    const waitMs = Number.isFinite(Number(timeoutMs)) && Number(timeoutMs) > 0 ? Number(timeoutMs) : 120000
    return new Promise((resolve) => {
      let timer
      const finish = (value) => {
        clearTimeout(timer)
        resolve(value)
      }
      plan.waiters.push(finish)
      if (signal) {
        const onAbort = () => finish({ status: PLAN_STATUS.IDLE, reason: 'aborted', turn: plan.turn, workflowId: plan.workflowId })
        if (signal.aborted) onAbort()
        else signal.addEventListener('abort', onAbort, { once: true })
      }
      timer = setTimeout(() => {
        const result = settle(sessionId, PLAN_STATUS.TIMEOUT, { reason: `等待确认超过 ${waitMs}ms` })
        if (result === null) resolve({ status: PLAN_STATUS.TIMEOUT, turn: plan.turn, workflowId: plan.workflowId })
      }, waitMs)
    })
  }

  return {
    publish,
    confirm,
    skip,
    waitFor,
    read,

    describe(sessionId) {
      const plan = read(sessionId)
      if (!plan) return { status: PLAN_STATUS.IDLE }
      return {
        status: plan.status,
        turn: plan.turn,
        workflowId: plan.workflowId,
        workflowName: plan.workflowName,
        updatedAt: plan.updatedAt,
        steps: plan.steps,
        mode: plan.mode,
        layout: plan.layout,
        phases: plan.phases,
        warnings: plan.warnings ?? [],
        waiting: plan.waiters.length > 0,
      }
    },
  }
}
