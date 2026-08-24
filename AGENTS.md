<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at specs/015-refine-homepage-interactions/plan.md
<!-- SPECKIT END -->

# AGENTS.md

## 文件用途

本文件是 BusIsComing Website 的仓库级 agent 操作规则。产品介绍和开发入口见 `README.md`；长期架构、算法、运维和设计原则见 `docs/`；精确接口见 OpenAPI；feature 的需求、Figma 和验收状态见 `specs/`。不要把这些内容整份复制到本文件。

## 进入仓库后先做什么

1. 运行 `git status --short --branch`，保护用户或其他任务已有改动。
2. 阅读 `.specify/memory/constitution.md`，它是本仓库最高项目约束。
3. 阅读与任务相关的主题文档、当前代码、测试、共享契约和 feature spec；涉及当前开发上下文时再阅读顶部托管块指向的 plan。
4. 涉及产品能力或 App 文案时，核对 `/Users/hezhenyu/AndroidStudioProjects/BusIsComming` 的当前源码和文档，不沿用历史绝对路径或旧 APK 快照。
5. 发现代码、OpenAPI、spec、Figma 与长期文档冲突时，先定位权威来源和漂移原因，不静默选择一方。

## 事实权威顺序

| 内容 | 权威来源 |
| --- | --- |
| 仓库治理与门禁 | `.specify/memory/constitution.md` |
| 网站当前运行行为 | 当前源码、配置、资源与测试 |
| HTTP endpoint、schema、错误和缓存 | `shared/contracts/openapi/*.openapi.yaml` |
| 精确页面和交互状态 | 对应 feature spec、Figma 引用与验证证据 |
| Android App 当前能力 | Android 主项目当前源码与长期文档 |
| 当前 APK 版本、大小和校验和 | `backend/downloads/android/current.json` 与实际 APK |
| 长期架构和维护方法 | 根目录 `docs/` 下对应主题文档 |

历史 spec、research、tasks 和截图可以解释决策来源，但不能单独证明当前 runtime 仍如此。

## 项目边界

- 前端、后端与共享契约必须保持分离：前端不依赖后端内部实现，后端不要求前端硬编码未公开规则。
- 后端当前 bounded context 为 `downloads`、`routes`、`analytics`；`internal/platform` 提供共享 HTTP 基础设施。
- 公开服务只承载公开健康检查、APK 和路线查询；analytics 查询 API 与 Dashboard 只能注册在 loopback 私有 listener。
- OpenAPI 源 YAML 是接口权威来源；bundle 和 HTML 只作生成产物，不能手工成为第二来源。

## 修改规则

### 前端

- 用户可见文字必须同时提供 `zh-Hant`、`zh-Hans`、`en`，不能散落硬编码在组件中。
- `zh-Hant` 使用香港交通和产品页面习惯；`en` 使用自然克制的产品表达；三语必须独立审校，不能机械直译。
- 页面、组件和交互必须同时考虑电脑与手机，保持键盘焦点、触控目标、减弱动效和状态可理解性。
- 涉及 UI 的 spec 必须先有 Figma UI/交互设计，并记录文件、关键节点、viewport、状态和版本。
- 公开前端位于 `frontend/src/`；私有监控前端位于 `frontend/src/monitoring/`，两者可共享品牌原则，但不要混用未经定义的 token 或信息架构。

### 后端

- 新增或重构代码保持 `interfaces/infrastructure -> application -> domain` 依赖方向；领域层不得依赖 Gin、SQLite、文件系统或前端类型。
- 不以 `panic` 作为业务控制流。HTTP engine 必须保留 request logging 和 recovery；自建 goroutine、回调或后台任务必须受 recover 保护并记录脱敏上下文。
- 外部 Citybus、DATA.GOV.HK、文件系统和 SQLite 失败必须通过受控错误、局部降级或 fail-open 边界表达，不能编造数据。
- 日志不得输出密钥、token、完整 Cookie、完整第三方 URL/响应、用户输入、坐标或不受控大段内容。
- 复杂领域规则、错误映射、外部约束、状态转换、缓存和降级策略使用简体中文注释；不要给显而易见代码添加噪音注释。

### 契约

- 修改服务端 HTTP API 时，先更新 feature contracts，再同步 `shared/contracts/openapi/` 长期入口及必要兼容镜像。
- OpenAPI 使用 3.1 YAML；项目可控的标题、摘要、参数、响应、错误和示例说明使用简体中文。
- 修改共享 JSON Schema、UI state contract 或 OpenAPI 后，必须运行对应 lint、bundle、生成或契约测试。

### 文档与素材

- 文档职责和更新触发条件以 `docs/documentation-governance.md` 为准。
- 根 `README.md` 只保留项目入口；agent 操作只放本文件；算法、运维和长期原则放主题文档。
- 不在 `backend/`、`frontend/` 新建说明性 README；代码旁必须保留的机器事实优先使用 schema、manifest、测试或聚焦中文注释。
- 当前版本、校验和、端口等易变值优先引用代码或 manifest，不在多个文档复制。
- `docs/superpowers/` 是历史工作记录，除非用户明确要求，否则不纳入常规文档翻新。
- 品牌图与真实截图遵守 `docs/asset-provenance.md`；前端只能引用获批、已脱敏、manifest 可追踪的素材。

## Spec Kit 工作流

- Spec Kit 各阶段人类可读产物使用简体中文；代码标识符、API 名称和第三方原文保持原文。
- `/speckit-specify` 涉及 UI 时必须沉淀 Figma；涉及 HTTP API 时必须说明 OpenAPI 更新和验证。
- `/speckit-plan` 和 `/speckit-tasks` 必须明确前端、后端、共享契约、DDD、三语、双端、降级、日志、OpenAPI 和验证边界。
- 每次 Spec Kit skill 完成产物更新并通过必要验证后自动提交；提交范围、信息或无关工作区改动不清晰时先询问用户。

## 验证入口

| 变更范围 | 最低验证 |
| --- | --- |
| 前端逻辑或文案 | `npm --prefix frontend run test`、`npm --prefix frontend run build` |
| 公开 UI/交互 | 上述命令，加 `npm --prefix frontend run test:e2e` 与桌面/手机证据 |
| 私有监控 UI | 上述构建，加 `npm --prefix frontend run test:e2e:monitor` |
| 后端 | `(cd backend && go test ./...)` |
| 路线并发或 cache | 后端测试，加相关 `go test -race` |
| OpenAPI | `npm --prefix frontend run openapi:lint` 与 `openapi:bundle`；需要预览时再运行 `openapi:docs` |
| 部署脚本 | `scripts/tests/deploy_test.sh` |
| 纯文档 | 链接/路径检查、`git diff --check`，并按文档内命令做与风险匹配的事实验证 |

完成前必须检查 `git diff --check`、冲突标记、最终 `git status`，并如实区分自动化、手动浏览器、真实网络和生产验证是否执行。

## Git 与安全边界

- 不覆盖、回滚或顺手提交用户已有改动；提交时只包含明确属于当前任务的文件。
- 不提交 API key、token、visitor secret、服务端环境文件、真实私有路径、完整 Cookie 或未经脱敏的第三方响应。
- Android UI/仪器验证只能使用本任务新启动或明确归本任务所有的 emulator；不得接管已打开 AVD，验证后关闭任务启动的设备。
