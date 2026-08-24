# 实施计划：优化首页故事与核心入口

**分支**：`feat/015-refine-homepage-interactions` | **日期**：2026-08-25 | **规格**：[spec.md](./spec.md)

**输入**：来自 `/specs/015-refine-homepage-interactions/spec.md` 的功能规格

## 摘要

在已交付的 014 四段首页与环形五故事视觉基线上实施一次严格增量：首屏采用“首次稳定后 10 秒、自动稳定后 5 秒、手动/语言/恢复后 10 秒”的单计时器轮播；舞台先换位、约 160ms 后文字跟随、约 820ms 稳定；移除独立 Header，把真实 App Logo、品牌名和三语直达入口放入可自然划走的 Hero 首行；繁简中文与英文分别使用获批截图；桌面 Hero 下载进入第三屏，手机直接下载；手机路线交换按钮移到双输入右侧；删除下载日期，并以流式布局覆盖 `1440×960`、`390×844`、`320×844`。

技术路线是“设计先锁定、合同先迁移、测试先失败、状态机再实现”：先在既有 Figma 文件中新建 015 FINAL refinement Section 和 reference evidence；再迁移内容 v4、素材 manifest v3 与长期 UI 合同；用一个 epoch-aware Hero 控制器统一自动/手动/语言/暂停/settled；Stage 只负责视觉与图片稳定信号；最后以单元、E2E、Figma 对照和人工 motion review 验证。后端、OpenAPI、路线业务规则、下载资料来源与最终安装包目标不变；唯一批准的下载交互增量是 FR-023 的 desktop Hero → `#download`、mobile ready → APK 分流。

## 技术背景

**前端语言/版本**：TypeScript 5.7.2、JavaScript ES2023

**后端语言/版本**：Go 1.26.3；本功能不修改后端

**主要依赖**：React 18.3.1、Vite 6.0.5、Lucide React 0.468、qrcode.react 4.2、现有 CSS Modules；不引入通用动效库

**数据与存储**：静态三语内容、受管真实 Logo、五故事 × 中文/英文 × 三尺寸 WebP 及 JSON manifest；继续消费现有下载 metadata 与路线 API，无新增持久化

**测试**：Vitest 2.1.8、Testing Library 16.1、AJV 8.17.1、Playwright 1.49.1、Sharp 0.35.1、Figma reference/actual/overlay/diff 与人工动效复核

**目标平台**：现代桌面与 Android 手机浏览器；公开静态前端继续调用现有 API

**项目类型**：前后端分离 Web 应用；本功能是纯前端、共享内容与素材合同增量

**性能目标**：每个 Hero 实例最多一个 dwell timer 与一个当前转场保护 timer；offscreen/hidden/reduced-motion 不持续轮播；只动画 transform/opacity/轻量 blur；页面只请求当前 locale variant 的响应式资源；不因截图语言切换产生 layout shift

**约束**：严格对齐新版 Figma；三语；真实 App Logo；截图固定 9:16；触控目标至少 44×44；不使用整页 transform scale；不显示下载日期；不向网站或产物写入 Android 工程或一次性源目录；无可见暂停按钮并如实保留 WCAG 2.2.2 风险；除 FR-023 的入口分流外不修改路线或下载业务语义；`zh-Hans` 只做文本、溢出和几何验收，不宣称像素级 Figma 对照

**规模/范围**：公开首页 Hero、手机路线查询布局、第三屏下载呈现、Privacy 顶部和公开页尾品牌；5 个故事、2 套语言截图、30 个响应式输出、3 个主 viewport；排除 monitoring、后端、OpenAPI、Android App 和新产品能力

**i18n 范围**：全部新增或改动可见文字、alt、aria、失败壳与 Privacy 返回入口覆盖 `zh-Hant`、`zh-Hans`、`en`。`zh-Hant` 使用香港交通与产品页自然书面语；`en` 使用克制可信的独立表达；繁简中文共用获批 `zh` 截图但文案独立审校，英文使用 `en` 截图，不做跨语言图片回退

