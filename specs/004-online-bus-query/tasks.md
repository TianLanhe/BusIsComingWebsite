# 任务：在线巴士路线查询

**输入**：来自 `/specs/004-online-bus-query/` 的 `spec.md`、`plan.md`、`research.md`、`data-model.md`、`contracts/`、`figma.md` 和 `quickstart.md`

**前置条件**：Figma `Online Query v2` 桌面和移动节点已生成；OpenAPI 3.1 feature 契约已存在；当前计划为 `specs/004-online-bus-query/plan.md`

**测试**：本规格明确要求后端单元测试、HTTP handler 测试、前端 Vitest、Playwright 双端验证、OpenAPI lint/bundle、真实接口手动验证和日志验证，因此各用户故事均包含测试或验证任务。

**组织方式**：任务按用户故事分组，保证每个用户故事都能独立实现和验证；阶段 1 和阶段 2 是所有故事的共享前置。

## 阶段 1：设置（共享基础）

**目的**：同步契约、建立目录和可执行验证入口。

- [ ] T001 将 feature OpenAPI 契约同步到 `shared/contracts/openapi/route-query-api.openapi.yaml`
- [ ] T002 [P] 将 feature UI 状态契约同步到 `shared/contracts/route-query-ui-state.md`
- [ ] T003 [P] 在 `frontend/package.json` 增加 `openapi:routes:lint` 和 `openapi:routes:bundle` 路线查询专用脚本，并保留现有下载接口 OpenAPI 脚本
- [ ] T004 [P] 在 `backend/internal/routes/domain/`、`backend/internal/routes/application/`、`backend/internal/routes/infrastructure/`、`backend/internal/routes/interfaces/http/` 建立 routes bounded context 目录骨架
- [ ] T005 [P] 在 `frontend/src/services/routeQueryTypes.ts` 建立前端路线查询契约类型入口
- [ ] T006 [P] 在 `specs/004-online-bus-query/visual-review/README.md` 记录实现阶段截图命名和 Figma 对照要求

---

## 阶段 2：基础设施（阻塞前置）

**目的**：完成所有用户故事共享的领域模型、token、缓存、限流、日志、错误 envelope 和请求入口。

**关键要求**：本阶段完成前不能开始用户故事实现；领域层不得依赖 Gin、文件系统、HTTP 客户端或前端契约。

- [ ] T007 [P] 为路线领域模型和领域错误增加单元测试，路径：`backend/internal/routes/domain/model_test.go`
- [ ] T008 在 `backend/internal/routes/domain/model.go` 实现 PlaceCandidate、PlaceTokenPayload、RouteOption、EtaTokenPayload、EtaStatus、QueryError 和日志事件值对象
- [ ] T009 [P] 在 `backend/internal/routes/application/ports.go` 定义 Citybus、DATA.GOV.HK、签名、缓存、限流、日志和时钟端口
- [ ] T010 [P] 为 HMAC token 签名、过期和篡改校验增加测试，路径：`backend/internal/routes/infrastructure/signing/token_signer_test.go`
- [ ] T011 在 `backend/internal/routes/infrastructure/signing/token_signer.go` 实现 `placeToken` 15 分钟和 `etaToken` 5 分钟签名校验，并用中文注释说明 token payload 和过期边界
- [ ] T012 [P] 为进程内 TTL 缓存和限流器增加测试，路径：`backend/internal/routes/infrastructure/memory/cache_test.go`
- [ ] T013 在 `backend/internal/routes/infrastructure/memory/cache.go` 实现地点 5 分钟、路线 1 分钟、站点 1 天缓存和轻量限流器
- [ ] T014 [P] 在 `backend/internal/routes/infrastructure/logging/logger.go` 实现结构化 stdout 日志适配器，禁止输出 Cookie、token、完整外部 URL、第三方原始响应和 HTML
- [ ] T015 [P] 在 `backend/internal/routes/interfaces/http/envelope.go` 实现 `{ requestId, data, error }` JSON envelope、requestId 补齐和 HTTP 错误映射
- [ ] T016 在 `backend/internal/routes/interfaces/http/routes.go` 注册 `/api/routes/query_places`、`/api/routes/query_routes`、`/api/routes/query_etas` 的 POST 路由骨架
- [ ] T017 在 `backend/cmd/server/main.go` 装配 routes context 依赖，输出服务启动与关闭结构化日志，并确认 `gin.Logger()` 和 `gin.Recovery()` 仍启用
- [ ] T018 [P] 在 `frontend/src/content/uiCopy.ts` 增加在线查询共享三语文案键，包括字段错误、loading、空态、限流、token 过期和“仍显示上次结果”
- [ ] T019 [P] 在 `frontend/src/services/routeQueryClient.ts` 建立三接口 JSON client 骨架，统一发送 JSON body 并读取 response envelope

