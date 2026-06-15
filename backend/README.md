# Backend Boundary

第一版网站主页不产出服务端代码，也不启动后端服务。后续从 Android APK 下载功能开始，
服务端代码默认采用 DDD 目录组织结构。

后续真实在线查询、下载 manifest 服务、内容服务或外部数据代理如需落地，默认技术栈为：

- Go 1.26
- Gin
- MySQL（仅在能力需要持久化数据时引入）

服务端目录必须按照 bounded context 拆分，并在每个 context 内至少区分：

- `domain`：领域实体、值对象、领域服务、领域错误；不得依赖 HTTP 框架、文件系统、
  数据库、第三方 SDK 或前端契约。
- `application`：用例编排和端口定义，只依赖领域层。
- `infrastructure`：文件、数据库、外部 API、缓存、哈希计算等技术适配。
- `interfaces`：HTTP、CLI、定时任务等入口适配和错误映射。

当前前端只消费静态内容和 `shared/contracts/` 下的共享契约。未来后端不得要求前端依赖内部实现细节，也不得把密钥、私有 token、未公开第三方参数或可绕过服务边界的内部地址下发到浏览器。

涉及服务端 HTTP API 的变更必须采用 OpenAPI-first：先在对应 feature 的 `contracts/`
目录创建或更新 OpenAPI 3.1 YAML，再在实现阶段同步到 `shared/contracts/` 下的长期契约入口。
OpenAPI 源文件是接口文档和前后端协作的权威来源；Swagger UI、Swagger Editor、Redocly 或
等价工具用于本地预览、试接口、lint 和 bundle，不能替代仓库内的 OpenAPI 文档。
