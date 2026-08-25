# Figma 设计引用：首页故事与核心入口优化

## 1. 设计版本与当前门禁

- **文件**：[BusIsComing Website — Homepage v1 Spec](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec)
- **历史基线**：`Homepage Visual System v1.3.1 — FINAL`
- **本轮版本名称**：`Homepage refinement 2026-08-25 — FINAL`
- **本轮状态**：015 Section 已于 2026-08-25 通过 Figma Desktop 本地插件真实写入并人工选择核对；Section 为 `136:292`。2026-08-26 按批准的 v1.3.1 素材映射原位刷新 97 个本地化截图 fill，新增 0 个 Frame，既有节点 ID、布局和动效规格保持不变。19 张 required reference 与 1 张补充 reference 已重新原生导出、登记哈希并完成中英文视觉抽查；`zh-Hans` 仅做文本、溢出和几何验收，不设置像素级 Figma reference 门禁。
- **禁止事项**：不得发明节点 ID、不得覆盖 014 Section、不得用聊天截图或浏览器实现反向充当设计源。

本轮本地插件自测、Figma Desktop 节点写入、19 张 required reference 与 1 张补充 reference export、浏览器 actual 及对照材料均已完成。截图键使用“故事 ID + 语言”唯一标识，避免中英文同名源文件相互覆盖；Story 05 只允许锁屏监控截图。`zh-Hans` 只做浏览器文本、溢出与几何验收，不宣称像素级 Figma 对照。

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

真实 App Logo 固定使用 `frontend/src/assets/brand/busiscoming-icon.webp`。五个故事的中文与英文源文件映射、批准 SHA 和替代文本以本轮设计合同 §7.1 为权威；Story 05 的中文和英文均只使用锁屏监控图，不导入设置页。Figma 插件和生产素材脚本都只消费固定后的受管副本，不能在 Figma 或网站记录一次性源目录。

### 2026-08-26 手机内屏比例纠偏状态

- 浏览器实现、受管 WebP、manifest/schema 与本地 Figma 导入插件均已统一为 `1080:2172`；内屏使用顶部对齐等比覆盖，消除边框 inset 导致的上下露底。
- Figma 插件刷新既有 015 Section 时会同时调整每个 `Phone / NN / locale` 外壳及其 `App Screenshot` 子节点的高度，不只替换 image fill。
- 本次尝试通过 Figma MCP 更新线上文件时命中 Starter 方案调用额度上限，工具未执行任何写入。因此下述旧 Node ID 仍只证明此前版本；在额度恢复并重新运行插件、导出和对照前，不宣称线上 Figma 已完成本次比例纠偏或像素级复核。

## 4. 新 FINAL Section 必须覆盖的节点

节点名在插件源码中固定，节点 ID 只在 Figma Desktop 实际创建后记录。

| 类别 | 必须存在的 Frame/Component Set | 关键内容 |
| --- | --- | --- |
| Foundations | `00 Refinement Library` | 真实 Logo、首行语言入口、流式间距、1080:2172 修长手机边框与顶部覆盖内屏、820ms/160ms motion token |
| Desktop Hero | `01 Hero / 1440×960 / zh-Hant / Story 01` | settled 状态；无 Header、首行品牌与三语、桌面 CTA 到第三屏、中文图 |
| Desktop Hero EN | `01 Hero / 1440×960 / en / Story 01` | 英文文案与英文图、同一构图 |
| Mobile Hero | `01 Hero / 390×844 / zh-Hant / Story 01` | 完整四边、环形远近、轨道在截图下、手机直接下载 |
| Narrow Hero | `01 Hero / 320×844 / zh-Hant / Story 01` | 三语言不隐藏、44×44、无横向滚动 |
| Motion | `02 Motion / Start`、`Plus 160ms`、`Settled` | 舞台先行、文案后随、无明显回弹 |
| Mobile Route | `03 Route Trial / Mobile 390×844 / default`、`candidates`、`error` | 左侧双输入、右侧交换按钮，候选/错误不推位 |
| Download | `04 Download / desktop / ready`、`mobile / ready`、`desktop / unavailable` | 桌面二维码、手机无二维码、无更新时间/固定日期 |
| Privacy | `05 Privacy / desktop`、`mobile` | 真实 Logo、品牌名、返回首页；无功能导航 |

繁体与简体共用中文截图，但三语入口、可见文字和可访问名称都要在内容合同中独立存在。Figma 的像素级 reference 只覆盖 `zh-Hant` 和 `en`；`zh-Hans` 不创建独立像素 reference，只在浏览器中验收文本、溢出、横向滚动、触控目标与关键几何。除 Story 01 的双语言显式 Frame 外，其余四故事由本轮本地化矩阵和手机 Story Frame 共同证明五个 ID 与两套 image fill 完整。

## 5. 新节点记录表

以下 ID 来自 2026-08-25 Figma Desktop 本地插件完成回执，并通过 Figma 页面 URL 与真实选择核对；不是 MCP/API readback。MCP 因 Starter 调用额度不可用，因此不得把本记录描述为 MCP 读取。生产内容 `figmaReference.refinement` 只能在 reference export/manifest 完整后写入。