**检查点**：OpenAPI、DDD 骨架、token、缓存、限流、日志、envelope 和前端 client 入口就绪，可以开始用户故事。

---

## 阶段 3：用户故事 1 - 选择起终点并查看路线结果（优先级：P1）MVP

**目标**：用户输入起终点关键词，只能从服务端候选中选择地点，点击查询后看到最多 20 条真实香港巴士路线结果。

**独立测试**：打开首页在线查询区，起终点默认为空；输入关键词后下拉展示当前语言候选；选择不同起终点并查询后展示按耗时排序的路线卡，包含路线号链、上车站、下车站、价格、耗时、步行距离和候车占位状态。

### 用户故事 1 的测试或验证

- [ ] T020 [P] [US1] 为地点检索和路线查询 HTTP 契约增加 handler 测试，路径：`backend/internal/routes/interfaces/http/handler_query_routes_test.go`
- [ ] T021 [P] [US1] 为 Citybus `bsearch_p3.php` 地点解析增加 fixture 测试，路径：`backend/internal/routes/infrastructure/citybus/place_client_test.go`
- [ ] T022 [P] [US1] 为 Citybus `ppsearch_p3.php` 路线摘要解析增加 fixture 测试，路径：`backend/internal/routes/infrastructure/citybus/route_client_test.go`
- [ ] T023 [P] [US1] 为前端候选选择、同地点阻止、自由文本阻止和旧响应丢弃增加 Vitest，路径：`frontend/src/tests/online-query-demo.test.tsx`
- [ ] T024 [US1] 为桌面 1440px 和手机 390px 的地点下拉、loading、路线结果卡增加 Playwright 验证，路径：`frontend/playwright/online-query-demo.spec.ts`

### 用户故事 1 的实现

- [ ] T025 [P] [US1] 在 `backend/internal/routes/infrastructure/citybus/language.go` 实现 `zh-Hant -> 0`、`en -> 1`、`zh-Hans -> 2` 映射，并用中文注释说明真实接口验证结果
- [ ] T026 [P] [US1] 在 `backend/internal/routes/infrastructure/citybus/place_client.go` 实现 Citybus 地点检索客户端和最多 100 条候选归一化
- [ ] T027 [P] [US1] 在 `backend/internal/routes/infrastructure/citybus/route_client.go` 实现 Citybus P2P 路线摘要解析、最多 20 条结果和按耗时排序
- [ ] T028 [P] [US1] 在 `backend/internal/routes/infrastructure/datagovhk/stop_client.go` 实现 stop id 和站名查询端口适配，用于路线站点摘要补齐
- [ ] T029 [US1] 在 `backend/internal/routes/application/query_places.go` 实现地点检索用例，包含 requestId、缓存、限流、placeToken 签发和日志
- [ ] T030 [US1] 在 `backend/internal/routes/application/query_routes.go` 实现路线查询用例，包含 token 校验、同地点错误、路线摘要、站点预览、空结果和错误降级
- [ ] T031 [US1] 在 `backend/internal/routes/interfaces/http/handler.go` 实现 queryRoutePlaces 和 queryRouteOptions 的 JSON body 绑定、envelope 响应和错误映射
- [ ] T032 [P] [US1] 在 `frontend/src/content/types.ts` 将 `OnlineQueryDemo` 从静态 demo 类型扩展为在线查询内容类型
- [ ] T033 [P] [US1] 在 `frontend/src/content/onlineQueryDemo.ts` 删除旧静态示例路线并补齐基础试用说明、初始空态和范围说明三语文案
- [ ] T034 [P] [US1] 在 `frontend/src/services/routeQueryClient.ts` 实现 `queryPlaces` 和 `queryRoutes` 调用、requestId 透传和错误码解析
- [ ] T035 [US1] 在 `frontend/src/components/online-demo/OnlineQueryDemo.tsx` 实现起点/终点输入、300ms debounce、候选下拉、候选选择、交换按钮和查询按钮状态机
- [ ] T036 [US1] 在 `frontend/src/components/online-demo/OnlineQueryDemo.tsx` 实现路线 loading、初始空态、0 路线空态、routeError 和路线结果卡渲染
- [ ] T037 [US1] 在 `frontend/src/components/online-demo/OnlineQueryDemo.module.css` 按 Figma Desktop 1440 和 Mobile 390 调整左说明右工具布局、下拉滚动高度和路线卡样式

