# 快速开始：统一 Android APK 下载入口

## 1. 前置条件

- 当前分支：`feat/013-unify-apk-download`
- Node.js/npm 可运行，`frontend/node_modules` 已安装
- Go 1.26.3 可运行
- `backend/downloads/android/current.json` 与 APK 是有效测试事实
- 不覆盖工作区中用户已有的 APK/元数据改动

## 2. 实现前门禁

1. 打开 [figma.md](./figma.md)，从既有 Homepage v1 Spec 根节点 `108:2` 定位 `v1.4` 状态板，
   并对照本地 1440/390 截图。
2. 对照 [contracts/download-entry-state-contract.md](./contracts/download-entry-state-contract.md)。
3. 先修改测试，确认旧 Blob 实现在新增断言下失败。

### 2.1 旧实现 Android Chrome 基线

- 验证时间：2026-07-30
- 设备：`emulator-5556`，Chrome `133.0.6943.137`
- 页面：`http://localhost:5178/zh-hant/#download`，通过
  `adb reverse tcp:5178 tcp:5178` 连接本地前端
- 入口：页面中下部 `下載 Android APK` 按钮
- 旧实现证据：按钮点击处理器先 `fetch` 整个 APK，再转为 `Blob` 并通过
  `URL.createObjectURL` 触发临时链接
- 本地结果：回环网络较快，点击后约 1 秒显示 Chrome 的 `File downloaded`
  提示，未复现线上环境的 99% 卡住；这不改变旧实现必须在浏览器内完整缓冲 APK
  后才交给下载管理器的风险判断
- 文件核对：下载文件为 `5,937,523` 字节，SHA-256 为
  `1f6807118d64df6fe06915160160d7f6a42b6a3a8fba1a416371c8d925638350`，
  与当前 `BusIsComing.apk` 和 `current.json` 一致
- 截图：
  [点击前](./evidence/android-before-middle.png)、
  [完成提示](./evidence/android-before-middle-complete.png)

> 设备归属补充：以上是新增模拟器使用规定前保存的旧环境参考，不作为 T021 最终验收证据。
> 后续不得使用已经开启且可能由其他任务占用的 `emulator-5554`/`emulator-5556`；
> 必须为本任务新开独立模拟器实例，使用完主动关闭。若无法安全新开，则等待现有实例关闭。

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

实施时必须重新检查实际设备状态，并为本任务启动新的独立模拟器；不得接管已经开启的实例。
下面的变量必须指向本任务刚启动并记录归属的实例；不得填写 `adb devices` 中原本已经存在的
serial。

```bash
adb devices -l
TASK_EMULATOR_SERIAL=emulator-5558
adb -s "$TASK_EMULATOR_SERIAL" reverse tcp:5178 tcp:5178
adb -s "$TASK_EMULATOR_SERIAL" shell am start \
  -a android.intent.action.VIEW \
  -d http://localhost:5178/en/
```

手动验收：

- 从页面中下部点击可用入口；
- Chrome 下载管理器接管，不出现页面内 99%；
- 文件大小与 `current.json` 一致；
- 再从顶部重复，行为和结果一致；
- metadata 不可用时两处均不能发起 APK 请求。

若模拟器或实机不可用，必须明确记录未完成，不得只用桌面移动视口替代。

### 7.1 T021 实测记录

- 验证时间：2026-07-30
- 专用实例：本任务新开的 `Pixel_9_API_36_1`，serial `emulator-5558`，Android 16，
  Chrome `134.0.6998.135`
- 启动隔离：独立端口 `5558`、`-read-only`、`-no-snapshot`、无窗口模式；启动前从宿主机
  确认 `Pixel_9_API_36_1` 未被现有实例占用
- 既有实例：`emulator-5554` 与 `emulator-5556` 始终视为他人占用，未连接、未安装、
  未截图、未关闭
- 本地连接：仅对 `emulator-5558` 建立 `tcp:5178` reverse 和 Chrome DevTools
  `tcp:9223` forward
