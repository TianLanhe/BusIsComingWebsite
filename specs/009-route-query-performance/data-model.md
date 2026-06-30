# 数据模型：在线路线查询性能优化

## 站名短名 StopDisplayName

面向路线卡展示的当前语言站点主体名称，由 `StopClient` 或 `showstops2 displayName` 统一短名化后写入 `StopSummary.Name`。

| 字段 | 类型 | 说明 | 校验 |
|------|------|------|------|
| `value` | string | 当前语言短站名 | 必填；去除首尾空白；不得包含序号前缀 |
| `language` | enum | `zh-Hant`、`zh-Hans`、`en` | 必填；与当前查询语言一致 |
| `source` | enum | `datagovhk-stop`、`citybus-showstops2` | 必填；仅服务端内部观测使用 |

短名化规则：

- 去除 Citybus `showstops2` 常见序号前缀，例如 `10 - 兴华邨兴翠楼`。
- 遇到逗号后的道路或区域补充时保留逗号前主体，例如 `樂軒臺, 柴灣道` -> `樂軒臺`。
- 繁体、简体和英文均使用同一边界规则；第三方原文 fixture 不为规则测试而改写。
- 短名化后为空时视为不可用，不写入缓存，调用方继续执行 fallback。

状态转换：`raw -> normalized -> empty/unusable` 或 `raw -> normalized -> displayable`。

## 站名缓存条目 StopNameCacheEntry

DATA.GOV.HK stop 查询成功后的可复用记录。

| 字段 | 类型 | 说明 | 校验 |
|------|------|------|------|
| `key` | string | `stopID + language` 归一化 key | 必填；语言隔离 |
| `stopID` | string | DATA.GOV.HK / Citybus stop id | 必填；非空 |
| `language` | enum | 当前查询语言 | 必填 |
| `name` | StopDisplayName | 已短名化站名 | 必填；不可为空 |
| `expiresAt` | date-time | 过期时间 | 写入后 1 天 |
| `hitCount` | integer | 命中次数 | 仅服务端内部观测 |

缓存规则：

- 只缓存成功解析且短名非空的结果。
- 失败、HTTP 非 2xx、JSON 无法解析、缺少可用语言字段或短名化后为空均不缓存。
- 过期后必须重新请求 DATA.GOV.HK。
- 服务重启后可以丢失，不要求跨实例共享。

## P2P 站点地图缓存条目 P2PStopMapCacheEntry

Citybus `showstops2.php` 成功解析后的站点地图。

| 字段 | 类型 | 说明 | 校验 |
|------|------|------|------|
| `key` | string | `rawInfo + language` 归一化 key | 必填；语言隔离 |
| `rawInfo` | string | `showroutep2p` 原始 P2P 资料 | 必填；不写入日志 |
| `language` | enum | 当前查询语言 | 必填 |
| `stops` | P2PStop[] | 解析后的站点集合 | 必填；至少 1 个 |
| `expiresAt` | date-time | 过期时间 | 写入后 1 天 |
| `hitCount` | integer | 命中次数 | 仅服务端内部观测 |

缓存规则：

- 只缓存 HTTP 成功、解析成功且站点集合非空的结果。
- 失败、空结果和不可解析结果不缓存。
- 缓存值不得包含第三方 HTML 原文。
- 后续用于上车站、下车站和首程 ETA stop id 解析。

## P2PStop

由 `showstops2` 中的 `addstoponmap(...)` 解析得到。

| 字段 | 类型 | 说明 | 校验 |
|------|------|------|------|
| `legIndex` | integer | 所属 P2P leg 下标 | 大于等于 0 |
| `company` | string | 公司，例如 `CTB` | 可为空时不生成 ETA token |
| `routeVariant` | string | Citybus route variant，例如 `606-1` | 必填 |
| `publicRoute` | string | 对外路线号，例如 `606` | 必填 |
| `bound` | string | Citybus bound，例如 `O` / `I` | 可为空 |
| `sequence` | integer | 站序 | 大于 0 |
| `stopID` | string | stop id | 可为空时只能展示 fallback 名称 |
| `rawName` | string | Citybus 原站名片段 | 不写入日志 |
| `displayName` | string | `showstops2` 短名 fallback | 已短名化 |
| `lat` / `lon` | number | 站点坐标 | 仅服务端内部使用 |
| `markerType` | string | Citybus marker 类型，例如上车/下车/普通站点标记 | 保留原值，不作为业务判断唯一依据 |

验证规则：

- 上车站优先匹配 `legIndex + routeVariant + sequence`，再 fallback 到 `routeVariant + sequence`。
- 下车站使用最后一段 leg 和 alighting sequence。
- `displayName` 必须已短名化，供 `StopClient` 不可用时使用。

## 路线搜索模式结果 RouteSearchModeResult

单个 Citybus 路线搜索模式的内部结果。

| 字段 | 类型 | 说明 | 校验 |
|------|------|------|------|
| `mode` | enum | `T`、`F`、`W` | 必填 |
| `routes` | RouteOption[] | 该模式成功解析的路线集合 | 成功时可为空 |
| `err` | error? | 该模式失败原因 | 不直接返回前端 |
| `durationMs` | integer | 模式耗时 | 用于脱敏日志 |
| `panicRecovered` | boolean | 是否从 panic 恢复 | true 时该模式视为失败 |

