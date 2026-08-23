# 实施计划：升级首页视觉系统与产品叙事

**分支**：`feat/014-upgrade-homepage-visual-system` | **日期**：2026-08-23 | **规格**：[spec.md](./spec.md)

**输入**：来自 `/specs/014-upgrade-homepage-visual-system/spec.md` 的功能规格

## 摘要

本功能以 Figma 最终 Section `119:64` 为唯一获批视觉主入口，把当前首页的“四场景自动轮播 +
功能网格 + 深色页尾”重构为四段连续但职责清楚的页面：`HeroStory → RouteTrial →
DownloadDecision → SupportEnding`。

实施保持纯前端范围：复用既有路线试查状态机、下载元数据 Provider、三语路由和公开服务契约，
不修改 Go 后端、OpenAPI、路线算法或 APK 交付规则。首屏使用五个受控故事和环形截图舞台，页面
前三段共享浅绿/白色风带，下载段通过克制的风带汇聚承接路线试查，页面末端用无卡片 FAQ、
联系横条和浅色页尾收束。内容、截图 manifest、UI 状态契约和旧测试同步迁移到五故事模型。

高保真不是实现后的人工偏好判断，而是门禁：实现前从 Figma 固定节点提取几何、排版、色彩和状态；
实现中按语义 token 与独立手机布局复现；实现后在 `1440×960`、`390×844`、`320px`、三语和
减少动效下执行结构、状态、可访问性和视觉对照。任何 FR-030 列出的漂移均阻断验收。

## 技术背景

**前端语言/版本**：TypeScript 5.7.2、JavaScript ES2023

**后端语言/版本**：Go 1.26.3（本功能不修改后端）

**主要依赖**：React 18.3.1、Vite 6.0.5、lucide-react 0.468；新增 `qrcode.react` 的 SVG
渲染器，仅用于桌面可用态二维码；首屏和背景动效使用 CSS transform/opacity，不引入通用动效库

**数据与存储**：三语静态首页内容、五张受管 v1.3.1 截图、既有路线与下载 HTTP 响应；不新增
数据库、浏览器业务缓存或持久化。语言切换继续使用现有 history/state 路径切换，不重新挂载首页状态

**测试**：Vitest 2.1.8、Testing Library 16.1、AJV 8.17.1、Playwright 1.49.1、Sharp 0.35.1；
Figma 对照、浏览器截图差异和人工动效检查作为公开 UI 补充证据

**目标平台**：桌面 Chromium 与现代 Android 浏览器；三语静态主页 + 同源公开后端；桌面基准
`1440×960`，手机基准 `390×844`，窄屏补充 `320px`

**项目类型**：前后端分离 Web 应用

**性能目标**：首屏不使用持续 JavaScript timer 或滚动监听驱动动画；风带和截图转场只改变
`transform`、`opacity`、必要的 `filter`；五张获批源图只导入一次，并生成 manifest 可追踪的响应式
衍生物，避免把 1080px 原图无差别发送给所有设备；所有图片预留稳定比例，首屏和状态切换不产生
可见布局位移；新增二维码依赖在构建后记录 gzip 增量并保持为单一专用依赖

**约束**：严格复现 Figma；三语 i18n；`zh-Hant` 香港实用书面语、`en` 自然克制产品表达；
手机不是桌面缩放；主要触控目标至少 `44×44 CSS px`；支持键盘、读屏和
`prefers-reduced-motion`；不使用紫色、深色潮汐、灵动岛、说明卡、证据标签、功能网格或新营销屏

**规模/范围**：1 个公开首页、4 个页面段、5 个故事、5 张截图、9 类路线试查状态、3 类下载状态、
4 项 FAQ、3 种语言、3 个宽度基线；Privacy 页面和私有 monitoring UI 只做不回归检查

**i18n 范围**：覆盖 Header、五故事、图片替代文本、路线试查全状态、下载三态、安装说明、FAQ、
联系、页尾、焦点/读屏状态。`zh-Hant` 按香港巴士用户习惯独立审校，`zh-Hans` 使用自然简体，
`en` 重新组织为简短可信的产品表达；不得以繁简机械转换或逐句直译代替审校。语言切换必须保留
故事、滚动、路线输入与结果、下载状态和 FAQ 展开项

**前后端契约**：

