# Figma 设计引用：首页 UI 优化

## 文件

- 文件名：BusIsComing Website - Homepage v1 Spec
- URL：https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU
- 本功能版本：2026-06-16 首页 v2 规划节点
- 用途：作为 `/speckit-plan`、`/speckit-tasks`、`/speckit-implement` 的主要视觉与交互参考。

## v2 页面与关键节点

| 节点 | Node ID | 用途 |
|------|---------|------|
| `Homepage v2 Plan - 003 UI Optimization` | `10:2` | 本功能 v2 规划页面 |
| `01 Desktop Homepage v2 / 1440` | `10:3` | 桌面首页首屏布局：左侧文案/下载、右侧功能展示 |
| `02 Mobile Homepage v2 / 390` | `10:44` | 手机首页首屏布局：图上文下、下载入口和截图栈 |
| `03 Download Entry States v2` | `10:75` | 首屏直接下载、下载区详情卡、失败原位提示 |
| `04 Feature Carousel + Manual Stack States v2` | `10:87` | 4 个核心功能点、外层自动轮播、内层手动堆叠 |
| `05 Requirement Notes / v2 implementation contract` | `10:176` | 实现约束说明 |

## 创建与校验说明

- 2026-06-16 通过 Figma MCP `use_figma` 在现有文件中创建上述页面和节点。
- 创建调用成功返回 page 和关键 frame node ID。
- 创建后尝试二次只读校验时触发 Figma Starter MCP 调用额度限制，错误信息为已达到 MCP tool call limit。
- 因此，本文件记录的节点 ID 来自成功创建结果；实现阶段必须补充一次 Figma 或浏览器截图级校验，确认节点仍存在且内容可读。

## 设计覆盖

### 桌面首页

- 1440px 宽桌面首屏。
- 左侧：产品定位、城巴范围、主下载按钮、APK 元信息、iPhone 暂未支持状态。
- 右侧：真实截图展示区模型，外层 4 个核心功能点自动切换，内层截图堆叠手动切换。
- 不使用 Android/iPhone 大平台分段框。

### 手机首页

- 390px 宽手机首屏。
- 采用图上文下结构。
- 下载按钮、在线查询入口、APK 元信息和 iPhone 状态必须完整可读。
- 截图堆叠露出区域必须可触控。

### 下载状态

- Hero 直接下载 Android APK。
- 下载区为 Android 详情卡和备用下载入口。
- iPhone 暂未支持为低权重状态。
- 下载失败时在原位展示，不导向 iPhone 或其他平台。

### 功能轮播与截图栈

- 外层轮播：4 个核心功能点自动切换，无左右箭头。
- 内层图集：同一功能点下多张截图堆叠展示，只允许用户手动切换。
- 单图功能点不展示空堆叠目标。
- 减少动态效果偏好下需要停止或降级动画。

## 与实现的对应关系

| Figma 节点 | 代码范围 |
|------------|----------|
| `10:3` | `frontend/src/components/hero/HeroSection.tsx`、`HeroIntro.tsx`、`AppPreviewCarousel.tsx`、相关 CSS |
| `10:44` | 同上，重点检查移动端 CSS 和内容顺序 |
| `10:75` | `frontend/src/components/download/`、`frontend/src/components/sections/DownloadSection.tsx` |
| `10:87` | `frontend/src/components/hero/AppPreviewCarousel.tsx` 或后续拆出的 showcase/gallery 组件 |
| `10:176` | `contracts/homepage-ui-v2.contract.md`、`contracts/screenshot-assets.manifest.schema.json` |

## 后续视觉验收

实现阶段至少保存以下证据到 `specs/003-homepage-ui-optimization/visual-review/`：

```text
desktop-1440-hero-v2.png
mobile-390-hero-v2.png
desktop-1440-download-states-v2.png
desktop-1440-feature-carousel-v2.png
mobile-390-feature-stack-v2.png
language-switch-state-retention.png
lan-access-mobile-check.png
```

验收时需要对照 Figma 节点和浏览器截图，重点检查：

1. 首屏主下载按钮是否直接表达 Android APK 下载。
2. 下载区是否为 Android 详情卡，而非平台分段框。
3. 外层自动轮播是否没有左右箭头。
4. 内层截图栈是否只由用户手动切换。
5. 手机和桌面是否都没有文字重叠、截断或不可操作区域。
6. `zh-Hant` 文案是否自然、清楚，并且不是简中机械转换。

## 实现校验记录

- 2026-06-16 实现阶段已按节点 `10:3`、`10:44`、`10:75`、`10:87` 的信息层级落地到 React 组件。
- Playwright 桌面端与移动端验收已保存浏览器截图到 `visual-review/`，覆盖首屏、下载区、功能轮播、手动截图栈、在线查询和后续内容区。
- 本轮没有继续调用 Figma MCP 做只读 readback；最终校验以本地浏览器截图、组件测试和 Playwright 双端行为验收为准。
