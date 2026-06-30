# 实施计划：在线路线查询性能优化

**分支**：`codex/009-route-query-performance` | **日期**：2026-07-01 | **规格**：[spec.md](./spec.md)

**输入**：来自 `/specs/009-route-query-performance/spec.md` 的功能规格

**说明**：本计划由 `/speckit-plan` 生成。所有面向人阅读的阶段产物使用简体中文。

## 摘要

本功能优化网站在线巴士路线查询的后端稳定性、性能和三语兼容性：为 DATA.GOV.HK 站名和 Citybus `showstops2` 站点地图增加 1 天成功结果缓存；继续保留既有地点 5 分钟缓存、路线摘要 1 分钟缓存和 ETA 实时查询语义；把 Citybus `T/F/W` 三种路线搜索模式改为受控并行并保持确定性去重排序；修复繁体、简体和英文 Citybus 路线摘要解析；统一 `StopSummary.Name` 短名化；清理 ETA token payload 中未使用的 `ServiceType`。

技术路线保持前后端分离但本轮只修改后端 `routes` bounded context 和验证文档。前端请求字段、响应字段、错误 envelope、用户可见固定文案和 UI 布局均不变。既有 OpenAPI 3.1 源契约仍是 `shared/contracts/openapi/route-query-api.openapi.yaml`，本轮只做未漂移验证，不新增 HTTP API 或 schema 字段。

## 技术背景

**前端语言/版本**：TypeScript 5.7、React 18、Vite 6；本功能不修改前端代码，仅用现有前端契约证明响应结构不变。

**后端语言/版本**：Go 1.26.3；以 `backend/go.mod` 为准。

**主要依赖**：后端沿用 Gin、Go 标准库 `net/http`、`sync`、`context`、`regexp`、`encoding/json`、HMAC token signer、进程内 `memory.TTLCache`、结构化 stdout logger；前端工具仅使用现有 Redocly CLI 做 OpenAPI lint/bundle。无需新增生产依赖。

**数据与存储**：不新增数据库或跨实例存储。新增稳定资料缓存均为进程内 TTL 缓存：`StopClient` 成功站名按 `stopID + language` 缓存 1 天；`showstops2` 成功站点地图按 `rawInfo + language` 缓存 1 天；失败、空结果和不可解析结果不缓存。既有地点 5 分钟缓存、路线摘要 1 分钟缓存、批量 ETA 单请求 token 去重和实时 ETA 查询不改变。本轮明确不做 in-flight 去重。

**测试**：Go 单元测试覆盖 Citybus 三语解析、`showstops2` 站点地图缓存、`StopClient` 站名缓存、短名化、`ServiceType` 清理、并行模式部分失败、确定性去重排序、缓存过期和失败不缓存；应用层测试覆盖前端/API 契约不变和 ETA token 签发/验证；OpenAPI 使用 Redocly CLI lint/bundle 证明共享契约未漂移；必要时运行 Go race 测试覆盖并发缓存和三模式并行。

**目标平台**：Go API 服务、现有静态前端 + API 服务部署入口、手机浏览器和桌面浏览器现有在线查询页面。

**项目类型**：前后端分离 Web 应用。

**性能目标**：代表性重复路线查询中，稳定站点资料相关外部请求数量减少至少 80%；三种路线搜索模式响应时间不同的场景中，基础路线摘要等待时间相较串行模式降低至少 30%；并发范围固定为 `T/F/W` 三个搜索模式，不因用户输入产生无界并发；ETA 仍最多同时查询 6 个 token。

**约束**：不改变前端字段、OpenAPI schema、错误 envelope 或 UI；不新增用户定位、路线详情页、反向地理编码、完整出行规划、地铁/铁路/渡轮/步行等非巴士查询；三语 Citybus 响应必须可解析；缓存按语言隔离；服务端不得用 `panic` 表达业务错误；新 goroutine 必须 recover；日志不得输出 token、完整外部 URL、第三方原始响应或 HTML。

**规模/范围**：1 个后端 bounded context；2 类 1 天稳定资料缓存；3 个 Citybus 搜索模式并行；3 种语言解析 fixture；1 个内部 ETA token payload 字段清理；1 个 feature 内部契约文档；不新增 HTTP endpoint，不修改前端页面。

