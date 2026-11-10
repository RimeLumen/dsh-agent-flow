/*! dsh-agent-flow v0.1.0 | Copyright (c) 2026 RimeLumen | MIT License */
window.__ModuleLoader__.load({
  id: 'dsh-agent-flow',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useMemo, useRef, useCallback, useSyncExternalStore } = React

    const API = '/api/agent-flow'

    const TAB_KIND = 'agent-flow'
    const TAB_ID = 'dsh-agent-flow:canvas'

    const DICT = {
      zh: {
        injectorTitle: '上下文注入',
        injectorAll: '全量',
        injectorMode: '模式',
        modeIndex: '登记',
        modePreload: '预载',
        modeWhitelist: '白名单',
        modeIndexHint: '只把清单写进本轮提示词，正文按需加载（默认，零风险）',
        modePreloadHint: '把选中技能正文一并写进本轮提示词（占用上下文）',
        modeWhitelistHint: '只允许勾选的工具可调用（会隐藏其他工具，请谨慎）',
        skills: '技能',
        tools: '工具',
        search: '搜索名字或描述…',
        allSources: '全部来源',
        selectAll: '全选可见',
        clearAll: '清空',
        save: '保存为预设',
        saved: '已保存',
        presetName: '预设名称',
        scope: '作用域',
        scopeGlobal: '全局',
        scopeSession: '本会话',
        apply: '应用',
        cancel: '取消',
        close: '关闭',
        saving: '保存中…',
        nextTurn: '改完后下一轮对话生效',
        noAgent: '当前没有进行中的会话，勾选会保存为全局预设',
        failed: '加载失败',
        retry: '重试',
        settingsTitle: 'Agent Flow',
        settingsLead: '流程中枢：对话栏的上下文注入容器 + 右侧栏的流程画布。',
        dataPath: '数据文件',
        exportData: '导出 JSON',
        importData: '导入 JSON',
        importMode: '导入方式',
        importMerge: '合并',
        importReplace: '覆盖',
        run: '运行',
        pause: '暂停',
        resume: '继续',
        cancelRun: '取消',
        validate: '校验',
        newFlow: '新建',
        saveFlow: '保存',
        deleteFlow: '删除',
        autoLayout: '自动整理',
        zoomFit: '适配',
        compact: '紧凑',
        inspector: '节点属性',
        noNode: '选中一个节点查看属性',
        nodeKind: '类型',
        nodeTitle: '标题',
        nodeNote: '备注',
        onError: '出错时',
        errFail: '整轮失败',
        errSkip: '跳过继续',
        errFallback: '跳到节点',
        advancedJson: '高级（JSON）',
        deleteNode: '删除节点',
        connectHint: '拖住圆点到另一个框上松开即可连接（也可先点端口再点目标框）',
        canvasEmpty: '还没有流程。点「新建」开始搭一条。',
        canvasEmptyHint: 'Agent 用 flow_plan 画的流程会自动出现在这里；也可以点上面的刷新按钮拉取已有流程。',
        runsTitle: '运行',
        logs: '日志',
        checkpointAsk: '需要你的确认',
        answer: '回答',
        diagnostics: '诊断',
        tabTitle: '流程',
        openCanvas: '流程画布',
        stepList: '步骤',
        budget: '预载预算（字符）',
        lockoutGuard: '逃生白名单（避免把 Agent 锁死）',
        maxParallel: '并发上限',
        nodeTimeout: '节点超时（毫秒）',
        defaultMode: '默认模式',
        groups: '自定义分组',
        loading: '加载中…',
        effective: '生效解析',
        targetSession: '当前会话',
        targetSubagent: '子代理',
        dangerousAllowed: '危险已允许',
        confirmDiscard: '有未保存的改动，切换后丢失。继续？',
        deleteEdge: '双击删除这条连线',
        setEntry: '设为起点',
        vars: '变量',
        errorBadge: '错误',
        on: '开',
        off: '关',
        addStep: '加子步骤',
        childSteps: '子步骤',
        childStepsUnit: '个子步骤',
        branchBound: '分支连线绑定',
        boundTo: '绑定到父级流程',
        unbind: '解除绑定',
        planAsk: 'Agent 画好了本轮流程，等你确认',
        planHint: '可以直接在画布上改节点与连线，改完点「确认」；点「跳过」表示不必等确认，直接开始工作。',
        planConfirm: '确认，开始',
        planEdit: '载入画布调整',
        planSkip: '跳过确认',
        planAdjust: '局部调整',
        planRelayout: '换个布局',
        archiveFlow: '归档',
        restoreFlow: '恢复',
        purgeFlow: '永久删除',
        showArchived: '回收站',
        archivedBadge: '已归档',
        archivedNotice: '已移入回收站',
        flowDock: '流程',
        turnLabel: '轮次',
        designMode: '设计模式',
        experienceLead: '历史经验（点击采纳骨架）',
        experienceAdopted: '已采纳经验',
        experienceSaved: '已存为经验',
        experienceHint: '要不要把这轮流程存为经验？',
        experienceSave: '存为经验',
        mermaidCopy: '复制 Mermaid',
        validateRunnable: '可运行',
        mermaidImport: '导入 Mermaid',
        mermaidCopied: 'Mermaid 已复制到剪贴板',
        searchHint: '搜索节点（Ctrl+F）',
        searchNone: '无匹配',
        outline: '大纲',
        tour: '导览',
        tourHint: '按顺序把视口依次送到每个节点（再点一次退出）',
        tourPrev: '上一站',
        tourNext: '下一站',
        tourExit: '退出导览',
        motion: '动效',
        motionHint: '动效总开关：关闭后保留状态颜色，只停播放',
        on: '开',
        off: '关',
        exportSvg: '导出 SVG',
        exportPng: '导出 PNG（4×）',
        busyNow: 'Agent 执行中',
        busyHint: '当前会话的 Agent 正在工作（来自 agent/status）',
        compose: '组合为提示词',
        composeHint: '把画布上的节点与连线组合成可执行的提示词，交回给 Agent',
        composeCopy: '复制提示词',
        composeCopied: '提示词已复制',
        composeWarn: '结构提醒：',
        mermaidImported: 'Mermaid 已导入为新流程',
        more: '更多',
        purgeCountdown: '秒后永久删除',
        edgeFrom: '起点锚',
        edgeTo: '终点锚',
        edgeAnchors: '编辑锚点',
        edgeStraight: '恢复最短直线',
        edgeColor: '换色',
        nodeKind: '类型',
        dependsOn: '依赖',
        subworks: '子工作',
        devPanels: '开发者面板',
        statusRunning: '运行中',
        statusOk: '已完成',
        statusFail: '失败',
        layout: '布局',
        layout_chain: '从左到右',
        layout_tb: '从上到下',
        layout_star: '星形',
        layout_radial: '环形',
        layoutPinned: '手拖过的节点不参与自动布局',
        legendSeq: '顺序边（先后）',
        legendDep: '依赖边（前置）',
        diffRemoved: '删除',
        planWarnings: '引用警告',
        stepsUnit: '步',
        contrast: '高对比度',
        zoom: '缩放',
        zoomIn: '放大',
        zoomOut: '缩小',
        zoomFit: '适配内容（Ctrl+0）',
        zoomFitLabel: '适配',
        zoomReset: '回到 100%',
        zoomHint: 'Ctrl/⌘ + 滚轮缩放（以光标为中心）；也可直接改这里的百分比',
        groupToggle: '折叠/展开该分组',
        official: '官方',
        selectOfficial: '全选官方',
        errors: '错误记录',
        errorsEmpty: '还没有错误记录。',
        errorsClear: '清空',
        presetManager: '方案',
        newPreset: '新建方案',
        regenerateDefault: '重新生成 AI 默认',
        aiConfigured: 'AI 自动配置',
        duplicate: '复制',
        rename: '重命名',
        edit: '编辑',
        presetsEmpty: '还没有方案。点「新建方案」，或让 AI 重新生成默认方案。',
        deletePreset: '删除方案',
        planWait: '计划确认等待（毫秒）',
        planWaitHint: 'Agent 用 flow_plan 画完流程后等用户确认的上限；超时按已画的流程继续。',
        hostVersion: '宿主半版本',
        restartHint: '宿主半还是旧代码（flow_plan 未登记）：请重启 DSH（浏览器端刷新页面即可，宿主端需要重启进程）后再用计划先行。',
        errorsUnavailable: '错误接口不可用：同样需要重启宿主端。',
      },
      en: {
        injectorTitle: 'Context injector',
        injectorAll: 'all',
        injectorMode: 'Mode',
        modeIndex: 'Index',
        modePreload: 'Preload',
        modeWhitelist: 'Whitelist',
        modeIndexHint: 'Only the list enters this turn’s prompt; bodies load on demand (default, zero risk)',
        modePreloadHint: 'Selected skill bodies enter this turn’s prompt (uses context)',
        modeWhitelistHint: 'Only checked tools stay callable (hides the rest — use with care)',
        skills: 'Skills',
        tools: 'Tools',
        search: 'Search name or description…',
        allSources: 'All sources',
        selectAll: 'Select visible',
        clearAll: 'Clear',
        save: 'Save as preset',
        saved: 'Saved',
        presetName: 'Preset name',
        scope: 'Scope',
        scopeGlobal: 'Global',
        scopeSession: 'This session',
        apply: 'Apply',
        cancel: 'Cancel',
        close: 'Close',
        saving: 'Saving…',
        nextTurn: 'Takes effect on the next turn',
        noAgent: 'No live session; the selection is saved as a global preset',
        failed: 'Failed to load',
        retry: 'Retry',
        settingsTitle: 'Agent Flow',
        settingsLead: 'Context injector in the conversation bar plus a flow canvas in the right sidebar.',
        dataPath: 'Data file',
        exportData: 'Export JSON',
        importData: 'Import JSON',
        importMode: 'Import mode',
        importMerge: 'Merge',
        importReplace: 'Replace',
        run: 'Run',
        pause: 'Pause',
        resume: 'Resume',
        cancelRun: 'Cancel',
        validate: 'Validate',
        newFlow: 'New',
        saveFlow: 'Save',
        deleteFlow: 'Delete',
        autoLayout: 'Auto layout',
        zoomFit: 'Fit',
        compact: 'Compact',
        inspector: 'Node',
        noNode: 'Select a node to edit it',
        nodeKind: 'Kind',
        nodeTitle: 'Title',
        nodeNote: 'Note',
        onError: 'On error',
        errFail: 'Fail the run',
        errSkip: 'Skip and continue',
        errFallback: 'Jump to node',
        advancedJson: 'Advanced (JSON)',
        deleteNode: 'Delete node',
        connectHint: 'Drag a dot onto another box to connect (or click a port, then the target box)',
        canvasEmpty: 'No flow yet. Press “New” to build one.',
        canvasEmptyHint: 'A flow the agent draws with flow_plan shows up here automatically; use refresh to pull existing ones.',
        runsTitle: 'Runs',
        logs: 'Logs',
        checkpointAsk: 'Your confirmation is needed',
        answer: 'Answer',
        diagnostics: 'Diagnostics',
        tabTitle: 'Flow',
        openCanvas: 'Flow canvas',
        stepList: 'Steps',
        budget: 'Preload budget (chars)',
        lockoutGuard: 'Escape allow-list (never lock the agent out)',
        maxParallel: 'Max parallel nodes',
        nodeTimeout: 'Node timeout (ms)',
        defaultMode: 'Default mode',
        groups: 'Custom groups',
        loading: 'Loading…',
        effective: 'effective',
        targetSession: 'this session',
        targetSubagent: 'subagent',
        dangerousAllowed: 'dangerous allowed',
        confirmDiscard: 'Unsaved changes will be lost. Continue?',
        deleteEdge: 'Double-click to delete this edge',
        setEntry: 'Set as entry',
        vars: 'Vars',
        errorBadge: 'error',
        on: 'on',
        off: 'off',
        addStep: 'Add step',
        childSteps: 'Child steps',
        childStepsUnit: 'child steps',
        branchBound: 'bound by branch lines',
        boundTo: 'Bound to parent flow',
        unbind: 'Unbind',
        planAsk: 'The agent drew this turn’s flow — waiting for you',
        planHint: 'Edit nodes and edges on the canvas, then press Confirm. Press Skip to let the agent start without waiting.',
        planConfirm: 'Confirm and start',
        planEdit: 'Load into canvas',
        planSkip: 'Skip confirmation',
        planAdjust: 'Adjust in canvas',
        planRelayout: 'Switch layout',
        archiveFlow: 'Archive',
        restoreFlow: 'Restore',
        purgeFlow: 'Delete forever',
        showArchived: 'Recycle bin',
        archivedBadge: 'archived',
        archivedNotice: 'Moved to the recycle bin',
        flowDock: 'Flows',
        turnLabel: 'turn',
        designMode: 'Design mode',
        experienceLead: 'Past experiences (click to adopt)',
        experienceAdopted: 'Adopted',
        experienceSaved: 'Saved as experience',
        experienceHint: 'Save this turn as an experience?',
        experienceSave: 'Save experience',
        mermaidCopy: 'Copy Mermaid',
        validateRunnable: 'runnable',
        mermaidImport: 'Import Mermaid',
        mermaidCopied: 'Mermaid copied to clipboard',
        searchHint: 'Search nodes (Ctrl+F)',
        searchNone: 'no match',
        outline: 'Outline',
        tour: 'Tour',
        tourHint: 'Step the viewport through every node in order (click again to exit)',
        tourPrev: 'Previous stop',
        tourNext: 'Next stop',
        tourExit: 'Exit tour',
        motion: 'Motion',
        motionHint: 'Motion switch: keeps status colors, stops playback',
        on: 'on',
        off: 'off',
        exportSvg: 'Export SVG',
        exportPng: 'Export PNG (4x)',
        busyNow: 'Agent working',
        busyHint: 'The agent of this session is working (from agent/status)',
        compose: 'Compose prompt',
        composeHint: 'Turn the canvas into an executable prompt for the agent',
        composeCopy: 'Copy prompt',
        composeCopied: 'Prompt copied',
        composeWarn: 'Structure notes: ',
        mermaidImported: 'Mermaid imported as a new flow',
        more: 'More',
        purgeCountdown: 's until permanent delete',
        edgeFrom: 'From anchor',
        edgeTo: 'To anchor',
        edgeAnchors: 'Edit anchors',
        edgeStraight: 'Reset to straight',
        edgeColor: 'Change color',
        nodeKind: 'Type',
        dependsOn: 'Depends on',
        subworks: 'Subtasks',
        statusRunning: 'running',
        statusOk: 'done',
        statusFail: 'failed',
        layout: 'Layout',
        layout_chain: 'Left to right',
        layout_tb: 'Top to bottom',
        layout_star: 'Star',
        layout_radial: 'Radial',
        layoutPinned: 'Nodes you dragged stay put during auto layout',
        legendSeq: 'Sequence (order)',
        legendDep: 'Dependency (prerequisite)',
        diffRemoved: 'removed',
        planWarnings: 'Reference warnings',
        stepsUnit: 'steps',
        contrast: 'High contrast',
        zoom: 'Zoom',
        zoomIn: 'Zoom in',
        zoomOut: 'Zoom out',
        zoomFit: 'Fit content (Ctrl+0)',
        zoomFitLabel: 'Fit',
        zoomReset: 'Back to 100%',
        zoomHint: 'Ctrl/⌘ + wheel zooms around the cursor; you can also type a percentage here',
        groupToggle: 'Collapse or expand this group',
        official: 'official',
        selectOfficial: 'Select official',
        errors: 'Error records',
        errorsEmpty: 'No error records yet.',
        errorsClear: 'Clear',
        presetManager: 'Presets',
        newPreset: 'New preset',
        regenerateDefault: 'Regenerate AI default',
        aiConfigured: 'AI configured',
        duplicate: 'Duplicate',
        rename: 'Rename',
        edit: 'Edit',
        presetsEmpty: 'No presets yet. Create one, or let the AI regenerate the default.',
        deletePreset: 'Delete preset',
        planWait: 'Plan confirmation wait (ms)',
        planWaitHint: 'How long flow_plan waits after drawing this turn’s flow; on timeout the agent continues with the drawn plan.',
        hostVersion: 'Host half version',
        restartHint: 'The host half is still the old code (flow_plan is not registered). Restart DSH (a page refresh only reloads the browser half) before using plan-first.',
        errorsUnavailable: 'The error endpoints are unavailable for the same reason — restart the host.',
      },
    }

    function langOf(ctx) {
      try {
        const snapshot = ctx?.get?.('locale')?.getSnapshot?.()
        const id = snapshot?.locale ?? snapshot?.id ?? snapshot?.active ?? ''
        return String(id).toLowerCase().startsWith('en') ? 'en' : 'zh'
      } catch {
        return 'zh'
      }
    }

    function dictFor(ctx) {
      return langOf(ctx) === 'en' ? DICT.en : DICT.zh
    }

    async function request(method, path, body) {
      const url = new URL(API + path, window.location.origin)
      const init = { method, headers: { accept: 'application/json' } }
      if (body !== undefined) {
        init.headers['content-type'] = 'application/json'
        init.body = JSON.stringify(body)
      }
      const response = await fetch(url, init)
      let payload = null
      try {
        payload = await response.json()
      } catch {
        payload = null
      }
      if (!response.ok) {
        const message = payload && typeof payload.error === 'string' ? payload.error : `${response.status} ${response.statusText}`
        const staleRoute = response.status === 404
          && /没有这个接口/.test(message)
          && /\/(archive|restore)$/.test(new URL(url).pathname)
        throw new Error(staleRoute ? '宿主半还是旧代码（没有归档路由）：请重启 DSH 后重试' : message)
      }
      return payload
    }

    // 诊断接口的短时缓存（批次 6）：界面上有 3 个消费者各自请求 /diagnostics，
    // 首次打开会发 3 次回环请求。这里合并为 1 次（5 秒内复用同一个 promise）。
    let diagnosticsCache = { at: 0, promise: null }
    const loadDiagnostics = () => {
      const now = Date.now()
      if (diagnosticsCache.promise && now - diagnosticsCache.at < 5000) return diagnosticsCache.promise
      diagnosticsCache = { at: now, promise: api.diagnostics() }
      return diagnosticsCache.promise
    }

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

    const BASE_CSS = `
.daf-scope, .daf-scope * { box-sizing: border-box; }
.daf-scope { color: var(--dsw-alias-label-primary); font-size: 13px; line-height: 1.5; }
.daf-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; width: 100%;
  padding: 6px 10px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px;
  background: var(--dsw-alias-bg-layer-1); container-type: inline-size; }
.daf-bar-compact { gap: 6px; padding: 4px 8px; }
.daf-chip { display: inline-flex; align-items: center; gap: 6px; height: 24px; padding: 0 8px;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 999px; background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary); font-size: 12px; cursor: pointer; white-space: nowrap; }
.daf-chip:hover { border-color: var(--dsw-alias-border-l2); color: var(--dsw-alias-label-primary); }
.daf-chip[data-active="true"] { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-primary); }

.daf-chip[data-archived="true"] { opacity: .55; border-style: dashed; }
.daf-chip[data-draft="true"] { border-style: dotted; border-color: var(--dsw-alias-state-warn-primary); }
.daf-chip[data-draft="true"]::after { content: "草稿"; font-size: 9px; color: var(--dsw-alias-state-warn-primary); margin-left: 4px; }

.daf-toolbar { gap: 8px; }
.daf-btn-lg { padding: 6px 14px; font-size: 12.5px; font-weight: 600; }
.daf-toolbar-sep { width: 1px; align-self: stretch; margin: 3px 2px; background: var(--dsw-alias-border-l1); }
.daf-btn .daf-icon { flex: none; }
.daf-flow-menu.daf-more-menu { left: auto; right: 0; }
.daf-more-group { display: inline-flex; gap: 2px; padding: 2px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 999px; }

.daf-flow-dock { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); z-index: 9; }
.daf-flow-dock-toggle { position: relative; width: 40px; height: 40px; border-radius: 999px; display: inline-flex;
  align-items: center; justify-content: center; border: 1px solid var(--dsw-alias-border-l1);
  background: color-mix(in srgb, var(--dsw-alias-bg-base) 82%, transparent); color: var(--dsw-alias-label-secondary);
  cursor: pointer; backdrop-filter: blur(6px); transition: color var(--daf-t-fast) var(--daf-ease-out),
  border-color var(--daf-t-fast) var(--daf-ease-out), transform var(--daf-t-fast) var(--daf-ease-out); }
.daf-flow-dock-toggle:hover { color: var(--dsw-alias-label-primary); border-color: var(--dsw-alias-border-l2); }
.daf-flow-dock-toggle:active { transform: scale(.94); }
.daf-flow-dock.is-open .daf-flow-dock-toggle { color: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); }
.daf-dock-badge { position: absolute; top: -5px; right: -5px; min-width: 17px; height: 17px; border-radius: 999px;
  background: var(--dsw-alias-brand-primary); color: var(--daf-on-brand); font-size: 10px; font-weight: 600;
  display: inline-flex; align-items: center; justify-content: center; padding: 0 4px; }
.daf-flow-dock-body { position: absolute; top: calc(100% + 8px); right: 0; width: 248px; max-height: min(62vh, 520px);
  overflow: auto; display: flex; flex-direction: column; gap: 2px; padding: 6px; border-radius: 10px;
  border: 1px solid var(--dsw-alias-border-l1); background: color-mix(in srgb, var(--dsw-alias-bg-base) 92%, transparent);
  backdrop-filter: blur(10px); box-shadow: var(--daf-shadow-2);
  opacity: 0; transform: translateX(10px); visibility: hidden; pointer-events: none;
  transition: opacity var(--daf-t-fast) ease, transform var(--daf-t-fast) ease, visibility 0s linear var(--daf-t-fast); }
.daf-flow-dock.is-open .daf-flow-dock-body { opacity: 1; transform: none; visibility: visible; pointer-events: auto;
  transition: opacity var(--daf-t-base) var(--daf-ease-out), transform var(--daf-t-base) var(--daf-ease-out); }

.daf-edge[data-selected="true"] { stroke: var(--dsw-alias-brand-primary); stroke-width: 2.2; }
.daf-edge-editor { position: absolute; z-index: 6; display: flex; flex-direction: column; gap: 4px; padding: 6px 8px;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; background: var(--dsw-alias-bg-overlay);
  box-shadow: var(--daf-shadow-2); font-size: 11px; max-width: 260px;
  animation: daf-diff-in var(--daf-t-fast) var(--daf-ease-out); }
.daf-edge-editor-row { display: flex; align-items: center; gap: 3px; flex-wrap: wrap; }
.daf-anchor-pick { border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-secondary); font-size: 9.5px; padding: 1px 4px; border-radius: 5px; cursor: pointer; }
.daf-anchor-pick:hover { color: var(--dsw-alias-label-primary); }
.daf-anchor-pick.is-on { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }
.daf-purge-warn { display: flex; align-items: center; gap: 6px; padding: 4px 6px; border-radius: 8px;
  border: 1px solid var(--dsw-alias-state-error-primary); font-size: 11px;
  color: var(--dsw-alias-state-error-primary);
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent); }
.daf-purge-bar { position: relative; flex: 1; height: 3px; border-radius: 2px; overflow: hidden;
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 22%, transparent); }
.daf-purge-bar::before { content: ''; position: absolute; inset: 0; transform-origin: left;
  background: var(--dsw-alias-state-error-primary); animation: daf-purge-shrink 3s linear forwards; }
@keyframes daf-purge-shrink { from { transform: scaleX(1); } to { transform: scaleX(0); } }

.daf-canvas-main[data-dev="true"] { grid-template-columns: minmax(0, 1fr); }
.daf-canvas-main[data-dev="true"] .daf-inspector,
.daf-canvas-main[data-dev="true"] .daf-steps-wrap,
.daf-canvas-main[data-dev="true"] .daf-run-panel {
  position: fixed; left: 12px; right: 12px; bottom: 12px; z-index: 45;
  max-height: 38vh; overflow: auto;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px;
  background: color-mix(in srgb, var(--dsw-alias-bg-overlay) 92%, transparent);
  box-shadow: var(--daf-shadow-3); backdrop-filter: blur(10px) saturate(130%);
  animation: daf-drawer-in var(--daf-t-base) var(--daf-ease-out); }
@keyframes daf-drawer-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
.daf-canvas-main[data-dev="false"] { grid-template-columns: minmax(0, 1fr); }
.daf-canvas-main[data-dev="false"] .daf-inspector,
.daf-canvas-main[data-dev="false"] .daf-steps-wrap,
.daf-canvas-main[data-dev="false"] .daf-run-panel { display: none; }

.daf-exp-cards { display: flex; flex-direction: column; gap: 4px; }
.daf-exp-card { display: flex; align-items: center; gap: 8px; padding: 5px 8px; border-radius: 8px;
  border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1);
  cursor: pointer; text-align: left; transition: border-color var(--daf-t-fast) var(--daf-ease-out),
  background var(--daf-t-fast) var(--daf-ease-out); }
.daf-exp-card:hover { border-color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-bg-layer-2); }
.daf-exp-card-title { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  color: var(--dsw-alias-label-primary); font-size: 12px; }
@media (prefers-reduced-motion: reduce) {
  .daf-flow-dock-body { transition-duration: 1ms; }
  .daf-purge-bar::before { animation-duration: 3s; } }

.daf-flow-dock { position: absolute; top: 8px; right: 8px; z-index: 9; display: flex; flex-direction: column; align-items: flex-end; }
.daf-flow-dock-toggle { border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; padding: 4px 10px;
  background: color-mix(in srgb, var(--dsw-alias-bg-base) 82%, transparent); color: var(--dsw-alias-label-secondary);
  font-size: 11.5px; cursor: pointer; backdrop-filter: blur(6px); }
.daf-flow-dock-toggle:hover { color: var(--dsw-alias-label-primary); border-color: var(--dsw-alias-border-l2); }
.daf-flow-dock.is-open .daf-flow-dock-toggle { border-bottom-left-radius: 0; border-bottom-right-radius: 0; }
.daf-flow-dock-body { width: 240px; max-height: min(62vh, 520px); overflow: auto; display: flex; flex-direction: column; gap: 2px;
  padding: 6px; border: 1px solid var(--dsw-alias-border-l1); border-top-left-radius: 0;
  background: color-mix(in srgb, var(--dsw-alias-bg-base) 92%, transparent); backdrop-filter: blur(10px);
  box-shadow: var(--daf-shadow-2); }
.daf-flow-dock-head { display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 0 2px 4px; }
.daf-dock-switch { border: none; background: none; color: var(--dsw-alias-label-secondary); font-size: 11px; cursor: pointer;
  padding: 2px 4px; border-radius: 6px; }
.daf-dock-switch:hover { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-2); }
.daf-flow-row { position: relative; display: flex; }
.daf-flow-row .daf-chip { width: 100%; justify-content: flex-start; text-align: left; }
.daf-flow-menu-static { position: static; box-shadow: none; }
.daf-chip-count { color: var(--dsw-alias-brand-primary); font-variant-numeric: tabular-nums; }
.daf-spacer { flex: 1 1 auto; }
.daf-panel { width: 100%; margin-top: 8px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px;
  background: var(--dsw-alias-bg-layer-1); box-shadow: var(--daf-shadow-1); overflow: hidden; }
.daf-panel-head { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-bottom: 1px solid var(--dsw-alias-border-l1); }
.daf-panel-body { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 10px; max-height: 46vh; overflow: auto; }
@container (max-width: 620px) { .daf-panel-body { grid-template-columns: 1fr; } }
.daf-col { min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.daf-col-head { display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 12px;
  color: var(--dsw-alias-label-secondary); text-transform: uppercase; letter-spacing: .04em; }
.daf-list { display: flex; flex-direction: column; gap: 2px; border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 8px; padding: 4px; min-height: 96px; }
.daf-row { display: flex; align-items: flex-start; gap: 8px; padding: 4px 6px; border-radius: 6px; cursor: pointer; }
.daf-row:hover { background: var(--dsw-alias-bg-layer-2); }
.daf-row-main { min-width: 0; flex: 1 1 auto; }
.daf-row-name { font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.daf-row-desc { font-size: 11.5px; color: var(--dsw-alias-label-secondary); display: -webkit-box;
  -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.daf-badge { font-size: 10.5px; padding: 0 5px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l1);
  color: var(--dsw-alias-label-secondary); white-space: nowrap; }
.daf-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 26px; padding: 0 10px;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 7px; background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary); font-size: 12px; cursor: pointer; }
.daf-btn:hover:not(:disabled) { border-color: var(--dsw-alias-border-l2); }
.daf-btn:disabled { opacity: .5; cursor: not-allowed; }
.daf-btn-primary { background: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); color: var(--daf-on-brand); }
.daf-btn-danger { color: var(--dsw-alias-state-error-primary); border-color: var(--dsw-alias-state-error-primary); }
.daf-input, .daf-select, .daf-textarea { width: 100%; min-width: 0; background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary); border: 1px solid var(--dsw-alias-border-l1); border-radius: 7px;
  padding: 5px 8px; font-size: 12.5px; font-family: inherit; }
.daf-textarea { min-height: 64px; resize: vertical; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.daf-field { display: flex; flex-direction: column; gap: 3px; }
.daf-field-label { font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
.daf-switch { position: relative; width: 30px; height: 18px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-2); cursor: pointer; flex: none; padding: 0; transition: background .16s ease; }
.daf-switch[aria-checked="true"] { background: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); }
.daf-switch-dot { position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 50%;
  background: var(--dsw-alias-label-primary); transition: transform .16s ease; }
.daf-switch[aria-checked="true"] .daf-switch-dot { transform: translateX(12px); background: var(--daf-on-brand); }
.daf-muted { color: var(--dsw-alias-label-secondary); font-size: 11.5px; }
.daf-error { color: var(--dsw-alias-state-error-primary); font-size: 12px; }
.daf-modal-backdrop { position: fixed; inset: 0; background: var(--daf-scrim); display: flex; align-items: center;
  justify-content: center; z-index: 60; padding: 16px; }
.daf-modal { background: var(--dsw-alias-bg-overlay); border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px;
  max-width: min(560px, 92vw); max-height: 86vh; overflow: auto; padding: 14px; width: 100%; }
.daf-popover { position: absolute; z-index: 40; top: calc(100% + 6px); left: 0; min-width: 220px;
  background: var(--dsw-alias-bg-overlay); border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px;
  box-shadow: var(--daf-shadow-1); padding: 8px; }
.daf-anchor { position: relative; display: inline-flex; }
.daf-section { display: flex; flex-direction: column; gap: 10px; max-width: 720px; }
.daf-section h3 { margin: 0; font-size: 14px; }
.daf-grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; }
.daf-note { border-left: 2px solid var(--dsw-alias-border-l2); padding-left: 8px; }

.daf-scope {
  --daf-t-fast: 140ms;
  --daf-t-base: 220ms;
  --daf-t-slow: 320ms;
  --daf-ease-out: cubic-bezier(.22,.61,.36,1);
  --daf-ease-in: cubic-bezier(.4,0,1,1);
  --daf-spring: cubic-bezier(.34,1.4,.64,1);
  --daf-glow: color-mix(in srgb, var(--dsw-alias-brand-primary) 55%, transparent);
  --daf-glow-soft: color-mix(in srgb, var(--dsw-alias-brand-primary) 28%, transparent);
}
.daf-btn, .daf-chip, .daf-input, .daf-select, .daf-row {
  transition: background-color var(--daf-t-fast) var(--daf-ease-out),
              border-color var(--daf-t-fast) var(--daf-ease-out),
              color var(--daf-t-fast) var(--daf-ease-out),
              box-shadow var(--daf-t-base) var(--daf-ease-out),
              opacity var(--daf-t-base) var(--daf-ease-out),
              transform var(--daf-t-base) var(--daf-spring);
}
.daf-btn:active:not(:disabled), .daf-chip:active { transform: scale(.97); }
.daf-btn:focus-visible, .daf-chip:focus-visible, .daf-input:focus-visible, .daf-select:focus-visible,
.daf-switch:focus-visible, .daf-anchor:focus-visible, .daf-port:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 2px;
}

.daf-switch { transition: background-color var(--daf-t-base) var(--daf-ease-out), border-color var(--daf-t-base) var(--daf-ease-out); }
.daf-switch-dot { transition: transform var(--daf-t-base) var(--daf-spring), background-color var(--daf-t-base) var(--daf-ease-out); }
.daf-switch[data-pulse="true"]::after {
  content: ''; position: absolute; inset: -4px; border-radius: 999px; pointer-events: none;
  animation: daf-switch-ping var(--daf-t-slow) var(--daf-ease-out) 1;
}
@keyframes daf-switch-ping {
  from { box-shadow: 0 0 0 0 var(--daf-glow-soft); opacity: .9; }
  to { box-shadow: 0 0 0 8px transparent; opacity: 0; }
}

.daf-row[data-flash="true"] { animation: daf-row-flash var(--daf-t-slow) var(--daf-ease-out) 1; }
@keyframes daf-row-flash {
  0% { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 22%, transparent); }
  100% { background: transparent; }
}
.daf-chip-count[data-pop="true"] { animation: daf-count-pop var(--daf-t-base) var(--daf-spring) 1; display: inline-block; }
@keyframes daf-count-pop { from { transform: scale(1.25); color: var(--dsw-alias-brand-primary); } to { transform: scale(1); } }

.daf-group-head { display: flex; align-items: center; gap: 6px; padding: 4px 6px 2px; position: sticky; top: 0;
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 86%, transparent); backdrop-filter: blur(6px); z-index: 1; }
.daf-group-name { font-size: 11px; letter-spacing: .04em; text-transform: uppercase; color: var(--dsw-alias-label-secondary); }
.daf-group-toggle { border: none; background: none; padding: 0 2px; cursor: pointer; text-align: left; }
.daf-group-toggle:hover { color: var(--dsw-alias-label-primary); }
.daf-group-toggle:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; border-radius: 4px; }
.daf-tri { position: relative; width: 30px; height: 18px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-2); cursor: pointer; flex: none; padding: 0; }
.daf-tri[data-state="all"] { background: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); }
.daf-tri[data-state="some"] { background: linear-gradient(90deg, var(--dsw-alias-brand-primary) 50%, var(--dsw-alias-bg-layer-2) 50%); }
.daf-tri-dot { position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 50%;
  background: var(--dsw-alias-label-primary); transition: transform var(--daf-t-base) var(--daf-spring); }
.daf-tri[data-state="all"] .daf-tri-dot, .daf-tri[data-state="some"] .daf-tri-dot { transform: translateX(12px); background: var(--daf-on-brand); }

.daf-panel { animation: daf-panel-in var(--daf-t-base) var(--daf-ease-out) 1; }
@keyframes daf-panel-in { from { opacity: 0; transform: translateY(-6px) scale(.995); } to { opacity: 1; transform: none; } }
.daf-panel[data-closing="true"] { animation: daf-panel-out var(--daf-t-fast) var(--daf-ease-in) 1 forwards; }
@keyframes daf-panel-out { to { opacity: 0; transform: translateY(-4px) scale(.995); } }

.daf-tabs { display: inline-flex; position: relative; border: 1px solid var(--dsw-alias-border-l1); border-radius: 999px; padding: 2px; gap: 2px; }
.daf-tab { position: relative; z-index: 1; border: none; background: none; color: var(--dsw-alias-label-secondary);
  font-size: 12px; padding: 3px 12px; border-radius: 999px; cursor: pointer; transition: color var(--daf-t-fast) var(--daf-ease-out); }
.daf-tab[data-active="true"] { color: var(--dsw-alias-label-primary); }

.daf-preset { display: flex; align-items: center; gap: 8px; border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 10px; padding: 6px 8px; background: var(--dsw-alias-bg-layer-1);
  transition: border-color var(--daf-t-base) var(--daf-ease-out), box-shadow var(--daf-t-base) var(--daf-ease-out), transform var(--daf-t-base) var(--daf-spring); }
.daf-preset:hover { transform: translateY(-1px); }
.daf-preset[data-default="true"] { border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 60%, transparent);
  background: linear-gradient(120deg, color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, transparent), transparent 60%); }
.daf-preset[data-active="true"] { box-shadow: 0 0 0 1px var(--daf-glow-soft); }
.daf-preset-main { flex: 1 1 auto; min-width: 0; }
.daf-preset-name { font-size: 12.5px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
.daf-preset-meta { font-size: 11px; color: var(--dsw-alias-label-secondary); }
.daf-tag { font-size: 10px; padding: 0 6px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-secondary); }
.daf-tag-ai { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }
.daf-icon { display: inline-block; vertical-align: -2px; }
@media (prefers-reduced-motion: reduce) { .daf-scope * { transition: none !important; animation: none !important; } }

`

    const CANVAS_CSS = `
.daf-canvas-root { position: relative; display: flex; flex-direction: column; height: 100%; min-height: 0;
  padding: 0; container-type: inline-size; container-name: flow; }
.daf-side-rail { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); z-index: 20;
  display: flex; flex-direction: column; gap: 6px; padding: 6px 5px; border-radius: 12px;
  border: 1px solid var(--dsw-alias-border-l1);
  background: color-mix(in srgb, var(--dsw-alias-bg-overlay) 78%, transparent);
  backdrop-filter: blur(10px) saturate(130%); max-height: 70vh; overflow-y: auto; }
.daf-side-rail .daf-btn { width: 36px; height: 36px; padding: 0; justify-content: center; }
.daf-side-rail .daf-toolbar-sep { width: auto; height: 1px; align-self: stretch; margin: 2px 4px; }
.daf-thumb-viewlayer { position: absolute; right: 8px; bottom: 8px; width: 132px; height: 92px;
  z-index: 4; pointer-events: none; overflow: hidden; border-radius: 6px; }
.daf-thumb-viewrect { position: absolute; border: 1px solid var(--dsw-alias-brand-primary); border-radius: 2px;
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent); }
.daf-search { display: flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 8px;
  border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); }
.daf-search:focus-within { border-color: var(--dsw-alias-brand-primary); }
.daf-search-input { width: 96px; border: 0; outline: 0; background: transparent;
  color: var(--dsw-alias-label-primary); font-size: 12px; }
.daf-search-input::placeholder { color: var(--dsw-alias-label-secondary); }
.daf-search-count { font-size: 11px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
.daf-node[data-search-hit="true"] { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
/* P3 动效治理：总开关关掉后，静态语义（颜色/状态）全部保留，只停播放。 */
.daf-scope[data-motion="off"] * { animation: none !important; transition: none !important; }
/* Still 模式：保留流动的静态语义（虚线节奏差异），而不是让状态信息一起消失 */
.daf-scope[data-motion="off"] .daf-edge-flow[data-state="active"] { stroke-dasharray: 7 5; opacity: .75; }
.daf-scope[data-motion="off"] .daf-edge-flow[data-state="done"] { stroke-dasharray: 2 10; opacity: .5; }
/* 执行氛围（批次 7.1）：Agent 工作中——状态条胶囊 + 画布边缘呼吸 */
.daf-busy-pill { display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border-radius: 999px;
  font-size: 11px; color: var(--dsw-alias-brand-primary);
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent); }
.daf-busy-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--dsw-alias-brand-primary);
  animation: daf-busy-pulse 1.4s ease-in-out infinite; }
@keyframes daf-busy-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .35; transform: scale(.7); } }
.daf-scope[data-busy="true"] .daf-canvas-root { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--dsw-alias-brand-primary) 34%, transparent); }
.daf-scope[data-motion="off"] .daf-busy-dot { animation: none; }
/* 平移手势（空格或中键）：光标给出可拖拽提示 */
.daf-scope[data-pan="true"] .daf-surface { cursor: grab; }
.daf-scope[data-pan="true"] .daf-surface:active { cursor: grabbing; }
.daf-edge-flow[data-budget="skip"] { animation: none; opacity: .5; }
/* 主干 / 支线：脊椎加粗，支线保持轻量 */
.daf-edge-glow[data-main="true"] { opacity: .26; }
.daf-edge-flow[data-main="true"] { stroke-width: 2.9; }
.daf-edge-flow[data-main="false"] { opacity: .35; }
.daf-edge-bolus[data-budget="skip"] { animation: none; opacity: 0; }
/* P3 大纲面板 */
.daf-outline { position: absolute; left: 10px; top: 64px; z-index: 30; width: 236px; max-height: 54vh;
  display: flex; flex-direction: column; border-radius: 12px; overflow: hidden;
  border: 1px solid var(--dsw-alias-border-l1);
  background: color-mix(in srgb, var(--dsw-alias-bg-overlay) 92%, transparent);
  box-shadow: var(--daf-shadow-2); backdrop-filter: blur(10px) saturate(130%); }
.daf-outline-head { display: flex; align-items: center; gap: 6px; padding: 6px 8px;
  border-bottom: 1px solid var(--dsw-alias-border-l1); }
.daf-outline-body { overflow: auto; padding: 4px; }
.daf-outline-row { display: flex; align-items: center; gap: 6px; width: 100%; padding: 4px 6px;
  border: 0; border-radius: 6px; background: transparent; cursor: pointer; text-align: left;
  color: var(--dsw-alias-label-primary); font-size: 12px; }
.daf-outline-row:hover { background: var(--dsw-alias-bg-layer-2); }
.daf-outline-row[data-selected="true"] { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 16%, transparent); }
.daf-outline-phase { font-weight: 600; }
.daf-outline-caret { flex: none; width: 10px; color: var(--dsw-alias-label-secondary); }
.daf-outline-title { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.daf-outline-dot { flex: none; width: 6px; height: 6px; border-radius: 50%; background: var(--dsw-alias-border-l2); }
.daf-outline-dot[data-st="running"] { background: var(--dsw-alias-brand-primary); }
.daf-outline-dot[data-st="succeeded"] { background: var(--dsw-alias-state-success-primary); }
.daf-outline-dot[data-st="failed"] { background: var(--dsw-alias-state-error-primary); }
/* 阶段容器框 */
.daf-phase-frame { position: absolute; top: 0; left: 0; border: 1px dashed var(--dsw-alias-border-l2);
  border-radius: 14px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 35%, transparent);
  pointer-events: none; }
.daf-phase-frame-label { position: absolute; top: 0; left: 12px; transform: translateY(-50%);
  padding: 1px 7px; border-radius: 7px; font-size: 11px; font-weight: 600;
  color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-bg-base);
  border: 1px solid var(--dsw-alias-border-l1); white-space: nowrap; }
/* P3 导览条 */
.daf-tour { position: absolute; left: 50%; transform: translateX(-50%); bottom: 14px; z-index: 32;
  display: flex; align-items: center; gap: 6px; padding: 5px 8px; border-radius: 10px;
  border: 1px solid var(--dsw-alias-border-l1);
  background: color-mix(in srgb, var(--dsw-alias-bg-overlay) 92%, transparent);
  box-shadow: var(--daf-shadow-2); backdrop-filter: blur(10px) saturate(130%); }
.daf-tour-count { font-size: 12px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; min-width: 42px; text-align: center; }
.daf-toolbar { position: absolute; top: 10px; left: 10px; right: 64px; z-index: 20; display: flex;
  align-items: center; gap: 6px; flex-wrap: wrap; padding: 6px 8px; border-radius: 12px;
  border: 1px solid var(--dsw-alias-border-l1);
  background: color-mix(in srgb, var(--dsw-alias-bg-overlay) 78%, transparent);
  backdrop-filter: blur(10px) saturate(130%); }
.daf-canvas-main { flex: 1 1 auto; min-height: 0; }
.daf-canvas-main { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 8px; flex: 1 1 auto; min-height: 0; }
@container flow (max-width: 1080px) { .daf-canvas-main { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(220px, 1fr) auto; } }
.daf-surface-wrap { position: relative; overflow: auto; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px;
  background: var(--dsw-alias-bg-base); min-height: 220px; }
.daf-surface { position: relative; transform-origin: 0 0; width: 2400px; height: 1600px;
  background-image: radial-gradient(var(--dsw-alias-border-l1) 1px, transparent 1px); background-size: 20px 20px; }
.daf-edges { position: absolute; inset: 0; width: 2400px; height: 1600px; overflow: visible; pointer-events: none; }
.daf-edge { fill: none; stroke: var(--dsw-alias-border-l2); stroke-width: 1.6; }

.daf-edge-glow { fill: none; stroke: var(--dsw-alias-brand-primary); stroke-width: 7; opacity: .10; filter: blur(3.5px);
  transition: opacity var(--daf-t-base) var(--daf-ease-out); }
.daf-edge-glow[data-state="active"] { opacity: .30; }
.daf-edge-glow[data-state="done"] { opacity: .16; }
.daf-edge-flow { fill: none; stroke-width: 2.4; stroke-linecap: round; stroke-dasharray: 2 16; opacity: .22;
  animation: daf-flow-move var(--daf-flow-dur, 3.4s) linear infinite;
  transition: opacity var(--daf-t-base) var(--daf-ease-out); }

.daf-btn-dev.is-on { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }
.daf-edge-flow[data-state="active"] { opacity: .9; --daf-flow-dur: .9s; }
.daf-edge-flow[data-state="done"] { opacity: .5; --daf-flow-dur: 2.6s; }
.daf-edge-flow[data-state="dead"] { opacity: .18; --daf-flow-dur: 3.4s; }
@keyframes daf-flow-move { from { stroke-dashoffset: 36; } to { stroke-dashoffset: 0; } }
.daf-edge-bolus { fill: none; stroke-width: 3.6; stroke-linecap: round; stroke-dasharray: 16 260; opacity: 0;
  animation: daf-flow-move var(--daf-flow-dur, 1.8s) linear infinite; }
.daf-edge-bolus[data-state="active"] { opacity: 1; --daf-flow-dur: 1.15s; }
.daf-edge-bolus[data-state="done"] { opacity: .55; --daf-flow-dur: 2.8s; }
.daf-edge[data-state="active"] { stroke: var(--dsw-alias-brand-primary); }
.daf-edge[data-state="done"] { stroke: var(--dsw-alias-state-success-primary); }
.daf-edge[data-state="dead"] { stroke: var(--dsw-alias-border-l1); opacity: .45; }
.daf-edge-anim { fill: none; stroke: var(--dsw-alias-brand-primary); stroke-width: 2.2; stroke-dasharray: 8 10;
  animation: daf-flow 1s linear infinite; pointer-events: none; }
@keyframes daf-flow { from { stroke-dashoffset: 18; } to { stroke-dashoffset: 0; } }

.daf-node { position: absolute; top: 0; left: 0; width: 220px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px;
  background: var(--dsw-alias-bg-layer-1); padding: 8px 9px 9px; cursor: grab; user-select: none;
  transition: transform var(--daf-t-slow) var(--daf-ease-out),
              border-color var(--daf-t-base) var(--daf-ease-out),
              box-shadow var(--daf-t-base) var(--daf-ease-out),
              opacity var(--daf-t-base) var(--daf-ease-out); }
.daf-node-glow { position: absolute; inset: -2px; border-radius: 12px; pointer-events: none; opacity: 0;
  box-shadow: 0 0 0 1px var(--daf-glow), 0 0 20px 3px var(--daf-glow-soft);
  transition: opacity var(--daf-t-base) var(--daf-ease-out); }
@media (hover: hover) { .daf-node:hover .daf-node-glow { opacity: 1; } }
.daf-node[data-selected="true"] .daf-node-glow { opacity: .7; }

.daf-node { animation: daf-node-enter var(--daf-t-slow) var(--daf-ease-out) 1; }
@keyframes daf-node-enter { from { opacity: 0; } to { opacity: 1; } }
.daf-node[data-selected="true"] { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 30%, transparent); }

.daf-node-detail { position: absolute; top: calc(100% + 6px); left: 0; width: 270px; z-index: 5;
  display: flex; flex-direction: column; gap: 3px; padding: 7px 9px; border-radius: 10px;
  border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-overlay);
  box-shadow: var(--daf-shadow-2); font-size: 11px; color: var(--dsw-alias-label-secondary);
  opacity: 0; transform: translateY(-4px); visibility: hidden; pointer-events: none;
  transition: opacity var(--daf-t-fast) ease, transform var(--daf-t-fast) ease, visibility 0s linear var(--daf-t-fast); }
.daf-node[data-selected="true"] .daf-node-detail { opacity: 1; transform: none; visibility: visible; pointer-events: auto;
  transition: opacity var(--daf-t-base) var(--daf-ease-out), transform var(--daf-t-base) var(--daf-ease-out); }
.daf-node-detail-row { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.daf-node-hovercard { position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translate(-50%, 3px);
  z-index: 7; width: 240px; display: flex; flex-direction: column; gap: 3px; padding: 7px 9px;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; background: var(--dsw-alias-bg-overlay);
  box-shadow: var(--daf-shadow-2); font-size: 11px; color: var(--dsw-alias-label-secondary);
  opacity: 0; visibility: hidden; pointer-events: none;
  transition: opacity var(--daf-t-fast) ease, transform var(--daf-t-fast) ease, visibility 0s linear var(--daf-t-fast); }
.daf-node:hover .daf-node-hovercard { opacity: 1; transform: translate(-50%, 0); visibility: visible;
  transition: opacity var(--daf-t-fast) var(--daf-ease-out), transform var(--daf-t-fast) var(--daf-ease-out); }
.daf-node[data-selected="true"] .daf-node-hovercard { display: none; }
.daf-hovercard-title { font-weight: 600; color: var(--dsw-alias-label-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.daf-hovercard-status { color: var(--dsw-alias-label-primary); }
.daf-hovercard-status[data-state="running"] { color: var(--dsw-alias-brand-primary); }
.daf-hovercard-status[data-state="succeeded"] { color: var(--dsw-alias-state-success-primary); }
.daf-hovercard-status[data-state="failed"] { color: var(--dsw-alias-state-error-primary); }
.daf-hovercard-calls { display: flex; flex-direction: column; gap: 2px; }
.daf-hovercard-error { color: var(--dsw-alias-state-error-primary); -webkit-line-clamp: 2; display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden; }
.daf-node[data-status="pending"] { opacity: .45; border-style: dashed; }
.daf-node[data-status="ready"] { animation: daf-breathe 2.2s ease-in-out infinite; }
@keyframes daf-breathe { 0%,100% { border-color: var(--dsw-alias-border-l1); } 50% { border-color: var(--dsw-alias-border-l2); } }
.daf-node[data-status="running"] { border-color: var(--dsw-alias-brand-primary); }
.daf-node[data-status="running"]::after { content: ''; position: absolute; inset: -3px; border-radius: 12px;
  background: conic-gradient(from var(--daf-angle, 0deg), transparent 0deg, var(--dsw-alias-brand-primary) 90deg, transparent 200deg);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude;
  -webkit-mask-composite: xor; padding: 3px; animation: daf-spin 1.6s linear infinite; pointer-events: none; }
@property --daf-angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
@keyframes daf-spin { to { --daf-angle: 360deg; } }
.daf-node[data-status="succeeded"] { border-color: var(--dsw-alias-state-success-primary); }
.daf-node[data-status="succeeded"] .daf-node-tick { animation: daf-tick .26s ease-out; }
@keyframes daf-tick { from { opacity: 0; transform: scale(.6); } to { opacity: 1; transform: scale(1); } }
.daf-node[data-status="failed"] { border-color: var(--dsw-alias-state-error-primary); animation: daf-shake .32s ease-in-out; }
@keyframes daf-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }
.daf-node[data-status="skipped"] { opacity: .5; }
.daf-node[data-status="skipped"]::before { content: ''; position: absolute; left: 6px; right: 6px; top: 50%; height: 1px;
  background: var(--dsw-alias-label-secondary); transform: rotate(-4deg); pointer-events: none; }
.daf-node[data-status="cancelled"] { opacity: .5; border-style: dotted; }
.daf-node-head { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.daf-node-title { flex: 1 1 auto; font-size: 12.5px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.daf-node-kind { font-size: 10.5px; color: var(--dsw-alias-label-secondary); border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 999px; padding: 0 5px; white-space: nowrap; }
.daf-node-summary { font-size: 11.5px; color: var(--dsw-alias-label-secondary); display: -webkit-box; -webkit-line-clamp: 3;
  -webkit-box-orient: vertical; overflow: hidden; word-break: break-word; }
.daf-node-foot { display: flex; align-items: center; gap: 4px; margin-top: 5px; min-height: 16px; }
.daf-port { width: 11px; height: 11px; border-radius: 50%; border: 1.5px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-1); cursor: crosshair; padding: 0; }
.daf-port:hover, .daf-port[data-armed="true"] { border-color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-brand-primary); }
.daf-port-out { position: absolute; right: -6px; top: 22px; }
.daf-node-tool { display: inline-flex; align-items: center; gap: 3px; font-size: 10.5px; color: var(--dsw-alias-label-secondary); }
.daf-node-tool[data-state="running"] { color: var(--dsw-alias-brand-primary); }
.daf-node-tool[data-state="ok"] { color: var(--dsw-alias-state-success-primary); }
.daf-node-tool[data-state="error"] { color: var(--dsw-alias-state-error-primary); }
.daf-run-ring { width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--dsw-alias-border-l1);
  border-top-color: var(--dsw-alias-brand-primary); animation: daf-spin-simple .8s linear infinite; }
@keyframes daf-spin-simple { to { transform: rotate(360deg); } }
.daf-inspector { border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; padding: 8px; overflow: auto;
  background: var(--dsw-alias-bg-layer-1); min-height: 0; }
@container flow (max-width: 1080px) { .daf-inspector { max-height: 40vh; } }
.daf-issues { display: flex; flex-direction: column; gap: 3px; max-height: 140px; overflow: auto; }
.daf-issue { font-size: 11.5px; display: flex; gap: 6px; align-items: baseline; }
.daf-issue[data-level="error"] { color: var(--dsw-alias-state-error-primary); }
.daf-issue[data-level="warn"] { color: var(--dsw-alias-state-warn-primary); }
.daf-run-panel { border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; padding: 8px; display: flex;
  flex-direction: column; gap: 6px; max-height: 220px; overflow: auto; }
.daf-log { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; display: flex; flex-direction: column; gap: 2px; }
.daf-log-line[data-level="error"] { color: var(--dsw-alias-state-error-primary); }
.daf-log-line[data-level="warn"] { color: var(--dsw-alias-state-warn-primary); }
.daf-checkpoint { border: 1px solid var(--dsw-alias-state-warn-primary); border-radius: 10px; padding: 8px;
  display: flex; flex-direction: column; gap: 6px; animation: daf-pulse 1.8s ease-in-out infinite; }
@keyframes daf-pulse { 0%,100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--dsw-alias-state-warn-primary) 35%, transparent); }
  50% { box-shadow: 0 0 0 6px transparent; } }
.daf-steps-wrap { display: none; flex-direction: column; gap: 4px; min-height: 0; overflow: auto; }
.daf-steps { display: flex; flex-direction: column; gap: 4px; overflow: auto; }

@container flow (max-width: 440px) {
  .daf-canvas-main { display: none; }
  .daf-steps-wrap { display: flex; }
}
.daf-step { display: flex; align-items: center; gap: 8px; border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 8px; padding: 5px 7px; background: var(--dsw-alias-bg-layer-1); }
.daf-step[data-status="running"] { border-color: var(--dsw-alias-brand-primary); }
.daf-step[data-status="succeeded"] { border-color: var(--dsw-alias-state-success-primary); }
.daf-step[data-status="failed"] { border-color: var(--dsw-alias-state-error-primary); }
.daf-step[data-status="skipped"] { opacity: .55; }

.daf-glass {
  background: linear-gradient(140deg,
    color-mix(in srgb, var(--dsw-alias-bg-layer-1) 78%, transparent) 0%,
    color-mix(in srgb, var(--dsw-alias-bg-layer-2) 58%, transparent) 55%,
    color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, transparent) 100%);
  backdrop-filter: blur(14px) saturate(150%);
  -webkit-backdrop-filter: blur(14px) saturate(150%);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-border-l2) 65%, transparent);
}
@supports not ((backdrop-filter: blur(2px)) or (-webkit-backdrop-filter: blur(2px))) {
  .daf-glass { background: var(--dsw-alias-bg-layer-1); }
}
.daf-node, .daf-inspector, .daf-run-panel, .daf-panel, .daf-step { backdrop-filter: blur(10px) saturate(130%); }

.daf-scope {
  --daf-on-brand: var(--dsw-alias-bg-base);
  --daf-shadow-1: var(--daf-shadow-1);
  --daf-shadow-2: var(--daf-shadow-2);
  --daf-shadow-3: var(--daf-shadow-3);
  --daf-scrim: rgba(0,0,0,.42);
  --daf-edge-0:#e0563f; --daf-edge-1:#e08a2f; --daf-edge-2:#b0a02a; --daf-edge-3:#5aa832;
  --daf-edge-4:#2fa88a; --daf-edge-5:#2f8fd0; --daf-edge-6:#5a6ee0; --daf-edge-7:#9457d8;
  --daf-edge-8:#c94fb0; --daf-edge-9:#d4506a; --daf-edge-10:#8a8f98; --daf-edge-11:#56a3b8;
}
@media (prefers-color-scheme: dark) {
  .daf-scope {
    --daf-shadow-1: 0 8px 24px rgba(0,0,0,.50);
    --daf-shadow-2: 0 10px 26px rgba(0,0,0,.60);
    --daf-shadow-3: 0 18px 44px rgba(0,0,0,.66);
    --daf-scrim: rgba(0,0,0,.62);
    --daf-edge-0:#ff8a6e; --daf-edge-1:#ffb45e; --daf-edge-2:#d8c85a; --daf-edge-3:#8ed46a;
    --daf-edge-4:#5fd6b4; --daf-edge-5:#6cb8f0; --daf-edge-6:#8f9cff; --daf-edge-7:#bd8bff;
    --daf-edge-8:#f07ad8; --daf-edge-9:#ff7f96; --daf-edge-10:#b6bcc6; --daf-edge-11:#84cfe0;
  }
}

.daf-edge-chip { cursor: pointer; font-size: 9px; fill: var(--dsw-alias-label-primary); }
.daf-legend { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.daf-legend-item { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: var(--dsw-alias-label-secondary); }
.daf-legend-swatch { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }

.daf-layout-btn { border: none; background: none; color: var(--dsw-alias-label-secondary); font-size: 11px;
  padding: 2px 8px; border-radius: 999px; cursor: pointer;
  transition: background var(--daf-t-fast) var(--daf-ease-out), color var(--daf-t-fast) var(--daf-ease-out); }
.daf-layout-btn:hover:not(:disabled) { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-2); }
.daf-layout-btn.is-on { background: var(--dsw-alias-brand-primary); color: var(--daf-on-brand); }
.daf-legend-box { position: absolute; right: 8px; bottom: 108px; z-index: 3; display: flex; flex-direction: column;
  gap: 3px; padding: 5px 7px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l1);
  background: color-mix(in srgb, var(--dsw-alias-bg-base) 82%, transparent); backdrop-filter: blur(6px); }
.daf-edge[data-kind="seq"] { stroke-dasharray: 6 6; }
.daf-edge[data-kind="dep"] { stroke: var(--dsw-alias-brand-primary); stroke-width: 1.8; stroke-dasharray: none; }
.daf-node[data-kind="phase"] { border-left: 3px solid var(--dsw-alias-brand-primary); }
.daf-node[data-diff="added"] { animation: daf-diff-in var(--daf-t-slow) var(--daf-ease-out);
  box-shadow: 0 0 0 2px var(--dsw-alias-state-success-primary); }
@keyframes daf-diff-in { from { opacity: .35; } to { opacity: 1; } }
.daf-node[data-diff="moved"] { animation: daf-diff-move var(--daf-t-slow) var(--daf-ease-out); }
@keyframes daf-diff-move { from { opacity: .45; } to { opacity: 1; } }
.daf-node[data-pinned="true"]::before { content: ''; position: absolute; top: -8px; left: -6px; font-size: 10px; opacity: .75; }
/* intent-trace 吸收：悬停节点 → 无关节点/边淡化，相关边加亮 */
.daf-scope[data-tracing="true"] .daf-node { opacity: .25; transition: opacity var(--daf-t-fast) var(--daf-ease-out); }
.daf-scope[data-tracing="true"] .daf-edge { opacity: .12; }
.daf-scope[data-tracing="true"] .daf-node[data-trace-hit="true"] { opacity: 1; }
.daf-scope[data-tracing="true"] .daf-edge[data-trace-hit="true"] { opacity: 1; }
.daf-node-ghost { border-style: dashed; border-color: var(--dsw-alias-border-l2); background: transparent; opacity: .55; pointer-events: none; }
.daf-node-ghost-title { text-decoration: line-through; color: var(--dsw-alias-label-secondary); font-size: 11.5px; }
@media (prefers-reduced-motion: reduce) {
  .daf-node[data-diff="added"], .daf-node[data-diff="moved"] { animation: none; } }

.daf-node[data-selected="true"] { animation: daf-select 2.4s ease-in-out infinite; }
@keyframes daf-select {
  0%, 100% { box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 40%, transparent), 0 0 10px color-mix(in srgb, var(--dsw-alias-brand-primary) 20%, transparent); }
  50% { box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-brand-primary) 70%, transparent), 0 0 22px color-mix(in srgb, var(--dsw-alias-brand-primary) 45%, transparent); }
}

.daf-anchor { position: absolute; width: 22px; height: 22px; padding: 0; cursor: crosshair;
  display: flex; align-items: center; justify-content: center;
  border: none; background: transparent; opacity: 0;
  transition: opacity var(--daf-t-fast) var(--daf-ease-out); }
.daf-anchor::before { content: ''; width: 10px; height: 10px; border-radius: 50%;
  border: 1.5px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1);
  transition: transform var(--daf-t-fast) var(--daf-spring), background-color var(--daf-t-fast) var(--daf-ease-out),
              border-color var(--daf-t-fast) var(--daf-ease-out); }
.daf-node:hover .daf-anchor, .daf-node[data-selected="true"] .daf-anchor, .daf-anchor[data-armed="true"] { opacity: 1; }
.daf-anchor:hover::before, .daf-anchor[data-armed="true"]::before {
  background: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); transform: scale(1.35); }
/* 连线进行中：所有锚点可见（矩形不是吸附目标，必须让人看见可以绑的目标） */
.daf-scope[data-connecting="true"] .daf-anchor { opacity: .5; }
.daf-scope[data-connecting="true"] .daf-node:hover .daf-anchor { opacity: .8; }
/* 会绑上的那一颗：放大并强调 */
.daf-anchor[data-snap="true"] { opacity: 1; }
.daf-anchor[data-snap="true"]::before {
  background: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary);
  transform: scale(1.7); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-brand-primary) 26%, transparent); }

.daf-flows { display: flex; align-items: center; gap: 6px; overflow-x: auto; max-width: min(52vw, 620px); padding-bottom: 2px; }
.daf-flows::-webkit-scrollbar { height: 4px; }
.daf-flow-cell { position: relative; display: inline-flex; }
.daf-flow-name { max-width: 168px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.daf-flows .daf-chip[data-active="true"] { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-primary);
  box-shadow: 0 0 0 1px var(--daf-glow-soft); }
.daf-flows .daf-chip[data-session="true"] { border-style: dashed; }
.daf-flow-menu { position: absolute; top: calc(100% + 4px); left: 0; z-index: 8; display: flex; flex-direction: column; gap: 4px;
  min-width: 132px; padding: 6px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px;
  background: var(--dsw-alias-bg-overlay); box-shadow: var(--daf-shadow-2);
  animation: daf-panel-in var(--daf-t-fast) var(--daf-ease-out) 1; }

.daf-zoom { display: inline-flex; align-items: center; gap: 4px; border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 8px; padding: 2px 4px; background: var(--dsw-alias-bg-layer-1); }
.daf-zoom input { width: 44px; text-align: center; background: transparent; border: none; color: var(--dsw-alias-label-primary);
  font-size: 12px; font-variant-numeric: tabular-nums; }
.daf-zoom input:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; border-radius: 4px; }
.daf-zoom button { border: none; background: none; color: var(--dsw-alias-label-secondary); cursor: pointer;
  padding: 2px 5px; border-radius: 6px; font-size: 12px; }
.daf-zoom button:hover { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-2); }

.daf-thumb { position: absolute; right: 8px; bottom: 8px; width: 132px; height: 92px; z-index: 3;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; background: color-mix(in srgb, var(--dsw-alias-bg-base) 82%, transparent);
  backdrop-filter: blur(6px); pointer-events: none; overflow: hidden; }
.daf-connect-preview { fill: none; stroke: var(--dsw-alias-brand-primary); stroke-width: 1.8; stroke-dasharray: 5 5; pointer-events: none; }

.daf-bind { fill: none; stroke: var(--dsw-alias-border-l2); stroke-width: 1.4; stroke-dasharray: 3 4; }
.daf-bind[data-level="1"] { stroke: var(--dsw-alias-brand-primary); opacity: .75; }

.daf-node[data-kind="group.steps"] { border-style: double; border-width: 3px; }
.daf-group-children { display: flex; flex-direction: column; gap: 3px; margin-top: 6px; }
.daf-child { display: flex; align-items: center; gap: 6px; border-left: 2px solid var(--dsw-alias-border-l2);
  padding-left: 6px; font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
.daf-child[data-status="running"] { border-left-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-primary); }
.daf-child[data-status="succeeded"] { border-left-color: var(--dsw-alias-state-success-primary); }
.daf-child[data-status="failed"] { border-left-color: var(--dsw-alias-state-error-primary); color: var(--dsw-alias-state-error-primary); }
.daf-child[data-status="skipped"] { opacity: .55; }

.daf-plan { border: 2px solid var(--dsw-alias-brand-primary); border-radius: 10px; padding: 8px;
  display: flex; flex-direction: column; gap: 6px; animation: daf-pulse 2.6s ease-in-out infinite; }

.daf-scope[data-contrast="high"] .daf-node,
.daf-scope[data-contrast="high"] .daf-inspector,
.daf-scope[data-contrast="high"] .daf-run-panel,
.daf-scope[data-contrast="high"] .daf-panel,
.daf-scope[data-contrast="high"] .daf-step { border-width: 2px; border-color: var(--dsw-alias-label-primary); }
.daf-scope[data-contrast="high"] .daf-node[data-status="pending"] { opacity: .75; }
.daf-scope[data-contrast="high"] .daf-muted { color: var(--dsw-alias-label-primary); }
.daf-scope[data-contrast="high"] .daf-edge { stroke-width: 2.4; }
@media (prefers-contrast: more) {
  .daf-node, .daf-inspector, .daf-run-panel, .daf-panel, .daf-step { border-width: 2px; border-color: var(--dsw-alias-label-primary); }
}
.daf-float { position: fixed; right: 16px; bottom: 16px; width: min(880px, 92vw); height: min(620px, 80vh);
  min-width: 360px; min-height: 260px; resize: both; overflow: hidden; z-index: 55;
  background: var(--dsw-alias-bg-overlay); border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px;
  box-shadow: var(--daf-shadow-3); display: flex; flex-direction: column; }
.daf-float-head { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-bottom: 1px solid var(--dsw-alias-border-l1); cursor: move; }
.daf-float-body { flex: 1 1 auto; min-height: 0; }
@media (prefers-reduced-motion: reduce) {
  .daf-node[data-status="running"]::after, .daf-edge-anim, .daf-run-ring, .daf-checkpoint { animation: none !important; }
}
`

    const POLL_MAX = 30000
    const pollDelay = (base, failures) => {
      if (typeof document !== 'undefined' && document.hidden) return POLL_MAX
      return Math.min(POLL_MAX, base * (2 ** Math.min(failures, 4)))
    }
    const samePlan = (a, b) => a?.status === b?.status
      && a?.turn === b?.turn
      && a?.workflowId === b?.workflowId
      && a?.updatedAt === b?.updatedAt
      && (a?.steps ?? []).length === (b?.steps ?? []).length
      && (a?.warnings ?? []).length === (b?.warnings ?? []).length

    const PARENT_LABELS = {
      superpowers: { zh: 'Superpower', en: 'Superpower' },
      'dsh-windows-acl': { zh: 'DSH 平台', en: 'DSH platform' },
      'dsh-bundled': { zh: 'DSH 内置', en: 'DSH bundled' },
      other: { zh: '未归类', en: 'Uncategorized' },
    }
    const CATEGORY_LABELS = {
      files: { zh: '文件与编辑', en: 'Files & editing' },
      process: { zh: '终端与进程', en: 'Terminal & processes' },
      agents: { zh: '子代理与团队', en: 'Agents & teams' },
      goals: { zh: '目标与计划', en: 'Goals & plans' },
      interaction: { zh: '交互与展示', en: 'Interaction & display' },
      web: { zh: '网络检索', en: 'Web' },
      flow: { zh: '流程与技能', en: 'Flow & skills' },
      knowledge: { zh: '知识与配置', en: 'Knowledge & config' },
      plugin: { zh: '插件运行时', en: 'Plugin runtime' },
      sessions: { zh: '会话', en: 'Sessions' },
      schedule: { zh: '定时任务', en: 'Scheduled tasks' },
      other: { zh: '其他', en: 'Other' },
    }
    const groupLabelOf = (kind, key, locale) => {
      const table = kind === 'skill' ? PARENT_LABELS : CATEGORY_LABELS
      const entry = table[key]
      if (!entry) return key
      return locale === 'en' ? entry.en : entry.zh
    }

    const KIND_LABELS = {
      'inject.context': { zh: '加载上下文', en: 'Inject context' },
      'inject.skill': { zh: '预载技能', en: 'Load skills' },
      'agent.task': { zh: 'Agent 任务', en: 'Agent task' },
      'tool.call': { zh: '调用工具', en: 'Call tool' },
      'branch.condition': { zh: '条件分支', en: 'Branch' },
      'flow.parallel': { zh: '并行', en: 'Parallel' },
      'flow.join': { zh: '汇合', en: 'Join' },
      'flow.loop': { zh: '循环', en: 'Loop' },
      'flow.wait': { zh: '等待', en: 'Wait' },
      'human.checkpoint': { zh: '人工确认', en: 'Checkpoint' },
      'io.output': { zh: '输出', en: 'Output' },
      'subflow.call': { zh: '子流程', en: 'Subflow' },
      'group.steps': { zh: '父级流程', en: 'Parent flow' },
    }

    function usePlan(sessionId) {
      const [plan, setPlan] = useState({ status: 'idle' })
      useEffect(() => {
        if (!sessionId) {
          setPlan({ status: 'idle' })
          return undefined
        }
        let closed = false
        let timer = null
        let failures = 0
        const tick = async () => {
          let base = 4000
          if (typeof document !== 'undefined' && document.hidden) {
            if (!closed) timer = setTimeout(tick, POLL_MAX)
            return
          }
          try {
            const result = await request('GET', `/plan?sessionId=${encodeURIComponent(sessionId)}`)
            const next = result?.plan ?? { status: 'idle' }
            base = next.status === 'awaiting' ? 1500 : 4000
            failures = 0
            if (!closed) setPlan((prev) => (samePlan(prev, next) ? prev : next))
          } catch {
            failures += 1
          }
          if (!closed) timer = setTimeout(tick, pollDelay(base, failures))
        }
        void tick()
        return () => {
          closed = true
          if (timer) clearTimeout(timer)
        }
      }, [sessionId])
      return plan
    }

    async function resolvePlan(action, sessionId, workflow) {
      if (action === 'confirm') return request('POST', '/plan/confirm', { sessionId, workflow })
      return request('POST', '/plan/skip', { sessionId, reason: '用户在画布上选择跳过' })
    }

    const NODE_KINDS = Object.keys(KIND_LABELS)
    const NODE_WIDTH = 220
    const NODE_HEIGHT = 96

    function kindLabel(kind, ctx) {
      const entry = KIND_LABELS[kind]
      if (!entry) return kind
      return langOf(ctx) === 'en' ? entry.en : entry.zh
    }

    function nodeSummary(node, ctx) {
      const t = dictFor(ctx)
      const params = node.params ?? {}
      switch (node.kind) {
        case 'inject.context':
          return `profile=${params.profileId ?? t.effective} · skills=${params.includeSkills !== false} · tools=${params.includeTools !== false}`
        case 'inject.skill':
          return `skills=${(params.names ?? []).join(', ') || '—'} · body=${params.body !== false}`
        case 'agent.task':
          return `${params.target === 'session' ? t.targetSession : t.targetSubagent} · ${String(params.prompt ?? '').slice(0, 90)}`
        case 'tool.call':
          return `${params.name ?? '—'}${params.allowDangerous === true ? ` · ⚠${t.dangerousAllowed}` : ''}`
        case 'branch.condition':
          return (params.cases ?? []).map((item) => `${item.port}: ${item.when}`).join(' | ') || '—'
        case 'flow.loop':
          return `max=${params.maxIterations ?? 5}${params.untilExpr ? ` · until ${params.untilExpr}` : ''}`
        case 'flow.wait':
          return params.untilIso ? `until ${params.untilIso}` : `${params.ms ?? 1000}ms`
        case 'human.checkpoint':
          return `${String(params.question ?? '').slice(0, 90)} · ${(params.options ?? []).join('/') || '继续/停止'}`
        case 'io.output':
          return String(params.template ?? '').slice(0, 110)
        case 'subflow.call':
          return `flow=${params.workflowId ?? '—'}`
        default:
          return ''
      }
    }

    const EDGE_SIDES = [
      'top', 'top-right', 'right', 'bottom-right', 'bottom', 'bottom-left', 'left', 'top-left',
      'top-q1', 'top-q3', 'right-q1', 'right-q3', 'bottom-q1', 'bottom-q3', 'left-q1', 'left-q3',
    ]
    const FACE_OF = (side) => {
      const s = String(side || '')
      if (s.startsWith('right')) return 'right'
      if (s.startsWith('left')) return 'left'
      if (s.startsWith('top')) return 'top'
      return 'bottom'
    }

    const EDGE_PALETTE_SIZE = 12

  const keyOf = (p) => `${Math.round(p.x)}:${Math.round(p.y)}`

  function segmentHitsRect(a, b, rect, gap) {
    const x1 = rect.x - gap, y1 = rect.y - gap, x2 = rect.x + rect.w + gap, y2 = rect.y + rect.h + gap
    const inBox = (p) => p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2
    if (inBox(a) || inBox(b)) return true
    const ccw = (p1, p2, p3) => (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x)
    const corners = [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]
    for (let i = 0; i < 4; i += 1) {
      const c1 = { x: corners[i][0], y: corners[i][1] }
      const c2 = { x: corners[(i + 1) % 4][0], y: corners[(i + 1) % 4][1] }
      const d1 = ccw(a, b, c1), d2 = ccw(a, b, c2), d3 = ccw(c1, c2, a), d4 = ccw(c1, c2, b)
      if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true
    }
    return false
  }

  function segmentClear(a, b, rects, gap) {
    for (const rect of rects) if (segmentHitsRect(a, b, rect, gap)) return false
    return true
  }

  function moveOutward(point, side, distance) {
    if (side === 'right') return { x: point.x + distance, y: point.y }
    if (side === 'left') return { x: point.x - distance, y: point.y }
    if (side === 'top') return { x: point.x, y: point.y - distance }
    return { x: point.x, y: point.y + distance }
  }

  /**
   * 均匀空间网格：
   * 按格子索引矩形，查询只返回可能与框相交的候选。该实现的格子边长 160。
   * insert/query 都用矩形包围盒；all() 返回全部条目，供需要全量时的兜底。
   */
  function createSpatialGrid(cellSize) {
    const buckets = new Map()
    const items = []
    const keyOf = (x, y) => x + ':' + y
    // 同时接受 {x,y,w,h} 与 {minX,maxX,minY,maxY} 两种矩形写法——
    // 调用点传的是节点矩形（x/y/w/h），读错字段会让索引为空、查询恒空（路由静默失效）。
    const toBounds = (value) => (Number.isFinite(value?.w) && Number.isFinite(value?.h))
      ? { minX: value.x, maxX: value.x + value.w, minY: value.y, maxY: value.y + value.h }
      : value
    const rangeOf = (value) => {
      const box = toBounds(value)
      return {
        x0: Math.floor(box.minX / cellSize), x1: Math.floor(box.maxX / cellSize),
        y0: Math.floor(box.minY / cellSize), y1: Math.floor(box.maxY / cellSize),
      }
    }
    return {
      insert(box, item) {
        items.push(item)
        const range = rangeOf(box)
        for (let x = range.x0; x <= range.x1; x += 1) {
          for (let y = range.y0; y <= range.y1; y += 1) {
            const key = keyOf(x, y)
            let bucket = buckets.get(key)
            if (!bucket) { bucket = []; buckets.set(key, bucket) }
            bucket.push(item)
          }
        }
      },
      query(box) {
        const range = rangeOf(box)
        const seen = new Set()
        const found = []
        for (let x = range.x0; x <= range.x1; x += 1) {
          for (let y = range.y0; y <= range.y1; y += 1) {
            const bucket = buckets.get(keyOf(x, y))
            if (!bucket) continue
            for (const item of bucket) {
              if (seen.has(item)) continue
              seen.add(item)
              found.push(item)
            }
          }
        }
        return found
      },
      all: () => items,
    }
  }

  function orthogonalRoute(fromRect, toRect, fromSide, toSide, obstacles, options) {
    const clearance = options.clearance ?? 10
    const bendPenalty = options.bendPenalty ?? 40
    const stub = (options.stub ?? clearance) + 2
    const obs = obstacles ?? []
    const start = { x: fromRect.x + fromRect.w / 2, y: fromRect.y + fromRect.h / 2 }
    const end = { x: toRect.x + toRect.w / 2, y: toRect.y + toRect.h / 2 }
    const startBase = {
      x: fromSide === 'right' ? fromRect.x + fromRect.w : fromSide === 'left' ? fromRect.x : start.x,
      y: fromSide === 'bottom' ? fromRect.y + fromRect.h : fromSide === 'top' ? fromRect.y : start.y,
    }
    const endBase = {
      x: toSide === 'right' ? toRect.x + toRect.w : toSide === 'left' ? toRect.x : end.x,
      y: toSide === 'bottom' ? toRect.y + toRect.h : toSide === 'top' ? toRect.y : end.y,
    }
    const startStub = moveOutward(startBase, fromSide, stub)
    const endStub = moveOutward(endBase, toSide, stub)
    const expanded = obs
      .filter((r) => r && Number.isFinite(r.x) && Number.isFinite(r.w))
      .map((r) => ({ x: r.x - clearance, y: r.y - clearance, w: r.w + clearance * 2, h: r.h + clearance * 2 }))
    const xs = new Set([startStub.x, endStub.x])
    const ys = new Set([startStub.y, endStub.y])
    for (const r of expanded) {
      xs.add(r.x - 1); xs.add(r.x + r.w + 1)
      ys.add(r.y - 1); ys.add(r.y + r.h + 1)
    }
    const MIN_SEG = 8
    const coalesce = (values, keep) => {
      const sorted = [...values].sort((a, b) => a - b)
      return sorted.reduce((kept, value) => {
        if (keep.has(value) || !kept.length || value - kept[kept.length - 1] >= MIN_SEG) kept.push(value)
        return kept
      }, [])
    }
    const orderedX = coalesce(xs, new Set([startStub.x, endStub.x]))
    const orderedY = coalesce(ys, new Set([startStub.y, endStub.y]))
    const budget = 1200
    if (orderedX.length * orderedY.length > budget) return null
    const blocked = (p) => expanded.some((r) => p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h)
    const nodes = new Map()
    for (const x of orderedX) {
      for (const y of orderedY) {
        const point = { x, y }
        if (!blocked(point)) nodes.set(keyOf(point), point)
      }
    }
    if (!nodes.has(keyOf(startStub)) || !nodes.has(keyOf(endStub))) return null
    const adjacency = new Map([...nodes.keys()].map((k) => [k, []]))
    const connectLine = (line, axis) => {
      for (let i = 0; i < line.length - 1; i += 1) {
        const left = line[i], right = line[i + 1]
        if (!segmentClear(left, right, expanded, 0)) continue
        const distance = Math.abs(right.x - left.x) + Math.abs(right.y - left.y)
        const axisChar = axis === 'h' ? 'R' : 'D'
        adjacency.get(keyOf(left)).push([keyOf(right), distance, axisChar])
        adjacency.get(keyOf(right)).push([keyOf(left), distance, axisChar === 'R' ? 'L' : 'U'])
      }
    }
    for (const y of orderedY) connectLine(orderedX.map((x) => nodes.get(keyOf({ x, y }))).filter(Boolean), 'h')
    for (const x of orderedX) connectLine(orderedY.map((y) => nodes.get(keyOf({ x, y }))).filter(Boolean), 'v')
    const opposite = { R: 'L', L: 'R', D: 'U', U: 'D' }
    const OUTWARD = { right: 'R', left: 'L', top: 'U', bottom: 'D' }
    const stateKey = (key, dir) => `${key}|${dir}`
    const sourceDir = OUTWARD[fromSide]
    const targetDir = opposite[OUTWARD[toSide]]
    const source = keyOf(startStub)
    const target = keyOf(endStub)
    const distances = new Map([[stateKey(source, sourceDir), 0]])
    const previous = new Map()
    const heap = [[0, stateKey(source, sourceDir)]]
    let visited = 0
    while (heap.length) {
      heap.sort((a, b) => a[0] - b[0])
      const [distance, current] = heap.shift()
      if (distance !== distances.get(current)) continue
      visited += 1
      if (visited > budget) return null
      const parts = current.split('|')
      for (const [nextKey, weight, dir] of adjacency.get(parts[0]) ?? []) {
        const turnCost = dir === parts[1] ? 0 : bendPenalty
        const nextDistance = distance + weight + turnCost
        const nextState = stateKey(nextKey, dir)
        if (nextDistance < (distances.get(nextState) ?? Infinity)) {
          distances.set(nextState, nextDistance)
          previous.set(nextState, current)
          heap.push([nextDistance, nextState])
        }
      }
    }
    let bestState = null
    let bestDistance = Infinity
    for (const dir of [targetDir, ...Object.keys(opposite)]) {
      const state = stateKey(target, dir)
      const distance = distances.get(state)
      if (distance !== undefined && distance < bestDistance) { bestDistance = distance; bestState = state }
    }
    if (bestState === null) return null
    const points = []
    let cursor = bestState
    while (cursor) {
      points.unshift(nodes.get(cursor.split('|')[0]))
      cursor = previous.get(cursor)
      if (points.length > 64) return null
    }
    points.push({ x: end.x, y: end.y })
    return points.every(Boolean) && points.length >= 2 ? points : null
  }

  function polylineToPath(points) {
    return points.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ')
  }


    // 文本适配：
    // 按可用宽度收缩字号，而不是直接省略号截断——普通超长文本"变小"而不是溢出/被切。
    // 口径与 一致：全角字符 2 个单位、其余 1 个单位（emoji 2），
    // 每单位每字号占 0.6px 宽，左右内边距合计 8px。
    const TEXT_FIT = { widthFactor: 0.6, horizontalPadding: 8 }
    const FULLWIDTH_RE = /[\u1100-\u115F\u2E80-\u303E\u3041-\u33FF\u3400-\u4DBF\u4E00-\u9FFF\uA000-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE6F\uFF00-\uFF60\uFFE0-\uFFE6]/
    function textUnits(text) {
      let units = 0
      for (const ch of String(text ?? '')) {
        const cp = ch.codePointAt(0)
        if (cp >= 0xfe00 && cp <= 0xfe0f) continue
        units += FULLWIDTH_RE.test(ch) ? 2 : 1
      }
      return units
    }
    function fittedFontSize(text, width, preferred, minimum) {
      const units = Math.max(1, textUnits(text))
      const available = Math.max(1, width - TEXT_FIT.horizontalPadding)
      const fitted = Math.min(preferred, available / (units * TEXT_FIT.widthFactor))
      return Math.max(minimum, Math.floor(fitted * 10) / 10)
    }

    function nodeHeight() {
      return NODE_HEIGHT
    }

    function rectOf(node, childCount = 0) {
      return { x: node.pos.x, y: node.pos.y, w: NODE_WIDTH, h: nodeHeight(node, childCount) }
    }

    function anchorPoint(rect, side) {
      const midX = rect.x + rect.w / 2
      const midY = rect.y + rect.h / 2
      const qx1 = rect.x + rect.w * 0.25
      const qx3 = rect.x + rect.w * 0.75
      const qy1 = rect.y + rect.h * 0.25
      const qy3 = rect.y + rect.h * 0.75
      const right = rect.x + rect.w
      const bottom = rect.y + rect.h
      switch (side) {
        case 'top':
          return { x: midX, y: rect.y, dir: 'up' }
        case 'top-q1':
          return { x: qx1, y: rect.y, dir: 'up' }
        case 'top-q3':
          return { x: qx3, y: rect.y, dir: 'up' }
        case 'top-right':
          return { x: right, y: rect.y, dir: 'right' }
        case 'right':
          return { x: right, y: midY, dir: 'right' }
        case 'right-q1':
          return { x: right, y: qy1, dir: 'right' }
        case 'right-q3':
          return { x: right, y: qy3, dir: 'right' }
        case 'bottom-right':
          return { x: right, y: bottom, dir: 'right' }
        case 'bottom':
          return { x: midX, y: bottom, dir: 'down' }
        case 'bottom-q1':
          return { x: qx1, y: bottom, dir: 'down' }
        case 'bottom-q3':
          return { x: qx3, y: bottom, dir: 'down' }
        case 'bottom-left':
          return { x: rect.x, y: bottom, dir: 'left' }
        case 'left':
          return { x: rect.x, y: midY, dir: 'left' }
        case 'left-q1':
          return { x: rect.x, y: qy1, dir: 'left' }
        case 'left-q3':
          return { x: rect.x, y: qy3, dir: 'left' }
        case 'top-left':
        default:
          return { x: rect.x, y: rect.y, dir: 'left' }
      }
    }

    function anchorStyle(side) {
      const positions = {
        top: { left: '50%', top: -10, transform: 'translateX(-50%)' },
        'top-q1': { left: '25%', top: -10, transform: 'translateX(-50%)' },
        'top-q3': { left: '75%', top: -10, transform: 'translateX(-50%)' },
        'top-right': { right: -10, top: -10 },
        right: { right: -10, top: '50%', transform: 'translateY(-50%)' },
        'right-q1': { right: -10, top: '25%', transform: 'translateY(-50%)' },
        'right-q3': { right: -10, top: '75%', transform: 'translateY(-50%)' },
        'bottom-right': { right: -10, bottom: -10 },
        bottom: { left: '50%', bottom: -10, transform: 'translateX(-50%)' },
        'bottom-q1': { left: '25%', bottom: -10, transform: 'translateX(-50%)' },
        'bottom-q3': { left: '75%', bottom: -10, transform: 'translateX(-50%)' },
        'bottom-left': { left: -10, bottom: -10 },
        left: { left: -10, top: '50%', transform: 'translateY(-50%)' },
        'left-q1': { left: -10, top: '25%', transform: 'translateY(-50%)' },
        'left-q3': { left: -10, top: '75%', transform: 'translateY(-50%)' },
        'top-left': { left: -10, top: -10 },
      }
      return positions[side] ?? positions.left
    }

    // ── 锚点吸附（核心逻辑变更）──
    // 连接线必须绑定在锚点上：吸附候选只有 16 个锚点，节点矩形本身不参与判定。
    // 半径按屏幕像素给出，换算到画布坐标时除以 zoom，保证手感不随缩放变化。
    const ANCHOR_SNAP_PX = 16

    // 导出底色：导出物是脱离界面的独立产物，需要固定的实心底色
    // （透明 PNG 在不同查看器里表现不一致；导出图也不应跟随界面主题变暗）。
    // 这是唯一允许出现硬编码白色的地方，界面本身一律走主题变量。
    const EXPORT_BACKGROUND = '#ffffff'

    /** 找离 point 最近的锚点；**超出半径返回 null**——矩形不在候选内。 */
    function nearestAnchor(rect, point, radius) {
      let bestSide = null
      let bestDistance = Infinity
      for (const side of EDGE_SIDES) {
        const anchor = anchorPoint(rect, side)
        const distance = Math.hypot(anchor.x - point.x, anchor.y - point.y)
        if (distance < bestDistance) {
          bestDistance = distance
          bestSide = side
        }
      }
      if (bestSide === null || bestDistance > radius) return null
      return { side: bestSide, distance: bestDistance }
    }

    function edgePath(fromRect, toRect, edge, obstaclesOrGrid = [], startOffset = 0, endOffset = 0) {
      const fromSide = edge?.fromSide && EDGE_SIDES.includes(edge.fromSide) ? edge.fromSide : 'right'
      const toSide = edge?.toSide && EDGE_SIDES.includes(edge.toSide) ? edge.toSide : 'left'
      const offset = (pt, side, amount) => {
        if (!amount) return pt
        const face = FACE_OF(side)
        if (face === 'left' || face === 'right') return { ...pt, y: pt.y + amount }
        return { ...pt, x: pt.x + amount }
      }
      const a = offset(anchorPoint(fromRect, fromSide), fromSide, startOffset)
      const b = offset(anchorPoint(toRect, toSide), toSide, endOffset)
      const custom = edge?.customPath
      if (custom && Number.isFinite(Number(custom.c1?.x)) && Number.isFinite(Number(custom.c2?.x))) {
        return `M ${a.x} ${a.y} C ${custom.c1.x} ${custom.c1.y}, ${custom.c2.x} ${custom.c2.y}, ${b.x} ${b.y}`
      }
      const grid = obstaclesOrGrid && typeof obstaclesOrGrid.query === 'function' ? obstaclesOrGrid : null
      const obstacles = Array.isArray(obstaclesOrGrid) ? obstaclesOrGrid : []
      if (grid) {
        // 快路径 + 精确前筛：直线是否被挡，只需查线段包围盒覆盖的格子。
        // 线段与矩形相交 ⇒ 两者包围盒必然相交，所以"查无命中"必然安全——
        // 无阻挡时直接返回直线，完全不启动 Dijkstra（绝大多数边走这条路）。
        const box = {
          minX: Math.min(a.x, b.x), maxX: Math.max(a.x, b.x),
          minY: Math.min(a.y, b.y), maxY: Math.max(a.y, b.y),
        }
        const blocked = grid.query(box).some((item) => item.id !== edge.from && item.id !== edge.to
          && segmentHitsRect(a, b, item.rect, 0))
        if (!blocked) return `M ${a.x} ${a.y} L ${b.x} ${b.y}`
        // 被挡住才做网格路由；此时用全量障碍，保证绕行不会漏掉远处节点。
        const full = grid.all()
          .filter((item) => item.id !== edge.from && item.id !== edge.to)
          .map((item) => item.rect)
        const route = orthogonalRoute(fromRect, toRect, fromSide, toSide, full, { clearance: 10 })
        if (route) {
          // 路由质检（吸收 route-quality）：折线超过直线 2.5 倍视为过度绕行，回退直线。
          const straight = Math.hypot(b.x - a.x, b.y - a.y) || 1
          let polyline = 0
          for (let i = 1; i < route.length; i += 1) polyline += Math.hypot(route[i].x - route[i - 1].x, route[i].y - route[i - 1].y)
          if (polyline / straight <= 2.5) return polylineToPath(route)
        }
        return `M ${a.x} ${a.y} L ${b.x} ${b.y}`
      }
      if (obstacles.length > 0) {
        const route = orthogonalRoute(fromRect, toRect, fromSide, toSide, obstacles, { clearance: 10 })
        if (route) return polylineToPath(route)
      }
      return `M ${a.x} ${a.y} L ${b.x} ${b.y}`
    }

    function edgeMidpoint(fromRect, toRect, edge) {
      const fromSide = edge?.fromSide && EDGE_SIDES.includes(edge.fromSide) ? edge.fromSide : 'right'
      const toSide = edge?.toSide && EDGE_SIDES.includes(edge.toSide) ? edge.toSide : 'left'
      const a = anchorPoint(fromRect, fromSide)
      const b = anchorPoint(toRect, toSide)
      const custom = edge?.customPath
      if (custom && Number.isFinite(Number(custom.c1?.x)) && Number.isFinite(Number(custom.c2?.x))) {
        return {
          x: 0.125 * a.x + 0.375 * custom.c1.x + 0.375 * custom.c2.x + 0.125 * b.x,
          y: 0.125 * a.y + 0.375 * custom.c1.y + 0.375 * custom.c2.y + 0.125 * b.y,
        }
      }
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    }

    function edgeColorStyle(edge) {
      if (!Number.isFinite(Number(edge?.color))) return undefined
      return { stroke: `var(--daf-edge-${Number(edge.color) % EDGE_PALETTE_SIZE})` }
    }

    function layoutWorkflow(workflow, mode) {
      if (!workflow) return workflow
      const layout = mode === 'star' || mode === 'radial' ? mode : 'chain'
      const positions = layoutPositions(workflow, layout)
      const nodes = workflow.nodes.map((node) => (node.pos?.pinned === true
        ? node
        : { ...node, pos: { ...node.pos, ...(positions.get(node.id) ?? {}) } }))
      return { ...workflow, layout, nodes }
    }

    /**
     * 统一布局引擎：先定结构，再投影。
     *
     * 第一步 分组：容器节点（阶段 / 组）与其子节点构成一个单元，单元整体参与排序
     *         ——从属关系不再被遍历深度打散，子节点始终跟着父容器走。
     * 第二步 排序：按连线方向给单元定层（单元级拓扑，环上单元放最后）；主干节点
     *         按主干序号插队；同层按「主干序 → 标题」稳定排序。
     * 第三步 投影：四种布局共享同一结构，只改坐标映射。
     *         从左到右 / 从上到下是同构投影（仅交换轴）；星图按深度分环；辐射图整圈。
     * 第四步 由调用方做重叠修复。
     */
    function layoutPositions(workflow, layout) {
      const positions = new Map()
      if (!workflow) return positions
      const nodes = workflow.nodes
      const isContainer = (node) => node.kind === 'phase' || node.kind === 'group.steps'
      const childrenOf = (id) => nodes.filter((node) => node.phaseId === id || node.parentId === id)

      // ── 单元划分 ──
      const containers = nodes.filter(isContainer)
      const unitOf = new Map()
      for (const container of containers) {
        unitOf.set(container.id, container.id)
        for (const child of childrenOf(container.id)) unitOf.set(child.id, container.id)
      }
      const units = [
        ...containers.map((container) => ({ id: container.id, members: [container.id, ...childrenOf(container.id).map((child) => child.id)] })),
        ...nodes.filter((node) => !unitOf.has(node.id)).map((node) => ({ id: node.id, members: [node.id] })),
      ]
      const unitByNode = new Map()
      for (const unit of units) for (const member of unit.members) unitByNode.set(member, unit.id)

      // ── 单元级拓扑分层 ──
      const outEdges = new Map(units.map((unit) => [unit.id, []]))
      const inDegree = new Map(units.map((unit) => [unit.id, 0]))
      for (const edge of workflow.edges ?? []) {
        const fromUnit = unitByNode.get(edge.from)
        const toUnit = unitByNode.get(edge.to)
        if (!fromUnit || !toUnit || fromUnit === toUnit) continue
        outEdges.get(fromUnit).push(toUnit)
        inDegree.set(toUnit, (inDegree.get(toUnit) ?? 0) + 1)
      }
      const depth = new Map()
      const queue = units.filter((unit) => (inDegree.get(unit.id) ?? 0) === 0).map((unit) => unit.id)
      for (const id of queue) depth.set(id, 0)
      const seen = new Set(queue)
      while (queue.length > 0) {
        const id = queue.shift()
        for (const next of outEdges.get(id) ?? []) {
          const candidate = (depth.get(id) ?? 0) + 1
          if (candidate > (depth.get(next) ?? 0)) depth.set(next, candidate)
          inDegree.set(next, (inDegree.get(next) ?? 0) - 1)
          if ((inDegree.get(next) ?? 0) === 0 && !seen.has(next)) { seen.add(next); queue.push(next) }
        }
      }
      // 环上的单元（入度永不为 0）与入口不可达的孤岛都排到最后——
      // 否则无入边的孤岛会被当成根，挤进第一层与主干抢位置。
      const entryUnit = workflow.entry ? unitByNode.get(workflow.entry) : null
      const reachable = new Set()
      if (entryUnit) {
        const todo = [entryUnit]
        while (todo.length > 0) {
          const id = todo.pop()
          if (reachable.has(id)) continue
          reachable.add(id)
          for (const next of outEdges.get(id) ?? []) if (!reachable.has(next)) todo.push(next)
        }
      }
      for (const unit of units) if (!depth.has(unit.id) || !reachable.has(unit.id)) depth.set(unit.id, units.length)

      // ── 层内稳定排序：主干序 → 标题 ──
      const mainIndex = new Map((Array.isArray(workflow.mainPath) ? workflow.mainPath : []).map((id, index) => [id, index]))
      const layers = new Map()
      for (const unit of units) {
        const d = depth.get(unit.id) ?? 0
        if (!layers.has(d)) layers.set(d, [])
        layers.get(d).push(unit)
      }
      const stableKey = (unit) => {
        let mainOrder = Infinity
        for (const id of unit.members) {
          const index = mainIndex.get(id)
          if (index !== undefined) mainOrder = Math.min(mainOrder, index)
        }
        return { mainOrder: mainOrder === Infinity ? 1e9 : mainOrder, title: byId(unit.id)?.title ?? '' }
      }
      const byId = (id) => nodes.find((node) => node.id === id)
      for (const [d, list] of layers) {
        list.sort((a, b) => stableKey(a).mainOrder - stableKey(b).mainOrder || stableKey(a).title.localeCompare(stableKey(b).title))
        layers.set(d, list)
      }

      // ── 投影 ──
      const GAP = 40
      const AXIS = 480
      if (layout === 'chain' || layout === 'tb') {
        // 从左到右 / 从上到下：同构投影，仅交换轴。
        const horizontal = layout === 'chain'
        const ALONG_STEP = horizontal ? 280 : NODE_HEIGHT + 140
        const ORIGIN = 60
        const CROSS_GAP = 40
        const crossSize = horizontal ? NODE_HEIGHT : NODE_WIDTH
        for (const [d, list] of layers) {
          const totalSpan = list.reduce((sum, unit) => {
            const members = horizontal ? unit.members.length : unit.members.length
            return sum + members * crossSize + CROSS_GAP * Math.max(0, members - 1)
          }, 0) + CROSS_GAP * Math.max(0, list.length - 1)
          let cross = (horizontal ? AXIS : 640) - totalSpan / 2
          for (const unit of list) {
            // 子节点排在容器右侧（横向）或下侧（纵向）一格——从属关系在坐标上可见。
            unit.members.forEach((id, memberIndex) => {
              const memberOffset = memberIndex === 0 ? 0 : (horizontal ? 120 : NODE_HEIGHT + 20)
              const along = ORIGIN + d * ALONG_STEP + memberOffset
              if (horizontal) positions.set(id, { x: along, y: Math.round(cross + crossSize / 2) })
              else positions.set(id, { x: Math.round(cross + crossSize / 2), y: along })
              cross += crossSize + CROSS_GAP
            })
            cross += CROSS_GAP
          }
        }
        return positions
      }

      if (layout === 'star') {
        // 星图：入口（或首单元）居中，其余按深度分环；环内按稳定序排角度。
        const hubUnit = layers.get(0)?.[0] ?? units[0]
        const cx = 560, cy = 440
        hubUnit.members.forEach((id, index) => {
          if (index === 0) { positions.set(id, { x: cx, y: cy }); return }
          // hub 的子节点小半径环绕中心，避免全部叠在中心点
          const angle = (Math.PI * 2 * (index - 1)) / Math.max(1, hubUnit.members.length - 1) - Math.PI / 2
          positions.set(id, { x: Math.round(cx + Math.cos(angle) * 130), y: Math.round(cy + Math.sin(angle) * 130) })
        })
        const byRing = new Map()
        for (const unit of units) {
          if (unit.id === hubUnit.id) continue
          const ring = Math.max(0, (depth.get(unit.id) ?? 1) - 1)
          if (!byRing.has(ring)) byRing.set(ring, [])
          byRing.get(ring).push(unit)
        }
        for (const [ring, list] of byRing) {
          const radius = 200 + ring * 170
          const totalSlots = list.reduce((sum, unit) => sum + unit.members.length, 0)
          let slot = 0
          for (const unit of list) {
            for (const id of unit.members) {
              const angle = (Math.PI * 2 * slot) / Math.max(1, totalSlots) - Math.PI / 2
              positions.set(id, { x: Math.round(cx + Math.cos(angle) * radius), y: Math.round(cy + Math.sin(angle) * radius) })
              slot += 1
            }
          }
        }
        return positions
      }

      // 辐射图：全部节点按稳定序放一圈。
      const cx = 560, cy = 440
      const all = units.flatMap((unit) => unit.members)
      const radius = Math.max(240, 90 + all.length * 22)
      all.forEach((id, index) => {
        const angle = (Math.PI * 2 * index) / Math.max(1, all.length) - Math.PI / 2
        positions.set(id, { x: Math.round(cx + Math.cos(angle) * radius), y: Math.round(cy + Math.sin(angle) * radius) })
      })
      return positions
    }


    function autoLayout(workflow) {
      return resolveOverlaps(layoutWorkflow(workflow, workflow?.layout ?? 'chain'))
    }

    /** 布局修复：重叠节点沿 y 网格下移到空位；钉住的不动。 */
    function resolveOverlaps(workflow) {
      if (!workflow) return workflow
      const placed = []
      const nodes = workflow.nodes.map((node) => {
        if (node.pos?.pinned === true) { placed.push({ x: node.pos.x, y: node.pos.y, w: NODE_WIDTH, h: NODE_HEIGHT }); return node }
        let { x, y } = node.pos
        let guard = 0
        while (placed.some((r) => x < r.x + r.w && x + NODE_WIDTH > r.x && y < r.y + r.h && y + NODE_HEIGHT > r.y) && guard < 40) {
          y += NODE_HEIGHT / 2
          guard += 1
        }
        placed.push({ x, y, w: NODE_WIDTH, h: NODE_HEIGHT })
        return { ...node, pos: { ...node.pos, y } }
      })
      return { ...workflow, nodes }
    }

    function orderByLayer(workflow) {
      if (!workflow) return []
      const out = new Map(workflow.nodes.map((node) => [node.id, []]))
      for (const edge of workflow.edges) out.get(edge.from)?.push(edge.to)
      const seen = new Map()
      const queue = [workflow.entry]
      seen.set(workflow.entry, 0)
      let guard = 0
      while (queue.length > 0 && guard < 10000) {
        guard += 1
        const id = queue.shift()
        for (const next of out.get(id) ?? []) {
          if (seen.has(next)) continue
          seen.set(next, (seen.get(id) ?? 0) + 1)
          queue.push(next)
        }
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
      return h('button', {
        type: type ?? 'button',
        className: `daf-btn${variant === 'primary' ? ' daf-btn-primary' : variant === 'danger' ? ' daf-btn-danger' : ''}`,
        onClick,
        disabled: disabled === true,
        title,
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

      useEffect(() => {
        if (!flowDock) return undefined
        const close = (event) => {
          if (event.target?.closest?.('.daf-flow-dock')) return
          setFlowDock(false)
        }
        window.addEventListener('mousedown', close)
        return () => window.removeEventListener('mousedown', close)
      }, [flowDock])

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

      const flowRows = flows.slice(0, 60).map((flow) => {
        const menu = purgePendingId === flow.id
          ? h('div', { className: 'daf-purge-warn', role: 'alert' },
              h('span', null, `3 ${t.purgeCountdown}`),
              h('span', { className: 'daf-purge-bar', 'aria-hidden': 'true' }),
              h(Btn, { onClick: () => setPurgePendingId(null) }, t.cancel))
          : flowMenu === flow.id
            ? h('div', { className: 'daf-flow-menu daf-flow-menu-static' },
                h(Btn, { onClick: () => { setFlowMenu(null); void duplicateFlow(flow) } }, t.duplicate),
                flow.archivedAt
                  ? h(Btn, { onClick: () => { setFlowMenu(null); void restoreFlowById(flow) } }, t.restoreFlow)
                  : h(Btn, { onClick: () => { setFlowMenu(null); void archiveFlowById(flow) } }, t.archiveFlow),
                flow.archivedAt
                  ? h(Btn, { variant: 'danger', onClick: () => { setFlowMenu(null); requestPurge(flow) } }, t.purgeFlow)
                  : null)
            : null
        return h('div', { key: flow.id, className: 'daf-flow-row' },
          h('button', {
            type: 'button',
            className: 'daf-chip daf-flow-row-chip',
            'data-active': String(flow.id === current?.id),
            'data-session': String(Boolean(sessionId) && flow.sessionId === sessionId),
            'data-archived': flow.archivedAt ? 'true' : undefined,
            'data-draft': flow.origin === 'auto-draft' ? 'true' : undefined,
            title: `${flow.name} · ${flow.nodes}${flow.archivedAt ? ` · ${t.archivedBadge}` : ''}${flow.turn ? ` · ${t.turnLabel} ${flow.turn}` : ''}`,
            onClick: () => { if (flow.id !== current?.id) void pickFlow(flow.id) },
            onContextMenu: (event) => {
              event.preventDefault()
              setFlowMenu((prev) => (prev === flow.id ? null : flow.id))
            },
          },
            Boolean(sessionId) && flow.sessionId === sessionId ? h(Icon, { name: 'bolt', size: 11 }) : null,
            h('span', { className: 'daf-flow-name' }, flow.name),
            h('span', { className: 'daf-chip-count' }, String(flow.nodes))),
          menu)
      })

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

      const flowDockView = h('div', { className: `daf-flow-dock${flowDock ? ' is-open' : ''}` },
        h('button', {
          type: 'button',
          className: 'daf-flow-dock-toggle',
          title: t.flowDock,
          'aria-expanded': String(Boolean(flowDock)),
          onClick: () => setFlowDock((value) => !value),
        },
          h(Icon, { name: 'layers', size: 16 }),
          activeFlowCount > 0 ? h('span', { className: 'daf-dock-badge' }, String(activeFlowCount)) : null),
        h('div', { className: 'daf-flow-dock-body' },
              h('div', { className: 'daf-flow-dock-head' },
                h('span', { className: 'daf-muted' }, `${t.flowDock} · ${flows.length}`),
                h('button', {
                  type: 'button',
                  className: 'daf-dock-switch',
                  onClick: () => setShowArchived((value) => !value),
                }, `${t.showArchived}: ${showArchived ? t.on : t.off}`)),
              flows.length === 0
                ? h('div', { className: 'daf-muted', style: { padding: '6px 8px' } }, t.canvasEmpty)
                : flowRows))

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
        const mid = edgeMidpoint(fromRect, toRect, edge)
        const flowState = state === 'idle' ? undefined : state
        const onMain = mainPathSet.size > 0 && mainPathSet.has(edge.from) && mainPathSet.has(edge.to)
        // 动效治理：预算内的边才播放流动；预算外的保留颜色与状态，只是不播动画。
        // 预算按语义归属分配，而不是按渲染顺序先到先得——否则前面的边会吃掉全部预算。
        const animating = state === 'active' && budgetEdgeIds.has(edge.id)
        const budgetSkip = state === 'active' && !animating ? 'skip' : undefined
        return h('g', { key: edge.id },
          h('path', { className: 'daf-edge-glow', d, 'data-state': flowState, 'data-main': onMain ? 'true' : undefined, style: colorStyle }),
          h('path', { className: 'daf-edge-flow', d, 'data-state': flowState, 'data-budget': budgetSkip, 'data-main': onMain ? 'true' : undefined, style: colorStyle }),
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
            mermaidOpen ? h(Modal, { title: t.mermaidImport, onClose: () => setMermaidOpen(false) },
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
                h('button', { type: 'button', onClick: () => cameraZoom(zoom / 1.15, { smooth: true }), 'aria-label': t.zoomOut }, '−'),
                h('input', {
                  value: `${Math.round(zoom * 100)}%`,
                  'aria-label': t.zoom,
                  onChange: (event) => {
                    const parsed = Number(String(event.target.value).replace('%', '').trim())
                    if (Number.isFinite(parsed) && parsed > 0) cameraZoom(parsed / 100, { smooth: true })
                  },
                }),
                h('button', { type: 'button', onClick: () => cameraZoom(zoom * 1.15, { smooth: true }), 'aria-label': t.zoomIn }, '+'),
                h('button', { type: 'button', onClick: fitToContent, title: t.zoomFit }, t.zoomFitLabel),
                h('button', { type: 'button', onClick: () => cameraZoom(1, { smooth: true }), title: t.zoomReset }, '1:1')),
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