- 首页内容：`shared/contracts/homepage-content.schema.json`，实现时升级到 v3 五故事结构
- 首页 UI 状态：`shared/contracts/ui-state-contract.md`，移除旧四项自动轮播/牌堆/大图合同
- 路线 UI 状态：`shared/contracts/route-query-ui-state.md`，只调整结果卡展示合同
- 路线 API：`shared/contracts/openapi/route-query-api.openapi.yaml`，结构和错误格式不变
- 下载 API：`shared/contracts/openapi/download-api.openapi.yaml`，结构和错误格式不变
- 本 feature 设计合同：[contracts/homepage-visual-system.contract.md](./contracts/homepage-visual-system.contract.md)
- 本 feature 内容模型：[contracts/homepage-content-v3.schema.json](./contracts/homepage-content-v3.schema.json)
- 本 feature 素材模型：[contracts/screenshot-assets-v131.manifest.schema.json](./contracts/screenshot-assets-v131.manifest.schema.json)

**OpenAPI 接口文档**：N/A。本功能不新增、修改或移除服务端 HTTP API；实现阶段不手工改 OpenAPI
源、bundle 或 HTML。路线与下载 E2E 只证明兼容消费；如实现发现需要新字段或错误格式，立即停止并
拆分新 feature。最低 Android 版本不扩展下载 API，而是由当前 Android `minSdk 25` 核对后作为
网站三语产品内容固定

**服务端 DDD 边界**：N/A；`downloads`、`routes`、`analytics` 与 `internal/platform` 均不修改

**服务端稳健性与可观测性**：N/A；既有 recovery、超时、缓存、错误映射与日志脱敏保持不变。
前端继续把受控错误映射为本地化 UI，不显示第三方原始错误或内部上下文

**代码注释与可读性**：对环形舞台的五槽位归一化、连续快速切换的最终状态、减少动效分支、
语言切换状态保留、下载二维码与主链接同源约束添加聚焦的简体中文注释；显然的样式值和普通组件
组合不加噪音注释

**UI 可视化产物**：

- [Figma 记录与状态索引](./figma.md)
- [完整视觉设计合同](../../docs/superpowers/specs/2026-08-21-homepage-visual-system-v131-design.md)
- [Figma 本地导入源](../../docs/superpowers/prototypes/2026-08-21-homepage-visual-system-figma-import/)
- 生产实现不得把这些整页预览扁平化为背景图；五张真实 App 截图继续作为独立受管素材

**Figma 设计引用**：
[BusIsComing Website — Homepage v1 Spec](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec)；
最终 Section [`119:64`](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=119-64)，
桌面首屏 [`119:176`](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=119-176)，
手机首屏 [`119:461`](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=119-461)。
实现开始时必须记录读取日期和关键 Frame 导出；Figma 无法读取时只能暂停视觉实现，不能用旧稿或
聊天截图推断替代

**双端适配范围**：桌面 `1440×960` 使用左文案/右舞台并在左下放故事轨；手机 `390×844`
使用 Header 同行完整导航、上方文案/CTA、居中完整截图舞台、截图下方故事轨；`320px` 通过更紧凑
字号与间距保留全部入口。三端均检查无水平滚动、截图不裁边、标题换行符合对应 Figma Frame，
并用三语最长文案复核

## 宪法检查

*门禁：第 0 阶段研究前已检查；第 1 阶段设计后复查见本表与后文。*

| 门禁 | 结果 | 证据或后续动作 |
|------|------|----------------|
| 产品定位与范围边界：覆盖软件介绍、试用查询、下载 App，反馈和联系为次要功能 | 通过 | 四段结构把 Hero、路线试查和下载作为主线，FAQ/联系只作收尾；`spec.md` US1-US4。 |
| 范围排除：不提供完整出行路线规划，也不提供地铁等其他交通工具查询 | 通过 | 只复用现有香港巴士路线契约；不扩 App、后端、运营商路线范围或非巴士交通。 |
| 前后端分离与契约优先：边界、契约和错误格式已记录 | 通过 | 三个 feature 合同与三个 shared UI/content 合同列明；现有 HTTP 契约不变。 |
| OpenAPI 驱动的服务端接口文档 | 通过（N/A） | 无服务端 HTTP 改动；路线/下载 OpenAPI 只作兼容性回归。 |
| 三语国际化 | 通过 | 内容 schema 强制三语；计划包含语气、事实边界与三语 E2E/人工审校矩阵。 |
| 试用查询与可靠降级 | 通过 | 复用当前 request version、受控错误和保留结果机制；合同覆盖 9 类状态。 |
| 现代界面与可视化评审 | 通过 | Figma 最终 Section、双端关键节点、完整设计合同和导入源均可追溯。 |
| 电脑与手机双端一致可用 | 通过 | 明确 1440×960、390×844、320px 独立布局及视觉门禁。 |
| Figma 驱动的前端规格 | 通过 | `figma.md` 固定 `119:64`、`119:176`、`119:461` 和各状态覆盖。 |
| 服务端 DDD 架构 | 通过（N/A） | 不修改服务端 bounded context 或依赖方向。 |
| 服务端稳健性与可观测性 | 通过（N/A） | 不改服务端；前端只消费既有受控失败。 |
| 中文注释与代码可读性 | 通过 | 只为环形状态、减少动效、状态保留和二维码同目标等复杂边界加简体中文注释。 |
| 可验证交付与自动提交 | 通过 | Vitest、build、Playwright、合同校验、Figma 对照、双端/三语证据和提交检查均已定义。 |
| Spec Kit 产物语言 | 通过 | 本 feature 的 spec、plan、research、data-model、contracts、quickstart、tasks 使用简体中文。 |

