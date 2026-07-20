# 数据模型：网站匿名访问统计与监控面板

## 总体持久化原则

- 只持久化 `analytics_events` 事件事实表；不建立 visitor、session、funnel、日/月汇总或
  Dashboard 快照表。
- `schema_migrations` 或 `PRAGMA user_version` 只属于技术迁移元数据，不是统计事实。
- 所有时间以 UTC Unix 毫秒写入；API 以 RFC 3339 返回，Dashboard 以
  `Asia/Hong_Kong` 展示和分桶。
- SQLite 文件、`-wal` 与 `-shm` 长期保留在同一 shared 目录；没有自动删除、备份、复制或
  生命周期任务。
- 领域事件结构不定义 IP、完整 Cookie、完整 User-Agent、完整 Referrer、请求 URL/query、
  请求体、地点词、起终点、坐标、token 或第三方原始响应字段，从类型边界阻止误写。

## 匿名访客凭据 VisitorCredential（瞬时，不持久化完整值）

服务器签发并由浏览器自动携带的完整性保护 Cookie。

| 字段 | 类型 | 说明 | 校验 |
|------|------|------|------|
| `version` | string | Cookie 格式版本 | 固定为 `v1` |
| `visitorId` | string | 128-bit 随机值的 base64url 无填充表示 | 22 字符；不可预测；只保存该字段到事件表 |
| `issuedAt` | date-time | 服务器签发时间 | 不得晚于服务器允许时钟偏差 |
| `signature` | string | 版本、ID、签发时间的 HMAC-SHA256 | 使用独立 secret；常量时间比较；不持久化 |
| `expiresAt` | date-time | `issuedAt + 1 year` 派生值 | 同时写入 Cookie `Expires/Max-Age` |

Cookie 约束：

- 名称：`__Host-bic-visitor`。
- `HttpOnly=true`、`Secure=true`、`SameSite=Lax`、`Path=/`、不设置 `Domain`。
- 已知机器人不验证、不签发 Cookie。
- 缺失、格式非法、签名无效或过期时生成新 ID；旧 ID 不继续关联。
- Cookie 清除、浏览器/设备切换、secret 轮换都会形成新 UV；UV 不等于自然人数。

状态转换：

```text
missing/invalid/expired -> newly-issued -> valid -> expired
valid -------------------------------> reused
known-bot ---------------------------> excluded（无 Cookie、无事件）
```

## 匿名事件 AnalyticsEvent（唯一持久化业务事实）

一次允许记录的主页 metadata、地点查询、路线查询或安装包下载请求。

| SQLite 列 | 领域字段 | 类型 | 说明与校验 |
|-------------|----------|------|------------|
| `id` | `eventId` | integer | `INTEGER PRIMARY KEY`；同毫秒稳定排序的第二关键字；API 作为十进制 string 展示 |
| `occurred_at_ms` | `occurredAt` | integer | 必填；UTC Unix 毫秒；在公开请求开始时捕获 |
| `visitor_id` | `visitorId` | string | 必填；合法 22 字符随机 ID；不含 Cookie 签名 |
| `event_type` | `eventType` | enum | `page_view`、`place_query`、`route_query`、`download_request` |
| `outcome` | `outcome` | enum | `success`、`failure`；HTTP 2xx 为 success，其余完成/中止为 failure |
| `http_status` | `httpStatus` | integer? | 已形成 HTTP 响应时为 100–599；连接中止且无状态时可空 |
| `status_class` | `statusClass` | enum | `2xx`、`3xx`、`4xx`、`5xx`、`aborted`、`unknown` |
| `failure_category` | `failureCategory` | enum? | 成功必须为空；失败只允许受控类别，不保存 error message |
| `duration_ms` | `durationMs` | integer | 必填；大于等于 0；从请求进入至业务 handler/recovery 完成 |
| `locale` | `locale` | enum | `zh-Hant`、`zh-Hans`、`en`、`unknown` |
| `device_type` | `deviceType` | enum | `desktop`、`mobile`、`tablet`、`other` |
| `source_type` | `sourceType` | enum | `direct`、`search`、`referral`、`internal`、`unknown` |
| `platform` | `download.platform` | enum? | 下载事件当前为 `android`；预留 `ios`、`other`；非下载必须为空 |
| `version_name` | `download.versionName` | string? | 成功下载来自本次实际响应；失败可空；最长 64 字符 |
| `version_code` | `download.versionCode` | integer? | 成功下载必填且大于 0；失败可空 |
| `size_bytes` | `download.sizeBytes` | integer? | 成功下载必填且大于 0；失败可空 |

