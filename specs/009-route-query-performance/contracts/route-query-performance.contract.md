# 契约：在线路线查询性能优化

## 契约范围

本契约记录 009 迭代对在线路线查询的公开 API 兼容要求和后端内部行为不变量。它不替代 OpenAPI 源文件。

权威公开 HTTP 契约：

- `shared/contracts/openapi/route-query-api.openapi.yaml`
- `shared/contracts/openapi/route-query-api.bundle.yaml`

本轮不新增、修改或移除 HTTP endpoint、请求字段、响应字段、错误 envelope、状态码或用户可见固定文案。

## 公开 API 不变量

### `POST /api/routes/query_routes`

请求不变：

- `language`
- `originPlaceToken`
- `destinationPlaceToken`
- 可选 `requestId`

成功响应不变：

- `data.queriedAt`
- `data.resultLimit`
- `data.routes[]`
- `routes[].routeId`
- `routes[].operator`
- `routes[].routeNumbers`
- `routes[].routeLabel`
- `routes[].boardingStop.name`
- `routes[].boardingStop.stopId`
- `routes[].alightingStop.name`
- `routes[].alightingStop.stopId`
- `routes[].fare.currency`
- `routes[].fare.amount`
- `routes[].durationMinutes`
- `routes[].walkingDistanceMeters`
- `routes[].sortIndex`
- `routes[].etaToken`
- `routes[].etaExpiresAt`

本轮允许的值语义变化：

- `boardingStop.name` 和 `alightingStop.name` 必须是当前语言短站名。
- 简体和英文语言下原本不可解析的 Citybus 可用路线现在必须正常返回。
- `etaToken` 内部 payload 不再包含 `serviceType`，但公开 token 字段仍为不可解析字符串。

### `POST /api/routes/query_etas`

请求不变：

- `language`
- `etaTokens[]`
- 可选 `requestId`

成功响应不变：

- `data.queriedAt`
- `data.etas[].etaToken`
- `data.etas[].status`
- `data.etas[].waitMinutes`
- `data.etas[].updatedAt`

本轮不改变 ETA 匹配语义：

- 仍优先使用 `route + stop + direction + boardingSeq` 匹配。
- 若严格 seq 无可用记录，仍回退到 `route + stop + direction`，并按 `eta_seq` 和 ETA 时间选择首班。
- 单条 token 失败仍返回 `unavailable`，不清空路线摘要。

## 内部行为不变量

### 站名缓存

- key 必须隔离 `stopID` 和 `language`。
- TTL 为 1 天。
- 只缓存 `StopClient` 成功解析且短名化后非空的站名。
- 失败、空结果、HTTP 非 2xx、JSON 解析失败或缺少可用语言字段不得写入缓存。

### 站点地图缓存

- key 必须隔离 `rawInfo` 和 `language`。
- TTL 为 1 天。
- 只缓存 `showstops2` 成功解析且非空的 `P2PStop[]`。
- 缓存值不得包含第三方 HTML 原文。
- 失败、空结果或不可解析结果不得写入缓存。

### 站名短名化

- `StopClient` 返回值和 `showstops2 displayName` 必须使用同一短名化规则。
- 写入 `StopSummary.Name` 前必须移除逗号后的道路或区域补充。
- Citybus 序号前缀必须在写入前移除。
- 短名化后为空时必须进入 fallback 或保持既有降级，不得写入空白站名。

### 三语解析

- 繁体、简体和英文 Citybus 路线摘要都必须解析路线号链、港币价格、预计耗时、步行距离和 P2P 资料。
- 自动化 fixture 必须保留第三方原文语义，不得改写为项目自定义格式。
- 解析失败不得返回伪造路线；所有模式都失败或无可解析结果时使用既有外部不可用降级。

### 三模式并行

- 仅固定并行 `T`、`F`、`W` 三种搜索模式。
- 每个模式任务必须尊重 request context。
- 每个模式任务必须 recover；panic 只使该模式失败。
- 合并结果必须按固定模式顺序进入去重，再按既有排序规则输出。
- 单个或两个模式失败不得清空成功模式结果。

### `ServiceType` 清理

- 领域 `EtaTokenPayload` 不再包含 `ServiceType`。
- 新签发的 ETA token payload 不得包含 `serviceType` JSON 字段。
- 清理不得改变 `query_etas` 公开请求、响应、错误 envelope 或 ETA 匹配语义。

## 非目标

- 不新增 HTTP endpoint。
- 不修改前端 TypeScript 类型或 UI。
- 不提供完整出行路线规划。
- 不查询地铁、铁路、渡轮、步行或其他非香港巴士交通。
- 不新增跨实例缓存、数据库、Redis 或 in-flight 去重。
- 不缓存实时 ETA。

## 验证要求

- `cd backend && go test ./...`
- `cd backend && go test -race ./internal/routes/application ./internal/routes/infrastructure/memory ./internal/routes/infrastructure/citybus`
- `npm --prefix frontend run openapi:routes:lint`
- `npm --prefix frontend run openapi:routes:bundle`
- `git diff -- shared/contracts/openapi/route-query-api.openapi.yaml` 应为空，除非实现阶段明确发现 OpenAPI 源契约过期并按宪法同步更新。
- 对照 [quickstart.md](../quickstart.md) 执行三语 fixture、缓存、并行和 live 复现验证。