合并规则：

- 固定模式顺序为 `T`、`F`、`W`。
- 成功模式结果按固定顺序 append，再进入 `dedupeRoutes` 和 `SortRouteOptions`。
- 单个或两个模式失败时保留成功模式结果。
- 三个模式都失败或都没有可解析路线时返回路线不可用。

## Citybus 路线摘要文本 CitybusRouteSummaryText

Citybus `ppsearch_p3.php` 返回的候选路线 HTML/文本片段。

| 字段 | 类型 | 说明 |
|------|------|------|
| `language` | enum | `zh-Hant`、`zh-Hans`、`en` |
| `rawTable` | string | 单个候选 table 原文，仅测试 fixture 使用 |
| `routeNumbers` | string[] | 解析后的路线号链 |
| `fare` | MoneyAmount | 港币总价格 |
| `durationMinutes` | integer | 总耗时分钟数 |
| `walkingDistanceMeters` | integer | 步行距离米数 |
| `rawInfo` | string | `showroutep2p` P2P 资料 |

三语解析必须识别：

- 繁体：`港元`、`至`、`預計`、`分鐘`、`步行距離`、`米`。
- 简体：`港元`、`至`、`预计`、`分钟`、`步行距离`、`米`。
- 英文：`Hong Kong Dollar`、`To`、`Estimated`、`Min`、`Walking distance`、`m` 以及大小写变化。

## 路线查询结果 RouteOption

公开响应中的路线摘要，字段仍遵循既有 OpenAPI。

| 字段 | 类型 | 本轮不变量 |
|------|------|------------|
| `routeId` | string | 生成规则可保持现状；同一响应内唯一 |
| `operator` | string | 仍为 `citybus` |
| `routeNumbers` | string[] | 至少 1 个；三语解析后结构一致 |
| `routeLabel` | string | 保留公开字段；不因本轮清理 |
| `boardingStop` / `alightingStop` | StopSummary | `name` 为当前语言短名；`stopId` 可用时保留 |
| `fare` | MoneyAmount | `currency` 仍为 `HKD` |
| `durationMinutes` | integer | 大于等于 0 |
| `walkingDistanceMeters` | integer | 大于等于 0 |
| `sortIndex` | integer | 合并排序后重新编号 |
| `etaToken` / `etaExpiresAt` | string? / date-time? | 有可用首程 stop id 时签发；公开字段不变 |

## ETA Token Payload

服务端内部签名载荷，用于批量查询首程 ETA。公开响应只暴露不可解析的 `etaToken`。

| 字段 | 类型 | 说明 |
|------|------|------|
| `subject` | string | 固定为 `eta` |
| `routeId` | string | 路线结果 ID |
| `routeNumber` | string | 首程路线号 |
| `stopId` | string | 首程上车站 stop id |
| `direction` | string? | ETA 查询方向 |
| `language` | enum | token 签发语言 |
| `company` | string? | DATA.GOV.HK ETA URL 公司段 |
| `routeVariant` | string? | Citybus route variant |
| `boardingSeq` | integer? | 首程上车站序 |
| `alightingSeq` | integer? | 首程下车站序 |
| `rawInfo` | string? | 内部 P2P 资料，不写入日志 |
| `issuedAt` | date-time | 签发时间 |
| `expiresAt` | date-time | 过期时间，签发后 5 分钟 |

本轮移除字段：

- `serviceType` / `ServiceType`：不参与 DATA.GOV.HK ETA URL 构造、ETA 记录匹配或前端契约。旧 token 中如存在该 JSON 字段，Go 解码忽略未知字段；旧 token 仅 5 分钟有效。

## 缓存策略 CachePolicy

| 资料 | key | TTL | 缓存成功结果 | 缓存失败结果 | 语言隔离 |
|------|-----|-----|--------------|--------------|----------|
| 地点候选 | `language + query + limit` | 5 分钟 | 是 | 否 | 是 |
| 路线摘要 | `language + origin/destination coordinates` | 1 分钟 | 是 | 否 | 是 |
| DATA.GOV.HK 站名 | `stopID + language` | 1 天 | 是 | 否 | 是 |
| `showstops2` 站点地图 | `rawInfo + language` | 1 天 | 是 | 否 | 是 |
| DATA.GOV.HK ETA | 单次请求 token 去重 | 不跨请求缓存 | N/A | N/A | token 内含语言 |

## 查询日志事件 QueryLogEvent

沿用领域 `QueryLogEvent`，本轮新增或复用以下字段语义：

| 字段 | 说明 |
|------|------|
| `operationId` | `queryRouteOptions`、`citybusRouteMode`、`stopNameResolve`、`stopMapResolve` 等内部阶段 |
| `stage` | `cache_hit`、`cache_miss`、`external_request`、`mode_failed`、`mode_recovered`、`result`、`error` |
| `language` | 当前查询语言 |
| `durationMs` | 阶段耗时 |
| `resultCount` | 路线、站点或 ETA 数量 |
| `cacheHit` | 缓存命中状态 |
| `errorCode` | 受控错误码或内部降级原因 |
| `fields` | 可放 `mode`、`stopId`、`source` 等脱敏字段 |

禁止记录：token、完整外部 URL、第三方 HTML/JSON 原文、密钥、Cookie、未经脱敏的大段响应。
