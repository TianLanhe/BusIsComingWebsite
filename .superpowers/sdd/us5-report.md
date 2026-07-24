# US5 实施报告：访客调查与三组导航

**范围**：T079–T087（012 analytics dashboard observability）

## 交付结果

- 访客页按 Figma 顺序展示首次出现、最后出现、会话、累计事件四卡；“访客偏好”只保留语言、平台、装置。事件构成、完整 22 位 ID 校验与复制反馈、返回事件明细以及 30 分钟会话时间线均保留。
- 后端访客调查继续使用完整历史计算构成、偏好、首末时间和会话总数；返回的会话时间线严格服从事件 cursor/limit。语言、装置与下载平台并列时按稳定字符串顺序决出；没有下载归因时平台为 `null`。
- `DashboardShell` 使用单一 `navGroups`，为桌面侧栏、手机抽屉和三组底栏入口提供业务监控（总览/流量与试查/下载分析）、技术监控（稳定性及延迟/系统状态）、数据明细（事件明细/访客明细）共七页路由。
- 三语更新为自然的繁中、简中、英文；语言切换不会重置调查 Visitor、日期范围或筛选。访客与性能用户可见页名分别为“访客明细 / Visitor detail”和“稳定性 & 时延 / Stability & latency”。

## TDD 证据

- RED：`limit=1` 的 Go 回归先失败，暴露旧实现只返回分页事件所属的单事件会话；访客卡顺序和三组导航的 Vitest 先失败，暴露旧的混排访客事实与两组导航。
- GREEN：后端 targeted application tests、Visitor/accessibility Vitest 与 monitor build 均通过；随后完成全量 Go、Vitest 与双 viewport Playwright 回归。

## 验证

```text
go -C backend test ./...
# passed

npm --prefix frontend test
# 42 files, 195 tests passed

npm --prefix frontend run build:monitor
# passed; only existing Vite bundle-size warning

npm --prefix frontend run openapi:analytics:lint
# passed

npm --prefix frontend run test:e2e:monitor -- --reporter=line
# 38 passed
```

视觉证据：

- `frontend/playwright-monitor/__screenshots__/visitor-v13-desktop.png`
- `frontend/playwright-monitor/__screenshots__/visitor-v13-mobile.png`

两张截图按 Figma `89:1310` 的 System & Visitor Details 和 Mobile Observability 画板核对；手机视图没有页面级横向滚动，导航与访客操作维持至少 44px 触控目标。

## 审查修复

- Visitor 摘要、偏好与会话总数仍从完整历史派生；`sessions[].events` 严格只返回当前 `cursor/limit` 页。Go 回归覆盖 `limit=1` 的第一页和第二页，防止私有接口隐式无上限返回。
- 三语七页 E2E 改为真实点击桌面侧栏、手机抽屉与三组底栏，不再直接改写 hash；同时断言分组、七链接、当前项与 44px 操作。
- 真实语言切换 E2E 覆盖已应用日期、event/outcome、compare、未提交日期第 2 步、P50 与当前页面；既有调查流覆盖 Visitor 保持。
- 移动端改用非 sticky topbar 并加入 safe-area 底部留白，解决 390 截图顶部空白；操作文案统一为“查看访客明细 / 查看訪客明細 / View visitor detail”。

## 复审补充

- `DerivedSession` 的 `startedAt`、`endedAt`、`durationMs` 和 `eventCount` 固定来自完整历史会话；只有 `events` 会按 cursor 页面过滤。`limit=1` 第一页和第二页均返回完整的会话元数据与一个可见事件。
- 状态保持 E2E 在 1440 和 390 都明确断言语言切换后 compare checkbox 仍为未选中。

可复现命令：

```text
go -C backend test ./internal/analytics/application -run TestQueryDetailsVisitorUsesCompleteHistoryForCompositionAndCommonPlatform -count=1
go -C backend test -race ./...
npm --prefix frontend test
npm --prefix frontend run build:monitor
npm --prefix frontend run openapi:analytics:lint
npm --prefix frontend run test:e2e:monitor -- --reporter=line
```

最近全量结果：Go race 通过；Vitest 42 files、195 tests 通过；Playwright 38 tests 通过。