**i18n 范围**：本功能不新增用户可见固定文案。动态路线摘要解析必须覆盖 `zh-Hant`、`zh-Hans`、`en` 三种 Citybus 响应格式；动态站名按当前语言选择并最终短名化；第三方原文 fixture 保持原始语义，不为测试通过而改写。

**前后端契约**：公开 HTTP 契约保持 `shared/contracts/openapi/route-query-api.openapi.yaml` 不变；feature 内部契约位于 [contracts/route-query-performance.contract.md](./contracts/route-query-performance.contract.md)，记录缓存、并行、三语解析、短名化、`ServiceType` 清理和非 API 不变量。

**OpenAPI 接口文档**：本功能不新增、修改或移除服务端 HTTP API。权威契约继续为 `shared/contracts/openapi/route-query-api.openapi.yaml`，bundle 为 `shared/contracts/openapi/route-query-api.bundle.yaml`；实现阶段必须运行 `npm --prefix frontend run openapi:routes:lint` 和 `npm --prefix frontend run openapi:routes:bundle`，并确认 OpenAPI 源文件没有因内部优化漂移。中文 API UI 仍由既有 OpenAPI 项目可控中文内容保证，本轮无需新增 API UI。

**服务端 DDD 边界**：bounded context 为 `routes`。领域层维护 `RouteOption`、`StopSummary`、`P2PStop`、`EtaTokenPayload` 等值对象，移除不参与语义的 `ServiceType`；应用层继续编排地点、路线、ETA 用例、既有短缓存、token 签发和错误映射；基础设施层负责 Citybus route/search/`showstops2`、DATA.GOV.HK stop/ETA、缓存装饰器、HMAC signer、JSON 日志；接口适配层 Gin 路由、JSON envelope 和 HTTP 错误映射保持不变。依赖方向仍为 `interfaces/infrastructure -> application -> domain`。

**服务端稳健性与可观测性**：三模式并行使用固定 3 个任务，必须尊重 request context；每个模式任务捕获 panic 并转为该模式失败，不能拖垮整个查询；全部模式失败才返回路线不可用。缓存命中、缓存失效、外部降级、模式失败和最终结果数量必须有脱敏日志或可测试观测点；日志不得记录 token、完整外部 URL、第三方原始响应、HTML 或密钥。既有 HTTP 入口继续使用 `gin.Logger()` 和 `gin.Recovery()`。

**代码注释与可读性**：实现阶段需用中文注释解释成功结果 1 天缓存、失败不缓存、语言隔离、`showstops2` 与 `StopClient` 站名来源关系、短名化规则、Citybus 三语解析关键词、`T/F/W` 并行合并顺序、部分失败降级、`ServiceType` 清理兼容性和 goroutine recover。普通赋值、字段搬运和自解释条件不加噪音注释。

**UI 可视化产物**：N/A。本功能不改变前端页面、组件、布局或交互。

**Figma 设计引用**：N/A。本功能不涉及前端 UI 设计；既有在线查询页面继续沿用 004/007 已沉淀的 Figma 与视觉产物。

**双端适配范围**：N/A。本功能不改变手机或电脑端布局；实现阶段只需确认现有在线查询页面消费的响应结构不变，必要时复用现有 Playwright 在线查询用例。

## 宪法检查

*门禁：必须在第 0 阶段研究前通过；第 1 阶段设计后必须复查。*

