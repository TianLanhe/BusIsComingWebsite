# 技术研究：监控 Dashboard 体验修复

**日期**：2026-07-23

**功能**：`011-analytics-dashboard-remediation`

## 研究结论总览

当前实现不需要更换前端框架、增加端点、增加数据库表或引入后台任务。修复应集中在：独立日期范围模型、通用可访问时间序列组件、逐日热力图读模型、四个既有私有查询响应的增量扩展，以及详细工作区的信息架构恢复。

## 决策 1：用独立香港日期模型替代组件内即时拼接

**决策**：在 `frontend/src/monitoring/model/dateRange.ts` 建立纯函数日期模型，输入预设或自定义本地日期和可注入的 `now`，输出半开区间 `[from, to)`、是否包含今天及上一等长区间。预设 N 天从第 N−1 个香港自然日 00:00 开始，`to` 为本次求值时刻；自定义历史结束日使用下一日 00:00，结束日为今天时使用本次时刻。

**理由**：当前 `FilterProvider` 先把当前日期归零，再减去 N 天，造成不包含今天且多减一天；同时 `refreshVersion` 没有参与边界计算，刷新不会推进结束时刻。纯模型可在固定时钟、非香港浏览器时区、跨月/跨年下稳定测试。

**实现约束**：不依赖浏览器本地午夜。使用 `Intl.DateTimeFormat(..., {timeZone: "Asia/Hong_Kong"})` 提取香港年月日，用 UTC 日历运算计算前后日期，再显式生成 `+08:00` 边界；当前时刻直接使用真实 instant 的 ISO 表达。香港统计范围只覆盖现代网站数据，不处理历史时区偏移。

**拒绝方案**：

- 在现有 `hongKongRange` 上只把 `to` 改为 `now`：仍保留 N 天起点的 off-by-one，且不能表达自定义范围和校验状态。
- 新增 date-fns/dayjs：本功能只需要少量固定时区日历运算，新依赖增加体积和 API 学习成本。
- 让服务端解释“近 30 天”：会把 UI 预设语义隐藏到端点内部，不利于自定义范围和请求可追溯性。

## 决策 2：日期选择与请求时钟锚点分离

**决策**：FilterProvider 保存 `DateRangeSelection`（预设或自定义日期）和 `refreshVersion`，每次筛选变化、手动刷新或总览自动刷新时重新求值 `ResolvedDateRange`。总览自动刷新通过全局 `refresh()` 推进查询，详细页面仍只响应手动刷新。

**理由**：选择本身应稳定，包含今天的结束时刻必须动态；固定历史范围不应在刷新时漂移。全局查询对象变化后，既有 AbortController 生命周期可继续避免重叠请求。

**拒绝方案**：在 OverviewPage 内单独替换 `to`。这样总览与流量、下载、事件、性能会出现不同时间语义，也无法共享自定义日期控件。

## 决策 3：通用折线图采用已安装 Recharts 3.10

**决策**：以 Recharts 的 `ResponsiveContainer`、`LineChart`、`CartesianGrid`、`XAxis`、`YAxis`、`Legend`、`Tooltip` 和 `ReferenceLine` 构建 `TimeSeriesChart`；通过自定义 dot 暴露可聚焦数据点并控制 active index，使鼠标和键盘共享同一 Tooltip。`AccessibleChartFrame` 只保留 `sr-only` 表格，不再渲染可见 `figcaption` 摘要。

**理由**：依赖已存在于 `frontend/package.json`，能统一处理比例尺、刻度、响应式、图例和 Tooltip；相比继续扩写手绘 SVG，可减少每个页面重复的坐标和交互计算。现有 `TrafficChart` 可迁移为该组件的流量序列适配器，性能页复用同一组件。

**可访问性**：图例文本与线型/点型共同区分序列；可聚焦 dot 使用明确 aria-label；键盘焦点与鼠标悬停设置同一个 active time bucket；隐藏表格保留标题、香港时间桶和全部序列值；空数组渲染空状态而不是全零曲线。

