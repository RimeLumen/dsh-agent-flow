/* @client-shard: 09-entry */
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
                    previewPath,
                    edgeDragPreview),
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