**检查点**：US1 可独立运行；不依赖 ETA 成功即可展示真实路线摘要和完整路线卡。

---

## 阶段 4：用户故事 2 - 查看首程候车状态（优先级：P2）

**目标**：路线摘要先展示，随后一次批量 ETA 请求更新所有路线的首程候车状态；ETA 失败不清空路线结果。

**独立测试**：路线摘要返回后卡片显示候车查询中；批量 ETA 返回后更新为等候分钟、即将到站或候车暂不可用；批量失败或单条失败时路线仍保留。

### 用户故事 2 的测试或验证

- [ ] T038 [P] [US2] 为 ETA token 生成、过期和单条不可用增加应用层测试，路径：`backend/internal/routes/application/query_etas_test.go`
- [ ] T039 [P] [US2] 为 DATA.GOV.HK ETA 解析和去重增加基础设施测试，路径：`backend/internal/routes/infrastructure/datagovhk/eta_client_test.go`
- [ ] T040 [P] [US2] 为前端 ETA loading、合并成功、部分不可用和批量失败保留路线增加 Vitest，路径：`frontend/src/tests/online-query-demo.test.tsx`
- [ ] T041 [US2] 为 ETA 更新前后状态增加桌面和手机 Playwright 验证，路径：`frontend/playwright/online-query-demo.spec.ts`

### 用户故事 2 的实现

- [ ] T042 [P] [US2] 在 `backend/internal/routes/infrastructure/datagovhk/eta_client.go` 实现 DATA.GOV.HK ETA 客户端和 ETA 响应归一化
- [ ] T043 [P] [US2] 在 `backend/internal/routes/application/recover.go` 实现并发 ETA 查询任务的 recover 包装和脱敏错误日志
- [ ] T044 [US2] 在 `backend/internal/routes/application/query_routes.go` 为可查询首程 ETA 的路线生成 `etaToken` 和 `etaExpiresAt`
- [ ] T045 [US2] 在 `backend/internal/routes/application/query_etas.go` 实现批量 ETA 用例，包含 token 校验、单请求去重、单条失败降级和结构化日志
- [ ] T046 [US2] 在 `backend/internal/routes/interfaces/http/handler.go` 实现 queryRouteEtas 的 JSON body 绑定、envelope 响应和错误映射
- [ ] T047 [P] [US2] 在 `frontend/src/services/routeQueryClient.ts` 实现 `queryEtas` 调用和 ETA token 批量请求
- [ ] T048 [US2] 在 `frontend/src/components/online-demo/OnlineQueryDemo.tsx` 实现路线成功后自动批量 ETA、requestId 合并保护和失败时保留路线
- [ ] T049 [US2] 在 `frontend/src/components/online-demo/OnlineQueryDemo.module.css` 实现候车查询中、等候分钟、即将到站和候车暂不可用的稳定卡片状态样式

**检查点**：US1 和 US2 均可独立验证；ETA 不影响路线摘要可用性。

---

## 阶段 5：用户故事 3 - 语言切换后保持查询一致（优先级：P2）

**目标**：`zh-Hant`、`zh-Hans` 和 `en` 切换后，当前已选起终点和路线结果尽量按当前语言重新查询；失败时保留旧结果并轻量提示。