## 项目结构

### 文档（本功能）

```text
specs/014-upgrade-homepage-visual-system/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── figma.md
├── contracts/
│   ├── homepage-visual-system.contract.md
│   ├── homepage-content-v3.schema.json
│   └── screenshot-assets-v131.manifest.schema.json
└── checklists/
    └── requirements.md
```

### 源码（仓库根目录）

```text
frontend/
├── src/
│   ├── app/
│   │   ├── App.tsx                         # 四段首页编排，Privacy 分支保持
│   │   └── sections.ts                    # 新锚点与旧深链兼容
│   ├── components/
│   │   ├── hero/
│   │   │   ├── HeroSection.tsx
│   │   │   ├── HeroIntro.tsx
│   │   │   ├── HeroStoryStage.tsx         # 五槽环形状态与可访问语义
│   │   │   ├── HeroStoryStage.module.css
│   │   │   ├── HeroStoryRail.tsx
│   │   │   └── HeroStoryRail.module.css
│   │   ├── online-demo/
│   │   │   └── OnlineQueryDemo.tsx        # 保留查询逻辑，重构第二屏布局/卡片
│   │   ├── download/
│   │   │   ├── DownloadMetadataProvider.tsx
│   │   │   ├── AndroidDownloadAction.tsx
│   │   │   └── DownloadQrCode.tsx          # ready + desktop 才可见
│   │   ├── homepage/
│   │   │   ├── WindField.tsx
│   │   │   └── WindField.module.css
│   │   └── sections/
│   │       ├── Header.tsx
│   │       ├── DownloadSection.tsx
│   │       ├── FaqSection.tsx
│   │       └── FooterContact.tsx
│   ├── content/
│   │   ├── homepageContent.ts
│   │   ├── carouselSlides.ts              # 迁移为五故事数据源，后续可改名
│   │   ├── sectionsContent.ts
│   │   ├── uiCopy.ts
│   │   ├── types.ts
│   │   └── sourceReferences.ts            # 移除运行时绝对 Android 路径
│   ├── assets/app-screenshots/real/
│   │   ├── manifest.json
│   │   └── *.{png,webp}                    # 五张已批准源图的受管 Web 衍生物
│   ├── styles/
│   │   ├── tokens.css
│   │   └── global.css
│   └── tests/
├── playwright/
│   ├── homepage-visual-system.spec.ts
│   ├── homepage-visual-regression.spec.ts
│   ├── online-query-demo.spec.ts
│   └── android-download.spec.ts
├── playwright.config.ts                   # 1440/390/320 与减少动效覆盖
└── package.json

shared/contracts/
├── homepage-content.schema.json
├── ui-state-contract.md
└── route-query-ui-state.md

docs/
├── ui-style-guide.md
├── localization-guidelines.md
└── asset-provenance.md
```

**结构决策**：沿用现有 `hero`、`online-demo`、`download` 和 `sections` 目录，避免另建页面框架；
只把跨前三段复用的装饰背景放入 `components/homepage/`。路线和下载业务状态仍由既有组件/Provider
持有，视觉组件只接收派生数据和回调。五故事数据源取代旧 `FeatureShowcaseId`/FeatureGrid，不保留
双重内容模型。公开首页与 monitoring 的 token/组件不混用，后端目录完全不变。

## 阶段 0：研究结论

完整记录见 [research.md](./research.md)。主要结论：

- 旧页面最主要的漂移不是单一 CSS，而是四故事自动轮播、同故事牌堆/大图、独立 FeatureGrid、
  旧截图 manifest 和测试共同锁定旧信息架构；必须作为一套合同迁移。
- 五故事切换采用 React 单一 `activeStoryId` + 纯函数环形槽位映射；不自动播放，不在过渡期间建立
  第二个内容真相，快速点击时最后一次选择直接决定最终状态。
- 动效使用 CSS 变量、transform/opacity 和两套 motion profile；无需动效库或 JavaScript 帧循环。
- 下载二维码使用 `qrcode.react` 的 `QRCodeSVG`，编码由 metadata `downloadUrl` 相对当前公开
  origin 解析出的绝对 URL；按钮与二维码由同一个派生目标生成。
