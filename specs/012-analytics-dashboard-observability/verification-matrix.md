# 验证矩阵：监控 Dashboard 数据解释与技术监控增强

**Feature**：012-analytics-dashboard-observability
**Figma**：[v1.3 节点 89:1310](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=89-1310)
**说明**：此矩阵把规格需求映射到权威 OpenAPI、Go、Vitest、Playwright、Figma 和人工检查。阶段 1–2
只完成共享契约、类型、fixture、比较模型与三语 key；页面、Go 聚合和浏览器流程仍由后续任务验证。

## 阶段 1–2 已执行证据

| 任务 | 验证 | 结果 |
|---|---|---|
| T004 | 本矩阵覆盖 FR/SC 与验证层 | 通过 |
| T005 | `analyticsContract.test.ts`：7 个 operationId、012 schema、shared 字节同步；summaryMetrics 4 项边界、六个流量 key、SQLite/process/listener 可空字段与 required | 通过；012 YAML 原已存在的 schema 为回归断言 |
| T006 | `analytics.ts`、`details.ts`：当前/上期、零基线、无样本、SLI 空桶、单字段 null、六卡、无平台；compare=true 同期 meta 与 compare=false 全空比较 fixture 分离 | 通过 |
| T007 | `copy.test.ts`：三语新增 key 完整性 | 通过 |
| T008/T011 | `comparisonState.test.ts`：七状态、方向与好坏策略分离 | 通过 |
| T009/T012 | `build:monitor`：TypeScript 契约与 `MetricCard` props | 通过；保留既有 bundle 大小提示 |
| T013 | Redocly lint/bundle、聚焦 Vitest、monitor build | 通过 |

## 阶段审查修复（2026-07-24）

| 问题 | 证据 | 结果 |
|---|---|---|
| compare=false 却携带同期数值 | `analyticsFixtures.test.ts` 验证启用比较的 meta 有完整上一周期；禁用比较时 summary、traffic、performance 的上一期/变化字段为空，endpoint 分位保留 currentMs 并清空 previous/delta | 通过 |
| DTO key 没有绑定 | `analyticsTypes.contract.test.ts` 通过 `@ts-expect-error` 和 `build:monitor` 验证 EventListData 与 TrafficData 拒绝未文档化 key，同时保留两个既有 successful Visitor key | 通过 |
| OpenAPI 字段断言不足 | `analyticsContract.test.ts` 逐项验证六个 traffic key、summaryMetrics min/max=4、ProcessStatus uptimeMs、SQLite/process/listener required 和 nullable union | 通过 |
| zero baseline 的反向语义 | `comparisonState.test.ts` 验证 `zero_baseline + lower_is_better => worse` | 通过 |

## 需求到验证层映射

