/* @client-shard: 04-css */
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

/* 流程管理壳已改为贴屏右侧抽屉（daf-drawer-right），旧的圆钮定位样式随之移除。 */
.daf-dock-badge { position: absolute; top: -5px; right: -5px; min-width: 17px; height: 17px; border-radius: 999px;
  background: var(--dsw-alias-brand-primary); color: var(--daf-on-brand); font-size: 10px; font-weight: 600;
  display: inline-flex; align-items: center; justify-content: center; padding: 0 4px; }
.daf-dock-badge { position: absolute; top: -5px; right: -5px; min-width: 17px; height: 17px; border-radius: 999px;
  background: var(--dsw-alias-brand-primary); color: var(--daf-on-brand); font-size: 10px; font-weight: 600;
  display: inline-flex; align-items: center; justify-content: center; padding: 0 4px; }
/* 旧 dock body 的绝对定位样式已随抽屉化移除（抽屉容器提供滚动与背景）。 */

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
  .daf-drawer-right { animation: none; }
  .daf-purge-bar::before { animation-duration: 3s; } }

/* 窄屏下的旧 dock 样式已随抽屉化移除。 */
.daf-flow-check { flex: none; width: 14px; height: 14px; accent-color: var(--dsw-alias-brand-primary); cursor: pointer; }
.daf-batch-bar { display: flex; align-items: center; gap: 6px; padding: 5px 8px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 8%, transparent); }
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
/* 贴屏右侧抽屉：与画布等高，滑入淡出 */
.daf-drawer-backdrop { position: fixed; inset: 0; z-index: 60; background: var(--daf-scrim);
  opacity: 0; animation: daf-drawer-fade var(--daf-t-fast) var(--daf-ease-out) forwards; }
@keyframes daf-drawer-fade { to { opacity: 1; } }
.daf-drawer-right { position: absolute; top: 0; right: 0; bottom: 0; width: min(440px, 46vw);
  display: flex; flex-direction: column; gap: 10px; padding: 14px; overflow: auto;
  background: var(--dsw-alias-bg-overlay); border-left: 1px solid var(--dsw-alias-border-l1);
  box-shadow: var(--daf-shadow-3); animation: daf-slide-in var(--daf-t-base) var(--daf-ease-out); }
@keyframes daf-slide-in { from { transform: translateX(24px); opacity: 0; } to { transform: none; opacity: 1; } }
.daf-drawer-head { display: flex; align-items: center; gap: 8px; }
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
/* 悬停名称提示：淡入淡出；右缘竖栏时出现在按钮左侧 */
.daf-tip { position: relative; }
.daf-tip::after { content: attr(data-tip); position: absolute; left: 50%; top: calc(100% + 6px);
  transform: translateX(-50%); padding: 3px 8px; border-radius: 6px; font-size: 11px; white-space: nowrap;
  background: var(--dsw-alias-bg-overlay); color: var(--dsw-alias-label-primary);
  border: 1px solid var(--dsw-alias-border-l1); box-shadow: var(--daf-shadow-1);
  opacity: 0; pointer-events: none; z-index: 80;
  transition: opacity var(--daf-t-fast) var(--daf-ease-out); }
.daf-tip:hover::after, .daf-tip:focus-visible::after { opacity: 1; }
.daf-side-rail .daf-tip::after { left: auto; right: calc(100% + 8px); top: 50%; transform: translateY(-50%); }
@media (prefers-reduced-motion: reduce) { .daf-tip::after { transition: none; } }
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
  /* 流动只属于 data-animate 的边（运行中/主干），其余保持静态——
     节点多时几百条无限动画会让整片连线高频闪烁 */
  transition: opacity var(--daf-t-base) var(--daf-ease-out); }
.daf-edge-flow[data-animate="true"] { animation: daf-flow-move var(--daf-flow-dur, 3.4s) linear infinite; }

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
/* ready 是未开始的常态，不播放呼吸——节点多时整片边框都在闪 */
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

/* 选中态用静态强调，不做无限循环——节点多时反复重选会变成持续闪烁 */
.daf-node[data-selected="true"] { box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 40%, transparent), 0 0 10px color-mix(in srgb, var(--dsw-alias-brand-primary) 20%, transparent); }
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

