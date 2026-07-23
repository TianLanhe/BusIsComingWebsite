# US2 实施报告：稳定性与时延

## 范围

完成 Spec Kit 012 的 T028–T044。未读取、修改或暂存 `backend/downloads/android/BusIsComing.apk` 和 `backend/downloads/android/current.json`。

## TDD 证据

### RED

- Go 应用测试先断言 performance JSON 必须含 `sliSeries`、SLI 空桶 `successRate:null` 与全失败 `successRate:0`；旧实现缺少字段而失败。
- Go HTTP 测试先断言既有 `/api/analytics/performance` envelope 在 `Cache-Control:no-store` 下含 `sliSeries`；旧 DTO 序列化失败。
- React 页面测试先查询 P95/P50 切换按钮；旧页面没有局部选择器而失败。
- `MetricCard` 测试先断言 `durationMs` 的变化为 `+60 ms`；旧实现显示 `+50%` 而失败。

### GREEN

- `SLISeries` 在领域层完成香港桶、固定四事件顺序、请求计数与成功率；应用层只映射 DTO。`null` 表示无请求，`0` 表示全失败。
- `PercentileComparison` 保留 current/previous/delta；任何一侧缺失时 delta 为 null，current 缺失仍保留 previousMs。上一周期为 0 时只输出绝对毫秒差，compare=false 不输出比较值。
- Performance 页面默认 P95，仅本地图切换 P50；SLI 图和端点 P50/P95 比较不受切换影响。端点原始 P50/P95 与「对比上期」分列显示，七种状态均有三语显式说明。
- Dropped 的 system 辅助请求失败时，性能主体继续可用。

## 已验证命令

```text
cd backend && go test ./...
cd backend && go test -race ./internal/analytics/...
cd frontend && npm test
cd frontend && npm run openapi:lint
cd frontend && npm run build
cd frontend && npx playwright test --config playwright.monitor.config.ts --grep 'switches stability|Dropped auxiliary' --reporter=line
```

结果：Go 全量与 analytics race 通过；Vitest 42 files / 175 tests 通过；Redocly feature/shared lint 通过；双 Vite 构建通过；Playwright 全量 27 passed、1 skipped。monitor bundle 的既有 >500kB warning 保留。

## 截图与 Figma 核对

- `frontend/playwright-monitor/__screenshots__/performance-v13-desktop.png`
- `frontend/playwright-monitor/__screenshots__/performance-v13-mobile.png`
- `frontend/playwright-monitor/__screenshots__/performance-v13-en-desktop.png`
- `frontend/playwright-monitor/__screenshots__/performance-v13-zh-Hant-mobile.png`
- `frontend/playwright-monitor/__screenshots__/performance-system-partial-error-desktop.png`
- `frontend/playwright-monitor/__screenshots__/performance-system-partial-error-mobile.png`

按 Figma `89:1310` 核对双图、六卡、端点表和局部选择器；实测桌面表可完整阅读，390px 手机端页面无整体横向溢出，端点表仅在自身容器横向滚动。差异、响应式处理和比较状态记录在 `specs/012-analytics-dashboard-observability/verification-matrix.md`。

## 自查与关注点

- handler 仍只作 query/DTO/envelope 映射，统计保留在领域与应用层；没有新增 endpoint、表、goroutine 或缓存。
- 现有 `analyticsTypes.ts` 与 OpenAPI 已预先声明新前端字段，US2 将后端响应补齐并保持 shared contract lint 通过。
- 提交只包含 US2 文件；已有 APK/current.json 及其他非 US2 截图工作区改动保持未暂存。

## 复审补充：MetricCard 比较格式

- 先新增 `MetricCard.test.tsx` 的 RED 用例：`durationMs` 持平错误显示 `0%`，零基线错误只显示普通「对比上期」。
- `unchanged` 现在复用当前 format：`durationMs` 为 `0 ms`、`percent` 为 `0%`、`count` 为 `0`；零基线使用三语 `comparisonZeroBaseline`，并继续以 `+180 ms` 这类带符号绝对时延差展示。
- 定向 Vitest 15 tests 通过；全量 Vitest 42 files / 177 tests 通过。APK 与 `current.json` 未读取、修改或暂存。