**独立测试**：同一组起终点查询成功后切换三种语言，页面自动重查路线和 ETA；成功时动态地点、站名、状态和错误文案按当前语言展示；失败时旧结果仍保留。

### 用户故事 3 的测试或验证

- [ ] T050 [P] [US3] 为 Citybus 语言参数、DATA.GOV.HK `name_tc`/`name_sc`/`name_en` 站名补齐增加测试，路径：`backend/internal/routes/infrastructure/citybus/language_test.go`
- [ ] T051 [P] [US3] 为前端语言切换自动重查、失败保留旧结果和错误码三语翻译增加 Vitest，路径：`frontend/src/tests/online-query-demo.test.tsx`
- [ ] T052 [US3] 为 `zh-Hant`、`zh-Hans`、`en` 三语查询和切换失败保留旧结果增加 Playwright 验证，路径：`frontend/playwright/online-query-demo.spec.ts`

### 用户故事 3 的实现

- [ ] T053 [US3] 在 `backend/internal/routes/infrastructure/datagovhk/stop_client.go` 实现简体站名优先用 `name_sc` 补齐、失败回退可用站名并记录日志
- [ ] T054 [US3] 在 `backend/internal/routes/application/query_routes.go` 支持使用不同语言请求复用已选 placeToken 坐标重新查询路线
- [ ] T055 [P] [US3] 在 `frontend/src/content/uiCopy.ts` 补齐语言切换重查、仍显示上次结果、token 过期和外部失败的三语用户文案
- [ ] T056 [US3] 在 `frontend/src/components/online-demo/OnlineQueryDemo.tsx` 实现语言变化监听、同一组起终点自动重查路线和 ETA、失败保留旧结果
- [ ] T057 [US3] 在 `frontend/src/components/online-demo/OnlineQueryDemo.tsx` 实现动态地点和站名只展示当前语言一种，不展示双语副名
- [ ] T058 [US3] 在 `frontend/src/components/online-demo/OnlineQueryDemo.module.css` 实现“仍显示上次结果”轻量提示，不遮挡输入和路线卡

**检查点**：三语动态查询体验完成；语言切换不会破坏已验证的 US1 和 US2。

---

## 阶段 6：用户故事 4 - 理解范围和降级状态（优先级：P3）

**目标**：用户清楚网页只提供基础香港巴士试用；外部服务失败、0 结果、限流和 token 过期都展示可信状态，不暗示完整出行规划或非巴士查询。

**独立测试**：检查在线查询说明、FAQ、0 结果、外部失败、限流、token 过期和日志脱敏；确认三语完整且不出现范围外能力暗示。

### 用户故事 4 的测试或验证

- [ ] T059 [P] [US4] 为外部超时、解析失败、限流、token 过期和 panic recovery 的 HTTP 映射增加测试，路径：`backend/internal/routes/interfaces/http/handler_errors_test.go`
- [ ] T060 [P] [US4] 为日志字段和脱敏规则增加测试，路径：`backend/internal/routes/infrastructure/logging/logger_test.go`
- [ ] T061 [P] [US4] 为在线查询范围说明、FAQ 范围排除和三语完整性增加测试，路径：`frontend/src/tests/content-contract.test.ts`
- [ ] T062 [US4] 为 0 结果、外部失败、限流和 token 过期状态增加 Playwright 验证，路径：`frontend/playwright/online-query-demo.spec.ts`

### 用户故事 4 的实现

- [ ] T063 [US4] 在 `backend/internal/routes/interfaces/http/errors.go` 完成 `INVALID_ARGUMENT`、`SAME_PLACE`、`PLACE_TOKEN_EXPIRED`、`RATE_LIMITED`、`EXTERNAL_TIMEOUT`、`PARSE_FAILED`、`INTERNAL_ERROR` 等错误码到 HTTP 状态码的映射
- [ ] T064 [US4] 在 `backend/internal/routes/application/query_places.go`、`backend/internal/routes/application/query_routes.go`、`backend/internal/routes/application/query_etas.go` 补齐关键节点日志和错误日志
- [ ] T065 [US4] 在 `frontend/src/content/sectionsContent.ts` 更新在线查询说明和 FAQ，明确保存路线、监控、多班 ETA、更多详情需要下载 App
- [ ] T066 [US4] 在 `frontend/src/components/online-demo/OnlineQueryDemo.tsx` 实现 0 路线空态、可重试错误、限流提示、token 过期提示和起终点变更后失败不展示旧路线
- [ ] T067 [US4] 在 `frontend/src/components/online-demo/OnlineQueryDemo.module.css` 完成空态、错误态和限流态的桌面/手机稳定布局
- [ ] T068 [US4] 在 `backend/README.md` 记录 routes context、三接口、日志 7 天由部署层保留和应用内不做文件轮转配置