`failureCategory` 有限集合：

- `invalid_request`：无效 JSON、缺字段或无效枚举。
- `invalid_token`：地点/ETA 相关受保护 token 无效或过期；仅路线请求事件可用。
- `same_place`：起终点相同。
- `rate_limited`：公开接口限流。
- `not_found`：APK/metadata 事实不存在。
- `integrity_mismatch`：APK 大小或 checksum 不一致。
- `external_timeout`：Citybus 或 DATA.GOV.HK 超时。
- `external_unavailable`：上游不可用或响应不可解析。
- `client_aborted`：客户端中止。
- `internal`：受控服务端内部错误或 recovery 后 500。
- `unknown`：无法安全归类；不得把原始错误文本作为替代。

跨字段约束：

- `eventType != download_request` 时，`platform/version_name/version_code/size_bytes` 全部为空。
- `download_request + success` 时，平台、实际版本名称、版本代码和大小全部必填。
- `outcome=success` 时 `status_class=2xx` 且 `failure_category` 为空。
- `outcome=failure` 时 `failure_category` 必填；没有 HTTP 响应时 `status_class=aborted`。
- `page_view` 在 metadata 成功或失败时均成立；PV 统计按事件类型计数，不要求 outcome 成功。
- `place_query`、`route_query` 每个到达公开服务的请求各写一条；`query_etas` 永远不写。

## 下载归因 DownloadAttribution（事件内可空值对象）

| 字段 | 类型 | 说明 |
|------|------|------|
| `platform` | enum | 由服务端下载路由推导，当前正式值为 `android` |
| `versionName` | string? | 只在本次响应实际取得 `DownloadResult.Metadata` 后写入 |
| `versionCode` | integer? | 与本次成功返回包一致 |
| `sizeBytes` | integer? | 本次实际写出的 APK bytes 大小 |

下载成功只表示服务端成功形成/写出 APK 响应，不表示浏览器完整接收或安装。失败时不得从
“当前配置版本”补填归因。

## 粗粒度分类 RequestClassification（瞬时原料，枚举持久化）

| 分类 | 输入（只在请求期间使用） | 持久化结果 | fallback |
|------|--------------------------|------------|----------|
| locale | 主页 locale header、路线请求已校验 language、`Accept-Language` | `zh-Hant/zh-Hans/en` | `unknown` |
| device | 完整 User-Agent | `desktop/mobile/tablet/other` | `other` |
| source | 前端本地分类 header、同会话最近主页事件、瞬时 Referrer | `direct/search/referral/internal/unknown` | `unknown` |
| bot | 完整 User-Agent 的已知 signature | 只决定 excluded，不持久化类别 | 普通请求 |

原始 UA、Referrer、header/Cookie 原文在分类完成后丢弃，不进入日志、错误或统计事件。

## 匿名访客 VisitorSummary（查询时派生）

| 字段 | 类型 | 计算方式 |
|------|------|----------|
| `visitorId` | string | 精确匹配事件表中的完整随机 ID |
| `firstSeenAt` | date-time | `MIN(occurredAt)` |
| `lastSeenAt` | date-time | `MAX(occurredAt)` |
| `eventCount` | integer | 全部匹配明细数 |
| `sessionCount` | integer | 30 分钟规则派生后的会话数 |
| `commonLocale` | enum | 频次最高，平局取最近事件值 |
| `commonDeviceType` | enum | 频次最高，平局取最近事件值 |
| `commonSourceType` | enum | 频次最高，平局取最近事件值 |

事件列表默认只显示截断 ID；只有维护者通过私有 `X-Analytics-Visitor-ID` header 精确检索后，
详情区显示并允许复制完整值。visitor 不建立持久化表。

