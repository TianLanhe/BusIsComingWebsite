# 任务：在线路线查询性能优化

**输入**：来自 `/specs/009-route-query-performance/` 的设计文档

**前置条件**：`plan.md`、`spec.md`、`research.md`、`data-model.md`、`contracts/`、`quickstart.md` 已存在并完成一致性检查。

**测试**：本功能涉及服务端缓存、三语解析、外部集成降级、并发 recover、OpenAPI 未漂移和公开响应兼容，必须包含 Go 单元测试、race 验证、OpenAPI lint/bundle、日志/DDD/注释检查和按需 live 复现步骤。

**组织方式**：任务按用户故事分组，保证每个用户故事都能独立实现和验证。前端 UI、Figma、用户可见固定文案和服务端 HTTP API 新增/变更在本功能中均为 N/A，不生成前端实现任务。

## 格式：`[ID] [P?] [Story] 描述`

- **[P]**：可并行执行，且不会修改同一文件或依赖前置未完成任务
- **[Story]**：任务所属用户故事，例如 US1、US2、US3、US4
- 描述中必须包含准确文件路径

## 路径约定

- **后端源码**：`backend/internal/routes/`、`backend/cmd/server/`
- **后端测试**：`backend/internal/routes/**/*_test.go`
- **Citybus fixture**：`backend/internal/routes/infrastructure/citybus/testdata/route-query/`
- **共享契约**：`shared/contracts/openapi/route-query-api.openapi.yaml`、`shared/contracts/openapi/route-query-api.bundle.yaml`
- **规格与验证记录**：`specs/009-route-query-performance/`
- **前端**：本轮不修改；仅可复用 `frontend/src/tests/`、`frontend/playwright/` 做兼容回归

## 阶段 1：设置（共享基础）

**目的**：准备 fixture、测试辅助和契约守护入口，确保后续任务可以直接按文件落地。

- [X] T001 创建 Citybus 三语 fixture 说明文件 `backend/internal/routes/infrastructure/citybus/testdata/route-query/README.md`，记录第三方原文保留、live 响应来源和不得改写 fixture 语义的规则
- [X] T002 在 `backend/internal/routes/infrastructure/citybus/route_client_test.go` 增加 009 专用 fake HTTP client、请求计数和可控时钟测试辅助，供三语解析、站点地图缓存和三模式并行测试复用
- [X] T003 [P] 在 `backend/internal/routes/infrastructure/datagovhk/stop_client_test.go` 增加 fake DATA.GOV.HK stop 响应、请求计数和可控时钟测试辅助，供站名缓存测试复用
- [X] T004 [P] 在 `specs/009-route-query-performance/quickstart.md` 增加实现阶段验证记录占位，覆盖 Go、race、OpenAPI、fixture、日志、DDD 和注释检查结果

---

## 阶段 2：基础设施（阻塞前置）

**目的**：建立所有用户故事共享的短名化、公开契约守护和日志/恢复边界。此阶段完成前不能开始用户故事实现。

**关键要求**：不新增 HTTP API，不修改前端字段；共享规则必须服务 `StopClient` 和 `showstops2` 两种站名来源。

- [X] T005 在 `backend/internal/routes/infrastructure/citybus/route_client_test.go` 增加 `StopSummary.Name` 短名化测试，覆盖序号前缀、繁体逗号补充、简体逗号补充、英文逗号补充和短名化后为空的情况
- [X] T006 在 `backend/internal/routes/infrastructure/citybus/route_client.go` 实现共享站名短名化 helper，并让 `stationDisplayName` 复用该 helper
- [X] T007 [P] 在 `backend/internal/routes/interfaces/http/handler_query_routes_test.go` 增加公开响应契约守护测试，确认 `query_routes` 响应字段和错误 envelope 不因内部优化新增或删除字段
- [X] T008 [P] 在 `backend/internal/routes/infrastructure/signing/token_signer_test.go` 增加 ETA token payload JSON 反序列化 helper，用于后续断言 `serviceType` 不再写入
- [X] T009 在 `backend/internal/routes/domain/model.go` 检查 `domain` 包不依赖 Gin、HTTP client、文件系统、数据库或前端契约，并将检查口径记录到 `specs/009-route-query-performance/quickstart.md`
- [X] T010 在 `backend/internal/routes/infrastructure/citybus/route_client.go` 为短名化、语言隔离和外部资料 fallback 添加必要中文注释，避免重复简单赋值含义

**检查点**：短名化 helper、公开契约守护和测试辅助完成，可以开始用户故事实现。

---

