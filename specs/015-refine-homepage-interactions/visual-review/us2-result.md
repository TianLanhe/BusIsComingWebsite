# US2 验收：语言与对应截图

日期：2026-08-25

## 结论

通过。Hero 首行只保留真实 App Logo、BusIsComing 与直接可见的 `繁 · 简 · EN`；没有独立 Header、下拉菜单或吸顶区域。

## 覆盖

- 三个语言入口均有真实 locale URL、`aria-current` 和至少 44×44 CSS px 命中区域。
- 五故事 × 三语言共 15 种组合全部受测试：`zh-Hant`、`zh-Hans` 固定使用 `zh` 截图集，`en` 固定使用 `en` 截图集。
- 切换语言不 reload I18n 根节点，并保留当前故事、hash/scroll 语义、路线输入与结果、下载 metadata 和已展开 FAQ。
- 目标语言图片失败时保持同一 9:16 外壳和槽位，只显示目标语言失败壳，不回退到另一语言截图。

## 视觉证据

`actual/` 保存 zh-Hant/en 的 1440、390、320 Story 01 浏览器图；`side-by-side/`、`overlay/` 和 `diff/` 与对应 Figma reference 成对。`zh-Hans` 仅完成文本、溢出、横向滚动、触控目标和关键几何验收，不宣称像素级 Figma 对照。