| 记录项 | Figma 节点 | 核对结论 |
| --- | --- | --- |
| refinement Section | [`136:292`](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=136-292) | Figma Desktop 可选择；`7900×5200`；未覆盖 014 |
| desktop 1440 zh-Hant / en | [`136:341`](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=136-341) / [`136:390`](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=136-390) | 两个 `1440×960` Frame 可定位；桌面繁中 Frame 已放大人工核对 |
| mobile 390 zh-Hant / en | [`136:439`](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=136-439) / [`137:1236`](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=137-1236) | 两个 `390×844` Frame 已导出；完整四边、环形远近、双语截图和下置故事轨已抽查 |
| narrow 320 zh-Hant / en | [`136:484`](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=136-484) / [`137:1281`](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=137-1281) | 两个 `320×844` Frame 已导出；三语入口、CTA、截图和故事轨无横向裁切 |
| reduced motion zh-Hant / en | [`137:1326`](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=137-1326) / [`137:1371`](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=137-1371) | 两个 `390×844` Story 02 settled Frame 已导出；只表达手动瞬时换位后的稳定态 |
| motion phases | [`136:529`](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=136-529) / [`136:563`](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=136-563) / [`136:597`](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=136-597) | Start、+160ms、Settled 三帧已创建 |
| route states | [`136:631`](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=136-631) / [`136:654`](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=136-654) / [`136:685`](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=136-685) | default、candidates、error 三帧已导出；标题与说明间距经插件幂等校正后无重叠 |
| download states | [`136:710`](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=136-710) / [`136:737`](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=136-737) / [`136:752`](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=136-752) | desktop ready、mobile ready、desktop unavailable 已导出；无日期；手机标题与说明间距经插件校正后无重叠 |
| Privacy desktop / mobile | [`136:779`](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=136-779) / [`136:799`](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=136-799) | 真实 Logo、品牌名和返回首页入口已创建 |
| localized screenshot matrix | [`136:819`](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=136-819) | 五故事 × `zh-Hant`/`en` image fill；`zh-Hans` 非像素 reference |

## 6. 本地 Figma 插件合同

新插件必须是 015 独立目录，并满足：

1. `manifest.json`、`code.js`、`ui.html` 和 README 均不引用本机绝对路径；
2. 插件素材通过仓库内受管 Logo 和本地化截图副本导入；
3. 重跑对既有 015 FINAL Section 只做幂等 reference 补齐和已声明几何校正，不替换既有 Frame，也不查找、删除或覆盖 `119:64`；
4. 自测断言 Section 名、顶层节点数、所有关键 Frame 名称、尺寸、五故事 × 两 variant image fill 和无日期文案；
5. 设计使用原生可编辑 Figma 节点，真实截图只作为屏幕 image fill，不把整页扁平化；
6. 失败时停止并保留旧 Section，不留下半套 FINAL 节点。

本轮采用 `Figma Desktop local plugin creation + manual selection + manual PNG export`；MCP 只完成了身份检查，随后因 Starter 调用额度不可用，未完成设计节点 readback。所有 reference 均明确记为 `Figma Desktop manual PNG export`，不声称 MCP/API 导出或 readback。插件在补齐后再次运行显示“新增 0 个 Frame”，证明本轮 reference 补齐可幂等复跑。

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

当前已通过 Figma Desktop 原生 PNG 导出并写入 [`visual-review/manifest.json`](./visual-review/manifest.json)：

- desktop `1440×960`：`zh-Hant`/`en` Story 01；
- mobile `390×844` 与 narrow `320×844`：`zh-Hant`/`en` Story 01；
- reduced-motion：`zh-Hant`/`en` Story 02 settled；
- motion：Start、+160ms、Settled；
- route：default、candidates、error；
- download：desktop ready、mobile ready、desktop unavailable；
- Privacy：desktop、mobile。

共 19 张必需 reference；另保留 mobile `390×844` `zh-Hant` Story 02（节点 `136:861`）作为补充证据。manifest 标记为 `reference-gate-passed`，`pendingReferences` 为空；每项均记录真实节点、像素尺寸、repo-relative path 与 SHA-256。完整判定见 [`visual-review/figma-gate.md`](./visual-review/figma-gate.md)。

## 8. 高保真开门与完成判定

生产 UI 开门前必须同时满足：

1. 新插件自测通过；（已满足：11/11）
2. 新 Section 和所有关键 Frame 在 Figma Desktop 中可真实定位；（已满足，见 §5）
3. reference export/manifest 完整且不含占位、私有路径或伪造节点；（已满足：19/19）
4. 生产实现只允许把上述真实节点写入 `homepageContent.figmaReference.refinement`；（门禁约束已锁定，待实现阶段执行）
5. 本文的“本轮状态”和节点记录表已更新为实际证据。（已满足）

结论：Figma 参考源门禁通过，可以进入生产 UI 实现。本结论只证明设计参考完整，不证明尚未生成的浏览器 actual 已达到像素阈值。

实现完成不以“看起来接近”判定。自动化像素阈值之外，标题分行、真实 Logo、完整手机四边、语言入口、环形远近、故事轨位置、桌面/手机 CTA 语义、无日期和无横向滚动均为零容忍人工复核项。
