# 技术研究：监控 Dashboard 数据解释与技术监控增强

**日期**：2026-07-24

**功能**：`012-analytics-dashboard-observability`

## 研究结论总览

本功能继续复用现有 React/Vite/Recharts 前端、Go analytics DDD bounded context、单份 SQLite
明细和七个私有监控端点。重复 Tooltip 是两套提示同时消费同一 `activeIndex` 导致；自定日期
不可用是右上角控件明确忽略 `custom`，而高级筛选只提供独立手动输入导致。两者都可在既有前端
状态边界内修复，不需要新增日期库、图表库或端点。

服务端只扩展即时读模型：事件四卡同期指标、地点/路线总 UV、四类 SLI、端点 P50/P95 同期值和
非敏感 SQLite/进程快照。`analytics_events` 表、匿名字段、事件类型和部署拓扑保持不变；不增加
汇总表、缓存、队列、后台任务、备份或清理。

## 决策 1：用两步草稿状态驱动自定日期

**决策**：保留 `FilterProvider` 的 `DateRangeSelection` 作为唯一已应用范围，在新的日期范围控件
中维护 `idle → selecting_start → selecting_end` 草稿状态。开始与结束都合法后只调用一次
`setCustomRange(startDate,endDate)`；高级筛选继续从 `resolvedRange` 同步。

**理由**：当前 `DashboardShell.tsx` 在 `<select>` 选到 `custom` 时明确不执行任何动作，
`GlobalFilters.tsx` 又独立保存两个输入值。分离草稿与已应用状态可保证取消不污染查询、结束日期
只触发一次刷新，并让右上角与高级筛选共享同一个权威结果。

**替代方案**：

- 选中自定日期后直接展开高级筛选：无法满足依次弹出两个日期选择器，移动端路径也不清晰。
- 每选择一个日期就更新全局 query：会发出半成品或重复请求。
- 引入第三方日期范围组件：本功能只需要两个原生日期输入和固定香港边界，新依赖收益不足。

## 决策 2：原生 `showPicker()` 采用用户手势优先和显式降级

**决策**：选择“自定日期”时，在同一用户手势中对开始日期 input 调用 `showPicker()`；开始日期
变化后尝试对结束日期调用。`showPicker` 不存在、抛出异常或被浏览器阻止时，保留第 2/2 步和
至少 44px 的“选择结束日期”按钮，让维护者一次点击继续。

**理由**：浏览器对非用户手势自动打开原生选择器有安全限制，代码不能保证第二次自动打开成功。
保留状态和明确入口比吞掉异常或假定所有浏览器相同行为更可靠。

**替代方案**：

- 用定时器强制第二次 `showPicker()`：更容易失去用户激活权限。
- 失败后静默返回：会重现当前“自定日期不可用”的体验。

## 决策 3：Tooltip 显式区分最近输入方式

**决策**：`TimeSeriesChart` 将键盘 active index 与指针 Tooltip 分开，并记录最近输入方式
`pointer | keyboard | null`。指针模式只渲染 Recharts Tooltip；键盘模式抑制 Recharts 可见
Tooltip，只渲染自定义无障碍 Tooltip。两种提示共用时间、序列和单位格式化函数。

**理由**：当前 `onMouseMove` 和 dot `onMouseEnter` 都写入同一 `activeIndex`，同时存在 Recharts
`<Tooltip>` 和 `.chart-keyboard-tooltip`，所以一次悬停必然显示两份。删除任意一套会牺牲鼠标或
键盘能力，显式输入方式互斥能保留两种交互。

**替代方案**：

- 删除自定义 Tooltip：键盘用户失去可读提示。
- 删除 Recharts Tooltip：需重新实现指针定位、碰撞和 cursor。
- 仅靠 CSS 隐藏重叠框：状态和无障碍树仍重复，且无法可靠判断输入来源。

## 决策 4：事件同期比较由同一服务端查询返回

**决策**：`EventListData` 保留当前 `summary`，新增四项 `summaryMetrics`：
`totalCount`、`successCount`、`failureCount`、`uniqueVisitors`。应用层用相同筛选条件查询
当前与紧邻上一等长周期的完整范围摘要；cursor/limit 只影响 items。前端从 `Metric` 派生比较
状态，失败卡单独使用“越低越好”语义。

**理由**：当前与上期必须共享生成时刻、香港边界和筛选，且不能从当前 50 条分页推算。复用现有
`domain.Metric` 能表达真实零值、无上期、无当前和 compare 关闭。

