# 实施计划：统一 Android APK 下载入口

**分支**：`feat/013-unify-apk-download` | **日期**：2026-07-30 | **规格**：[spec.md](./spec.md)

**输入**：来自 `/specs/013-unify-apk-download/spec.md` 的功能规格

## 摘要

本功能把主页顶部和页面中下部的 Android APK 入口统一为同一条下载链路：

1. 精确主页继续通过现有 `DownloadMetadataProvider` 每个 `document` 请求一次 APK 元数据。
2. `loading`、`ready`、`unavailable` 三态同时驱动两处入口；只有 `ready` 渲染原生下载链接。
3. 两处可用入口都直接指向元数据中的稳定下载地址，并采用元数据文件名；前端不再读取 APK
   `Blob`、创建 `blob:` URL、合成点击或维护页面内下载进度。
4. 服务端路径、响应结构、完整性校验和匿名统计实现不变；只校正 OpenAPI 与共享 UI 契约中
   “元数据失败仍可下载”和“备用入口 fetch 下载中/失败态”的旧前端语义。
5. 先补齐契约与自动化测试，再实现共享下载动作和两处 UI；最后以 Playwright 桌面/手机、
   可用性失败拦截、完整文件大小/SHA-256 以及真实 Android Chrome 下载做回归。

## 技术背景

**前端语言/版本**：TypeScript 5.7.2、JavaScript ES2023

**后端语言/版本**：Go 1.26.3（本功能不改后端代码）

**主要依赖**：React 18.3.1、Vite 6.0.5、lucide-react 0.468；现有浏览器原生 `<a download>`

**数据与存储**：运行时只读取当前 APK 元数据；不新增前端持久化、数据库表或缓存

**测试**：Vitest 2.1.8、Testing Library 16.1、Playwright 1.49、Go tests、Redocly 2.32

**目标平台**：Android Chrome 等手机浏览器、桌面 Chromium；三语静态主页 + 同源公开后端

**项目类型**：前后端分离 Web 应用

**性能目标**：每个主页 `document` 最多一次元数据请求；非可用状态产生 0 次 APK 请求；点击
可用入口前不把 APK bytes 读入页面内存；状态切换不引发布局跳动

**约束**：三语 i18n、`zh-Hant` 香港产品语气、`en` 自然克制表达、390/1440 双端、主要触控
区域至少 44×44px、无页面内伪下载进度、无陈旧元数据回退、不改变 iPhone 状态

**规模/范围**：1 个共享元数据状态源、2 个主页下载入口、3 个可用性状态、3 种语言、2 个目标
视口；不新增 API，不改下载服务，不实现 Range/断点续传或安装完成追踪

**i18n 范围**：在 `frontend/src/content/uiCopy.ts` 与现有主页内容源中统一检查中、可用、不可用
文案；`zh-Hant` 使用“正在檢查下載”“暫時未能下載”，`en` 使用 “Checking download”、
“temporarily unavailable”等短句，不搬运中文语序

**前后端契约**：

- 权威公开契约：`specs/010-website-analytics/contracts/download-api.openapi.yaml`
- 共享主契约：`shared/contracts/openapi/download-api.openapi.yaml`
- 兼容镜像：`shared/contracts/download-api.openapi.yaml`
- UI 行为契约：`shared/contracts/ui-state-contract.md`
- 本 feature 的前端状态契约：[contracts/download-entry-state-contract.md](./contracts/download-entry-state-contract.md)
- 元数据 `200` 表示检查时可用；`404/500`、网络错误或客户端结构校验失败映射为 `unavailable`
- 下载请求仍独立返回 APK 或既有 JSON 错误；元数据成功不承诺最终下载成功

**OpenAPI 接口文档**：无结构性 API 变更。实现阶段先修改 feature 权威 YAML 的中文说明，
再单向同步到共享主契约和兼容镜像，运行 `npm run openapi:lint`、`npm run openapi:bundle`、
`npm run openapi:docs`；不得手工把 generated bundle 当作第二来源

**服务端 DDD 边界**：N/A；`downloads` bounded context 的 domain/application/
infrastructure/interfaces 代码均不变

**服务端稳健性与可观测性**：N/A；既有 HTTP recovery、请求日志、APK 完整性校验、
`page_view` 与 `download_request` 归因保持不变。前端不可把成功响应误报为安装完成

