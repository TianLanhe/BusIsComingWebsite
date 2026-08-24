# 数据与状态模型：优化首页故事与核心入口

## 1. 范围

本 feature 不新增服务端实体、数据库表、浏览器业务持久化或 HTTP schema。以下模型是前端内容、受管素材、交互状态和视觉验收状态；路线请求、下载 metadata、FAQ 与语言持久化继续使用既有模型。

## 2. 固定标识

### 2.1 `HeroStoryId`

固定顺序：

1. `route-search`
2. `saved-journeys`
3. `journey-guidance`
4. `cross-operator-arrivals`
5. `predeparture-monitor`

每个 ID 同时关联三语文案、中文/英文截图 variant、环形槽位和故事按钮。不能维护第二套展示顺序。

### 2.2 `Locale` 与 `ScreenshotLocaleVariant`

| 页面语言 | 截图 variant |
| --- | --- |
| `zh-Hant` | `zh` |
| `zh-Hans` | `zh` |
| `en` | `en` |

映射固定在受管素材合同中；组件不能自行猜测或回退到另一 variant。

## 3. `HeroRotationState`

| 字段 | 类型/取值 | 规则 |
| --- | --- | --- |
| `requestedStoryId` | `HeroStoryId` | 最新请求的目标，也是视觉按钮立即显示的 active 目标 |
| `settledStoryId` | `HeroStoryId` | 已完成舞台与目标图片稳定的故事；只能由最新 epoch 更新 |
| `transitionEpoch` | 非负整数 | 每次不同故事或语言图片转场递增；陈旧回调不得更新状态 |
| `selectionOrigin` | `initial / automatic / manual / locale` | 决定 settled 后使用哪类 dwell |
| `phase` | `idle / transitioning` | reduced motion 下同一次状态提交后回到 idle |
| `dwellKind` | `reading / cadence / none` | reading=10s，cadence=5s，none=暂停或转场中 |
| `announcedStoryId` | `HeroStoryId / null` | 只在最终手动选择 settled 后更新；不参与视觉 active |

### 3.1 不变量

- `requestedStoryId` 是标题目标、截图目标、槽位目标与按钮选中态的唯一业务来源。
- `settledStoryId` 只表示计时和验证边界，不得驱动另一套可见内容。
- 任一时刻最多一个 dwell timer、一个当前 epoch 和一个可失效的转场保护 timer。
- `phase=transitioning` 时不开始 dwell。
- 自动、locale 与初始状态不更新 `announcedStoryId`。

### 3.2 状态转换

| 当前状态/事件 | 转换 | 下一 dwell |
| --- | --- | --- |
| 初次挂载且可播放 | 故事 01 创建 initial epoch，图片稳定后 settled | reading 10s |
| reading 到期 | 请求下一个故事，origin=automatic，进入 transitioning | settled 后 cadence 5s |
| cadence 到期 | 请求下一个故事，05 后回 01 | settled 后 cadence 5s |
| 手动选择不同故事 | 递增 epoch，origin=manual，立即更新 requested | settled 后 reading 10s |
| 手动选择当前故事 | epoch 不变，不重播转场 | 立即重建 reading 10s |
| locale 变化 | 保持 story，递增 epoch，等待对应 variant 稳定 | settled 后 reading 10s |
| 任一 pause reason 加入 | 取消 dwell；最新转场可继续 | none |
| 最后一个 pause reason 移除 | 若 idle/settled 则重建 reading | reading 10s |
| reduced motion 开启 | 取消 dwell，当前目标立即 settled | none，直到偏好关闭 |
| 组件卸载 | 清除 observer、listener 与全部 timer | 终止 |

## 4. `HeroPauseState`

`pauseReasons` 是以下离散原因的集合：

- `hover`：pointer 位于首屏播放区域；
- `focus`：键盘输入模态下焦点位于首屏；
- `offscreen`：归一化可见比例低于约 50%；
- `hidden`：document 不可见；
- `reduced-motion`：用户要求减少动态效果；
- `visual-review`：测试/截图专用确定性暂停，不出现在生产 UI。

派生字段 `isPaused = pauseReasons.size > 0`。解除一个原因时必须重新计算集合，不能直接恢复计时。

## 5. `HeroTransitionEpoch`

| 字段 | 规则 |
| --- | --- |
| `epoch` | 与 `HeroRotationState.transitionEpoch` 相等才有效 |
| `storyId` | 必须等于当前 requested story |
| `localeVariant` | 必须等于当前页面语言映射 |
| `phoneTransformSettled` | 目标前景主 transform 已完成或 reduced motion 直接完成 |
| `imageSettled` | 目标图已 decode/load 或稳定失败壳已就绪 |
| `fallbackExpired` | 只在 transitionend 丢失时作为保护，不可覆盖更新后的 epoch |

当 `phoneTransformSettled && imageSettled`，或 reduced motion 直接完成时，发出一次 settled。保护 timer 只能补发同 epoch 的一次性完成信号。

## 6. `HeroCopyTransition`

这是视觉快照，不是业务实体：

| 字段 | 含义 |
| --- | --- |
| `outgoingStoryId` | 转场开始前文案，只用于离场层 |
| `incomingStoryId` | 与 requested story 相同 |
| `phase` | `stage-leading / copy-out / copy-in / settled` |