**替代方案**：

- 前端再发一次上一周期请求：请求翻倍且边界可能漂移。
- 把比较字段塞入每个分页 item：领域含义错误且产生重复数据。
- 用 `pageInfo.totalCount` 推导四卡：无法得到成功、失败和 UV。

## 决策 5：流量六卡扩展既有 Metric key

**决策**：流量响应的 `metrics` 至少返回 `pv`、`uv`、`placeQueryRequests`、
`placeQueryVisitors`、`routeQueryRequests`、`routeQueryVisitors`。地点/路线请求数包含成功和
失败；UV 分别对对应事件的
匿名 Visitor ID 去重。既有 `successfulPlaceVisitors`、`successfulRouteVisitors` 和趋势序列
继续保留，避免改变“浏览与成功试查趋势”口径。

**理由**：当前应用层已经一次加载并筛选流量事件，增加两个总 UV 集合即可完成，不需要新 SQL
表或端点。保留既有 key 能让趋势和已有消费者继续工作。

**替代方案**：

- 把成功 UV 当作总 UV：与用户确认口径不符。
- 前端从趋势桶相加 UV：跨桶重复 Visitor 会造成高估。

## 决策 6：P50/P95 选择只属于响应时间图

**决策**：Performance API 继续为每个桶返回 P50 和 P95；前端新增页面局部
`selectedPercentile: "p50" | "p95"`，默认 P95，并只为所选分位生成四条事件序列。选择不进入
全局 filter/query，也不改变 SLI。

**理由**：服务端已经一次计算两种分位，切换无需重新请求；局部状态与需求“只改变本图”一致。

**替代方案**：

- 把分位值加入全局筛选或 URL 查询：会误导其他图表也受影响。
- API 每次只返回一种分位：切换增加请求和失败面，收益不足。

## 决策 7：SLI 在应用层按真实时间桶计算

**决策**：PerformanceData 新增 `sliSeries[]`，每个时间桶按四类事件返回
`successfulPV`、`totalPV` 和可空 `successRate`。`totalPV=0` 时 rate 为 null；
`totalPV>0 && successfulPV=0` 时 rate 为 0。

**理由**：服务端拥有权威筛选、香港桶和 outcome；前端只负责百分比展示。返回分子和分母可让
契约测试验证口径，也能解释 0% 与无数据差异。

**替代方案**：

- 前端只从失败分布推算：缺少时间桶和完整分母。
- 把 SLI 称为 SLA 并画目标线：用户已确认仅展示实际成功率，没有承诺目标。

## 决策 8：端点 P50/P95 比较使用可空值与绝对变化

**决策**：每个 `EndpointPerformance` 在当前 `p50Ms/p95Ms` 之外增加
`p50Comparison/p95Comparison`；每个比较对象包含 current/previous、`deltaMs` 和可空
`deltaRate`。上一周期为 0 时保留上一值和绝对变化，但 rate 为 null；任一侧无样本或 compare
关闭时不伪造数值。应用层对当前和上一周期使用相同 operation 映射。

**理由**：显式字段让前端可靠区分持平、零基线、无上期和无当前；方向好坏由“时延越低越好”
的展示策略决定，不污染统计值。

**替代方案**：

- 只返回百分比字符串：丢失结构化值且无法本地化。
- 上期为 0 时返回 Infinity：JSON 不支持且会产生误导。

## 决策 9：系统快照扩展现有 system 端点并允许字段级缺失

**决策**：`DatabaseStatus` 增加香港当前日期/今日明细数，新增独立 `SQLiteRuntimeStatus`
承载 SQLite 版本、Journal Mode、Schema 版本；`ProcessStatus` 增加 `uptimeMs`。SQLite adapter
独立探测各项并以 nullable 字段表示局部不可用；进程和监听器的用户可见运行字段也允许逐项
nullable。只有存储整体不可访问时才使用 unavailable。监听地址由私有服务 composition root
注入实际 loopback 配置，不继续硬编码端口；固定隐私事实 `publicProxy=false` 始终必填。

**理由**：这些信息属于既有系统工作区，不需要新端点。字段级空值能避免一个 PRAGMA 或文件
stat 失败清空整页；响应不需要也不应包含数据库路径或内部错误。

**替代方案**：

