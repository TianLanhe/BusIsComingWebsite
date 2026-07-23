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

- `SLISuccessRate` 以 `null` 表示无请求、以 `0` 表示全失败；应用层按香港桶和固定四事件顺序输出。
- `PercentileComparison` 保留 current/previous/delta；上一周期为 0 时只输出绝对毫秒差，compare=false 与缺失样本保持 null。
- Performance 页面默认 P95，仅本地图切换 P50；SLI 图和端点 P50/P95 比较不受切换影响。
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

结果：Go 全量与 analytics race 通过；Vitest 42 files / 173 tests 通过；Redocly feature/shared lint 通过；双 Vite 构建通过；Playwright 3 passed、1 skipped（system 辅助失败截图只需 desktop）。monitor bundle 的既有 >500kB warning 保留。

## 截图与 Figma 核对

- `frontend/playwright-monitor/__screenshots__/performance-v13-desktop.png`
- `frontend/playwright-monitor/__screenshots__/performance-v13-mobile.png`
- `frontend/playwright-monitor/__screenshots__/performance-system-partial-error.png`

按 Figma `89:1310` 核对双图、六卡、端点表和局部选择器；差异、响应式处理和比较状态记录在 `specs/012-analytics-dashboard-observability/verification-matrix.md`。

## 自查与关注点

- handler 仍只作 query/DTO/envelope 映射，统计保留在领域与应用层；没有新增 endpoint、表、goroutine 或缓存。
- 现有 `analyticsTypes.ts` 与 OpenAPI 已预先声明新前端字段，US2 将后端响应补齐并保持 shared contract lint 通过。
- 提交只包含 US2 文件；已有 APK/current.json 及其他非 US2 截图工作区改动保持未暂存。