- Android 7.1 来自当前 `minSdk 25`，属于三语产品内容，不改下载 API；版本、大小和日期继续来自
  当前下载 metadata。
- 现有 I18nProvider 使用 history API 切换路径且不刷新 document，可继续保留组件状态；新增首页
  状态不得以 locale 作为 React key 或切换时重建 Provider。

## 阶段 1：设计

### 状态与数据

[data-model.md](./data-model.md) 定义首页内容、五故事、环形槽位、路线试查、下载决策、FAQ 与视觉
验证记录。关键状态由单一来源驱动：

- `activeStoryId` 同时派生标题、说明、前景截图、故事按钮与读屏状态；
- `slotFor(storyIndex, activeIndex)` 派生 `front/near-left/near-right/far-left/far-right`，不把视觉
  位置写回内容；
- 路线查询继续使用现有 query version 和 `idle/loading/success/empty/error/retained` 状态；
- 下载继续使用一个 Provider 的 `loading/ready/unavailable`；二维码没有独立网络或可用性状态；
- FAQ 使用一个 `activeFaqId`，默认 `android-install`，新展开项原子替换旧项。

### 契约

- [首页视觉与交互合同](./contracts/homepage-visual-system.contract.md)：四段结构、五故事状态、
  风带、下载、FAQ、三语、可访问性和 Figma 对照门禁。
- [首页内容 v3 Schema](./contracts/homepage-content-v3.schema.json)：五个固定故事 ID/顺序、三语完整性、
  四段内容、四项 FAQ、稳定 Figma 节点和禁止本地绝对路径。
- [v1.3.1 截图 manifest Schema](./contracts/screenshot-assets-v131.manifest.schema.json)：五个故事与五张
  独立素材的一一映射、批准状态、尺寸、哈希、替代文本和来源标签。

实现时先让 feature 级 schema/合同测试失败，再迁移 `shared/contracts` 与生产内容；完成后 feature
合同成为设计证据，shared 合同成为长期运行约束，不能并存相互矛盾的旧四故事条款。

### 实现顺序

1. 固定 Figma 导出和三语内容审校记录，新增 feature 合同/schema 校验，先移除旧测试对四场景、
   3 秒自动轮播、无编号和 FeatureGrid 的错误期待。
2. 迁移首页内容类型、五故事数据与截图 manifest；替换 Citybus-only 产品定位和运行时本地路径，
   保持联营 ETA 能力边界。
3. 重构 App 四段结构与 Header；实现 WindField、HeroStoryStage、HeroStoryRail 及减少动效分支，
   删除旧自动播放、同故事牌堆、大图和独立 FeatureGrid 路径。
4. 保留路线请求/候选/ETA 合并逻辑，按 Figma 重构 RouteTrial 工作区与结果卡，删除耗时/步行图标和
   直达/转乘标签。
5. 保留 DownloadMetadataProvider/原生下载语义，实现非卡片 DownloadDecision、桌面真实二维码、
   手机隐藏和风带汇聚；最低 Android 用受审校静态内容，易变值全部读 metadata。
6. 把 FAQ 改为受控单开 accordion，重构联系横条与浅色页尾，维护旧锚点的兼容跳转或显式迁移测试。
7. 同步 shared 内容/UI/路线合同和长期 UI、localization、asset provenance 文档。
8. 执行单元、合同、build、E2E、三语/双端/320/reduced-motion、二维码同目标、截图失败与快速切换测试；
   导出浏览器证据并与 Figma Frame 对照，任何 FR-030 漂移先修复再提交。

## 设计后宪法复查

- 产品主线、范围排除、纯前端边界、三语、双端、Figma 与可靠降级门禁保持通过。
- 新增二维码只消费既有下载 URL，不是新服务接口；因此 OpenAPI、后端 DDD、recovery 和日志规则
  仍为 N/A，且不会把 metadata 成功误报为下载或安装完成。
- feature 合同明确取代旧四故事 UI 条款，避免 spec、Figma、shared schema 与测试存在多个真相。
- 视觉验证把 Figma 读取、精确 viewport、状态矩阵、截图对照和人工动效观察同时列为必要证据；
  自动测试通过不单独等于高保真验收通过。
- 未发现需要宪法例外或尚未解决的 `NEEDS CLARIFICATION`。

## 复杂度跟踪

本功能未引入需要宪法例外的复杂度。新增 QR 渲染器是唯一运行时依赖，并由“真实二维码必须与动态
下载目标一致”的合同约束；手工 QR 编码、静态二维码图片和后端生成均因漂移或越界被拒绝。
