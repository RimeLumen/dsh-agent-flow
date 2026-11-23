/*! dsh-agent-flow v0.1.0 | Copyright (c) 2026 RimeLumen | MIT License */
// R6.1 工具定义文件化：四个 flow_* 工具的 schema/execute 与注册流程从 index.js 整体迁入。
// deps 显式注入（store/registry/plans/effectiveFor/configDefaults/log/toolRegistration），
// register 由调用方传入（= tools.register），实现宿主注入与工具定义解耦。
// 函数体自 index.js 原样搬运（除 register 参数化与外壳剥离），零语义改动。

export function setupFlowTools(deps, register) {
  const { store, registry, plans, effectiveFor, configDefaults, log, toolRegistration } = deps
    // 统一回收：此前 disposeProgress/disposeCompose 声明后从未被任何 disposer 调用，
    // 插件重载时两个工具悬挂（旧 store 闭包滞留 + 重复注册）。
    const disposers = []
    let disposed = false
    const disposeAll = () => {
      if (disposed) return
      disposed = true
      for (const dispose of disposers.splice(0, disposers.length)) {
  try {
        dispose?.()
      } catch {
      }
    }
  }
  try {
    const dispose = register({
      name: 'flow_status',
      description:
        'Read-only Agent Flow status for this session: saved flow definitions, recent runs, and the currently injected context selection. Use it before starting or debugging a flow from the canvas.',
      parameters: {
        type: 'object',
        properties: {
          workflowId: { type: 'string', description: 'Optional: report one flow definition in detail.' },
          includeDefinitions: { type: 'boolean', description: 'Include every saved flow definition with its node kinds.' },
        },
        additionalProperties: false,
      },
      output: {
        schema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] },
        render: (_args, value) => [{ type: 'text', text: String(value?.text ?? '') }],
      },
      async execute(args = {}, exec) {
        const sessionId = exec?.agent?.id ?? ''
        // R4.5 就绪门：Store 构造即置空 state，load 完成前的早期调用会假阴性「还没有画布」
        await store.ready()
        const lines = []
        const eff = effectiveFor(sessionId)
        lines.push(`当前注入：模式=${eff.mode} 预设=${eff.profileName ?? '（无）'} 作用域=${eff.source}`)
        lines.push(`技能：预载 ${eff.skillPreload.length} / 索引 ${eff.skillIndex.length}；工具白名单：${eff.toolAllow ? `${eff.toolAllow.length} 项` : '未限制'}`)
        const runs = registry.list().filter((run) => !sessionId || run.sessionId === sessionId).slice(0, 5)
        const bound = sessionId ? store.state.workflows.filter((item) => item.sessionId === sessionId) : []
        if (sessionId) {
          if (bound.length === 0) lines.push('会话画布：本会话还没有绑定流程（首次 flow_plan 会自动创建并绑定）。')
          else {
            const latest = bound[bound.length - 1]
            lines.push(`会话画布：${bound.length} 条绑定本会话；当前轮次 turn=${latest.turn ?? 0}（${latest.name} · ${latest.id}）`)
          }
        }
        if (runs.length === 0) lines.push('本会话没有运行记录。')
        else {
          lines.push('最近运行：')
          for (const run of runs) {
            const running = run.cursor.length > 0 ? ` 当前节点 ${run.cursor.join('、')}` : ''
            lines.push(`- ${run.id}｜${run.workflowName || run.workflowId}｜${run.status}${running}`)
          }
        }
        const wanted = typeof args.workflowId === 'string' && args.workflowId !== ''
          ? store.state.workflows.filter((item) => item.id === args.workflowId)
          : args.includeDefinitions === true
            ? store.state.workflows
            : []
        // R5.1 Token 经济：节点明细有上限——此前全库全节点逐行列出，大库一次调用吞数十 KB 上下文
        let listed = 0
        const MAX_NODE_LINES = 200
        let truncated = false
        for (const workflow of wanted) {
          lines.push(`流程 ${workflow.id}「${workflow.name}」：${workflow.nodes.length} 个节点`)
          for (const node of workflow.nodes) {
            if (listed >= MAX_NODE_LINES) { truncated = true; break }
            lines.push(`  - [${node.id}] ${node.title} (${node.kind})`)
            listed += 1
          }
          if (truncated) break
        }
        if (truncated) lines.push(`（已达 ${MAX_NODE_LINES} 行上限，已截断——用 workflowId 参数查看单个流程，或用具体流程的画布确认）`)
        return { text: lines.join('\n') }
      },
    })
    toolRegistration.flow_status = true
    disposers.push(dispose)
    log('flow_status tool registered')

    try {
      const disposePlan = register({
        name: 'flow_plan',
        description:
          'Publish this turn\'s plan as a node graph on the Agent Flow canvas and wait for the user to confirm or adjust it. Call this BEFORE doing the work of a turn. Returns a status: confirmed/adjusted (proceed with the returned steps), skipped (the user does not want to wait), or timeout (proceed and say it was not confirmed).',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Short plan title shown on the canvas.' },
            summary: { type: 'string', description: 'One or two lines on what this turn will do.' },
            steps: {
              type: 'array',
              description: 'The steps of this turn, in order. Each becomes a node; substeps become child steps bound to the parent node.',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string', description: 'Step title (required).' },
                  reliesOn: { type: 'array', items: { type: 'string' }, description: 'Titles this step logically depends on; drawn as a solid dependency arrow.' },
                  kind: { type: 'string', description: 'Optional node kind: agent.task (default), tool.call, human.checkpoint, io.output, inject.skill, flow.wait, flow.parallel, branch.condition…' },
                  prompt: { type: 'string', description: 'What to do in this step (for agent.task / human.checkpoint).' },
                  detail: { type: 'string', description: 'Extra detail for the node summary.' },
                  optional: { type: 'boolean', description: 'When true the step may be skipped on failure.' },
                  tool: { type: 'string', description: 'Tool name for kind=tool.call.' },
                  args: { type: 'string', description: 'JSON string of tool arguments for kind=tool.call.' },
                  allowDangerous: { type: 'boolean', description: 'Set true only for a deliberately dangerous tool call.' },
                  substeps: {
                    type: 'array',
                    description: 'Child steps (a/b/c) bound to this parent step.',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        kind: { type: 'string' },
                        prompt: { type: 'string' },
                      },
                      required: ['title'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['title'],
                additionalProperties: false,
              },
            },
          },
          mode: { type: 'string', enum: ['task', 'design'], description: 'task (default): a plan produced from this turn\'s text. design: rebuild a plan from a saved experience skeleton.' },
          layout: { type: 'string', enum: ['chain', 'star', 'radial'], description: 'Preferred canvas layout; switching it later only changes coordinates, not data.' },
          phases: {
            type: 'array',
            description: 'Structured plan: Phase 1/2/3, each with its own subtasks. Prefer this over steps for anything with stages. Write logical prerequisites as reliesOn: ["<title of another step>"]; unresolvable titles are reported back as warnings instead of being dropped silently.',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Phase title, e.g. "Phase 1 现状梳理".' },
                goal: { type: 'string', description: 'What this phase must achieve, one line.' },
                subtasks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      kind: { type: 'string' },
                      prompt: { type: 'string' },
                      detail: { type: 'string' },
                      tool: { type: 'string' },
                      args: { type: 'string' },
                      allowDangerous: { type: 'boolean' },
                      reliesOn: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Titles (or node ids) this subtask logically depends on; drawn as a solid dependency arrow.',
                      },
                    },
                    required: ['title'],
                    additionalProperties: false,
                  },
                },
              },
              required: ['title'],
              additionalProperties: false,
            },
          },
          additionalProperties: false,
        },
        output: {
          schema: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              text: { type: 'string' },
              workflowId: { type: 'string' },
              warnings: { type: 'array', items: { type: 'object' } },
            },
            required: ['text'],
          },
          render: (_args, value) => [{ type: 'text', text: String(value?.text ?? '') }],
        },
        timeoutMs: configDefaults.planTimeoutMs + 15000,
        async execute(args = {}, exec) {
          const sessionId = exec?.agent?.id ?? ''
          // R4.5 就绪门：Store 构造即置空 state，load 完成前的早期调用会假阴性「还没有画布」
          await store.ready()
          const published = await plans.publish(sessionId, args)
          const timeoutMs = Number(store.state.prefs?.planTimeoutMs) > 0
            ? Number(store.state.prefs.planTimeoutMs)
            : configDefaults.planTimeoutMs
          const result = await plans.waitFor(sessionId, timeoutMs, exec?.signal)
          const lines = []
          if (result.status === 'confirmed') lines.push('用户已确认你的计划。'
            )
          else if (result.status === 'adjusted') lines.push('用户在画布上调整了计划，请以下面的步骤为准。')
          else if (result.status === 'skipped') lines.push('用户选择跳过确认（不想等待）。直接开始工作，不要再来问一次。')
          else if (result.status === 'replaced') lines.push('这份计划已被同一会话的下一轮计划替换（可能你在同一轮里调用了两次）。以最新一次画布内容为准，不要重复等待。')
          else if (result.status === 'timeout') lines.push(`等待确认超时（${timeoutMs}ms）：按你画的计划继续，并在回复中说明这一步未获人工确认。`)
          else lines.push('计划确认流程被中断：按你画的计划继续。')
          lines.push(`画布上的流程：${published.workflow.name}（${published.workflow.nodes.length} 个节点）`)
          for (const step of published.plan.steps) {
            // 带 id 输出：模型后续用 nodeId 上报进度（比复述标题省 token 且精确命中）
            lines.push(`- [${step.id}] ${step.title}${Array.isArray(step.children) && step.children.length > 0 ? `（含 ${step.children.length} 个子步骤）` : ''}`)
          }
          // 执行协议（用户指令）：确认后模型拿到的是可直接照做的执行序列
          const firstStep = Array.isArray(published.plan.steps) ? published.plan.steps[0] : null
          if (firstStep && (result.status === 'confirmed' || result.status === 'adjusted')) {
            lines.push(`首个执行：[${firstStep.id}] ${firstStep.title}；每步开始/完成/失败用 flow_progress 上报（优先 nodeId，连续变化可用 items 批量）。`)
          }
          if (Array.isArray(published.plan.phases) && published.plan.phases.length > 0) {
            const modeLabel = published.plan.mode === 'design' ? '设计' : '任务'
            lines.push(`阶段（${modeLabel}模式 · 布局 ${published.plan.layout}）：${published.plan.phases.map((phase) => phase.title).join(' / ')}`)
          }
          const warnings = Array.isArray(published.plan.warnings) ? published.plan.warnings : []
          if (warnings.length > 0) {
            lines.push('引用警告（这些 reliesOn 没找到对应节点，依赖边已跳过；改成图里真实存在的标题即可）：')
            for (const warning of warnings.slice(0, 8)) lines.push(`- ${warning.message}`)
          }
          return { status: result.status, text: lines.join('\n'), workflowId: published.workflow.id, warnings }
        },
      })
      toolRegistration.flow_plan = true
      disposers.push(disposePlan)
      log('flow_plan tool registered')

    // 用户反馈：工作中实时更新画布——Agent 执行时经 flow_progress 上报节点状态，画布实时点亮。
    try {
      const disposeProgress = register({
        name: 'flow_progress',
        description: 'Report step status: { nodeId, status } (nodeId from flow_plan output; batch with items[]).',
        parameters: {
          type: 'object',
          properties: {
            nodeId: { type: 'string', description: 'Node id from the flow_plan output (preferred over title).' },
            title: { type: 'string', description: 'Fallback: step title exactly as drawn on the canvas (first unfinished match).' },
            status: { type: 'string', enum: ['running', 'succeeded', 'failed'], description: 'New status of the step.' },
            items: {
              type: 'array',
              description: 'Batch mode: several status changes in one call (e.g. mark the previous step done together with the next one starting). Each item: { nodeId?, title?, status }. Use this instead of repeated single calls.',
              items: {
                type: 'object',
                properties: {
                  nodeId: { type: 'string' },
                  title: { type: 'string' },
                  status: { type: 'string', enum: ['running', 'succeeded', 'failed'] },
                },
                required: ['status'],
                additionalProperties: false,
              },
            },
          },
          additionalProperties: false,
        },
        output: {
          schema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] },
          render: (_args, value) => [{ type: 'text', text: String(value?.text ?? '') }],
        },
        async execute(args = {}, exec) {
          const sessionId = exec?.agent?.id ?? ''
          // R4.5 就绪门：Store 构造即置空 state，load 完成前的早期调用会假阴性「还没有画布」
          await store.ready()
          // 批量优先：items[] 每项一条状态；单条模式取顶层 nodeId/title + status。
          const entries = Array.isArray(args.items) && args.items.length > 0
            ? args.items.slice(0, 20)
            : [{ nodeId: args.nodeId, title: args.title, status: args.status }]
          const updated = await store.mutate((state) => {
            const workflow = state.workflows.find((item) => item.sessionId === sessionId && !item.archivedAt)
              ?? state.workflows.find((item) => item.sessionId === sessionId)
            if (!workflow) return null
            const nodeStatus = { ...(workflow.nodeStatus ?? {}) }
            const okList = []
            const missList = []
            const driftList = []
            // 漂移护栏：命中的节点不在已确认计划（含子步骤）中时柔性提示，不拒绝上报
            const plan = plans?.read?.(sessionId) ?? null
            const plannedIds = new Set((Array.isArray(plan?.steps) ? plan.steps : [])
              .flatMap((step) => [step.id, ...(Array.isArray(step.children) ? step.children : [])]))
            for (const raw of entries) {
              const status = ['running', 'succeeded', 'failed'].includes(raw?.status) ? raw.status : 'running'
              const nodeId = typeof raw?.nodeId === 'string' ? raw.nodeId : ''
              const title = typeof raw?.title === 'string' ? raw.title : ''
              // nodeId 精确命中（省 token 的主路径）；title 兜底（同名未完成优先，避免重复标题永远点亮同一个）。
              const node = (nodeId ? workflow.nodes.find((item) => item.id === nodeId) : null)
                ?? (title
                  ? workflow.nodes.find((item) => item.title === title && (nodeStatus[item.id] ?? 'idle') !== 'succeeded')
                    ?? workflow.nodes.find((item) => item.title.toLowerCase() === title.toLowerCase() && (nodeStatus[item.id] ?? 'idle') !== 'succeeded')
                    ?? workflow.nodes.find((item) => item.title === title)
                    ?? workflow.nodes.find((item) => item.title.toLowerCase() === title.toLowerCase())
                  : null)
              if (!node) {
                missList.push(nodeId || title || '(空)')
                continue
              }
              if (status === 'running') {
                for (const [id, previous] of Object.entries(nodeStatus)) {
                  if (previous === 'running' && id !== node.id) nodeStatus[id] = 'succeeded'
                }
              }
              nodeStatus[node.id] = status
              okList.push(node.id)
              if (plannedIds.size > 0 && !plannedIds.has(node.id)) driftList.push(node.id)
            }
            if (okList.length > 0) {
              workflow.nodeStatus = nodeStatus
              workflow.updatedAt = new Date().toISOString()
            }
            // 完成信号：已确认计划内的可执行节点（排除容器）全部终态时明确告知；
            // 用户手画的计划外节点不阻塞完成信号。
            const actionable = workflow.nodes.filter((item) => item.kind !== 'group.steps' && item.kind !== 'phase')
            const plannedActionable = plannedIds.size > 0
              ? actionable.filter((item) => plannedIds.has(item.id))
              : actionable
            const allDone = plannedActionable.length > 0 && plannedActionable.every((item) => ['succeeded', 'failed'].includes(nodeStatus[item.id] ?? 'idle'))
            return { okList, missList, driftList, allDone }
          })
          if (!updated) return { text: '本会话还没有画布：先用 flow_plan 画一张。' }
          // 返回极短化：进度上报是高频调用，每次的往返 token 都是执行期开销。
          const { okList, missList, driftList, allDone } = updated
          const parts = []
          if (okList.length > 0) parts.push(entries.length > 1 ? `ok ${okList.length}/${entries.length}` : 'ok')
          if (missList.length > 0) parts.push(`未找到: ${missList.join(', ')}——请用 flow_plan 返回的节点 id 或画布标题`)
          if (driftList.length > 0) parts.push(`注意: ${driftList.join(', ')} 不在已确认计划中`)
          if (allDone) parts.push('计划已全部执行完成')
          return { text: parts.join('；') || 'no-op' }
        },
      })
      toolRegistration.flow_progress = true
      disposers.push(disposeProgress)
      log('flow_progress tool registered')
    } catch (error) {
      toolRegistration.flow_progress = false
      log(`flow_progress tool was not registered: ${error instanceof Error ? error.message : String(error)}`)
    }

    // 反向组合（批次 3）：把当前画布组合成可执行的提示词，交回给 Agent。
    try {
      const disposeCompose = register({
        name: 'flow_compose',
        description: 'Turn the current session\'s flow canvas into an executable prompt, so the arrangement on the canvas becomes work the agent can run. Use it after the user edits the canvas.',
        parameters: {
          type: 'object',
          properties: {
            goal: { type: 'string', description: 'Optional one-line goal placed at the top of the composed prompt.' },
            workflowId: { type: 'string', description: 'Optional flow id; defaults to this session\'s active canvas.' },
          },
          additionalProperties: false,
        },
        output: {
          schema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] },
          render: (_args, value) => [{ type: 'text', text: String(value?.text ?? '') }],
        },
        async execute(args = {}, exec) {
          const sessionId = exec?.agent?.id ?? ''
          // R4.5 就绪门：Store 构造即置空 state，load 完成前的早期调用会假阴性「还没有画布」
          await store.ready()
          const workflow = args.workflowId
            ? store.state.workflows.find((item) => item.id === args.workflowId)
            : (store.state.workflows.find((item) => item.sessionId === sessionId && !item.archivedAt)
              ?? store.state.workflows.find((item) => item.sessionId === sessionId))
          if (!workflow) return { text: '当前会话还没有画布：先用 flow_plan 画一张，或在画布上手工搭一个流程。' }
          const result = composePrompt(workflow, { goal: args.goal })
          const warns = result.warnings.length > 0
            ? '\n\n> 图的结构提醒：' + result.warnings.map((item) => item.message).join('；')
            : ''
          return { text: result.text + warns }
        },
      })
      toolRegistration.flow_compose = true
      disposers.push(disposeCompose)
      log('flow_compose tool registered')
    } catch (error) {
      toolRegistration.flow_compose = false
      log(`flow_compose tool was not registered: ${error instanceof Error ? error.message : String(error)}`)
    }

      return disposeAll
    } catch (error) {
      log(`flow_plan tool was not registered: ${error instanceof Error ? error.message : String(error)}`)
    }

    return disposeAll
  } catch (error) {
    log(`flow_status tool was not registered: ${error instanceof Error ? error.message : String(error)}`)
    return undefined
  }
}
