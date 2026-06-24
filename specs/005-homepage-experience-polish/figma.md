# Figma 设计引用：首页体验精修

## 状态

当前会话没有可调用的 Figma MCP 写入工具，因此本阶段未直接写入 Figma 文件，也不伪造 node ID。本目录提供本地 Figma 插件，后续任务必须导入插件生成节点并回填实际 node ID。

## 目标文件

- 文件：BusIsComing Website - Homepage v1 Spec
- URL：https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec
- 计划页面：`Homepage Experience Polish - 005`

## 计划节点

| 节点名称 | 说明 |
|----------|------|
| `Desktop 1440 / Cinematic Rail` | 桌面首屏 cinematic phone rail，单主图、左右浅层预览、联系入口和真实 logo |
| `Mobile 390 / Swipe Rail` | 手机首屏上下布局，触控滑动轮播、真实 logo 和语言切换 |
| `Carousel States / No Thumbnail Stack` | 3 秒自动、拖动中、减少动态效果、禁止底部缩略图状态 |
| `Brand Contact States` | Header/footer logo、`聯絡我們 / 联系我们 / Contact Us`、真实邮箱 |
| `Spec Notes` | 禁止形态、文案策略、验收截图说明 |

## 本地插件

插件目录：`specs/005-homepage-experience-polish/figma-plugin/`

导入步骤：

1. 打开目标 Figma 文件。
2. 进入 Figma 插件开发入口。
3. 选择 `Import plugin from manifest...`。
4. 选择 `specs/005-homepage-experience-polish/figma-plugin/manifest.json`。
5. 运行插件，等待页面和节点生成。
6. 复制插件输出的节点报告，回填到本文件或后续 tasks。

## 版本说明

- `2026-06-24`: 计划阶段生成本地插件设计源；等待后续导入 Figma 并回填实际节点 ID。
