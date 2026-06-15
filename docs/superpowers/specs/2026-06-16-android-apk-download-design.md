# Android APK 下载设计

**日期**：2026-06-16
**状态**：用户已确认
**范围**：为 BusIsComing 网站增加真实 Android APK 下载流程。

## 背景

当前首页已有 Android/iPhone 分段下载按钮，但 Android 仍显示“下载资源待接入”。Android 主项目现在已有可发布 APK：

`/Users/jianglijie/AndroidStudioProjects/BusIsComming/app/release/BusIsComing.apk`

已读取 APK 元数据：

- App 名称：`BusIsComing`
- Application ID：`com.example.busiscoming`
- versionName：`1.0`
- versionCode：`1`
- 大小：`5,009,547` bytes，约 `4.8 MB`
- SHA-256：`93e7930ee9e6b9cc05819bab895153ad985707bdcfff3e6bead60065acf07470`

## 已确认决策

1. APK 复制到网站仓库中的服务端管理空间，并纳入 git。
2. 用户通过稳定的后端下载入口下载 Android，不直接链接 Android 项目路径。
3. 公共界面展示简短 APK 元数据：`Android APK 1.0` 和约 `4.8 MB`。
4. 服务端管理空间只保留当前 APK 文件。发布新 APK 时替换当前文件，不维护面向用户的历史版本归档。
5. iPhone 继续保持暂未支持，任何 iPhone 操作都不得触发下载。

## 备选方案

### 推荐：后端下载入口 + 当前 APK 文件

前端指向稳定的 Android 下载入口，后端从受管空间返回当前 `BusIsComing.apk`。这样浏览器侧契约稳定，同时保留后续元数据校验、日志记录和发布管理空间。

### 静态文件直链

前端直接链接一个静态 APK 路径。它改动最小，但对缺失文件、元数据校验和后续下载管理的控制较弱。

### Manifest 驱动跳转

前端读取 manifest 后跳转到具体 APK URL。它更灵活，但对当前只有一个 APK 的发布流程来说偏重。

## 设计

本功能建立真实 Android 下载闭环。当前 APK 从 Android 主项目复制到网站后端的受管下载空间。前端下载 manifest 把 Android 从待接入状态改为可下载状态，同时保留现有 Figma 下载按钮交互模型。

用户从首屏或下载区点击 Android 下载后，网站请求后端稳定下载入口，并获得 APK 文件。服务端归属的元数据和共享契约记录版本、大小、哈希、来源路径和更新时间，便于维护者确认正在提供的文件与 Android 构建产物一致。

UI 文案继续三语覆盖。Android 变为可用，并展示简短可信信息。iPhone 保持明显的暂未支持状态且不可跳转。本功能不增加路线规划、实时交通查询或任何非香港巴士交通范围。

## 错误处理

如果受管 APK 缺失，或与期望元数据不一致，网站不得表现为成功下载。用户应看到清楚的不可用或失败状态；维护者应能定位是文件缺失还是元数据校验失败。

## 验证

验证应覆盖：

- 受管 APK 存在，且 SHA-256 与来源 APK 一致。
- 后端下载入口返回当前 APK，文件名和文件内容符合预期。
- 前端 Android 下载状态在 `zh-Hant`、`zh-Hans` 和 `en` 下均为可用。
- iPhone 保持暂未支持，并且不会开始下载。
- 桌面和手机视图中的下载入口都可见、可操作。
- 现有 Figma 下载交互语义保持一致。

