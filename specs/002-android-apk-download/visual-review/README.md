# Android APK 下载视觉验证记录

本目录保存实现阶段的桌面与手机截图证据。

生成时间：2026-06-16 04:48:10 CST

- `desktop-1440-android-download.png`
- `mobile-390-android-download.png`
- `desktop-1440-download-section.png`
- `iphone-unsupported-state.png`

## 截图结果

| 文件 | 视口/内容 | 结果 |
|------|-----------|------|
| `desktop-1440-android-download.png` | 桌面首屏 Android 可下载展开态 | 通过，无遮挡或截断 |
| `mobile-390-android-download.png` | 手机首屏 Android 可下载展开态 | 通过，无遮挡或截断 |
| `desktop-1440-download-section.png` | 桌面下载区 Android 可下载元数据 | 通过，无遮挡或截断 |
| `iphone-unsupported-state.png` | 桌面首屏 iPhone 暂未支持展开态 | 通过，不触发下载 |

## 验证命令

| 命令 | 结果 |
|------|------|
| `cd backend && gofmt -w cmd/server/main.go internal/downloads/domain/*.go internal/downloads/application/*.go internal/downloads/infrastructure/filesystem/*.go internal/downloads/interfaces/http/*.go && go test ./...` | 通过 |
| `cd frontend && npm run test` | 通过，7 个测试文件、17 个测试 |
| `cd frontend && npm run build` | 通过 |
| `cd frontend && npm run test:e2e` | 通过，桌面和手机共 16 个 Playwright 测试 |
| `cd frontend && npm run openapi:lint` | 通过，无警告 |
| `cd frontend && npm run openapi:bundle` | 通过，生成 `shared/contracts/openapi/download-api.bundle.yaml` |
| `curl -fL -D /tmp/busiscoming-download-check/headers.txt -o /tmp/busiscoming-download-check/BusIsComing.apk http://127.0.0.1:8080/api/downloads/android/latest` | 通过，HTTP 200 |
| `wc -c /tmp/busiscoming-download-check/BusIsComing.apk` | `5009547` |
| `shasum -a 256 /tmp/busiscoming-download-check/BusIsComing.apk` | `93e7930ee9e6b9cc05819bab895153ad985707bdcfff3e6bead60065acf07470` |
| `rg` DDD 禁止依赖检查 | 通过，`domain` 未依赖 Gin、文件系统、HTTP、前端或共享契约 |
| `rg` 前端 bundle 与 manifest 私有路径检查 | 通过，前端未暴露 Android 主项目本机来源路径或 `sourcePath` |
| 页面范围文案复核 | 通过，仅保留香港巴士范围和 iPhone 不下载的排除说明 |

## 备注

- APK 来源已复制到 `backend/downloads/android/BusIsComing.apk`。
- 服务端响应包含 `Cache-Control: no-store`、`Content-Disposition`、`Content-Length`、`X-APK-SHA256`、`X-APK-Version-Name` 和 `X-APK-Version-Code`。
- Android 下载失败时，前端在 5 秒内显示 `role="status"` 的不可用提示。
