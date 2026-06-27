# 视觉验收记录：首页 UI 体验优化补充

本目录保存 `/speckit-implement` 阶段生成的桌面与手机截图证据。截图文件由 Playwright 或手工浏览器验证产生，文件名使用 viewport 前缀。

## 必备截图

- `desktop-1440-feature-carousel.png`：桌面 hero 中等放大截图组、无放大提示器、截图区拖动状态。
- `desktop-1440-feature-rail-lightbox.png`：桌面截图 lightbox、缩放和同功能截图切换。
- `desktop-1440-sections.png`：桌面功能介绍保持现状、页面 section 顺序。
- `desktop-1440-route-results.png`：桌面在线试查路线卡无回归。
- `mobile-390-feature-carousel.png`：手机 hero 截图组和分区手势无明显重叠。
- `mobile-390-feature-rail-lightbox.png`：手机 lightbox 可关闭、可缩放。
- `mobile-390-sections.png`：手机功能介绍 2 列紧凑卡片。
- `mobile-390-route-results.png`：手机路线卡展示路线号/候车状态、站点、车费/耗时/步行指标带。

## 验收重点

- 桌面主截图视觉尺寸比上一版更醒目，后排堆叠图随主图同等放大。
- 生产页面不显示“点击放大”、放大图标或教学提示器。
- 截图区拖动只切同功能截图，文字区拖动才切换功能。
- 手机功能区保持 2 列，卡片高度和行距明显低于旧单列方案。
- 手机路线卡中“车费 / 耗时 / 步行”标签和值同时出现，并且标签和值层级不同。
