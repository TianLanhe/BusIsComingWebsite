# US3 验收：下载承接

日期：2026-08-24

- Hero 与下载段共享同一个 `DownloadMetadataProvider`；checking/unavailable 没有 href，ready 使用原生 `<a download>`。
- 桌面 QR 只在 ready 渲染，并由 metadata 相对 URL 解析出的公开绝对 URL 本地生成；手机 QR 数量为 0。
- 版本、Android 7.1+、大小、更新日期使用同一小字号；不显示 BUILD、SHA、sourcePath、虚假进度或安装完成。
- 下载段为非卡片构图；约 50% 可见后只汇聚一次，离开/重入和语言切换不重播，reduced motion 不观察也不触发。
- download unit 与 `android-download`、`apk-metadata`、`platform-download-states` Playwright 覆盖 1440、390、320 三态边界；视觉基线包含 `download-ready`。
