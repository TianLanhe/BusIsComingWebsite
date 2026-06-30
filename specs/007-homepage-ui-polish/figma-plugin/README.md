# 首页 UI 体验优化补充 Figma 插件

本插件用于在目标 Figma 文件中生成或重建 `Homepage UI Polish - 007` 页面和关键设计节点。`2026-06-30` 已按用户提供的节点报告回填真实 Node ID；只有当页面或节点缺失、需要重建 007 设计稿时才需要再次运行插件。

## 使用方法

1. 打开 Figma 文件 `BusIsComing Website - Homepage v1 Spec`。
2. 选择 `Plugins -> Development -> Import plugin from manifest...`。
3. 选择本目录下的 `manifest.json`。
4. 运行插件。
5. 复制插件输出的节点报告，并同步回填到 `specs/007-homepage-ui-polish/figma.md`、内容元数据和契约。

## 生成内容

Figma file: https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec

Page: `Homepage UI Polish - 007`

- `Desktop 1440 / Hero Medium Screenshot Deck`（当前回填 Node ID：`51:86`）
- `Desktop 1440 / Screenshot Lightbox`（当前回填 Node ID：`51:113`）
- `Mobile 390 / Compact Feature Grid`（当前回填 Node ID：`51:125`）
- `Mobile 390 / Compact Route Result Card`（当前回填 Node ID：`51:151`）
- `Interaction States / Split Gesture Zones`（当前回填 Node ID：`51:183`）
- `Spec Notes`（当前回填 Node ID：`51:194`）

插件是计划阶段 Figma 写入不可用时的 fallback；运行后仍需要人工检查视觉效果，并以新的真实节点报告覆盖旧 Node ID。