**检查点**：范围边界和可靠降级完成；页面不会把网站描述成完整出行规划工具。

---

## 阶段 7：打磨与跨切面

**目的**：完成契约同步、文档、截图、质量门禁和最终验证。

- [ ] T069 [P] 生成路线查询中文 API UI 静态页并记录预览方式，路径：`docs/api/route-query.html` 和 `docs/api/route-query.md`
- [ ] T070 运行 `cd frontend && npm run openapi:routes:bundle` 将 route query OpenAPI bundle 生成到 `shared/contracts/openapi/route-query-api.bundle.yaml`
- [ ] T071 在 `specs/004-online-bus-query/contracts/route-query-api.bundle.yaml` 重新生成 feature bundle 并确认与源 OpenAPI 同步
- [ ] T072 [P] 在 `specs/004-online-bus-query/visual-review/desktop-1440-online-query-v2.png` 保存桌面初始和整体布局截图
- [ ] T073 [P] 在 `specs/004-online-bus-query/visual-review/desktop-1440-place-dropdown.png` 保存桌面候选下拉截图
- [ ] T074 [P] 在 `specs/004-online-bus-query/visual-review/desktop-1440-route-results.png` 保存桌面路线结果截图
- [ ] T075 [P] 在 `specs/004-online-bus-query/visual-review/desktop-1440-error-retained.png` 保存桌面语言切换失败保留旧结果截图
- [ ] T076 [P] 在 `specs/004-online-bus-query/visual-review/mobile-390-online-query-v2.png` 保存手机初始和整体布局截图
- [ ] T077 [P] 在 `specs/004-online-bus-query/visual-review/mobile-390-place-dropdown.png` 保存手机候选下拉截图
- [ ] T078 [P] 在 `specs/004-online-bus-query/visual-review/mobile-390-route-results.png` 保存手机路线结果截图
- [ ] T079 [P] 在 `specs/004-online-bus-query/visual-review/mobile-390-error-empty.png` 保存手机错误或空态截图
- [ ] T080 在 `specs/004-online-bus-query/quickstart.md` 记录最终执行过的 OpenAPI、Go、Vitest、Playwright、curl 和日志验证结果
- [ ] T081 运行 `cd frontend && npm run openapi:routes:lint` 并验证 `shared/contracts/openapi/route-query-api.openapi.yaml`
- [ ] T082 运行 `cd backend && go test ./...` 并验证 routes context 和 downloads context 测试通过
- [ ] T083 运行 `cd frontend && npm run test -- online-query-demo i18n-completeness content-contract` 并验证三语和状态机测试通过
- [ ] T084 运行 `cd frontend && npm run build` 并验证生产构建通过
- [ ] T085 启动后端和前端本地服务后运行 `cd frontend && npm run test:e2e -- online-query-demo.spec.ts`
- [ ] T086 用 `specs/004-online-bus-query/quickstart.md` 中的 curl 请求手动验证 `/api/routes/query_places`、`/api/routes/query_routes`、`/api/routes/query_etas`
- [ ] T087 审查 `backend/internal/routes/domain/` 依赖方向，确认 domain 不依赖 Gin、文件系统、HTTP 客户端、第三方 SDK 或前端契约
- [ ] T088 审查 `backend/cmd/server/main.go` 和 `backend/internal/routes/` 代码，确认没有以 panic 表达业务错误，HTTP 入口启用 recovery，服务启动与关闭日志可观测，自建 goroutine 已 recover 并有脱敏日志
- [ ] T089 审查 `frontend/src/components/online-demo/OnlineQueryDemo.tsx` 和 `backend/internal/routes/`，确认复杂规则、错误映射、外部约束、token、ETA 去重和日志脱敏已有中文注释且无噪音注释
- [ ] T090 审查 `frontend/src/content/` 和 `frontend/src/components/online-demo/`，确认没有监控铃铛、多班 ETA、排序 UI、详情展开或非香港巴士交通查询入口
- [ ] T091 检查 `specs/004-online-bus-query/figma.md`，确认 Figma 文件、Desktop URL、Mobile URL、状态覆盖和 visual-review 截图清单保持最新
- [ ] T092 运行 `git diff --check` 并确认没有空白错误

