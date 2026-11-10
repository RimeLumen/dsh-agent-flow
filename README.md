# dsh-agent-flow (Agent Flow)

A DeepSeek Harness plugin that turns **each conversation's plan** into a node graph you can
review on a canvas, execute, and reuse.

> Current version **v0.1.0** (always in sync with the `version` field in `package.json`).

- **Context injector** — a bar in the conversation composer to pick this turn's tools and skills
  (index / preload / whitelist).
- **Flow canvas** — the agent draws the plan first, you confirm, then it runs; one canvas per
  session, versioned per turn.
- **Experience store (LRU)** — approved flow skeletons are kept per workspace and re-adopted
  in one click.

---

## Architecture

```
┌──────────────────────────  DeepSeek Harness ────────────────────────┐
│                                                                     │
│  Session A ◄── session/created ─┐      Session B ──► …one canvas each│
│      │                          │                                    │
│      ▼                          │                                    │
│  ┌──────────────┐   flow_plan    ┌──────────────┐   SSE frames       │
│  │ plan manager  │ ─publish/ok──►│  Workflow     │◄──── live status   │
│  └──────────────┘                └──────────────┘                    │
│      │ injection             ▲ persisted     │ run                   │
│      ▼                       │               ▼                       │
│  ┌──────────────┐    ┌──────────────┐  ┌──────────────┐             │
│  │ selection.js  │    │ store.js      │  │ scheduler.js  │            │
│  └──────────────┘    └──────────────┘  └──────────────┘             │
│                                                                     │
│  HTTP routes (39, loopback only): /api/agent-flow/*                  │
│                                                                     │
│  Browser half client.js (single-file React, no build):               │
│    injector bar ─ canvas (dock / edges / layouts / hover cards)      │
│    ─ plan approval bar ─ experience cards                            │
└─────────────────────────────────────────────────────────────────────┘
```

### Host half (`src/host/*`, Node ESM, zero dependencies)

| Module | Responsibility |
|---|---|
| `index.js` | Plugin entry: `apply(ctx)` wires persistence, injection, routes, `flow_status` / `flow_plan` tools |
| `store.js` | Single-file current-state persistence (`<DSH_PROFILE_DIR>/agent-flow/`); no history, no snapshots |
| `flow/model.js` | Graph model (nodes / edges / phases) and static validation (advisory issues, not a gate) |
| `flow/scheduler.js` | GraphRunner: topological execution, parallel / join / loop, subflows, AbortController cancel |
| `flow/handlers.js` | Node handlers (inject / skill / tool / checkpoint / subflow…); dangerous tools require explicit opt-in |
| `plan.js` | Plan-first: `flow_plan` publish → wait for confirm/adjust → timeout releases per config; same canvas, `turn+1` per round |
| `experience.js` | Experience store: per-workspace skeletons, LRU (`score = adoptions / (1 + hours)`), pinned never evicted |
| `routes/*` | 39 HTTP endpoints in 9 domains (table below), loopback only, unified error envelope |
| `mermaid.js` | Mermaid export / constrained-subset import |
| `selection.js` | Injection: writes the tool/skill manifest into the session system prompt |

### Browser half (`src/client.js`, single file, no build)

A single file is a hard constraint of the module loader (the client mounts via
`window.__ModuleLoader__.load`; there is no separate build artifact). Internally it is
organized by section: locales (zh/en) → API client → widgets → injector bar → settings →
canvas (toolbar / dock / SVG edges / hover cards / turn diff) → plan bar → experience cards → wiring.

---

## Install

```powershell
# In DSH, point plugin_manager's install_bundle at this directory
# target = <absolute path of your clone>
```

Then **restart the DSH process** (the host half runs through Node ESM cache); the browser half
loads on page refresh. Verify via `GET /api/agent-flow/diagnostics` — `tools` should read
`{ flow_status: true, flow_plan: true }`.

---

## Usage

### 1. Context injector (conversation bar)

- **Modes**: index (manifest only) / preload (manifest + skill bodies) / whitelist (only ticked tools callable).
- **Grouping**: skills are grouped by **parent pack** (e.g. the 15 Superpower skills collapse under
  `Superpower`); official tools are grouped by **duty type** (files & editing / terminal & processes /
  agents & teams / goals & plans / web …). Group headers toggle collapse, and the filter uses the
  same keys.
- **Profiles**: save as many as you like; an AI-configured `Default` profile is generated from the catalog;
  apply globally, per workspace, or per session.

### 2. Flow canvas (⚡ tab in the right sidebar)

- **Session-bound canvas**: a new conversation starts with its own empty canvas; every round the
  agent draws onto the same one and `turn` increments.
- **Toolbar**: new / save / archive / delete (to recycle bin) / ▶run (single primary button; while
  running it becomes pause / resume / cancel); zoom box; `⋯more` (validate / auto-layout / layout /
  compact / developer panels / Mermaid).
- **Edges**: drag to connect; rendered as the **shortest straight line** by default; arcs you draw
  are kept in `customPath` (free-hand curve); **right-click an edge** → edit anchors (16 per end) /
  reset to straight / change color / delete; multiple edges from one anchor fan out automatically.
- **Anchors & direction**: each rectangle snaps on **16 judgment points** (4 corners + 4 edge
  midpoints + 8 quarter points); a new connection picks faces by relative bearing — side centers
  when horizontal dominates, top/bottom centers when vertical dominates; a drop point on the same
  face snaps precisely to that point.
