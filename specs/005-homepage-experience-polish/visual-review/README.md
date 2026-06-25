# 视觉验收：首页体验精修

本目录保存实现阶段的桌面和手机截图，用于证明首页体验精修没有回到旧的缩略图堆叠形态。

## 必交截图

| 文件 | 视口 | 状态 | 检查项 |
|------|------|------|--------|
| `desktop-1440-carousel-rail.png` | 1440 x 960 | 首屏轮播 | 单主图、左右低强调预览、无底部缩略图、无编号、无常驻箭头 |
| `mobile-390-carousel-rail.png` | 390 x 844 | 首屏轮播 | 轮播和文案上下组织、触控区域可用、无重叠 |
| `desktop-1440-brand-contact.png` | 1440 x 960 | Header + footer 联系入口 | 真实透明 logo、联系入口、真实邮箱 |
| `mobile-390-brand-contact.png` | 390 x 844 | Header + footer 联系入口 | 小屏 logo 清晰、邮箱可点、语言切换不重叠 |

## 验收结论

- 生成命令：`npm --prefix frontend run test:e2e -- hero-carousel.spec.ts homepage-hero.spec.ts homepage-sections.spec.ts homepage-experience-polish.spec.ts`
- 检查日期：2026-06-25。
- 自动化结果：Playwright `desktop-1440` 与 `mobile-390` 共 8 个浏览器测试通过。
- 截图结论：4 张必交截图均已生成；轮播为单主图与低强调相邻预览，没有底部小图堆叠、胶片条、缩略图按钮组、`01/02/03/04` 编号或常驻左右箭头。
- 品牌与联系结论：header、footer 和 favicon 使用 Android foreground icon 裁出的透明巴士主体；桌面和手机均能看到联系入口，页脚邮箱为 `hezhenyu966@gmail.com`。
- 剩余风险：截图为本地 Chromium、1440 x 960 与 390 x 844 的验证结果；其他浏览器差异后续仍应通过常规发布前回归覆盖。
