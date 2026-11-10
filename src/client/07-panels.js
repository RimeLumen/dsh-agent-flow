/* @client-shard: 07-panels */
        'aria-checked': state === 'all',
        'aria-label': label,
        onClick: (event) => {
          event.stopPropagation()
          onClick(state !== 'all')
        },
      }, h('span', { className: 'daf-tri-dot' }))
    }

    function renderManagedList({ items, isSelected, onToggle, onGroupToggle, t, flashKey, keyPrefix, collapsed = {}, onCollapseToggle, labelOf }) {
      const nameOf = (key) => (typeof labelOf === 'function' ? labelOf(key) : key)
      const groupKeyOf = (item) => item.parent || item.category || item.source || 'other'
      const groups = new Map()
      for (const item of items) {
        const key = groupKeyOf(item)
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key).push(item)
      }
      const nodes = []
      const ordered = [...groups.entries()].sort((a, b) => {
        if (a[0] === 'other') return 1
        if (b[0] === 'other') return -1
        return nameOf(a[0]).localeCompare(nameOf(b[0]))
      })
      for (const [source, groupItems] of ordered) {
        const folded = collapsed[source] === true
        const selectedCount = groupItems.filter((item) => isSelected(item.name)).length
        const state = selectedCount === 0 ? 'none' : selectedCount === groupItems.length ? 'all' : 'some'
        const officialCount = groupItems.filter((item) => item.official === true).length
        nodes.push(h('div', { key: `${keyPrefix}:head:${source}`, className: 'daf-group-head' },
          h(TriSwitch, {
            state,
            label: `${nameOf(source)} (${selectedCount}/${groupItems.length})`,
            onClick: (next) => onGroupToggle(groupItems.map((item) => item.name), next),
          }),
          h('button', {
            type: 'button',
            className: 'daf-group-name daf-group-toggle',
            'aria-expanded': String(!folded),
            title: t.groupToggle,
            onClick: () => onCollapseToggle?.(source),
          }, `${folded ? '▸' : '▾'} ${nameOf(source)}`),
          officialCount > 0 ? h('span', { className: 'daf-tag daf-tag-ai' }, `★ ${officialCount}`) : null,
          h('span', { className: 'daf-spacer' }),
          h('span', { className: 'daf-muted' }, `${selectedCount}/${groupItems.length}`)))
        if (folded) continue
        for (const item of groupItems.slice(0, 300)) {
          const on = isSelected(item.name)
          nodes.push(h('label', {
            key: `${keyPrefix}:${item.name}`,
            className: 'daf-row',
            'data-on': String(on),
            'data-flash': String(flashKey === item.name),
          },
            h(RowSwitch, { checked: on, onChange: () => onToggle(item.name), label: item.name }),
            h('span', { className: 'daf-row-main' },
              h('span', { className: 'daf-row-name', title: item.name },
                item.official === true ? h(Icon, { name: 'star', size: 11 }) : null,
                ' ',
                item.name),
              h('span', { className: 'daf-row-desc' }, `${item.official === true ? `${t.official} · ` : ''}${item.description || item.whenToUse || ''}`))))
        }
      }
      return nodes
    }

    function InjectorBar(props) {
      const { ctx, sessionId, workspaceId } = props
      const t = dictFor(ctx)
      const [open, setOpen] = useState(false)
      const [catalog, setCatalog] = useState(null)
      const [profiles, setProfiles] = useState([])
      const [effective, setEffective] = useState(null)
      const [draft, setDraft] = useState({ mode: 'index', tools: { allow: [], deny: [] }, skills: { preload: [], index: [] }, name: '' })
      const [collapsedGroups, setCollapsedGroups] = useState({})
      const toggleGroupFold = (key) => setCollapsedGroups((prev) => ({ ...prev, [key]: prev[key] !== true }))
      const [query, setQuery] = useState('')
      const [sourceFilter, setSourceFilter] = useState('')
      const [error, setError] = useState(null)
      const [busy, setBusy] = useState(false)
      const [savedAt, setSavedAt] = useState(0)
      const [reloadToken, setReloadToken] = useState(0)
      const [flashKey, setFlashKey] = useState(null)
      const [presetOpen, setPresetOpen] = useState(false)
      const plan = usePlan(sessionId)
      const [hostCaps, setHostCaps] = useState(null)
      useEffect(() => {
        let closed = false
        void loadDiagnostics()
          .then((result) => {
            if (!closed) setHostCaps(result)
          })
          .catch(() => {
            if (!closed) setHostCaps({ unreachable: true })
          })
        return () => {
          closed = true
        }
      }, [])
      useEffect(() => {
        let closed = false
        void api.probeArchive().then((supported) => {
          if (!closed) setHostCaps((prev) => ({ ...(prev ?? {}), archiveSupported: supported }))
        })
        return () => {
          closed = true
        }
      }, [])
      const hostStale = hostCaps !== null
        && (hostCaps.unreachable === true
          || (hostCaps.tools && hostCaps.tools.flow_plan !== true)
          || hostCaps.archiveSupported === false)
      const setFlash = useCallback((name) => {
        setFlashKey(name)
        setTimeout(() => setFlashKey(null), 360)
      }, [])

      const reload = useCallback(async () => {
        setError(null)
        try {
          const [snapshot, list, eff] = await Promise.all([
            api.catalog(sessionId ?? '', sessionCwd(ctx, sessionId, props) ?? ''),
            api.selection(),
            api.effective(sessionId ?? '', workspaceId ?? ''),
          ])
          setCatalog(snapshot)
          setProfiles(list.profiles ?? [])
          setEffective(eff)
          const matched = (list.profiles ?? []).find((profile) => profile.id === eff.profileId)
          setDraft({
            id: matched?.id,
            mode: eff.mode ?? 'index',
            name: matched?.name ?? '',
            tools: { allow: matched?.tools?.allow ?? [], deny: matched?.tools?.deny ?? [] },
            skills: {
              preload: [],
              index: [...new Set([...(matched?.skills?.preload ?? []), ...(matched?.skills?.index ?? [])])],
            },
          })
        } catch (problem) {
          setError(problem.message)
        }
      }, [sessionId, workspaceId, ctx])

      useEffect(() => {
        void reload()
      }, [reload, reloadToken])

      const skillNames = useMemo(() => new Set([...(draft.skills.preload ?? []), ...(draft.skills.index ?? [])]), [draft])
      const toolAllowed = useMemo(() => new Set(draft.tools.allow ?? []), [draft])

      const toggleSkill = (name) => setDraft((prev) => {
        const has = (prev.skills.index ?? []).includes(name) || (prev.skills.preload ?? []).includes(name)
        const next = {
          ...prev,
          skills: {
            preload: (prev.skills.preload ?? []).filter((item) => item !== name),
            index: has ? (prev.skills.index ?? []).filter((item) => item !== name) : [...(prev.skills.index ?? []), name],
          },
        }
        return next
      })

      const toggleTool = (name) => setDraft((prev) => ({
        ...prev,
        tools: {
          ...prev.tools,
          allow: (prev.tools.allow ?? []).includes(name)
            ? (prev.tools.allow ?? []).filter((item) => item !== name)
            : [...(prev.tools.allow ?? []), name],
        },
      }))

      const draftFromProfile = (profile) => ({
        id: profile.id,
        mode: profile.mode,
        name: profile.name,
        tools: { allow: profile.tools?.allow ?? [], deny: profile.tools?.deny ?? [] },
        skills: {
          preload: [],
          index: [...new Set([...(profile.skills?.preload ?? []), ...(profile.skills?.index ?? [])])],
        },
      })

      const editPreset = (profile) => {
        setDraft(draftFromProfile(profile))
        setPresetOpen(false)
        setOpen(true)
      }

      const newPreset = () => {
        setDraft({ id: undefined, mode: 'index', name: '', tools: { allow: [], deny: [] }, skills: { preload: [], index: [] } })
        setPresetOpen(false)
        setOpen(true)
      }

      const applyPreset = async (profile) => {
        try {
          await api.applyProfile(profile.id, sessionId ?? '', workspaceId ?? '')
          setReloadToken((value) => value + 1)
        } catch (problem) {
          setError(problem.message)
        }
      }

      const duplicatePreset = async (profile) => {
        try {
          await api.duplicateProfile(profile.id, '')
          await reload()
        } catch (problem) {
          setError(problem.message)
        }
      }

      const renamePreset = async (profile) => {
        const next = window.prompt(t.presetName, profile.name)
        if (next === null || next.trim() === '') return
        try {
          await api.saveProfile({ ...profile, id: profile.id, name: next.trim() }, sessionId)
          await reload()
        } catch (problem) {
          setError(problem.message)
        }
      }

      const removePreset = async (profile) => {
        if (!window.confirm(`${t.deletePreset} ${profile.name}?`)) return
        try {
          await api.deleteProfile(profile.id)
          await reload()
        } catch (problem) {
          setError(problem.message)
        }
      }

      const regenerateDefault = async () => {
        try {
          await api.regenerateDefault()
          await reload()
        } catch (problem) {
          setError(problem.message)
        }
      }

      const save = async () => {
        setBusy(true)
        setError(null)
        try {
          const name = (draft.name ?? '').trim() || `${t.injectorTitle} ${new Date().toLocaleTimeString('zh-CN')}`
          const target = draft.id ? profiles.find((profile) => profile.id === draft.id) : undefined
          const scope = target?.scope ?? (sessionId ? { kind: 'session', sessionId } : { kind: 'global' })
          const selected = [...new Set([...(draft.skills.index ?? []), ...(draft.skills.preload ?? [])])]
          await api.saveProfile({
            id: draft.id,
            name,
            scope,
            mode: draft.mode,
            tools: { allow: draft.tools.allow ?? [], deny: draft.tools.deny ?? [] },
            skills: draft.mode === 'preload' ? { preload: selected, index: [] } : { preload: [], index: selected },
          }, sessionId)
          setSavedAt(Date.now())
          await reload()
        } catch (problem) {
          setError(problem.message)
        } finally {
          setBusy(false)
        }
      }

      const skills = catalog?.skills ?? []
      const tools = catalog?.tools ?? []
      const groupKeyOf = (item) => item.parent || item.category || item.source || 'other'
      const filterGroups = useMemo(() => {
        const set = new Set([...skills.map(groupKeyOf), ...tools.map(groupKeyOf)])
        return [...set].filter(Boolean).sort((a, b) => (a === 'other' ? 1 : b === 'other' ? -1 : a.localeCompare(b)))
      }, [skills, tools])
      const filterLabelOf = (key) => groupLabelOf(skills.some((s) => groupKeyOf(s) === key) ? 'skill' : 'tool', key, langOf(ctx))
      const matchText = (item) => {
        if (sourceFilter && groupKeyOf(item) !== sourceFilter) return false
        if (!query.trim()) return true
        const needle = query.trim().toLowerCase()
        return item.name.toLowerCase().includes(needle) || String(item.description ?? '').toLowerCase().includes(needle)
      }
      const visibleSkills = useMemo(() => skills.filter(matchText), [skills, query, sourceFilter, matchText])
      const visibleTools = useMemo(() => tools.filter(matchText), [tools, query, sourceFilter, matchText])
      const selectedSkillCount = skillNames.size
      const selectedToolCount = toolAllowed.size

      return h('div', { className: 'daf-scope' },
        h(StyleTag, { css: BASE_CSS }),
        h('div', { className: `daf-bar${selectedSkillCount + selectedToolCount > 0 ? '' : ' daf-bar-compact'}`, 'data-mode': draft.mode },
          h('button', {
            type: 'button',
            className: 'daf-chip',
            'data-active': String(open),
            'aria-expanded': open,
            onClick: () => setOpen((value) => !value),
            title: t.injectorTitle,
          },
            h('span', null, '⚙'),
            h('span', null, t.injectorTitle),
            h('span', { className: 'daf-chip-count' }, `${selectedSkillCount}/${skills.length} · ${draft.mode === 'whitelist' ? selectedToolCount : t.injectorAll}`)),
          h('span', { className: 'daf-chip', title: t.injectorMode },
            h('span', null, `${t.injectorMode}:`),
            h('span', { className: 'daf-chip-count' },
              draft.mode === 'index' ? t.modeIndex : draft.mode === 'preload' ? t.modePreload : t.modeWhitelist)),
          savedAt > 0 ? h('span', { className: 'daf-muted' }, t.nextTurn) : null,
          h('span', { className: 'daf-spacer' }),
          error ? h('span', { className: 'daf-error', title: error }, `${t.failed}：${String(error).slice(0, 80)}`) : null),
        hostStale
          ? h('div', { className: 'daf-muted', style: { width: '100%', marginTop: 4 } },
            `⚠ ${t.restartHint}${hostCaps?.version ? `（宿主半版本 ${hostCaps.version}）` : ''}${hostCaps?.archiveSupported === false ? '——归档/恢复功能要重启后才有' : ''}`)
          : null,
        plan.status === 'awaiting'
          ? h('div', { className: 'daf-plan daf-glass', style: { marginTop: 6, width: '100%' } },
            h('div', { className: 'daf-muted' }, `${t.planAsk} · ${(plan.steps ?? []).length} ${t.stepsUnit} · ${t.turnLabel} ${plan.turn ?? 1}`),
            h('div', { style: { display: 'flex', gap: 6, flexWrap: 'wrap' } },
              h(Btn, {
                variant: 'primary',
                onClick: async () => {
                  try {
                    await resolvePlan('confirm', sessionId, undefined)
                    setReloadToken((value) => value + 1)
                  } catch (problem) {
                    setError(problem.message)
                  }
                },
              }, t.planConfirm),
              h(Btn, {
                variant: 'primary',
                onClick: () => openCanvas(ctx, sessionId),
              }, `${t.planEdit}`),
              h(Btn, {
                onClick: async () => {
                  try {
                    await resolvePlan('skip', sessionId, undefined)
                    setReloadToken((value) => value + 1)
                  } catch (problem) {
                    setError(problem.message)
                  }
                },
              }, t.planSkip)))
          : null,
        presetOpen
          ? h(Modal, { title: t.presetManager, onClose: () => setPresetOpen(false) },
            h('div', { className: 'daf-col', style: { gap: 8 } },
              h('div', { style: { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' } },
                h(Btn, { onClick: newPreset }, h(Icon, { name: 'plus' }), h('span', { style: { marginLeft: 4 } }, t.newPreset)),
                h(Btn, { onClick: regenerateDefault }, h(Icon, { name: 'refresh' }), h('span', { style: { marginLeft: 4 } }, t.regenerateDefault)),
                h('span', { className: 'daf-spacer' }),
                h('span', { className: 'daf-muted' }, `${t.effective}: ${effective?.profileName ?? '—'}（${effective?.source ?? 'default'}）`)),
              profiles.length === 0 ? h('div', { className: 'daf-muted' }, t.presetsEmpty) : null,
              profiles.map((profile) => h('div', {
                key: profile.id,
                className: 'daf-preset',
                'data-default': String(profile.origin === 'ai-default'),
                'data-active': String(profile.id === effective?.profileId),
              },
                h('div', { className: 'daf-preset-main' },
                  h('div', { className: 'daf-preset-name' },
                    h(Icon, { name: profile.origin === 'ai-default' ? 'robot' : 'layers' }),
                    h('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, profile.name),
                    profile.origin === 'ai-default' ? h('span', { className: 'daf-tag daf-tag-ai' }, t.aiConfigured) : null,
                    profile.auto === true ? h('span', { className: 'daf-tag' }, 'auto') : null,
                    h('span', { className: 'daf-tag' },
                      profile.scope?.kind === 'session' ? t.scopeSession : profile.scope?.kind === 'workspace' ? 'workspace' : t.scopeGlobal)),
                  h('div', { className: 'daf-preset-meta' },
                    `${t.tools} ${profile.tools?.allow?.length ?? 0} · ${t.skills} ${(profile.skills?.index?.length ?? 0) + (profile.skills?.preload?.length ?? 0)} · ${profile.mode}`)),
                h('div', { style: { display: 'flex', gap: 4, flexWrap: 'wrap' } },
                  h(Btn, { variant: 'primary', onClick: () => applyPreset(profile) }, t.apply),
                  h(Btn, { onClick: () => editPreset(profile) }, h(Icon, { name: 'save' })),
                  h(Btn, { onClick: () => duplicatePreset(profile), title: t.duplicate }, h(Icon, { name: 'copy' })),
                  h(Btn, { onClick: () => renamePreset(profile), title: t.rename }, t.rename),
                  profile.origin === 'ai-default' ? null : h(Btn, { variant: 'danger', onClick: () => removePreset(profile), title: t.deletePreset }, h(Icon, { name: 'trash' })))))))
          : null,
        open ? h('div', { className: 'daf-panel' },
          h('div', { className: 'daf-panel-head' },
            h('input', {
              className: 'daf-input',
              style: { maxWidth: 260 },
              placeholder: t.search,
              value: query,
              onChange: (event) => setQuery(event.target.value),
            }),
            h('select', {
              className: 'daf-select',
              style: { maxWidth: 180 },
              value: sourceFilter,
              onChange: (event) => setSourceFilter(event.target.value),
            },
              h('option', { value: '' }, t.allSources),
              filterGroups.map((key) => h('option', { key, value: key }, filterLabelOf(key)))),
            h('span', { className: 'daf-spacer' }),
            h('button', { type: 'button', className: 'daf-chip', title: t.retry, onClick: () => setReloadToken((value) => value + 1) }, h(Icon, { name: 'refresh' })),
            h(Btn, { onClick: () => setPresetOpen(true), title: t.presetManager },
              h(Icon, { name: 'layers' }),
              h('span', { style: { marginLeft: 4 } }, `${t.presetManager}${profiles.length > 0 ? ` ${profiles.length}` : ''}`)),
            h(Btn, { onClick: () => setOpen(false) }, h(Icon, { name: 'cross' }))),
          h('div', { className: 'daf-panel-body' },
            h('div', { className: 'daf-col' },
              h('div', { className: 'daf-col-head' },
                h('span', null, `${t.skills} (${visibleSkills.length})`),
                h('span', { className: 'daf-spacer' }),
                h('button', {
                  type: 'button',
                  className: 'daf-chip',
                  onClick: () => setDraft((prev) => ({ ...prev, skills: { ...prev.skills, index: visibleSkills.map((s) => s.name) } })),
                }, t.selectAll),
                h('button', {
                  type: 'button',
                  className: 'daf-chip',
                  title: t.selectOfficial,
                  onClick: () => setDraft((prev) => ({
                    ...prev,
                    skills: { ...prev.skills, index: [...new Set([...(prev.skills.index ?? []), ...visibleSkills.filter((item) => item.official === true).map((item) => item.name)])] },
                  })),
                }, `★ ${t.official}`),
                h('button', {
                  type: 'button',
                  className: 'daf-chip',
                  onClick: () => setDraft((prev) => ({ ...prev, skills: { preload: [], index: [] } })),
                }, t.clearAll)),
              h('div', { className: 'daf-list' },
                renderManagedList({
                  items: visibleSkills,
                  isSelected: (name) => skillNames.has(name),
                  onToggle: (name) => {
                    setFlash(name)
                    toggleSkill(name)
                  },
                  onGroupToggle: (names, next) => setDraft((prev) => ({
                    ...prev,
                    skills: {
                      ...prev.skills,
                      index: next
                        ? [...new Set([...(prev.skills.index ?? []), ...names])]
                        : (prev.skills.index ?? []).filter((item) => !names.includes(item)),
                    },
                  })),
                  t,
                  flashKey,
                  keyPrefix: 'skill',
                  collapsed: collapsedGroups,
                  onCollapseToggle: toggleGroupFold,
                  labelOf: (key) => groupLabelOf('skill', key, langOf(ctx)),
                }))),
            h('div', { className: 'daf-col' },
              h('div', { className: 'daf-col-head' },
                h('span', null, `${t.tools} (${visibleTools.length})`),
                h('span', { className: 'daf-spacer' }),
                h('button', {
                  type: 'button',
                  className: 'daf-chip',
                  onClick: () => setDraft((prev) => ({ ...prev, tools: { ...prev.tools, allow: visibleTools.map((item) => item.name) } })),
                }, t.selectAll),
                h('button', {
                  type: 'button',
                  className: 'daf-chip',
                  title: t.selectOfficial,
                  onClick: () => setDraft((prev) => ({
                    ...prev,
                    mode: 'whitelist',
                    tools: { ...prev.tools, allow: [...new Set([...(prev.tools.allow ?? []), ...visibleTools.filter((item) => item.official === true).map((item) => item.name)])] },
                  })),
                }, `★ ${t.official}`),
                h('button', {
                  type: 'button',
                  className: 'daf-chip',
                  onClick: () => setDraft((prev) => ({ ...prev, tools: { ...prev.tools, allow: [] } })),
                }, t.clearAll)),
              h('div', { className: 'daf-list' },
                renderManagedList({
                  items: visibleTools,
                  isSelected: (name) => toolAllowed.has(name),
                  onToggle: (name) => {
                    setFlash(name)
                    toggleTool(name)
                  },
                  onGroupToggle: (names, next) => setDraft((prev) => ({
                    ...prev,
                    tools: {
                      ...prev.tools,
                      allow: next
                        ? [...new Set([...(prev.tools.allow ?? []), ...names])]
                        : (prev.tools.allow ?? []).filter((item) => !names.includes(item)),
                    },
                  })),
                  t,
                  flashKey,
                  keyPrefix: 'tool',
                  collapsed: collapsedGroups,
                  onCollapseToggle: toggleGroupFold,
                  labelOf: (key) => groupLabelOf('tool', key, langOf(ctx)),
                })))),
          h('div', { className: 'daf-panel-head', style: { borderTop: '1px solid var(--dsw-alias-border-l1)', borderBottom: 'none', flexWrap: 'wrap' } },
            h(Field, { label: t.injectorMode },
              h('select', {
                className: 'daf-select',
                value: draft.mode,
                onChange: (event) => setDraft((prev) => ({ ...prev, mode: event.target.value })),
              },
                h('option', { value: 'index' }, `${t.modeIndex} — ${t.modeIndexHint}`),
                h('option', { value: 'preload' }, `${t.modePreload} — ${t.modePreloadHint}`),
                h('option', { value: 'whitelist' }, `${t.modeWhitelist} — ${t.modeWhitelistHint}`))),
            h(Field, { label: t.presetName },
              h('input', {
                className: 'daf-input',
                value: draft.name,
                placeholder: sessionId ? t.scopeSession : t.scopeGlobal,
                onChange: (event) => setDraft((prev) => ({ ...prev, name: event.target.value })),
              })),
            h('span', { className: 'daf-spacer' }),
            h('span', { className: 'daf-muted' }, sessionId ? t.nextTurn : t.noAgent),
            h(Btn, { variant: 'primary', onClick: save, disabled: busy }, busy ? t.saving : t.save)),
          profiles.length > 0 ? h('div', { className: 'daf-panel-head', style: { borderBottom: 'none', flexWrap: 'wrap' } },
            h('span', { className: 'daf-muted' }, `${t.scope}：`),
            profiles.slice(0, 12).map((profile) => h(Btn, {
              key: profile.id,
              onClick: () => setDraft({
                id: profile.id,
                mode: profile.mode,
                name: profile.name,
                tools: { allow: profile.tools?.allow ?? [], deny: profile.tools?.deny ?? [] },
                skills: {
                  preload: [],
                  index: [...new Set([...(profile.skills?.preload ?? []), ...(profile.skills?.index ?? [])])],
                },
              }),
              title: `${profile.scope?.kind ?? 'global'}`,
            }, profile.name))) : null,
          catalog && (catalog.warnings?.length > 0 || catalog.errors?.length > 0)
            ? h('div', { className: 'daf-panel-head', style: { borderBottom: 'none' } },
              h('span', { className: 'daf-muted' }, [...(catalog.warnings ?? []), ...(catalog.errors ?? [])].join(' · ')))
            : null)
          : null)
    }

    function SettingsSection(props) {
      const { ctx } = props
      const t = dictFor(ctx)
      const [prefs, setPrefs] = useState(null)
      const [diag, setDiag] = useState(null)
      const [error, setError] = useState(null)
      const [busy, setBusy] = useState(false)
      const [importMode, setImportMode] = useState('merge')
      const [errorLog, setErrorLog] = useState(null)

      const load = useCallback(async () => {
        try {
          const [prefResult, diagnostic, errorResult] = await Promise.all([api.prefs(), loadDiagnostics(), api.errors(30)])
          setPrefs(prefResult.prefs)
          setDiag(diagnostic)
          setErrorLog(errorResult)
          setError(null)
        } catch (problem) {
          setError(problem.message)
        }
      }, [])
      useEffect(() => {
        void load()
      }, [load])

      const save = async (patch) => {
        setBusy(true)
        try {
          const result = await api.savePrefs(patch)
          setPrefs(result.prefs)
        } catch (problem) {
          setError(problem.message)
        } finally {
          setBusy(false)
        }
      }

      const doExport = async () => {
        try {
          const data = await api.exportData()
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const anchor = document.createElement('a')
          anchor.href = url
          anchor.download = `agent-flow-${new Date().toISOString().slice(0, 10)}.json`
          anchor.click()
          setTimeout(() => URL.revokeObjectURL(url), 4000)
        } catch (problem) {
          setError(problem.message)
        }
      }

      const doImport = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return
        try {
          const text = await file.text()
          const data = JSON.parse(text)
          await api.importData(data, importMode)
          await load()
        } catch (problem) {
          setError(problem.message)
        } finally {
          event.target.value = ''
        }
      }

      if (!prefs) {
        return h('div', { className: 'daf-scope' }, h(StyleTag, { css: BASE_CSS }),
          h('div', { className: 'daf-section' }, h('h3', null, t.settingsTitle), h('div', { className: 'daf-muted' }, error ?? t.loading)))
      }

      return h('div', { className: 'daf-scope' },
        h(StyleTag, { css: BASE_CSS }),
        h('div', { className: 'daf-section' },
          h('h3', null, t.settingsTitle),
          h('div', { className: 'daf-muted' }, t.settingsLead),
          error ? h('div', { className: 'daf-error' }, error) : null,
          h('div', { className: 'daf-grid2' },
            h(Field, { label: t.defaultMode, hint: t.modeIndexHint },
              h('select', {
                className: 'daf-select',
                value: prefs.mode,
                onChange: (event) => save({ mode: event.target.value }),
              },
                h('option', { value: 'index' }, t.modeIndex),
                h('option', { value: 'preload' }, t.modePreload),
                h('option', { value: 'whitelist' }, t.modeWhitelist))),
            h(Field, { label: t.budget },
              h('input', {
                className: 'daf-input',
                type: 'number',
                min: 1000,
                max: 200000,
                defaultValue: prefs.promptBudget,
                onBlur: (event) => save({ promptBudget: Number(event.target.value) }),
              })),
            h(Field, { label: t.maxParallel },
              h('input', {
                className: 'daf-input',
                type: 'number',
                min: 1,
                max: 8,
                defaultValue: prefs.maxParallel,
                onBlur: (event) => save({ maxParallel: Number(event.target.value) }),
              })),
            h(Field, { label: t.nodeTimeout },
              h('input', {
                className: 'daf-input',
                type: 'number',
                min: 1000,
                max: 3600000,
                step: 1000,
                defaultValue: prefs.nodeTimeoutMs,
                onBlur: (event) => save({ nodeTimeoutMs: Number(event.target.value) }),
              })),
            h(Field, { label: t.planWait, hint: t.planWaitHint },
              h('input', {
                className: 'daf-input',
                type: 'number',
                min: 5000,
                max: 3600000,
                step: 5000,
                defaultValue: prefs.planTimeoutMs,
                onBlur: (event) => save({ planTimeoutMs: Number(event.target.value) }),
              })),
            h('div', { className: 'daf-field' },
              h('span', { className: 'daf-field-label' }, t.lockoutGuard),
              h('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } },
                h(Switch, { checked: prefs.lockoutGuard !== false, onChange: (value) => save({ lockoutGuard: value }) }),
                h('span', { className: 'daf-muted' }, prefs.lockoutGuard !== false ? t.on : t.off))),
            h('div', { className: 'daf-field' },
              h('span', { className: 'daf-field-label' }, t.contrast),
              h('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } },
                h(Switch, { checked: prefs.highContrast === true, onChange: (value) => save({ highContrast: value }) }),
                h('span', { className: 'daf-muted' }, prefs.highContrast === true ? t.on : t.off))),
            h('div', { className: 'daf-field' },
              h('span', { className: 'daf-field-label' }, t.exportData),
              h('div', { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } },
                h(Btn, { onClick: doExport, disabled: busy }, t.exportData),
                h('select', {
                  className: 'daf-select',
                  style: { maxWidth: 120 },
                  value: importMode,
                  onChange: (event) => setImportMode(event.target.value),
                },
                  h('option', { value: 'merge' }, t.importMerge),
                  h('option', { value: 'replace' }, t.importReplace)),
                h('label', { className: 'daf-btn' }, t.importData,
                  h('input', { type: 'file', accept: 'application/json', style: { display: 'none' }, onChange: doImport }))))),
          h('div', { className: 'daf-note' },
            h('div', { className: 'daf-muted' }, `${t.dataPath}: ${diag?.store?.file ?? '—'}`),
            h('div', { className: 'daf-muted' }, `${t.hostVersion}: ${diag?.version ?? '—'}`),
            diag && diag.tools && diag.tools.flow_plan === false
              ? h('div', { className: 'daf-error' }, t.restartHint)
              : null,
            diag && diag.tools && diag.tools.flow_plan === true && errorLog === null
              ? h('div', { className: 'daf-muted' }, t.errorsUnavailable)
              : null,
            h('div', { className: 'daf-muted' }, `profiles ${diag?.store?.profiles ?? 0} · flows ${diag?.store?.workflows ?? 0} · runs ${diag?.runs?.length ?? 0}`),
            diag?.store?.loadError ? h('div', { className: 'daf-error' }, diag.store.loadError) : null,
            h('div', { className: 'daf-muted' }, Object.entries(diag?.services ?? {}).map(([key, value]) => `${key}:${value ? '✓' : '×'}`).join('  '))),
          h('div', { className: 'daf-note' },
            h('div', { style: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' } },
              h('strong', null, t.errors),
              h('span', { className: 'daf-muted' }, `${errorLog?.stats?.kept ?? 0} / ${errorLog?.stats?.limit ?? 0}`),
              h('span', { className: 'daf-muted' }, errorLog?.stats?.file ?? ''),
              h('span', { className: 'daf-spacer' }),
              h(Btn, {
                onClick: async () => {
                  try {
                    await api.clearErrors()
                    await load()
                  } catch (problem) {
                    setError(problem.message)
                  }
                },
                disabled: busy,
              }, t.errorsClear)),
            h('div', { className: 'daf-muted' },
              Object.entries(errorLog?.stats?.byCode ?? {}).map(([code, count]) => `${code}×${count}`).join('  ') || t.errorsEmpty),
            (errorLog?.items ?? []).slice(0, 5).map((item) => h('div', {
              key: item.id,
              className: 'daf-issue',
              'data-level': item.severity === 'warn' ? 'warn' : 'error',
            },
              h('span', null, item.code),
              h('span', { title: item.message }, `${String(item.message).slice(0, 70)}${item.at ? ` · ${new Date(item.at).toLocaleTimeString('zh-CN')}` : ''}`))))))
    }

    const activeRun = createStore({ runId: null, status: 'idle', cursor: [] })

    const uiState = createStore({ overlayOpen: false, sessionId: undefined, mount: 'unknown', mountError: null })

    function defaultParams(kind) {
      switch (kind) {
        case 'inject.context':
          return { includeSkills: true, includeTools: true }
        case 'inject.skill':
          return { names: [], body: true, budget: 8000 }
        case 'agent.task':
          return { target: 'subagent', prompt: '把这一步要做的事写在这里', waitForIdle: false }
        case 'tool.call':
          return { name: '', argsTemplate: '{}', allowDangerous: false }
        case 'branch.condition':
          return { cases: [{ port: 'true', when: 'truthy(last)' }] }
        case 'flow.parallel':
          return {}
        case 'flow.join':
          return { mode: 'all', failFast: true }
        case 'flow.loop':
          return { maxIterations: 5 }
        case 'flow.wait':
          return { ms: 1000 }
        case 'human.checkpoint':
          return { question: '这一步可以继续吗？', options: ['继续', '停止'] }
        case 'io.output':
          return { template: '{{last.text}}', appendToChat: false }
        case 'subflow.call':
          return { workflowId: '' }
        case 'group.steps':
          return { note: '' }
        default:
          return {}
      }
    }

    function clone(value) {
      try {
        return JSON.parse(JSON.stringify(value))
      } catch {
        return value
      }
    }

    /**
     * 流程管理（独立组件）：列表 + 回收站 + 批量操作。
     * 从画布主图层抽出；自身只做渲染与选择状态，数据与处理器由 props 传入。
     *
     * 回收站视图（showArchived=true）下：
     *   - 每行复选框选择；点击行切换选中
     *   - 顶部批量操作条：全选 / 清空选择 / 批量复原 / 批量删除
     *   - 每行右键菜单仍提供单个复原 / 永久删除（3 秒倒计时防误删）
     */
    function FlowManager(props) {
      const {
        flows, current, sessionId, t, h: hh, Icon: Ic, Btn: Bt,
        pickFlow, duplicateFlow, restoreFlowById, archiveFlowById, requestPurge,
        flowMenu, setFlowMenu, purgePendingId, setPurgePendingId,
        showArchived, setShowArchived, batchOperation,
      } = props
      const [selectedIds, setSelectedIds] = useState(() => new Set())
      const [batchBusy, setBatchBusy] = useState(false)

      const archivedRows = flows.filter((item) => item.archivedAt)
      const activeRows = flows.filter((item) => !item.archivedAt)
      const inRecycle = showArchived === true
      const selectable = inRecycle ? archivedRows : activeRows
      const allSelected = selectable.length > 0 && selectable.every((item) => selectedIds.has(item.id))

      const toggleOne = (id) => {
        setSelectedIds((prev) => {
          const next = new Set(prev)
          if (next.has(id)) next.delete(id)
          else next.add(id)
          return next
        })
      }
      const toggleAll = () => {
        setSelectedIds(allSelected ? new Set() : new Set(selectable.map((item) => item.id)))
      }
      // 视图切换后清空选择——两个视图的可选集合不同，残留选择会误伤
      const switchView = () => {
        setSelectedIds(new Set())
        setShowArchived((value) => !value)
      }

      const runBatch = async (action) => {
        if (selectedIds.size === 0 || batchBusy) return
        setBatchBusy(true)
        try {
          await batchOperation(action, [...selectedIds])
          setSelectedIds(new Set())
        } finally {
          setBatchBusy(false)
        }
      }

      const rows = flows.slice(0, 60).map((flow) => {
        const menu = purgePendingId === flow.id
          ? hh('div', { className: 'daf-purge-warn', role: 'alert' },
              hh('span', null, `3 ${t.purgeCountdown}`),
              hh('span', { className: 'daf-purge-bar', 'aria-hidden': 'true' }),
              hh(Bt, { onClick: () => setPurgePendingId(null) }, t.cancel))
          : flowMenu === flow.id
            ? hh('div', { className: 'daf-flow-menu daf-flow-menu-static' },
                hh(Bt, { onClick: () => { setFlowMenu(null); void duplicateFlow(flow) } }, t.duplicate),
                flow.archivedAt
                  ? hh(Bt, { onClick: () => { setFlowMenu(null); void restoreFlowById(flow) } }, t.restoreFlow)
                  : hh(Bt, { onClick: () => { setFlowMenu(null); void archiveFlowById(flow) } }, t.archiveFlow),
                flow.archivedAt
                  ? hh(Bt, { variant: 'danger', onClick: () => { setFlowMenu(null); requestPurge(flow) } }, t.purgeFlow)
                  : null)
            : null
        return hh('div', { key: flow.id, className: 'daf-flow-row' },
          inRecycle && Boolean(flow.archivedAt)
            ? hh('input', {
              type: 'checkbox',
              className: 'daf-flow-check',
              'aria-label': t.selectFlow,
              checked: selectedIds.has(flow.id),
              onChange: () => toggleOne(flow.id),
            })
            : null,
          hh('button', {
            type: 'button',
            className: 'daf-chip daf-flow-row-chip',
            'data-active': String(flow.id === current?.id),
            'data-session': String(Boolean(sessionId) && flow.sessionId === sessionId),
            'data-archived': flow.archivedAt ? 'true' : undefined,
            'data-draft': flow.origin === 'auto-draft' ? 'true' : undefined,
            title: `${flow.name} · ${flow.nodes}${flow.archivedAt ? ` · ${t.archivedBadge}` : ''}${flow.turn ? ` · ${t.turnLabel} ${flow.turn}` : ''}`,
            onClick: () => {
              if (inRecycle && Boolean(flow.archivedAt)) { toggleOne(flow.id); return }
              if (flow.id !== current?.id) void pickFlow(flow.id)
            },
            onContextMenu: (event) => {
              event.preventDefault()
              setFlowMenu((prev) => (prev === flow.id ? null : flow.id))
            },
          },
            Boolean(sessionId) && flow.sessionId === sessionId ? hh(Ic, { name: 'bolt', size: 11 }) : null,
            hh('span', { className: 'daf-flow-name' }, flow.name),
            hh('span', { className: 'daf-chip-count' }, String(flow.nodes))),
          menu)
      })

      return hh('div', { className: 'daf-flow-manager', style: { display: 'flex', flexDirection: 'column', minHeight: 0, flex: '1 1 auto' } },
        hh('div', { className: 'daf-flow-dock-head' },
          hh('span', { className: 'daf-muted' }, `${inRecycle ? t.recycleTitle : t.flowDock} · ${inRecycle ? archivedRows.length : activeRows.length}`),
          hh('span', { className: 'daf-spacer' }),
          hh('button', {
            type: 'button',
            className: 'daf-dock-switch daf-tip',
            'data-tip': inRecycle ? t.backToList : t.recycleTitle,
            onClick: switchView,
          }, inRecycle ? t.backToList : t.recycleTitle)),
        inRecycle && selectable.length > 0
          ? hh('div', { className: 'daf-batch-bar' },
              hh('button', { type: 'button', className: 'daf-dock-switch', onClick: toggleAll },
                allSelected ? t.clearSelection : t.selectAll),
              hh('span', { className: 'daf-muted' }, `${t.selectedCount}: ${selectedIds.size}`),
              hh('span', { className: 'daf-spacer' }),
              hh(Bt, { onClick: () => void runBatch('restore'), disabled: batchBusy }, t.restoreSelected),
              hh(Bt, { variant: 'danger', onClick: () => void runBatch('delete'), disabled: batchBusy }, t.deleteSelected))
          : null,
        flows.length === 0
          ? hh('div', { className: 'daf-muted', style: { padding: '6px 8px' } }, t.canvasEmpty)
          : hh('div', { className: 'daf-flow-manager-list', style: { overflow: 'auto', minHeight: 0 } }, rows))
    }

    /**
     * 开发者面板（独立组件）。
     * 从画布主图层抽出：关闭时完全不实例化；只做渲染、不持有状态——
     * 数据与处理器全部由 CanvasTab 经 props 传入（接口即下面这段解构）。
     */
    function DevLayer(props) {
      const {
        selected, t, mutate, statusOf, run, checkpoint, current, setError, childrenOf,
        ctx, issues, runId, setSelectedId, addChild, control, nodesById, steps,
      } = props
      return [
              h('div', { className: 'daf-inspector' },
                h('div', { className: 'daf-col-head' }, h('span', null, t.inspector)),
                !selected
                  ? h('div', { className: 'daf-muted' }, t.noNode)
                  : h('div', { className: 'daf-col', style: { gap: 8 } },
                    h(Field, { label: t.nodeTitle },
                      h('input', {
                        className: 'daf-input',
                        value: selected.title,
                        onChange: (event) => mutate((wf) => {
                          wf.nodes = wf.nodes.map((node) => (node.id === selected.id ? { ...node, title: event.target.value } : node))
                          return wf
                        }),
                      })),
                    h(Field, { label: t.nodeKind }, h('div', { className: 'daf-muted' }, `${selected.kind} — ${kindLabel(selected.kind, ctx)}`)),
                    selected.kind === 'group.steps'
                      ? h(Field, { label: t.childSteps },
                        h('div', { className: 'daf-col', style: { gap: 4 } },
                          childrenOf(selected.id).map((child) => h('div', { key: child.id, className: 'daf-child' },
                            h('span', { style: { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, child.title),
                            h(Btn, {
                              variant: 'danger',
                              onClick: () => mutate((wf) => {
                                wf.nodes = wf.nodes.filter((node) => node.id !== child.id)
                                wf.edges = wf.edges.filter((edge) => edge.from !== child.id && edge.to !== child.id)
                                return wf
                              }),
                            }, '✕'))),
                          h(Btn, { onClick: () => addChild(selected.id) }, `+ ${t.addStep}`)))
                      : null,
                    selected.parentId
                      ? h(Field, { label: t.boundTo },
                        h('div', { style: { display: 'flex', gap: 6, alignItems: 'center' } },
                          h('span', { className: 'daf-muted' }, nodesById.get(selected.parentId)?.title ?? selected.parentId),
                          h(Btn, {
                            onClick: () => mutate((wf) => {
                              wf.nodes = wf.nodes.map((node) => (node.id === selected.id ? { ...node, parentId: undefined } : node))
                              return wf
                            }),
                          }, t.unbind)))
                      : null,
                    h(Field, { label: t.onError },
                      h('select', {
                        className: 'daf-select',
                        value: selected.onError ?? 'fail',
                        onChange: (event) => mutate((wf) => {
                          wf.nodes = wf.nodes.map((node) => (node.id === selected.id ? { ...node, onError: event.target.value } : node))
                          return wf
                        }),
                      },
                        h('option', { value: 'fail' }, t.errFail),
                        h('option', { value: 'skip' }, t.errSkip),
                        h('option', { value: 'fallback' }, t.errFallback))),
                    selected.onError === 'fallback'
                      ? h(Field, { label: `${t.errFallback} id` },
                        h('select', {
                          className: 'daf-select',
                          value: selected.fallbackTo ?? '',
                          onChange: (event) => mutate((wf) => {
                            wf.nodes = wf.nodes.map((node) => (node.id === selected.id ? { ...node, fallbackTo: event.target.value } : node))
                            return wf
                          }),
                        },
                          h('option', { value: '' }, '—'),
                          current.nodes.filter((node) => node.id !== selected.id).map((node) => h('option', { key: node.id, value: node.id }, `${node.title} (${node.id})`))))
                      : null,
                    h(Field, { label: 'timeoutMs' },
                      h('input', {
                        className: 'daf-input',
                        type: 'number',
                        min: 1000,
                        step: 1000,
                        defaultValue: selected.timeoutMs ?? '',
                        onBlur: (event) => mutate((wf) => {
                          const value = Number(event.target.value)
                          wf.nodes = wf.nodes.map((node) => (node.id === selected.id ? { ...node, timeoutMs: Number.isFinite(value) && value > 0 ? value : undefined } : node))
                          return wf
                        }),
                      })),
                    h(Field, { label: t.nodeNote },
                      h('textarea', {
                        className: 'daf-textarea',
                        style: { minHeight: 48 },
                        value: selected.note ?? '',
                        onChange: (event) => mutate((wf) => {
                          wf.nodes = wf.nodes.map((node) => (node.id === selected.id ? { ...node, note: event.target.value } : node))
                          return wf
                        }),
                      })),
                    h(Field, { label: t.advancedJson, hint: 'params' },
                      h('textarea', {
                        className: 'daf-textarea',
                        key: `${selected.id}:${JSON.stringify(selected.params ?? {})}`,
                        defaultValue: JSON.stringify(selected.params ?? {}, null, 2),
                        onBlur: (event) => {
                          try {
                            const parsed = JSON.parse(event.target.value)
                            mutate((wf) => {
                              wf.nodes = wf.nodes.map((node) => (node.id === selected.id ? { ...node, params: parsed } : node))
                              return wf
                            })
                            setError(null)
                          } catch (problem) {
                            setError(`params JSON: ${problem.message}`)
                          }
                        },
                      })),
                    h('div', { style: { display: 'flex', gap: 6, flexWrap: 'wrap' } },
                      h(Btn, {
                        variant: 'danger',
                        onClick: () => mutate((wf) => {
                          wf.nodes = wf.nodes.filter((node) => node.id !== selected.id)
                          wf.edges = wf.edges.filter((edge) => edge.from !== selected.id && edge.to !== selected.id)
                          if (wf.entry === selected.id) wf.entry = wf.nodes[0]?.id ?? ''
                          return wf
                        }),
                      }, t.deleteNode),
                      h(Btn, {
                        onClick: () => mutate((wf) => {
                          wf.entry = selected.id
                          return wf
                        }),
                        title: t.setEntry,
                      }, t.setEntry),
                      (current.nodes.some((node) => node.id !== selected.id && node.kind === 'flow.loop' && node.params?.fallbackTo !== undefined) ? null : null))),
                h('div', { className: 'daf-col-head', style: { marginTop: 8 } }, h('span', null, t.validate)),
                issues.length === 0
                  ? h('div', { className: 'daf-muted' }, '—')
                  : h('div', { className: 'daf-issues' }, issues.map((issue, index) => h('div', { key: `${issue.code}-${index}`, className: 'daf-issue', 'data-level': issue.level },
                    h('span', null, issue.level === 'error' ? '✕' : '!'),
                    h('span', null, `${issue.message}${issue.nodeId ? ` (${issue.nodeId})` : ''}`))))),
              h('div', { className: 'daf-steps-wrap' },
                h('div', { className: 'daf-col-head' }, h('span', null, t.stepList)),
                h('div', { className: 'daf-steps' }, steps.map((node) => h('div', { key: node.id, style: { display: 'flex', flexDirection: 'column', gap: 3 } },
                  h('div', {
                    className: 'daf-step',
                    'data-status': run.status === 'idle' ? undefined : statusOf(node.id),
                    onClick: () => setSelectedId(node.id),
                  },
                    h('span', null, statusOf(node.id) === 'succeeded' ? '✓' : statusOf(node.id) === 'failed' ? '✕' : statusOf(node.id) === 'running' ? '●' : '○'),
                    h('span', { style: { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, node.title),
                    h('span', { className: 'daf-node-kind' }, kindLabel(node.kind, ctx))),
                  childrenOf(node.id).map((child) => h('div', {
                    key: child.id,
                    className: 'daf-child',
                    'data-status': statusOf(child.id) === 'idle' ? undefined : statusOf(child.id),
                    style: { marginLeft: 14 },
                    onClick: () => setSelectedId(child.id),
                  },
                    h('span', null, statusOf(child.id) === 'succeeded' ? '✓' : statusOf(child.id) === 'running' ? '●' : statusOf(child.id) === 'failed' ? '✕' : '○'),
                    h('span', { style: { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, child.title),
                    h('span', { className: 'daf-node-kind' }, kindLabel(child.kind, ctx)))))))),
              h('div', { className: 'daf-run-panel' },
                h('div', { style: { display: 'flex', gap: 6, alignItems: 'center' } },
                  h('strong', null, t.runsTitle),
                  h('span', { className: 'daf-badge' }, run.status),
                  run.cursor?.length ? h('span', { className: 'daf-muted' }, run.cursor.join(' → ')) : null,
                  runId ? h('span', { className: 'daf-muted' }, runId) : null),
                h(Field, { label: `${t.vars} (JSON)` },
                  h('textarea', {
                    className: 'daf-textarea',
                    style: { minHeight: 44 },
                    key: `vars:${current?.id ?? 'none'}:${JSON.stringify(current?.vars ?? {})}`,
                    defaultValue: JSON.stringify(current?.vars ?? {}, null, 2),
                    onBlur: (event) => {
                      try {
                        const parsed = JSON.parse(event.target.value)
                        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                          mutate((wf) => {
                            wf.vars = Object.fromEntries(Object.entries(parsed).filter(([, value]) => typeof value === 'string'))
                            return wf
                          })
                        }
                      } catch {
                        setError('vars 需要是 JSON 对象')
                      }
                    },
                  })),
                checkpoint
                  ? h('div', { className: 'daf-checkpoint' },
                    h('strong', null, t.checkpointAsk),
                    h('div', null, checkpoint.question),
                    h('div', { style: { display: 'flex', gap: 6, flexWrap: 'wrap' } },
                      (checkpoint.options ?? []).map((option) => h(Btn, {
                        key: option,
                        variant: 'primary',
                        onClick: () => control('answer', { nodeId: checkpoint.nodeId, answer: option }),
                      }, option))))
                  : null,
                h('div', { className: 'daf-col-head' }, h('span', null, t.logs)),
                h('div', { className: 'daf-log' },