---

## 依赖与执行顺序

### 阶段依赖

- **阶段 1 设置**：无依赖，可以立即开始。
- **阶段 2 基础设施**：依赖阶段 1 完成；阻塞所有用户故事。
- **阶段 3 US1**：依赖阶段 2 完成；MVP 交付点。
- **阶段 4 US2**：依赖阶段 2 完成，可与 US3 的后端语言测试准备并行；最终集成依赖 US1 的路线结果列表。
- **阶段 5 US3**：依赖阶段 2 完成；自动重查和结果保留依赖 US1，ETA 重查依赖 US2。
- **阶段 6 US4**：依赖阶段 2 完成；错误态 UI 依赖 US1，ETA 失败降级依赖 US2。
- **阶段 7 打磨**：依赖目标用户故事完成。

### 用户故事依赖

- **US1（P1）**：基础设施完成后即可开始，不依赖其他用户故事。
- **US2（P2）**：可在基础设施后开始 ETA 后端能力；前端合并需要 US1 的路线结果状态机。
- **US3（P2）**：语言映射可在基础设施后开始；自动重查需要 US1，ETA 重查需要 US2。
- **US4（P3）**：错误映射和日志可在基础设施后开始；完整 UI 验证依赖 US1-US3。

### 单个用户故事内部顺序

1. 先完成测试或验证任务。
2. 后端先 domain/application，再 infrastructure/interfaces。
3. OpenAPI 和共享契约先于前端 client 和 HTTP handler 交付完成标记。
4. 前端先 service/types/i18n，再组件状态机和 CSS。
5. 每个故事完成后先独立验证，再推进后续故事。

## 并行机会

- 阶段 1 的 T002-T006 可并行。
- 阶段 2 中 token、缓存限流、日志、envelope 和前端 i18n/client 骨架可并行，但 T017 必须等后端依赖可装配后完成。
- US1 中 T020-T024 可并行定义测试；T025-T028 可并行实现外部适配；T032-T034 可与后端应用服务并行。
- US2 中 T038-T041 可并行；T042、T043、T047 可并行，T048 依赖 T045-T047。
- US3 中 T050-T052 可并行；T053、T055、T058 可并行，T056 依赖 T054 和 T055。
- US4 中 T059-T062 可并行；T063、T065、T067、T068 可并行。
- 阶段 7 的截图保存 T072-T079 可在本地服务稳定后并行执行。

## 实施策略

### MVP 优先

1. 完成阶段 1 设置。
2. 完成阶段 2 基础设施。
3. 完成阶段 3 US1。
4. 运行 US1 的后端、前端和 Playwright 验证。
5. 演示真实地点选择和路线摘要结果。

### 增量交付

1. US1：地点检索 + 路线摘要 + 结果卡。
2. US2：批量 ETA + 候车状态降级。
3. US3：三语动态重查 + 失败保留旧结果。
4. US4：范围文案 + 空态/错误态/限流/token 过期 + 日志观测。
5. 阶段 7：契约、截图、日志、范围和完整回归。

## 格式验证

- 所有任务均使用 `- [ ] T###` 检查框格式。
- 用户故事阶段任务均带 `[US1]`、`[US2]`、`[US3]` 或 `[US4]` 标签。
- 标记 `[P]` 的任务仅用于不同文件或无直接依赖的并行工作。
- 每个任务描述均包含明确文件路径或可执行命令对应的验证文件路径。
