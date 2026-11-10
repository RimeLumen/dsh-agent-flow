/* @client-shard: 03-api */
    const api = {
      catalog: (sessionId, cwd) => request('GET', `/catalog?sessionId=${encodeURIComponent(sessionId ?? '')}&cwd=${encodeURIComponent(cwd ?? '')}`),
      selection: () => request('GET', '/selection'),
      effective: (sessionId, workspaceId) => request('GET', `/selection/effective?sessionId=${encodeURIComponent(sessionId ?? '')}&workspaceId=${encodeURIComponent(workspaceId ?? '')}`),
      saveProfile: (profile, sessionId) => request('PUT', `/selection?sessionId=${encodeURIComponent(sessionId ?? '')}`, { profile }),
      deleteProfile: (id) => request('DELETE', `/selection/${encodeURIComponent(id)}`),
      regenerateDefault: () => request('POST', '/selection/default', {}),
      duplicateProfile: (id, name) => request('POST', `/selection/${encodeURIComponent(id)}/duplicate`, { name }),
      applyProfile: (id, sessionId, workspaceId) => request('POST', `/selection/${encodeURIComponent(id)}/apply`, { sessionId, workspaceId }),
      workflows: (archived) => request('GET', `/workflows${archived === 'only' ? '?archived=only' : archived === 'all' ? '?archived=all' : ''}`),
      workflow: (id) => request('GET', `/workflows/${encodeURIComponent(id)}`),
      createWorkflow: (name, from) => request('POST', '/workflows', { name, from }),
      saveWorkflow: (id, workflow) => request('PUT', `/workflows/${encodeURIComponent(id)}`, { workflow }),
      deleteWorkflow: (id) => request('DELETE', `/workflows/${encodeURIComponent(id)}`),
      batchWorkflows: (action, ids) => request('POST', '/workflows/batch', { action, ids }),
      archiveWorkflow: (id) => request('POST', `/workflows/${encodeURIComponent(id)}/archive`),
      restoreWorkflow: (id) => request('POST', `/workflows/${encodeURIComponent(id)}/restore`),
      experiences: (workspaceId, cwd) => request('GET', `/experiences?workspaceId=${encodeURIComponent(workspaceId ?? '')}&cwd=${encodeURIComponent(cwd ?? '')}`),
      saveExperience: (payload) => request('POST', '/experiences', payload),
      adoptExperience: (id) => request('POST', `/experiences/${encodeURIComponent(id)}/adopt`),
      deleteExperience: (id) => request('DELETE', `/experiences/${encodeURIComponent(id)}`),
      mermaidExport: (id) => request('GET', `/workflows/${encodeURIComponent(id)}/mermaid`),
      mermaidImport: (mermaid, name) => request('POST', '/workflows/import-mermaid', { mermaid, name }),
      probeArchive: async () => {
        try {
          await request('GET', '/workflows/__probe__/archive')
          return true
        } catch (problem) {
          return !/没有这个接口/.test(String((problem && problem.message) || problem))
        }
      },
      validate: (id, sessionId) => request('POST', `/workflows/${encodeURIComponent(id)}/validate?sessionId=${encodeURIComponent(sessionId ?? '')}`),
      // 反向组合（批次 3）：画布 → 提示词
      compose: (id, goal) => request('POST', `/workflows/${encodeURIComponent(id)}/compose`, { goal }),
      startRun: (workflowId, sessionId, vars, workspaceId) => request('POST', '/runs', { workflowId, sessionId, vars, workspaceId }),
      run: (id, since) => request('GET', `/runs/${encodeURIComponent(id)}?since=${Number(since) || 0}`),
      runs: (sessionId) => request('GET', `/runs?sessionId=${encodeURIComponent(sessionId ?? '')}`),
      control: (id, action, extra) => request('POST', `/runs/${encodeURIComponent(id)}/control`, { action, ...(extra ?? {}) }),
      prefs: () => request('GET', '/prefs'),
      savePrefs: (patch) => request('PUT', '/prefs', patch),
      diagnostics: () => request('GET', '/diagnostics'),
      exportData: () => request('GET', '/export'),
      importData: (data, mode) => request('POST', '/import', { data, mode }),
      errors: (limit) => request('GET', `/errors?limit=${Number(limit) || 50}`),
      clearErrors: () => request('POST', '/errors/clear'),
    }

    function sessionCwd(ctx, sessionId, props) {
      const fromProps = props?.session?.cwd
      if (typeof fromProps === 'string' && fromProps !== '') return fromProps
      try {
        const byId = ctx?.get?.('sessions')?.list?.getSnapshot?.()?.byId
        const cwd = sessionId ? byId?.[sessionId]?.cwd : undefined
        return typeof cwd === 'string' && cwd !== '' ? cwd : undefined
      } catch {
        return undefined
      }
    }

    function createStore(initial) {
      let state = initial
      const listeners = new Set()
      return {
        get: () => state,
        set: (patch) => {
          const next = typeof patch === 'function' ? patch(state) : { ...state, ...patch }
          if (next === state) return
          state = next
          for (const listener of [...listeners]) listener()
        },
        subscribe: (listener) => {
          listeners.add(listener)
          return () => listeners.delete(listener)
        },
      }
    }

    function useStoreValue(store) {
      return useSyncExternalStore(store.subscribe, store.get, store.get)
    }

    function emptyRunState() {
      return { runId: null, status: 'idle', nodes: {}, cursor: [], logs: [], checkpoint: null, traversals: {}, lastSeq: 0 }
    }

    function applyFrame(state, frame) {
      const next = { ...state, lastSeq: Math.max(state.lastSeq, frame.seq) }
      switch (frame.type) {
        case 'run.start':
          next.status = 'running'
          next.nodes = Object.fromEntries(Object.entries(state.nodes).map(([id, slot]) => [id, { ...slot, status: 'pending', error: null, output: null }]))
          next.checkpoint = null
          break
        case 'node.enter': {
          const slot = state.nodes[frame.nodeId] ?? { nodeId: frame.nodeId }
          next.nodes = { ...state.nodes, [frame.nodeId]: { ...slot, status: 'running', startedAt: frame.ts, attempt: frame.data?.attempt ?? 1 } }
          next.cursor = state.cursor.includes(frame.nodeId) ? state.cursor : [...state.cursor, frame.nodeId]
          next.logs = pushLog(state.logs, frame.ts, 'info', `${frame.data?.title ?? frame.nodeId} 开始`)
          break
        }
        case 'node.exit': {
          const slot = state.nodes[frame.nodeId] ?? { nodeId: frame.nodeId }
          next.nodes = {
            ...state.nodes,
            [frame.nodeId]: {
              ...slot,
              status: frame.data?.status ?? 'succeeded',
              output: frame.data?.output ?? slot.output ?? null,
              error: frame.data?.error ?? null,
              branch: Array.isArray(frame.data?.ports) ? frame.data.ports.join(',') : slot.branch,
              endedAt: frame.ts,
            },
          }
          next.cursor = state.cursor.filter((id) => id !== frame.nodeId)
          if (frame.data?.error) next.logs = pushLog(state.logs, frame.ts, 'error', frame.data.error.message ?? '节点失败')
          break
        }
        case 'edge.traverse':
          next.traversals = { ...state.traversals, [frame.edgeId]: (state.traversals[frame.edgeId] ?? 0) + 1 }
          break
        case 'tool.call': {
          const slot = state.nodes[frame.nodeId] ?? { nodeId: frame.nodeId }
          const calls = [...(slot.toolCalls ?? []), { name: frame.data?.name ?? 'tool', status: 'running' }]
          next.nodes = { ...state.nodes, [frame.nodeId]: { ...slot, toolCalls: calls } }
          break
        }
        case 'tool.result': {
          const slot = state.nodes[frame.nodeId] ?? { nodeId: frame.nodeId }
          const calls = [...(slot.toolCalls ?? [])]
          for (let i = calls.length - 1; i >= 0; i -= 1) {
            if (calls[i].status === 'running') {
              calls[i] = { ...calls[i], status: frame.data?.isError ? 'error' : 'ok' }
              break
            }
          }
          next.nodes = { ...state.nodes, [frame.nodeId]: { ...slot, toolCalls: calls } }
          break
        }
        case 'checkpoint.ask':
          next.checkpoint = { nodeId: frame.nodeId, question: frame.data?.question ?? '', options: frame.data?.options ?? [] }
          break
        case 'checkpoint.answer':
          next.checkpoint = null
          break
        case 'log':
          next.logs = pushLog(state.logs, frame.ts, frame.data?.level ?? 'info', frame.data?.message ?? '')
          break
        case 'run.end': {
          next.status = frame.data?.status ?? 'succeeded'
          next.cursor = []
          next.checkpoint = null
          next.nodes = Object.fromEntries(Object.entries(state.nodes).map(([id, slot]) => [
            id,
            slot.status === 'pending' ? { ...slot, status: next.status === 'cancelled' ? 'cancelled' : 'skipped' } : slot,
          ]))
          break
        }
        default:
          break
      }
      return next
    }

    function pushLog(logs, ts, level, message) {
      const next = [...logs, { ts, level, message }]
      return next.length > 500 ? next.slice(next.length - 500) : next
    }

    function useRunStream(runId) {
      const [state, setState] = useState(emptyRunState)
      useEffect(() => {
        if (!runId) {
          setState(emptyRunState())
          return undefined
        }
        let closed = false
        let source = null
        setState(emptyRunState())
        const start = async () => {
          const snapshot = await api.run(runId, 0)
          if (closed) return
          let acc = emptyRunState()
          acc = { ...acc, runId, status: snapshot.run.status, nodes: snapshot.run.nodes ?? {}, cursor: snapshot.run.cursor ?? [] }
          for (const frame of snapshot.frames ?? []) acc = applyFrame(acc, frame)
          setState(acc)
          if (snapshot.run.status !== 'running') return
          source = new EventSource(`${API}/runs/${encodeURIComponent(runId)}/stream?since=${acc.lastSeq}`)
          source.addEventListener('frame', (event) => {
            try {
              const frame = JSON.parse(event.data)
              setState((prev) => applyFrame(prev, frame))
              if (frame.type === 'run.end' && source) {
                source.close()
              }
            } catch {
            }
          })
          source.addEventListener('error', () => {
          })
        }
        void start().catch((error) => {
          if (!closed) setState((prev) => ({ ...prev, status: 'error', logs: pushLog(prev.logs, Date.now(), 'error', error.message) }))
        })
        return () => {
          closed = true
          if (source) source.close()
        }
      }, [runId])
      return state
    }

