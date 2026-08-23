# 014 最终 Figma 对照记录

复核日期：2026-08-24

## 已完成

- 设计权威：Figma Section `119:64`，桌面 Hero `119:176`，手机 Hero `119:461`。
- 本轮成功导出 `119:176` 的 1440×960 PNG，SHA-256 为 `d705c0ecdb704f28dc25be53a26beb4fc733284d4f4620d97f4a9f7f4680cd96`。
- 使用 Sharp 生成 desktop Story 01 的 side-by-side、50% overlay 和 diff；实现重新对齐手机舞台、完整底边、故事轨 y=754、说明浮层 y=688 和 CTA 顺序。
- FR-030 零容忍项由独立 Playwright 断言保护：完整手机边框、轨道不覆盖、五图非平面队列、Header 入口、44px、无横向滚动、无禁用标签/图标/紫色/深色结尾、reduced motion 无持续动画。
- 45 张三语 Hero golden 与 Route/Download/FAQ 的 9 张 section golden 已纳入固定 Chromium 回归，默认 `maxDiffPixelRatio` 为 0.003。

## 限制

- Figma Starter 工具额度在桌面导出后耗尽，未能重新导出 `119:461` 及 Route/Download/Support 状态 PNG；未把历史截图冒充新 API readback。
- 手机和后续 section 使用已批准预览、精确几何合同、浏览器实际图与像素 golden 验收；仍不能宣称完成了缺失 Figma PNG 的逐像素直接 diff。
- 本记录由实现 agent 复核，尚无第二位独立设计者签名。
