# dsh-agent-flow（Agent Flow · 流程中枢）

DeepSeek Harness 插件：把「**每轮对话的计划**」变成画布上可确认、可执行、可沉淀的节点流程。

> 当前版本 **v0.1.0**（与 `package.json` 内置版本一致）。

- **上下文注入容器**：对话栏内按会话勾选本轮可用的工具与技能（登记 / 预载 / 白名单三档）。
- **节点流程画布**：Agent 每轮先画流程、用户确认后再执行；画布与 Session 一一绑定，每轮递增版本。
- **经验库（LRU）**：把拍板过的流程骨架按工作区沉淀，下一轮一键采纳。

---

## 架构

```
┌───────────────────────────  DeepSeek Harness ───────────────────────────┐
│                                                                         │
│  会话 A ◄── session/created ──┐         会话 B ──► …（每个会话一张画布） │
│       │                       │                                         │
│       ▼                       │                                         │
│  ┌───────────────┐   flow_plan   ┌────────────────┐    SSE 帧流        │
│  │ 计划管理 plan.js│ ──发布/确认──►│  画布 Workflow  │◄──── 实时状态       │
│  └───────────────┘               └────────────────┘                     │
│       │ 落地注入               ▲ 持久化        │ 运行                    │
│       ▼                        │               ▼                        │
│  ┌───────────────┐     ┌──────────────┐  ┌────────────────┐            │
│  │ selection.js   │     │ store.js      │  │ scheduler.js    │           │
│  │ 工具/技能注入   │     │ 单文件当前态   │  │ GraphRunner     │           │
│  └───────────────┘     └──────────────┘  └────────────────┘            │
│                                                                         │
│  HTTP 路由（39 条，回环 only）: /api/agent-flow/*                        │
│                                                                         │
│  浏览器半 client.js（单文件 React，无构建）：                             │
│    注入容器 ─ 画布（停靠栏/连线/布局/悬停卡）─ 计划确认条 ─ 经验卡        │
└─────────────────────────────────────────────────────────────────────────┘
```

### 宿主半（`src/host/*`，Node ESM，零依赖）

| 模块 | 职责 |
|---|---|
| `index.js` | 插件入口：`apply(ctx)` 装配持久化、注入落地、路由、`flow_status` / `flow_plan` 工具 |
| `store.js` | 单文件当前态持久化（`<DSH_PROFILE_DIR>/agent-flow/`），不写历史与快照 |
| `flow/model.js` | 图模型（节点/边/Phase）与静态校验（issue 级，不是门禁） |
| `flow/scheduler.js` | GraphRunner：拓扑执行、并行/汇合/循环、子流程、AbortController 取消 |
| `flow/handlers.js` | 节点处理器（注入/技能/工具/检查点/子流程…），危险工具显式授权 |
| `plan.js` | 计划先行：`flow_plan` 发布 → 等待确认/调整 → 超时按配置放行；同一画布每轮 `turn+1` |
| `experience.js` | 经验库：按工作区键沉淀流程骨架，LRU（`score = adoptions / (1 + 小时)`），pinned 不淘汰 |
| `routes/*` | HTTP API 9 域 39 条（见下表），回环 only，统一错误信封 |
| `mermaid.js` | Mermaid 导出 / 受限子集导入 |
| `selection.js` | 注入落地：工具/技能清单按会话写进系统提示词 |

### 浏览器半（`src/client.js`，单文件，无构建）

单文件是模块加载器的硬约束（客户端以 `window.__ModuleLoader__.load` 动态挂载，无独立构建产物）。
内部按区块组织：文案（zh/en）→ API 客户端 → 通用控件 → 注入容器 → 设置分区 → 画布（工具栏 /
停靠栏 / SVG 连线 / 悬停卡 / 差异高亮）→ 计划确认条 → 经验卡 → 装配。

---

## 安装

```powershell
# 在 DSH 里用 plugin_manager 的 install_bundle 指向本目录
# target = <本仓库克隆目录的绝对路径>
```

