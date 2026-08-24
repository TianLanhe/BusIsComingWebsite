# BusIsComing 首页交互优化 015 — Figma 本地导入插件

这是 Figma MCP 为 Starter/View 席位、无法直接写入时的受控 fallback。插件在既有
`BusIsComing Website — Homepage v1 Spec` 文件中新增独立的
`Homepage refinement 2026-08-25 — FINAL` Section，不覆盖历史 014 Section `119:64`。

## 设计范围

- 无独立 Header 的 Hero 首行：真实 App Logo、品牌名与 `繁 · 简 · EN` 直达入口；
- 1440、390、320 首屏基准，桌面与手机使用同一批准的环形远近构图；
- 五故事中文／英文真实截图，start / +160ms / settled 转场 storyboard；
- 手机路线试查 default / candidates / error，交换按钮位于双输入右侧；
- 桌面 Hero 下载到第三屏、手机 ready 直接下载、下载资料不显示日期；
- 双端 Privacy 顶部真实 Logo 与返回首页；
- `zh-Hans` 只做文本、溢出和几何验收，不建立或宣称像素级 Figma reference。

所有画板均为原生可编辑 Figma 节点，真实 Logo 与 App 截图仅作为 image fill。

## 构建

构建脚本不写入一次性素材路径；两个目录只通过当前命令的环境变量传入：

```bash
BIC_FIGMA_ZH_SCREENSHOT_DIR=/path/to/approved-zh \
BIC_FIGMA_EN_SCREENSHOT_DIR=/path/to/approved-en \
npm run build
npm test
```

构建会校验真实 Logo、10 张截图的 SHA-256 和截图 `1080×1920` 尺寸。生成后的
`dist/code.js` 已内嵌素材，可直接在 Figma Desktop 运行。

## 在 Figma Desktop 运行

1. 打开 [BusIsComing Website — Homepage v1 Spec](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec)。
2. 选择 `Plugins` → `Development` → `Import plugin from manifest…`。
3. 选择本目录的 `manifest.json`。
4. 运行 `BusIsComing Homepage Refinement 015`，点击“补齐并选择证据画板”。
5. 在 Figma 右侧 Export 区导出已选择的 19 个 PNG；将文件登记到 `specs/015-refine-homepage-interactions/visual-review/manifest.json`。
6. 复制插件状态中的 Section 和关键 Frame ID，回填 `specs/015-refine-homepage-interactions/figma.md`。

插件遇到同名 FINAL 时会幂等补齐缺失的 015 像素 reference、校正路线状态与手机下载画板的已知标题间距并选择完整证据集；不会替换既有 Frame，也不会覆盖 014。再次运行在 reference 已齐全时新增 0 个 Frame。遇到未完成 BUILDING 时停止，不自动删除。
若节点通过 Figma Desktop 创建与导出，证据必须标记为 `Figma Desktop manual export`，
不得声称 MCP/API readback。