- 在前端从 `generatedAt-startedAt` 之外猜测全部运行状态：无法得到 SQLite/Schema/今日数据。
- 返回数据库文件路径以便定位：违反隐私与脱敏约束。
- 新建健康检查端点：扩大私有接口表面积且与现有 system 重复。

## 决策 10：访客偏好复用完整历史并稳定处理并列

**决策**：继续从完整 Visitor 历史派生 `commonLocale`、`commonDeviceType` 和
`commonPlatform`；并列时先按 count 降序，再按既有枚举顺序/字符串稳定排序。页面不再把
common source 放入“访客偏好”，但现有契约字段可保留。无下载事件时平台保持 null。

**理由**：当前 visitor 端点已经读取完整历史并返回所需字段，不需要新查询参数。稳定排序让相同
明细得到可重复结果，空平台不会被装置或 User-Agent 猜测。

**替代方案**：

- 使用最近一次事件作为偏好：不能代表“最常见”且会随分页变化。
- 从 mobile/desktop 猜测 Android/iOS：违反已确认来源边界。

## 决策 11：导航和三语 key 一次性按分组迁移

**决策**：`DashboardShell` 的导航模型改为 business/technical/details 三组，桌面侧栏、移动
抽屉和移动底部导航共享同一数据源。文案在 `copy.ts/types.ts` 同时补齐三语；语言切换不重挂
FilterProvider，不重置日期步骤、P50/P95 或 Visitor 调查对象。

**理由**：当前两组导航和移动端 `slice(0,4)` 无法表达新信息架构。单一导航模型可避免桌面和
移动出现不同页面集合。

**替代方案**：

- 只改可见标题，不改分组模型：移动和桌面仍不一致。
- 为每种 viewport 维护独立数组：容易产生路由遗漏。

## 决策 12：继续单表即时统计，不新增 migration

**决策**：默认不新增 migration。事件摘要、流量 UV、SLI、端点比较和今日数量复用当前索引和
受控时间范围；在 100 万行 fixture 上先运行性能测试。若实施阶段证明查询超出 1 秒门禁，必须
先优化查询；仍不足时另行评审前向普通索引 migration，不得修改 `001` 或增加汇总表。

**理由**：日增不超过 1,000、长期不超过 100 万，当前 011 已采用一次有界明细读取和 SQLite
筛选构建器。本功能没有证据证明必须改变存储。

**替代方案**：

- 新增汇总表/缓存/后台聚合：违反“只保存明细、页面查询时统计”。
- 修改已执行 migration：无法安全升级既有数据库。

## 决策 13：OpenAPI 012 完整演进并与监控前端原子发布

**决策**：以 011 完整 OpenAPI 3.1 为基线建立
`specs/012-analytics-dashboard-observability/contracts/analytics-monitoring-api.openapi.yaml`，
保持七个 path、operationId、envelope 和错误码，采用响应字段增量。实现阶段同步到 shared，
更新 feature lint/bundle 指针，生成中文 API UI；Go 后端和 `dist-monitor` 原子升级/整体回滚。

**理由**：完整源文件可独立 lint、bundle、生成 UI 和驱动契约测试；私有前后端属于同一发布物，
无需引入多版本协商。

**替代方案**：

- 只在 plan 描述差异：工具和实现者无法验证。
- 新增 `/v2` 或多个报表端点：本次没有公网兼容或独立生命周期需求。

## 决策 14：验证采用单元、契约、浏览器与隐私四层

**决策**：Vitest 覆盖日期状态机、Tooltip 输入互斥、比较展示、页面读模型和三语 key；Go 测试
覆盖上一周期、SLI 空桶、端点零基线、香港今日、字段级 system 降级和稳定并列；Redocly 与
前后端契约测试覆盖 schema；Playwright 在 1440×1200 和 390×844 覆盖交互、三语、触控目标和
Figma 对照。100 万行性能 fixture 与隐私哨兵保留。

**理由**：本功能同时改变浏览器交互、统计口径、私有契约和运行状态，任一单层测试都不足以证明
完整需求。

**替代方案**：

- 只依赖截图：不能证明统计、键盘和空值语义。
- 只跑单元测试：不能发现原生日期选择、Recharts 或响应式集成问题。

## 已解决未知项

- 前端/后端版本、主要依赖、存储、测试工具、部署拓扑均由仓库现状确认。
- v1.3 Figma 真实锚点为 `89:1310`，不再存在设计追溯门禁。
- 无新增外部服务、端点、表、事件类型、goroutine 或后台任务。
- 未保留待澄清标记。
