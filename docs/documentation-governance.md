# 文档治理

本文定义 BusIsComing Website 各类记录的职责、事实权威和更新触发条件，避免同一结论在 `README.md`、`AGENTS.md`、主题文档、OpenAPI 与 feature spec 中反复复制后逐渐漂移。

## 基本原则

1. 先确认事实属于产品、runtime、HTTP 契约、精确交互、长期原则还是历史决策，再选择文件。
2. 易变事实尽量引用唯一的代码或 manifest，不在多个 Markdown 文件复制数值。
3. 长期文档解释“为什么这样组织”和“修改时必须保护什么”，精确 schema、页面状态和单次实施证据留在各自权威载体。
4. 发现冲突时先核对当前代码、测试和权威契约，不通过修改说明文字掩盖实现问题。
5. 历史 feature 产物保持历史语义；除非仍被当前入口引用，不为了统一措辞进行机械重写。

## 文件职责

| 载体 | 负责 | 不负责 |
| --- | --- | --- |
| 根 `README.md` | 产品定位、当前能力摘要、快速开始、常用验证、目录与文档导航 | 完整 API、全部环境变量、缓存算法、agent 流程 |
| 根 `AGENTS.md` | agent 操作顺序、权威来源、修改边界、验证和 Git/安全规则 | 面向读者的完整产品介绍、逐 feature 历史 |
| `.specify/memory/constitution.md` | 最高项目原则、质量门禁和治理规则 | 当前组件清单、具体命令的唯一副本 |
| `docs/*.md` | 稳定架构、核心技术链、设计/本地化原则、开发和运维方法 | endpoint schema、单次任务清单、实现截图全集 |
| `shared/contracts/openapi/*.openapi.yaml` | HTTP 路径、参数、响应、错误、缓存、认证和降级契约 | 领域实现教程或前端页面布局 |
| `shared/contracts/*.json`、`*.md` | 跨模块数据结构和 UI 状态契约 | 功能宣传或运维手册 |
| `specs/<feature>/` | 用户故事、精确行为、Figma 节点、研究、任务和验证证据 | 全项目长期架构的第二份副本 |
| 当前源码、配置与测试 | 已实现 runtime 行为 | 面向维护者的设计缘由说明 |
| `backend/downloads/android/current.json` | 当前 APK 的版本、大小、日期、状态和 SHA-256 | 长期下载流程说明 |
| Android 主项目 | App 当前产品能力、Android 行为与素材事实 | 网站自身 API、部署或匿名统计实现 |

## 主题所有权

| 主题 | 长期入口 | 辅助证据 |
| --- | --- | --- |
| 系统拓扑、DDD、listener、数据边界 | `docs/architecture.md` | Go composition root、架构测试 |
| 本地启动、环境变量、测试和生成命令 | `docs/development.md` | `package.json`、Go 配置、脚本 `--help` |
| 页面视觉、响应式和无障碍 | `docs/ui-style-guide.md` | CSS token、Figma、Playwright 截图 |
| 三语、术语和语言回退 | `docs/localization-guidelines.md` | content resources、i18n 测试 |
| Citybus 路线与首程 ETA | `docs/route-query-and-eta.md` | OpenAPI、routes context、fixture 测试 |
| Android APK 交付 | `docs/android-apk-delivery.md` | download OpenAPI、`current.json`、更新脚本 |
| 匿名统计、隐私和私有 Dashboard | `docs/analytics-and-privacy.md` | analytics OpenAPI、SQLite migration、隐私页 |
| 品牌图和 App 截图 | `docs/asset-provenance.md` | screenshot manifest、素材契约测试 |
| 生产发布和故障操作 | `docs/deployment.md` | deploy scripts 与脚本测试 |
| 搜索提交与索引检查 | `docs/seo-first-indexing.md` | `robots.txt`、`sitemap.xml`、locale HTML |

## 权威判断顺序

遇到内容冲突时按以下顺序处理：

1. `.specify/memory/constitution.md` 决定项目门禁，但不证明代码已经符合。
2. 当前源码、资源、配置和测试证明网站现在怎样运行。
3. OpenAPI 与共享 schema 定义跨边界应怎样协作；实现与其冲突时必须明确修复哪一侧。
4. active feature spec 与已记录 Figma 定义精确可观察行为和设计目标。
5. `docs/` 解释稳定原理和维护方式；若与前三项冲突，需要在同一变更中修订。
6. archived/historical spec、research 和截图只用于理解决策来源。

