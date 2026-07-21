# 网站匿名访问统计规格修订实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按已确认设计修复 C1、C2、C3、I1、A1，使 Figma 证据、OpenAPI 权威源、用户故事职责、中间件装配和统计写入时限在实现前一致且可验证。

**Architecture:** 保留现有 10 张 Pulse 画板和现有 Spec Kit 文档结构，增量追加 3 张可导入画板与 1 份 feature route OpenAPI；再以 feature 契约单向同步、engine factory 注入点和所属用户故事首次实现三语为唯一叙述，最后重写原任务条目而不重编号。本文只修订规格与设计证据，不实现业务代码、不部署服务。

**Tech Stack:** Markdown、OpenAPI 3.1 YAML、原生 HTML/CSS/JavaScript、Playwright 截图、Redocly CLI、Python/Node 结构断言、Git。

## 全局约束

- 设计依据为 `docs/superpowers/specs/2026-07-22-analytics-spec-remediation-design.md`。
- 只处理 C1、C2、C3、I1、A1；不主动修正 I2 的全局“四类/五类”措辞，也不修改 I3 涉及的 Android 主项目绝对路径。
- 旧 10 张 Figma 导入画板的 screen、名称、尺寸和坐标保持不变；新增画板只能追加到同一 `Website Analytics / v1` 页面。
- 三份 feature OpenAPI 是设计阶段权威源；shared 契约只接受实现阶段的单向同步，不反向成为规格来源。
- 修改仓库文本文件一律使用 `apply_patch`；截图等机械生成产物由 Playwright 生成。
- 每个任务只提交本任务列出的文件；若发现无关工作区改动，先停下并确认归属。

---

## 文件结构

- Modify `docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/manifest.json`: 版本升级为 v1.1 并追加 3 张画板。
- Modify `docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/app.js`: 新增移动调查、移动 APK 和普通查询失败 renderer。
- Modify `docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/styles.css`: 新增 390px 调查/APK 与 1440px 失败状态样式。
- Modify `docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/README.md`: 更新导入顺序、版本和验收锚点。
- Create `docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/screenshots/mobile-investigation.png`。
- Create `docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/screenshots/mobile-apk.png`。
- Create `docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/screenshots/query-failure.png`。
- Create `specs/010-website-analytics/contracts/route-query-api.openapi.yaml`: route 查询的 feature-scoped 权威契约。
- Modify `specs/010-website-analytics/spec.md`: 三份 feature 契约、v1.1 设计证据和量化 deadline。
- Modify `specs/010-website-analytics/plan.md`: 契约单向关系、13 张画板、三语故事职责、factory 注入和 deadline。
- Modify `specs/010-website-analytics/research.md`: 记录 `ANALYTICS_WRITE_TIMEOUT_MS` 的默认值、边界与降级语义。
- Modify `specs/010-website-analytics/quickstart.md`: 增加 OpenAPI、截图、middleware 和 deadline 验证矩阵。
- Modify `specs/010-website-analytics/figma.md`: 追溯 13 张画板和 v1.1 补充导入。
- Modify `specs/010-website-analytics/contracts/public-tracking-context.contract.md`: 明确量化写入时限与单向契约同步。
- Modify `specs/010-website-analytics/tasks.md`: 在原 T001–T123 编号中消除 C2/C3/I1/A1 冲突并引用 C1 新画板。

---

### 任务 1：追加 Pulse v1.1 的三张可导入设计画板

**Files:**
- Modify: `docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/manifest.json`
- Modify: `docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/app.js`
- Modify: `docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/styles.css`
- Modify: `docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/README.md`
- Create: `docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/screenshots/mobile-investigation.png`
- Create: `docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/screenshots/mobile-apk.png`
- Create: `docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/screenshots/query-failure.png`

- [ ] **步骤 1：运行画板完整性断言并确认当前失败**

Run:

```bash
python3 - <<'PY'
import json
from pathlib import Path

path = Path("docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/manifest.json")
manifest = json.loads(path.read_text())
expected = {
    "mobile-investigation": (390, 1640),
    "mobile-apk": (390, 1200),
    "query-failure": (1440, 1000),
}
actual = {frame["screen"]: (frame["width"], frame["height"]) for frame in manifest["frames"]}
assert manifest["version"] == "2026-07-22"
assert len(manifest["frames"]) == 13
for screen, viewport in expected.items():
    assert actual[screen] == viewport
PY
```

Expected: FAIL，因为当前 manifest 版本为 `2026-07-20` 且只有 10 张画板。

- [ ] **步骤 2：升级 manifest 并只追加新画板**

将顶层元数据改为：

```json
{
  "name": "BusIsComing Pulse v1.1",
  "version": "2026-07-22",
  "figmaFileKey": "LAm6RjzFuFHsHFlcipx8pU",
  "targetPage": "Website Analytics / v1",
  "baseUrl": "http://127.0.0.1:59337/index.html?screen="
}
```

