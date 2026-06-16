# Backend

本目录承载网站后端服务。当前实现范围是 Android APK 下载入口：

- `GET /api/downloads/android/latest`
- 无认证、无请求参数
- 成功时返回当前 `BusIsComing.apk`
- 响应头包含 `Content-Disposition`、`Content-Length`、`X-APK-SHA256`、`X-APK-Version-Name`、`X-APK-Version-Code`
- 所有成功和失败响应都返回 `Cache-Control: no-store`

## 技术栈

- Go 1.26
- Gin
- 文件系统受管 APK 存储

## 本地运行

```bash
cd /Users/jianglijie/Documents/BusIsCommingWebsite/backend
go run ./cmd/server
```

默认监听 `127.0.0.1:8080`。可通过环境变量覆盖：

- `PORT`：监听端口，默认 `8080`
- `DOWNLOADS_ROOT`：APK 受管根目录，默认 `downloads/android`

## DDD 目录

`downloads` 是当前 bounded context，依赖方向必须保持为 `interfaces/infrastructure -> application -> domain`。

- `internal/downloads/domain`：APK 元数据、下载结果、校验和领域错误，不依赖 Gin、文件系统、HTTP 包或前端契约。
- `internal/downloads/application`：下载当前 APK 用例与端口定义，只依赖领域层。
- `internal/downloads/infrastructure/filesystem`：读取 `current.json`、读取 APK 文件、计算 SHA-256。
- `internal/downloads/interfaces/http`：Gin 路由、响应头、JSON 错误映射。

## 稳健性与日志

服务端不得用 `panic` 表达业务错误；领域层、应用层、基础设施层和 HTTP 层必须返回 error 或
领域错误，并由接口适配层映射为受控响应。HTTP 服务入口必须启用请求日志和 panic recovery；
当前 `cmd/server/main.go` 使用 `gin.Logger()` 和 `gin.Recovery()`。

新增自建 goroutine、并发回调或后台任务时，必须通过统一包装或 `defer recover` 捕获异常，
记录任务名、错误类型、调用上下文和必要堆栈，并把失败传回调用方或可观测边界。日志必须覆盖
启动失败、请求、下载错误、元数据读取、文件校验失败和降级状态；不得输出密钥、token、私有
路径、个人敏感信息或未经脱敏的第三方响应。

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

1. 把新的 APK 复制到 `downloads/android/BusIsComing.apk`。
2. 运行 `wc -c downloads/android/BusIsComing.apk` 记录大小。
3. 运行 `shasum -a 256 downloads/android/BusIsComing.apk` 记录 SHA-256。
4. 更新 `downloads/android/current.json` 中的 `versionName`、`versionCode`、`sizeBytes`、`sha256`、`sourcePath`、`lastUpdated`。
5. 运行 `go test ./...`。
6. 启动服务并用 `curl` 下载一次，确认下载文件 SHA-256 与 `current.json` 一致。

## 契约

服务端 HTTP API 必须以 OpenAPI-first 维护。权威契约位于：

- `shared/contracts/openapi/download-api.openapi.yaml`
- `shared/contracts/download-api.openapi.yaml`

Swagger UI、Redocly 或等价工具只能作为预览、lint、bundle 和生成 API UI 的工具，不能替代
仓库内的 OpenAPI 文档。生成的 API UI 中，项目可控的接口标题、摘要、参数说明、响应说明、
错误说明和示例说明必须使用中文；工具内置且不可配置的控件文案可以保留默认语言。