## 阶段 3：用户故事 1 - 复用稳定站名（优先级：P1）MVP

**目标**：同一 stop id 在 1 天内重复展示时复用 DATA.GOV.HK 三语站名，最终写入当前语言短站名；失败、空结果和不可用语言字段不得缓存。

**独立测试**：使用同一个 stop id 在繁体、简体、英文下触发站名展示，确认当前语言短名一致可用，1 天内第二次不再请求外部站名服务；失败场景后续仍会重试并 fallback 到 `showstops2 displayName` 短名。

### 用户故事 1 的测试或验证

- [X] T011 [US1] 在 `backend/internal/routes/infrastructure/datagovhk/stop_client_test.go` 增加 `StopClient` 成功站名 1 天缓存测试，断言第二次同 `stopID + language` 不增加外部请求计数
- [X] T012 [US1] 在 `backend/internal/routes/infrastructure/datagovhk/stop_client_test.go` 增加失败不缓存测试，覆盖 HTTP 非 2xx、空结果、JSON 无法解析和缺少可用语言字段
- [X] T013 [US1] 在 `backend/internal/routes/infrastructure/datagovhk/stop_client_test.go` 增加语言隔离和过期重试测试，覆盖同 stop id 的 `zh-Hant`、`zh-Hans`、`en` 不串用
- [X] T014 [US1] 在 `backend/internal/routes/infrastructure/citybus/route_client_test.go` 增加 `resolveStopName` 测试，覆盖 `StopClient` 返回 `樂軒臺, 柴灣道` 时写入 `樂軒臺`，以及 `StopClient` 失败时 fallback 到已短名化 `showstops2 displayName`

### 用户故事 1 的实现

- [X] T015 [US1] 在 `backend/internal/routes/infrastructure/datagovhk/stop_client.go` 定义站名缓存接口并实现只缓存成功短名的 1 天 TTL 逻辑
- [X] T016 [US1] 在 `backend/internal/routes/infrastructure/datagovhk/stop_client.go` 确保失败、空结果、不可解析 JSON 和短名化后为空均不写入缓存
- [X] T017 [US1] 在 `backend/internal/routes/infrastructure/citybus/route_client.go` 更新 `resolveStopName`，确保 `StopClient` 结果和 `showstops2 displayName` fallback 写入 `StopSummary.Name` 前都统一短名化
- [X] T018 [US1] 在 `backend/cmd/server/main.go` 为 DATA.GOV.HK 站名 resolver 注入 `memory.NewTTLCache[string]` 或等价 1 天成功结果缓存
- [X] T019 [US1] 在 `backend/internal/routes/infrastructure/datagovhk/stop_client.go` 和 `backend/internal/routes/infrastructure/citybus/route_client.go` 补充中文注释，解释成功缓存、失败不缓存、语言隔离和 fallback 规则

**检查点**：US1 可以独立验证，站名来源稳定、短名一致、失败可重试。

---

## 阶段 4：用户故事 2 - 三语路线结果可用（优先级：P1）

**目标**：繁体、简体和英文 Citybus 路线摘要都能解析出路线号链、价格、耗时、步行距离、P2P 资料、站点预览和可选 ETA token；`EtaPayload.ServiceType` 被清理且不改变公开契约。

**独立测试**：使用同一组可返回路线的繁体、简体和英文离线 HTML fixture 调用解析流程，确认响应结构一致、动态站名按当前语言展示、`etaToken` 可签发时 payload 不含 `serviceType`。

### 用户故事 2 的测试或验证

- [X] T020 [P] [US2] 添加繁体 Citybus 路线摘要 fixture `backend/internal/routes/infrastructure/citybus/testdata/route-query/zh-hant.html`，保留第三方原文语义
- [X] T021 [P] [US2] 添加简体 Citybus 路线摘要 fixture `backend/internal/routes/infrastructure/citybus/testdata/route-query/zh-hans.html`，覆盖“预计”“分钟”“步行距离”等字段
- [X] T022 [P] [US2] 添加英文 Citybus 路线摘要 fixture `backend/internal/routes/infrastructure/citybus/testdata/route-query/en.html`，覆盖 “Hong Kong Dollar”“To”“Estimated”“Min”“Walking distance”
- [X] T023 [US2] 在 `backend/internal/routes/infrastructure/citybus/route_client_test.go` 增加三语 fixture 解析测试，断言路线号链、HKD 价格、耗时分钟数、步行距离米数、P2P rawInfo 和至少一条站点预览可用
- [X] T024 [P] [US2] 在 `backend/internal/routes/infrastructure/signing/token_signer_test.go` 增加 ETA token payload 测试，断言新签发 token 不包含 `serviceType` 且仍能通过 `VerifyEta`
- [X] T025 [P] [US2] 在 `backend/internal/routes/infrastructure/datagovhk/eta_client_test.go` 增加 ETA 匹配回归测试，确认清理 `ServiceType` 后仍按 `route + stop + direction + boardingSeq` 与 fallback 规则匹配