保持前 10 个 frame 对象逐字不变，在数组末尾追加：

```json
{ "screen": "mobile-investigation", "frameName": "11 Pulse / Mobile Investigation / 390", "width": 390, "height": 1640, "x": 1280, "y": 4280 },
{ "screen": "mobile-apk", "frameName": "12 Homepage / Mobile APK Metadata States / 390", "width": 390, "height": 1200, "x": 1750, "y": 4280 },
{ "screen": "query-failure", "frameName": "13 Pulse / Query Failure State / 1440", "width": 1440, "height": 1000, "x": 2240, "y": 4280 }
```

- [ ] **步骤 3：实现三个 renderer，复用现有 Pulse 组件和 tokens**

在 `app.js` 中新增并注册：

```js
function mobileInvestigation() {
  return `<div class="board mobile mobile-investigation">
    <header class="mobile-head"><div class="mobile-title-row"><div class="mobile-brand"><span class="mobile-mark">B</span><span>BusIsComing Pulse</span></div>${badge("调查模式", "info")}</div></header>
    <main class="mobile-content">
      <div class="eyebrow">事件明细 · 手机</div><h1>匿名访问调查</h1>
      <section class="mobile-filter-stack" aria-label="事件筛选"><div><span class="filter-chip active">近 30 天</span><span class="filter-chip">事件：全部⌄</span></div><div><span class="filter-chip">结果：失败⌄</span><span class="filter-chip">语言⌄</span><span class="filter-chip">设备⌄</span></div></section>
      <div class="privacy-note"><span class="lock">◇</span><span>只显示允许的匿名字段；不保存 IP、查询词、地点、坐标、Cookie 或完整 User-Agent。</span></div>
      <section class="mobile-event-cards" aria-label="匿名事件明细"><article class="card card-pad mobile-event-card"><b>时间</b><span>2026-07-20 09:15:12</span><b>事件</b><span>route_query</span><b>Visitor ID</b><span class="mono">4e22…19af</span><b>结果</b><span>${badge("502 · 失败", "error")}</span><b>耗时</b><span>2.10s</span></article><article class="card card-pad mobile-event-card"><b>时间</b><span>2026-07-20 09:13:07</span><b>事件</b><span>place_query</span><b>Visitor ID</b><span class="mono">bd70…c412</span><b>结果</b><span>${badge("200 · 成功", "success")}</span><b>耗时</b><span>355ms</span></article></section>
      <section class="card card-pad mobile-visitor-search" aria-label="匿名访客精确搜索"><div class="card-head"><div><h2 class="card-title">精确查找 Visitor ID</h2><div class="card-note">仅维护者主动输入完整值时匹配</div></div></div><div class="control mono">a83f9273d84c4b2e9d819db05fe092d1</div><button class="control primary" type="button">查找匿名访客</button><button class="control" type="button">复制完整 ID</button></section>
      <p class="copy-feedback" aria-live="polite">已复制完整 Visitor ID</p>
      <section class="card card-pad mobile-timeline" aria-label="会话时间线"><div class="card-head"><div><h2 class="card-title">会话时间线</h2><div class="card-note">30 分钟无活动后切分新会话</div></div></div><div class="session-divider">会话 #18 · 5 个事件</div><div class="timeline">${timelineItem("09:16:42", "访问主页", "zh-Hant · mobile · search")}${timelineItem("09:16:38", "地点查询", "成功 · 381ms")}${timelineItem("09:16:29", "路线查询", "成功 · 1.42s")}${timelineItem("09:15:51", "下载请求", "Android · v1.0 (1)")}</div></section>
      <nav class="mobile-pagination" aria-label="事件分页"><button class="control" type="button">上一页</button><span>1 / 355</span><button class="control primary" type="button">下一页</button></nav>
    </main>
  </div>`;
}

function mobileApk() {
  return `<div class="board mobile mobile-apk-board">
    <header class="doc-header"><div class="eyebrow">Homepage Download Metadata · Mobile</div><h1 class="doc-title">APK 版本与大小</h1><p class="doc-subtitle">metadata 失败只降级说明，稳定下载按钮始终可用。</p></header>
    <main class="mobile-apk-stack">
      <article class="card card-pad" data-state="ready"><div class="state-label"><span>01 / Ready</span>${badge("可用", "success")}</div><h2>下载 Android APK</h2><p class="download-meta">版本 1.0 (1) · 36.8 MB</p><a class="control primary" href="/api/downloads/android/latest">下载 Android APK</a><div class="annotation">版本和大小按当前语言格式化。</div></article>
      <article class="card card-pad" data-state="unavailable"><div class="state-label"><span>02 / Unavailable</span>${badge("降级", "warning")}</div><h2>下载 Android APK</h2><p class="download-meta">版本与大小暂时不可用</p><a class="control primary" href="/api/downloads/android/latest">下载 Android APK</a><div class="unavailable-note"><span>!</span><span>无需重新载入版本信息；下载仍可正常开始。</span></div></article>
    </main>
  </div>`;
}

function queryFailure() {
  return `<div class="board query-failure-board">
    <header class="doc-header"><div class="eyebrow">Pulse UI States · Query Failure</div><h1 class="doc-title">普通查询失败与数据库不可用</h1><p class="doc-subtitle">普通失败允许手动重试并保留筛选；数据库不可用说明监控存储状态，两者不混用。</p></header>
    <section class="query-failure-layout">
      <aside class="card card-pad" aria-label="已保留筛选条件"><h2 class="card-title">已保留筛选</h2><div class="key-list"><div class="key-row"><span>范围</span><b>近 30 天</b></div><div class="key-row"><span>事件</span><b>路线查询</b></div><div class="key-row"><span>结果</span><b>失败</b></div><div class="key-row"><span>语言</span><b>zh-Hant</b></div></div></aside>
      <div class="query-failure-stack"><article class="state-preview" data-state="query-failure">
        <h2>暂时无法载入这组监控数据</h2>
        <p>筛选条件已保留。请手动重试；公开主页、试查和下载不受监控查询影响。</p>
        <button type="button">重试查询</button>
      </article>
      <article class="state-preview danger-panel" data-state="database-unavailable"><h2>监控数据库当前不可用</h2><p>系统状态会显示受控原因类别；公开业务继续运行。数据库恢复前，聚合和明细查询不可用。</p><span>${badge("监控不可用", "error")}</span></article></div>
    </section>
  </div>`;
}

const renderers = {
  overview, traffic, downloads, events, visitor, performance, system,
  mobile, states, apk,
  "mobile-investigation": mobileInvestigation,
  "mobile-apk": mobileApk,
  "query-failure": queryFailure,
};
```