**前后端契约**：feature 合同位于 `specs/015-refine-homepage-interactions/contracts/`；实现时把 homepage content v4 同步到 `shared/contracts/homepage-content.schema.json`，把 015 交互增量同步到 `shared/contracts/ui-state-contract.md`。素材 manifest v3 由 `frontend/src/assets/app-screenshots/real/manifest.json` 实例化。`shared/contracts/route-query-ui-state.md`、下载/路线 OpenAPI 与错误格式保持不变

**OpenAPI 接口文档**：N/A。本功能不新增、修改或移除服务端 HTTP API；现有 `shared/contracts/openapi/*.openapi.yaml` 只做 lint/bundle 和无差异回归

**服务端 DDD 边界**：N/A。本功能不修改 `downloads`、`routes`、`analytics` bounded context 或任何服务端层级

**服务端稳健性与可观测性**：N/A。本功能不修改服务端 recovery、goroutine、日志或降级；前端继续消费现有受控错误状态

**代码注释与可读性**：为 Hero epoch/settled 协议、单 dwell timer、多暂停原因合并、键盘输入模态、归一化可见度、截图 locale 映射、原子素材替换及桌面/手机下载语义添加聚焦简体中文注释；普通 JSX 与自解释 CSS 不添加噪音注释

**UI 可视化产物**：[figma.md](./figma.md)、[2026-08-25 refinement 设计合同](../../docs/superpowers/specs/2026-08-25-homepage-visual-system-refinement-design.md)，以及实施阶段生成的 `specs/015-refine-homepage-interactions/visual-review/`

**Figma 设计引用**：[BusIsComing Website — Homepage v1 Spec](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec)；014 只读基线 `119:64`、桌面 `119:176`、手机 `119:461`；015 独立 Section `136:292` 已通过 Figma Desktop 创建并人工选择核对。`zh-Hant`/`en` reference export 未完整登记前，生产 UI 门禁仍关闭；`zh-Hans` 不设置像素级 reference 门禁

**双端适配范围**：桌面批准基准 `1440×960`，手机批准基准 `390×844`，窄屏保护 `320×844`。桌面 CTA 页面内跳到第三屏并显示二维码；手机 Hero ready 时直接下载且无二维码；手机路线为双输入左列 + 交换按钮右列；三端使用浏览器截图、几何断言和人工对照验证

## 宪法检查

*门禁：第 0 阶段研究前已检查；第 1 阶段设计后按本表复查，除已批准并如实登记的无显式暂停限制外均通过。*

| 门禁 | 结果 | 证据或后续动作 |
|------|------|----------------|
| 产品定位与范围边界：覆盖软件介绍、试用查询、下载 App，反馈和联系为次要功能 | 通过 | 保留 014 四段结构和五故事；只优化首屏认知、路线空间和下载决策 |
| 范围排除：不提供完整出行路线规划，也不提供地铁等其他交通工具查询 | 通过 | `spec.md` FR-034、合同 §12；不新增路线或运营商能力 |
| 前后端分离与契约优先：边界、契约和错误格式已记录 | 通过 | 本 feature 三份合同；实现同步 homepage content/UI state，route/download 业务合同不变 |
| OpenAPI 驱动的服务端接口文档 | 通过（N/A） | 无 HTTP API 变化；仅运行现有 lint/bundle 与无差异检查 |
| 三语国际化 | 通过 | 内容 v4、locale→variant 固定映射、三语 alt/aria/失败壳与独立审校 |
| 试用查询与可靠降级 | 通过 | 现有 request sequence、retained/error/ETA 规则不变；只改手机输入组布局 |
| 现代界面与可视化评审 | 通过 | 已批准 014 Figma 与 2026-08-25 视觉增量；实施前新增 015 FINAL Section 和 reference |
| 电脑与手机双端一致可用 | 通过 | 1440×960、390×844、320×844 与桌面/手机差异合同明确 |
| Figma 驱动的前端规格 | 条件通过 | Figma 文件、014 基线与 015 Section `136:292` 可定位；`zh-Hant`/`en` reference export 仍是生产代码前置门禁，`zh-Hans` 按文本/溢出/几何合同验收 |
| 服务端 DDD 架构 | 通过（N/A） | 无服务端代码 |
| 服务端稳健性与可观测性 | 通过（N/A） | 无服务端代码 |
| 中文注释与代码可读性 | 通过 | 只对状态机、兼容与原子导入边界添加简体中文意图注释 |
| 可验证交付与自动提交 | 通过 | `quickstart.md` 覆盖合同、unit/build/E2E、Figma、motion、无差异和最终检查；每个 Spec Kit skill 自动提交 |
| Spec Kit 产物语言 | 通过 | spec、plan、research、data-model、quickstart、contracts 与后续 tasks 均使用简体中文 |

