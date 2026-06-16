# 数据模型：在线巴士路线查询

## 地点候选 PlaceCandidate

用户输入关键词后，由后端从 Citybus 地点检索结果归一化得到。

| 字段 | 类型 | 说明 | 校验 |
|------|------|------|------|
| `placeToken` | string | 后端签发的地点 token，路线查询只接收此 token | 必填；15 分钟过期；HMAC 防篡改 |
| `name` | string | 当前语言地点名 | 必填；只展示当前语言一种 |
| `displayHint` | string? | 可选区域或距离提示 | 不得包含第三方原始 HTML |
| `expiresAt` | string date-time | token 过期时间 | 必填 |
| `provider` | string | 当前为 `citybus` | 必填 |

内部 token payload 包含地点名称、坐标、语言、签发时间、过期时间和 provider。前端不得提交裸经纬度。

## 地点 Token PlaceToken

| 字段 | 类型 | 说明 |
|------|------|------|
| `subject` | string | token 类型，固定为 `place` |
| `name` | string | 当前语言地点名 |
| `lat` | number | 纬度，仅服务端内部使用和脱敏日志使用 |
| `lon` | number | 经度，仅服务端内部使用和脱敏日志使用 |
| `language` | enum | `zh-Hant`、`zh-Hans`、`en` |
| `issuedAt` | date-time | 签发时间 |
| `expiresAt` | date-time | 过期时间，签发后 15 分钟 |
| `signature` | string | HMAC-SHA256 签名 |

状态转换：`issued -> valid -> expired`；签名不匹配时视为 `invalid`，不得进入路线查询。

## 路线查询请求 RouteQueryRequest

| 字段 | 类型 | 说明 | 校验 |
|------|------|------|------|
| `requestId` | string? | 前端生成或后端补齐的请求关联 ID | 返回时必须回传 |
| `language` | enum | 当前网站语言 | 必填 |
| `originPlaceToken` | string | 起点地点 token | 必填；未过期；签名有效 |
| `destinationPlaceToken` | string | 终点地点 token | 必填；未过期；签名有效 |

校验规则：起点和终点不得是同一个地点；token 过期或篡改返回可恢复错误；新查询失败时不得展示旧路线。

## 路线选项 RouteOption

| 字段 | 类型 | 说明 | 校验 |
|------|------|------|------|
| `routeId` | string | 后端为本次结果生成的稳定 ID | 必填；同一响应内唯一 |
| `operator` | string | 当前为 `citybus` 或 Citybus P2P 结果对应运营商 | 必填 |
| `routeNumbers` | string[] | 路线号链，例如 `["694", "307"]` | 至少 1 个 |
| `routeLabel` | string | UI 后备显示名 | 必填 |
| `boardingStop` | StopSummary | 第一段上车站摘要 | 必填 |
| `alightingStop` | StopSummary | 最后一段下车站摘要 | 必填 |
| `fare` | MoneyAmount | 港币价格 | 必填 |
| `durationMinutes` | integer | 总耗时分钟数 | 大于等于 0 |
| `walkingDistanceMeters` | integer | 步行距离米数 | 大于等于 0 |
| `sortIndex` | integer | 默认耗时排序位置 | 大于等于 0 |
| `etaToken` | string? | 首程 ETA token | 可选；5 分钟过期 |
| `etaExpiresAt` | string date-time? | ETA token 过期时间 | 有 token 时必填 |

路线结果最多 20 条，默认按 `durationMinutes` 升序排列。多段巴士路线必须用 `routeNumbers` 链展示；结构化路线号不可用时使用 `routeLabel`。

## StopSummary

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 当前语言站名 |
| `stopId` | string? | DATA.GOV.HK/Citybus stop id，可用于调试和内部关联 |

简体站名优先从 DATA.GOV.HK `name_sc` 补齐；补齐失败时使用可用站名并记录日志。

## MoneyAmount

| 字段 | 类型 | 说明 |
|------|------|------|
| `currency` | string | 固定为 `HKD` |
| `amount` | number | 港币价格数值 |

前端根据当前语言格式化为 `HK$ 6.1` 等显示，后端不把 UI 文案作为唯一契约。

## ETA Token EtaToken

| 字段 | 类型 | 说明 |
|------|------|------|
| `subject` | string | token 类型，固定为 `eta` |
| `routeId` | string | 路线结果 ID |
| `routeNumber` | string | 首程路线号 |
| `stopId` | string | 首程上车站 stop id |
| `direction` | string? | ETA 查询方向 |
| `serviceType` | string? | ETA 查询服务类型 |
| `language` | enum | token 签发语言 |
| `issuedAt` | date-time | 签发时间 |
| `expiresAt` | date-time | 过期时间，签发后 5 分钟 |
| `signature` | string | HMAC-SHA256 签名 |

状态转换：`issued -> valid -> expired`；签名不匹配或上下文缺失时该条 ETA 返回不可用，不清空路线结果。

## 候车状态 EtaStatus

| 字段 | 类型 | 说明 |
|------|------|------|
| `etaToken` | string | 与请求 token 对应 |
| `status` | enum | `loading`、`waiting`、`arriving`、`unavailable` |
| `waitMinutes` | integer? | `waiting` 时的等候分钟数 |
| `updatedAt` | string date-time | 更新时间 |

前端展示规则：ETA 未返回前显示候车查询中；`waiting` 显示等候分钟；`arriving` 显示即将到站；失败、过期或不可用显示候车暂不可用。

## 查询错误 QueryError

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | enum | 稳定错误码 |
| `message` | string | 后端调试 message，不直接展示给用户 |
| `details` | object? | 受控错误细节 |

错误码包括：`INVALID_ARGUMENT`、`SAME_PLACE`、`PLACE_TOKEN_INVALID`、`PLACE_TOKEN_EXPIRED`、`ETA_TOKEN_INVALID`、`ETA_TOKEN_EXPIRED`、`RATE_LIMITED`、`EXTERNAL_SERVICE_UNAVAILABLE`、`EXTERNAL_TIMEOUT`、`PARSE_FAILED`、`INTERNAL_ERROR`。前端只按 `code` 翻译用户可见文案。

## 查询缓存 CacheEntry

| 字段 | 类型 | 说明 |
|------|------|------|
| `key` | string | 归一化缓存键 |
| `value` | object | 已解析结果 |
| `expiresAt` | date-time | 过期时间 |
| `hitCount` | integer | 命中次数，用于日志 |

缓存策略：地点检索 5 分钟；路线摘要 1 分钟；站点映射 1 天；ETA 不做跨请求缓存。

## 查询日志事件 QueryLogEvent

| 字段 | 类型 | 说明 |
|------|------|------|
| `requestId` | string | 请求关联 ID |
| `operationId` | string | `queryRoutePlaces`、`queryRouteOptions` 或 `queryRouteEtas` |
| `stage` | string | 请求入口、外部调用、解析、缓存、限流、结果、错误映射等 |
| `language` | enum | 当前语言 |
| `originName` | string? | 起点名称，路线查询可记录 |
| `originLat` / `originLon` | number? | 起点坐标，路线查询可记录 |
| `destinationName` | string? | 终点名称，路线查询可记录 |
| `destinationLat` / `destinationLon` | number? | 终点坐标，路线查询可记录 |
| `durationMs` | integer | 阶段或总耗时 |
| `resultCount` | integer? | 结果数量 |
| `cacheHit` | boolean? | 是否命中缓存 |
| `errorCode` | string? | 错误码 |

日志禁止记录 Cookie、token、完整外部 URL、第三方原始响应、HTML 或不可控大段内容。