实现时可在不改变上述字段和交互语义的前提下调整示例数值与排版；不得增加 metadata 重新加载入口。

- [ ] **步骤 4：补齐新画板样式和导入说明**

新增样式至少包含：

```css
.mobile-investigation { width: 390px; min-height: 1640px; }
.mobile-apk-board { width: 390px; min-height: 1200px; }
.query-failure-board { width: 1440px; min-height: 1000px; padding: 48px; }
.mobile-filter-stack,
.mobile-event-cards,
.mobile-apk-stack { display: grid; gap: 12px; }
.mobile-event-card { display: grid; grid-template-columns: 112px 1fr; gap: 8px 12px; }
.copy-feedback { min-height: 24px; color: var(--success); }
.query-failure-layout { display: grid; grid-template-columns: 320px 1fr; gap: 24px; }
```

README 必须写明：设计版本 `Pulse v1.1 · 2026-07-22`、旧 10 张不重导、只导入 screen 11–13、目标仍为 `Website Analytics / v1`，并把最低关键节点清单扩展为三张新增画板。

- [ ] **步骤 5：运行结构和语法检查**

Run:

```bash
node --check docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/app.js
python3 -m json.tool docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/manifest.json >/dev/null
python3 - <<'PY'
import json
from pathlib import Path

root = Path("docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import")
manifest = json.loads((root / "manifest.json").read_text())
app = (root / "app.js").read_text()
assert len(manifest["frames"]) == 13
for screen in ("mobile-investigation", "mobile-apk", "query-failure"):
    assert f'"{screen}"' in app
PY
```

Expected: 全部 PASS。

- [ ] **步骤 6：生成并人工检查三张精确 viewport 截图**

Run from repository root:

```bash
python3 -m http.server 59337 --bind 127.0.0.1 --directory docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import >/tmp/bic-analytics-figma.log 2>&1 &
FIGMA_SERVER_PID=$!
trap 'kill "$FIGMA_SERVER_PID" 2>/dev/null || true' EXIT
cd frontend
npx playwright screenshot --viewport-size="390,1640" --full-page "http://127.0.0.1:59337/index.html?screen=mobile-investigation" ../docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/screenshots/mobile-investigation.png
npx playwright screenshot --viewport-size="390,1200" --full-page "http://127.0.0.1:59337/index.html?screen=mobile-apk" ../docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/screenshots/mobile-apk.png
npx playwright screenshot --viewport-size="1440,1000" --full-page "http://127.0.0.1:59337/index.html?screen=query-failure" ../docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/screenshots/query-failure.png
```

Expected: 三张 PNG 尺寸分别为 390×1640、390×1200、1440×1000；人工查看无横向溢出、裁切、文字重叠或空白画板，且能直接判断三类缺失设计事实。

- [ ] **步骤 7：提交 C1 视觉证据**

```bash
git add docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import
git commit -m "docs(figma): add analytics v1.1 supplemental boards"
```

---

### 任务 2：新增 route 查询的 feature-scoped OpenAPI 权威源

**Files:**
- Create: `specs/010-website-analytics/contracts/route-query-api.openapi.yaml`

