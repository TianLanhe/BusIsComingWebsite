# Figma 设计引用：首页故事与核心入口优化

## 1. 设计版本与当前门禁

- **文件**：[BusIsComing Website — Homepage v1 Spec](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec)
- **历史基线**：`Homepage Visual System v1.3.1 — FINAL`
- **本轮版本名称**：`Homepage refinement 2026-08-25 — FINAL`
- **本轮状态**：交互与视觉增量已经用户确认并形成仓库设计合同；新版 Figma Section 尚未写入，因此生产 UI 修改门禁当前关闭。
- **禁止事项**：不得发明节点 ID、不得覆盖 014 Section、不得用聊天截图或浏览器实现反向充当设计源。

本轮实施开始时，必须先通过本地 Figma 插件把下列状态写入同一文件的独立 Section，完成插件自测、Figma Desktop 真实选择核对和 reference export 后，才能修改 `frontend/src/` 的生产 UI。

## 2. 014 只读视觉基线

| 用途 | 名称 | 节点 | 约束 |
| --- | --- | --- | --- |
| 色彩、风带、环形舞台、四段结构 | Homepage Visual System v1.3.1 — FINAL | `119:64` | 只读，不覆盖 |
| 桌面首屏构图 | 01 Hero / Desktop 1440×960 / Story 01 | `119:176` | 保留视觉层级，应用 015 增量 |
| 手机首屏构图 | 01 Hero / Mobile 390×844 / Story 01 | `119:461` | 保留环形前后层级，应用 015 增量 |

014 导入包 `docs/superpowers/prototypes/2026-08-21-homepage-visual-system-figma-import/` 是历史产物，包含本轮已删除的 Header、抽象 Logo、单语言旧截图与下载日期，不能重跑或直接改造成 015 设计。

## 3. 015 增量设计源

- [本轮完整设计合同](../../docs/superpowers/specs/2026-08-25-homepage-visual-system-refinement-design.md)
- [本 feature 交互合同](./contracts/homepage-interaction-refinement.contract.md)
- [本 feature 数据与状态模型](./data-model.md)
- 新 Figma 插件落点：`docs/superpowers/prototypes/2026-08-25-homepage-refinement-figma-import/`
- 新视觉证据落点：`specs/015-refine-homepage-interactions/visual-review/`

真实 App Logo 固定使用 `frontend/src/assets/brand/busiscoming-icon.webp`。五个故事的中文与英文源文件映射、批准 SHA 和替代文本以本轮设计合同 §7.1 为权威；Figma 插件和生产素材脚本都只消费固定后的受管副本，不能在 Figma 或网站记录一次性源目录。

## 4. 新 FINAL Section 必须覆盖的节点

节点名在插件源码中固定，节点 ID 只在 Figma Desktop 实际创建后记录。

| 类别 | 必须存在的 Frame/Component Set | 关键内容 |
| --- | --- | --- |
| Foundations | `00 Foundations / Refinement` | 真实 Logo、首行语言入口、流式间距、9:16 手机边框、820ms/160ms motion token |
| Desktop Hero | `01 Hero / Desktop 1440×960 / zh-Hant / Story 01 / Settled` | 无 Header、首行品牌与三语、桌面 CTA 到第三屏、中文图 |
| Desktop Hero EN | `01 Hero / Desktop 1440×960 / en / Story 01 / Settled` | 英文文案与英文图、同一构图 |
| Mobile Hero | `01 Hero / Mobile 390×844 / zh-Hant / Story 01 / Settled` | 完整四边、环形远近、轨道在截图下、手机直接下载 |
| Narrow Hero | `01 Hero / Narrow 320×844 / zh-Hant / Story 01 / Settled` | 三语言不隐藏、44×44、无横向滚动 |
| Motion | `05 Motion / Story 01→02 / Start`、`Copy +160ms`、`Settled` | 舞台先行、文案后随、无明显回弹 |
| Mobile Route | `02 Route / Mobile 390×844 / Default`、`Candidates`、`Error` | 左侧双输入、右侧交换按钮，候选/错误不推位 |
| Download | `03 Download / Desktop / Ready`、`Mobile / Ready`、`Unavailable` | 桌面二维码、手机无二维码、无更新时间/固定日期 |
| Privacy | `04 Privacy / Desktop`、`Mobile` | 真实 Logo、品牌名、返回首页；无功能导航 |