### 第 1 阶段后复查结论

- 数据与 UI 状态均可由前端显式模型表达，没有新增服务端或持久化需要。
- 内容 v4 和 screenshot manifest v3 消除了 Header、日期与单语言截图的旧合同冲突。
- Figma 015 Section 与关键节点已在 Figma Desktop 生成并人工选择核对；由于 `zh-Hant`/`en` reference export/manifest 尚未完整登记，生产 UI 门禁仍关闭。`zh-Hans` 不要求像素级 reference。
- 用户明确要求不显示暂停按钮；这项可访问性风险进入复杂度跟踪和完成报告，不会被误写为完整合规。

## 项目结构

### 文档（本功能）

```text
specs/015-refine-homepage-interactions/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── figma.md
├── contracts/
│   ├── homepage-content-v4.schema.json
│   ├── homepage-interaction-refinement.contract.md
│   └── screenshot-assets-v131-localized.manifest.schema.json
├── visual-review/                 # 实施阶段生成，不预造空证据
└── tasks.md                       # 由 /speckit-tasks 生成
```

### 源码（仓库根目录）

```text
frontend/
├── scripts/
│   ├── prepare-homepage-story-assets.mjs
│   └── compare-homepage-visuals.mjs
├── src/
│   ├── app/App.tsx
│   ├── assets/
│   │   ├── brand/busiscoming-icon.webp
│   │   └── app-screenshots/real/
│   ├── components/
│   │   ├── brand/                 # 真实 Logo 品牌首行/Privacy/Footer
│   │   ├── hero/                  # 舞台、轨道、文案与 settled 协议
│   │   ├── i18n/                  # 三语直达入口，复用 I18nProvider
│   │   ├── online-demo/           # 只调整手机输入组几何
│   │   ├── privacy/
│   │   └── sections/              # 下载与页尾；旧 Header 退役
│   ├── content/
│   │   ├── homepageContent.ts
│   │   ├── storyAssets.ts
│   │   ├── types.ts
│   │   └── uiCopy.ts
│   ├── hooks/
│   │   ├── useHeroStoryController.ts
│   │   └── useReducedMotion.ts
│   └── tests/
├── playwright/
└── playwright.config.ts

shared/contracts/
├── homepage-content.schema.json
├── ui-state-contract.md
├── route-query-ui-state.md        # 不变
└── openapi/                       # 不变

docs/
├── asset-provenance.md
└── superpowers/prototypes/
    └── 2026-08-25-homepage-refinement-figma-import/

backend/                            # 本功能无改动
```

**结构决策**：保留现有前后端分离结构。新增 Hero 控制 hook 只管理时间、epoch、暂停和播报；Stage 管视觉与图片 settled；Rail 管输入与 roving focus；内容/素材集中在 content 和 manifest，不散落组件。真实品牌使用聚焦组件替代首页/Privacy 的共享 Header。素材准备脚本在仓库内运行但只产出前端受管资源。无服务端 DDD 目录变化。

## 第 0 阶段：研究结论

[research.md](./research.md) 已解决全部技术不确定项：增量合同、单轮播控制器、settled 协议、多暂停原因、辅助技术、Header 退役、内容 v4、素材 manifest v3、真实 Logo、双端下载、手机路线布局、流式响应式、Figma refinement、测试分层和无显式暂停限制。没有遗留待确认事项。

## 第 1 阶段：设计与合同

### 1. Figma 与视觉证据

- 014 Section 只读；新建 015 独立本地插件与 FINAL Section。
- 插件覆盖 1440/390/320、zh/en Story 01、start/160ms/settled、手机路线三态、下载分流、无日期和 Privacy。
- reference 节点与 export 真实可定位后才能改生产 UI；实际节点写入 `figma.md`、内容实例和 evidence manifest。

### 2. 内容与素材合同