阶段顺序：舞台 start → 约 160ms 后 copy-out/copy-in → 约 820ms settled。快速请求时旧视觉层可立即结束，最终只保留最新 epoch。

## 7. `LocalizedScreenshotAsset`

### 7.1 Story 级字段

| 字段 | 规则 |
| --- | --- |
| `id` / `storyId` | 固定五故事 ID，二者相同 |
| `order` | 1–5，与故事顺序一致 |
| `variants` | 恰有 `zh` 与 `en` |
| `alt` | `zh-Hant`、`zh-Hans`、`en` 各非空 |
| `provenanceLabel` | 只描述批准来源，不含本机/临时绝对路径 |

### 7.2 Variant 字段

| 字段 | 规则 |
| --- | --- |
| `sourceFileName` | 仅 basename，不含 `/` 或 `\` |
| `sourceFingerprint` | 固定 1080×1920 与批准 SHA-256 |
| `outputs` | 恰有 540×960、720×1280、1080×1920 三个 WebP |
| `approvalStatus` | `approved` |
| `desensitizationStatus` | `approved` |
| `redactedItems` / `retainedItems` | 记录公开检查边界 |

所有 output 使用仓库相对受管路径并记录字节数/SHA；路径不能重复，也不能跨 story/variant 命名。

## 8. `HomepageContentV4`

V4 保留 014 的 hero、routeTrial、downloadDecision、supportEnding 与 scope exclusions，只变更以下形状：

### 8.1 `siteChrome`

| 字段 | 规则 |
| --- | --- |
| `brandName` | 三语均为 `BusIsComing` |
| `brandAssetId` | 固定 `busiscoming-app-logo` |
| `languageLabel` | 三语可访问名称 |
| `languageOptions` | 固定 `zh-Hant:繁`、`zh-Hans:简`、`en:EN` |

V4 不包含 Header 功能导航 items。页尾 FAQ、Privacy、返回顶部和联系从 `supportEnding` 自身读取。

### 8.2 `downloadDecision.metadataLabels`

只包含：

- `version`
- `minimumSystem`
- `size`

不得包含 `updated`；下载 API 仍可返回 lastUpdated，但它不是首页展示字段。

### 8.3 `figmaReference`

| 子对象 | 含义 |
| --- | --- |
| `baseline` | 014 Figma 文件、Section `119:64`、桌面 `119:176`、手机 `119:461` 与历史版本 |
| `refinement` | 015 新 FINAL Section、1440/390/320 关键节点和版本名称；只在真实节点建立后写入运行内容 |

## 9. `BrandAssetContract`

| 字段 | 固定值/规则 |
| --- | --- |
| asset ID | `busiscoming-app-logo` |
| 受管路径 | `frontend/src/assets/brand/busiscoming-icon.webp` |
| 固有尺寸 | 192×192 |
| 格式 | WebP，透明 |
| SHA-256 | 以获批 015 设计合同记录值为准 |
| 使用范围 | Hero 首行、Privacy 轻量返回、公开页尾 |

抽象 BrandMark 不得继续出现在上述公开品牌入口。

## 10. `DownloadActionContext`

它是 viewport 派生状态，不持久化：

| 上下文 | Hero 行为 | metadata 依赖 |
| --- | --- | --- |
| desktop | 导航到 `#download`，无 download 属性 | 不依赖 ready；第三屏显示实际状态 |
| mobile ready | 当前 APK 原生下载 | 依赖真实 URL/文件名 |
| mobile loading/unavailable | 不可操作受控状态 | 不提供 href |

第三屏下载和 QR 不分叉新状态，继续由同一 ready metadata 派生同一绝对目标。

## 11. `MobileRouteInputLayout`

纯布局模型，不改变路线领域状态：

- `inputStack`：origin 与 destination 的 field surface；
- `swapControl`：右侧 44×44 控件，中心由两个 input surface 的几何决定；
- `fieldSupplement`：错误文案与候选，不参与 swapControl 的垂直中心；
- `queryAction` 与 scope notice：位于输入组后方正常文档流。

桌面可继续使用既有纵向顺序；只有 mobile layout 采用两列。

## 12. `FigmaRefinementRecord`

| 字段 | 规则 |
| --- | --- |
| `fileUrl` | 既有 BusIsComing Website Figma 文件 |
| `baselineNodeIds` | 014 真实节点 |
| `refinementSectionNodeId` | 015 实际创建后记录，不得发明 |
| `frameNodeIds` | 1440、390、320、语言、转场、路线、下载、Privacy 关键状态 |
| `designVersion` | `Homepage refinement 2026-08-25` 或 Figma 中最终批准名称 |
| `recordedAt` | 实际记录日期 |
| `exportEvidence` | repo-relative path、像素尺寸、SHA、导出方式 |

在 refinement Section 与 reference export 建立前，生产 UI 修改门禁为关闭。

## 13. 保持不变的既有模型

- 路线：地点候选、request sequence、路线 query version、ETA token、成功/空/失败/retained；
- 下载：metadata loading/ready/unavailable、单 Provider、无陈旧回退；
- FAQ：稳定 ID、单项展开；
- i18n：history 路径、浏览器/存储选择与三语内容；
- 服务端/OpenAPI：全部不变。