| 规格 | OpenAPI / Go | Vitest | Playwright / Figma / 人工检查 | 阶段状态 |
|---|---|---|---|---|
| FR-001–003, SC-002 | UI contract §2；无新 endpoint | `TimeSeriesChart.test.tsx` | `charts.spec.ts`，Figma Date Range & Single Tooltip，1440/390 | 后续 US1 |
| FR-004–010, SC-001 | UI contract §1 | date flow、FilterProvider、DateRangeControl、GlobalFilters | `time-range.spec.ts`，Figma 日期流程，桌面/手机 | 后续 US1 |
| FR-011–014, SC-003 | EventListData.summaryMetrics；Go event summary | `comparisonState.test.ts`、EventsPage、MetricCard | `investigation.spec.ts`，人工分页隔离 | 基础模型已通过；US2/US3 待完成 |
| FR-015–027, SC-004–006 | PerformanceData、PercentileComparison、SLISeriesPoint；Go performance | comparison、MetricCard、PerformancePage | `charts.spec.ts`，Figma Stability & SLI | 基础类型/模型已通过；US2 待完成 |
| FR-028–032 | UI contract §4 | copy、导航组件 | `responsive-locales.spec.ts`，Figma 导航 | 三语 key 已通过；US5 待完成 |
| FR-033–039, SC-008 | SystemData、SQLiteRuntimeStatus、ProcessStatus；Go system ports | SystemPage | `investigation.spec.ts`，隐私人工检查 | 基础类型/fixture 已通过；US4 待完成 |
| FR-040–043, SC-007 | TrafficData six metrics；Go traffic query | DetailPages、TrafficPage | `investigation.spec.ts`，Figma Business & Event Metrics | 基础类型/fixture 已通过；US3 待完成 |
| FR-044–048, SC-009 | Visitor schema；Go stable tie ordering | VisitorPage、DetailPages | `investigation.spec.ts`，Figma System & Visitor Details | fixture 无平台已通过；US5 待完成 |
| FR-049–050, SC-011 | 中文 OpenAPI project copy | `copy.test.ts` | `responsive-locales.spec.ts`，繁中/英文人工审校 | 基础 key 已通过；全页待完成 |
| FR-051–053, SC-010/013 | UI contract §6，Figma metadata | responsive component tests | 两 viewport 截图、Figma 节点 89:1310 逐区块 | 后续 US1–US5 |
| FR-054, SC-014 | feature/shared 012 YAML，7 operationIds | `analyticsContract.test.ts`，Redocly | bundle/私有 docs 人工检查 | 通过 |
| FR-055–057, SC-014 | path/event/table contract；Go isolation/DDD | contract、privacy tests | public/private regression 与人工 diff | 契约基线通过；Go 待后续 |
| FR-058 | UI/data model 中文边界注释 | comparisonState | 人工代码审查 | 比较边界已通过；其余后续 |
| SC-012 | Go SQLite performance suite | million-row test | 性能日志与人工检查 | 后续 US2–US4 |

## T013 命令记录（2026-07-24）

```text
npm --prefix frontend test -- --run \
  src/monitoring/services/analyticsContract.test.ts \
  src/monitoring/content/copy.test.ts \
  src/monitoring/model/comparisonState.test.ts \
  src/monitoring/components/charts/MetricCard.test.tsx \
  src/monitoring/pages/EventsPage.test.tsx \
  src/monitoring/pages/DetailPages.test.tsx \
  src/monitoring/pages/PerformancePage.test.tsx \
  src/monitoring/pages/SystemPage.test.tsx
# 8 files, 29 tests passed

npm --prefix frontend run build:monitor
# passed; existing Vite bundle-size warning retained

npm --prefix frontend run openapi:lint
npm --prefix frontend run openapi:bundle
# passed
```

## US1 日期范围与单一 Tooltip（T014–T027，2026-07-24）

| 对照区块 | Figma `89:1310` 要求 | 实现与证据 | 结果 |
|---|---|---|---|
| 顶部日期范围 | 已应用范围显示完整起止日期 | `DateRangeControl` 在 1440/390 均显示 `YYYY/MM/DD – YYYY/MM/DD`；高级筛选继续由同一 `resolvedRange` 回填 | 通过 |
| 两步选择与降级 | 开始、结束、取消、非法范围及浏览器阻止自动打开 | `CustomDateFlow` 只保存草稿；`showPicker()` 缺失/抛错时保留“选择结束日期”显式入口；非法/未来/倒序均不提交 | 通过 |
| 单一 Tooltip | 指针和键盘任意时刻只能有一个 Tooltip 与参考线 | 指针使用 Recharts Tooltip，键盘使用无障碍自定义 Tooltip；最近有效输入会替换前一种模式，blur/leave/数据越界清理状态 | 通过 |
| 桌面 1440×1200 | 日期控件、完整范围和 Tooltip 可读 | `playwright-monitor/__screenshots__/time-range-desktop.png`：顶部完整范围与图内单一键盘 Tooltip 同屏 | 通过 |
| 手机 390×844 | 日期控件、Tooltip 和主操作可读，触控目标至少 44px | `playwright-monitor/__screenshots__/time-range-mobile.png`：范围控件单列重排，刷新及日期操作 44px；单一 Tooltip 保持可读 | 通过 |

有意差异：Figma 用静态日历面板讲解两步流程；实现采用浏览器原生日期选择器以符合 `showPicker()` 与系统辅助功能约束，无法自动打开时提供明确的继续点击。Figma 示例数字仅用于版式，对运行时数据没有回退作用。