安装后**重启 DSH 进程**（宿主半走 Node ESM 缓存）；浏览器半随页面刷新加载。
确认方式：`GET /api/agent-flow/diagnostics` 的 `tools` 字段应为 `{ flow_status: true, flow_plan: true }`。

---

## 使用方式

### 1. 上下文注入容器（对话栏）

- **模式**：登记（只写清单）/ 预载（连正文写入提示词）/ 白名单（只放行勾选的工具）。
- **分组**：技能按**父级包**归组（如 15 个 Superpower 技能收在 `Superpower` 下），
  官方工具按其**职责类型**分类（文件与编辑 / 终端与进程 / 子代理与团队 / 目标与计划 / 网络检索 …）；
  分组标题可点击折叠，右上筛选器与分组键一致。
- **方案**：任意保存多套；AI 默认方案 `Default` 随目录自动生成；可按全局 / 工作区 / 会话三档应用。

### 2. 流程画布（右侧栏 ⚡ 标签）

- **画布与 Session 绑定**：新对话自动建一张绑定该会话的空画布；Agent 每轮的流程画在同一张上，`turn` 递增。
- **工具栏**：新建 / 保存 / 归档 / 删除（入回收站）/ ▶运行（唯一主按钮，运行中变暂停/继续/取消）；
  缩放框；`⋯更多`（校验 / 自动整理 / 布局 / 紧凑 / 开发者面板 / Mermaid）。
- **连线**：拖动即连，默认渲染**两点间最短直线**；自己拖出的弧度保存在 `customPath`（自由曲线）；
  **右键连线** → 编辑锚点（两端各 16 个锚点）/ 恢复直线 / 换色 / 删除；同锚点多线自动切向错开。
- **锚点与方向**：矩形按 **16 个判定点**吸附（4 角 + 4 边中点 + 8 个四分点）；
  建立连接时按相对方位自动选面——左右为主取两侧面中心，上下为主取顶/底中心；
  落点若与方向面同面，则精确吸附到该点。
- **主题**：浅色 / 深色各自成立——按钮文字与阴影取自派生变量（`--daf-on-brand` / `--daf-shadow-*`），
  连线色卡在深色下切换为高明度配色（`prefers-color-scheme` 驱动）。
- **节点**：点击展开详情（类型 / 工具 / 参数 / 子节点 / 依赖）；悬停显示运行进度信息卡。
- **布局**：链式（主干横排、分支纵列）/ 星形 / 环形；每轮更新自动整理，手动拖过的节点被钉住。
- **流程停靠栏**：右缘圆钮点击弹出；回收站（归档 / 恢复 / 永久删除 3 秒滑条）在其中。
- **调试模式**：默认关——检查器 / 步骤 / 运行日志完全不渲染，用户面对一整块画布；工具栏按钮开启。

### 3. 计划先行（模型协议）

模型侧只需调用 `flow_plan`：

```json
{
  "title": "本轮标题",
  "mode": "task",
  "layout": "chain",
  "phases": [
    { "title": "Phase 1 现状梳理", "goal": "…", "subtasks": [
      { "title": "扫描调用点", "kind": "tool.call", "tool": "grep", "args": "{}" },
      { "title": "画依赖草图", "reliesOn": ["扫描调用点"] }
    ]}
  ]
}
```

- 无 `phases` 时退回 `steps` 协议；`reliesOn` 写**标题**，解析失败逐条回警告（不静默丢边）。
- 发布后等待用户在画布确认：确认 / 局部调整 / 换个布局 / 跳过；超时按配置放行并如实告知。
- **执行时实时点亮画布**：每开始一个步骤调用 `flow_progress({ title: 步骤标题, status: "running" })`，完成时 "succeeded"、失败 "failed"——对应节点与连线实时流动。

### 4. 经验库