Android App 产品事实需在 Android 主项目中按同样方式核对当前源码、长期文档与生效 spec。网站不能因为旧 feature 文档曾写过某项能力，就把它当作 App 当前事实。

## 哪些信息只保留一个来源

- APK `versionCode`、文件大小、日期和 SHA-256：只在 `current.json` 和实际文件中维护。
- API path、字段、状态码和错误 code：只在 OpenAPI 源 YAML 中维护。
- 前端内容数据结构：只在共享 schema、TypeScript 类型和契约测试中维护。
- CSS 精确颜色、字号、间距和 breakpoint：以 token/CSS 为准；UI 指南只解释语义和使用规则。
- Figma node ID 和 feature 版本：留在对应 feature 的 `figma.md`，长期 UI 指南只提供索引。
- 生产 secret、环境文件和服务器私有路径：只存在受控运行环境，不写入仓库文档示例中的真实值。

## 更新触发条件

### 修改公开页面或内容

检查：

- 三语 content 资源与自然语气审校；
- SEO metadata、locale HTML、sitemap 的实际影响；
- 对应 shared schema、内容契约测试和 Figma；
- `README.md` 的“当前能力”是否发生实质变化；
- `docs/ui-style-guide.md` 或 `docs/localization-guidelines.md` 的长期原则是否改变。

### 修改服务端 HTTP API

检查：

- feature OpenAPI 与 `shared/contracts/openapi/`；
- handler、错误映射和契约测试；
- 前端 client 与 UI state contract；
- `docs/architecture.md` 或对应领域主题文档；
- Redocly lint、bundle 和需要时的本地 HTML 预览。

不要恢复手写 `docs/api/*.md` 或提交生成 HTML 来代替 OpenAPI。

### 修改 Citybus、站点或 ETA

检查：

- `docs/route-query-and-eta.md`；
- 外部参数、语言映射、token、cache key、超时、并发和降级；
- fixture 来源语义与 parser 回归；
- 真实三语服务验证是否执行，未执行时明确说明。

### 修改 APK 或下载行为

仅替换当前 APK 时更新 APK 与 `current.json`，不把新版本值抄进 Markdown。改变 metadata、校验、入口状态、统计或部署边界时，更新 `docs/android-apk-delivery.md` 和相关 OpenAPI。

### 修改统计或私有监控

检查事件白名单、禁止字段、cookie、SQLite migration、fail-open、私有 listener、Caddy/UFW 隔离、用户可见隐私政策和 `docs/analytics-and-privacy.md`。

### 修改部署脚本

运行脚本测试，并更新 `docs/deployment.md` 中受影响的参数、远端布局、权限、健康检查、回滚和故障处理。脚本 `--help` 是命令参数的直接证据。

## 文档位置规则

- 说明性 Markdown 集中放在根目录、`docs/` 或 `specs/`；不在 `backend/`、`frontend/` 新建 README。
- 小型代码事实如果必须与实现同处，优先使用清晰类型、schema、manifest、测试或聚焦中文注释。
- 第三方 fixture 的来源和不可改写规则进入对应领域文档；fixture 文件本身保留最小必要原文。
- `docs/superpowers/` 属于历史工作记录，常规文档同步不修改。
- 生成目录、测试报告和本地 API HTML 不进入文档导航，也不作为权威来源。

## 文档变更验证

每次文档更新至少检查：

1. Markdown 相对链接和引用路径存在。
2. 文档中的命令与当前 `package.json`、Go module 和脚本帮助一致。
3. 没有复制已经由 OpenAPI、manifest 或代码维护的易变值。
4. 没有把计划、mock、fixture 或未执行验证写成当前生产事实。
5. 没有恢复被治理规则明确淘汰的分散 README 或手写 API 页面。
6. `git diff --check` 通过，且用户原有工作区改动得到保留。

文档涉及运行行为时，应按风险运行对应测试或构建；无法执行真实网络、浏览器或生产验证时，必须在交付说明中明确保留风险。
