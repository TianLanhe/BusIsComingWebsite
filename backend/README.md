# Backend

本目录承载网站后端服务。当前实现范围包括 Android APK 下载入口和在线城巴 / Citybus 路线查询试用。

Android APK 下载入口：

- `GET /api/downloads/android/latest`
- 无认证、无请求参数
- 成功时返回当前 `BusIsComing.apk`
- 响应头包含 `Content-Disposition`、`Content-Length`、`X-APK-SHA256`、`X-APK-Version-Name`、`X-APK-Version-Code`
- 所有成功和失败响应都返回 `Cache-Control: no-store`

在线路线查询入口：

- `POST /api/routes/query_places`
- `POST /api/routes/query_routes`
- `POST /api/routes/query_etas`
- 请求和响应业务字段使用 JSON body；响应统一为 `{ requestId, data, error }`
- 地点和路线查询由服务端代理 Citybus mobile；ETA 查询由服务端代理 DATA.GOV.HK
- 前端只提交 `placeToken` 和 `etaToken`，不提交裸经纬度

## 技术栈

- Go 1.26
- Gin
- 文件系统受管 APK 存储
- 进程内短期缓存、轻量限流和 HMAC token

## 本地运行

```bash
cd /Users/jianglijie/.codex/worktrees/abec/BusIsCommingWebsite/backend
go run ./cmd/server
```

默认监听 `0.0.0.0:8080`，方便同一局域网设备访问健康检查和下载接口。可通过环境变量覆盖：

- `BUS_HTTP_HOST`：监听地址，默认 `0.0.0.0`
- `PORT`：监听端口，默认 `8080`
- `BUS_DOWNLOAD_ROOT`：APK 受管根目录，默认 `downloads/android`
- `ROUTE_QUERY_TOKEN_SECRET`：路线查询 token HMAC 密钥；未设置时使用本地开发默认值

示例：

```bash
BUS_HTTP_HOST=0.0.0.0 PORT=8080 go run ./cmd/server
```

如果只允许本机访问，可显式设为：

```bash
BUS_HTTP_HOST=127.0.0.1 PORT=8080 go run ./cmd/server
```

前端开发服务默认通过 `npm --prefix frontend run dev` 监听 `0.0.0.0:5173`；正式部署预览可用
`FRONTEND_HTTP_PORT=80 npm --prefix frontend run preview:http`，或由反向代理把标准 HTTP 入口转发到
前端预览服务。无论使用局域网访问还是正式 HTTP 入口，下载 API 路径仍保持
`/api/downloads/android/latest`，路线查询 API 仍保持 `/api/routes/*`，不因监听地址改变 OpenAPI 契约。

## DDD 目录

`downloads` 和 `routes` 是当前 bounded context，依赖方向必须保持为 `interfaces/infrastructure -> application -> domain`。

- `internal/downloads/domain`：APK 元数据、下载结果、校验和领域错误，不依赖 Gin、文件系统、HTTP 包或前端契约。
- `internal/downloads/application`：下载当前 APK 用例与端口定义，只依赖领域层。
- `internal/downloads/infrastructure/filesystem`：读取 `current.json`、读取 APK 文件、计算 SHA-256，基于文件修改时间缓存 Artifact 避免每次请求重复读取和校验。
- `internal/downloads/interfaces/http`：Gin 路由、响应头、JSON 错误映射。
- `internal/routes/domain`：地点候选、地点 token、路线结果、ETA token、候车状态、查询错误和日志事件。
- `internal/routes/application`：地点检索、路线摘要、批量 ETA、token 校验、缓存、限流和日志编排。
- `internal/routes/infrastructure`：Citybus、DATA.GOV.HK、HMAC、进程内缓存、限流和 stdout JSON 日志适配。
- `internal/routes/interfaces/http`：Gin 路由、JSON envelope、requestId 和 HTTP 错误映射。

## 性能与容量边界

路线查询的外部调用必须以服务端受控方式编排，避免用户输入直接放大为无界并发或无界内存占用。

