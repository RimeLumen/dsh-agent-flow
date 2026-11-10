/* @client-shard: 09-entry */
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
                    h('strong', null, t.outline),
                    h('button', { type: 'button', className: 'daf-dock-switch', onClick: () => setOutlineOpen(false) }, t.close)),
                  h('div', { className: 'daf-outline-body' }, outlineRows))
                : null,
              flowDockView,
              showDevPanels ? h(DevLayer, { selected, t, mutate, statusOf, run, checkpoint, current, setError, childrenOf, ctx, issues, runId, setSelectedId, addChild, control, nodesById, steps }) : null,
            ))
    }

    function apply(ctx) {
      const disposers = []
      try {
        const locale = ctx.get('locale')
        if (locale && typeof locale.register === 'function') {
          disposers.push(locale.register('dsh-agent-flow', 'zh', DICT.zh))
          disposers.push(locale.register('dsh-agent-flow', 'en', DICT.en))
        }
      } catch {
      }

      const disposeInjector = ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
        name: 'conversation.input.dock',
        id: 'agent-flow-injector',
        order: 50,
        label: () => 'Agent Flow',
      }, (slotProps) => h(SafeRender, null, h(InjectorBar, { ctx, sessionId: slotProps?.sessionId, workspaceId: slotProps?.session?.workspaceId }))))
      disposers.push(disposeInjector)

      const disposeSettings = ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: 'agent-flow',
        order: 60,
        label: () => dictFor(ctx).settingsTitle,
      }, () => h(SettingsSection, { ctx })))
      disposers.push(disposeSettings)

      const reportMount = (mode, detail) => {
        uiState.set({ mount: mode, mountError: detail ?? null })
        if (mode === 'error') {
          try {
            console.warn(`[dsh-agent-flow] canvas mount failed: ${detail}`)
          } catch {
          }
        }
      }

      const disposeNative = ctx.inject(['sidebarRightTabs'], (injected) => {
        const tabs = injected.get('sidebarRightTabs')
        if (!tabs || typeof tabs.register !== 'function') return undefined
        const local = []
        try {
          local.push(tabs.register({
            id: TAB_ID,
            kind: TAB_KIND,
            multiple: false,
            keepMounted: true,
            title: () => dictFor(ctx).tabTitle,
            guide: [{
              id: TAB_KIND,
              order: 300,
              title: () => dictFor(ctx).tabTitle,
              description: () => dictFor(ctx).settingsLead,
            }],
          }))
        } catch (problem) {
          reportMount('error', `registerTab: ${problem?.message ?? problem}`)
          return undefined
        }
        try {
          local.push(ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
            name: 'sidebar.right.pane.tab',
            key: TAB_ID,
            inject: (sessionId) => ({ sessionId }),
          }, (slotProps) => h(SafeRender, null, h(CanvasTab, { ctx, sessionId: slotProps?.sessionId, workspaceId: slotProps?.workspaceId })))))
          local.push(ctx.slots.inject('sidebar.right.pane.tab.title', () => ctx.slots.register({
            name: 'sidebar.right.pane.tab.title',
            key: TAB_ID,
            inject: (sessionId) => ({ sessionId }),
          }, () => h(CanvasTabTitle, { ctx }))))
        } catch (problem) {
          reportMount('error', `pane tab slot: ${problem?.message ?? problem}`)
          for (const dispose of local.reverse()) {
            try {
              dispose?.()
            } catch {
            }
          }
          return undefined
        }
        reportMount('native')
        return () => {
          for (const dispose of local.reverse()) {
            try {
              dispose?.()
            } catch {
            }
          }
        }
      })
      disposers.push(typeof disposeNative === 'function' ? disposeNative : () => {})

      const disposeHeader = ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({
        name: 'conversation.session.header.utilities',
        id: 'agent-flow-open',
        order: 40,
        label: () => dictFor(ctx).openCanvas,
      }, (slotProps) => h(HeaderButton, { ctx, sessionId: slotProps?.sessionId })))
      disposers.push(disposeHeader)

      const disposeOverlay = ctx.slots.inject('shell.overlay', () => ctx.slots.register({
        name: 'shell.overlay',
        id: 'agent-flow-float',
        order: 40,
        label: () => dictFor(ctx).openCanvas,
      }, () => h(SafeRender, null, h(FloatingCanvas, { ctx }))))
      disposers.push(disposeOverlay)

      const disposePanelEntry = ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
        name: 'sidebar.panellist',
        id: 'agent-flow',
        order: 60,
        label: () => dictFor(ctx).tabTitle,
      }, () => h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 6 } },
        h(Icon, { name: 'bolt' }),
        h('span', null, dictFor(ctx).tabTitle))))
      disposers.push(disposePanelEntry)

      const disposeMainPanel = ctx.slots.inject('main', () => ctx.slots.register({
        name: 'main',
        key: 'agent-flow',
      }, () => h(SafeRender, null, h('div', { className: 'daf-scope', style: { height: '100%', minHeight: 0 } },
        h(CanvasTab, { ctx })))))
      disposers.push(disposeMainPanel)

      return () => {
        for (const dispose of disposers.reverse()) {
          try {
            dispose?.()
          } catch {
          }
        }
      }
    }

    return { inject: ['slots'], apply }
  },
})
