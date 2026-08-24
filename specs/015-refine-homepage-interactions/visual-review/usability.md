# 015 可用性与可访问性复核

日期：2026-08-25

## 已完成

- 用户在本轮设计讨论中逐轮确认桌面/手机首屏、环形手机舞台、故事轨位置、第三屏下载和删除 Header 的方向；实现以最终 Figma reference 而非聊天临时图为准。
- 键盘可访问故事轨、语言入口、FAQ 和主要行动；故事轨支持 Arrow/Home/End 与 roving tabindex。
- 三语入口一次可达，核心触控目标至少 44×44；自动切换不抢焦点，后景手机从辅助技术树隐藏。
- desktop/mobile 下载路径、route swap 四状态、Privacy 返回、resize/orientation 状态保持均有浏览器自动化。
- reduced motion 下仍可手动读取全部五故事。

## 已知限制

- 按用户确认，本轮不显示暂停/播放按钮。hover、键盘 focus、offscreen、hidden 与 reduced-motion 能暂停轮播，但触屏用户没有显式永久停止 autoplay 的操作；这可能低于 WCAG 2.2.2 的严格解释。
- 未组织新的外部首次访问者样本或第二位独立设计者签名，不能把实现者复核冒充独立可用性研究。
- 未启动任务专属 Android emulator；手机证据来自固定 Chromium viewport，不宣称真实 Android WebView/浏览器矩阵已完成。
