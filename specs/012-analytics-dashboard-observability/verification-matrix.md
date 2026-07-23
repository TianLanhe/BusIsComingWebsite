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
| FR-028–032 | UI contract §4 | copy、导航组件 | `accessibility.test.tsx`、`responsive-locales.spec.ts`，Figma 导航 | 通过 |
| FR-033–039, SC-008 | SystemData、SQLiteRuntimeStatus、ProcessStatus；Go system ports | SystemPage | `investigation.spec.ts`，隐私人工检查 | 基础类型/fixture 已通过；US4 待完成 |
| FR-040–043, SC-007 | TrafficData six metrics；Go traffic query | DetailPages、TrafficPage | `investigation.spec.ts`，Figma Business & Event Metrics | 基础类型/fixture 已通过；US3 待完成 |
| FR-044–048, SC-009 | Visitor schema；Go stable tie ordering | VisitorPage、DetailPages | `investigation.spec.ts`，Figma System & Visitor Details | 通过 |
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
| 流量六卡与趋势 | Traffic API `metrics` 恰好为主页/地点/路线 PV+UV 六 key；地点/路线 PV 含失败；趋势仍只显示主页 PV、主页 UV、成功路线 UV | `trafficMetricValues` 只映射六项公开指标；成功 Visitor 仅保留于 `TrafficSeriesPoint` 和漏斗。OpenAPI min/max=6、TypeScript union、fixture 和契约测试均拒绝旧 successful metric key。 | 通过 |
| 事件比较、分页与开关 | 七种 comparison state、失败增加为不利；真实下一页只改表行；compare 可关闭 | `EventsPage.test.tsx` 逐一渲染 increased/decreased/unchanged/zero-baseline/no-previous/no-current/disabled，并断言失败卡 worse/better；`business-metrics.spec.ts` 以与 Go `EncodeEventCursor` 相同的 16-byte raw-base64url cursor 请求第二页，契约测试校验固定向量和解码字段。第 1 页为 limit=50 的 50 项、total=51，第 2 页为 1 项且 `nextCursor=null`，断言摘要不变、表行从 route 改为 homepage、范围为 `51–51 / 51`，关闭 compare 后显示 disabled 文案。 | 通过 |
| 三语桌面与手机 | `zh-Hans`、`zh-Hant`、`en` 均须验证事件、流量和无横向溢出；英文桌面须为六列 | `business-metrics.spec.ts` 在 1440 与 390 对每种语言运行；保存 `business-events-{locale}-{desktop|mobile}.png` 与 `business-traffic-{locale}-{desktop|mobile}.png` 共 12 张。每组合断言 `scrollWidth === innerWidth`，桌面 `gridTemplateColumns` 为 6、手机为 2。 | 通过 |

Figma 差异记录：`89:1310` 的 Business & Event Metrics 画板用于核对六卡层级、对比状态和桌面/手机栅格；示例数值不会作为运行时数据回退。移动端沿用既有固定底栏，长内容在其下方保持安全底部留白，不引入页面横向滚动。

执行命令：

```text
go -C backend test -race ./...
# passed

npm --prefix frontend test
# 42 files, 186 tests passed

npm --prefix frontend run openapi:lint
npm --prefix frontend run openapi:bundle
# passed

npm --prefix frontend run test:e2e:monitor -- playwright-monitor/business-metrics.spec.ts --reporter=line
# desktop/mobile 共 4 tests passed；含 EventCursor 二进制契约，以及三语事件分页、compare 开关与流量六卡

npm --prefix frontend run test:e2e:monitor -- --reporter=line
# 33 passed, 1 skipped
```

## US4 技术运行状态（T063–T078，2026-07-24）

| 对照区块 | Figma `89:1310` / 契约要求 | 实现与证据 | 结果 |
|---|---|---|---|
| SQLite 明细与运行库 | 总数、香港今日数、文件大小、最近成功写入；SQLite 版本、Journal Mode、Schema 版本 | SQLite adapter 对六项 probe 独立读取香港自然日、file stat、SQLite runtime 与 migration；任何单项失败仅对应字段为 null，且不输出路径、SQL 或底层错误。 | 通过 |
| 服务运行信息 | 进程启动、运行时长、Dropped、监听器状态和实际 loopback 地址；`publicProxy=false` 不作为事实卡 | application 以同一次注入 clock 生成香港日期、generatedAt 与 uptime，并独立保留 Dropped；composition root 接受 loopback 别名、规范化为实际 `127.0.0.1:<port>` 注入，拒绝非 loopback 配置。 | 通过 |
| 12 项页面与局部无数据 | 仅保留 SQLite 明细、SQLite 运行信息、服务运行信息；恰好 12 项动态事实，任何空字段仅局部显示无数据 | `SystemPage.test.tsx` 断言 12 项、三块和删除重复区块；Playwright 使 Journal Mode/监听地址为空，确认其余事实如 SQLite version 保留。 | 通过 |
| 三语与双端视觉 | `zh-Hans`、`zh-Hant`、`en`，1440 与 390，无全页横向溢出 | `system-v13-{zh-Hans,zh-Hant,en}-{desktop,mobile}.png` 与 `system-v13-{desktop,mobile}.png`；对照 Figma System & Visitor Details 画板，三段式卡片在手机两列重排。 | 通过 |
| HTTP、隐私与回归 | 单一 system endpoint、no-store、既有 envelope、无数据库路径/SQL/内部错误/访客数据 | HTTP 单测覆盖 nullable 运行字段、`Cache-Control: no-store` 与禁止项；`go test ./...` 运行既有隐私哨兵；OpenAPI shared lint 通过。 | 通过 |

