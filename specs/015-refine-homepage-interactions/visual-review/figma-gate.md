# 015 Figma 参考源门禁

## 结论

**PASS — 可以进入生产 UI 实现。**

本结论只证明 015 的 Figma 参考源、导出 PNG 和追踪清单完整；不证明尚未生成的浏览器 actual 已经通过像素差异验收。实现阶段仍须在相同 viewport 下补齐 `actual/`、`side-by-side/`、`overlay/` 与 `diff/`。

## 已核对设计源

- Figma 文件：`BusIsComing Website — Homepage v1 Spec`
- 015 FINAL Section：`136:292`
- 014 只读基线：`119:64`，本轮没有覆盖或替换
- 生成方式：Figma Desktop 本地插件
- 导出方式：Figma Desktop 原生手动 PNG export
- MCP 状态：Starter 调用额度不可用，未进行节点 readback；本文不宣称 MCP/API 创建或导出
- 幂等性：reference 补齐后再次运行插件，回执为“新增 0 个 Frame”

## 门禁检查

| 检查项 | 结果 | 证据 |
| --- | --- | --- |
| 插件合同与构建测试 | PASS | 设计合同、私有路径防泄漏、19 个 reference、路线与手机下载标题间距均有自动测试 |
| Figma 节点可定位 | PASS | 015 Section 与 19 个 required Frame 均由 Desktop 插件回执给出真实 node ID |
| 必需 reference 完整 | PASS | `manifest.json` 为 `reference-gate-passed`，`referenceCount` 为 19，`pendingReferences` 为空 |
| PNG 像素尺寸 | PASS | 1440×960、390×844、320×844、1440×760、390×700、1440×900 与对应 Frame 一致 |
| PNG 完整性 | PASS | 19 张 required PNG 均非空，repo-relative path 可读，SHA-256 与 manifest 一致 |
| 视觉抽查 | PASS | 19 张 required PNG 逐张查看；Logo、语言入口、标题分行、完整手机边框、环形层次、故事轨、路线三态、下载双端与 Privacy 无裁切或重叠 |
| 禁止项 | PASS | 无独立 Header、抽象 Logo、灵动岛、下载日期、紫色色块、深色底部潮汐或整页缩放 |
| 私有路径与占位 | PASS | 插件构建产物、manifest 与文档不包含一次性截图源目录；reference 不是聊天截图或浏览器占位 |

视觉复核发现并在 Figma 中修复了两个几何问题：路线三态标题与说明重叠、手机下载标题与说明重叠。两项均先加入失败测试，再由幂等插件校正既有 Frame 并重新导出；最终 PNG 已复核无重叠。

## Reference 覆盖

- Hero settled：desktop 1440、mobile 390、narrow 320，各含 `zh-Hant` 与 `en` Story 01；
- reduced motion：mobile 390 的 `zh-Hant` 与 `en` Story 02 settled；
- motion storyboard：Start、+160ms、Settled；
- route trial：default、candidates、error；
- download：desktop ready、mobile ready、desktop unavailable；
- Privacy：desktop、mobile。

另保留 `136:861` 的 mobile 390 `zh-Hant` Story 02 settled 作为补充参考，不计入 19 张 required reference。

## 本地化边界

- `zh-Hant`、`en`：建立像素级 Figma reference；
- `zh-Hans`：共用中文 App 截图，只做文本、溢出、横向滚动、触控目标和关键几何验收；
- 不得把 `zh-Hant` reference 用作 `zh-Hans` 像素级通过证据，也不得宣称存在独立的 `zh-Hans` Figma reference。

## 实现阶段继续执行的门禁

1. `homepageContent.figmaReference.refinement` 只能写入本文件和 manifest 已登记的真实节点；
2. reference 与 actual 使用相同 viewport 与像素密度；
3. 标题分行、真实 Logo、手机完整四边、语言入口、环形远近、故事轨位置、桌面/手机 CTA 语义、无日期和无横向滚动继续按零容忍项人工复核；
4. 自动化像素阈值通过后，仍需保存 side-by-side、overlay、diff 与人工结论。
