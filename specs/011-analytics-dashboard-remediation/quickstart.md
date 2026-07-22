# 快速开始：监控 Dashboard 体验修复

本文用于实现和验收 011。命令均从仓库根目录执行；不要提交或覆盖用户现有的
`backend/downloads/android/BusIsComing.apk` 与 `current.json` 改动。

## 1. 环境检查

```bash
git branch --show-current
node --version
npm --prefix frontend --version
go version
```

预期分支为 `feat/011-analytics-dashboard-remediation`。前端依赖已包含 React 18、TypeScript 5、Vite 6、Recharts 3、Vitest 2、Playwright 1.49 和 Redocly 2；后端以 `backend/go.mod` 的 Go 1.26.3、Gin 1.12、modernc SQLite 1.54 为准。

如尚未安装前端依赖：

```bash
npm --prefix frontend install
```

## 2. 先验证权威契约

```bash
npm --prefix frontend exec -- redocly lint specs/011-analytics-dashboard-remediation/contracts/analytics-monitoring-api.openapi.yaml
npm --prefix frontend exec -- redocly bundle specs/011-analytics-dashboard-remediation/contracts/analytics-monitoring-api.openapi.yaml -o /tmp/busiscoming-011-analytics.bundle.yaml
```

实施完成后还必须同步 shared 权威副本并生成中文 API UI：

```bash
npm --prefix frontend run openapi:lint
npm --prefix frontend run openapi:bundle
npm --prefix frontend run openapi:docs
```

实现阶段先把 `frontend/package.json` 中 feature lint/bundle 路径从 010 切到 011；shared 文件同步后再运行上述聚合命令。

## 3. 推荐的测试驱动顺序

### 3.1 日期与公开 Vite 入口

先写失败测试，再实现：

```bash
npm --prefix frontend test -- --run src/monitoring/model/dateRange.test.ts
npm --prefix frontend test -- --run src/tests/viteRootRedirect.test.ts
```

覆盖：

- 香港 00:30 的近 7/30/90 天边界与准确日期数。
- 浏览器在非香港时区、跨月和跨年。
- 自定义首尾包含、历史结束日、今天结束日和非法范围。
- 刷新推进包含今天的 `to`，固定历史范围不漂移。
- dev/preview GET/HEAD 精确 `/` 返回 302，非根路径不受影响。

### 3.2 后端读模型与 SQLite

```bash
go -C backend test ./internal/analytics/domain/...
go -C backend test ./internal/analytics/application/...
go -C backend test ./internal/analytics/infrastructure/sqlite/...
go -C backend test ./internal/analytics/interfaces/http/...
```

覆盖：四类成功事件 P95、无样本 null、上一周期无匹配事件时 `previousValue/delta/deltaRate` 全部为 null、逐日桶、完整范围事件摘要、游标不影响摘要、访客事件构成、无下载平台 null、统一错误映射和隐私 sentinel。

### 3.3 图表、指标卡和详细页面

```bash
npm --prefix frontend test -- --run src/monitoring
```

重点断言：

- 指标卡持平/无同期/关闭比较三种文案与无装饰节点。
- 通用图表图例、X/Y 轴、共享 Tooltip、键盘焦点、隐藏表格和无可见摘要。
- 热力图实际日期数、补位格、事件/UV Tooltip 和内部滚动。
- 事件完整摘要、Visitor ID/复制、会话、性能页局部降级、系统配置事实。

## 4. 本地运行

### 4.1 后端公开与私有监听器

准备有效匿名签名密钥后启动：

```bash
cd backend
BUS_ANALYTICS_VISITOR_SECRET='<至少 32 字节的本地调试密钥>' go run ./cmd/server
```

默认公开 API 为 `127.0.0.1:8080` 或当前环境配置端口，私有监控 API 为 `127.0.0.1:18081`。不要把私有监听器改为公网地址。

### 4.2 公开主页 Vite

另开终端：

```bash
npm --prefix frontend run dev -- --port 5173 --strictPort
```

验收：

```bash
curl -I http://127.0.0.1:5173/
curl -I http://127.0.0.1:5173/zh-hant/
curl -I http://127.0.0.1:5173/api/downloads/android/latest/metadata
```

只有第一条应为 302 且 Location 为 `/zh-hant/`。

### 4.3 私有 Dashboard Vite

再开终端：

```bash
npm --prefix frontend run dev:monitor -- --port 5174 --strictPort
```

打开 `http://127.0.0.1:5174/`。监控 Vite 根路径不参与公开主页重定向。

## 5. 自动化验收

```bash
npm --prefix frontend test
go -C backend test ./...
npm --prefix frontend run build
npm --prefix frontend run test:e2e
npm --prefix frontend run test:e2e:monitor
```

监控 Playwright 必须至少覆盖：

- 香港 00:30 当天数据与刷新推进。
- 7/30/90、自定义日期和三语校验。
- 1440×1200、390×844 的三语工作区截图。
- 图例、坐标、Tooltip、热力图滚动和无可见数据摘要。
- 四个详细工作区、loading/no data/no results/普通失败/存储不可用。
- 性能页 system 辅助查询失败的局部降级。
- 先设置自定义日期、筛选和 Visitor ID，再切换三语、工作区并触发失败重试；每一步均保持调查上下文。
- 契约测试拒绝旧 `weekday/hour` Heatmap item，构建/部署检查确认私有后端与 `dist-monitor` 来自同一发布物。

## 6. Figma v1.2 差异画板

v1.2 已由用户导入，真实批次锚点为 [80:151](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=80-151&t=pXavKmVnFOvABrsi-0)。如需重新导入或核对源画板，可启动导入包：

```bash
python3 -m http.server 59337 --bind 127.0.0.1 \
  --directory docs/superpowers/prototypes/2026-07-23-analytics-dashboard-remediation-figma-import
```

按导入包 README 和 manifest 导入四张画板；用户提供真实节点链接后更新
`specs/011-analytics-dashboard-remediation/figma.md`。实施视觉对照同时引用：

- v1.1 完整页面节点 `63:2118`。
- v1.1 补充状态节点 `67:672`。
- v1.2 真实导入批次锚点 `80:151`。

禁止为尚未机器读取的四张子画板编造独立节点 ID。

## 7. 性能与隐私验收

使用 SQLite 测试 fixture 或已有基准构造接近 100 万明细行，运行：

```bash
BUS_RUN_MILLION_ROW_TEST=1 go -C backend test -run 'Test.*Performance|Test.*Million' -count=1 ./internal/analytics/infrastructure/sqlite/...
```

目标是核心查询与访客时间线 95% 在 1 秒内完成。若不满足，先检查 SQL 过滤复用、游标和既有索引；确需新普通索引时新增 `002_add_analytics_query_indexes.sql` 并验证旧数据库迁移，绝不修改已执行的 `001_create_analytics_events.sql`，也不得新增汇总表或缓存明细。

最终确认：

- 没有新增 IP、指纹、完整 UA/Referrer、查询内容或敏感系统信息。
- 没有新增汇总表、清理、备份、导出、删除或编辑逻辑。
- 监控失败时公开主页、试查与 APK 下载测试仍通过。
- `git diff --check` 无格式错误，提交范围不包含 APK/版本文件。