## US5 访客调查与导航（T079–T087，2026-07-24）

| 对照区块 | Figma `89:1310` / 契约要求 | 实现与证据 | 结果 |
|---|---|---|---|
| 访客四卡与偏好 | 首次出现、最后出现、会话、累计事件；语言、平台、装置 | `VisitorPage.test.tsx` 覆盖卡片顺序、无下载平台、完整 ID 复制与返回事件；页面保留事件构成与完整会话时间线。 | 通过 |
| 完整历史与稳定并列 | 偏好依完整历史按稳定字符串顺序决出并列；无下载为 null；timeline events 受 cursor/limit 限制 | Go 回归覆盖 locale/device/platform 并列、无下载 null、`limit=1` 第一页和第二页的真实 cursor、`pageInfo` 与单事件 timeline；`DerivedSession` 的开始、结束、时长和事件总数仍来自完整会话历史。 | 通过 |
| 三组七页导航 | 业务监控（总览/流量与试查/下载分析）、技术监控（稳定性及延迟/系统状态）、数据明细（事件明细/访客明细） | `DashboardShell` 单一 `navGroups` 驱动桌面侧栏、移动抽屉和三组底栏入口；Playwright 在三语中真实点击桌面 7 链接、手机抽屉 7 链接及 3 个底栏入口，断言当前项和 44px 操作。 | 通过 |
| 三语与双端视觉 | zh-Hans、zh-Hant、en；1440/390；无全页横向溢出；44px 操作 | `investigation.spec.ts` 覆盖桌面和手机的已应用日期、event/outcome、compare 未选中状态、未提交日期第 2 步、P50 和 Visitor 语言切换保持；截图 `visitor-v13-desktop.png`、`visitor-v13-mobile.png` 对照 Figma System & Visitor Details / Mobile Observability 画板。 | 通过 |

执行命令：

```text
go -C backend test ./...
# passed

npm --prefix frontend test
# 42 files, 195 tests passed

npm --prefix frontend run build:monitor
npm --prefix frontend run openapi:analytics:lint
# passed；build 仅保留既有 bundle-size warning

npm --prefix frontend run test:e2e:monitor -- --reporter=line
# 38 passed
```

审查修复补充：SQLite 的 `row`、`today`、`size`、`version`、`journal`、`schema` 六个 probe 逐一注入失败，均验证其他事实仍可返回；`processStartedAt` 缺失时仍返回 Dropped。私有 host 接受 `127.0.0.1`、`localhost`、`::1` 与 IPv4-mapped loopback，统一规范化为 API 返回的实际 `127.0.0.1:19081`；拒绝 `127.0.0.1x`、通配地址、非 loopback 与畸形 host。System E2E 默认 fixture 覆盖 12 项全部可用，另覆盖局部缺失；页面以 B/KB/MB 与 zh-Hans 的秒/分钟/小时、zh-Hant 的秒/分鐘/小時、en 的 s/min/h 自适应显示，正数 1–499ms 显示为 `<1` 单位，并移除了壳层的静态监听器状态。

## 最终跨切面验证（T088–T099，2026-07-24）

| 范围 | 最终证据 | 结果 |
|---|---|---|
| FR-001–010、SC-001/002 | 日期、单一 Tooltip、1440/390 Playwright | 通过 |
| FR-011–027、SC-003–006 | events/traffic/performance/SLI Go、Vitest、E2E 和 100 万行基线 | 通过 |
| FR-028–032、FR-049–053、SC-010/011/013 | 三组七页、三语审校、响应式、Figma 对照 | 通过 |
| FR-033–048、SC-007–009 | system/visitor 读模型、隐私和局部降级 | 通过 |
| FR-054–058、SC-014 | 012 feature/shared byte identity、Redocly、DDD/隔离/脱敏审计 | 通过 |
| SC-012 | 1,000,000 行实际读模型 P95 均小于 1 秒，无新增 migration | 通过 |

完整命令、P95、截图尺寸、Figma 差异、部署拓扑及提交范围见 `verification-results.md`。

### 最终审查修复复验

| 审查项 | 证据 | 结果 |
|---|---|---|
| Supervisor panic 可观测性 | `supervisor_test.go` 区分 panic 与普通 serve error；`listener_logger_test.go` 断言 listener、reason、errorKind、context、stackHash 存在且 panic 原文不写日志 | 通过 |
| Visitor 隐私文案 | `copy.test.ts` 分别断言三语的公开 HttpOnly Cookie 与私有 `X-Analytics-Visitor-ID` header-only 调查边界 | 通过 |
| DDD 依赖方向 | `tracking_ports.go` 定义 application ports；`architecture_test.go` 解析 HTTP adapter imports 并拒绝 classification/signing concrete dependency | 通过 |
| 视觉尺寸 | `sips`：`business-traffic-zh-Hant-mobile.png` 为 390×2764；最终 HEAD 已更新并提交 48 张当前 E2E 截图基线 | 通过 |

### 最终 Minor 收敛复验

| 审查项 | 证据 | 结果 |
|---|---|---|
| 日期预设标签 | `DateRangeControl.test.tsx` 覆盖默认 preset 的本地化“近 7 天”与切换为自定义完整日期 | 通过 |
| 事件完整范围摘要 | `StoredEventPage` 删除 `Summary`，SQLite `ListEvents` 只读取分页项；application `SummarizeEvents` 保持唯一完整范围摘要来源 | 通过 |
| 最终回归与视觉 | 百万行 P95 全小于 1 秒；Go/race、Vitest 42 files/197 tests、build、OpenAPI lint/bundle、diff check 通过；最终 E2E 37 passed/1 skipped，仅更新 48 张当前截图并复核三组导航 | 通过 |
