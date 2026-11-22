/* @client-shard: 01-shim */
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

