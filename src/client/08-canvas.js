/* @client-shard: 08-canvas */
                  (run.logs ?? []).slice(-80).map((line, index) => h('div', {
                    key: `${line.ts}-${index}`,
                    className: 'daf-log-line',
                    'data-level': line.level,
                  }, `${new Date(line.ts).toLocaleTimeString('zh-CN')} ${line.message}`))))
      ]
    }


    function CanvasTab(props) {
      const { ctx, sessionId } = props
      const t = dictFor(ctx)
      const [flows, setFlows] = useState([])
      const [current, setCurrent] = useState(null)
      const [dirty, setDirty] = useState(false)
      const [selectedId, setSelectedId] = useState(null)
      const [issues, setIssues] = useState([])
      const [error, setError] = useState(null)
      const [notice, setNotice] = useState(null)
      useEffect(() => {
        if (!notice) return undefined
        const timer = setTimeout(() => setNotice(null), 3000)
        return () => clearTimeout(timer)
      }, [notice])
      const [busy, setBusy] = useState(false)
      const [zoom, setZoom] = useState(1)
      const [compact, setCompact] = useState(false)
      const [runId, setRunId] = useState(null)
      const [paused, setPaused] = useState(false)
      const [connecting, setConnecting] = useState(null)
      const [pointerPos, setPointerPos] = useState(null)
      const [flowMenu, setFlowMenu] = useState(null)
      const [showArchived, setShowArchived] = useState(false)
      const showArchivedRef = useRef(false)
      showArchivedRef.current = showArchived
      const [flowDock, setFlowDock] = useState(false)
      const [moreOpen, setMoreOpen] = useState(false)
      // P0 节点搜索：稳定 ID 搜索，不改 IR/几何。
      const [searchQuery, setSearchQuery] = useState('')
      const [searchIndex, setSearchIndex] = useState(0)
      const searchInputRef = useRef(null)
      // P1 缩略图视口框：直接改 DOM，不触发重渲染。
      const thumbViewRef = useRef(null)
      // P3 动效预算：一个读者开关 + 一个运动预算。
      // 初始值跟随系统偏好，用户可在「更多」菜单里覆盖。
      const [motionOff, setMotionOff] = useState(() => {
        try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
      })
      // P3 大纲 + 树折叠：阶段可折叠，点击定位。
      const [outlineOpen, setOutlineOpen] = useState(false)
      const [collapsedPhases, setCollapsedPhases] = useState(() => new Set())
      // P3 导览：按顺序把相机依次送到每个节点。
      const [tourIndex, setTourIndex] = useState(-1)
      // 导览一站 = 一个阶段（含其子任务）；无阶段时按主干顺序逐节点。
      const tourStops = useMemo(() => {
        const nodes = current?.nodes ?? []
        const phases = nodes.filter((node) => node.kind === 'phase')
        if (phases.length > 0) {
          return phases.map((phase) => ({
            id: phase.id,
            title: phase.title,
            members: [phase.id, ...nodes.filter((node) => node.phaseId === phase.id).map((node) => node.id)],
          }))
        }
        const main = Array.isArray(current?.mainPath) && current.mainPath.length > 0
          ? current.mainPath
          : nodes.map((node) => node.id)
        return main.map((id) => ({ id, title: nodes.find((node) => node.id === id)?.title ?? id, members: [id] }))
      }, [current])

      // 把视口框到给定节点集合（导览的一站 / 阶段）
      const frameNodes = useCallback((ids) => {
        const el = surfaceRef.current
        const nodes = (current?.nodes ?? []).filter((node) => ids.includes(node.id))
        if (!el || nodes.length === 0) return
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        for (const node of nodes) {
          const rect = rectOfNode(node)
          minX = Math.min(minX, rect.x); minY = Math.min(minY, rect.y)
          maxX = Math.max(maxX, rect.x + rect.w); maxY = Math.max(maxY, rect.y + rect.h)
        }
        const PAD = 56
        const next = clampZoom(Math.min(
          (el.clientWidth - 24) / Math.max(1, maxX - minX + PAD * 2),
          (el.clientHeight - 24) / Math.max(1, maxY - minY + PAD * 2),
          1.6,
        ))
        setZoom(next)
        requestAnimationFrame(() => {
          el.scrollTo({
            left: Math.max(0, (minX - PAD) * next),
            top: Math.max(0, (minY - PAD) * next),
            behavior: 'smooth',
          })
        })
      }, [current])
      const [selectedEdgeId, setSelectedEdgeId] = useState(null)
      const [edgeMenu, setEdgeMenu] = useState(null)
      const [mermaidOpen, setMermaidOpen] = useState(false)
      const [mermaidText, setMermaidText] = useState('')
      // 反向组合：组合出的提示词与弹窗开关
      const [composeOpen, setComposeOpen] = useState(false)
      const [composeText, setComposeText] = useState('')
      const [composeWarnings, setComposeWarnings] = useState([])

      // 反向组合：把当前画布交给宿主序列化成提示词，再展示出来。
      const composeToPrompt = async () => {
        if (!current) return
        try {
          const result = await api.compose(current.id)
          setComposeText(result?.text ?? '')
          setComposeWarnings(Array.isArray(result?.warnings) ? result.warnings : [])
          setComposeOpen(true)
        } catch (problem) {
          setError(problem.message)
        }
      }

      const copyMermaid = async () => {
        if (!current) return
        try {
          const result = await api.mermaidExport(current.id)
          await navigator.clipboard.writeText(result?.mermaid ?? '')
          setNotice(t.mermaidCopied)
        } catch (problem) {
          setError(problem.message)
        }
      }

      const importMermaid = async () => {
        if (mermaidText.trim() === '') return
        setBusy(true)
        try {
          const result = await api.mermaidImport(mermaidText)
          await loadFlows(true)
          setCurrent(result.workflow)
          setSelectedId(result.workflow.nodes?.[0]?.id ?? null)
          setDirty(false)
          const skipped = (result.issues ?? []).length
          setNotice(skipped > 0 ? `${t.mermaidImported}（${skipped} 行跳过）` : t.mermaidImported)
          setMermaidOpen(false)
        } catch (problem) {
          setError(problem.message)
        } finally {
          setBusy(false)
        }
      }
      const [highContrast, setHighContrast] = useState(false)
      // 执行氛围（用户反馈②）：本会话 Agent 是否工作中。
      const [sessionBusy, setSessionBusy] = useState(false)
      const [showDevPanels, setShowDevPanels] = useState(false)
      const plan = usePlan(sessionId)
      const surfaceRef = useRef(null)
      const surfaceInnerRef = useRef(null)
      const lastConnectRef = useRef(0)
      const suppressEdgeClickRef = useRef(0)
      const sessionIdRef = useRef(sessionId)
      sessionIdRef.current = sessionId
      const [scrollFix, setScrollFix] = useState(null)
      const dragRef = useRef(null)
      const run = useRunStream(runId)

      useEffect(() => {
        activeRun.set({ runId, status: run.status, cursor: run.cursor })
      }, [runId, run.status, run.cursor])

      useEffect(() => {
        let closed = false
        void api.prefs().then((result) => {
          if (closed) return
          setHighContrast(result?.prefs?.highContrast === true)
          void loadDiagnostics().then((diag) => {
            setSessionBusy(diag?.sessionBusy?.[sessionId ?? ''] === true)
          }).catch(() => {})
          setShowDevPanels(result?.prefs?.showDevPanels === true)
          const savedZoom = Number(result?.prefs?.canvasZoom)
          if (Number.isFinite(savedZoom) && savedZoom > 0) setZoom(Math.min(2.5, Math.max(0.35, savedZoom)))
        }).catch(() => {})
        return () => {
          closed = true
        }
      }, [])

      useEffect(() => {
        const timer = setTimeout(() => {
          void api.savePrefs({ canvasZoom: zoom }).catch(() => {})
        }, 700)
        return () => clearTimeout(timer)
      }, [zoom])

      const toggleDevPanels = () => {
        setShowDevPanels((value) => {
          void api.savePrefs({ showDevPanels: !value }).catch(() => {})
          return !value
        })
      }

      const toggleContrast = async () => {
        const next = !highContrast
        setHighContrast(next)
        try {
          await api.savePrefs({ highContrast: next })
        } catch (problem) {
          setError(problem.message)
        }
      }

      const resolvePlanNow = async (action, withWorkflow) => {
        try {
          const workflow = withWorkflow && current && current.id === plan.workflowId ? current : undefined
          await resolvePlan(action, sessionId, workflow)
          setNotice(action === 'confirm' ? t.planConfirm : t.planSkip)
          setTimeout(() => setNotice(null), 1500)
        } catch (problem) {
          setError(problem.message)
        }
      }

      const loadPlanWorkflow = async () => {
        if (!plan.workflowId) return
        try {
          const full = await api.workflow(plan.workflowId)
          setCurrent(full.workflow)
          setSelectedId(full.workflow.nodes?.[0]?.id ?? null)
          setDirty(false)
        } catch (problem) {
          setError(problem.message)
        }
      }

      const clampZoom = (value) => Math.min(2.5, Math.max(0.35, Number(value.toFixed(3))))

      let boundsCache = { key: null, value: null }
      const contentBounds = () => {
        const nodes = current?.nodes ?? []
        if (boundsCache.key === nodes) return boundsCache.value
        if (nodes.length === 0) {
          boundsCache = { key: nodes, value: { x: 0, y: 0, w: 800, h: 600 } }
          return boundsCache.value
        }
        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxY = -Infinity
        for (const node of nodes) {
          minX = Math.min(minX, node.pos.x)
          minY = Math.min(minY, node.pos.y)
          maxX = Math.max(maxX, node.pos.x + NODE_WIDTH)
          maxY = Math.max(maxY, node.pos.y + NODE_HEIGHT)
        }
        const pad = 60
        boundsCache = {
          key: nodes,
          value: { x: minX - pad, y: minY - pad, w: Math.max(120, maxX - minX + pad * 2), h: Math.max(120, maxY - minY + pad * 2) },
        }
        return boundsCache.value
      }

      const fitToContent = useCallback(() => {
        const el = surfaceRef.current
        if (!el) return
        const bounds = contentBounds()
        const next = clampZoom(Math.min((el.clientWidth - 16) / bounds.w, (el.clientHeight - 16) / bounds.h, 1.6))
        setZoom(next)
        requestAnimationFrame(() => {
          el.scrollTo({ left: bounds.x * next, top: bounds.y * next, behavior: 'smooth' })
        })
      }, [current])

      // P0：搜索匹配（标题或类型，大小写不敏感；顺序稳定 = 节点数组顺序）
      const searchMatches = useMemo(() => {
        const q = searchQuery.trim().toLowerCase()
        if (q === '') return []
        return (current?.nodes ?? []).filter((node) => String(node.title).toLowerCase().includes(q)
          || String(node.kind).toLowerCase().includes(q))
      }, [current, searchQuery])
      const searchHitIds = useMemo(() => new Set(searchMatches.map((node) => node.id)), [searchMatches])

      // P0：命中后把节点滚到视口中央（视口坐标 = 内容坐标 * zoom）
      const focusNode = useCallback((nodeId) => {
        if (!nodeId) return
        setSelectedId(nodeId)
        const el = surfaceRef.current
        const node = (current?.nodes ?? []).find((item) => item.id === nodeId)
        if (!el || !node) return
        const left = (node.pos.x + NODE_WIDTH / 2) * zoom - el.clientWidth / 2
        const top = (node.pos.y + NODE_HEIGHT / 2) * zoom - el.clientHeight / 2
        el.scrollTo({ left: Math.max(0, left), top: Math.max(0, top), behavior: 'smooth' })
      }, [current, zoom])

      // 相机状态机：idle / panning / zooming / dragging。
      // 转移带守卫——拖节点时不平移、平移时不缩放抢占，避免多套手势互相打架。
      const [cameraState, setCameraState] = useState('idle')
      const cameraStateRef = useRef('idle')
      cameraStateRef.current = cameraState
      const cameraSeqRef = useRef(0)
      // 动画结束信号（onDone）：供导览等需要串接多段相机的功能使用
      const [zoomSettled, setZoomSettled] = useState(0)
      const zoomSettleTimer = useRef(0)
      const [spaceHeld, setSpaceHeld] = useState(false)
      const spaceHeldRef = useRef(false)
      spaceHeldRef.current = spaceHeld
      const beginCamera = useCallback((next) => {
        const now = cameraStateRef.current
        if (next === 'panning' && (now === 'dragging' || now === 'zooming')) return false
        if (next === 'dragging' && now === 'panning') return false
        if (next === 'zooming' && now === 'dragging') return false
        cameraSeqRef.current += 1
        setCameraState(next)
        return true
      }, [])
      const endCamera = useCallback((expect) => {
        if (expect && cameraStateRef.current !== expect) return
        setCameraState('idle')
      }, [])

      // 拖节点期间禁止平移：复用已有的连线拖拽状态作为 dragging 信号
      useEffect(() => {
        if (connecting) beginCamera('dragging')
        else endCamera('dragging')
      }, [connecting, beginCamera, endCamera])

      // 平移手势：空格 + 左键拖拽，或中键拖拽
      useEffect(() => {
        const el = surfaceRef.current
        if (!el) return undefined
        let panning = null
        const onDown = (event) => {
          const middle = event.button === 1
          const withSpace = spaceHeldRef.current && event.button === 0
          if (!middle && !withSpace) return
          if (!beginCamera('panning')) return
          event.preventDefault()
          panning = { x: event.clientX, y: event.clientY, left: el.scrollLeft, top: el.scrollTop }
          try { el.setPointerCapture(event.pointerId) } catch { /* 指针捕获失败不影响平移 */ }
        }
        const onMove = (event) => {
          if (!panning) return
          el.scrollLeft = panning.left - (event.clientX - panning.x)
          el.scrollTop = panning.top - (event.clientY - panning.y)
        }
        const onUp = () => { if (panning) { panning = null; endCamera('panning') } }
        el.addEventListener('pointerdown', onDown)
        el.addEventListener('pointermove', onMove)
        el.addEventListener('pointerup', onUp)
        el.addEventListener('pointercancel', onUp)
        return () => {
          el.removeEventListener('pointerdown', onDown)
          el.removeEventListener('pointermove', onMove)
          el.removeEventListener('pointerup', onUp)
          el.removeEventListener('pointercancel', onUp)
        }
      }, [current, beginCamera, endCamera])

      // 空格键：按住进入可平移状态（松手恢复）
      useEffect(() => {
        const onKeyDown = (event) => {
          if (event.code !== 'Space' || event.repeat) return
          const target = event.target
          const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
          if (typing) return
          event.preventDefault()
          setSpaceHeld(true)
        }
        const onKeyUp = (event) => { if (event.code === 'Space') setSpaceHeld(false) }
        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)
        return () => {
          window.removeEventListener('keydown', onKeyDown)
          window.removeEventListener('keyup', onKeyUp)
        }
      }, [])

      // P1 相机事务：所有缩放都围绕锚点补偿滚动，
      // smooth=true 时用浏览器平滑滚动（滚轮用瞬时，避免与连续手势打架）。
      const cameraZoom = useCallback((nextRaw, options) => {
        const el = surfaceRef.current
        const next = clampZoom(Number(nextRaw))
        if (!Number.isFinite(next)) return
        // 状态机准入：拖节点时不允许缩放；缩放可抢占上一段缩放。
        if (!beginCamera('zooming')) return
        window.clearTimeout(zoomSettleTimer.current)
        zoomSettleTimer.current = window.setTimeout(() => {
          endCamera('zooming')
          setZoomSettled((value) => value + 1)
        }, 240)
        setZoom((prev) => {
          if (next === prev) return prev
          const cx = options?.anchor?.x ?? (el ? el.clientWidth / 2 : 0)
          const cy = options?.anchor?.y ?? (el ? el.clientHeight / 2 : 0)
          if (el) setScrollFix({ prev, next, cx, cy, left: el.scrollLeft, top: el.scrollTop, smooth: options?.smooth === true })
          return next
        })
      }, [beginCamera, endCamera])

      // P0：Ctrl/Cmd+F 聚焦搜索框，Esc 清空
      useEffect(() => {
        const onKey = (event) => {
          if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
            event.preventDefault()
            searchInputRef.current?.focus()
            return
          }
          if (event.key === 'Escape' && String(searchQuery).length > 0) {
            setSearchQuery('')
            setSearchIndex(0)
          }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [searchQuery])

      useEffect(() => {
        const el = surfaceRef.current
        if (!el) return undefined
        const onWheel = (event) => {
          if (!(event.ctrlKey || event.metaKey)) return
          event.preventDefault()
          const rect = el.getBoundingClientRect()
          const cx = event.clientX - rect.left
          const cy = event.clientY - rect.top
          setZoom((prev) => {
            const next = clampZoom(prev * (event.deltaY < 0 ? 1.12 : 0.89))
            if (next !== prev) setScrollFix({ prev, next, cx, cy, left: el.scrollLeft, top: el.scrollTop })
            return next
          })
        }
        el.addEventListener('wheel', onWheel, { passive: false })
        return () => el.removeEventListener('wheel', onWheel)
      }, [current])

      // P1 视口框重绘：滚动/缩放时直接写 style，避免整棵画布重渲染。
      useEffect(() => {
        const el = surfaceRef.current
        const view = thumbViewRef.current
        if (!el || !view) return undefined
        let raf = 0
        const paint = () => {
          raf = 0
          const bounds = contentBounds()
          const scale = Math.min(124 / bounds.w, 84 / bounds.h)
          // 滚动量是缩放后坐标 → 除以 zoom 回到内容坐标
          view.style.left = (4 + (el.scrollLeft / zoom - bounds.x) * scale) + 'px'
          view.style.top = (4 + (el.scrollTop / zoom - bounds.y) * scale) + 'px'
          view.style.width = Math.max(6, (el.clientWidth / zoom) * scale) + 'px'
          view.style.height = Math.max(4, (el.clientHeight / zoom) * scale) + 'px'
        }
        paint()
        const onScroll = () => { if (!raf) raf = requestAnimationFrame(paint) }
        el.addEventListener('scroll', onScroll, { passive: true })
        return () => {
          el.removeEventListener('scroll', onScroll)
          if (raf) cancelAnimationFrame(raf)
        }
      }, [current, zoom])

      useEffect(() => {
        const el = surfaceRef.current
        if (!el || !scrollFix) return
        const scale = scrollFix.next / scrollFix.prev
        const left = (scrollFix.left + scrollFix.cx) * scale - scrollFix.cx
        const top = (scrollFix.top + scrollFix.cy) * scale - scrollFix.cy
        // 边界约束：不滚出内容区（浏览器自身会夹住上限，这里补下限与平滑）。
        const nextLeft = Math.max(0, left)
        const nextTop = Math.max(0, top)
        if (scrollFix.smooth === true) {
          el.scrollTo({ left: nextLeft, top: nextTop, behavior: 'smooth' })
        } else {
          el.scrollLeft = nextLeft
          el.scrollTop = nextTop
        }
        setScrollFix(null)
      }, [scrollFix])

      useEffect(() => {
        const onKey = (event) => {
          if (event.key === 'Escape' && connecting) {
            setConnecting(null)
            setPointerPos(null)
            return
          }
          if (!(event.ctrlKey || event.metaKey)) return
          if (event.key === '0') {
            event.preventDefault()
            fitToContent()
          } else if (event.key === '=' || event.key === '+') {
            event.preventDefault()
            cameraZoom(zoom * 1.15, { smooth: true })
          } else if (event.key === '-') {
            event.preventDefault()
            cameraZoom(zoom / 1.15, { smooth: true })
          } else if (event.key === '1') {
            event.preventDefault()
            fitToContent()
          } else if (event.key === '2') {
            event.preventDefault()
            const main = Array.isArray(current?.mainPath) ? current.mainPath : []
            if (main.length > 0) frameNodes(main)
          } else if (event.key === '3') {
            event.preventDefault()
            const stop = tourStops[tourIndex >= 0 ? tourIndex : 0]
            if (stop) frameNodes(stop.members)
          }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [connecting, fitToContent, cameraZoom, zoom, current, frameNodes, tourStops, tourIndex])

      useEffect(() => {
        if (!flowMenu) return undefined
        const close = () => setFlowMenu(null)
        window.addEventListener('mousedown', close)
        return () => window.removeEventListener('mousedown', close)
      }, [flowMenu])

      useEffect(() => {
        if (!moreOpen) return undefined
        const close = (event) => {
          const target = event.target
          if (target?.closest?.('.daf-more-menu') || target?.closest?.('[data-more-toggle]')) return
          setMoreOpen(false)
        }
        window.addEventListener('mousedown', close)
        return () => window.removeEventListener('mousedown', close)
      }, [moreOpen])

      // 流程管理的关闭交互由 RightDrawer 自带（遮罩点击 / Esc），无需额外的外部点击监听
      // ——旧监听豁免的是已删除的 .daf-flow-dock 类，会让抽屉内部点击也触发关闭（打开即关）。

      useEffect(() => {
        if (!edgeMenu) return undefined
        const close = () => setEdgeMenu(null)
        window.addEventListener('mousedown', close)
        return () => window.removeEventListener('mousedown', close)
      }, [edgeMenu])

      const listParam = () => (showArchivedRef.current ? 'all' : undefined)

      const archiveFlowById = async (flow) => {
        try {
          await api.archiveWorkflow(flow.id)
          if (current?.id === flow.id) await loadFlows(true)
          else await loadFlows(listParam())
        } catch (problem) {
          setError(problem.message)
        }
      }

      const restoreFlowById = async (flow) => {
        try {
          await api.restoreWorkflow(flow.id)
          await loadFlows(listParam())
        } catch (problem) {
          setError(problem.message)
        }
      }

      // 批量操作（一次请求）：完成后刷新列表；当前画布被删则清空选中
      const batchOperation = async (action, ids) => {
        try {
          await api.batchWorkflows(action, ids)
          if (action === 'delete' && current && ids.includes(current.id)) {
            setCurrent(null)
            setSelectedId(null)
          }
          setNotice(`${t.batchDone}: ${ids.length}`)
          const list = await api.workflows(showArchivedRef.current ? 'all' : undefined)
          setFlows(list)
        } catch (problem) {
          setError(problem.message)
        }
      }

      const duplicateFlow = async (flow) => {
        try {
          await api.createWorkflow(`${flow.name} ${t.duplicate}`, flow.id)
          await loadFlows(true)
        } catch (problem) {
          setError(problem.message)
        }
      }

      useEffect(() => {
        let closed = false
        const tick = async () => {
          try {
            const list = await api.workflows(showArchivedRef.current ? 'all' : undefined)
            if (closed) return
            const items = list.workflows ?? []
            failures = 0
            const signature = flowsSignature(items)
            setFlows((prev) => (flowsSignature(prev) === signature ? prev : items))
            if (dirty || run.status !== 'idle') return
            const sessionFlow = sessionId ? items.find((item) => item.sessionId === sessionId && !item.archivedAt) : undefined
            const mine = items.find((item) => item.id === current?.id)
            const target = sessionFlow && sessionFlow.id !== current?.id
              ? sessionFlow
              : mine && current && mine.updatedAt && mine.updatedAt !== current.updatedAt
                ? mine
                : null
            if (!target) return
            const full = await api.workflow(target.id)
            if (closed) return
            setCurrent(full.workflow)
            setSelectedId(full.workflow.nodes?.[0]?.id ?? null)
            setDirty(false)
          } catch {
            failures += 1
          }
        }
        let failures = 0
        let timer = null
        const loop = async () => {
          await tick()
          if (!closed) timer = setTimeout(loop, pollDelay(4000, failures))
        }
        void loop()
        return () => {
          closed = true
          if (timer) clearTimeout(timer)
        }
      }, [current?.id, current?.updatedAt, dirty, run.status, sessionId])

      const lastPlanWorkflowRef = useRef(null)
      useEffect(() => {
        if (plan.status !== 'awaiting' || !plan.workflowId) return
        if (lastPlanWorkflowRef.current === plan.workflowId) return
        if (dirty) return
        lastPlanWorkflowRef.current = plan.workflowId
        void loadPlanWorkflow()
      }, [plan.status, plan.workflowId, dirty])

      const loadFlows = useCallback(async (keepCurrent) => {
        try {
          const list = await api.workflows(showArchivedRef.current ? 'all' : undefined)
          const items = list.workflows ?? []
          setFlows(items)
          if (!keepCurrent && items.length > 0) {
            const active = sessionIdRef.current
            const preferred = (active ? items.find((item) => item.sessionId === active && !item.archivedAt) : undefined) ?? items[0]
            const full = await api.workflow(preferred.id)
            setCurrent(full.workflow)
            setSelectedId(full.workflow.nodes?.[0]?.id ?? null)
            setDirty(false)
            setIssues([])
            setError(null)
          }
        } catch (problem) {
          setError(problem.message)
        }
      }, [])

      useEffect(() => {
        void loadFlows(false)
      }, [loadFlows])

      const pickFlow = async (id) => {
        if (dirty && !window.confirm(t.confirmDiscard)) return
        try {
          const full = await api.workflow(id)
          setCurrent(full.workflow)
          setSelectedId(full.workflow.nodes?.[0]?.id ?? null)
          setDirty(false)
          setIssues([])
          setError(null)
          setRunId(null)
        } catch (problem) {
          setError(problem.message)
        }
      }

      const mutate = useCallback((mutator) => {
        setCurrent((prev) => {
          if (!prev) return prev
          const next = mutator(clone(prev))
          return next
        })
        setDirty(true)
      }, [])

      const applyLayout = (value) => {
        mutate((wf) => layoutWorkflow(wf, value))
        setNotice(`${t.layout}: ${t[`layout_${value}`] ?? value}`)
      }

      const pinnedCount = (current?.nodes ?? []).filter((node) => node.pos?.pinned === true).length

      const nextLayoutName = () => {
        const order = ['chain', 'tb', 'star', 'radial']
        const now = current?.layout ?? 'chain'
        return order[(order.indexOf(now) + 1) % order.length]
      }

      const relayoutPlan = async () => {
        if (!current || (plan.workflowId && current.id !== plan.workflowId)) await loadPlanWorkflow()
        applyLayout(nextLayoutName())
      }

      const lastSnapshotRef = useRef(null)
      const [diff, setDiff] = useState(null)
      useEffect(() => {
        if (!current) return undefined
        const snapshot = {
          turn: current.turn ?? 0,
          nodes: new Map(current.nodes.map((node) => [node.id, { x: node.pos?.x ?? 0, y: node.pos?.y ?? 0, title: node.title }])),
        }
        const previous = lastSnapshotRef.current
        lastSnapshotRef.current = snapshot
        if (!previous || previous.turn === snapshot.turn) return undefined
        setCurrent((prev) => (prev && prev.turn === snapshot.turn ? layoutWorkflow(prev, prev.layout ?? 'chain') : prev))
        const added = new Set()
        const moved = new Set()
        const removed = []
        for (const [id, node] of snapshot.nodes) {
          const before = previous.nodes.get(id)
          if (!before) {
            added.add(id)
            continue
          }
          if (Math.abs(before.x - node.x) > 8 || Math.abs(before.y - node.y) > 8) moved.add(id)
        }
        for (const [id, node] of previous.nodes) {
          if (!snapshot.nodes.has(id)) removed.push({ id, title: node.title, x: node.x, y: node.y })
        }
        if (added.size === 0 && moved.size === 0 && removed.length === 0) return undefined
        setDiff({ added, moved, removed, turn: snapshot.turn })
        const timer = setTimeout(() => setDiff(null), 6000)
        return () => clearTimeout(timer)
      }, [current?.id, current?.turn])

      const createFlow = async () => {
        setBusy(true)
        try {
          const created = await api.createWorkflow()
          await loadFlows(true)
          setCurrent(created.workflow)
          setSelectedId(created.workflow.nodes?.[0]?.id ?? null)
          setDirty(false)
          setIssues([])
        } catch (problem) {
          setError(problem.message)
        } finally {
          setBusy(false)
        }
      }

      const saveFlow = async () => {
        if (!current) return
        setBusy(true)
        try {
          await api.saveWorkflow(current.id, current)
          setDirty(false)
          setNotice(t.saved)
          setTimeout(() => setNotice(null), 1800)
          await loadFlows(true)
        } catch (problem) {
          setError(problem.message)
        } finally {
          setBusy(false)
        }
      }

      const archiveCurrent = async () => {
        if (!current) return
        try {
          await api.archiveWorkflow(current.id)
          await loadFlows(true)
        } catch (problem) {
          setError(problem.message)
        }
      }

      const deleteCurrent = () => {
        if (!current) return
        if (current.archivedAt) {
          setPurgePendingId(current.id)
          setFlowDock(true)
          return
        }
        void (async () => {
          try {
            await api.archiveWorkflow(current.id)
            setNotice(t.archivedNotice)
            await loadFlows(listParam())
          } catch (problem) {
            setError(problem.message)
          }
        })()
      }

      const [purgePendingId, setPurgePendingId] = useState(null)
      const flowsRef = useRef(flows)
      flowsRef.current = flows

      const requestPurge = (flow) => {
        setPurgePendingId(flow.id)
      }

      const purgeFlowNow = async (flow) => {
        try {
          await api.deleteWorkflow(flow.id)
          if (current?.id === flow.id) {
            setCurrent(null)
            setSelectedId(null)
            setRunId(null)
          }
          await loadFlows(listParam())
        } catch (problem) {
          setError(problem.message)
        }
      }

      useEffect(() => {
        if (!purgePendingId) return undefined
        const timer = setTimeout(() => {
          const flow = (flowsRef.current ?? []).find((item) => item.id === purgePendingId)
          setPurgePendingId(null)
          if (flow) void purgeFlowNow(flow)
        }, 3000)
        return () => clearTimeout(timer)
      }, [purgePendingId])


      const activeFlowCount = flows.filter((item) => !item.archivedAt).length

      const sideAbbr = (side) => String(side)
        .replace('top-right', 'TR').replace('top-left', 'TL')
        .replace('bottom-right', 'BR').replace('bottom-left', 'BL')
        .replace('-q1', '1').replace('-q3', '3')
        .replace('top', 'T').replace('bottom', 'B').replace('right', 'R').replace('left', 'L')
      const selectedEdge = selectedEdgeId ? (current?.edges ?? []).find((item) => item.id === selectedEdgeId) : null
      const selectedEdgeView = (() => {
        if (!selectedEdge) return null
        const fromNode = nodesById.get(selectedEdge.from)
        const toNode = nodesById.get(selectedEdge.to)
        if (!fromNode || !toNode) return null
        const mid = edgeMidpoint(rectOfNode(fromNode), rectOfNode(toNode), selectedEdge)
        const sides = ['right', 'left', 'top', 'bottom', 'top-right', 'top-left', 'bottom-right', 'bottom-left', 'right-q1', 'right-q3', 'left-q1', 'left-q3', 'top-q1', 'top-q3', 'bottom-q1', 'bottom-q3']
        const sideRow = (which) => h('div', { className: 'daf-edge-editor-row' },
          h('span', { className: 'daf-muted' }, which === 'from' ? t.edgeFrom : t.edgeTo),
          sides.map((side) => {
            const active = (which === 'from' ? selectedEdge.fromSide : selectedEdge.toSide) ?? (which === 'from' ? 'right' : 'left')
            return h('button', {
              key: side,
              type: 'button',
              className: `daf-anchor-pick${active === side ? ' is-on' : ''}`,
              title: side,
              onClick: () => mutate((wf) => {
                const target = wf.edges.find((item) => item.id === selectedEdge.id)
                if (target) {
                  delete target.customPath
                  if (which === 'from') target.fromSide = side
                  else target.toSide = side
                }
                return wf
              }),
            }, sideAbbr(side))
          }))
        return h('div', { className: 'daf-edge-editor daf-glass', style: { left: mid.x + 12, top: mid.y - 24 } },
          h('div', { className: 'daf-muted' }, `${fromNode.title} → ${toNode.title}`),
          sideRow('from'),
          sideRow('to'),
          h(Btn, { onClick: () => setSelectedEdgeId(null) }, t.cancel))
      })()

      const edgeMenuView = edgeMenu
        ? h('div', { className: 'daf-flow-menu', style: { position: 'fixed', left: edgeMenu.x, top: edgeMenu.y, zIndex: 60 } },
            h(Btn, { onClick: () => { setSelectedEdgeId(edgeMenu.id); setEdgeMenu(null) } }, t.edgeAnchors),
            h(Btn, { onClick: () => { mutate((wf) => { const target = wf.edges.find((item) => item.id === edgeMenu.id); if (target) delete target.customPath; return wf }); setEdgeMenu(null) } }, t.edgeStraight),
            h(Btn, { onClick: () => { mutate((wf) => { const target = wf.edges.find((item) => item.id === edgeMenu.id); if (target) target.color = ((Number.isFinite(Number(target.color)) ? Number(target.color) : -1) + 1) % EDGE_PALETTE_SIZE; return wf }); setEdgeMenu(null) } }, t.edgeColor),
            h(Btn, { variant: 'danger', onClick: () => { mutate((wf) => { wf.edges = wf.edges.filter((item) => item.id !== edgeMenu.id); return wf }); setEdgeMenu(null) } }, t.deleteEdge))
        : null

      const [experiences, setExperiences] = useState([])
      const loadExperiences = async () => {
        try {
          const result = await api.experiences(props.workspaceId, sessionCwd(ctx, sessionId, props))
          setExperiences(result?.experiences ?? [])
        } catch {
          setExperiences([])
        }
      }
      useEffect(() => {
        if (plan.status !== 'awaiting') {
          setExperiences([])
          return undefined
        }
        void loadExperiences()
        return undefined
      }, [plan.status])

      const saveExperience = async () => {
        if (!current) return
        setBusy(true)
        try {
          await api.saveExperience({
            workspaceId: props.workspaceId,
            cwd: sessionCwd(ctx, sessionId, props),
            title: current.name,
            workflowJson: current,
            turn: plan.turn,
          })
          setNotice(t.experienceSaved)
          await loadExperiences()
        } catch (problem) {
          setError(problem.message)
        } finally {
          setBusy(false)
        }
      }

      const adoptExperience = async (experience) => {
        setBusy(true)
        try {
          await api.adoptExperience(experience.id)
          if (plan.workflowId && experience.workflowJson) {
            await api.saveWorkflow(plan.workflowId, {
              ...experience.workflowJson,
              id: plan.workflowId,
              sessionId: sessionIdRef.current,
              turn: plan.turn,
            })
          }
          setNotice(`${t.experienceAdopted}: ${experience.title}`)
          await loadPlanWorkflow()
          await loadExperiences()
        } catch (problem) {
          setError(problem.message)
        } finally {
          setBusy(false)
        }
      }

      const experienceCards = (plan.status === 'awaiting' && experiences.length > 0)
        ? h('div', { className: 'daf-exp-cards' },
            h('div', { className: 'daf-muted' }, t.experienceLead),
            experiences.slice(0, 6).map((experience) => h('button', {
              key: experience.id,
              type: 'button',
              className: 'daf-exp-card',
              title: `${t.experienceAdopted} · ${t.turnLabel} ${experience.turn ?? 0}`,
              onClick: () => void adoptExperience(experience),
            },
              h('span', { className: 'daf-exp-card-title' }, experience.title),
              h('span', { className: 'daf-muted' }, `×${experience.adoptions ?? 0}`))))
        : null

      // P2：SVG 文本 + 尺寸（纯函数，供 SVG / PNG 两种导出复用）
      const buildFlowSvg = () => {
        if (!current) return null
        const PAD = 40
        const W = 220, H = 96
        let bx = Infinity, by = Infinity, br = 0, bb = 0
        for (const n of current.nodes) {
          bx = Math.min(bx, n.pos.x); by = Math.min(by, n.pos.y)
          br = Math.max(br, n.pos.x + W); bb = Math.max(bb, n.pos.y + H)
        }
        const w = br - bx + PAD * 2, h = bb - by + PAD * 2
        const ox = PAD - bx, oy = PAD - by
        const esc = (s) => String(s).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>')
        let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '">'
        svg += '<rect width="100%" height="100%" fill="' + EXPORT_BACKGROUND + '"/>'
        svg += '<defs><marker id="arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#666"/></marker></defs>'
        for (const e of current.edges) {
          const from = current.nodes.find((n) => n.id === e.from)
          const to = current.nodes.find((n) => n.id === e.to)
          if (!from || !to) continue
          const x1 = ox + from.pos.x + W / 2, y1 = oy + from.pos.y + H / 2
          const x2 = ox + to.pos.x + W / 2, y2 = oy + to.pos.y + H / 2
          svg += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#999" stroke-width="1.5" marker-end="url(#arrow)"/>'
        }
        for (const n of current.nodes) {
          const nx = ox + n.pos.x, ny = oy + n.pos.y
          svg += '<rect x="' + nx + '" y="' + ny + '" width="' + W + '" height="' + H + '" rx="8" fill="#f8f9fa" stroke="#ccc"/>'
          svg += '<text x="' + (nx + 10) + '" y="' + (ny + 20) + '" font-size="12" fill="#333">' + esc(n.title) + '</text>'
          svg += '<text x="' + (nx + 10) + '" y="' + (ny + 36) + '" font-size="10" fill="#999">' + esc(n.kind) + '</text>'
        }
        svg += '</svg>'
        return { svg, w, h }
      }

      const downloadBlob = (blob, name) => {
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = name
        link.click()
        URL.revokeObjectURL(link.href)
      }

      const exportSvg = () => {
        const built = buildFlowSvg()
        if (!built) return
        downloadBlob(new Blob([built.svg], { type: 'image/svg+xml' }), (current?.name || 'flow') + '.svg')
        setNotice(t.exportSvg + ' ✓')
      }

      // P2 4× 栅格导出（吸收该机制的无依赖技巧：把 SVG 的 width/height 放大 4 倍，
      // 浏览器按该分辨率原生栅格化矢量，drawImage 再画到 Canvas——不需要任何第三方库。）
      const exportPng = async () => {
        const built = buildFlowSvg()
        if (!built) return
        const SCALE = 4
        const head = '<svg xmlns="http://www.w3.org/2000/svg" width="' + built.w + '" height="' + built.h + '"'
        const sharp = built.svg.replace(head,
          '<svg xmlns="http://www.w3.org/2000/svg" width="' + (built.w * SCALE) + '" height="' + (built.h * SCALE) + '"')
        const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sharp)
        try {
          const image = new Image()
          await new Promise((resolve, reject) => {
            image.onload = resolve
            image.onerror = reject
            image.src = url
          })
          const canvas = document.createElement('canvas')
          canvas.width = Math.round(built.w * SCALE)
          canvas.height = Math.round(built.h * SCALE)
          const context = canvas.getContext('2d')
          context.fillStyle = EXPORT_BACKGROUND
          context.fillRect(0, 0, canvas.width, canvas.height)
          context.drawImage(image, 0, 0, canvas.width, canvas.height)
          const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
          if (!blob) return
          downloadBlob(blob, (current?.name || 'flow') + '.png')
          setNotice(t.exportPng + ' ✓')
        } catch (problem) {
          setError(problem instanceof Error ? problem.message : String(problem))
        }
      }

      // 流程管理：贴屏右侧、与画布等高的抽屉（与 Mermaid 导入一致的交互与动效）。
      const flowDockView = flowDock
        ? h(RightDrawer, { title: t.flowDock, onClose: () => setFlowDock(false) },
            h(FlowManager, {
              flows, current, sessionId, t, h, Icon, Btn,
              pickFlow, duplicateFlow, restoreFlowById, archiveFlowById, requestPurge,
              flowMenu, setFlowMenu, purgePendingId, setPurgePendingId,
              showArchived, setShowArchived, batchOperation,
            }))
        : null

      const moreMenu = h('div', { className: 'daf-flow-menu daf-more-menu' },
        h(Btn, { onClick: () => { setMoreOpen(false); void validate() }, disabled: busy || !current }, h(Icon, { name: 'check', size: 12 }), t.validate),
        h(Btn, { onClick: () => { setMoreOpen(false); if (current) mutate((wf) => autoLayout(wf)) }, disabled: !current, title: t.layoutPinned }, h(Icon, { name: 'refresh', size: 12 }), t.autoLayout),
        h('div', { className: 'daf-more-group', role: 'group', 'aria-label': t.layout },
          ['chain', 'tb', 'star', 'radial'].map((value) => h('button', {
            key: value,
            type: 'button',
            className: `daf-layout-btn${(current?.layout ?? 'chain') === value ? ' is-on' : ''}`,
            title: `${t.layout}: ${t[`layout_${value}`] ?? value}`,
            disabled: !current,
            className: `daf-layout-btn daf-tip${(current?.layout ?? 'chain') === value ? ' is-on' : ''}`,
            'data-tip': `${t.layout}: ${t[`layout_${value}`] ?? value}`,
            onClick: () => applyLayout(value),
          }, t[`layout_${value}`] ?? value))),
        h(Btn, { onClick: () => { setMoreOpen(false); void copyMermaid() }, disabled: !current }, t.mermaidCopy),
        h(Btn, { onClick: () => void exportSvg(), disabled: !current, title: t.exportSvg }, t.exportSvg),
        h(Btn, { onClick: () => void exportPng(), disabled: !current, title: t.exportPng }, t.exportPng),
        h(Btn, { onClick: () => void composeToPrompt(), disabled: !current, title: t.composeHint }, t.compose),
        h(Btn, {
          onClick: () => setMotionOff((value) => !value),
          title: t.motionHint,
          'aria-pressed': String(motionOff),
          className: motionOff ? 'daf-btn-dev is-on' : 'daf-btn-dev',
        }, t.motion + ' · ' + (motionOff ? t.off : t.on)),
        h(Btn, { onClick: () => setOutlineOpen((value) => !value), 'aria-pressed': String(outlineOpen), title: t.outline }, t.outline),
        h(Btn, { onClick: () => tourGo(tourIndex >= 0 ? -1 : 0), disabled: !current, 'aria-pressed': String(tourIndex >= 0), title: t.tourHint }, t.tour),
        h(Btn, { onClick: () => { setMoreOpen(false); setMermaidText(''); setMermaidOpen(true) } }, t.mermaidImport),
        h(Btn, { onClick: () => setCompact((value) => !value) }, `${t.compact}: ${compact ? t.on : t.off}`),
        h(Btn, { onClick: toggleContrast }, `${t.contrast}: ${highContrast ? t.on : t.off}`))

      const validate = async () => {
        if (!current) return
        setBusy(true)
        try {
          if (dirty) await api.saveWorkflow(current.id, current)
          const result = await api.validate(current.id, sessionId)
          // 路由探针与宿主校验合并：宿主查结构/端口，客户端查实际路径质量。
          const merged = [...(result.issues ?? []), ...probeRoutes()]
          setIssues(merged)
          if (!showDevPanels) {
            const errs = merged.filter((issue) => issue.level === 'error').length
            const warns = merged.length - errs
            // finalize 门禁：0 错误 = 可运行
            setNotice(errs === 0 ? `✓ ${t.validate} · ${t.validateRunnable}（${warns} W）` : `${t.validate}: ${errs} E / ${warns} W`)
          }
          setDirty(false)
        } catch (problem) {
          setError(problem.message)
        } finally {
          setBusy(false)
        }
      }

      const startRun = async () => {
        if (!current) return
        setBusy(true)
        try {
          if (dirty) await api.saveWorkflow(current.id, current)
          const result = await api.startRun(current.id, sessionId, current.vars ?? {}, props.workspaceId)
          setRunId(result.runId)
          setPaused(false)
          setDirty(false)
        } catch (problem) {
          setError(problem.message)
        } finally {
          setBusy(false)
        }
      }

      const control = async (action, extra) => {
        if (!runId) return
        try {
          await api.control(runId, action, extra)
          if (action === 'pause') setPaused(true)
          if (action === 'resume' || action === 'cancel') setPaused(false)
        } catch (problem) {
          setError(problem.message)
        }
      }

      useEffect(() => {
        const onMove = (event) => {
          const drag = dragRef.current
          if (!drag) return
          const dx = (event.clientX - drag.px) / drag.zoom
          const dy = (event.clientY - drag.py) / drag.zoom
          setCurrent((prev) => {
            if (!prev) return prev
            const node = prev.nodes.find((item) => item.id === drag.id)
            if (!node) return prev
            return { ...prev, nodes: prev.nodes.map((item) => (item.id === drag.id ? { ...item, pos: { ...item.pos, x: Math.max(0, Math.round(drag.x + dx)), y: Math.max(0, Math.round(drag.y + dy)), pinned: true } } : item)) }
          })
          setDirty(true)
        }
        const onUp = () => {
          suppressEdgeClickRef.current = Date.now()
          dragRef.current = null
        }
        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
        return () => {
          window.removeEventListener('pointermove', onMove)
          window.removeEventListener('pointerup', onUp)
        }
      }, [])

      const nodesById = useMemo(() => {
        const map = new Map()
        for (const node of current?.nodes ?? []) map.set(node.id, node)
        return map
      }, [current])

      const selected = selectedId ? nodesById.get(selectedId) : null

      const nodeStatusMap = current?.nodeStatus ?? {}
      // 主干：两端都在主干上的边是脊椎，视觉加粗；其余为支线。
      const mainPathSet = new Set(Array.isArray(current?.mainPath) ? current.mainPath : [])
      const statusOf = (id) => nodeStatusMap[id]
        ?? run.nodes?.[id]?.status
        ?? (run.status === 'idle' ? 'idle' : 'pending')

      const edgeState = (edge) => {
        if (run.status === 'idle' && !Object.keys(nodeStatusMap).length) return 'idle'
        if (nodeStatusMap[edge.from] === 'succeeded' && nodeStatusMap[edge.to] === 'running') return 'active'
        if (nodeStatusMap[edge.from] === 'succeeded') return 'done'
        if (nodeStatusMap[edge.from] === 'failed') return 'dead'
        const source = run.nodes?.[edge.from]
        if ((run.traversals?.[edge.id] ?? 0) > 0) {
          return statusOf(edge.from) === 'succeeded' ? 'done' : 'active'
        }
        if (source && ['succeeded', 'skipped', 'failed', 'cancelled'].includes(source.status)) return 'dead'
        return 'idle'
      }

      const steps = useMemo(() => orderByLayer(current).filter((node) => !node.parentId), [current])
      const checkpoint = run.checkpoint

      const childCountOf = (id) => (current?.nodes ?? []).filter((node) => node.parentId === id).length
      const rectOfNode = (node) => rectOf(node, childCountOf(node.id))
      const childrenOf = (id) => (current?.nodes ?? [])
        .filter((node) => node.parentId === id)
        .sort((a, b) => (Number(a.pos?.y) || 0) - (Number(b.pos?.y) || 0))

      const completeConnection = (targetId, pointer, targetSide = null) => {
        if (!connecting || connecting.nodeId === targetId) return
        lastConnectRef.current = Date.now()
        const source = nodesById.get(connecting.nodeId)
        const target = nodesById.get(targetId)
        if (!source || !target) return
        if (target.kind === 'group.steps' && !source.parentId) {
          mutate((wf) => {
            wf.nodes = wf.nodes.map((item) => (item.id === source.id ? { ...item, parentId: target.id } : item))
            return wf
          })
          setConnecting(null)
          setPointerPos(null)
          return
        }
        const fromRect = rectOfNode(source)
        const toRect = rectOfNode(target)
        const dx = (toRect.x + toRect.w / 2) - (fromRect.x + fromRect.w / 2)
        const dy = (toRect.y + toRect.h / 2) - (fromRect.y + fromRect.h / 2)
        let baseFrom
        let baseTo
        if (Math.abs(dx) >= Math.abs(dy)) {
          baseFrom = dx >= 0 ? 'right' : 'left'
          baseTo = dx >= 0 ? 'left' : 'right'
        } else {
          baseFrom = dy >= 0 ? 'bottom' : 'top'
          baseTo = dy >= 0 ? 'top' : 'bottom'
        }
        const grabbed = connecting.side && EDGE_SIDES.includes(connecting.side) ? connecting.side : null
        const fromSide = grabbed && FACE_OF(grabbed) === FACE_OF(baseFrom) ? grabbed : baseFrom
        // 落点锚点由吸附结果显式给出；没有给出时（内部调用）退回按方向选面。
        const toSide = targetSide && EDGE_SIDES.includes(targetSide) ? targetSide : baseTo
        const fromPort = connecting.port ?? 'out'
        mutate((wf) => {
          const exists = wf.edges.some((edge) => edge.from === connecting.nodeId && edge.fromPort === fromPort && edge.to === targetId)
          if (!exists) {
            const used = new Set(wf.edges.map((edge) => Number(edge.color)).filter((value) => Number.isFinite(value)))
            let color = 0
            while (used.has(color) && color < EDGE_PALETTE_SIZE - 1) color += 1
            const aFrom = anchorPoint(rectOfNode(source), fromSide)
            const reach = Math.max(40, Math.min(160, Math.hypot((pointer?.x ?? aFrom.x) - aFrom.x, (pointer?.y ?? aFrom.y) - aFrom.y) * 0.45))
            const controlOf = (point, direction) => {
              if (direction === 'right') return { x: point.x + reach, y: point.y }
              if (direction === 'left') return { x: point.x - reach, y: point.y }
              if (direction === 'up') return { x: point.x, y: point.y - reach }
              return { x: point.x, y: point.y + reach }
            }
            const bTarget = anchorPoint(rectOfNode(target), toSide)
            wf.edges.push({
              id: `e_${connecting.nodeId}_${targetId}_${Math.random().toString(36).slice(2, 6)}`,
              from: connecting.nodeId,
              fromPort,
              to: targetId,
              fromSide,
              toSide,
              color,
              customPath: pointer ? { c1: controlOf(aFrom, fromSide), c2: controlOf(bTarget, toSide) } : undefined,
            })
          }
          return wf
        })
        setConnecting(null)
        setPointerPos(null)
      }

      const addChild = (parentId) => {
        const parent = nodesById.get(parentId)
        if (!parent) return
        const siblings = childrenOf(parentId)
        const id = `n_${Math.random().toString(36).slice(2, 8)}`
        mutate((wf) => {
          wf.nodes.push({
            id,
            kind: 'agent.task',
            title: `${parent.title} · ${String.fromCharCode(97 + Math.min(25, siblings.length))}`,
            pos: { x: parent.pos.x + NODE_WIDTH + 70, y: parent.pos.y + siblings.length * 108 },
            params: { target: 'session', prompt: '', waitForIdle: false },
            onError: 'fail',
            parentId,
          })
          return wf
        })
        setSelectedId(id)
      }

      const autoColors = useMemo(() => {
        const used = new Set((current?.edges ?? []).map((item) => Number(item.color)).filter((value) => Number.isFinite(value)))
        const map = new Map()
        for (const edge of current?.edges ?? []) {
          if (Number.isFinite(Number(edge.color))) continue
          let color = 0
          while (used.has(color) && color < EDGE_PALETTE_SIZE - 1) color += 1
          used.add(color)
          map.set(edge.id, color)
        }
        return map
      }, [current])
      const fromLaneSeen = new Map()
      const toLaneSeen = new Map()
      const fromLaneTotal = new Map()
      const toLaneTotal = new Map()
      for (const edge of current?.edges ?? []) {
        const fk = `${edge.from}|${edge.fromSide ?? 'right'}`
        const tk = `${edge.to}|${edge.toSide ?? 'left'}`
        fromLaneTotal.set(fk, (fromLaneTotal.get(fk) ?? 0) + 1)
        toLaneTotal.set(tk, (toLaneTotal.get(tk) ?? 0) + 1)
      }
      const flowsSignature = (items) => (items ?? [])
        .map((item) => `${item.id}:${item.updatedAt ?? ''}:${item.nodes ?? 0}:${item.archivedAt ?? ''}:${item.turn ?? 0}`)
        .join('|')

      const allRects = (current?.nodes ?? []).map((node) => ({ id: node.id, rect: rectOfNode(node) }))
      // 空间网格每次渲染建一次（O(N)），代替原来逐边 O(E×N) 的障碍数组构建。
      const obstacleGrid = createSpatialGrid(160)
      for (const item of allRects) obstacleGrid.insert(item.rect, item)
      // 路由结果缓存（key=edge.id，current 换代即弃）：节点多时每渲染重跑几百次
      // Dijkstra 是连线高频卡顿/闪烁的直接来源；命中直接复用 d，节点挪动后
      // mutate 产生新 current，缓存自然失效重算。
      // 标号定位（修复漂移）：不再用数学近似（edgeMidpoint 与实际折线/贝塞尔脱节），
      // 渲染后对每条可见路径调 getPointAtLength(len/2) 取**真实线上的中点**。
      // 路由缓存（key=edge.id，current 换代即弃）：节点多时不再每渲染重跑 Dijkstra
      const routeCacheRef = useRef(null)
      const edgePathEls = useRef(new Map())
      const [edgeMids, setEdgeMids] = useState(() => new Map())
      useEffect(() => {
        const next = new Map()
        for (const [edgeId, el] of edgePathEls.current) {
          try {
            const len = el.getTotalLength()
            if (len > 0) {
              const point = el.getPointAtLength(len / 2)
              next.set(edgeId, { x: point.x, y: point.y })
            }
          } catch { /* 路径不可测（隐藏/无 d）时保留旧值 */ }
        }
        setEdgeMids((prev) => {
          if (prev.size === next.size && [...next.entries()].every(([id, point]) => {
            const old = prev.get(id)
            return old && Math.abs(old.x - point.x) < 0.5 && Math.abs(old.y - point.y) < 0.5
          })) return prev
          return next
        })
      }, [current, zoom])
      if (routeCacheRef.current?.for !== current) routeCacheRef.current = { for: current, map: new Map() }
      const routeCache = routeCacheRef.current.map
      const edgeDCached = (fromRect, toRect, edge, oA, oB) => {
        const hit = routeCache.get(edge.id)
        if (typeof hit === 'string') return hit
        const d = edgeDCached(fromRect, toRect, edge, oA, oB)
        routeCache.set(edge.id, d)
        return d
      }

      // 路由探针：把每条边**实际算出**的路径解析成折线，
      // 检查结构性问题。放在客户端做，避免把路由器在宿主侧再实现一遍（两处实现必然漂移）。
      // 结果并入 issues，由校验按钮与开发者面板统一展示。
      const parsePathPoints = (d) => {
        const points = []
        const re = /[ML]\s*(-?[\d.]+)\s+(-?[\d.]+)/g
        let m
        while ((m = re.exec(String(d ?? ''))) !== null) points.push({ x: Number(m[1]), y: Number(m[2]) })
        return points
      }
      const segmentsCross = (p1, p2, p3, p4) => {
        const dir = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
        const d1 = dir(p3, p4, p1), d2 = dir(p3, p4, p2), d3 = dir(p1, p2, p3), d4 = dir(p1, p2, p4)
        return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
      }
      const probeRoutes = () => {
        const nodes = current?.nodes ?? []
        const byId = new Map(nodes.map((node) => [node.id, node]))
        const issues = []
        const traced = []
        const anchorCount = new Map()
        for (const edge of current?.edges ?? []) {
          const from = byId.get(edge.from)
          const to = byId.get(edge.to)
          if (!from || !to) continue
          const fromSide = edge.fromSide && EDGE_SIDES.includes(edge.fromSide) ? edge.fromSide : 'right'
          const toSide = edge.toSide && EDGE_SIDES.includes(edge.toSide) ? edge.toSide : 'left'
          const d = edgePath(rectOfNode(from), rectOfNode(to), edge, obstacleGrid, 0, 0)
          const points = parsePathPoints(d)
          if (points.length < 2) continue
          traced.push({ edge, points })
          const key = edge.from + '|' + fromSide
          anchorCount.set(key, (anchorCount.get(key) ?? 0) + 1)
          const head = points[0]
          const tail = points[points.length - 1]
          const straight = Math.hypot(tail.x - head.x, tail.y - head.y) || 1
          let polyline = 0
          for (let i = 1; i < points.length; i += 1) polyline += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
          if (polyline / straight > 2.5) {
            issues.push({ level: 'warning', code: 'route-detour', message: `连线绕行过长（${(polyline / straight).toFixed(1)}× 直线）：${from.title} → ${to.title}`, edgeId: edge.id })
          }
          for (const node of nodes) {
            if (node.id === edge.from || node.id === edge.to) continue
            const rect = rectOfNode(node)
            let hugging = false
            for (let i = 1; i < points.length && !hugging; i += 1) {
              if (segmentHitsRect(points[i - 1], points[i], rect, 2)) hugging = true
            }
            if (hugging) {
              issues.push({ level: 'warning', code: 'route-hugging', message: `连线贴着节点「${node.title}」`, edgeId: edge.id, nodeId: node.id })
            }
          }
        }
        for (let i = 0; i < traced.length; i += 1) {
          for (let j = i + 1; j < traced.length; j += 1) {
            const left = traced[i], right = traced[j]
            if (left.edge.from === right.edge.from || left.edge.to === right.edge.to) continue
            let crossed = false
            for (let x = 1; x < left.points.length && !crossed; x += 1) {
              for (let y = 1; y < right.points.length && !crossed; y += 1) {
                if (segmentsCross(left.points[x - 1], left.points[x], right.points[y - 1], right.points[y])) crossed = true
              }
            }
            if (crossed) {
              issues.push({ level: 'warning', code: 'route-crossing', message: `两条连线交叉：${left.edge.id} × ${right.edge.id}`, edgeId: left.edge.id, otherId: right.edge.id })
            }
          }
        }
        for (const [key, count] of anchorCount) {
          if (count <= 3) continue
          const [nodeId, side] = key.split('|')
          issues.push({ level: 'warning', code: 'anchor-conflict', message: `「${byId.get(nodeId)?.title ?? nodeId}」的 ${side} 面挂了 ${count} 条连线，建议分散锚点`, nodeId })
        }
        return issues
      }
      // 动效治理：一个读者开关 + 一个运动预算 + 语义归属让位。
      // 预算随图规模分级：图越大，同屏流动的边越少，避免大面积动画拖慢渲染。
      const visibleNodeCount = (current?.nodes ?? []).length
      const motionBudget = motionOff ? 0 : (visibleNodeCount <= 20 ? 6 : visibleNodeCount <= 60 ? 4 : 2)
      // 归属优先级：正在跑的边最先保住，其次主干，最后是已完成的边。
      const edgeMotionScore = (edge) => {
        const fromState = statusOf(edge.from)
        const toState = statusOf(edge.to)
        let score = 0
        if (toState === 'running' || fromState === 'running') score += 100
        if (fromState === 'succeeded' && toState === 'running') score += 50
        if (mainPathSet.has(edge.from) && mainPathSet.has(edge.to)) score += 10
        return score
      }
      const budgetEdgeIds = new Set(
        (current?.edges ?? [])
          .map((edge) => ({ id: edge.id, score: edgeMotionScore(edge) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, motionBudget)
          .filter((item) => item.score > 0)
          .map((item) => item.id),
      )
      const edgeList = (current?.edges ?? []).map((edge) => {
        const from = nodesById.get(edge.from)
        const to = nodesById.get(edge.to)
        if (!from || !to) return null
        const fromRect = rectOfNode(from)
        const toRect = rectOfNode(to)
        const fk = `${edge.from}|${edge.fromSide ?? 'right'}`
        const tk = `${edge.to}|${edge.toSide ?? 'left'}`
        const d = edgePath(fromRect, toRect, edge, obstacleGrid,
          (fromLaneTotal.get(fk) ?? 1) > 1 ? ((fromLaneSeen.get(fk) ?? 0) - ((fromLaneTotal.get(fk) ?? 1) - 1) / 2) * 8 : 0,
          (toLaneTotal.get(tk) ?? 1) > 1 ? ((toLaneSeen.get(tk) ?? 0) - ((toLaneTotal.get(tk) ?? 1) - 1) / 2) * 8 : 0)
        fromLaneSeen.set(fk, (fromLaneSeen.get(fk) ?? 0) + 1)
        toLaneSeen.set(tk, (toLaneSeen.get(tk) ?? 0) + 1)
        const state = edgeState(edge)
        const traversals = run.traversals?.[edge.id] ?? 0
        const resolvedColor = Number.isFinite(Number(edge.color)) ? Number(edge.color) : autoColors.get(edge.id)
        const colorStyle = Number.isFinite(resolvedColor) ? { stroke: `var(--daf-edge-${resolvedColor % EDGE_PALETTE_SIZE})` } : undefined
        const mid = edgeMids.get(edge.id) ?? edgeMidpoint(fromRect, toRect, edge)
        const flowState = state === 'idle' ? undefined : state
        const onMain = mainPathSet.size > 0 && mainPathSet.has(edge.from) && mainPathSet.has(edge.to)
        // 动效治理：预算内的边才播放流动；预算外的保留颜色与状态，只是不播动画。
        // 预算按语义归属分配，而不是按渲染顺序先到先得——否则前面的边会吃掉全部预算。
        const animating = state === 'active' && budgetEdgeIds.has(edge.id)
        const budgetSkip = state === 'active' && !animating ? 'skip' : undefined
        return h('g', { key: edge.id },
          h('path', { className: 'daf-edge-glow', d, 'data-state': flowState, 'data-main': onMain ? 'true' : undefined, style: colorStyle }),
          h('path', { className: 'daf-edge-flow', d, 'data-state': flowState, 'data-budget': budgetSkip, 'data-main': onMain ? 'true' : undefined,
            'data-animate': String(state === 'active' || (onMain && state !== 'failed')), style: colorStyle }),
          h('path', { className: 'daf-edge-bolus', d, 'data-state': flowState, 'data-budget': budgetSkip, style: colorStyle }),
          h('path', {
            d,
            fill: 'none',
            stroke: 'transparent',
            strokeWidth: 14,
            style: { pointerEvents: 'stroke', cursor: 'context-menu' },
            onContextMenu: (event) => {
              event.preventDefault()
              event.stopPropagation()
              suppressEdgeClickRef.current = Date.now()
              setEdgeMenu({ id: edge.id, x: event.clientX, y: event.clientY })
            },
          }),
          h('path', {
            className: 'daf-edge',
            ref: (el) => { if (el) edgePathEls.current.set(edge.id, el); else edgePathEls.current.delete(edge.id) },
            d,
            'data-state': flowState,
            'data-kind': 'seq',
            'data-selected': String(selectedEdgeId === edge.id),
            title: t.deleteEdge,
            style: { pointerEvents: 'none', ...(colorStyle ?? {}) },
          }),
          traversals > 0 && state !== 'done'
            ? h('path', { key: `${edge.id}:${traversals}`, className: 'daf-edge-anim', d, style: colorStyle })
            : null,
          h('g', {
            className: 'daf-edge-chip',
            transform: `translate(${mid.x}, ${mid.y})`,
            style: { pointerEvents: 'auto', cursor: 'pointer' },
            onClick: (event) => {
              event.stopPropagation()
              mutate((wf) => {
                wf.edges = wf.edges.map((item) => (item.id === edge.id
                  ? { ...item, color: ((Number.isFinite(Number(item.color)) ? Number(item.color) : -1) + 1) % EDGE_PALETTE_SIZE }
                  : item))
                return wf
              })
            },
          },
            h('circle', {
              r: 7,
              fill: 'var(--dsw-alias-bg-layer-1)',
              strokeWidth: 2,
              style: colorStyle ?? { stroke: 'var(--dsw-alias-border-l2)' },
            }),
            h('text', {
              x: 0,
              y: 3,
              textAnchor: 'middle',
              style: { fill: 'var(--dsw-alias-label-secondary)', fontSize: 8, pointerEvents: 'none' },
            }, String(Number.isFinite(Number(edge.color)) ? Number(edge.color) : (autoColors.get(edge.id) ?? '＋')))))
      })

      const bindEdges = (current?.nodes ?? [])
        .filter((node) => node.parentId && nodesById.has(node.parentId))
        .map((child) => {
          const parent = nodesById.get(child.parentId)
          const d = edgePath(rectOfNode(parent), rectOfNode(child), { fromSide: 'bottom', toSide: 'left' })
          const level = parent?.parentId ? 1 : 0
          return h('path', {
            key: `bind:${parent.id}->${child.id}`,
            className: 'daf-bind',
            d,
            'data-level': level,
            title: `${parent.title} → ${child.title}`,
            style: { pointerEvents: 'none' },
          })
        })
      const seqPairs = new Set((current?.edges ?? []).map((edge) => `${edge.from}->${edge.to}`))
      const depEdges = (current?.nodes ?? []).flatMap((node) => (Array.isArray(node.reliesOn) ? node.reliesOn : [])
        .filter((ref) => nodesById.has(ref) && ref !== node.id && !seqPairs.has(`${ref}->${node.id}`))
        .map((ref) => {
          const from = nodesById.get(ref)
          const d = edgePath(rectOfNode(from), rectOfNode(node), { fromSide: 'right', toSide: 'left' })
          return h('path', {
            key: `dep:${ref}->${node.id}`,
            className: 'daf-edge daf-edge-dep',
            'data-kind': 'dep',
            d,
            markerEnd: 'url(#daf-arrow)',
            title: `${t.legendDep}: ${from.title} → ${node.title}`,
            style: { pointerEvents: 'none' },
          })
        }))
      // 预览时的吸附目标：全部节点里最近的锚点（排除起点自身）。
      // 提前到 nodesView 之前算，锚点按钮据此高亮「会绑到哪一个」。
      const previewSnap = connecting && pointerPos
        ? (() => {
          let best = null
          for (const node of current?.nodes ?? []) {
            if (node.id === connecting.nodeId) continue
            const hit = nearestAnchor(rectOfNode(node), pointerPos, ANCHOR_SNAP_PX / (zoom || 1))
            if (hit && (!best || hit.distance < best.distance)) best = { nodeId: node.id, side: hit.side, distance: hit.distance }
          }
          return best
        })()
        : null

      const edgesView = [...edgeList, ...bindEdges, ...depEdges]

      const nodesView = (current?.nodes ?? []).map((node) => {
        const status = statusOf(node.id)
        const nodeRun = run.nodes?.[node.id]
        const isGroup = node.kind === 'group.steps'
        const children = isGroup ? childrenOf(node.id) : []
        const phaseChildren = node.kind === 'phase' || node.phaseId
          ? (current?.nodes ?? []).filter((item) => item.phaseId === node.id)
          : []
        const outPorts = node.kind === 'branch.condition'
          ? ['true', 'false']
          : node.kind === 'flow.loop'
            ? ['body', 'exit']
            : node.kind === 'human.checkpoint'
              ? ['out', 'stop']
              : ['out']
        const logicPorts = outPorts.length > 1 ? outPorts : []
        return h('div', {
          key: node.id,
          className: 'daf-node daf-glass',
          'data-node-id': node.id,
          'data-kind': node.kind,
          'data-status': status === 'idle' ? undefined : status,
          'data-selected': String(node.id === selectedId),
          'data-search-hit': searchHitIds.has(node.id) ? 'true' : undefined,
          'data-child': String(Boolean(node.parentId)),
          'data-diff': diff ? (diff.added.has(node.id) ? 'added' : diff.moved.has(node.id) ? 'moved' : undefined) : undefined,
          'data-pinned': node.pos?.pinned === true ? 'true' : undefined,
          style: { transform: `translate3d(${node.pos.x}px, ${node.pos.y}px, 0)`, ...(node.parentId ? { zIndex: 2 } : {}) },
          onPointerDown: (event) => {
            // 起点只能从锚点按钮发起（见下面的 .daf-anchor 渲染）。
            // 节点矩形体一律用于拖动——矩形不再是起线区域。
            if (event.target.closest('.daf-anchor') || event.target.closest('.daf-port') || event.target.closest('button')) return
            dragRef.current = { id: node.id, px: event.clientX, py: event.clientY, x: node.pos.x, y: node.pos.y, zoom }
            setSelectedId(node.id)
          },
          onPointerUp: () => {
            if (connecting) completeConnection(node.id, pointerPos)
          },
          onContextMenu: (event) => {
            if (!connecting) return
            event.preventDefault()
            setConnecting(null)
            setPointerPos(null)
          },
        },
          h('span', { className: 'daf-node-glow', 'aria-hidden': 'true' }),
          EDGE_SIDES.map((side) => h('button', {
            key: side,
            type: 'button',
            className: 'daf-anchor',
            'data-side': side,
            'data-armed': String(connecting?.nodeId === node.id && connecting?.side === side),
            'data-snap': String(Boolean(previewSnap && previewSnap.nodeId === node.id && previewSnap.side === side)),
            style: anchorStyle(side),
            title: `${t.connectHint} (${side})`,
            'aria-label': `${t.connectHint} ${side}`,
            onPointerDown: (event) => {
              event.stopPropagation()
              setConnecting({ nodeId: node.id, port: 'out', side })
            },
          })),
          h('div', { className: 'daf-node-head' },
            h('span', { className: 'daf-node-tick' }, status === 'succeeded' ? '✓' : status === 'failed' ? '✕' : status === 'running' ? '●' : ''),
            h('span', {
              className: 'daf-node-title',
              title: node.title,
              style: { fontSize: fittedFontSize(node.title, NODE_WIDTH - 44, 12.5, 9) + 'px' },
            }, node.title),
            h('span', { className: 'daf-node-kind' }, kindLabel(node.kind, ctx))),
          h('div', { className: 'daf-node-summary' }, nodeSummary(node, ctx)),
          isGroup
            ? h('div', { className: 'daf-group-children' },
              h('div', { className: 'daf-muted' }, `${children.length} ${t.childStepsUnit} · ${t.branchBound}`),
              h('button', {
                type: 'button',
                className: 'daf-chip',
                onClick: (event) => {
                  event.stopPropagation()
                  addChild(node.id)
                },
              }, `+ ${t.addStep}`))
            : null,
          h('div', { className: 'daf-node-foot' },
            status === 'running' ? h('span', { className: 'daf-run-ring' }) : null,
            (nodeRun?.toolCalls ?? []).slice(-2).map((call, index) => h('span', {
              key: `${call.name}-${index}`,
              className: 'daf-node-tool',
              'data-state': call.status,
            }, `${call.status === 'running' ? '⏳' : call.status === 'ok' ? '✓' : '✕'} ${call.name}`)),
            nodeRun?.error ? h('span', { className: 'daf-node-tool', 'data-state': 'error', title: nodeRun.error.message }, t.errorBadge) : null,
            h('span', { className: 'daf-spacer' }),
            logicPorts.map((port, portIndex) => h('button', {
              key: port,
              type: 'button',
              className: 'daf-port daf-port-out',
              style: { right: -6, top: 18 + 18 * portIndex },
              title: `${t.connectHint} (${port})`,
              'data-armed': String(connecting?.nodeId === node.id && connecting?.port === port),
              onPointerDown: (event) => {
                event.stopPropagation()
                setConnecting({ nodeId: node.id, port, side: 'right' })
              },
            }))),
            node.id === selectedId ? null : h('div', { className: 'daf-node-hovercard', 'aria-hidden': 'true' },
              h('div', { className: 'daf-hovercard-title' }, node.title),
              h('div', { className: 'daf-muted' }, kindLabel(node.kind, ctx)),
              node.kind === 'tool.call' && node.params?.name
                ? h('div', { className: 'daf-muted' }, `${t.tool}: ${String(node.params.name)}`)
                : null,
              status !== 'idle'
                ? h('div', { className: 'daf-hovercard-status', 'data-state': status },
                    status === 'running' ? `${t.statusRunning} · #${nodeRun?.attempt ?? 1}` : status === 'succeeded' ? t.statusOk : t.statusFail)
                : null,
              (nodeRun?.toolCalls ?? []).length > 0
                ? h('div', { className: 'daf-hovercard-calls' },
                    nodeRun.toolCalls.slice(-3).map((call, index) => h('div', {
                      key: `${call.name}-${index}`,
                      className: 'daf-node-tool',
                      'data-state': call.status,
                    }, `${call.status === 'ok' ? '✓' : call.status === 'error' ? '✕' : '⋯'} ${call.name}`)))
                : null,
              nodeRun?.error ? h('div', { className: 'daf-hovercard-error' }, String(nodeRun.error.message ?? '').slice(0, 90)) : null),
            node.id === selectedId
              ? h('div', { className: 'daf-node-detail', role: 'region', 'aria-label': node.title },
                  h('div', { className: 'daf-node-detail-row' }, `${t.nodeKind}: ${kindLabel(node.kind, ctx)}`),
                  node.kind === 'tool.call' && node.params?.name
                    ? h('div', { className: 'daf-node-detail-row' }, `${t.tool}: ${String(node.params.name)}`)
                    : null,
                  node.kind === 'tool.call' && node.params?.argsTemplate
                    ? h('div', { className: 'daf-node-detail-row' }, `args: ${String(node.params.argsTemplate).slice(0, 70)}`)
                    : null,
                  node.kind === 'agent.task' && node.params?.prompt
                    ? h('div', { className: 'daf-node-detail-row' }, String(node.params.prompt).slice(0, 90))
                    : null,
                  Array.isArray(node.params?.names) && node.params.names.length > 0
                    ? h('div', { className: 'daf-node-detail-row' }, `${t.skills}: ${node.params.names.join('、')}`)
                    : null,
                  phaseChildren.length > 0
                    ? h('div', { className: 'daf-node-detail-row' }, `${t.subworks}: ${phaseChildren.map((item) => item.title).join('、')}`)
                    : null,
                  children.length > 0
                    ? h('div', { className: 'daf-node-detail-row' }, `${t.childSteps}: ${children.map((item) => item.title).join('、')}`)
                    : null,
                  Array.isArray(node.reliesOn) && node.reliesOn.length > 0
                    ? h('div', { className: 'daf-node-detail-row' }, `${t.dependsOn}: ${node.reliesOn.map((ref) => nodesById.get(ref)?.title ?? ref).join('、')}`)
                    : null)
              : null,
        )
      })

      const previewPath = connecting && pointerPos && nodesById.get(connecting.nodeId)
        ? h('path', {
          className: 'daf-connect-preview',
          // 已吸附到锚点时，预览线直接结束在该锚点上（用户能看见会绑到哪一颗）。
          d: (() => {
            const sourceRect = rectOfNode(nodesById.get(connecting.nodeId))
            const fromSide = connecting.side ?? 'right'
            if (!previewSnap) return edgePath(sourceRect, { x: pointerPos.x, y: pointerPos.y, w: 0, h: 0 }, { fromSide })
            const targetNode = nodesById.get(previewSnap.nodeId)
            if (!targetNode) return edgePath(sourceRect, { x: pointerPos.x, y: pointerPos.y, w: 0, h: 0 }, { fromSide })
            const anchor = anchorPoint(rectOfNode(targetNode), previewSnap.side)
            return edgePath(sourceRect, { x: anchor.x, y: anchor.y, w: 0, h: 0 }, { fromSide, toSide: previewSnap.side })
          })(),
        })
        : null

      if (!current) {
        // P3 导览：把相机送到第 index 站（-1 表示退出导览）。
      const tourGo = useCallback((index) => {
        if (tourStops.length === 0) return
        const next = index < 0 ? -1 : (index + tourStops.length) % tourStops.length
        setTourIndex(next)
        if (next < 0) return
        const stop = tourStops[next]
        setSelectedId(stop.members[0] ?? stop.id)
        frameNodes(stop.members)
      }, [tourStops, frameNodes, setSelectedId])

      // 阶段容器框。
      // 把阶段节点与其子节点一起框起来，阶段节点就是框内的标题。
      const phaseFramesView = (() => {
        const all = current?.nodes ?? []
        const frames = []
        for (const phase of all.filter((node) => node.kind === 'phase')) {
          const members = [phase, ...all.filter((node) => node.phaseId === phase.id)]
          if (members.length < 2) continue
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
          for (const member of members) {
            const rect = rectOf(member)
            minX = Math.min(minX, rect.x); minY = Math.min(minY, rect.y)
            maxX = Math.max(maxX, rect.x + rect.w); maxY = Math.max(maxY, rect.y + rect.h)
          }
          const PAD_X = 18, PAD_TOP = 22, PAD_BOTTOM = 16
          frames.push(h('div', {
            key: 'phaseframe:' + phase.id,
            className: 'daf-phase-frame',
            style: {
              transform: 'translate3d(' + (minX - PAD_X) + 'px, ' + (minY - PAD_TOP) + 'px, 0)',
              width: (maxX - minX + PAD_X * 2) + 'px',
              height: (maxY - minY + PAD_TOP + PAD_BOTTOM) + 'px',
            },
          }, h('span', { className: 'daf-phase-frame-label' }, phase.title)))
        }
        return frames.length > 0 ? frames : null
      })()

      // P3 大纲树：阶段 → 子节点（可折叠）；无阶段归属的节点直接列在根层。
      const outlineRows = (() => {
        const nodes = current?.nodes ?? []
        if (nodes.length === 0) return [h('div', { key: 'outline:none', className: 'daf-muted', style: { padding: '6px 8px' } }, t.canvasEmpty)]
        const rows = []
        const phases = nodes.filter((node) => node.kind === 'phase')
        for (const phase of phases) {
          const collapsed = collapsedPhases.has(phase.id)
          rows.push(h('button', {
            key: 'outline:ph:' + phase.id,
            type: 'button',
            className: 'daf-outline-row daf-outline-phase',
            'aria-expanded': String(!collapsed),
            onClick: () => setCollapsedPhases((prev) => {
              const next = new Set(prev)
              if (next.has(phase.id)) next.delete(phase.id)
              else next.add(phase.id)
              return next
            }),
          }, h('span', { className: 'daf-outline-caret' }, collapsed ? '▸' : '▾'),
            h('span', { className: 'daf-outline-title' }, phase.title)))
          if (collapsed) continue
          for (const child of nodes.filter((node) => node.phaseId === phase.id)) {
            rows.push(h('button', {
              key: 'outline:n:' + child.id,
              type: 'button',
              className: 'daf-outline-row',
              'data-selected': String(child.id === selectedId),
              onClick: () => focusNode(child.id),
            }, h('span', { className: 'daf-outline-dot', 'data-st': statusOf(child.id) }),
              h('span', { className: 'daf-outline-title' }, child.title)))
          }
        }
        for (const node of nodes.filter((item) => !item.phaseId && !item.parentId && item.kind !== 'phase')) {
          rows.push(h('button', {
            key: 'outline:r:' + node.id,
            type: 'button',
            className: 'daf-outline-row',
            'data-selected': String(node.id === selectedId),
            onClick: () => focusNode(node.id),
          }, h('span', { className: 'daf-outline-dot', 'data-st': statusOf(node.id) }),
            h('span', { className: 'daf-outline-title' }, node.title)))
        }
        return rows
      })()

      return h('div', { className: 'daf-scope', 'data-contrast': highContrast ? 'high' : 'normal', 'data-motion': motionOff ? 'off' : undefined, 'data-pan': spaceHeld ? 'true' : undefined, 'data-camera': cameraState, 'data-busy': sessionBusy ? 'true' : undefined, 'data-connecting': connecting ? 'true' : undefined, style: { height: '100%', minHeight: 0 } },
          h(StyleTag, { css: BASE_CSS + CANVAS_CSS }),
          h('div', { className: 'daf-canvas-root' },
            h('div', { className: 'daf-toolbar' },
              h(Btn, { variant: 'primary', onClick: createFlow, disabled: busy }, `+ ${t.newFlow}`),
              h(Btn, { onClick: () => void loadFlows(false) }, h(Icon, { name: 'refresh' })),
              plan.workflowId ? h(Btn, { onClick: loadPlanWorkflow }, `${t.planEdit}`) : null,
              h('span', { className: 'daf-spacer' }),
              error ? h('span', { className: 'daf-error', title: error }, String(error).slice(0, 80)) : null),
            plan.status === 'awaiting'
              ? h('div', { className: 'daf-plan daf-glass', style: { margin: '8px 0' } },
                h('div', { className: 'daf-muted' }, `${t.planAsk} · ${(plan.steps ?? []).length} ${t.stepsUnit} · ${t.turnLabel} ${plan.turn ?? 1}`),
                h('div', { style: { display: 'flex', gap: 6, flexWrap: 'wrap' } },
                  h(Btn, { variant: 'primary', onClick: loadPlanWorkflow }, `${t.planEdit}`),
                  h(Btn, { onClick: () => resolvePlanNow('skip') }, t.planSkip)))
              : null,
            h('div', { className: 'daf-muted', style: { padding: 12, display: 'flex', flexDirection: 'column', gap: 6 } },
              h('div', null, t.canvasEmpty),
              h('div', null, t.canvasEmptyHint))))
      }

      // P3 导览：把相机送到第 index 站（-1 表示退出导览）。
      const tourGo = useCallback((index) => {
        if (tourStops.length === 0) return
        const next = index < 0 ? -1 : (index + tourStops.length) % tourStops.length
        setTourIndex(next)
        if (next >= 0) focusNode(tourStops[next])
      }, [tourStops, focusNode])

      // 阶段容器框。
      // 把阶段节点与其子节点一起框起来，阶段节点就是框内的标题。
      const phaseFramesView = (() => {
        const all = current?.nodes ?? []
        const frames = []
        for (const phase of all.filter((node) => node.kind === 'phase')) {
          const members = [phase, ...all.filter((node) => node.phaseId === phase.id)]
          if (members.length < 2) continue
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
          for (const member of members) {
            const rect = rectOf(member)
            minX = Math.min(minX, rect.x); minY = Math.min(minY, rect.y)
            maxX = Math.max(maxX, rect.x + rect.w); maxY = Math.max(maxY, rect.y + rect.h)
          }
          const PAD_X = 18, PAD_TOP = 22, PAD_BOTTOM = 16
          frames.push(h('div', {
            key: 'phaseframe:' + phase.id,
            className: 'daf-phase-frame',
            style: {
              transform: 'translate3d(' + (minX - PAD_X) + 'px, ' + (minY - PAD_TOP) + 'px, 0)',
              width: (maxX - minX + PAD_X * 2) + 'px',
              height: (maxY - minY + PAD_TOP + PAD_BOTTOM) + 'px',
            },
          }, h('span', { className: 'daf-phase-frame-label' }, phase.title)))
        }
        return frames.length > 0 ? frames : null
      })()

      // P3 大纲树：阶段 → 子节点（可折叠）；无阶段归属的节点直接列在根层。
      const outlineRows = (() => {
        const nodes = current?.nodes ?? []
        if (nodes.length === 0) return [h('div', { key: 'outline:none', className: 'daf-muted', style: { padding: '6px 8px' } }, t.canvasEmpty)]
        const rows = []
        const phases = nodes.filter((node) => node.kind === 'phase')
        for (const phase of phases) {
          const collapsed = collapsedPhases.has(phase.id)
          rows.push(h('button', {
            key: 'outline:ph:' + phase.id,
            type: 'button',
            className: 'daf-outline-row daf-outline-phase',
            'aria-expanded': String(!collapsed),
            onClick: () => setCollapsedPhases((prev) => {
              const next = new Set(prev)
              if (next.has(phase.id)) next.delete(phase.id)
              else next.add(phase.id)
              return next
            }),
          }, h('span', { className: 'daf-outline-caret' }, collapsed ? '▸' : '▾'),
            h('span', { className: 'daf-outline-title' }, phase.title)))
          if (collapsed) continue
          for (const child of nodes.filter((node) => node.phaseId === phase.id)) {
            rows.push(h('button', {
              key: 'outline:n:' + child.id,
              type: 'button',
              className: 'daf-outline-row',
              'data-selected': String(child.id === selectedId),
              onClick: () => focusNode(child.id),
            }, h('span', { className: 'daf-outline-dot', 'data-st': statusOf(child.id) }),
              h('span', { className: 'daf-outline-title' }, child.title)))
          }
        }
        for (const node of nodes.filter((item) => !item.phaseId && !item.parentId && item.kind !== 'phase')) {
          rows.push(h('button', {
            key: 'outline:r:' + node.id,
            type: 'button',
            className: 'daf-outline-row',
            'data-selected': String(node.id === selectedId),
            onClick: () => focusNode(node.id),
          }, h('span', { className: 'daf-outline-dot', 'data-st': statusOf(node.id) }),
            h('span', { className: 'daf-outline-title' }, node.title)))
        }
        return rows
      })()

      return h('div', { className: 'daf-scope', 'data-contrast': highContrast ? 'high' : 'normal', 'data-motion': motionOff ? 'off' : undefined, style: { height: '100%', minHeight: 0 } },
        h(StyleTag, { css: BASE_CSS + CANVAS_CSS }),
        h('div', { className: 'daf-canvas-root' },
            h('div', { className: 'daf-side-rail', role: 'toolbar', 'aria-orientation': 'vertical', 'aria-label': t.flowDock },
            h(Btn, { onClick: () => setFlowDock((value) => !value), 'aria-expanded': String(Boolean(flowDock)), title: t.flowDock }, h(Icon, { name: 'layers', size: 15 })),
            h(Btn, { onClick: createFlow, disabled: busy, title: t.newFlow }, h(Icon, { name: 'plus', size: 15 })),
            h(Btn, { onClick: saveFlow, disabled: busy || !current || !dirty, title: t.saveFlow }, h(Icon, { name: 'save', size: 15 })),
            h(Btn, { onClick: () => void archiveCurrent(), disabled: busy || !current, title: t.archiveFlow }, h(Icon, { name: 'archive', size: 15 })),
            h(Btn, { variant: 'danger', onClick: () => void deleteCurrent(), disabled: busy || !current, title: t.deleteFlow }, h(Icon, { name: 'trash', size: 15 })),
            h('span', { className: 'daf-toolbar-sep', 'aria-hidden': 'true' }),
            h(Btn, { onClick: toggleDevPanels, title: t.devPanels, 'aria-pressed': String(Boolean(showDevPanels)), className: showDevPanels ? 'daf-btn-dev is-on' : 'daf-btn-dev' }, h(Icon, { name: 'gear', size: 15 })),
            run.status === 'running' && !paused ? h(Btn, { onClick: () => control('pause'), title: t.pause }, h(Icon, { name: 'pause', size: 15 })) : run.status === 'running' && paused ? h(Btn, { onClick: () => control('resume'), title: t.resume }, h(Icon, { name: 'play', size: 15 })) : h(Btn, { variant: 'primary', onClick: startRun, disabled: busy || !current, title: t.run }, h(Icon, { name: 'play', size: 15 })),
            runId && run.status === 'running' ? h(Btn, { variant: 'danger', onClick: () => control('cancel'), title: t.cancelRun }, h(Icon, { name: 'cross', size: 15 })) : null,
            h(Btn, { onClick: validate, disabled: busy || !current, title: t.validate }, h(Icon, { name: 'check', size: 15 })),
            h(Btn, { onClick: () => current && mutate((wf) => autoLayout(wf)), disabled: !current, title: t.autoLayout }, h(Icon, { name: 'refresh', size: 15 })),
            h(Btn, { onClick: () => void copyMermaid(), disabled: !current, title: t.mermaidCopy }, h(Icon, { name: 'copy', size: 15 })),
            h(Btn, { onClick: () => setMermaidOpen(true), title: t.mermaidImport }, h(Icon, { name: 'layers', size: 15 }))
            ),
            h('div', { className: 'daf-toolbar' },
            h('span', { className: 'daf-search' },
              h(Icon, { name: 'search', size: 12 }),
              h('input', {
                ref: searchInputRef,
                className: 'daf-search-input',
                value: searchQuery,
                placeholder: t.searchHint,
                'aria-label': t.searchHint,
                onChange: (event) => { setSearchQuery(event.target.value); setSearchIndex(0) },
                onKeyDown: (event) => {
                  if (event.key !== 'Enter') return
                  event.preventDefault()
                  if (searchMatches.length === 0) return
                  const next = (searchIndex + (event.shiftKey ? -1 : 1) + searchMatches.length) % searchMatches.length
                  setSearchIndex(next)
                  focusNode(searchMatches[next].id)
                },
              }),
              searchQuery === '' ? null : h('span', { className: 'daf-search-count' },
                searchMatches.length === 0 ? t.searchNone : String(Math.min(searchIndex + 1, searchMatches.length)) + '/' + String(searchMatches.length))),
            sessionBusy ? h('span', { className: 'daf-busy-pill', title: t.busyHint }, h('span', { className: 'daf-busy-dot' }), t.busyNow) : null,
            notice ? h('span', { className: 'daf-muted' }, notice) : null,
            error ? h('span', { className: 'daf-error', title: error }, error.slice(0, 60)) : null,
            edgeMenuView,
            mermaidOpen ? h(RightDrawer, { title: t.mermaidImport, onClose: () => setMermaidOpen(false) },
              h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
                h('textarea', {
                  className: 'daf-textarea',
                  rows: 10,
                  value: mermaidText,
                  placeholder: 'flowchart TD\n  A["开始"] --> B["结束"]\n  B -.-> C["可选"]',
                  onChange: (event) => setMermaidText(event.target.value),
                }),
                h('div', { style: { display: 'flex', gap: 6, justifyContent: 'flex-end' } },
                  h(Btn, { onClick: () => setMermaidOpen(false) }, t.cancel),
                  h(Btn, { variant: 'primary', onClick: () => void importMermaid(), disabled: busy || mermaidText.trim() === '' }, t.mermaidImport)))) : null,
            composeOpen ? h(Modal, { title: t.compose, onClose: () => setComposeOpen(false) },
              h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
                h('textarea', {
                  className: 'daf-textarea',
                  rows: 14,
                  value: composeText,
                  readOnly: true,
                  'aria-label': t.compose,
                }),
                composeWarnings.length > 0
                  ? h('div', { className: 'daf-muted' }, t.composeWarn + composeWarnings.map((item) => item.message).join('；'))
                  : null,
                h('div', { style: { display: 'flex', gap: 6, justifyContent: 'flex-end' } },
                  h(Btn, { onClick: () => setComposeOpen(false) }, t.close),
                  h(Btn, {
                    variant: 'primary',
                    onClick: () => {
                      void navigator.clipboard.writeText(composeText)
                        .then(() => setNotice(t.composeCopied))
                        .catch(() => {})
                    },
                  }, t.composeCopy)))) : null,
            h('span', { className: 'daf-spacer' }),
              h('span', { className: 'daf-zoom', title: t.zoomHint },
                h('button', { type: 'button', className: 'daf-tip', 'data-tip': t.zoomOut, onClick: () => cameraZoom(zoom / 1.15, { smooth: true }), 'aria-label': t.zoomOut }, '−'),
                h('input', {
                  value: `${Math.round(zoom * 100)}%`,
                  'aria-label': t.zoom,
                  onChange: (event) => {
                    const parsed = Number(String(event.target.value).replace('%', '').trim())
                    if (Number.isFinite(parsed) && parsed > 0) cameraZoom(parsed / 100, { smooth: true })
                  },
                }),
                h('button', { type: 'button', className: 'daf-tip', 'data-tip': t.zoomIn, onClick: () => cameraZoom(zoom * 1.15, { smooth: true }), 'aria-label': t.zoomIn }, '+'),
                h('button', { type: 'button', className: 'daf-tip', 'data-tip': t.zoomFit, onClick: fitToContent, 'aria-label': t.zoomFit }, t.zoomFitLabel),
                h('button', { type: 'button', className: 'daf-tip', 'data-tip': t.zoomReset, onClick: () => cameraZoom(1, { smooth: true }), 'aria-label': t.zoomReset }, '1:1')),
            h('span', { className: 'daf-flow-cell' },
              h(Btn, { onClick: () => setMoreOpen((value) => !value), title: t.more, 'aria-expanded': String(Boolean(moreOpen)), 'data-more-toggle': 'true' }, h(Icon, { name: 'more', size: 14 })),
              moreOpen ? moreMenu : null)),
          plan.status === 'awaiting'
            ? h('div', { className: 'daf-plan daf-glass' },
              h('div', { style: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' } },
                h('strong', null, `${t.planAsk}`),
                h('span', { className: 'daf-muted' }, `${plan.workflowName ?? ''} · ${(plan.steps ?? []).length} ${t.stepsUnit} · ${t.turnLabel} ${plan.turn ?? 1}`),
                h('span', { className: 'daf-spacer' })),
              h('div', { className: 'daf-muted' }, t.planHint),
              plan.mode === 'design'
                ? h('span', { className: 'daf-tag daf-tag-ai', style: { marginBottom: 4, display: 'inline-block' } }, t.designMode)
                : null,
              (plan.warnings ?? []).length > 0
                ? h('div', { className: 'daf-muted', style: { color: 'var(--dsw-alias-state-warn-primary)' } },
                  `${t.planWarnings}: ${(plan.warnings ?? []).slice(0, 3).map((warning) => warning.message ?? warning.ref ?? '').join('；')}`)
                : null,
              experienceCards,
              plan.turn > 0 && plan.turn % 10 === 0
                ? h('div', { style: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' } },
                  h('span', { className: 'daf-muted' }, `${t.experienceHint}（${t.turnLabel} ${plan.turn}）`),
                  h(Btn, { onClick: () => void saveExperience(), disabled: busy }, t.experienceSave))
                : null,
              h('div', { style: { display: 'flex', gap: 6, flexWrap: 'wrap' } },
                h(Btn, { variant: 'primary', onClick: () => resolvePlanNow('confirm', true) }, t.planConfirm),
                h(Btn, { onClick: loadPlanWorkflow }, t.planAdjust),
                h(Btn, { onClick: () => void relayoutPlan(), disabled: !current }, t.planRelayout),
                h(Btn, { onClick: () => resolvePlanNow('skip') }, t.planSkip)))
            : null,
          !current
            ? h('div', { className: 'daf-muted', style: { padding: 12 } }, t.canvasEmpty)
            : h('div', { className: 'daf-canvas-main', 'data-dev': String(Boolean(showDevPanels)) },
              h('div', { className: 'daf-surface-wrap', ref: surfaceRef },
                h('div', {
                  className: 'daf-surface',
                  ref: surfaceInnerRef,
                  style: { transform: `scale(${zoom})` },
                  onPointerMove: (event) => {
                    if (!connecting) return
                    const rect = surfaceInnerRef.current?.getBoundingClientRect()
                    if (!rect) return
                    setPointerPos({ x: (event.clientX - rect.left) / zoom, y: (event.clientY - rect.top) / zoom })
                  },
                  onPointerUp: () => {
                    if (!connecting) return
                    if (Date.now() - lastConnectRef.current < 80) {
                      setConnecting(null)
                      setPointerPos(null)
                      return
                    }
                    const point = pointerPos
                    if (point) {
                      // 落点必须是锚点：未落在任何锚点半径内就不建立连线（矩形不是吸附目标）。
                      let best = null
                      for (const node of current?.nodes ?? []) {
                        if (node.id === connecting.nodeId) continue
                        const hit = nearestAnchor(rectOfNode(node), point, ANCHOR_SNAP_PX / (zoom || 1))
                        if (hit && (!best || hit.distance < best.distance)) best = { nodeId: node.id, side: hit.side, distance: hit.distance }
                      }
                      if (best) {
                        completeConnection(best.nodeId, point, best.side)
                        return
                      }
                    }
                    setConnecting(null)
                    setPointerPos(null)
                  },
                },
                  h('svg', { className: 'daf-edges' },
                    h('defs', null,
                      h('marker', {
                        id: 'daf-arrow',
                        viewBox: '0 0 8 8',
                        refX: 7,
                        refY: 4,
                        markerWidth: 6,
                        markerHeight: 6,
                        orient: 'auto-start-reverse',
                      }, h('path', { d: 'M0,0 L8,4 L0,8 z', fill: 'var(--dsw-alias-brand-primary)' }))),
                    edgesView,
                    previewPath),
                  selectedEdgeView,
                  (diff?.removed ?? []).map((ghost) => h('div', {
                    key: `ghost:${ghost.id}`,
                    className: 'daf-node daf-node-ghost daf-glass',
                    style: { transform: `translate3d(${ghost.x}px, ${ghost.y}px, 0)` },
                    title: `${t.diffRemoved}: ${ghost.title}`,
                  }, h('span', { className: 'daf-node-ghost-title' }, ghost.title))),
                  phaseFramesView,
                  nodesView))),
              h('div', { className: 'daf-legend-box' },
                h('span', { className: 'daf-legend-item' },
                  h('span', { className: 'daf-legend-swatch', style: { borderTop: '2px dashed var(--dsw-alias-border-l2)', height: 0 } }),
                  t.legendSeq),
                h('span', { className: 'daf-legend-item' },
                  h('span', { className: 'daf-legend-swatch', style: { borderTop: '2px solid var(--dsw-alias-brand-primary)', height: 0 } }),
                  t.legendDep),
                pinnedCount > 0 ? h('span', { className: 'daf-legend-item', title: t.layoutPinned }, `${pinnedCount}`) : null,
                diff
                  ? h('span', { className: 'daf-legend-item' }, `+${diff.added.size} / -${diff.removed.length} / ~${diff.moved.size}`)
                  : null),
              h('div', { className: 'daf-thumb', 'aria-hidden': 'true' },
                (() => {
                  const bounds = contentBounds()
                  const scale = Math.min(124 / bounds.w, 84 / bounds.h)
                  return (current?.nodes ?? []).map((node) => h('span', {
                    key: `thumb:${node.id}`,
                    style: {
                      position: 'absolute',
                      left: (node.pos.x - bounds.x) * scale + 4,
                      top: (node.pos.y - bounds.y) * scale + 4,
                      width: Math.max(3, NODE_WIDTH * scale),
                      height: Math.max(2, NODE_HEIGHT * scale),
                      borderRadius: 2,
                      background: statusOf(node.id) === 'running'
                        ? 'var(--dsw-alias-brand-primary)'
                        : statusOf(node.id) === 'succeeded'
                          ? 'var(--dsw-alias-state-success-primary)'
                          : statusOf(node.id) === 'failed'
                            ? 'var(--dsw-alias-state-error-primary)'
                            : 'var(--dsw-alias-border-l2)',
                      opacity: 0.9,
                    },
                  }))
                })()),
              h('div', { className: 'daf-thumb-viewlayer', 'aria-hidden': 'true' },
                h('span', { ref: thumbViewRef, className: 'daf-thumb-viewrect' })),
              tourIndex >= 0
                ? h('div', { className: 'daf-tour' },
                  h(Btn, { onClick: () => tourGo(tourIndex - 1), title: t.tourPrev }, '←'),
                  h('span', { className: 'daf-tour-count', title: tourStops[tourIndex]?.title }, String(tourIndex + 1) + '/' + String(tourStops.length)),
                  h(Btn, { onClick: () => tourGo(tourIndex + 1), title: t.tourNext }, '→'),
                  h(Btn, { onClick: () => tourGo(-1), title: t.tourExit }, t.close))
                : null,
              outlineOpen
                ? h('div', { className: 'daf-outline' },
                  h('div', { className: 'daf-outline-head' },