- [ ] **步骤 1：确认当前缺失 feature route 契约**

Run:

```bash
test -f specs/010-website-analytics/contracts/route-query-api.openapi.yaml
```

Expected: FAIL。

- [ ] **步骤 2：以现有 shared route 契约为基线创建 feature YAML**

通过 `apply_patch` 创建完整文件，保持以下业务 schema 与 shared 版本逐字一致：

```text
QueryPlacesRequest / QueryPlacesEnvelope
QueryRoutesRequest / QueryRoutesEnvelope
QueryEtasRequest / QueryEtasEnvelope
ErrorEnvelope 及所有 token/route/ETA 子 schema
```

feature 文件的 `info.description` 必须明确它是 `010-website-analytics` 修改 route HTTP 行为的设计阶段权威源；三个业务 body 不得新增 visitor ID 或统计字段。

- [ ] **步骤 3：只对地点和路线 operation 增加跨切面契约**

给 `queryRoutePlaces`、`queryRouteOptions` 增加：

```yaml
parameters:
  - $ref: "#/components/parameters/TrafficSource"
```

并定义：

```yaml
components:
  parameters:
    TrafficSource:
      name: X-BusIsComing-Traffic-Source
      in: header
      required: false
      description: 浏览器本地推导的粗粒度来源；非法或缺失不改变路线业务响应
      schema:
        type: string
        enum: [direct, search, referral, internal, unknown]
  headers:
    AnalyticsVisitorCookie:
      description: 普通非机器人请求缺少、过期或签名无效匿名标识时，服务端可签发或轮换 HttpOnly 主机限定 Cookie
      schema:
        type: string
        example: __Host-bic-visitor=<opaque>; Path=/; Secure; HttpOnly; SameSite=Lax
```

地点与路线的所有成功/错误响应都必须说明可能返回 `Set-Cookie`；operation description 必须说明：每次到达都会产生对应匿名事件，已知机器人完全不记录，analytics 超时/失败不改变 route envelope。`queryRouteEtas` 不增加 header、Cookie 或事件副作用。

- [ ] **步骤 4：验证 schema 兼容和 OpenAPI lint**

Run:

```bash
cd frontend
npx redocly lint ../specs/010-website-analytics/contracts/route-query-api.openapi.yaml
npx redocly bundle ../specs/010-website-analytics/contracts/route-query-api.openapi.yaml -o /tmp/route-query-feature.bundle.yaml
node --input-type=module <<'JS'
import fs from "node:fs";
import YAML from "yaml";

const feature = YAML.parse(fs.readFileSync("../specs/010-website-analytics/contracts/route-query-api.openapi.yaml", "utf8"));
const shared = YAML.parse(fs.readFileSync("../shared/contracts/openapi/route-query-api.openapi.yaml", "utf8"));
if (JSON.stringify(feature.components.schemas) !== JSON.stringify(shared.components.schemas)) {
  throw new Error("route 业务 schemas 与 shared 基线不一致");
}
for (const path of ["/api/routes/query_places", "/api/routes/query_routes", "/api/routes/query_etas"]) {
  const actual = feature.paths[path].post.requestBody;
  const expected = shared.paths[path].post.requestBody;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${path} requestBody 发生变化`);
  }
}
if (feature.paths["/api/routes/query_etas"].post.parameters) {
  throw new Error("ETA 不得加入统计 header");
}
JS
```

Expected: lint/bundle PASS，所有业务 schemas 和 requestBody 与当前 shared 基线一致，ETA 无 analytics 参数。

- [ ] **步骤 5：提交 C3 新权威契约**

```bash
git add specs/010-website-analytics/contracts/route-query-api.openapi.yaml
git commit -m "docs(openapi): add feature route analytics contract"
```

---

### 任务 3：统一规格、计划、研究、quickstart、Figma 和公共打点契约

**Files:**
- Modify: `specs/010-website-analytics/spec.md`
- Modify: `specs/010-website-analytics/plan.md`
- Modify: `specs/010-website-analytics/research.md`
- Modify: `specs/010-website-analytics/quickstart.md`
- Modify: `specs/010-website-analytics/figma.md`
- Modify: `specs/010-website-analytics/contracts/public-tracking-context.contract.md`

- [ ] **步骤 1：先运行旧冲突 sentinel 并确认存在命中**

Run:

```bash
rg -n "两份 feature|10 张 Figma|Pulse v1 · 2026-07-20|独立短 deadline|feature 权威源为上述两份" specs/010-website-analytics
```

Expected: 命中旧的两份契约、10 张画板、v1 日期或未量化 deadline 表述。

- [ ] **步骤 2：在 spec 中锁定三份 feature 契约和量化 fail-open**

将 FR-024 改写为完整配置语义：

```md
- **FR-024**：统计写入必须使用 `ANALYTICS_WRITE_TIMEOUT_MS` 配置的独立 deadline，默认 `50ms`，合法闭区间为 `10–200ms`；每条允许事件只同步尝试一次。超时或失败只记录脱敏类别并把 `droppedSinceStart` 增加一次，不重试、不改变公开业务响应。配置缺失使用默认值；非整数或越界时 analytics 初始化降级为 no-op，公开服务仍须启动，私有 system 状态只暴露受控原因类别。
```

将 FR-037 改为：download、route-query、analytics-monitoring 三份 feature-scoped OpenAPI 3.1 YAML 是设计权威，shared 仅由实现阶段单向同步。更新“API 文档”“Figma 设计”“双端适配”“规模/范围”和 SC-011，使其分别引用 3 份 feature YAML、13 张画板、v1.1 及新增移动调查/移动 APK/普通失败证据。

- [ ] **步骤 3：在 plan 中消除权威源、MVP、factory 和 deadline 歧义**

必须同时落下以下叙述：

```text
feature authority:
  download-api.openapi.yaml
  route-query-api.openapi.yaml
  analytics-monitoring-api.openapi.yaml