**代码注释与可读性**：删除 `DownloadSegmentedButton` 的 `fetch → blob → object URL → synthetic
anchor` 状态机；共享三态与原生下载语义通过清晰类型/组件名表达。仅对“元数据是入口门禁但不
保证下载完成”这类外部约束补充简体中文注释

**UI 可视化产物**：

- [desktop-1440.png](./prototype/desktop-1440.png)
- [mobile-390.png](./prototype/mobile-390.png)
- [可编辑 HTML 原稿](./prototype/index.html)

**Figma 设计引用**：[独立 Draft](https://www.figma.com/design/ZYMXnKWg4BNybwbuN6TeiZ)；
既有主页下载状态基线为
[Homepage v1 Spec / Download Button Interaction States](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=4-326)。
本次目标版本 `v1.4`，详见 [figma.md](./figma.md)。连接账号当前只有 View 席位，Draft 已创建但
状态画板尚不能写入节点；实施开始前必须完成导入并回填节点 ID

**双端适配范围**：桌面 `1440×900`、手机 `390×844`；两端均验证 Hero 和中下部入口的三态、
44px 操作区域、键盘焦点、长英文/繁体换行、无水平滚动和无状态布局跳动

## 宪法检查

*门禁：第 0 阶段研究前检查；第 1 阶段设计后复查见本表“设计后复查”。*

| 门禁 | 结果 | 证据或后续动作 |
|------|------|----------------|
| 产品定位与范围边界 | 通过 | 只修复主页 Android App 下载核心入口；`spec.md` US1/US2。 |
| 范围排除 | 通过 | 不增加路线规划、非香港巴士查询、iOS 下载、Range 或安装追踪。 |
| 前后端分离与契约优先 | 通过 | 前端共享状态/入口，后端保持 metadata/download；契约路径已列出。 |
| OpenAPI 驱动的服务端接口文档 | 通过 | 无接口结构变更；既有 OpenAPI 3.1 权威源保留，计划校正中文客户端语义并 lint/bundle/docs。 |
| 三语国际化 | 通过 | `zh-hant-en-copy-review.md` 定义三语和语气审校。 |
| 试用查询与可靠降级 | 通过 | 不触碰试用查询；元数据失败只禁用下载入口，不影响其他主页功能。 |
| 现代界面与可视化评审 | 通过 | 已生成 HTML 高保真状态板及 1440/390 PNG。 |
| 电脑与手机双端一致可用 | 通过 | 每个故事同时包含 1440/390 验证，不把手机作为最后补配。 |
| Figma 驱动的前端规格 | 有条件通过 | Draft 与既有基线链接已建立，但连接账号为 View 席位；实现前置任务必须导入状态板并回填节点 ID。 |
| 服务端 DDD 架构 | 通过（N/A） | 不改服务端代码或目录。 |
| 服务端稳健性与可观测性 | 通过（N/A） | 不改服务端；现有 recovery、日志、完整性和统计语义列为回归项。 |
| 中文注释与代码可读性 | 通过 | 删除复杂 Blob 状态机；只为外部约束补充中文注释。 |
| 可验证交付与自动提交 | 通过 | Vitest、Playwright、OpenAPI、Go 回归和真实 Android Chrome 检查均有命令；各 skill 独立提交。 |
| Spec Kit 产物语言 | 通过 | spec、plan、research、data-model、contracts、quickstart、tasks 全部使用简体中文。 |

## 项目结构

### 文档（本功能）

```text
specs/013-unify-apk-download/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── figma.md
├── zh-hant-en-copy-review.md
├── contracts/
│   └── download-entry-state-contract.md
├── prototype/
│   ├── index.html
│   ├── desktop-1440.png
│   └── mobile-390.png
├── checklists/
│   └── requirements.md
└── tasks.md
```

### 源码（仓库根目录）

```text
frontend/
├── src/
│   ├── components/download/
│   │   ├── DownloadMetadataProvider.tsx
│   │   ├── AndroidDownloadAction.tsx          # 新增共享三态/原生链接边界
│   │   ├── AndroidDownloadAction.module.css
│   │   ├── DownloadSegmentedButton.tsx        # 中下部改为共享原生动作
│   │   └── DownloadSegmentedButton.module.css
│   ├── components/hero/
│   │   ├── HeroIntro.tsx                      # 顶部接入同一共享动作
│   │   └── HeroIntro.module.css
│   ├── content/
│   │   ├── homepageContent.ts
│   │   └── uiCopy.ts
│   ├── services/downloadMetadataClient.ts
│   └── tests/
│       ├── download-button.test.tsx
│       └── download-metadata-provider.test.tsx
├── playwright/
│   ├── android-download.spec.ts
│   └── apk-metadata.spec.ts
└── package.json

backend/
└── internal/downloads/                        # 只做回归，不修改

shared/
└── contracts/
    ├── ui-state-contract.md
    ├── download-api.openapi.yaml
    └── openapi/
        ├── download-api.openapi.yaml
        ├── download-api.bundle.yaml
        └── docs/download-api.html
```

**结构决策**：新增 `AndroidDownloadAction` 作为两处入口唯一的可操作语义边界：
`loading/unavailable` 渲染不可操作元素，`ready` 渲染携带 `href` 与 `download` 的原生链接；
Hero 和中下部保留各自布局样式与文案组合，不复制下载执行逻辑。Provider 和 metadata client
继续承担单请求、运行时校验与三态。后端不改，OpenAPI 只校正客户端消费说明。

## 阶段 0：研究结论

研究记录见 [research.md](./research.md)。核心决策：

- 中下部 99% 问题来自页面必须完整读取 APK 后才触发临时链接，移动浏览器需要同时承担响应、
  Blob 和下载复制；立即回收临时 URL 进一步增加兼容风险。
- 顶部原生链接没有页面内完整缓冲和复制步骤，因此移动端表现更可靠。
- 2016/既有实现的两种方式并非服务端接口不同，而是历史 UI 目标不同：中下部曾为提供原位
  “正在准备/失败”状态改成 fetch/Blob；顶部后来为直达主 CTA 使用直接链接。
- 本次以可靠下载优先，取消页面内下载进度与捕获 APK 响应错误；错误门禁前移到元数据检查。

## 阶段 1：设计

### 状态与数据

[data-model.md](./data-model.md) 定义 `loading → ready | unavailable` 单向状态机、元数据合法性、
两处入口派生规则，以及“检查成功不等于下载完成”的边界。

### 契约

[contracts/download-entry-state-contract.md](./contracts/download-entry-state-contract.md) 定义：

- 元数据 HTTP 结果到前端三态的映射；
- 两处入口的元素语义、可操作性、原生下载属性和禁止行为；
- 三语、无障碍、匿名统计和 iPhone 不变量；
- 不变的后端 OpenAPI 结构及需要校正的中文描述。

### 实现顺序

1. 先补充失败测试：两处入口在 loading/unavailable 无 `href`，ready 均为稳定原生链接，点击不
   对 APK URL 调用 `fetch`，不使用 `URL.createObjectURL`。
2. 实现共享 `AndroidDownloadAction`，删除中下部 Blob 状态机和已废弃文案。
3. 更新 Hero 与中下部样式，确保不同视觉布局共用同一行为。
4. 更新 UI/OpenAPI 契约及生成物。
5. 扩展 Playwright：两处下载的文件名/大小/SHA、元数据失败 0 APK 请求、无 `blob:`。
6. 在 1440/390 运行视觉回归，并在真实 Android Chrome 验证中下部下载不再停在 99%。

## 设计后宪法复查

- 产品、范围、前后端、三语、双端、API 文档、代码可读性和验证门禁均保持通过。
- 唯一有条件项是 Figma 节点写入权限；`figma.md` 将“导入画板并回填节点 ID”定义为实施阻塞
  前置任务，未完成前不得把 UI 实现标记为完成。
- 无后端代码变更，因此 DDD、panic/recovery/goroutine 规则不产生新增实现义务，但回归测试
  必须证明现有下载响应和匿名统计未被前端改动破坏。

## 复杂度跟踪

| 违规或复杂点 | 为什么必要 | 被拒绝的更简单方案 |
|--------------|------------|--------------------|
| Figma Draft 暂无状态节点 | 连接账号在现有团队只有 View 席位，`use_figma`、截图与资产上传均被拒绝；已创建独立 Draft 并保留可编辑 HTML/PNG 作为无损导入源 | 不把空白 Draft 冒充完成设计；也不只用文字跳过 UI 门禁。实施前必须由有编辑权限的连接完成导入和节点回填 |
