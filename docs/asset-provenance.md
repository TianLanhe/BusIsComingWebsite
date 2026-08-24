# 素材来源与维护

本文集中记录网站品牌图、favicon 和真实 App 截图的来源、用途、脱敏和更新流程。素材文件位于前端目录，但说明文档统一保留在根 `docs/`。

## 品牌素材

| 文件 | 当前规格 | 用途 |
| --- | --- | --- |
| `frontend/src/assets/brand/busiscoming-logo-foreground.png` | 512×512 RGBA PNG | README 与历史导出兼容素材 |
| `frontend/public/favicon.webp` | 96×96、带透明通道 | 浏览器 favicon |
| `frontend/src/assets/brand/busiscoming-icon.webp` | 192×192、带透明通道；SHA-256 `7792487ed26a317e248af26dd4b085507d1797a7448856f09ae18e062a478bf6` | Hero、Privacy、Footer 的当前真实 App Logo |

当前网站品牌入口使用经 015 Figma 门禁批准的完整 App Logo；foreground 只保留作 README/历史导出兼容。网站只保存公开品牌文件和来源说明，运行时不读取 Android 工程或本机路径。

导出规则：

- 以 launcher foreground 为源，不使用 launcher 背景底板；
- 按非透明像素裁切，保留安全边距；
- 输出透明 512×512 PNG；
- favicon 从同一 foreground 口径生成 96×96 WebP；
- Hero、Privacy、Footer 和 favicon 不改用 lucide 巴士、自制渐变底板或临时圆角图标。

Android 源资源或品牌决策变化时，先核对 Android 主项目当前资源，再重新导出并更新本文件、相关 Figma 和视觉测试。不要只替换网站图片而留下错误来源记录。

## 首页真实截图

当前可发布截图位于：

```text
frontend/src/assets/app-screenshots/real/
```

`manifest.json` 是截图场景、顺序、源/衍生指纹、脱敏状态和三语 alt text 的结构化来源。当前五个故事资产：

| `storyId` | 场景 |
| --- | --- |
| `route-search` | 输入起终点与候选巴士路线 |
| `saved-journeys` | 常用行程与路线、车费、候车时间比较 |
| `journey-guidance` | 路线、转乘与当前位置沿途导航 |
| `cross-operator-arrivals` | 符合条件的联营路线跨运营商到站时间 |
| `predeparture-monitor` | 锁屏/通知栏出门前监测 |

## Manifest 规则

manifest v3 将繁中/简中映射到 `zh`，英文映射到 `en`。每个 asset 必须：

- 使用 schema 允许的 `storyId` 并与五故事一一对应；
- 为 `zh`、`en` 分别保存 1080×1920 源截图宽高和 SHA-256，但不保存本机绝对源路径；
- 生成 540/720/1080 三种 WebP 衍生物并保存尺寸、字节数和 SHA-256；
- 只引用 `frontend/src/assets/app-screenshots/real/` 内的受管衍生文件；
- 提供 `zh-Hant`、`zh-Hans`、`en` 非空 alt；
- 使用 `approved` 发布和脱敏状态；
- 在 `retainedItems` 中说明允许保留的产品事实。

契约位置：

```text
specs/015-refine-homepage-interactions/contracts/
screenshot-assets-v131-localized.manifest.schema.json
```

`frontend/src/tests/screenshot-assets-contract.test.ts` 同时验证 schema、五故事映射、衍生指纹、批准状态、三语 alt 和无本机路径。

## 脱敏边界

可发布截图必须是：

- 用户确认可公开的真实 App 截图；或
- 从可信原图生成并经过检查的脱敏副本。

提交前检查：

- 真实地址、搜索历史、私人站点组合；
- 系统通知中的个人内容；
- 账号、电话、邮箱或其它身份信息；
- 设备状态栏、文件名或 debug overlay 中的私有信息；
- 不应公开的 API key、token、服务器地址或构建信息。

路线号、车费、耗时和 ETA 可作为产品布局事实保留，但必须确认不会与其它信息组合后识别个人行程。`desensitizationStatus: approved` 是发布门禁，不是自动脱敏证明。

## 当前处理脚本

```bash
BIC_FIGMA_ZH_SCREENSHOT_DIR=/approved/zh/output \
BIC_FIGMA_EN_SCREENSHOT_DIR=/approved/en/output \
npm --prefix frontend run prepare:homepage-story-assets
```

`frontend/scripts/prepare-homepage-story-assets.mjs` 从明确列出的、已批准且只读的源截图生成新的 WebP 路径，先验证源 SHA，再写入 540/720/1080 衍生物与 manifest。它不会在原路径覆盖源图，也不会运行旧的 mask 坐标流程。旧 `sanitize:screenshots` 不得用于这组 v1.3.1 资产。

## 更新流程

1. 在 Android 主项目或用户提供素材中确认截图对应当前真实功能。
2. 在仓库外保存受控原图；不要提交未经脱敏版本或本机源路径。
3. 在准备脚本中登记批准的源指纹与新的输出 basename。
4. 运行 `prepare-homepage-story-assets.mjs`，逐张放大检查输出并核对 manifest。
5. 更新 `storyAssets.ts` 的静态 import 映射；manifest 中存在但未映射的图片不能进入页面。
6. 运行契约测试、构建和桌面/手机 Playwright。
7. 涉及场景、层级或交互变化时，更新对应 Figma 与 feature 文档。

常用验证：

```bash
npm --prefix frontend run test
npm --prefix frontend run build
npm --prefix frontend run test:e2e -- hero-carousel.spec.ts homepage-visual-regression.spec.ts
```

## Alt text

- 描述用户需要理解的画面目的，而不是罗列所有像素。
- 同一图片在不同 feature 中如果语义不同，可在 content 层提供更合适说明；不要机械重复文件名。
- `zh-Hant` 使用香港产品页面语气，`zh-Hans` 与 `en` 独立写作。
- 不把截图里可能过期的精确 ETA、车费或地点抄进 alt，除非它们是理解图像所必需且已确认可公开。
- 装饰性品牌图可使用简洁产品名 alt；纯装饰副本应使用空 alt 并从焦点顺序移除。

## 禁止事项

- 不直接从 Android 项目外部绝对路径 import runtime 图片。
- 不提交未经检查的原始截图或只通过文件名声称已脱敏。
- 不把 mock、原型或 Figma 示例标记为真实 App 截图。
- 不用品牌底板、第三方图标或临时占位图替换正式 foreground 而不更新设计来源。
- 不在 `frontend/src/assets/**` 重新建立 README；规则更新统一修改本文、manifest、schema 或测试。