sync direction: specs feature YAML -> shared/contracts/openapi only

public factory: logger -> injected analytics -> recovery -> handler
private factory: logger -> recovery -> handler
foundation analytics: side-effect-free gin.HandlerFunc stub
US1 analytics: real tracking middleware injected into the existing factory

ANALYTICS_WRITE_TIMEOUT_MS:
  default: 50ms
  valid: 10..200ms inclusive
  invalid: sanitized config category + no-op analytics + public remains available
```

用户故事顺序必须明确：US2 首次实现 provider、默认浏览器语言、繁中 fallback、持久化切换和总览/共享文案；US3 首次实现六个详细工作区三语；US4 首次实现主页 metadata 三语；US5 只回归。US1+US2 的首个可发布 MVP 已具备总览三语。

Figma 章节更新为 `BusIsComing Pulse v1.1 · 2026-07-22`、13 张画板，并列出新增三个 viewport；旧节点 `63:2118` 仍只作为现有页面锚点，不虚构新增 Figma node ID。

- [ ] **步骤 4：在 research 与公共打点契约中固化 A1/I1/C3**

`research.md` 决策 4 增加：

```md
配置键为 `ANALYTICS_WRITE_TIMEOUT_MS`，未配置时使用 `50ms`，只接受闭区间 `10–200ms` 的整数毫秒值。非法值使 analytics 初始化降级为 no-op，并只暴露 `invalid_write_timeout` 一类受控原因；公开 listener 继续启动。每个事件使用独立 context，只尝试一次；writer 获得的 deadline 不得超过已校验值或 `200ms` 上限。
```

`public-tracking-context.contract.md` 的 middleware 与故障语义同步相同矩阵；“OpenAPI 同步范围”先列三份 feature 源，再写实现阶段单向复制到 shared，兼容镜像不是权威源。

- [ ] **步骤 5：更新 Figma 追溯和 quickstart 验证矩阵**

`figma.md` 保留原 01–10 表格行并追加：

```md
| 11 | `Pulse / Mobile Investigation` | 390×1640 | 紧凑筛选、key-value 事件、精确 visitor 搜索、复制反馈、纵向时间线、分页 |
| 12 | `Homepage / Mobile APK Metadata States` | 390×1200 | ready/unavailable、本地化版本与大小、稳定下载 |
| 13 | `Pulse / Query Failure State` | 1440×1000 | 普通可重试失败、筛选保留、手动重试、DB 不可用语义对照 |
```

说明旧 10 张已导入、11–13 为待用户按 README 补充导入的 v1.1 画板；在用户真正导入前不得写成“Figma 已含新增节点”。

`quickstart.md` 增加：

```bash
export ANALYTICS_WRITE_TIMEOUT_MS=50

cd frontend
npx redocly lint ../specs/010-website-analytics/contracts/download-api.openapi.yaml
npx redocly lint ../specs/010-website-analytics/contracts/route-query-api.openapi.yaml
npx redocly lint ../specs/010-website-analytics/contracts/analytics-monitoring-api.openapi.yaml
```

并记录验收矩阵：unset/10/50/200 正常；9/201/0/负数/非整数降级；阻塞 writer 只 drop 一次且无重试；public/private panic 顺序分别通过 injected stub 与真实 middleware 集成测试；C1 三张截图逐张检查。

- [ ] **步骤 6：运行叙述性一致性断言**

Run:

```bash
python3 - <<'PY'
from pathlib import Path

root = Path("specs/010-website-analytics")
joined = "\n".join((root / name).read_text() for name in [
    "spec.md", "plan.md", "research.md", "quickstart.md", "figma.md",
    "contracts/public-tracking-context.contract.md",
])
for required in [
    "ANALYTICS_WRITE_TIMEOUT_MS", "50ms", "10–200ms",
    "route-query-api.openapi.yaml", "BusIsComing Pulse v1.1",
    "Mobile Investigation", "Mobile APK Metadata States", "Query Failure State",
]:
    assert required in joined, required