- 环境说明：新实例首次启动时系统把网络标记为 `PARTIAL_CONNECTIVITY`，导致 Chrome
  自身显示“正在等待下载”；在该专用实例中关闭 captive portal 检查并重启 Wi-Fi 后，
  `dumpsys connectivity` 显示 `VALIDATED`。取消环境故障产生的待处理项后，再分别执行两次
  最终验收
- 顶部入口：Chrome 原生提示“已完成 1 项下载”，显示 `5.66 MB`，页面停留原位，
  没有页面内进度或 99%
- 中下部入口：滚动到 `#download` 后独立点击，Chrome 再次原生提示“已完成 1 项下载”，
  显示 `5.66 MB`，行为与顶部一致
- 传输核对：两次最终请求均由后端结构化日志记录为
  `GET /api/downloads/android/latest`、`status=200`、`bodySize=5937523`；
  响应头 `Content-Length: 5937523`、`Content-Disposition: attachment;
  filename="BusIsComing.apk"`、`X-APK-SHA256:
  1f6807118d64df6fe06915160160d7f6a42b6a3a8fba1a416371c8d925638350`
  与当前 APK/metadata 一致
- unavailable：在 Android Chrome 中把 metadata 请求稳定模拟为 503 后，两处均为原生
  disabled button、`aria-disabled="true"`，没有 APK `href`、`download` 或 `blob:` 链接
- 清理：验收后移除 `emulator-5558` 的 reverse/forward，并用
  `adb -s emulator-5558 emu kill` 主动关闭；最终 `adb devices -l` 只剩原有的
  `emulator-5554` 与 `emulator-5556`
- 证据：
  [顶部下载完成](./evidence/android-t021-hero-complete.png)、
  [中下部点击前](./evidence/android-t021-before-middle.png)、
  [中下部下载完成](./evidence/android-t021-middle-complete.png)、
  [顶部 unavailable](./evidence/android-t021-unavailable-hero.png)、
  [中下部 unavailable](./evidence/android-t021-unavailable-middle.png)

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

### 9.1 T025 全量验证记录

验证时间：2026-07-30。

- OpenAPI：`npm run openapi:lint`、`npm run openapi:bundle`、
  `npm run openapi:docs` 均通过；共享主契约、兼容镜像、bundle 与中文 API UI
  已从 feature 权威源重新生成或同步。
- 目标 Vitest：下载动作、入口与三语测试共 `14/14` 通过；最终代码审查补充的
  metadata 契约边界测试为 `15/15` 通过。
- 构建：`npm run build:public` 通过；随后 `npm run build` 的 public 与 monitor
  两套生产构建均通过。monitor 仍有既有的单 chunk 大于 500 kB 提示，不影响构建退出码。
- 目标 Playwright：`apk-metadata.spec.ts` 在 desktop-1440 与 mobile-390 共
  `21` 项通过，`1` 项仅因 981px 断言不适用于 mobile-390 项目而按设计跳过。
- 稳定性：`android-download.spec.ts` 在 desktop-1440 与 mobile-390 各重复
  `20` 轮，共 `40` 项测试、`80` 个 APK 下载；顶部和中下部每次均核对字节数与
  SHA-256，全部通过。
- 全量 Vitest：最终树共 `43` 个测试文件、`217` 项测试全部通过。
- 全量 Playwright：首次运行发现旧 Hero 回归仍匹配改版前的
  `Android APK …` 文案格式；将其收敛为在实际下载链接内断言
  `Version … · … MB` 后，定向 `2/2` 与全量 `47` 项均通过，`1` 项按上述规则跳过。
- 后端：`go test ./internal/downloads/...` 以及包含公开 HTTP 归因、recovery 与日志
  适配层的扩展回归均通过。
- 最终代码审查：补齐 `versionName` 的 OpenAPI `maxLength: 64` 运行时校验和
  `lastUpdated` 的真实日历日期校验，并删除未使用的旧单态类型；两个新增用例先失败、
  修复后通过，复审结论为 `APPROVED`。
- 环境说明：Playwright 启动后端时私有监听器因本机已有监听端口而记录
  `serve_failed`，公开测试监听器正常可用，所有下载与页面用例均通过；没有把该环境日志
  误判为产品失败。
