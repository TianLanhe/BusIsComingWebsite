# 实施计划：在线巴士路线查询

**分支**：`detached HEAD` | **日期**：2026-06-16 | **规格**：[spec.md](./spec.md)

**输入**：来自 `/specs/004-online-bus-query/spec.md` 的功能规格

**说明**：本模板由 `/speckit-plan` 填写。所有面向人阅读的阶段产物必须使用简体中文。

## 摘要

本功能把首页在线查询区从静态演示升级为真实香港巴士路线试用查询。用户在网站输入起点和终点关键词后，必须从服务端返回的地点候选中选择地点；点击查询后，前端通过后端路线摘要接口展示最多 20 条按耗时排序的香港巴士路线，再通过批量 ETA 接口更新每条路线的首程候车状态。

技术路线保持前后端分离：前端继续使用 React + Vite 首页结构，重构现有 `OnlineQueryDemo` 为真实查询工具，补齐三语文案、候选下拉、requestId 防旧响应覆盖、语言切换重查和桌面/手机布局；后端新增 `routes` bounded context，按 DDD 分层代理 Citybus mobile 与 DATA.GOV.HK，提供地点检索、路线摘要、批量 ETA 三个 JSON API。共享契约以 OpenAPI 3.1 YAML 为权威来源，并补充 UI 状态契约。服务端不引入数据库，使用短期内存缓存、HMAC token、轻量限流和结构化 stdout 日志，部署层固定保留日志 7 天。

## 技术背景

**前端语言/版本**：TypeScript 5.7、React 18、Vite 6；以 `frontend/package.json` 和 lockfile 为准。

**后端语言/版本**：Go 1.26.3；以 `backend/go.mod` 为准。

**主要依赖**：前端沿用 React、Vite、lucide-react、Vitest、Playwright、Redocly CLI；后端沿用 Gin，新增路线查询时优先使用 Go 标准库、`golang.org/x/net/html` 解析 Citybus HTML 和 `crypto/hmac`/`crypto/sha256` 签名 token，不引入数据库或大型爬虫框架。

**数据与存储**：不新增持久化数据库。后端使用进程内短期缓存和限流状态：地点检索缓存 5 分钟、路线摘要缓存 1 分钟、站点映射缓存 1 天、ETA 不做跨请求缓存，只在单次批量请求内去重。`placeToken` 和 `etaToken` 使用 HMAC 签名封装必要查询上下文，分别 15 分钟和 5 分钟过期。

**测试**：后端使用 Go 单元测试和 `httptest` 覆盖领域规则、token、缓存、限流、Citybus/DATA.GOV.HK 解析、HTTP 错误映射和日志字段；前端使用 Vitest 覆盖三语文案、候选选择、状态机、旧响应丢弃和结果格式化；Playwright 覆盖桌面 1440px、手机 390px 的查询流程、下拉滚动、loading、结果卡、ETA 更新、失败/空态；OpenAPI 使用 Redocly CLI 或等价工具 lint/bundle。

**目标平台**：手机浏览器、桌面浏览器、Vite 本地开发服务、Go API 服务、后续静态前端 + API 服务部署。

**项目类型**：前后端分离 Web 应用

**性能目标**：地点候选在正常外部服务可用条件下 95% 情况 2 秒内返回；路线摘要在正常外部服务可用条件下 95% 情况 8 秒内返回并先展示结果；批量 ETA 不阻塞路线摘要展示，5 秒内成功则更新候车状态，失败则显示候车暂不可用。桌面 1440px 和手机 390px 下输入、下拉、按钮、loading、结果卡和错误/空态不得重叠、截断或不可操作。

**约束**：三语 i18n；现代、简洁、优雅；移动端和桌面端同时可用；仅香港巴士试用查询；不提供完整出行规划、地铁、铁路、渡轮、步行或其他非巴士交通；不做保存路线、监控、多班 ETA、排序 UI、详情展开或独立刷新；后端不得向前端要求裸经纬度；服务端不得用 `panic` 表达业务错误，HTTP 入口必须启用 recovery 和请求日志；日志不得记录 Cookie、token、完整外部 URL、第三方原始响应或 HTML。

**规模/范围**：1 个前端在线查询区域重构；3 个服务端 JSON API；1 个 `routes` bounded context；1 份 OpenAPI 3.1 契约；1 份 UI 状态契约；3 种语言；2 个主要 viewport；最多 100 个地点候选；最多 20 条路线结果；批量 ETA 一次请求覆盖全部路线。

**i18n 范围**：必须覆盖 `zh-Hant`、`zh-Hans` 和 `en`。新增文案包括在线查询说明、起点/终点标签、候选空态、字段错误、查询按钮、初始空态、loading、结果摘要、价格/耗时/步行标签、候车查询中、等候分钟、即将到站、候车暂不可用、0 结果空态、可重试错误、限流提示、token 过期提示和“仍显示上次结果”提示。动态地点和站名只展示当前语言一种。