assert "feature 权威源为上述两份 YAML" not in joined
PY
```

再运行：

```bash
rg -n "US2.*(MonitoringI18nProvider|浏览器语言|繁中 fallback|持久化)|US5.*(回归|验证)" specs/010-website-analytics/{plan.md,spec.md}
rg -n "public.*injected analytics.*recovery|logger → injected analytics → recovery" specs/010-website-analytics/{plan.md,research.md,contracts/public-tracking-context.contract.md}
```

Expected: Python PASS；两组 `rg` 均能定位新的职责与装配顺序。

- [ ] **步骤 7：提交跨文档修订**

```bash
git add specs/010-website-analytics/spec.md specs/010-website-analytics/plan.md specs/010-website-analytics/research.md specs/010-website-analytics/quickstart.md specs/010-website-analytics/figma.md specs/010-website-analytics/contracts/public-tracking-context.contract.md
git commit -m "docs(spec): align analytics design authorities"
```

---

### 任务 4：在原编号内重写 tasks.md 的职责和依赖

**Files:**
- Modify: `specs/010-website-analytics/tasks.md`

- [ ] **步骤 1：保存任务编号基线并确认冲突条目**

Run:

```bash
rg -o "T[0-9]{3}" specs/010-website-analytics/tasks.md | sort -u >/tmp/analytics-task-ids-before.txt
rg -n "T005|T006|T007|T009|T016|T022|T028|T035|T036|T037|T043|T058|T060|T062|T078|T089|T098|T103|T104|T108|T109|T120|T122" specs/010-website-analytics/tasks.md
```

Expected: 显示当前两份 feature 契约、T022 提前安装真实 analytics、T037 重复替换 engine、T103/T104 首次实现三语、10 张 v1 画板等旧文本。

- [ ] **步骤 2：改写 C3 契约任务**

保持编号不变：

```md
- [ ] T005 将 download、route-query、analytics-monitoring 三份 feature OpenAPI 单向同步到 shared，兼容镜像只从 download shared 源生成或复制且不成为权威源，路径：`shared/contracts/openapi/download-api.openapi.yaml`、`shared/contracts/openapi/route-query-api.openapi.yaml`、`shared/contracts/openapi/analytics-monitoring-api.openapi.yaml`、`shared/contracts/download-api.openapi.yaml`
- [ ] T006 以 feature route 契约为源同步有限 source header、`Set-Cookie` 和打点副作用到 shared，并用 schema diff 保证三个业务 body 不变，路径：`specs/010-website-analytics/contracts/route-query-api.openapi.yaml`、`shared/contracts/openapi/route-query-api.openapi.yaml`
- [ ] T007 扩展 Redocly 命令，使三份 feature 与三份 shared 契约均可 lint/bundle，中文 API UI 不进入公网构建，路径：`frontend/package.json`、`frontend/redocly.yaml`
```

T109 对应改成“三份 feature/三份 shared”，并列出三个 bundle 输出。

- [ ] **步骤 3：改写 A1 和 I1 基础/US1 任务**

保持 T022/T035–T037 的单向依赖：

```md
- [ ] T009 [P] 为 `ANALYTICS_WRITE_TIMEOUT_MS` 未配置、10/50/200、非法值 no-op、受控健康原因类别和可替换端口编写先失败测试，路径：`backend/cmd/server/config_test.go`、`backend/internal/analytics/application/record_event_test.go`、`backend/internal/analytics/application/runtime_health_test.go`
- [ ] T016 实现默认 50ms、闭区间 10–200ms 的配置值注入、单次写入、无重试和原子健康计数，路径：`backend/internal/analytics/application/record_event.go`、`backend/internal/analytics/application/runtime_health.go`
- [ ] T022 建立 public/private engine factory；public 接收 `gin.HandlerFunc` analytics 参数并用无副作用 stub 验证 logger → injected analytics → recovery → handler；private 验证 logger → recovery → handler；本任务不实现真实 tracking，路径：`backend/internal/platform/httpserver/engine.go`、`backend/internal/platform/httpserver/engine_test.go`、`backend/cmd/server/config.go`
- [ ] T028 [P] [US1] 验证阻塞 writer 的 context deadline 不超过配置与 200ms 上限、drop 恰好一次且公开 status/header/JSON/APK bytes 与 no-op 基线等价，路径：`backend/internal/analytics/interfaces/http/fail_open_test.go`
- [ ] T035 [US1] 实现精确路由映射、bot-before-cookie、`__Host-bic-visitor` 签发和真实 tracking middleware，路径：`backend/internal/analytics/interfaces/http/tracking_middleware.go`
- [ ] T036 [US1] 把已校验 deadline、单次 recorder、health 和脱敏写入错误类别接入真实 middleware，路径：`backend/internal/analytics/interfaces/http/event_recorder.go`、`backend/internal/analytics/application/record_event.go`
- [ ] T037 [US1] 只把 T035/T036 的真实 middleware 注入 T022 已存在的 public factory，不重建 engine、不再次替换 logger/recovery，路径：`backend/cmd/server/main.go`
```

T043 增加 deadline 边界矩阵；T120 审计 factory stub 顺序和最终真实注入顺序。

- [ ] **步骤 4：把首次三语实现移回 US2/US3/US4**

使用以下完整职责替换对应条目：

```md
- [ ] T058 [P] [US2] 实现无 React Router 依赖的 hash 导航、近 30 天默认范围、粒度/比较/多维筛选状态，并首次建立 `MonitoringI18nProvider`、浏览器语言选择、繁中 fallback、持久化语言选择、语言切换器以及总览和共享 shell/filter/state 三语 copy，路径：`frontend/src/monitoring/app/hashRoute.ts`、`frontend/src/monitoring/app/FilterProvider.tsx`、`frontend/src/monitoring/app/MonitoringI18nProvider.tsx`、`frontend/src/monitoring/components/layout/MonitoringLanguageSwitcher.tsx`、`frontend/src/monitoring/content/copy.ts`
- [ ] T060 [P] [US2] 实现桌面 Dashboard shell、侧栏、顶栏、语言切换器、全局筛选和更新时间组件，并保持切换语言时当前 hash 与筛选不变，路径：`frontend/src/monitoring/components/layout/DashboardShell.tsx`、`frontend/src/monitoring/components/layout/MonitoringLanguageSwitcher.tsx`、`frontend/src/monitoring/components/filters/GlobalFilters.tsx`
- [ ] T062 [US2] 实现总览数据装配、五类状态、筛选回显、总览及共享状态三语文案和仅成功加载后 60 秒自动刷新，路径：`frontend/src/monitoring/pages/OverviewPage.tsx`、`frontend/src/monitoring/components/states/QueryState.tsx`、`frontend/src/monitoring/content/copy.ts`
- [ ] T078 [P] [US3] 首次实现六个详细工作区的 `zh-Hant`、`zh-Hans`、`en` 文案与格式化类型，以及可访问热力图、时间序列、环形/柱状图、keyset 分页表和会话时间线组件，路径：`frontend/src/monitoring/components/charts/Heatmap.tsx`、`frontend/src/monitoring/components/tables/EventTable.tsx`、`frontend/src/monitoring/components/timeline/VisitorTimeline.tsx`、`frontend/src/monitoring/content/copy.ts`、`frontend/src/monitoring/content/types.ts`
- [ ] T097 [US4] 从静态 manifest 文案移除版本/大小旧值并在 Hero/下载区首次实现三语当前值或暂不可用文案，同时保持稳定下载链接，路径：`frontend/src/content/downloadManifest.ts`、`frontend/src/content/homepageContent.ts`、`frontend/src/components/hero/HeroIntro.tsx`、`frontend/src/components/sections/DownloadSection.tsx`
```

把阶段 7 实现标题改为“回归与收口”，并改写：

```md
- [ ] T103 [US5] 运行七个工作区三语 key/格式化类型完整性和隐私事实一致性回归，禁止在本任务首次建立 provider 或批量补齐所属故事文案，路径：`frontend/src/monitoring/content/copy.test.ts`、`frontend/src/monitoring/content/types.ts`
- [ ] T104 [US5] 验证浏览器默认语言、繁中 fallback、持久化切换以及切换后 hash/筛选/调查上下文保持，不重复实现语言基础设施，路径：`frontend/src/monitoring/app/MonitoringI18nProvider.test.tsx`、`frontend/playwright-monitor/responsive-locales.spec.ts`
```

保留 T105–T107 的可访问性、语气审校和截图职责；检查点继续声明 US5 不承担首次实现。

- [ ] **步骤 5：把 C1 新画板接入对应测试和最终评审任务**

- T072/T084 引用 `11 Pulse / Mobile Investigation / 390`。
- T089/T098 引用 `12 Homepage / Mobile APK Metadata States / 390`。
- T102 引用 `13 Pulse / Query Failure State / 1440`，普通失败保留筛选并手动重试。
- T108 对照 13 张 manifest 和 v1.1，记录新增画板在用户导入后的追溯信息，不虚构子节点。
- T122 对照 `BusIsComing Pulse v1.1 · 2026-07-22`、13 张画板和真实桌面/手机截图。

- [ ] **步骤 6：验证编号、职责和关键依赖**

Run:

```bash
rg -o "T[0-9]{3}" specs/010-website-analytics/tasks.md | sort -u >/tmp/analytics-task-ids-after.txt
diff -u /tmp/analytics-task-ids-before.txt /tmp/analytics-task-ids-after.txt
python3 - <<'PY'
import re
from pathlib import Path

