/*! dsh-agent-flow v0.1.0 | Copyright (c) 2026 RimeLumen | MIT License */
const mId = (id) => `m_${String(id).replace(/[^A-Za-z0-9_]/g, '_')}`

const esc = (text) => String(text ?? '').replace(/"/g, '#quot;')

export function toMermaid(workflow) {
  if (!workflow || !Array.isArray(workflow.nodes)) return 'flowchart TD\n'
  const lines = ['flowchart TD']
  const phases = Array.isArray(workflow.phases) ? workflow.phases : []
  const childrenOfPhase = (phaseId) => workflow.nodes.filter((node) => node.phaseId === phaseId)
  const nodeLine = (node) => `  ${mId(node.id)}["${esc(node.title)}"]`
  const defined = new Set()

  if (phases.length > 0) {
    for (const phase of phases) {
      const children = childrenOfPhase(phase.id)
      lines.push(`  subgraph ${mId(phase.id)}["${esc(phase.title)}"]`)
      for (const child of children) {
        lines.push(nodeLine(child))
        defined.add(child.id)
      }
      lines.push('  end')
    }
    for (const node of workflow.nodes) {
      if (node.kind === 'phase' || defined.has(node.id)) continue
      lines.push(nodeLine(node))
      defined.add(node.id)
    }
  } else {
    for (const node of workflow.nodes) {
      lines.push(nodeLine(node))
    }
  }

  for (const edge of workflow.edges ?? []) {
    const arrow = '-.->'
    lines.push(`  ${mId(edge.from)} ${arrow} ${mId(edge.to)}`)
  }
  for (const node of workflow.nodes) {
    for (const ref of Array.isArray(node.reliesOn) ? node.reliesOn : []) {
      lines.push(`  ${mId(ref)} --> ${mId(node.id)}`)
    }
  }
  return lines.join('\n')
}

function parseNodeToken(token) {
  const match = /^([A-Za-z0-9_]+)(?:\["([^"]*)"\]|\("([^"]*)"\)|\{"([^"]*)"\}|\[\("([^"]*)"\]\))?$/.exec(token.trim())
  if (!match) return null
  return { id: match[1], title: match[2] ?? match[3] ?? match[4] ?? match[5] ?? match[1] }
}

export function fromMermaid(text, options = {}) {
  const issues = []
  const nodes = []
  const edges = []
  const phases = []
  const nodeTitle = new Map()
  let currentPhase = null
  const raw = String(text ?? '').split(/\r?\n/)

  raw.forEach((line, index) => {
    const trimmed = line.trim()
    const where = { line: index + 1 }
    if (trimmed === '' || trimmed.startsWith('%%')) return
    if (/^(flowchart|graph)\s+(TD|TB|LR|RL|BT)/i.test(trimmed)) return

    const subgraph = /^subgraph\s+([A-Za-z0-9_]+)(?:\s*\["([^"]*)"\])?/i.exec(trimmed)
    if (subgraph) {
      currentPhase = { id: subgraph[1], title: subgraph[2] ?? subgraph[1], order: phases.length }
      phases.push(currentPhase)
      return
    }
    if (/^end$/i.test(trimmed)) {
      currentPhase = null
      return
    }

    const edge = /^([A-Za-z0-9_]+)(\[[^\]]*\]|\([^)]*\)|\{[^}]*\})?\s*(-\.->|-->|==>|---)(?:\s*\|[^|]*\|)?\s*([A-Za-z0-9_]+)(\[[^\]]*\])?/.exec(trimmed)
    if (edge) {
      const from = parseNodeToken(edge[1] + (edge[2] ?? ''))
      const to = parseNodeToken(edge[4] + (edge[5] ?? ''))
      if (!from || !to) {
        issues.push({ level: 'warn', code: 'MERMAID_PARSE', message: `第 ${index + 1} 行无法解析，已跳过`, details: { line: trimmed } })
        return
      }
      for (const item of [from, to]) {
        if (!nodeTitle.has(item.id)) {
          nodeTitle.set(item.id, item.title)
          nodes.push({ id: item.id, kind: 'agent.task', title: item.title, pos: { x: 80, y: 80 }, params: {}, onError: 'fail', phaseId: currentPhase?.id })
        }
      }
      if (edge[3] === '==>') {
        const target = nodes.find((item) => item.id === to.id)
        target.reliesOn = [...new Set([...(target.reliesOn ?? []), from.id])]
      } else {
        edges.push({ id: `e_${from.id}_${to.id}`, from: from.id, fromPort: 'out', to: to.id, fromSide: 'right', toSide: 'left' })
      }
      return
    }

    const single = /^([A-Za-z0-9_]+)(\["([^"]*)"\]|\("([^"]*)"\)|\{"([^"]*)"\}|\[\("([^"]*)"\]\))?$/.exec(trimmed)
    if (single) {
      if (!nodeTitle.has(single[1])) {
        nodeTitle.set(single[1], single[3] ?? single[4] ?? single[5] ?? single[6] ?? single[1])
        nodes.push({ id: single[1], kind: 'agent.task', title: nodeTitle.get(single[1]), pos: { x: 80, y: 80 }, params: {}, onError: 'fail', phaseId: currentPhase?.id })
      }
      return
    }

    issues.push({ level: 'warn', code: 'MERMAID_PARSE', message: `第 ${index + 1} 行不是受支持的 Mermaid 语法，已跳过`, details: { line: trimmed } })
  })

  const workflow = {
    name: typeof options.name === 'string' && options.name !== '' ? options.name : '导入的 Mermaid 流程',
    origin: 'user',
    nodes,
    edges,
    phases,
    entry: nodes[0]?.id ?? '',
    vars: {},
  }
  return { workflow, issues }
}