- `POST /api/routes/query_places` 以 `language + query + limit` 为 key 使用进程内短期缓存，TTL 为 5 分钟。
- `POST /api/routes/query_routes` 以 `language + 起终点经纬度` 为 key 使用进程内短期缓存，TTL 为 1 分钟。
- 进程内 `TTLCache` 最多保留 1024 个 key；写入前清理过期条目，达到上限时淘汰一个较早过期或较少命中的条目。
- 进程内 `RateLimiter` 最多追踪 1024 个 key；每次检查前清理窗口外记录，达到上限时淘汰一个最久未命中的 key。
- `POST /api/routes/query_etas` 会先按 `etaToken` 去重，再查询 DATA.GOV.HK ETA；同一请求中的重复 token 只触发一次外部查询。
- 批量 ETA 外部查询最多同时执行 6 个；响应数组顺序仍与请求 token 顺序一致，重复 token 会在对应位置返回同一份 ETA 状态。
- 单个 ETA token 校验失败、外部查询失败或适配器异常时，该 token 降级为 `unavailable`，不使整批请求失败。

这些缓存和限流状态仅保存在当前服务进程内；服务重启后会清空。需要跨实例共享容量控制时，必须在基础设施层引入外部存储或网关限流，并保持领域层和应用层不依赖具体实现。

## 稳健性与日志

服务端不得用 `panic` 表达业务错误；领域层、应用层、基础设施层和 HTTP 层必须返回 error 或
领域错误，并由接口适配层映射为受控响应。HTTP 服务入口必须启用请求日志和 panic recovery；
当前 `cmd/server/main.go` 使用 `gin.Logger()` 和 `gin.Recovery()`。

新增自建 goroutine、并发回调或后台任务时，必须通过统一包装或 `defer recover` 捕获异常，
记录任务名、错误类型、调用上下文和必要堆栈，并把失败传回调用方或可观测边界。当前批量 ETA
查询的 goroutine 已在应用层用 `defer recover` 包装；单个 token 的异常会降级为 `unavailable`，
不会拖垮 HTTP 进程或整批响应。日志必须覆盖启动失败、请求、下载错误、元数据读取、文件校验失败、
在线查询入口、地点检索、路线查询、批量 ETA、缓存命中、限流、关键结果、错误映射和降级状态；
不得输出 Cookie、密钥、token、完整外部 URL、第三方原始响应、HTML 或不可控大段内容。

在线查询结构化日志输出到 stdout；日志保留期固定为 7 天，由部署层负责收集和清理，应用内不实现
文件轮转或保留期配置。

## 代码注释

后端新写或重构代码必须为复杂领域规则、下载校验、错误映射、外部约束、状态转换、缓存或降级
策略补充中文注释。简单赋值、普通条件和自解释函数不添加重复代码含义的注释。第三方协议字段、
HTTP header、OpenAPI 字段和错误码保持原文。

## 当前 APK 管理

服务端只管理一个当前 APK，不提供历史版本列表。

- APK 文件：`downloads/android/BusIsComing.apk`
- 元数据：`downloads/android/current.json`
- 当前大小：`5,009,547` bytes
- 当前 SHA-256：`93e7930ee9e6b9cc05819bab895153ad985707bdcfff3e6bead60065acf07470`
- 当前版本：`versionName=1.0`、`versionCode=1`

替换当前 APK 时：

```bash
cd /Users/jianglijie/Documents/BusIsCommingWebsite
backend/scripts/update_android_apk.py /path/to/BusIsComing.apk
```

脚本会读取 APK 的 `applicationId`、`versionName`、`versionCode` 和应用名，计算文件大小与
SHA-256，把 APK 复制到 `backend/downloads/android/BusIsComing.apk`，并更新
`backend/downloads/android/current.json`。

脚本依赖 Android SDK build-tools 的 `aapt`，需确保 `aapt` 在 `PATH` 中。

更新后运行：

1. `cd backend && go test ./...`
2. 启动服务并用 `curl` 下载一次，确认下载文件 SHA-256 与 `current.json` 一致。

## 验证

常规后端验证命令：

```bash
cd /Users/jianglijie/Documents/BusIsCommingWebsite/backend
go test ./...
go test -race ./internal/routes/application ./internal/routes/infrastructure/memory
```

## 契约

服务端 HTTP API 必须以 OpenAPI-first 维护。权威契约位于：

- `shared/contracts/openapi/download-api.openapi.yaml`
- `shared/contracts/openapi/route-query-api.openapi.yaml`
- `shared/contracts/download-api.openapi.yaml`

Swagger UI、Redocly 或等价工具只能作为预览、lint、bundle 和生成 API UI 的工具，不能替代
仓库内的 OpenAPI 文档。生成的 API UI 中，项目可控的接口标题、摘要、参数说明、响应说明、
错误说明和示例说明必须使用中文；工具内置且不可配置的控件文案可以保留默认语言。
