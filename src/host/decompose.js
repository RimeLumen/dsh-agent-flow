/*! dsh-agent-flow v0.0.1 | Copyright (c) 2026 RimeLumen | MIT License */
const STAGE_RE = /阶段|Phase\s*\d|第[一二三]步/i
const DEP_WORDS = ['基于', '等待', '依赖', '之后', '完成后再', '根据上述']
const PARALLEL_WORDS = ['同时', '并行', '与此同时']
const QUESTION_MARKERS = ['为什么', '是什么', '怎么做', '如何', '会不会', '是否', '怎么样']

function splitSteps(text) {
  return String(text || '')
    .split(/\r?\n|。|；|;|！|!|？|\?/g)
    .map((s) => s.replace(/^[\s\-–—*•\d]+[.、)]?\s*/, '').trim())
    .filter((s) => s.length >= 4 && s.length <= 120)
    .slice(0, 12)
}

const isQuestion = (s) => QUESTION_MARKERS.some((w) => s.includes(w))

function matchTool(text, toolNames) {
  const lowered = text.toLowerCase()
  for (const name of toolNames) {
    if (name.length < 3) continue
    if (lowered.includes(name.toLowerCase())) return name
  }
  return null
}

export function decomposePrompt(text, catalog) {
  const catalogSafe = catalog ?? {}
  const toolNames = (catalogSafe.tools ?? []).map((t) => t.name)
  const steps = splitSteps(text)
  if (steps.length === 0) return { isTrivial: true, phases: [] }
  const hasPhaseWords = steps.some((s) => STAGE_RE.test(s))
  const phases = []
  let current = null
  for (const [i, step] of steps.entries()) {
    const startsPhase = STAGE_RE.test(step) || (i === 0 && steps.length > 6)
    if (startsPhase || !current) {
      current = { title: (startsPhase ? step.slice(0, 40) : `阶段 ${phases.length + 1}`), subtasks: [] }
      phases.push(current)
      if (startsPhase && step.length > 8) current.subtasks.push(step.replace(/^阶段[：:]?\s*/i, '').slice(0, 80))
      continue
    }
    current.subtasks.push(step.slice(0, 80))
  }
  return {
    title: String(text || '').trim().slice(0, 40) || '自动草稿',
    isTrivial: steps.length < 2,
    phases: phases.map((phase, pi) => ({
      title: phase.title,
      order: pi,
      subtasks: (phase.subtasks.length > 0 ? phase.subtasks : [phase.title]).slice(0, 6).map((task, ti) => {
        const tool = matchTool(task, toolNames)
        const prevTitle = ti > 0 ? (phase.subtasks[ti - 1] || phase.title).slice(0, 60) : (pi > 0 ? phases[pi - 1].title : undefined)
        return {
          title: task.slice(0, 60),
          kind: 'agent.task',
          tool: tool ?? undefined,
          reliesOn: ti > 0 ? [prevTitle] : (pi > 0 && DEP_WORDS.some((w) => task.includes(w)) ? [phases[pi - 1].title] : undefined),
          parallel: PARALLEL_WORDS.some((w) => task.includes(w)),
        }
      }),
    })).filter((p) => p.subtasks.length > 0 || p.title),
  }
}
