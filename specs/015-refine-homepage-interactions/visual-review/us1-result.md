# US1 验收：五故事自动轮播

日期：2026-08-25

## 结论

通过。五个故事共用一个 requested/settled 状态源；标题、说明、前景截图和故事轨最终一致，快速点击不会产生两个前景或陈旧 settled。

## 自动化证据

- `hero-story-controller.test.tsx` 使用 fake timer 覆盖首次 settled 后 10 秒、自动 settled 后 5 秒、手动不同故事/当前故事/语言/暂停恢复后 10 秒，以及 05→01。
- pause reason 可组合为 hover、键盘 focus、offscreen、hidden、reduced-motion；任一原因存在都不创建 dwell timer。
- `hero-carousel.spec.ts` 覆盖五图常驻、最后选择胜出、舞台先行、文案 160ms 后随、reduced motion 即时交换、roving tabindex 与无重复辅助播报。
- 自动切换不移动焦点；只有最终手动 settled 会原子更新一次 live region。

## 实现边界

- 正常转场以目标前景手机 `transform` 完成且目标语言图片 decode/load 或稳定失败壳就绪为 settled；840ms timer 只处理事件丢失。
- 每个最新 settled 只拥有一个 dwell timer；新 epoch、暂停或卸载会取消旧 timer。
- 页面没有显示暂停/播放按钮，符合本轮产品决定，但不据此宣称完整满足 WCAG 2.2.2。