**前后端契约**：feature 阶段契约位于 `specs/004-online-bus-query/contracts/`。`route-query-api.openapi.yaml` 固定三个服务端接口、JSON body、requestId、响应 envelope、错误码和示例；`route-query-ui-state.md` 固定前端状态机、旧结果保留规则、语言切换和双端 UI 不变量。实现阶段同步到 `shared/contracts/openapi/route-query-api.openapi.yaml`，如需平铺兼容路径则同时维护 `shared/contracts/route-query-api.openapi.yaml`。

**OpenAPI 接口文档**：feature 阶段权威源为 `specs/004-online-bus-query/contracts/route-query-api.openapi.yaml`，使用 OpenAPI 3.1 描述 `POST /api/routes/query_places`、`POST /api/routes/query_routes`、`POST /api/routes/query_etas`，operationId 分别为 `queryRoutePlaces`、`queryRouteOptions`、`queryRouteEtas`。请求和业务响应均为 JSON body；响应 envelope 为 `{ requestId, data, error }`；错误响应用标准 HTTP 状态码和 body 中的 `error.code`。实现阶段同步到 `shared/contracts/openapi/route-query-api.openapi.yaml`，使用 Redocly CLI 或等价工具 lint/bundle，并生成或预览中文 API UI。

**服务端 DDD 边界**：bounded context 为 `routes`。领域层包含地点候选、地点 token、路线选项、ETA token、候车状态、查询错误、缓存语义和日志事件；应用层包含地点检索、路线查询、批量 ETA、token 校验、缓存和限流编排；基础设施层包含 Citybus mobile、DATA.GOV.HK、HMAC、时钟、进程内缓存、限流器和结构化日志适配；接口适配层包含 Gin 路由、JSON envelope、HTTP 状态码、错误映射和 requestId 生成/回传。依赖方向只能是 interfaces/infrastructure -> application -> domain。

**服务端稳健性与可观测性**：路线查询服务通过领域错误和普通 error 表达参数无效、token 过期/篡改、限流、外部服务失败、超时、解析失败和系统异常，不使用 `panic` 作为业务控制流。HTTP 入口继续使用 Gin 请求日志和 recovery；若新增 goroutine 或并发 ETA 查询任务，必须用统一 recover 包装并记录 requestId、任务名、错误类型和脱敏上下文。结构化 stdout 日志覆盖请求入口、地点检索、路线查询、站点预览、ETA token、批量 ETA、缓存、限流、错误映射、关键结果和总耗时；可记录起终点名称和经纬度，但不得记录 Cookie、token、完整外部 URL、第三方原始响应、HTML 或不可控大段内容。日志保留 7 天由部署层负责，不做应用内文件轮转配置。

**代码注释与可读性**：实现阶段必须用中文注释解释 Citybus `l` 语言映射、`showstops2` 与 DATA.GOV.HK stop API 的站名补齐边界、P2P rawInfo/HTML 解析、token 签名与过期、ETA 去重、旧响应丢弃、语言切换失败保留旧结果和日志脱敏策略。简单赋值、自解释条件和普通数据搬运不加噪音注释。

**UI 可视化产物**：Figma 页面 `Online Query v2` 已创建；节点 ID 已沉淀在 `figma.md`。实现阶段保存桌面、手机、地点下拉、loading、结果卡、ETA 更新、空态和失败态截图到 `specs/004-online-bus-query/visual-review/`。

**Figma 设计引用**：[BusIsComing Website - Homepage v1 Spec](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec)。页面：`Online Query v2`（node `22:2`）。关键节点：[`Online Query v2 / Desktop 1440`](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=22-7)（node `22:7`）、[`Online Query v2 / Mobile 390`](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=22-104)（node `22:104`）、`Online Query v2 / Spec Notes`（node `22:166`）。设计覆盖地点下拉、loading、结果卡、ETA 更新、空态、查询失败和语言切换失败保留旧结果。

**双端适配范围**：桌面以 1440px 为主要视觉基准，保留左侧说明和右侧查询工具；手机以 390px 为主要视觉基准，说明和工具上下堆叠。验证覆盖输入框、下拉候选滚动、交换按钮、查询按钮、loading、结果卡列表、ETA 更新、0 结果空态、失败态和旧结果保留提示。

## 宪法检查

*门禁：必须在第 0 阶段研究前通过；第 1 阶段设计后必须复查。*