## 派生会话 DerivedSession（查询时派生）

同一 `visitorId` 的事件按 `(occurredAt ASC,eventId ASC)` 排序；第一条事件开始新会话，后续事件
与上一条间隔 **大于 30 分钟** 时开始新会话，正好 30 分钟仍属于当前会话。

| 字段 | 类型 | 说明 |
|------|------|------|
| `ordinal` | integer | 访客范围内从 1 开始的派生序号，不持久化 |
| `startedAt` | date-time | 会话第一条事件时间 |
| `endedAt` | date-time | 会话最后一条事件时间 |
| `durationMs` | integer | `endedAt - startedAt`；单事件为 0 |
| `eventCount` | integer | 会话内事件数 |
| `events` | AnalyticsEvent[] | 时间升序；私有 API 可游标分页 |

时间范围查询派生会话时，存储适配器必须额外查看范围起点前最近一条事件，以判断第一条范围内
事件是否延续既有会话；不得把查询边界误当成会话边界。

## 转化漏斗 Funnel（查询时派生）

### 主页 → 成功地点查询 → 成功路线查询

- Stage 1：时间范围内至少有一个 `page_view` 的独立 visitor。
- Stage 2：同一派生会话内，在 Stage 1 事件之后至少有一个成功 `place_query` 的独立 visitor。
- Stage 3：同一派生会话内，在 Stage 2 事件之后至少有一个成功 `route_query` 的独立 visitor。
- 同一 visitor 在一个时间范围内每个 stage 最多计一次；地点输入产生的全部原始事件仍保留。

### 主页 → 成功下载响应

- Stage 1：时间范围内至少有一个 `page_view` 的独立 visitor。
- Stage 2：同一派生会话内，在 Stage 1 之后至少有一个成功 `download_request` 的独立 visitor。
- 没有同会话主页事件的直接下载进入下载总量，但不进入完整漏斗 Stage 2。

每个 stage 返回 `uniqueVisitors`、相对上一阶段转化率和相对第一阶段转化率。第一阶段为 0 时，
转化率为 `null`，不显示误导性的 0% 或无穷大。

## Dashboard 查询 AnalyticsQuery（不持久化）

| 字段 | 类型 | 规则 |
|------|------|------|
| `from` | date-time | 必填；含边界；RFC 3339 |
| `to` | date-time | 必填；不含边界；必须晚于 `from` |
| `granularity` | enum | `hour/day/week/month`；与范围相容 |
| `compare` | boolean | true 时派生紧邻当前范围之前的等长周期 |
| `locale[]` | enum[] | 可选；值来自允许 locale |
| `deviceType[]` | enum[] | 可选 |
| `sourceType[]` | enum[] | 可选 |
| `outcome[]` | enum[] | 可选 |
| `platform[]` | enum[] | 可选；只影响下载相关指标/图表 |
| `versionName[]` | string[] | 可选；只影响下载相关指标/图表 |
| `versionCode[]` | integer[] | 可选；只影响下载相关指标/图表 |
| `eventType[]` | enum[] | 仅事件明细与性能页可选 |
| `limit` | integer | 明细默认 50，范围 1–100 |
| `cursor` | opaque string? | `(occurredAt,eventId)` 签名/编码游标；非法值返回 400 |

全局语言、设备、来源、结果筛选在聚合前作用于相关事件。平台/版本只作用于下载指标、下载分布
和下载漏斗终点；不会把 PV/UV 等非下载事实错误过滤为空。响应 `meta.appliedFilters` 必须回显
实际适用范围。

## 聚合结果模型（不持久化）

### Metric

| 字段 | 类型 | 说明 |
|------|------|------|
| `key` | enum | `pv/uv/viewsPerVisitor/successfulRouteQueries/downloadRequests/requestSuccessRate` 等 |
| `value` | number | 当前范围值 |
| `previousValue` | number? | compare=false 时为空 |
| `delta` | number? | `value - previousValue` |
| `deltaRate` | number? | previous 为 0 时为空，否则 `delta / previousValue` |