### 用户故事 2 的实现

- [X] T026 [US2] 在 `backend/internal/routes/infrastructure/citybus/route_client.go` 更新 `ParseRouteResponse` 候选 table 过滤规则，支持繁体“預計”、简体“预计”和英文 `estimated/min`，不得只依赖单一语言关键词
- [X] T027 [US2] 在 `backend/internal/routes/infrastructure/citybus/route_client.go` 更新路线号链与价格解析，支持繁体/简体 `港元`、连接词 `至`、英文 `Hong Kong Dollar` 和 `To`
- [X] T028 [US2] 在 `backend/internal/routes/infrastructure/citybus/route_client.go` 更新耗时和步行距离正则，支持繁体、简体、英文和大小写变化
- [X] T029 [US2] 在 `backend/internal/routes/domain/model.go` 移除 `EtaTokenPayload.ServiceType` 字段，并确认领域模型仍只表达当前 ETA 查询实际需要字段
- [X] T030 [US2] 在 `backend/internal/routes/infrastructure/citybus/route_client.go` 移除 `ServiceType: "1"` 固定赋值，并保持 `Company`、`StopID`、`RouteNumber`、`Direction`、`BoardingSeq` 等字段完整
- [X] T031 [US2] 在 `backend/internal/routes/infrastructure/signing/token_signer_test.go` 更新旧测试数据，确保不再构造或断言 `ServiceType`
- [X] T032 [US2] 在 `backend/internal/routes/infrastructure/citybus/route_client.go` 补充中文注释，说明三语 Citybus 文本解析边界和 fixture 保留第三方原文语义的原因

**检查点**：US2 可以独立验证，三语路线摘要可解析，ETA token payload 清理不影响公开接口。

---

## 阶段 5：用户故事 3 - 复用路线站点地图（优先级：P2）

**目标**：同一 P2P 路线资料和语言在 1 天内复用已成功解析的 `showstops2` 站点地图，用于路线卡站点预览和首程 ETA stop id 补齐；失败结果不缓存。

**独立测试**：使用同一组 P2P rawInfo 和语言重复查询路线，确认第二次不再请求 `showstops2`，上车站、下车站和 ETA stop id 一致；过期后重新请求，失败不缓存。

### 用户故事 3 的测试或验证

- [X] T033 [US3] 在 `backend/internal/routes/infrastructure/citybus/route_client_test.go` 增加 `showstops2` 成功站点地图 1 天缓存测试，断言同 `rawInfo + language` 第二次不增加外部请求计数
- [X] T034 [US3] 在 `backend/internal/routes/infrastructure/citybus/route_client_test.go` 增加 `showstops2` 失败不缓存、空结果不缓存和过期重试测试
- [X] T035 [US3] 在 `backend/internal/routes/infrastructure/citybus/route_client_test.go` 增加站点地图缓存语言隔离测试，确认 `zh-Hant`、`zh-Hans`、`en` 不串用 `P2PStop.DisplayName`
- [X] T036 [US3] 在 `backend/internal/routes/infrastructure/citybus/route_client_test.go` 增加首程 ETA stop id 补齐回归测试，确认缓存命中时仍写入 `EtaPayload.StopID`

### 用户故事 3 的实现

- [X] T037 [US3] 在 `backend/internal/routes/infrastructure/citybus/route_client.go` 为 `RouteClient` 增加站点地图缓存接口字段，key 使用 `rawInfo + language` 并只保存解析后的 `[]domain.P2PStop`
- [X] T038 [US3] 在 `backend/internal/routes/infrastructure/citybus/route_client.go` 抽取 `fetchStopMap` 或等价函数，使 `fillStopPreview` 先查缓存、miss 时请求 `showstops2`、成功非空后写入 1 天缓存
- [X] T039 [US3] 在 `backend/internal/routes/infrastructure/citybus/route_client.go` 确保 `showstops2` HTTP 失败、读取失败、解析为空和上下文取消不会写入站点地图缓存
- [X] T040 [US3] 在 `backend/cmd/server/main.go` 为 `RouteClient` 注入 `memory.NewTTLCache[[]domain.P2PStop]` 或等价 1 天成功结果缓存
- [X] T041 [US3] 在 `backend/internal/routes/infrastructure/citybus/route_client.go` 补充中文注释，解释 `showstops2` 缓存 key、失败不缓存、语言隔离和与 ETA stop id 的关系