- 确认条按工作区展示「历史经验」卡：**点击采纳** = 骨架写入本轮画布 + 采纳数 +1；
- 每 10 轮提示「存为经验」；上限 24 条 / 键，`pinned` 永不淘汰，全 pinned 超限返回 `EXPERIENCE_FULL`。

### 5. Mermaid 互通

- 「更多」→ **复制 Mermaid**（Phase→subgraph、顺序边 `-.->`、依赖边 `-->`）；
- **导入 Mermaid**：受限子集（节点 / 顺序边 / `==>`→依赖 / subgraph→Phase），不支持的行逐条跳过并报告。

---

## 配置

偏好持久化在数据文件（`PUT /api/agent-flow/prefs`），设置分区与画布均可改：

| 键 | 默认 | 说明 |
|---|---|---|
| `mode` | `index` | 注入模式：index / preload / whitelist |
| `promptBudget` | `12000` | 注入文案预算（字符） |
| `planTimeoutMs` | `120000` | 计划确认等待（超时放行） |
| `maxParallel` | `3` | 运行时并行上限 |
| `nodeTimeoutMs` | `600000` | 单节点超时 |
| `showDevPanels` | `false` | 开发者面板（检查器/步骤/日志），默认不渲染 |
| `highContrast` | `false` | 高对比度 |
| `canvasZoom` | `1` | 画布缩放记忆 |

`flow_plan` 工具超时 = 计划等待 + 15s（保证用户确认时调用仍在）。

---

## HTTP API 一览（回环 only，前缀 `/api/agent-flow`）

| 域 | 路由 |
|---|---|
| 目录 | `GET /catalog` |
| 方案 | `GET·PUT /selection`、`DELETE /selection/:id`、`POST /selection/default`、`POST /selection/:id/duplicate`、`POST /selection/:id/apply`、`GET /selection/effective` |
| 流程 | `GET·POST /workflows`、`GET·PUT·DELETE /workflows/:id`、`POST /workflows/:id/validate`、`GET /workflows/:id/mermaid`、`POST /workflows/import-mermaid` |
| 运行 | `GET·POST /runs`、`GET /runs/:id`、`POST /runs/:id/control`、`GET /runs/:id/stream`（SSE） |
| 偏好 | `GET·PUT /prefs` |
| 诊断 | `GET /diagnostics` |
| 数据 | `GET /export`、`POST /import` |
| 计划 | `GET /plan`、`POST /plan/confirm`、`POST /plan/skip` |
| 错误 | `GET /errors`、`GET /errors/:id`、`POST /errors/clear` |
| 经验 | `GET·POST /experiences`、`POST /experiences/:id/pin`、`POST /experiences/:id/adopt`、`DELETE /experiences/:id` |

错误统一信封：`{ error, code, kind, json }`，结构与 `docs/error-schema.md` 一致（该文档为本地开发文件，不随仓库分发）。

---

## 数据与隐私

- 数据只落 `<DSH_PROFILE_DIR>/agent-flow/`：`state.json`（当前态）与 `errors/errors.jsonl`（滚动 200 条）。
- HTTP 只接受本机回环；无遥测、无外呼、无凭据。
- 经验淘汰是**删除**，不留档案；不计算哈希、不做指纹（本地纪律文件不随仓库分发）。

## 约束

- 零运行时依赖（宿主只用 `node:` 内置；浏览器只用 `require('react')`）。
- 浏览器半必须单文件（模块加载器限制，见 `docs/decisions/0001`——本地文件）。
- 样式只用 `--dsw-alias-*` 主题 token（派生变量 `--daf-*` 在浅/深色下各自成立）；
  动效只用 transform/opacity，尊重 `prefers-reduced-motion`。
- **轮询与渲染**：页面不可见时轮询进入长退避、失败按指数退避（上限 30s）、成功即复位；
  计划与流程列表只在**内容变化**时更新状态，避免每次轮询触发整树重渲染。

## License

[MIT](LICENSE) © 2026 RimeLumen