- **Theme**: light and dark are both first-class — button labels and shadows come from derived
  variables (`--daf-on-brand` / `--daf-shadow-*`), and the edge palette switches to a brighter set
  under `prefers-color-scheme: dark`.
- **Nodes**: click to expand details (type / tool / params / children / dependencies); hover shows a
  progress card while running.
- **Layouts**: chain (spine left→right, branches top→down) / star / radial; each turn auto-tidies;
  nodes you dragged are pinned and never moved.
- **Flow dock**: a round button on the right edge opens the flow list; the recycle bin
  (archive / restore / 3-second purge slider) lives inside.
- **Debug mode**: off by default — inspector / steps / run log are not rendered at all; you see one
  full canvas. Toggle from the toolbar.

### 3. Plan-first (model contract)

The model only calls `flow_plan`:

```json
{
  "title": "This turn",
  "mode": "task",
  "layout": "chain",
  "phases": [
    { "title": "Phase 1 survey", "goal": "…", "subtasks": [
      { "title": "scan call sites", "kind": "tool.call", "tool": "grep", "args": "{}" },
      { "title": "sketch dependencies", "reliesOn": ["scan call sites"] }
    ]}
  ]
}
```

- Without `phases` the legacy `steps` contract applies; `reliesOn` references are written as
  **titles** and unresolvable ones are reported back as warnings (never silently dropped).
- After publishing, the user confirms on the canvas: confirm / adjust / switch layout / skip;
  timeouts release per config and are reported honestly.
- **Live progress while executing**: call `flow_progress({ title, status: "running" })` when a
  step starts, "succeeded" when done, "failed" on failure — the node and its edges light up and
  flow in real time.

### 4. Experience store

- The plan bar lists **experience cards** per workspace: clicking adopts a skeleton into this
  turn's canvas and bumps its adoption count;
- every 10 turns a "save as experience" prompt appears; limit 24 per key, `pinned` never evicted,
  all-pinned overflow returns `EXPERIENCE_FULL`.

### 5. Mermaid

- `⋯more` → **Copy Mermaid** (phases become subgraphs, sequence edges `-.->`, dependencies `-->`);
- **Import Mermaid**: constrained subset (nodes / sequence edges / `==>`→depends-on /
  subgraph→phase); unsupported lines are skipped and reported.

---

## Configuration

Preferences persist in the data file (`PUT /api/agent-flow/prefs`); editable from settings and canvas:

| Key | Default | Meaning |
|---|---|---|
| `mode` | `index` | injection mode: index / preload / whitelist |
| `promptBudget` | `12000` | injection text budget (characters) |
| `planTimeoutMs` | `120000` | how long to wait for plan confirmation |
| `maxParallel` | `3` | run-time parallelism cap |
| `nodeTimeoutMs` | `600000` | per-node timeout |
| `showDevPanels` | `false` | developer panels (inspector/steps/log), not rendered by default |
| `highContrast` | `false` | high-contrast mode |
| `canvasZoom` | `1` | remembered canvas zoom |

`flow_plan` tool timeout = plan wait + 15s (so the call is still alive when you confirm).

---

## HTTP API (loopback only, prefix `/api/agent-flow`)

| Domain | Routes |
|---|---|
| Catalog | `GET /catalog` |
| Profiles | `GET·PUT /selection`, `DELETE /selection/:id`, `POST /selection/default`, `POST /selection/:id/duplicate`, `POST /selection/:id/apply`, `GET /selection/effective` |
| Workflows | `GET·POST /workflows`, `GET·PUT·DELETE /workflows/:id`, `POST /workflows/:id/validate`, `GET /workflows/:id/mermaid`, `POST /workflows/import-mermaid` |
| Runs | `GET·POST /runs`, `GET /runs/:id`, `POST /runs/:id/control`, `GET /runs/:id/stream` (SSE) |
| Preferences | `GET·PUT /prefs` |
| Diagnostics | `GET /diagnostics` |
| Data | `GET /export`, `POST /import` |
| Plans | `GET /plan`, `POST /plan/confirm`, `POST /plan/skip` |
| Errors | `GET /errors`, `GET /errors/:id`, `POST /errors/clear` |
| Experiences | `GET·POST /experiences`, `POST /experiences/:id/pin`, `POST /experiences/:id/adopt`, `DELETE /experiences/:id` |

Errors share one envelope: `{ error, code, kind, json }` (schema documented in `docs/error-schema.md`,
a local development file not distributed with the repository).

---

## Data & privacy

- Data lives only under `<DSH_PROFILE_DIR>/agent-flow/`: `state.json` (current state) and
  `errors/errors.jsonl` (rolling 200 entries).
- HTTP accepts loopback connections only; no telemetry, no outbound calls, no credentials.
- Eviction is **deletion** — no archives; no hashing, no fingerprinting (local discipline file not
  distributed with the repository).

## Constraints

- Zero runtime dependencies (host uses `node:` built-ins only; browser uses `require('react')`).
- The browser half must stay a single file (module loader constraint; see `docs/decisions/0001`, local file).
- Styling uses only `--dsw-alias-*` theme tokens (derived `--daf-*` variables resolve per theme);
  motion uses transform/opacity only and respects `prefers-reduced-motion`.
- **Polling & rendering**: polling backs off long while the page is hidden and exponentially on
  failure (capped at 30s, reset on success); the plan and flow list only update state when their
  **content changed**, so a poll never re-renders the whole tree.

## License

[MIT](LICENSE) © 2026 RimeLumen
