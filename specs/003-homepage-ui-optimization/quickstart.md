# 快速验证：首页 UI 优化

## 前置条件

- Node.js 与 npm 可运行前端命令。
- Go 1.26.x 可运行后端命令。
- Android APK 下载功能已按 `specs/002-android-apk-download` 实现。
- 原始截图位于 `app真实截图/`，实现阶段已生成脱敏副本和截图 manifest。
- Figma 文件可访问：`https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU`。

## 1. 静态契约与单元测试

```bash
npm --prefix frontend test
```

预期结果：

- 首页内容契约测试通过。
- `zh-Hant`、`zh-Hans`、`en` 三语完整性测试通过。
- 下载入口状态测试通过，iPhone 没有下载 URL。
- 4 个核心功能展示项数量、顺序和图集规则通过。
- 单图功能点不会产生空堆叠目标。

## 2. 前端构建

```bash
npm --prefix frontend run build
```

预期结果：

- TypeScript 类型检查通过。
- Vite 构建通过。
- 脱敏截图资产能被正确打包。

## 3. 后端回归

```bash
cd backend
go test ./...
```

预期结果：

- 既有下载 bounded context 测试通过。
- 下载 API 路径和业务语义未因监听地址配置改变。
- HTTP 入口仍启用请求日志和 panic recovery。

## 4. OpenAPI 回归

```bash
npm --prefix frontend run openapi:lint
```

预期结果：

- 既有 `shared/contracts/openapi/download-api.openapi.yaml` lint 通过。
- 本轮没有新增或修改服务端 HTTP API。

## 5. 本地服务与同局域网访问

实现阶段应让前后端支持监听所有本机网络接口。推荐验证命令如下，具体环境变量名以实现为准：

```bash
cd backend
BUS_HTTP_HOST=0.0.0.0 PORT=8080 go run ./cmd/server
```

另一个终端：

```bash
cd frontend
npm run dev -- --host 0.0.0.0
```

获取开发机局域网 IP：

```bash
ipconfig getifaddr en0
```

预期结果：

- 本机可打开 `http://127.0.0.1:5173/`。
- 同一局域网手机或电脑可打开 `http://<开发机IP>:5173/`。
- 页面核心内容、下载入口和展示模块可访问。
- 下载请求仍使用 `/api/downloads/android/latest`，不改 API 路径。

## 6. Playwright 双端验证

```bash
npm --prefix frontend run test:e2e
```

预期结果：

- 桌面 1440px：首屏下载按钮、在线查询按钮、APK 元信息、iPhone 状态完整可读。
- 手机 390px：展示区图上文下，截图堆叠露出区域可触控。
- 首屏主按钮触发 Android APK 下载，不发生锚点跳转。
- 功能展示 10 秒内至少自动切换一次，没有左右箭头。
- hover、focus、pointer/touch 交互期间外层自动轮播暂停。
- 同一功能点内截图只响应用户手动切换。
- 切换语言后当前功能点和主图保持稳定。

## 7. 截图脱敏验收

检查实现阶段生成的截图 manifest，确认：

- 每个展示截图 `desensitizationStatus` 为 `approved`。
- 原始地点、站名、路线号、搜索记录、手机系统无关内容已替换或遮蔽。
- 价格、时间和 ETA 数值仍可见。
- 前端没有直接引用 `app真实截图/` 原图。

建议使用以下搜索辅助：

```bash
rg -n "app真实截图|real-place-name|real-route-number" frontend/src
```

预期结果：

- 前端源码不直接引用 `app真实截图/`。
- manifest 明确记录脱敏项和保留项。

## 8. 繁中与城巴口径抽查

人工抽查 `zh-Hant` 文案：

- 不是 `zh-Hans` 的机械字形转换。
- 语气自然、清楚、可信，不过度口语化或广告化。
- 页面范围聚焦 Citybus / 城巴。
- FAQ 或范围说明明确不支持九巴、港铁、铁路、渡轮、其他交通工具或完整出行规划。
- 价格功能卡片强调多程全程总车费，而不是只强调 HK$ 币种。

## 9. 视觉证据

实现完成后保存截图到：

```text
specs/003-homepage-ui-optimization/visual-review/
├── desktop-1440-hero-v2.png
├── mobile-390-hero-v2.png
├── desktop-1440-download-states-v2.png
├── desktop-1440-feature-carousel-v2.png
├── mobile-390-feature-stack-v2.png
├── language-switch-state-retention.png
└── lan-access-mobile-check.png
```

预期结果：

- 截图与 Figma v2 节点 `10:3`、`10:44`、`10:75`、`10:87` 的信息层级一致。
- 没有文本重叠、按钮文字溢出、截图遮挡说明或堆叠目标不可触控的问题。

## 10. 正式 HTTP 入口验证

正式部署配置下，前端入口可以由服务自身监听、反向代理或端口映射提供。

预期结果：

- 用户通过标准 HTTP 入口打开页面，不需要 `localhost`、`127.0.0.1` 或 `::1`。
- 下载 API 仍由既有后端下载服务提供。
- 若使用反向代理，页面内 API 路径保持同源或明确代理，不泄露本机私有地址。