执行命令：

```text
npm --prefix frontend test -- src/monitoring/model/dateRangeFlow.test.ts src/monitoring/components/filters/DateRangeControl.test.tsx src/monitoring/app/FilterProvider.test.tsx src/monitoring/components/filters/GlobalFilters.test.tsx src/monitoring/components/charts/TimeSeriesChart.test.tsx
# 5 files, 16 tests passed

npm --prefix frontend run build:monitor
# passed; 保留既有 Vite bundle-size warning

npm --prefix frontend run test:e2e:monitor -- playwright-monitor/time-range.spec.ts --reporter=line
npm --prefix frontend run test:e2e:monitor -- playwright-monitor/charts.spec.ts --reporter=line
# 各命令均在 desktop 1440 与 mobile 390 项目通过（各 2 tests）
```

### US1 审查修复（2026-07-24）

| 审查项 | 修复与可复验证据 | 结果 |
|---|---|---|
| 原生 picker fallback | 日期输入始终在弹层内可见可操作；缺失或抛错时“选择结束日期”只 focus 输入而不重试 `showPicker()`。组件测试分开断言 missing、throwing 与一次提交；截图由 persistent failure 流程生成，不含原生日历遮挡。 | 通过 |
| 取消不改 query | Escape 与 root 外真实点击清除草稿。Playwright 以实际初始请求数为基线，断言未来/倒序后取消的请求增量均为 0。 | 通过 |
| 跨年与同步 | 合法 `2025-12-31` 至 `2026-01-02` 只增加一次查询，顶部 accessible name 保留完整两年；高级筛选两个日期字段回读同一 applied range。 | 通过 |
| Tooltip 生命周期 | 新 data 引用或非空 visible-series key 改变时无条件清除 interaction；单测断言 Tooltip/ReferenceLine 消失，并覆盖两种输入方式互斥切换。 | 通过 |
| 可访问性与文案 | trigger 的 `aria-label` 包含完整 applied range；选择中显示第 1/2 步；开始日期未来错误使用独立的三语文案。Playwright 验证 44px，Vitest 验证英文精确文案。 | 通过 |

复验命令：

```text
npm --prefix frontend test
# 42 files, 171 tests passed

npm --prefix frontend run build:monitor
# passed；仅既有 Vite bundle-size warning

npm --prefix frontend run test:e2e:monitor -- playwright-monitor/time-range.spec.ts --reporter=line
# desktop/mobile 共 4 tests passed

npm --prefix frontend run test:e2e:monitor -- playwright-monitor/charts.spec.ts --reporter=line
# desktop/mobile 共 2 tests passed
```

## US2 稳定性与时延（T028–T044，2026-07-24）

| 对照区块 | Figma `89:1310` / 契约要求 | 实现与证据 | 结果 |
|---|---|---|---|
| 六项概览卡 | 请求、成功率、P50、P95、失败、Dropped；时延使用 ms | `MetricCard` 对 durationMs 始终显示 `ms` 与带符号的毫秒变化；时延、失败使用 lower-is-better | 通过 |
| 响应时间趋势 | 默认 P95、局部切换 P50、四事件线、无样本断线 | `PerformancePage` 保持同一响应中的 P50/P95；Playwright 断言点击后没有新增 performance 请求，仅首图从 P95 换成 P50 | 通过 |
| SLI 图 | 四事件固定顺序、成功 PV/总 PV、空桶不是 0% | `domain.SLISeries` 完成香港桶、固定顺序和计数；空桶为 null、全失败为 0；图的 Y 轴格式为百分比，fixture/单元测试同时覆盖 0 与 null | 通过 |
| endpoint 表 | P50/P95 原值与上一周期的七种比较状态，时延增加为恶化 | `PercentileComparison` 在任意缺失侧保留 delta=null，current 缺失时仍返回 previousMs；表将原值和 P50/P95「对比上期」分列，零基线、无当前、无上期、关闭、持平、变快和变慢均有三语显式文案 | 通过 |
| Dropped 局部降级 | system 失败不遮蔽 performance 主体 | `useAuxiliaryResource` 仅使 Dropped 显示局部提示；桌面和手机均以 `performance-system-partial-error-*.png` 证明端点表继续可用 | 通过 |
| 1440×1200 | 双图、六卡和端点表同屏可读 | `performance-v13-desktop.png`，桌面 Playwright | 通过 |
| 390×844 | 双图单列、局部 P50/P95 控件不小于 44px、无整体横向滚动 | `performance-v13-mobile.png`；E2E 断言按钮高度至少 44px、页面宽度等于视口宽度，端点表仅自身横向滚动且操作、P50/P95 比较列可分别滚动到可视区域 | 通过 |