繁体与简体共用中文截图，但三语入口、可见文字和可访问名称都要在内容合同中独立存在。除 Story 01 的双语言显式 Frame 外，其余四故事可用一个组件集的五 variant 表达，但插件自测必须证明五个 ID 和两套 image fill 均完整。

## 5. 新节点记录表

以下不是待填模板，而是实施前门禁状态记录：目前没有可诚实登记的 015 Figma 节点。创建完成后，应以一次独立提交把实际节点写入本表和生产内容 `figmaReference.refinement`；在此之前不得开始生产 UI 修改。

| 记录项 | 当前状态 | 开门条件 |
| --- | --- | --- |
| refinement Section | 未创建 | Figma Desktop 中可选择且 URL 含真实 node-id |
| desktop 1440 | 未创建 | 画面非空，尺寸 1440×960，中文/英文节点可定位 |
| mobile 390 | 未创建 | 画面非空，尺寸 390×844，截图四边与故事轨无覆盖 |
| narrow 320 | 未创建 | 画面非空，尺寸 320×844，语言与触控目标完整 |
| motion phases | 未创建 | start、160ms、settled 三帧可定位 |
| route states | 未创建 | default、candidate、error 三帧可定位 |
| download/privacy | 未创建 | 双端分流、无日期、Privacy 返回入口可定位 |

## 6. 本地 Figma 插件合同

新插件必须是 015 独立目录，并满足：

1. `manifest.json`、`code.js`、`ui.html` 和 README 均不引用本机绝对路径；
2. 插件素材通过仓库内受管 Logo 和本地化截图副本导入；
3. 重跑只更新自己的 015 Section，不查找或删除 `119:64`；
4. 自测断言 Section 名、顶层节点数、所有关键 Frame 名称、尺寸、五故事 × 两 variant image fill 和无日期文案；
5. 设计使用原生可编辑 Figma 节点，真实截图只作为屏幕 image fill，不把整页扁平化；
6. 失败时停止并保留旧 Section，不留下半套 FINAL 节点。

MCP 额度不可用时，允许通过 Figma Desktop 导入/运行本地插件并人工选择节点。该方法不等于 MCP/API readback，记录中必须如实写明 `Figma Desktop manual export`。

## 7. Reference export 与证据 manifest

新节点建立后，把 reference PNG 导出到：

```text
specs/015-refine-homepage-interactions/visual-review/
├── reference/
├── actual/
├── side-by-side/
├── overlay/
├── diff/
└── manifest.json
```

`manifest.json` 每项至少记录：

- Figma file URL、真实 node ID、设计版本和 Frame 名；
- viewport、locale、screenshot variant、story/state/motion phase；
- 导出方式与日期、PNG 像素尺寸、repo-relative path、SHA-256；
- 实现后对应 actual、side-by-side、overlay、diff 路径和审核结论。

reference 与 actual 必须使用相同 viewport 和像素密度；不能把 390 图拉伸为 320，也不能把中文 reference 用于英文 actual。

## 8. 高保真开门与完成判定

生产 UI 开门前必须同时满足：

1. 新插件自测通过；
2. 新 Section 和所有关键 Frame 在 Figma Desktop 中可真实定位；
3. reference export/manifest 完整且不含占位、私有路径或伪造节点；
4. `homepageContent` 只写入上述真实节点；
5. 本文的“本轮状态”和节点记录表已更新为实际证据。

实现完成不以“看起来接近”判定。自动化像素阈值之外，标题分行、真实 Logo、完整手机四边、语言入口、环形远近、故事轨位置、桌面/手机 CTA 语义、无日期和无横向滚动均为零容忍人工复核项。
