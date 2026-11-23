# TIP · V0.1.0 发布前整改摘要（2026-11-23）

> 统计口径：`51a8e09`（上次成功推送的 Fix）→ 当前 `Fix`，共 **19 个提交**，22 个文件 **+1005 / −753** 行。
> 依据：docs/audit/2026-11-23-full-audit.md（8 子代理并行审计，112 条发现）+ docs/plans/2026-11-23-master-plan.md（R1–R8 总方案，36 轮迭代）。

## 八个批次

| 批次 | 主题 | 要点 |
|---|---|---|
| R1 | P0 修复 | 6 条功能失效级缺陷归位：normalizeWorkflow 未导入（子代理继承曾整体失效）、exit 钩子 require 在 ESM 下失效（保底写盘从未生效）、工具 disposer 泄漏、SVG 导出转义丢失、轮询强制拽回、经验库自动入库不经 mutate |
| R2 | 交互热路径 | 拖拽 DOM 直写（move 零全量渲染）、childrenByParent 预聚合（消 O(N²)）、routeCache 结构签名失效、edgeMids 增量测量 |
| R3 | 一致性 | validateWorkflow 建图 3 次→1 次、phase 双写单一事实源、循环体取消不再误报失败、mermaid 依赖导出/导入往返保真、告警 level 统一 |
| R4 | 生命周期 | plans Map LRU、draftTurns 会话清理、waitFor waiter 摘除、StyleTag 按串去重注入、四工具 store.ready() 就绪门 |
| R5 | Token 经济 | flow_status 输出上限、进度协议精简、4xx 短错误包络、compose sections 剔除 |
| R6 | 结构 | **flow-tools.js 抽取**（四工具定义文件化，index.js 742→385 行）、buildStepParams 修复制漂移实 bug（tool.call 子节点执行必失败）、checkReliesOn 双模式校验、planRoutes 最小注入面 |
| R7 | UX 防误 | 批量删除确认框、Esc 弹层栈（只关顶层）、快捷键输入框守卫 |
| R8 | 守门强化 | client-shards check() 去写副作用、selfcheck 新增 shards-gate 真实 spawn 守门、死断言清理、词典重复键清理 + usePlan since 增量恢复 |

## 二轮审计补充（真机回归驱动）

- StyleTag 单例方案回归修复：不同组件传不同 css 串时画布样式注入不进去（UI 裸奔）——改为按串内容去重
- React #310 修复：空画布分支清理时误删 hooks 对齐调用——tourGo 上提为无条件单次定义
- 死代码清除 168 行：Popover/useAsync、恒 null 表达式、属性双写、空画布分支 84 行复制

## 验证状态

- `node scripts/selfcheck.mjs` → **181 passed, 0 failed**（14 段，含 r1-p0 / shards-gate 防回归段）
- `node scripts/client-shards.mjs check` → 分片等价性通过（check 已无写副作用）
- 真机验收：子代理画布继承、拖拽流畅度、合并置顶与回收站、泳道辨别、批量删除确认

## 已知权衡（评估后有意保留）

- normalizeWorkflow 每次刷新 updatedAt（幂等改造回归风险 > 收益）
- 相机子系统的物理 hook 抽取（拖拽高频重建根因已被 R2.1 消除，抽取降为可维护性可选项）
- 节点数据结构维持扁平 + 树视图（childrenByParent）；完整树化列为 V0.2 数据模型迁移提案（用户已否决当期实施）
