# 素材来源与维护

本文集中记录网站品牌图、favicon 和真实 App 截图的来源、用途、脱敏和更新流程。素材文件位于前端目录，但说明文档统一保留在根 `docs/`。

## 品牌素材

| 文件 | 当前规格 | 用途 |
| --- | --- | --- |
| `frontend/src/assets/brand/busiscoming-logo-foreground.png` | 512×512 RGBA PNG | header、footer、README 主 logo |
| `frontend/public/favicon.webp` | 96×96、带透明通道 | 浏览器 favicon |
| `frontend/src/assets/brand/busiscoming-icon.webp` | 192×192、带透明通道 | 历史完整 launcher 素材，不作为当前网站 logo |

当前 foreground 来源为 Android 主项目：

```text
/Users/hezhenyu/AndroidStudioProjects/BusIsComming/
app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png
```

导出规则：

- 以 launcher foreground 为源，不使用 launcher 背景底板；
- 按非透明像素裁切，保留安全边距；
- 输出透明 512×512 PNG；
- favicon 从同一 foreground 口径生成 96×96 WebP；
- header、footer 和 favicon 不改用 lucide 巴士、渐变底板或自制圆角图标。

Android 源资源或品牌决策变化时，先核对 Android 主项目当前资源，再重新导出并更新本文件、相关 Figma 和视觉测试。不要只替换网站图片而留下错误来源记录。

## 首页真实截图

当前可发布截图位于：

```text
frontend/src/assets/app-screenshots/real/
```

`manifest.json` 是截图场景、顺序、默认图、脱敏状态和三语 alt text 的结构化来源。当前四个 feature group：

| `featureId` | 场景 |
| --- | --- |
| `favorite-citybus-routes` | 常用 Citybus 路线与路线列表 |
| `route-comparison` | 车费、耗时、步行和 ETA 比较 |
| `eta-details` | 路线详情与多班 ETA |
| `predeparture-monitor` | 锁屏/通知栏出门前监测 |

一张图片可以被多个 feature 引用，例如当前路线比较和常用路线共享同一结果截图。不要为了目录整齐复制相同文件。

## Manifest 规则

每个 group 必须：

- 使用 schema 允许的 `featureId`；
- 至少有一张图片；
- 恰好一张 `isDefault: true`，当前默认图 `order` 为 1；
- 只引用 `frontend/src/assets/app-screenshots/real/` 内文件；
- 为每张图提供 `zh-Hant`、`zh-Hans`、`en` 非空 alt；
- 使用 `pending/approved/rejected` 脱敏状态；
- 在 `retainedItems` 中说明允许保留的产品事实。

契约位置：

```text
specs/003-homepage-ui-optimization/contracts/
screenshot-assets.manifest.schema.json
```

`frontend/src/tests/screenshot-assets-contract.test.ts` 同时验证 schema、用户确认的场景映射、默认图和 alt 完整性。

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
npm --prefix frontend run sanitize:screenshots
```

`frontend/scripts/sanitize-homepage-screenshots.mjs`：

1. 读取 manifest；
2. 按 `featureId` 使用显式 mask plan；
3. 覆盖敏感区域；
4. 旋转、缩放到最大宽度 420px，并以 JPEG 压缩内容写入 manifest 的 output path。

当前 manifest 的 `sourceRoot` 与 `outputRoot` 相同，且每张图的 `sourcePath`/`outputPath` 指向同一项目内文件。这意味着脚本会重写受管截图，不在仓库保留一份无损原图。运行前必须确保原始可信素材在仓库外有受控副本，并在运行后逐张检查；不要在已压缩输出上无目的重复执行，避免累积质量损失。

当前受管文件本身是 PNG，但处理脚本显式使用 JPEG encoder，同时仍写回 `.png` 路径。再次运行前应把编码格式与扩展名作为独立代码问题统一；在此之前，运行后必须检查实际媒体类型，不能只凭文件名判断格式。

脚本的 mask plan 是实现细节，manifest 的 `redactedItems`/`retainedItems` 是记录。两者不一致时不能仅把 manifest 状态改成 approved，必须重新核对实际像素和测试证据。

## 更新流程

1. 在 Android 主项目或用户提供素材中确认截图对应当前真实功能。
2. 在仓库外保存受控原图；不要先提交未经脱敏版本。
3. 将待处理副本放入 `frontend/src/assets/app-screenshots/real/`。
4. 更新 mask plan 与 `manifest.json` 的 group、顺序、状态、retained/redacted items 和三语 alt。
5. 运行 `sanitize:screenshots`，逐张放大检查输出。
6. 更新 `carouselSlides.ts` 的静态 import 映射；manifest 中存在但未映射的图片不能进入页面。
7. 运行契约测试、构建和桌面/手机 Playwright。
8. 涉及场景、层级或交互变化时，更新对应 Figma 与 feature 文档。

常用验证：

```bash
npm --prefix frontend run test
npm --prefix frontend run build
npm --prefix frontend run test:e2e -- feature-gallery.spec.ts hero-carousel.spec.ts
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