text = Path("specs/010-website-analytics/tasks.md").read_text()
ids = [int(value) for value in re.findall(r"^- \[ \] T(\d{3})", text, re.M)]
assert sorted(ids) == list(range(1, 124))
assert len(ids) == len(set(ids)) == 123
for required in [
    "三份 feature", "ANALYTICS_WRITE_TIMEOUT_MS", "10–200ms",
    "injected analytics", "Mobile Investigation", "Mobile APK Metadata States",
    "Query Failure State", "BusIsComing Pulse v1.1",
]:
    assert required in text, required
t022 = re.search(r"^- \[ \] T022.*$", text, re.M).group()
t037 = re.search(r"^- \[ \] T037.*$", text, re.M).group()
assert "stub" in t022 and "不实现真实" in t022
assert "注入" in t037 and "不重建" in t037
t103 = re.search(r"^- \[ \] T103.*$", text, re.M).group()
t104 = re.search(r"^- \[ \] T104.*$", text, re.M).group()
assert "首次" in t103 and "禁止" in t103
assert "验证" in t104 and "不重复实现" in t104
PY
```

Expected: `diff` 无输出，Python PASS；T001–T123 连续且唯一。

- [ ] **步骤 7：提交任务清单修订**

```bash
git add specs/010-website-analytics/tasks.md
git commit -m "docs(tasks): resolve analytics implementation conflicts"
```

---

### 任务 5：执行跨产物定向复核并收口

**Files:**
- Verify only: `docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/`
- Verify only: `specs/010-website-analytics/`

- [ ] **步骤 1：运行三份 feature OpenAPI lint/bundle**

```bash
cd frontend
for file in \
  ../specs/010-website-analytics/contracts/download-api.openapi.yaml \
  ../specs/010-website-analytics/contracts/route-query-api.openapi.yaml \
  ../specs/010-website-analytics/contracts/analytics-monitoring-api.openapi.yaml
