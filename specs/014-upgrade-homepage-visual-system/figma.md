# Figma 设计引用：升级首页视觉系统与产品叙事

## 设计版本

- **版本名称**：Homepage Visual System v1.3.1 — FINAL
- **确认日期**：2026-08-21
- **规格登记日期**：2026-08-23
- **状态**：视觉方向、双端构图、五故事、路线试查、下载、收尾、动效与异常状态均已获用户确认，可进入计划阶段。
- **取代关系**：本版本取代旧的 A/B/C 概念方案和 `2026-07-20-homepage-breathing-hierarchy-redesign-design.md`；旧稿只能解释历史，不得指导实现。

## 文件与关键节点

- Figma 文件：[BusIsComing Website — Homepage v1 Spec](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec)
- 页面：`Homepage v1 Spec`（`0:1`）
- 最终 Section：[Homepage Visual System v1.3.1 — FINAL](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=119-64)（`119:64`，`7900×7200`，38 个顶层节点）
- 桌面首屏 Story 01：[01 Hero / Desktop 1440×960 / Story 01](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=119-176)（`119:176`）
- 手机首屏 Story 01：[01 Hero / Mobile 390×844 / Story 01](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=119-461)（`119:461`）

## 覆盖范围

最终 Section 包含以下可编辑原生设计内容；五张真实 App 截图作为屏幕 image fill，其余页面没有扁平化为整页图片：

1. `00 Foundations`：色彩、排版、间距、风带层次和手机边框材质；
2. `01 Hero / Desktop / 1440×960`：五个故事状态；
3. `01 Hero / Mobile / 390×844`：五个故事状态与环形截图舞台；
4. `02 Route Trial / Desktop` 与 `Mobile`：默认、候选、无效、加载、成功、空结果、失败、重试与保留结果；
5. `03 Download / Desktop` 与 `Mobile`：检查中、可用、不可用和减少动态效果；
6. `04 Support Ending / Desktop` 与 `Mobile`：FAQ 展开/收起、联系与页尾；
7. `05 Motion Notes`：风带、环形舞台、下载汇聚的时长、曲线、层级和减少动态效果；
8. `06 Content Contract`：三语文案与运营商能力边界。

## 交互状态合同

- **五故事**：点击故事按钮同时更新标题、说明、当前截图、选中态和辅助技术说明；手机截图沿环形舞台前后交换，桌面使用较轻的前后关系变化。
- **路线试查**：所有状态共用稳定工作区几何尺寸；加载使用原区域骨架，空结果和错误只提供一个主要下一步，保留结果时不叠加提示卡。
- **下载**：三态共用稳定行动尺寸；只有可用状态提供真实下载链接和桌面二维码，手机始终隐藏二维码。
- **FAQ**：默认展开第一项，同一时间最多展开一项；键盘、触控和辅助技术使用等价状态。
- **减少动态效果**：关闭持续风带、环形大位移、平滑滚动和非必要浮动，保留静态层级与即时状态交换。

## 视觉不可漂移项

- 手机 Header 与品牌同行并保留功能、FAQ、联系和三语入口；
- 首屏标题和 CTA 在上，截图舞台居中或位于右侧，故事按钮位于截图下方或桌面左下位置；
- 手机截图边框完整、无灵动岛、无说明卡、无证据标签、无按钮遮挡；
- 五张截图保持环形远近关系，不得排成平面队列；
- 路线卡的耗时和步行使用文字，不使用图标，不显示直达/转乘标签；
- 下载区非卡片、居中紧凑、版本信息同字号，桌面有真实二维码、手机无二维码；
- 收尾使用无卡片 FAQ、联系横条和浅色页尾，不使用深色底浪或紫色色块；
- `1440×960` 与 `390×844` Frame 不得非等比拉伸，标题换行、主要行动顺序和视觉权重必须以获批 Frame 为准。

## 验证记录与限制

- Figma 桌面运行时已选中并核对最终 Section `119:64`、38 个顶层节点、桌面 `1440×960` 和手机 `390×844` Frame，确认画面非空且内容完整。
- 设计由仓库内一次性本地开发插件写入原生 Figma 节点；源文件位于 `docs/superpowers/prototypes/2026-08-21-homepage-visual-system-figma-import/`。
- Starter MCP 调用额度当时已耗尽，因此没有伪造 API readback；节点标识、尺寸和画面可见性来自 Figma 桌面实际选择状态与 URL。
- 实现验收必须同时生成桌面、手机和三语浏览器证据；Figma 节点可定位不等同于浏览器实现已经通过视觉验收。

## 仓库内补充资料

- [完整视觉设计合同](../../docs/superpowers/specs/2026-08-21-homepage-visual-system-v131-design.md)
- [Figma 本地导入源说明](../../docs/superpowers/prototypes/2026-08-21-homepage-visual-system-figma-import/README.md)

上述资料用于补充设计来源和复核方法；正式前端实现仍以最终 Figma Section 和本 feature 规格为共同验收合同。