| 门禁 | 结果 | 证据或后续动作 |
|------|------|----------------|
| 产品定位与范围边界：覆盖软件介绍、试用查询、下载 App，反馈和联系为次要功能 | 通过 | 本功能只增强“试用香港巴士查询”核心范围，并继续引导下载 App 使用保存、监控和更多详情。 |
| 范围排除：不提供完整出行路线规划，也不提供地铁等其他交通工具查询 | 通过 | `spec.md` 排除范围和 FR-015/FR-021 明确限制为香港巴士，不含非巴士交通、完整规划、监控、多班 ETA、排序和详情展开。 |
| 前后端分离与契约优先：边界、契约和错误格式已记录 | 通过 | 前端、后端、共享契约边界已记录；三接口 OpenAPI 和 UI 状态契约位于 `contracts/`。 |
| OpenAPI 驱动的服务端接口文档：服务端 HTTP API 已有 OpenAPI 3.1 YAML、中文 API UI、共享沉淀路径和验证方式 | 通过 | `contracts/route-query-api.openapi.yaml` 是 feature 权威源；实现阶段同步到 `shared/contracts/openapi/`，用 Redocly CLI 或等价工具 lint/bundle，并生成中文 API UI。 |
| 三语国际化：所有用户可见文字覆盖 `zh-Hant`、`zh-Hans`、`en` | 通过 | i18n 范围列出新增 UI 文案和错误状态；动态地点和站名按当前语言单语展示。 |
| 试用查询与可靠降级：外部服务、缓存、超时和失败状态已设计 | 通过 | Citybus/DATA.GOV.HK 通过后端封装；缓存、限流、token、超时、0 结果、路线成功但 ETA 失败、语言切换失败保留旧结果均已记录。 |
| 现代界面与可视化评审：UI 讨论和展示有图片、截图、设计稿或可视化 mock | 通过 | 用户提供截图、浏览器 visual companion 确认 A 布局和去铃铛结果卡；Figma `Online Query v2` 节点已生成。 |
| 电脑与手机双端一致可用：布局、交互和内容展示同时覆盖手机与电脑 | 通过 | Figma 桌面 1440 和移动 390 节点已记录；quickstart 覆盖双端验证。 |
| Figma 驱动的前端规格：前端/UI 功能已有 Figma 文件或链接作为后续阶段参考 | 通过 | Figma 文件、页面、桌面/移动节点和状态覆盖记录在本计划和 `figma.md`。 |
| 服务端 DDD 架构：新增或重构的服务端代码按 DDD 层级、模块边界和依赖方向组织 | 通过 | bounded context 为 `routes`；计划列出 domain、application、infrastructure、interfaces 职责和依赖方向。 |
| 服务端稳健性与可观测性：panic/recover、协程安全和脱敏日志策略已定义 | 通过 | HTTP recovery、请求日志、goroutine recover、结构化 stdout 日志、脱敏字段和 7 天部署层保留策略已定义。 |
| 中文注释与代码可读性：复杂逻辑、领域规则和边界处理已有中文注释策略 | 通过 | 已列出语言映射、站名补齐、P2P 解析、token、ETA 去重、旧响应丢弃和日志脱敏等必须注释的复杂点。 |
| 可验证交付与自动提交：验证命令、浏览器检查和本次 Spec Kit skill 后提交策略已定义 | 通过 | quickstart 定义 Go、前端、OpenAPI、Playwright、curl 和真实查询验证；本次 plan 完成后提交。 |
| Spec Kit 产物语言：本功能的 spec、plan、tasks 使用简体中文 | 通过 | 当前 spec、plan、research、data-model、quickstart、figma 使用简体中文；代码标识、API 名称和第三方原文保持原文。 |

## 项目结构

### 文档（本功能）

```text
specs/004-online-bus-query/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── figma.md
├── contracts/
│   ├── route-query-api.openapi.yaml
│   ├── route-query-api.bundle.yaml
│   └── route-query-ui-state.md
└── tasks.md
```

### 源码（仓库根目录）

```text
frontend/
├── src/
│   ├── components/online-demo/
│   │   ├── OnlineQueryDemo.tsx
│   │   └── OnlineQueryDemo.module.css
│   ├── content/
│   │   ├── onlineQueryDemo.ts
│   │   ├── types.ts
│   │   └── uiCopy.ts
│   ├── services/
│   │   └── routeQueryClient.ts
│   └── tests/
│       └── online-query-demo.test.tsx
└── playwright/
    └── online-query-demo.spec.ts

backend/
├── cmd/server/
│   └── main.go
└── internal/
    ├── downloads/
    └── routes/
        ├── domain/
        ├── application/
        ├── infrastructure/
        │   ├── citybus/
        │   ├── datagovhk/
        │   ├── memory/
        │   ├── signing/
        │   └── logging/
        └── interfaces/
            └── http/

shared/
└── contracts/
    ├── openapi/
    │   └── route-query-api.openapi.yaml
    └── route-query-ui-state.md
```