**拒绝方案**：

- 继续手绘所有 SVG：需要自行维护刻度、碰撞、Tooltip 定位、响应式和键盘状态，风险集中在本次最重要的交互上。
- 引入 Grafana 前端包：体积和主题耦合过大，本需求只借鉴信息表达，不嵌入 Grafana。

## 决策 4：逐日热力图由后端返回真实日期桶

**决策**：把 `HeatmapCell` 从 `weekday + hour` 替换为 `localDate + bucketStart + bucketEnd + eventCount + uv`。应用层按香港日桶聚合筛选后的匿名事件，返回数量与实际查询日期范围一致；前端只做周一至周日行、周列和范围外补位布局。

**理由**：日期是调查主键，前端若只收到星期/小时聚合就无法展示具体日期、准确 Tooltip 或随范围变化的格子数。后端已有同一范围的事件和 `TimeBuckets` 规则，适合生成权威日期桶。

**拒绝方案**：保留 168 个星期×小时格后在前端重排。它已经丢失日期维度，无法恢复逐日信息。

## 决策 5：总览新增四类成功事件 P95 数组

**决策**：OverviewData 新增 `latencyByEvent: EventLatencySummary[]`，固定覆盖 `page_view`（APK 元数据）、`place_query`、`route_query`、`download_request`，每项包含 `eventType`、`requestCount`、可空 `p95Ms`。只统计成功结果；没有成功样本时 `requestCount=0`、`p95Ms=null`。旧全局 `latency` 暂时保留以兼容现有消费者，但总览 UI 不再使用其单值卡片。

**理由**：这是对既有响应的向后兼容扩展，能按事件维度恢复 Figma，同时避免把无样本误表示为 0。

**拒绝方案**：让总览并行调用 performance 端点。会重复加载同一范围事件、增加失败面并把总览耦合到详细性能页。

## 决策 6：事件完整范围摘要与分页项目共享同一存储筛选

**决策**：`StoredEventPage` 增加 `Summary`，SQLite 的事件列表查询在同一 `EventListRequest` 过滤条件下分别执行聚合和分页查询；聚合返回 `totalCount`、`successCount`、`failureCount`、`uniqueVisitors`。应用层输出 `EventListData.summary`，`PageInfo.totalCount` 与 summary.totalCount 必须一致。

**理由**：不能用当前页 50 条推算总览卡；由存储适配器复用相同 where builder 可避免前后筛选漂移，并利用 SQLite `COUNT` 与 `COUNT(DISTINCT visitor_id)` 在 100 万行目标规模内完成。

**拒绝方案**：应用层加载整个筛选范围后聚合。会绕过分页、增加内存和响应时间，无法满足规模目标。

## 决策 7：访客摘要基于该 Visitor ID 的完整保留历史

**决策**：保持既有 `/api/analytics/visitor` 参数不变；`VisitorSummary` 增加 `eventComposition` 和可空 `commonPlatform`。首次/最后出现、会话数、累计事件、常见分类和事件构成都从该匿名标识完整保留历史计算；分页只影响返回时间线事件。

**理由**：当前端点没有日期参数，现有语义已经读取完整 visitor 历史；本次扩展可以不引入第二套范围语义。常见平台只基于带下载归因的事件计算，无下载时为 null。

**拒绝方案**：本次为 visitor 新增 from/to。会扩大 UI 筛选和分页契约，且用户没有要求改变访客历史口径。

## 决策 8：性能页并行读取 system，失败时只降级 Dropped 指标

**决策**：PerformancePage 保持 performance 为主资源，另用独立 AbortController/状态读取 `fetchSystem`；系统请求失败时用明确“局部不可用”状态替代 dropped count，不改变性能数据的 ready/no-data/error 状态。PerformanceData 端点和 schema 不增加 dropped 字段。