| 门禁 | 结果 | 证据或后续动作 |
|------|------|----------------|
| 产品定位与范围边界：覆盖软件介绍、试用查询、下载 App，反馈和联系为次要功能 | 通过 | 本功能只优化官网在线试用香港巴士查询，不改变下载、反馈或联系范围。 |
| 范围排除：不提供完整出行路线规划，也不提供地铁等其他交通工具查询 | 通过 | spec FR-014 和本计划约束均明确不新增非巴士或完整规划能力。 |
| 前后端分离与契约优先：边界、契约和错误格式已记录 | 通过 | 前端契约不变；后端内部优化；feature contract 记录非 API 行为不变量。 |
| OpenAPI 驱动的服务端接口文档：服务端 HTTP API 已有 OpenAPI 3.1 YAML、中文 API UI、共享沉淀路径和验证方式 | 通过 | 本轮无 HTTP API 变更；`shared/contracts/openapi/route-query-api.openapi.yaml` 继续为权威契约，计划要求 lint/bundle 和未漂移检查。 |
| 三语国际化：所有用户可见文字覆盖 `zh-Hant`、`zh-Hans`、`en`，且 `zh-Hant` 与 `en` 已按自然语气审校、未机械直译 | 通过 | 无新增固定文案；动态 Citybus 三语响应和站名按当前语言解析、展示和短名化。 |
| 试用查询与可靠降级：外部服务、缓存、超时和失败状态已设计 | 通过 | research 和本计划覆盖 Citybus/DATA.GOV.HK、1 天成功缓存、失败不缓存、并行部分失败和既有降级。 |
| 现代界面与可视化评审：UI 讨论和展示有图片、截图、设计稿或可视化 mock | 通过 | 本轮非 UI；N/A 原因已记录，现有页面视觉不变。 |
| 电脑与手机双端一致可用：布局、交互和内容展示同时覆盖手机与电脑 | 通过 | 本轮非 UI；响应结构不变，现有双端页面继续可用。 |
| Figma 驱动的前端规格：前端/UI 功能已有 Figma 文件或链接作为后续阶段参考 | 通过 | 本轮非 UI；沿用 004/007 在线查询与首页 UI 设计源。 |
| 服务端 DDD 架构：新增或重构的服务端代码按 DDD 层级、模块边界和依赖方向组织 | 通过 | bounded context 为 `routes`；计划列出 domain/application/infrastructure/interfaces 职责和依赖方向。 |
| 服务端稳健性与可观测性：panic/recover、协程安全和脱敏日志策略已定义 | 通过 | 三模式并行必须 recover；HTTP 入口沿用 Gin recovery；日志字段和脱敏约束已定义。 |
| 中文注释与代码可读性：复杂逻辑、领域规则和边界处理已有中文注释策略 | 通过 | 缓存、短名化、三语解析、并行合并、降级和 token 兼容性列入中文注释策略。 |
| 可验证交付与自动提交：验证命令、浏览器检查和本次 Spec Kit skill 后提交策略已定义 | 通过 | quickstart 定义 Go、race、OpenAPI、契约未漂移和可选 live 复现；plan 完成后提交。 |
| Spec Kit 产物语言：本功能的 spec、plan、tasks 使用简体中文 | 通过 | 本 plan、research、data-model、contracts、quickstart 使用简体中文。 |

## 项目结构

### 文档（本功能）

```text
specs/009-route-query-performance/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── route-query-performance.contract.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### 源码（仓库根目录）

```text
backend/
├── cmd/server/
│   └── main.go                         # wiring：StopClient、showstops2 缓存和 routes 服务依赖
└── internal/routes/
    ├── domain/
    │   └── model.go                    # StopSummary、P2PStop、EtaTokenPayload，移除 ServiceType
    ├── application/
    │   ├── service.go                  # 既有地点/路线短缓存、ETA token 签发、错误映射保持
    │   └── ports.go                    # 公开用例端口不改变前端契约
    ├── infrastructure/
    │   ├── citybus/
    │   │   └── route_client.go         # 三语解析、T/F/W 并行、showstops2 缓存、短名 fallback
    │   ├── datagovhk/
    │   │   └── stop_client.go          # StopClient 三语站名和 1 天缓存装饰
    │   ├── memory/
    │   │   └── cache.go                # 复用进程内 TTLCache
    │   ├── signing/
    │   │   └── token_signer.go         # ETA token 不再写入 ServiceType
    │   └── logging/
    │       └── logger.go               # 脱敏结构化日志保持
    └── interfaces/http/
        └── handler.go                  # JSON envelope 和 HTTP 错误映射保持

shared/
└── contracts/openapi/
    ├── route-query-api.openapi.yaml    # 权威 HTTP 契约，本轮应保持不变
    └── route-query-api.bundle.yaml     # Redocly bundle 验证产物

