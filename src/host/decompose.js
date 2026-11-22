/*! dsh-agent-flow v0.0.1 | Copyright (c) 2026 RimeLumen | MIT License */
const DEP_WORDS = ['基于', '等待', '依赖', '之后', '完成后再', '根据上述']
const PARALLEL_WORDS = ['同时', '并行', '与此同时']
const QUESTION_MARKERS = ['为什么', '是什么', '怎么做', '如何', '会不会', '是否', '怎么样']

// 阶段/顺序词——中文常用逗号分隔步骤（"先X，然后Y，最后Z"），
// 因此在硬分隔符之外，还要在「顺序词之前的逗号」处切开，否则整句只会算作一步。
const SEQUENCE_AHEAD = /[，,]\s*(?=(?:然后|接着|最后|再|其次|随后|同时|基于|之后))/;
const STAGE_HEAD = /^(第[一二三四五六七八九十\d]+步|阶段\s*[一二三四五六七八九十\d]*)\s*[：:，,、]?\s*/;

function splitSteps(text) {
  const out = [];
  for (const hard of String(text || '').split(/\r?\n|。|；|;|！|!|？|\?/g)) {
    for (const piece of hard.split(SEQUENCE_AHEAD)) {
      const step = piece.replace(/^[\s\-–—*•\d]+[.、)]?\s*/, '').trim();
      if (step.length >= 4 && step.length <= 120) out.push(step);
    }
  }
  return out.slice(0, 12);
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
  const phases = []
  let current = null
  for (const step of steps) {
    // 阶段词只把「阶段一 / 第三步」这样的头部当标题，余下内容才是这一步的实际工作——
    // 否则整句当标题，会和子任务标题重复。
    const head = step.match(STAGE_HEAD)
    if (head) {
      const rest = step.slice(head[0].length).trim()
      current = { title: head[1].trim(), subtasks: [] }
      phases.push(current)
      if (rest.length >= 4) current.subtasks.push(rest.slice(0, 80))
      continue
    }
    if (!current) {
      current = { title: `阶段 ${phases.length + 1}`, subtasks: [] }
      phases.push(current)
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
          // 识别到工具名就落成 tool.call 节点，否则 phasesToWorkflow 只会建 agent.task
          kind: tool ? 'tool.call' : 'agent.task',
          tool: tool ?? undefined,
          reliesOn: ti > 0 ? [prevTitle] : (pi > 0 && DEP_WORDS.some((w) => task.includes(w)) ? [phases[pi - 1].title] : undefined),
          parallel: PARALLEL_WORDS.some((w) => task.includes(w)),
        }
      }),
    })).filter((p) => p.subtasks.length > 0 || p.title),
  }
}
