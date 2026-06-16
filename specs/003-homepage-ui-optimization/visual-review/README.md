# 视觉验收截图清单

实现完成后在本目录保存以下证据：

- `desktop-1440-hero-v2.png`：桌面首屏整体效果。
- `mobile-390-hero-v2.png`：手机首屏整体效果。
- `desktop-1440-download-states-v2.png`：下载按钮和下载区状态。
- `desktop-1440-feature-carousel-v2.png`：4 个功能点自动轮播状态。
- `mobile-390-feature-stack-v2.png`：手机端截图堆叠手动切换状态。
- `language-switch-state-retention.png`：语言切换后保留当前功能点和主图。
- `lan-access-mobile-check.png`：同局域网访问验证截图。

本轮实现阶段实际由 Playwright 生成并保留了桌面端与移动端首屏、下载状态、功能轮播、截图堆叠、在线查询和后续内容区截图。语言切换状态通过 Playwright 行为断言验证；局域网访问通过 `0.0.0.0` 监听配置、Playwright webServer 配置和 quickstart 命令记录验证。