frontend/
└── N/A，本功能不修改前端代码；必要时复用现有在线查询测试证明契约兼容。
```

**结构决策**：稳定站点资料缓存属于 `routes` 基础设施层，不进入领域层，也不要求前端感知。`StopClient` 保留 DATA.GOV.HK 三语站名能力，并通过缓存装饰器或等价基础设施边界只缓存成功短名；`RouteClient` 继续负责 Citybus 路线摘要和 `showstops2` 站点地图适配，在内部并行执行固定 `T/F/W` 模式并按固定模式顺序合并。应用层仍只看到 `RouteSearcher` 返回的 `RouteOption` 集合，接口适配层和 OpenAPI 不变。

## 复杂度跟踪

| 复杂点 | 为什么必要 | 被拒绝的更简单方案 |
|--------|------------|--------------------|
| 在基础设施层增加两个 1 天成功结果缓存 | Citybus `showstops2` 和 DATA.GOV.HK stop 属稳定资料，重复路线卡会反复引用同一资料；缓存能明显降低等待和上游压力 | 只保留现有 1 分钟路线摘要缓存。它无法覆盖不同查询之间重复 stop id/P2P 资料，也不能改善站名补齐等待。 |
| 固定 `T/F/W` 三模式并行且保留确定性合并 | 三种模式互不依赖，串行等待会放大最慢路径；并行能降低总等待，但必须控制并发和排序稳定 | 直接无界并发或按完成顺序 append。前者会放大上游压力，后者会造成同一输入排序抖动。 |
| 三语 Citybus HTML fixture 作为默认门禁 | live Citybus 响应不稳定，且三语兼容回归需要可重复验证 | 只靠 live 手工测试。它无法作为默认门禁，也无法稳定复现简中/英语解析问题。 |

## 第 0 阶段输出

- [research.md](./research.md)：稳定资料缓存、三模式并行、三语解析、短名化、`ServiceType` 清理、OpenAPI 未漂移和日志/recover 决策。

## 第 1 阶段输出

- [data-model.md](./data-model.md)：站名短名、站名缓存条目、P2P 站点地图缓存、路线搜索模式结果、路线查询结果、ETA token payload 和日志事件。
- [contracts/route-query-performance.contract.md](./contracts/route-query-performance.contract.md)：公开 HTTP 契约不变、内部缓存/并行/短名化/三语解析/`ServiceType` 清理不变量。
- [quickstart.md](./quickstart.md)：实现完成后的 Go、race、OpenAPI、fixture、性能和 live 复现验证步骤。
- [AGENTS.md](../../AGENTS.md)：Spec Kit 当前 plan 指向本文件。

## 第 1 阶段后宪法复查

| 门禁 | 结果 | 证据或后续动作 |
|------|------|----------------|
| 产品定位与范围边界 | 通过 | data-model 和 contract 均限定为官网在线香港巴士查询性能与兼容性优化。 |
| 范围排除 | 通过 | contract 明确不新增完整规划、非巴士查询、前端 UI 或用户定位能力。 |
| 前后端分离与契约优先 | 通过 | 公开 OpenAPI 不变；feature contract 明确后端内部不变量和前端/API 兼容要求。 |
| OpenAPI 驱动的服务端接口文档 | 通过 | quickstart 要求 Redocly lint/bundle 和 OpenAPI 源契约未漂移检查；无新增 API UI。 |
| 三语国际化 | 通过 | data-model 和 quickstart 覆盖 `zh-Hant`、`zh-Hans`、`en` Citybus fixture、站名语言隔离和短名化。 |
| 试用查询与可靠降级 | 通过 | research、contract 和 quickstart 覆盖外部服务失败、部分模式失败、失败不缓存和 ETA 不可用降级。 |
| 现代界面与可视化评审 | 通过 | 本轮非 UI，N/A 原因记录；现有 UI 不变。 |
| 电脑与手机双端一致可用 | 通过 | 本轮非 UI，响应结构不变；可复用现有在线查询双端 E2E。 |
| Figma 驱动的前端规格 | 通过 | 本轮非 UI，沿用既有 004/007 Figma 设计引用。 |
| 服务端 DDD 架构 | 通过 | data-model 和 plan 均记录 `routes` context 层级职责和依赖方向。 |
| 服务端稳健性与可观测性 | 通过 | contract 和 quickstart 要求并行任务 recover、部分失败降级、缓存/外部失败日志和敏感信息脱敏。 |
| 中文注释与代码可读性 | 通过 | quickstart 和 plan 明确复杂解析、缓存、短名化、并行和 token 兼容性需中文注释。 |
| 可验证交付与自动提交 | 通过 | quickstart 给出后端、OpenAPI、fixture、race、live 和未漂移检查；本 plan 阶段完成后提交。 |
| Spec Kit 产物语言 | 通过 | 本阶段产物均使用简体中文，代码标识和第三方原文保持原文。 |