Figma 差异记录：`89:1310` 的示例数据与颜色用于核对信息层级和双图区块，不作为运行时回退；实现按权威 OpenAPI 的真实 null/0 语义保留缺口。手机端将两张图纵向排列，并让端点表在自身容器中横向阅读，避免页面整体横向滚动。

执行命令：

```text
go test ./internal/analytics/application ./internal/analytics/interfaces/http
# passed

npm --prefix frontend test -- --run src/monitoring/content/copy.test.ts src/monitoring/pages/PerformancePage.test.tsx src/monitoring/components/charts/MetricCard.test.tsx
# 3 files, 15 tests passed

npm --prefix frontend run build
# passed; 保留既有 monitor bundle 大小提示

npx playwright test --config playwright.monitor.config.ts --reporter=line
# desktop/mobile: 27 passed, 1 skipped
```

审查修复补充：`performance-v13-desktop.png`（简体）、`performance-v13-en-desktop.png`（英文）和 `performance-v13-zh-Hant-mobile.png`（繁体手机）均保持默认 P95；全量 Playwright 在三语七页流程中同时回归页面标题、筛选上下文和手机布局。

## US3 比较事件与业务流量（T045–T062，2026-07-24）

| 对照区块 | Figma `89:1310` / 契约要求 | 实现与证据 | 结果 |
|---|---|---|---|
| 事件四卡 | 当前与上一等长周期使用完整筛选范围；分页不能改变卡片 | `SummarizeEvents` 复用 SQLite event query builder；应用层清空 cursor/limit 后分别聚合当前、上一周期并以 `summaryMetrics` 返回。应用、SQLite、HTTP 和 React 测试覆盖 visitor header、过滤条件、零基线、无上期与翻页隔离。 | 通过 |
| 失败语义 | 失败增加为不利，变化不只依赖颜色 | `EventsPage` 使用 `MetricCard` 的 `lower_is_better`；箭头、带符号值与状态文字同时呈现。 | 通过 |
| 流量六卡与趋势 | 主页/地点/路线 PV+UV；地点/路线 PV 含失败；趋势仍只显示主页 PV、主页 UV、成功路线 UV | `trafficMetricValues` 分别维护全量查询 UV 与既有成功 Visitor 集合；`TrafficPage` 顶部为六卡，`TrafficChart` 未改动既有三条序列。 | 通过 |
| 1440×1200 | 六卡同一行、趋势与漏斗可读 | `business-v13-desktop.png`：六卡完整显示，并保留三条趋势图例。 | 通过 |
| 390×844 | 两列卡片、无页面横向溢出、移动底栏可用 | `business-v13-mobile.png`：六卡两列重排；Playwright 断言 `document.scrollWidth === innerWidth`。 | 通过 |

Figma 差异记录：`89:1310` 的 Business & Event Metrics 画板用于核对六卡层级、对比状态和桌面/手机栅格；示例数值不会作为运行时数据回退。移动端沿用既有固定底栏，长内容在其下方保持安全底部留白，不引入页面横向滚动。

执行命令：

```text
go test -race ./...
# passed

npm --prefix frontend test
# 42 files, 178 tests passed

npm --prefix frontend run openapi:lint
npm --prefix frontend run openapi:bundle
# passed

npm --prefix frontend run test:e2e:monitor -- playwright-monitor/investigation.spec.ts --reporter=line
# desktop/mobile 共 6 tests passed；含事件同期/分页与流量六卡流程
```