**检查点**：US3 可以独立验证，路线站点地图稳定复用且不缓存失败。

---

## 阶段 6：用户故事 4 - 并行搜索路线模式（优先级：P3）

**目标**：路线查询同时尝试 `T/F/W` 三种既有模式，等待时间接近最慢成功模式；结果去重、排序和部分失败降级保持稳定。

**独立测试**：模拟三种模式存在不同响应时间、部分失败、panic 和重复路线，确认至少一个模式成功即可返回可用路线；三种模式都失败或都无可解析路线时才返回既有不可用降级。

### 用户故事 4 的测试或验证

- [X] T042 [US4] 在 `backend/internal/routes/infrastructure/citybus/route_client_test.go` 增加三模式不同延迟成功测试，断言总耗时接近最慢成功模式而不是三模式耗时相加
- [X] T043 [US4] 在 `backend/internal/routes/infrastructure/citybus/route_client_test.go` 增加部分模式 HTTP 失败或解析失败测试，断言成功模式结果不会被失败模式清空
- [X] T044 [US4] 在 `backend/internal/routes/infrastructure/citybus/route_client_test.go` 增加模式 goroutine panic recover 测试，断言单个模式 panic 后查询仍返回其它成功模式结果
- [X] T045 [US4] 在 `backend/internal/routes/infrastructure/citybus/route_client_test.go` 增加确定性合并和 `dedupeRoutes` 回归测试，确认结果不随模式完成顺序变化

### 用户故事 4 的实现

- [X] T046 [US4] 在 `backend/internal/routes/infrastructure/citybus/route_client.go` 重构 `SearchRoutes`，为固定 `T/F/W` 三模式创建受控 goroutine 并尊重 request context
- [X] T047 [US4] 在 `backend/internal/routes/infrastructure/citybus/route_client.go` 为每个模式 worker 增加 `defer recover`，将 panic 转为该模式失败并避免影响 HTTP 进程
- [X] T048 [US4] 在 `backend/internal/routes/infrastructure/citybus/route_client.go` 实现固定模式顺序合并，之后复用 `dedupeRoutes` 和 `domain.SortRouteOptions`
- [X] T049 [US4] 在 `backend/internal/routes/infrastructure/citybus/route_client.go` 保持全部模式失败或无可解析路线时返回既有 `citybus route query returned no parseable results` 降级错误
- [X] T050 [US4] 在 `backend/internal/routes/infrastructure/citybus/route_client.go` 补充中文注释，说明固定并发范围、部分失败降级、排序稳定和 recover 策略

**检查点**：US4 可以独立验证，三模式并行提升等待时间且不破坏排序和降级。

---

## 阶段 7：打磨与跨切面

**目的**：完成 OpenAPI 未漂移、日志/DDD/注释、范围排除、race 和 quickstart 验证记录。

- [X] T051 在 `backend/internal/routes/infrastructure/citybus/route_client_test.go` 补充缓存命中、模式失败和 panic recover 的脱敏日志或可测试观测断言，确保不记录 token、完整外部 URL、第三方原始响应或 HTML
- [X] T052 在 `specs/009-route-query-performance/quickstart.md` 记录 `cd backend && go test ./...` 的实现验证结果
- [X] T053 在 `specs/009-route-query-performance/quickstart.md` 记录 `cd backend && go test -race ./internal/routes/application ./internal/routes/infrastructure/memory ./internal/routes/infrastructure/citybus` 的实现验证结果
- [X] T054 在 `specs/009-route-query-performance/quickstart.md` 记录 `npm --prefix frontend run openapi:routes:lint` 和 `npm --prefix frontend run openapi:routes:bundle` 的实现验证结果
- [X] T055 在 `specs/009-route-query-performance/quickstart.md` 记录 `git diff -- shared/contracts/openapi/route-query-api.openapi.yaml` 未漂移检查结果
- [X] T056 [P] 在 `specs/009-route-query-performance/quickstart.md` 记录按需 Citybus live 复现是否执行；若未执行，说明默认门禁由离线 fixture 覆盖
- [X] T057 在 `backend/internal/routes/domain/model.go`、`backend/internal/routes/application/service.go`、`backend/internal/routes/infrastructure/citybus/route_client.go`、`backend/internal/routes/infrastructure/datagovhk/stop_client.go` 检查 DDD 依赖方向和中文注释质量，确认没有以 panic 表达业务错误
- [X] T058 在 `shared/contracts/openapi/route-query-api.openapi.yaml`、`frontend/src/services/routeQueryTypes.ts` 和 `backend/internal/routes/interfaces/http/handler_query_routes_test.go` 检查公开 HTTP 契约、前端类型和响应 envelope 未新增字段
- [X] T059 在 `specs/009-route-query-performance/quickstart.md` 记录本轮不修改前端 UI、Figma、用户可见固定文案、完整路线规划或非香港巴士查询范围的最终检查结果
- [X] T060 运行 `git diff --check` 并把提交前状态检查结果记录到 `specs/009-route-query-performance/quickstart.md`