do
  npx redocly lint "$file"
  name=$(basename "$file" .openapi.yaml)
  npx redocly bundle "$file" -o "/tmp/${name}.bundle.yaml"
done
```

Expected: 3 次 lint 与 3 次 bundle 全部 PASS。

- [ ] **步骤 2：运行 C1/C2/C3/I1/A1 定向 sentinel**

```bash
cd ..
python3 - <<'PY'
import json
from pathlib import Path

feature = Path("specs/010-website-analytics")
manifest = json.loads(Path("docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/manifest.json").read_text())
tasks = (feature / "tasks.md").read_text()
plan = (feature / "plan.md").read_text()
spec = (feature / "spec.md").read_text()
contract = (feature / "contracts/public-tracking-context.contract.md").read_text()

assert len(manifest["frames"]) == 13
assert manifest["version"] == "2026-07-22"
assert (feature / "contracts/route-query-api.openapi.yaml").exists()
assert "三份 feature" in tasks
assert "ANALYTICS_WRITE_TIMEOUT_MS" in tasks + plan + spec + contract
assert "50ms" in tasks + plan + spec + contract
assert "10–200ms" in tasks + plan + spec + contract
assert "injected analytics" in tasks
assert "BusIsComing Pulse v1.1" in tasks + plan + spec
assert "feature 权威源为上述两份 YAML" not in plan + spec
PY
```

Expected: PASS。

- [ ] **步骤 3：运行 Spec Kit 一致性分析并只核对选定 finding**

按 `speckit-analyze` 的非破坏流程重新分析当前 feature，确认：

- C1：三类缺失 UI 证据均由 manifest、HTML renderer、截图和 figma.md 追溯。
- C2：US2/US3/US4 首次实现各自三语，US5 只有回归。
- C3：route-query feature OpenAPI 存在，三份 feature → shared 单向关系一致。
- I1：T022 只建 factory/stub，T035/T036 实现，T037 只注入。
- A1：50ms 默认、10–200ms、非法 no-op、无重试和上限测试全部可定位。

I2/I3 仍按本次范围外处理，不因其存在把本次五项修复误判为失败。

- [ ] **步骤 4：确认工作区和提交历史**

```bash
git status --short
git log -5 --oneline
```

Expected: 工作区为空；最近提交至少包含 C1 画板、C3 route feature 契约、跨文档对齐和 tasks 修订四个提交。若一致性复核引发任何文本修正，单独提交：

```bash
git add specs/010-website-analytics docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import
git commit -m "docs(spec): close analytics remediation review"
```

该最终提交只在确有复核修正时创建；不得生成空提交。

---

## 完成定义

- `manifest.json` 保留原 10 张并包含 11–13，三张截图尺寸精确且视觉检查通过。
- 新增 feature route OpenAPI 可 lint/bundle，业务 schemas/requestBody 与 shared 基线一致，ETA 未被统计。
- spec/plan/research/quickstart/figma/公共打点契约都能定位 v1.1、三份 feature、量化 deadline 和 factory 注入顺序。
- tasks 仍为连续唯一的 T001–T123；US5 不再首次实现 i18n；T022/T037 不再循环或重复装配。
- C1、C2、C3、I1、A1 定向复核无阻断项，且没有扩大处理 I2/I3。