- `homepage-content-v4.schema.json` 用 `siteChrome` 取代旧 Header `navigation`，删除 download `updated`，保留 014 baseline 并要求真实 015 refinement 节点。
- localized screenshot manifest v3 固定 5×2×3=30 个输出与 locale mapping；源目录只通过两个环境变量传入并原子导入。
- 实现时同步长期 `shared/contracts/homepage-content.schema.json` 和 `shared/contracts/ui-state-contract.md`，不改 OpenAPI。

### 3. Hero 状态与转场

- `requestedStoryId` 是唯一可见业务真相；`settledStoryId` 只服务计时/验证。
- epoch 同时约束 transform、decode/failure shell、fallback 和播报；旧 epoch 全部丢弃。
- 舞台 start，文案约 160ms 跟随，主 transform/目标图稳定后 settled；保护 timer 约 820ms 只补丢失事件。
- initial/manual/locale/resume 使用 10 秒；automatic 使用 5 秒；转场时间不计入 dwell。

### 4. 页面与响应式

- App 不再统一渲染 Header；首页 Hero 内首行与 Privacy 轻量首行分别实现，Footer 统一真实 Logo。
- desktop Hero CTA 永远是 `#download`；mobile 只有 metadata ready 暴露 APK href/download。
- 手机路线只改 DOM 包装和 CSS；业务 hook、请求序列和结果状态不改。
- 移除 Header 高度补偿和固定 1440 坐标依赖，使用 token、clamp、grid/flex、max-width 连续排布。

### 5. 验证设计

- 单元层用 fake timers 和 observer mock 证明时间/epoch/暂停/播报；E2E 证明浏览器 focus/hover/CTA/locale/route geometry。
- 视觉截图通过 test pause + fonts/image/latest settled 协议稳定，不用任意 sleep。
- settled 静态 golden 与 start/160ms/settled 人工 motion review 分开；零容忍几何/语义不被 0.3% 全图阈值豁免。

## 实施顺序

1. **Figma 门禁**：创建 015 插件、FINAL Section、真实节点、reference export/manifest，并更新 `figma.md`。
2. **合同红测**：先迁移 feature→shared 内容/UI 合同和测试，让旧 Header、日期、单语言图、manual-only 预期明确失败。
3. **素材原子导入**：导入两套 1080×1920 批准源，生成 30 个 WebP/manifest v3，更新来源文档并验证 Logo 指纹。
4. **Hero 控制器 TDD**：实现单 timer、epoch、settled、pause reasons、10/5 秒、播报和清理。
5. **舞台/文案/轨道**：实现 820ms/160ms、目标 locale 图、失败壳、reduced motion 和高保真流式几何。
6. **页面 Chrome**：移除公开 Header，加入真实品牌/直接语言入口、Privacy 返回和 Footer 品牌统一。
7. **下载与路线**：实现同 breakpoint 的双端 CTA、删除日期、手机输入组右侧 swap，不改业务模型。
8. **浏览器与视觉验收**：unit/build/E2E、三 viewport/三语/reduced-motion；`zh-Hant`/`en` 做 Figma reference 对照，`zh-Hans` 做文本、溢出与几何验收；另做人工 motion review。
9. **边界回归**：OpenAPI lint/bundle、backend/openapi 无差异、私有路径扫描、冲突与 final status；只提交 015 范围。

## 复杂度跟踪

| 违规或复杂点 | 为什么必要 | 被拒绝的更简单方案 |
|--------------|------------|--------------------|
| 不显示可见暂停/播放控件，触屏用户缺少显式永久停止 autoplay 的操作 | 用户在多轮方案中明确选择无暂停按钮；仍提供 hover、键盘 focus、offscreen、hidden、reduced-motion 保护，并在验收中如实记录 WCAG 2.2.2 风险 | 可见暂停按钮、浮动控件或故事轨内暂停均因占用首屏、破坏已批准克制构图而被用户拒绝 |
| 为 015 新建独立 Figma Section 和导入插件，而不是直接修改 014 | 必须保留历史验收基线并避免旧 Header/日期/单语言截图再次进入设计；新节点是生产实现的视觉权威 | 重跑或覆盖 014 插件会改写历史；先写浏览器再回填 Figma 会反转设计权威，均拒绝 |

除上述已批准复杂度外，不新增状态库、动效库、服务端、缓存、API 或持久化层。