---

## 依赖与执行顺序

### 阶段依赖

- **设置（阶段 1）**：无依赖，可以立即开始
- **基础设施（阶段 2）**：依赖设置完成，阻塞所有用户故事
- **用户故事 1（阶段 3）**：依赖基础设施完成，是 MVP
- **用户故事 2（阶段 4）**：依赖基础设施完成，可与 US1 后半段并行，但最终需共享短名化规则
- **用户故事 3（阶段 5）**：依赖基础设施完成；可在 US1 的短名化 helper 稳定后推进
- **用户故事 4（阶段 6）**：依赖基础设施完成；建议在 US1/US3 缓存稳定后推进，避免并行放大重复外部请求
- **打磨（阶段 7）**：依赖目标用户故事完成

### 用户故事依赖

- **US1（P1）**：基础设施完成后即可开始，不依赖 US2/US3/US4
- **US2（P1）**：基础设施完成后即可开始；`ServiceType` 清理不依赖 US1，三语站名展示验证复用基础短名化 helper
- **US3（P2）**：基础设施完成后即可开始；站点地图 fallback 名称复用基础短名化 helper
- **US4（P3）**：基础设施完成后即可开始；为了减少重复请求，推荐在 US1/US3 缓存完成后实现

### 单个用户故事内部顺序

- 测试任务先于实现任务
- 公开契约守护先于涉及响应结构的实现
- 短名化 helper 先于 `StopClient` 和 `showstops2` fallback
- 三语 fixture 先于解析规则修改
- 领域模型清理先于 token signer 和 ETA client 回归
- 缓存接口和失败不缓存规则先于 wiring
- goroutine recover 先于并行搜索交付完成标记
- 每个故事完成后先独立验证，再进入最终打磨

## 并行机会

- T003、T004 可与 T001/T002 并行
- T007、T008、T009 可在 T005/T006 之外并行
- US1 中 T011/T012/T013/T014 同属测试但修改同一测试文件时需串行；T018 可与 T015/T016/T017 后半段分开处理
- US2 中 T020/T021/T022 可并行添加不同 fixture；T024/T025 可与解析测试 T023 并行
- US3 中 T033/T034/T035/T036 都在同一测试文件，建议同一执行者串行；T040 可在 T037 接口稳定后并行 wiring
- US4 中 T042/T043/T044/T045 都在同一测试文件，建议同一执行者串行；T050 可在 T046/T047/T048 后补齐
- 打磨阶段 T056 可与 T052-T055 的自动化验证记录并行

## 实施策略

### MVP 优先

1. 完成阶段 1 设置
2. 完成阶段 2 基础设施
3. 完成 US1：稳定站名缓存与短名化
4. 独立运行 US1 相关 Go 测试，确认 1 天缓存、失败不缓存、语言隔离和 fallback
5. 再推进 US2、US3、US4

### 增量交付

1. 设置 + 基础设施 -> 短名化和契约守护稳定
2. US1 -> 站名缓存和短名稳定 -> 可演示
3. US2 -> 三语解析和 `ServiceType` 清理 -> 可演示
4. US3 -> `showstops2` 站点地图缓存 -> 可演示
5. US4 -> 三模式并行 -> 可演示
6. 打磨 -> OpenAPI、race、日志、DDD、注释和范围检查

## 备注

- [P] 表示不同文件、无直接依赖、可并行执行
- [Story] 标签映射到 `spec.md` 中的用户故事
- 本功能不修改前端 UI、Figma 设计、用户可见固定文案或服务端 HTTP API
- 实现阶段若发现必须修改 OpenAPI 源契约，必须同步更新 `shared/contracts/openapi/route-query-api.openapi.yaml` 并重新生成 bundle，不得只改代码
- 实现阶段不得提交含大段第三方 live HTML 的临时文件；fixture 必须精简且保留第三方原文语义
- 每次 Spec Kit skill 完成并验证通过后必须自动提交，除非提交范围或信息不清晰
