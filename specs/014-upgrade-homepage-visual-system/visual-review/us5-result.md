# US5 验收：三语、窄屏与无障碍

日期：2026-08-24

- `zh-Hant`、`zh-Hans`、`en` 覆盖 Header、五故事、路线状态、下载状态、FAQ、联系、页尾、alt 和 aria；审校见 `../zh-hant-en-copy-review.md`。
- 语言切换使用稳定 story/FAQ ID，保留当前故事、FAQ、hash 与共享下载 metadata；路线仍沿既有合同进行本地化刷新或保留旧结果。
- Playwright 项目固定为 1440×960、390×844、320×844；三语五故事共 45 张 Hero golden，核心入口不因窄屏隐藏，页面无横向滚动。
- 所有主要手机目标至少 44×44；故事支持 roving focus 与 Arrow/Home/End，FAQ/语言/combobox 使用原生按钮和最小 ARIA。
- reduced motion 关闭持续风带、故事等待和下载汇聚，同时保留静态远近层级和全部操作。