**结构决策**：前端在现有 `online-demo` 模块内重构，保留首页锚点和节奏；新增 `services/routeQueryClient.ts` 封装三接口 JSON 调用，避免组件散落 fetch 细节。后端新增 `backend/internal/routes` bounded context，与现有 `downloads` context 并列；`domain` 只表达地点、路线、ETA、token、错误和日志事件；`application` 编排查询用例、缓存、限流和 token；`infrastructure` 适配 Citybus、DATA.GOV.HK、HMAC、内存缓存/限流和结构化日志；`interfaces/http` 注册 Gin 路由并处理 JSON envelope、requestId 和错误映射。OpenAPI 从 feature contracts 同步到 `shared/contracts/openapi/`，UI 状态契约同步到 `shared/contracts/`。

## 复杂度跟踪

无宪法违规。需要接受的复杂度来自真实外部查询：Citybus mobile 返回格式不是稳定公开 JSON，必须通过后端解析、签名 token、缓存、限流和降级保护前端体验。被拒绝的更简单方案包括前端直连 Citybus、路线和 ETA 合并成单接口、把裸经纬度交给前端保存、或只做静态 demo；这些方案分别违反服务边界、降级要求、安全边界或用户真实查询目标。

## 第 0 阶段输出

- [research.md](./research.md)：技术栈、三接口拆分、Citybus/DATA.GOV.HK 集成、语言映射、token、缓存限流、日志、前端状态和 Figma 方案决策。

## 第 1 阶段输出

- [data-model.md](./data-model.md)：地点候选、token、路线查询请求、路线选项、候车状态、错误、缓存和日志事件。
- [contracts/route-query-api.openapi.yaml](./contracts/route-query-api.openapi.yaml)：在线查询三接口 OpenAPI 3.1 契约。
- [contracts/route-query-api.bundle.yaml](./contracts/route-query-api.bundle.yaml)：Redocly bundle 验证产物。
- [contracts/route-query-ui-state.md](./contracts/route-query-ui-state.md)：前端状态机、旧结果保留、语言切换和双端 UI 不变量。
- [figma.md](./figma.md)：Figma 文件、节点和状态覆盖。
- [quickstart.md](./quickstart.md)：实现完成后的端到端验证步骤。

## 第 1 阶段后宪法复查

| 门禁 | 结果 | 证据或后续动作 |
|------|------|----------------|
| 产品定位与范围边界 | 通过 | 数据模型、OpenAPI 和 UI 状态契约均限制为网站基础香港巴士查询试用。 |
| 范围排除 | 通过 | 契约没有非巴士交通、完整规划、保存、监控、多班 ETA、排序或详情展开能力。 |
| 前后端分离与契约优先 | 通过 | 三接口 OpenAPI、UI 状态契约和数据模型已生成；前端只消费公开 JSON 契约。 |
| OpenAPI 驱动的服务端接口文档 | 通过 | `route-query-api.openapi.yaml` 已定义 endpoint、operationId、JSON body、envelope、状态码、错误码、降级行为和示例；实现阶段同步共享契约并 lint/bundle。 |
| 三语国际化 | 通过 | OpenAPI language enum 和 UI 状态契约覆盖 `zh-Hant`、`zh-Hans`、`en`；前端错误按 `error.code` 翻译。 |
| 试用查询与可靠降级 | 通过 | research、data-model 和 quickstart 覆盖缓存、限流、超时、0 结果、ETA 失败保留路线和语言切换失败保留旧结果。 |
| 现代界面与可视化评审 | 通过 | Figma 页面和桌面/移动节点已记录；实现阶段保存 visual-review 截图。 |
| 电脑与手机双端一致可用 | 通过 | `figma.md` 与 quickstart 覆盖桌面 1440px 和手机 390px。 |
| Figma 驱动的前端规格 | 通过 | `figma.md` 记录 Figma 文件、节点和状态覆盖。 |
| 服务端 DDD 架构 | 通过 | `data-model.md` 和 plan 记录 `routes` bounded context、层级职责和依赖方向。 |
| 服务端稳健性与可观测性 | 通过 | quickstart 要求验证 recovery、日志字段、token 脱敏和外部错误映射；如使用并发 ETA 查询，tasks 阶段必须纳入 recover 包装任务。 |
| 中文注释与代码可读性 | 通过 | plan 和 quickstart 明确复杂解析、token、降级、旧响应和日志脱敏需中文注释。 |
| 可验证交付与自动提交 | 通过 | quickstart 覆盖 OpenAPI、Go、Vitest、Playwright、curl 和真实接口验证；本次 plan 完成后提交。 |
| Spec Kit 产物语言 | 通过 | 本阶段产物使用简体中文，协议字段和第三方术语保持原文。 |
