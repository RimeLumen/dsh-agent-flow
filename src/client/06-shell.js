/* @client-shard: 06-shell */
      }
      return [...workflow.nodes].sort((a, b) => {
        const la = seen.get(a.id) ?? 0
        const lb = seen.get(b.id) ?? 0
        if (la !== lb) return la - lb
        return a.pos.y - b.pos.y
      })
    }

    function CanvasTabTitle(props) {
      const ctx = props.ctx
      const run = useStoreValue(activeRun)
      const color = run.status === 'running'
        ? 'var(--dsw-alias-brand-primary)'
        : run.status === 'failed'
          ? 'var(--dsw-alias-state-error-primary)'
          : run.status === 'succeeded'
            ? 'var(--dsw-alias-state-success-primary)'
            : 'var(--dsw-alias-label-secondary)'
      return h('span', { className: 'daf-scope', style: { display: 'inline-flex', alignItems: 'center', gap: 6 } },
        h('span', { style: { width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block' } }),
        h('span', null, dictFor(ctx).tabTitle))
    }

    function FloatingCanvas(props) {
      const { ctx } = props
      const ui = useStoreValue(uiState)
      const [pos, setPos] = useState({ x: 0, y: 0 })
      const dragRef = useRef(null)
      useEffect(() => {
        if (!ui.overlayOpen) return undefined
        const onMove = (event) => {
          if (!dragRef.current) return
          setPos({ x: dragRef.current.x + (event.clientX - dragRef.current.px), y: dragRef.current.y + (event.clientY - dragRef.current.py) })
        }
        const onUp = () => {
          dragRef.current = null
        }
        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
        return () => {
          window.removeEventListener('pointermove', onMove)
          window.removeEventListener('pointerup', onUp)
        }
      }, [ui.overlayOpen])
      if (!ui.overlayOpen) return null
      return h('div', { className: 'daf-scope' },
        h(StyleTag, { css: BASE_CSS + CANVAS_CSS }),
        h('div', {
          className: 'daf-float',
          style: pos.x || pos.y ? { transform: `translate(${pos.x}px, ${pos.y}px)` } : undefined,
          role: 'dialog',
          'aria-label': dictFor(ctx).openCanvas,
        },
          h('div', {
            className: 'daf-float-head',
            onPointerDown: (event) => {
              dragRef.current = { x: pos.x, y: pos.y, px: event.clientX, py: event.clientY }
            },
          },
            h('strong', { style: { flex: 1 } }, dictFor(ctx).openCanvas),
            h(Btn, { onClick: () => uiState.set({ overlayOpen: false }) }, '✕')),
          h('div', { className: 'daf-float-body' }, h(CanvasTab, { ctx, sessionId: ui.sessionId }))))
    }

    function openCanvas(ctx, sessionId) {
      const t = dictFor(ctx)
      try {
        const sidebarRight = ctx.get('sidebarRight')
        if (sidebarRight && typeof sidebarRight.openTab === 'function') {
          sidebarRight.openTab(TAB_KIND, { params: { sessionId } })
          return 'native'
        }
      } catch {
      }
      try {
        const better = ctx.get('betterSidebar')
        if (better && typeof better.openTab === 'function') {
          better.openTab({ type: TAB_KIND, title: t.tabTitle })
          return 'better-sidebar'
        }
      } catch {
      }
      try {
        const layout = ctx.get('layout')
        if (layout && typeof layout.selectPanel === 'function') {
          layout.selectPanel('agent-flow')
          return 'panel'
        }
      } catch {
      }
      uiState.set({ overlayOpen: true, sessionId })
      return 'overlay'
    }

    function HeaderButton(props) {
      const { ctx, sessionId } = props
      const t = dictFor(ctx)
      return h('span', { className: 'daf-scope' },
        h(StyleTag, { css: BASE_CSS }),
        h(Btn, { onClick: () => openCanvas(ctx, sessionId), title: t.openCanvas }, `${t.tabTitle}`))
    }

    function StyleTag(props) {
      return h('style', { 'data-dsh-plugin': 'dsh-agent-flow' }, props.css)
    }

    function Btn({ children, onClick, variant, disabled, title, type }) {
      // 悬停名称提示统一由 CSS 淡入淡出（data-tip）承担；原生 title 移除避免双重显示，
      // 无障碍语义由 aria-label 保留。
      return h('button', {
        type: type ?? 'button',
        className: `daf-btn daf-tip${variant === 'primary' ? ' daf-btn-primary' : variant === 'danger' ? ' daf-btn-danger' : ''}`,
        onClick,
        disabled: disabled === true,
        'data-tip': title,
        'aria-label': title,
      }, children)
    }

    function Switch({ checked, onChange, label }) {
      return h('button', {
        type: 'button',
        className: 'daf-switch',
        role: 'switch',
        'aria-checked': checked === true,
        'aria-label': label,
        onClick: (event) => {
          event.stopPropagation()
          onChange(!checked)
        },
      }, h('span', { className: 'daf-switch-dot' }))
    }

    function Field({ label, children, hint }) {
      return h('label', { className: 'daf-field' },
        h('span', { className: 'daf-field-label' }, label),
        children,
        hint ? h('span', { className: 'daf-muted' }, hint) : null)
    }

    /** 贴屏右侧、与画布等高的抽屉容器（Mermaid 导入 / 流程管理共用）。 */
    function RightDrawer({ title, children, onClose }) {
      useEffect(() => {
        const onKey = (event) => { if (event.key === 'Escape') onClose?.() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [onClose])
      return h('div', { className: 'daf-drawer-backdrop', onMouseDown: (event) => { if (event.target === event.currentTarget) onClose?.() } },
        h('div', { className: 'daf-drawer-right', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
          h('div', { className: 'daf-drawer-head' },
            h('strong', { style: { flex: 1 } }, title),
            h(Btn, { onClick: onClose }, '✕')),
          children))
    }

    function Modal({ title, children, onClose, footer }) {
      useEffect(() => {
        const onKey = (event) => {
          if (event.key === 'Escape') onClose?.()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [onClose])
      return h('div', { className: 'daf-modal-backdrop', onMouseDown: (event) => { if (event.target === event.currentTarget) onClose?.() } },
        h('div', { className: 'daf-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
          h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 } },
            h('strong', { style: { flex: 1 } }, title),
            h(Btn, { onClick: onClose }, '✕')),
          children,
          footer ? h('div', { style: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 } }, footer) : null))
    }

    function Popover({ trigger, children, open, onOpenChange }) {
      const anchorRef = useRef(null)
      useEffect(() => {
        if (!open) return undefined
        const onDown = (event) => {
          if (anchorRef.current && !anchorRef.current.contains(event.target)) onOpenChange(false)
        }
        const onKey = (event) => {
          if (event.key === 'Escape') onOpenChange(false)
        }
        window.addEventListener('mousedown', onDown)
        window.addEventListener('keydown', onKey)
        return () => {
          window.removeEventListener('mousedown', onDown)
          window.removeEventListener('keydown', onKey)
        }
      }, [open, onOpenChange])
      return h('div', { className: 'daf-anchor', ref: anchorRef },
        trigger,
        open ? h('div', { className: 'daf-popover', role: 'menu' }, children) : null)
    }

    function useAsync(action) {
      const [state, setState] = useState({ pending: false, error: null, value: null })
      const run = useCallback(async (...args) => {
        setState({ pending: true, error: null, value: null })
        try {
          const value = await action(...args)
          setState({ pending: false, error: null, value })
          return value
        } catch (error) {
          setState({ pending: false, error: error.message, value: null })
          return null
        }
      }, [action])
      return [state, run]
    }

    const ICON_PATHS = {
      gear: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.4-2.1.9-1.4-1.6-1.2.2-1.7-1.8-.6-.7-1.6-1.8.5-1.3-1.1-1.3 1.1-1.8-.5-.7 1.6-1.8.6.2 1.7L4.7 12l.9 1.4-.9 1.4 1.6 1.2-.2 1.7 1.8.6.7 1.6 1.8-.5 1.3 1.1 1.3-1.1 1.8.5.7-1.6 1.8-.6-.2-1.7Z',
      bolt: 'M13 2 4 14h6l-1 8 9-12h-6l1-8Z',
      star: 'm12 3.6 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.8l5.9-.8Z',
      check: 'm4.5 12.5 4.5 4.5 10.5-11',
      cross: 'M6 6l12 12M18 6 6 18',
      plus: 'M12 5v14M5 12h14',
      refresh: 'M20 11.5a8 8 0 1 1-2.4-5.7M20 4v5h-5',
      trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
      copy: 'M8 8h11v11H8zM5 16V5h11',
      save: 'M5 4h11l3 3v13H5zM8 4v6h7V4M8 15h8',
      layers: 'm12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5',
      play: 'M8 5l11 7-11 7z',
      robot: 'M12 3v3M7 8h10a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3Zm2 6h.01M15 14h.01',
      archive: 'M4 8h16M6 8v11a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8M10 12h4',
      pause: 'M9 5v14M15 5v14',
      more: 'M5 12h.01M12 12h.01M19 12h.01',
      search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3',
    }

    function Icon({ name, size, title }) {
      const d = ICON_PATHS[name] ?? ICON_PATHS.gear
      return h('svg', {
        className: 'daf-icon',
        width: size ?? 13,
        height: size ?? 13,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': title ? undefined : 'true',
        role: title ? 'img' : undefined,
        focusable: 'false',
      }, title ? h('title', null, title) : null, h('path', { d }))
    }

    class SafeRender extends React.Component {
      constructor(props) {
        super(props)
        this.state = { error: null }
      }

      static getDerivedStateFromError(error) {
        return { error }
      }

      componentDidCatch(error) {
        try {
          console.warn('[dsh-agent-flow] render failed:', error)
        } catch {
        }
      }

      render() {
        if (this.state.error) {
          const message = String((this.state.error && this.state.error.message) || this.state.error)
          return h('div', { className: 'daf-scope', style: { padding: 10, display: 'flex', flexDirection: 'column', gap: 6 } },
            h(StyleTag, { css: BASE_CSS }),
            h('div', { className: 'daf-error' }, `Agent Flow 渲染失败：${message}`),
            h('div', { className: 'daf-muted' }, '按 F12 打开控制台可看到完整堆栈；这是插件的渲染缺陷，不是宿主的问题。'),
            h('div', { className: 'daf-muted' }, '可以先点下面的按钮重试，或刷新页面。'),
            h(Btn, { onClick: () => this.setState({ error: null }) }, '重试'))
        }
        return this.props.children
      }
    }

    function RowSwitch({ checked, onChange, label }) {
      const [pulse, setPulse] = useState(false)
      return h('span', { style: { display: 'inline-flex' } },
        h('button', {
          type: 'button',
          className: 'daf-switch',
          role: 'switch',
          'aria-checked': checked === true,
          'aria-label': label,
          'data-pulse': String(pulse),
          onClick: (event) => {
            event.stopPropagation()
            event.preventDefault()
            setPulse(true)
            setTimeout(() => setPulse(false), 340)
            onChange(!checked)
          },
        }, h('span', { className: 'daf-switch-dot' })))
    }

    function TriSwitch({ state, onClick, label }) {
      return h('button', {
        type: 'button',
        className: 'daf-tri',
        'data-state': state,
        role: 'switch',