**理由**：dropped count 是进程生命周期状态，不属于时间范围性能聚合；复用既有 system 端点能保持领域含义和失败隔离。

**拒绝方案**：把 dropped count 复制到 PerformanceData。会让同一状态出现两个权威来源，并模糊范围指标与进程指标。

## 决策 9：系统“配置事实”由受控前端常量表达

**决策**：SystemData 沿用现有 database/process/privateListener 动态字段；`retention=long_term`、`backup=false`、`writeQueue=false`、`publicProxy=false` 等固定事实以有类型的本地配置说明渲染并明确标记“配置事实”。动态字段只来自 API，绝不显示数据库绝对路径、密钥或原始错误。

**理由**：现有 API 已包含页面需要的动态状态；固定架构事实不是实时探测值，放入动态响应只会制造虚假健康感。

**拒绝方案**：为固定事实扩展 system API。没有新增信息价值，却会扩大契约和测试面。

## 决策 10：公开 Vite 根重定向使用共享插件钩子

**决策**：在 `frontend/viteRootRedirect.ts` 定义只用于公开 `vite.config.ts` 的插件，同时实现 Vite 6 已提供的 `configureServer` 与 `configurePreviewServer`；中间件只匹配 GET/HEAD 且 URL pathname 精确 `/`，返回 302 和 `Location: /zh-hant/`，其余调用 `next()`。

**理由**：本地安装的 Vite 6.0.5 类型声明同时提供两个 hook；共享处理器能让 dev/preview 行为一致，并避免影响 `vite.monitor.config.ts`。

**拒绝方案**：在 React 启动后用 `window.location` 跳转。响应不再是 302，首次 HTML 已加载且 HEAD 无法满足契约。

## 决策 11：视觉修复先统一 token，再恢复页面组件

**决策**：先在 `tokens.css` 定义桌面/手机标题、正文、辅助、标签、指标字号和长值下限，再调整 cards/charts/tables/timeline/system 等组件。完整页面结构以 Pulse v1.1 Figma 为权威，本次 v1.2 差异画板覆盖新字号、比较状态、图表、热力图和四页片段。

**理由**：当前样式中大量 7–10px 字号散落在多个文件，逐页面放大容易产生新的不一致。token 化后可通过 CSS 和视觉测试统一验证。

**拒绝方案**：对整个 Dashboard 使用 CSS transform/zoom。会改变布局、命中区域和清晰度，且无法满足指标与正文不同层级。

## 决策 12：OpenAPI 以 011 完整副本演进并同步 shared

**决策**：从 010 的完整 monitoring OpenAPI 3.1 契约建立 011 权威版本，保持七个路径、operationId、统一 envelope 和错误代码；只修改 OverviewData、HeatmapCell、EventListData、VisitorSummary 相关 schema 与中文示例。实现完成后同步到 `shared/contracts/openapi/analytics-monitoring-api.openapi.yaml`，并运行 Redocly lint、bundle、中文 docs 和前后端契约测试。

**理由**：完整 OpenAPI 文件可独立 lint/bundle 和生成 UI，也明确展示兼容字段；相对补丁或说明文档不能作为运行时接口权威源。

**拒绝方案**：只在 plan 中描述字段差异。无法被 lint、契约测试或生成 API UI 使用。

## 决策 13：Figma 采用 v1.1 完整页面 + v1.2 差异画板

**决策**：继续引用用户确认的 v1.1 真实锚点 `63:2118`、`67:672`；使用本功能四张 HTML 差异画板完成设计交付。用户已通过 import plugin 导入四张画板并提供真实批次锚点 `80:151`；在无法机器读取子节点时只记录该批次锚点。

**理由**：避免重复导入七个完整工作区，也不在 Figma MCP 额度不足时编造子节点。四张导出截图已按 manifest 尺寸渲染并人工检查，真实导入事实由用户提供的 `80:151` 佐证。

**拒绝方案**：把本地画板称为已导入或猜测节点 ID。会破坏设计追溯可信度。