`viewsPerVisitor = page_view count / page_view distinct visitor count`；分母为 0 时返回 0。
`requestSuccessRate = success event count / all event count`；分母为 0 时返回 `null`。

### SeriesPoint

按 `Asia/Hong_Kong` 的 hour/day/week/month 边界返回 `bucketStart`、`bucketEnd` 和当前页面需要的
有限指标。缺失桶由服务端显式补 0；整个范围没有事件时响应状态为 `no_data`，不能伪装成一条
全 0 趋势。

### LatencyPercentile

`p50`、`p95` 只基于具有非负 `durationMs` 的完成事件，按 nearest-rank 规则从排序位置计算；
空集合返回 `null`。按事件类型/公开 operation 分组时仍使用同一规则。

### QueryState

- `ready`：当前筛选有结果。
- `no_data`：时间范围内根本没有任何事件。
- `no_results`：时间范围有事件，但当前筛选没有匹配。
- 普通查询失败不作为 data state，使用结构化 500 error。
- 存储不可用不作为 data state，依赖数据库的接口使用结构化 503 error。

## APK 元数据 LatestApkMetadata（读取时 DTO，不写入统计表）

| 字段 | 类型 | 规则 |
|------|------|------|
| `platform` | enum | 当前固定 `android` |
| `status` | enum | 当前成功响应为 `available` |
| `versionName` | string | 来自当前 manifest；非空 |
| `versionCode` | integer | 大于 0 |
| `fileName` | string | basename；不得包含路径 |
| `sizeBytes` | integer | 大于 0；前端自行本地化格式 |
| `lastUpdated` | date | ISO 8601 date |
| `downloadUrl` | string | 固定稳定 URL `/api/downloads/android/latest` |

DTO 不包含 `sourcePath`、`relativePath`、`applicationId`、`sizeLabel`、SHA-256 或磁盘位置。

状态转换：

```text
manifest valid   -> HTTP 200 available -> homepage ready
manifest missing/invalid/unreadable -> HTTP 4xx/5xx no-store -> homepage unavailable
homepage unavailable -------------------------------> download button remains enabled
```

## 系统健康快照 SystemHealthSnapshot（进程内 + 即时查询）

| 字段 | 来源 | 说明 |
|------|------|------|
| `databaseState` | repository health | `available/degraded/unavailable` |
| `databaseRowCount` | 即时 DB 查询 | 可空；数据库不可用时为空 |
| `databaseSizeBytes` | 文件 stat | 可空；只返回大小，不返回绝对路径 |
| `lastSuccessfulWriteAt` | 进程内原子状态 | 本进程最近成功写入；尚无成功时为空 |
| `droppedSinceStart` | 进程内 atomic counter | 写失败/超时后增加；进程重启归零 |
| `processStartedAt` | composition root clock | 当前进程启动时间 |
| `privateListenerState` | server supervisor | `starting/available/unavailable/stopped` |

`GET /api/analytics/system` 在数据库不可用时仍返回 200，保证 Dashboard 能解释“监控不可用但公开
业务不受影响”；其他依赖 DB 的监控接口返回 503。

## 索引策略

初始索引以目标查询为依据：

| 索引 | 支持查询 |
|------|----------|
| `(occurred_at_ms, id)` | 时间范围、趋势、稳定游标 |
| `(event_type, occurred_at_ms, id)` | 四类事件计数、各 endpoint 性能 |
| `(visitor_id, occurred_at_ms, id)` | UV、访客时间线、30 分钟会话 |
| `(occurred_at_ms, visitor_id)` | 时间范围 distinct visitor |
| `(outcome, occurred_at_ms, id)` | 成功率、失败事件 |
| partial `(platform, version_name, version_code, occurred_at_ms)` where download | 下载平台/版本分析 |
| partial `(failure_category, occurred_at_ms)` where failure | 失败分类与性能页 |

语言、设备、来源组合索引不预先堆叠；使用 100 万行 fixture 的 `EXPLAIN QUERY PLAN` 和小于
1 秒基准决定是否增加。所有迁移优先 additive，确保 release 回滚时旧二进制不会因破坏性
schema 变化无法启动。
