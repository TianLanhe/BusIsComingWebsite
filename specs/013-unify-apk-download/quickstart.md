# 快速开始：统一 Android APK 下载入口

## 1. 前置条件

- 当前分支：`feat/013-unify-apk-download`
- Node.js/npm 可运行，`frontend/node_modules` 已安装
- Go 1.26.3 可运行
- `backend/downloads/android/current.json` 与 APK 是有效测试事实
- 不覆盖工作区中用户已有的 APK/元数据改动

## 2. 实现前门禁

1. 打开 [figma.md](./figma.md)，确认状态板已经导入 Figma Draft 并回填关键节点 ID。
2. 对照 [contracts/download-entry-state-contract.md](./contracts/download-entry-state-contract.md)。
3. 先修改测试，确认旧 Blob 实现在新增断言下失败。

## 3. 窄范围验证

```bash
cd frontend
npm run test:unit -- src/tests/download-button.test.tsx src/tests/download-metadata-provider.test.tsx
npm run build:public
```

重点断言：

- checking/unavailable 的两处入口没有 APK `href`；
- ready 的两处入口具有同一 `href` 和元数据文件名；
- 点击不对 APK URL 调用 `fetch`；
- 不调用 `URL.createObjectURL`/`URL.revokeObjectURL`；
- StrictMode、双入口和语言切换仍只请求一次 metadata。

## 4. OpenAPI 与共享契约

```bash
cd frontend
npm run openapi:lint
npm run openapi:bundle
npm run openapi:docs
```

确认：

- feature 权威源、shared primary 和兼容镜像语义一致；
- bundle 由命令生成；
- HTML API UI 的项目可控说明为中文；
- path/schema/error code 无非预期变化。

## 5. 浏览器 E2E

```bash
cd frontend
npx playwright test playwright/android-download.spec.ts playwright/apk-metadata.spec.ts \
  --project=desktop-1440 --project=mobile-390
```

场景：

1. metadata ready 时分别点击 Hero 和中下部入口，保存文件并核对建议文件名、字节数、SHA-256。
2. metadata 404/500/网络失败/非法 JSON/非法字段时，两处入口不可操作，APK 请求为 0。
3. DOM 中不存在 APK `blob:` URL，点击前页面不请求 APK。
4. 三语与 1440/390 下无水平滚动、文字遮挡或小于 44px 的主要操作区域。

## 6. 后端回归

本功能不改后端，但应确认公开下载语义未回退：

```bash
cd backend
go test ./internal/downloads/...
```

## 7. 真实 Android Chrome

规划时 `adb devices -l` 显示 `emulator-5556` 可用；实施时必须重新检查实际设备状态。

```bash
adb devices -l
adb -s emulator-5556 reverse tcp:5173 tcp:5173
adb -s emulator-5556 shell am start \
  -a android.intent.action.VIEW \
  -d http://127.0.0.1:5173/zh-hant/
```

手动验收：

- 从页面中下部点击可用入口；
- Chrome 下载管理器接管，不出现页面内 99%；
- 文件大小与 `current.json` 一致；
- 再从顶部重复，行为和结果一致；
- metadata 不可用时两处均不能发起 APK 请求。

若模拟器或实机不可用，必须明确记录未完成，不得只用桌面移动视口替代。

## 8. 全量前端回归

```bash
cd frontend
npm run test:unit
npm run build
npm run test:e2e
```

## 9. 完成证据

- 更新后的 Figma 节点与版本记录；
- 1440/390 三态截图；
- Vitest、Playwright、OpenAPI、Go 命令结果；
- Android Chrome 下载截图或录屏、文件字节数与 SHA-256；
- `git diff --check` 和仅包含本功能文件的提交。
