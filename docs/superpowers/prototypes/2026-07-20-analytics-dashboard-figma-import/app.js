const qs = new URLSearchParams(window.location.search);
const screen = qs.get("screen") || "overview";

const navItems = [
  ["overview", "总览"],
  ["traffic", "流量与试查"],
  ["downloads", "下载分析"],
  ["events", "事件明细"],
  ["visitor", "匿名访客"],
  ["performance", "失败与性能"],
  ["system", "系统状态"],
];

function badge(text, kind = "neutral") {
  return `<span class="badge ${kind}">${text}</span>`;
}

function kpi(label, value, delta, direction = "up", hint = "") {
  return `<article class="card kpi">
    <div class="kpi-label"><span>${label}</span><span class="mini-icon"></span></div>
    <div class="kpi-value ${String(value).length > 7 ? "small" : ""}">${value}</div>
    <div class="delta ${direction === "down" ? "down" : ""}">${delta}</div>
    ${hint ? `<div class="card-note">${hint}</div>` : ""}
  </article>`;
}

function sidebar(active) {
  return `<aside class="sidebar">
    <div class="brand"><div class="brand-mark">B</div><div><div class="brand-name">BusIsComing</div><div class="brand-sub">Pulse</div></div></div>
    <div class="nav-label">监控中心</div>
    ${navItems.slice(0,3).map(([key,label]) => `<div class="nav-item ${active === key ? "active" : ""}"><span class="nav-icon"></span>${label}</div>`).join("")}
    <div class="nav-label">数据与诊断</div>
    ${navItems.slice(3).map(([key,label]) => `<div class="nav-item ${active === key ? "active" : ""}"><span class="nav-icon"></span>${label}</div>`).join("")}
    <div class="sidebar-status">仅通过 SSH 隧道访问<br><span class="status-live">● 数据正常写入</span><br>监听 127.0.0.1:18081</div>
  </aside>`;
}

function topbar(title, subtitle, options = {}) {
  return `<header class="topbar">
    <div><div class="eyebrow">BusIsComing Pulse</div><h1 class="page-title">${title}</h1><p class="page-subtitle">${subtitle}</p></div>
    <div class="toolbar">
      <div class="control">${options.range || "2026/06/21 — 2026/07/20"}</div>
      <div class="control">${options.granularity || "按日⌄"}</div>
      <div class="control language">简体中文⌄</div>
      <div class="control primary">刷新数据</div>
    </div>
  </header>`;
}

function healthBanner(text = "数据已更新至 09:16:42 · Asia/Hong_Kong") {
  return `<div class="health-banner"><div class="health-left"><span class="live-dot"></span>${text}</div><div>已排除已知机器人 · 自动刷新 60 秒</div></div>`;
}

function shell(active, title, subtitle, content, options = {}) {
  return `<div class="board desktop"><div class="shell">${sidebar(active)}<main class="main">${topbar(title, subtitle, options)}${healthBanner(options.health)}${content}</main></div></div>`;
}

function lineChart({ compact = false, third = false } = {}) {
  return `<svg class="chart ${compact ? "compact" : ""}" viewBox="0 0 760 220" preserveAspectRatio="none" aria-label="访问趋势折线图">
    <defs><linearGradient id="area-${screen}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2799A8" stop-opacity=".25"/><stop offset="1" stop-color="#2799A8" stop-opacity="0"/></linearGradient></defs>
    <g class="chart-grid"><line x1="0" y1="28" x2="760" y2="28"/><line x1="0" y1="75" x2="760" y2="75"/><line x1="0" y1="122" x2="760" y2="122"/><line x1="0" y1="169" x2="760" y2="169"/><line x1="76" y1="0" x2="76" y2="190"/><line x1="190" y1="0" x2="190" y2="190"/><line x1="304" y1="0" x2="304" y2="190"/><line x1="418" y1="0" x2="418" y2="190"/><line x1="532" y1="0" x2="532" y2="190"/><line x1="646" y1="0" x2="646" y2="190"/></g>
    <path d="M0 168 C44 158,66 132,105 141 S165 105,209 114 S276 65,320 83 S386 46,433 69 S497 29,548 55 S614 30,661 48 S719 19,760 30 L760 190 L0 190Z" fill="url(#area-${screen})"/>
    <path class="line-primary" d="M0 168 C44 158,66 132,105 141 S165 105,209 114 S276 65,320 83 S386 46,433 69 S497 29,548 55 S614 30,661 48 S719 19,760 30"/>
    <path class="line-secondary" d="M0 181 C50 174,75 160,112 166 S174 142,220 151 S279 117,327 128 S393 100,440 116 S503 85,553 105 S617 87,669 97 S724 75,760 82"/>
    ${third ? `<path class="line-warning" d="M0 188 C68 184,108 176,154 179 S232 164,282 169 S364 146,423 156 S499 138,558 146 S642 126,703 135 S744 124,760 126"/>` : ""}
    <g class="chart-label"><text x="0" y="213">06/21</text><text x="180" y="213">06/28</text><text x="365" y="213">07/05</text><text x="545" y="213">07/12</text><text x="716" y="213">07/20</text></g>
  </svg>`;
}

function donutCard() {
  return `<article class="card card-pad"><div class="card-head"><div><h2 class="card-title">事件构成</h2><div class="card-note">所有已记录匿名事件</div></div><span class="card-meta">17,742 次</span></div>
    <div class="donut-row"><div class="donut"></div><div class="key-list">
      <div class="key-row"><span><i class="key-dot" style="background:#00545b"></i>主页访问</span><b>44%</b></div>
      <div class="key-row"><span><i class="key-dot" style="background:#2799a8"></i>地点查询</span><b>32%</b></div>
      <div class="key-row"><span><i class="key-dot" style="background:#86cdbb"></i>路线查询</span><b>15%</b></div>
      <div class="key-row"><span><i class="key-dot" style="background:#d98a14"></i>下载请求</span><b>9%</b></div>
    </div></div></article>`;
}

function performanceBars() {
  return `<article class="card card-pad"><div class="card-head"><div><h2 class="card-title">响应时间 P95</h2><div class="card-note">仅统计到达服务端的请求</div></div><span class="card-meta">成功请求</span></div>
    <div class="bar-list">
      <div class="bar-row"><span>APK 元数据</span><div class="bar-track"><i class="bar-fill" style="width:12%"></i></div><b>28ms</b></div>
      <div class="bar-row"><span>地点查询</span><div class="bar-track"><i class="bar-fill blue" style="width:46%"></i></div><b>420ms</b></div>
      <div class="bar-row"><span>路线查询</span><div class="bar-track"><i class="bar-fill amber" style="width:86%"></i></div><b>1.8s</b></div>
      <div class="bar-row"><span>下载响应</span><div class="bar-track"><i class="bar-fill" style="width:58%"></i></div><b>640ms</b></div>
    </div></article>`;
}

function overview() {
  const content = `
    <section class="grid kpi-grid">
      ${kpi("页面浏览量 PV", "12,480", "↑ 12.6% 对比上期")}
      ${kpi("独立浏览器 UV", "3,216", "↑ 8.4% 对比上期")}
      ${kpi("人均访问次数", "3.88", "↑ 0.15 对比上期")}
      ${kpi("成功路线试查", "846", "↑ 6.9% 对比上期")}
      ${kpi("下载请求", "318", "↑ 18.2% 对比上期")}
      ${kpi("请求成功率", "98.2%", "↓ 0.4% 对比上期", "down")}
    </section>
    <section class="grid grid-main">
      <article class="card card-lg"><div class="card-head"><div><h2 class="card-title">访问趋势</h2><div class="card-note">PV 与独立浏览器 UV · 默认近 30 天</div></div><span class="card-meta">悬停查看每日明细</span></div><div class="legend"><span class="legend-key"><i class="legend-line" style="background:#00545b"></i>PV</span><span class="legend-key"><i class="legend-line" style="background:#68bcae"></i>UV</span></div>${lineChart()}</article>
      <article class="card card-lg"><div class="card-head"><div><h2 class="card-title">试查漏斗</h2><div class="card-note">同一 30 分钟会话内的成功独立访客</div></div><span class="card-meta">UV</span></div><div class="funnel"><div class="funnel-step"><div class="funnel-fill funnel-1"><span>访问主页</span><b>3,216</b></div></div><div class="funnel-step"><div class="funnel-fill funnel-2"><span>地点查询</span><b>2,444</b></div></div><div class="funnel-step"><div class="funnel-fill funnel-3"><span>路线查询</span><b>1,564</b></div></div></div><div class="funnel-caption">主页 → 地点 76.0%　·　地点 → 路线 64.0%<br>每次 300ms 防抖请求保留明细，漏斗按成功 UV 去重。</div></article>
    </section>
    <section class="grid grid-3">
      ${donutCard()}
      ${performanceBars()}
      <article class="card card-pad"><div class="card-head"><div><h2 class="card-title">下载漏斗与版本</h2><div class="card-note">仅表示下载响应，不表示安装完成</div></div><span class="card-meta">Android</span></div><div class="bar-list"><div class="bar-row"><span>访问主页 UV</span><div class="bar-track"><i class="bar-fill" style="width:100%"></i></div><b>3,216</b></div><div class="bar-row"><span>下载请求 UV</span><div class="bar-track"><i class="bar-fill blue" style="width:22%"></i></div><b>692</b></div><div class="bar-row"><span>v1.0 (1)</span><div class="bar-track"><i class="bar-fill" style="width:98%"></i></div><b>99.1%</b></div></div><div class="annotation">平台枚举已预留 iOS；当前正式下载仅 Android。</div></article>
    </section>`;
  return shell("overview", "监控总览", "主页访问、路线试查与安装包下载的统一视图", content);
}

function heatmap() {
  const rows = ["周一","周二","周三","周四","周五","周六","周日"];
  const classes = ["","h2","h3","h4","h5"];
  return `<div class="heatmap"><span></span>${[0,2,4,6,8,10,12,14,16,18,20,22].map(h=>`<span class="heat-label">${String(h).padStart(2,"0")}</span>`).join("")}${rows.map((day,ri)=>`<span class="heat-label">${day}</span>${Array.from({length:12},(_,i)=>`<span class="heat-cell ${classes[(ri*3+i*2+Math.floor(i/3))%5]}"></span>`).join("")}`).join("")}</div>`;
}

function traffic() {
  const content = `
    <section class="grid kpi-grid">
      ${kpi("主页 PV", "12,480", "↑ 12.6%")}${kpi("主页 UV", "3,216", "↑ 8.4%")}${kpi("成功地点查询 UV", "2,444", "76.0% 主页转化")}${kpi("成功路线查询 UV", "1,564", "64.0% 地点转化")}${kpi("地点查询请求", "5,906", "含输入防抖请求")}${kpi("路线查询请求", "1,782", "98.7% 成功")}
    </section>
    <section class="filters"><span class="filter-label">维度</span><span class="filter-chip active">全部语言</span><span class="filter-chip">zh-Hant</span><span class="filter-chip">zh-Hans</span><span class="filter-chip">en</span><span class="filter-chip">全部设备</span><span class="filter-chip">来源⌄</span><span class="spacer"></span><span class="filter-chip">对比上一周期 ✓</span></section>
    <section class="grid grid-main">
      <article class="card card-lg"><div class="card-head"><div><h2 class="card-title">访问与成功试查趋势</h2><div class="card-note">主页 PV / UV / 成功路线查询 UV</div></div><span class="card-meta">近 30 天 · 按日</span></div><div class="legend"><span class="legend-key"><i class="legend-line" style="background:#00545b"></i>PV</span><span class="legend-key"><i class="legend-line" style="background:#68bcae"></i>UV</span><span class="legend-key"><i class="legend-line" style="background:#d98a14"></i>路线 UV</span></div>${lineChart({third:true})}</article>
      <article class="card card-lg"><div class="card-head"><div><h2 class="card-title">双漏斗</h2><div class="card-note">会话按 30 分钟无活动切分</div></div><span class="card-meta">成功 UV</span></div><div class="funnel"><div class="funnel-step"><div class="funnel-fill funnel-1"><span>访问主页</span><b>3,216</b></div></div><div class="funnel-step"><div class="funnel-fill funnel-2"><span>成功地点查询</span><b>2,444</b></div></div><div class="funnel-step"><div class="funnel-fill funnel-3"><span>成功路线查询</span><b>1,564</b></div></div><div class="funnel-step"><div class="funnel-fill funnel-4"><span>下载</span><b>692</b></div></div></div><div class="funnel-caption">试查漏斗与下载漏斗独立计算；直接下载进入总量但不计完整主页漏斗。</div></article>
    </section>
    <section class="grid grid-2">
      <article class="card card-pad"><div class="card-head"><div><h2 class="card-title">访问时段热力图</h2><div class="card-note">香港时间 · 颜色越深表示匿名事件越多</div></div><span class="card-meta">小时 × 星期</span></div>${heatmap()}</article>
      <article class="card card-pad"><div class="card-head"><div><h2 class="card-title">语言、设备与来源</h2><div class="card-note">仅保存粗粒度分类，不保存完整 UA 或 Referrer</div></div><span class="card-meta">UV 占比</span></div><div class="grid grid-3"><div><div class="card-note">语言</div><div class="bar-list"><div class="bar-row"><span>zh-Hant</span><div class="bar-track"><i class="bar-fill" style="width:67%"></i></div><b>67%</b></div><div class="bar-row"><span>zh-Hans</span><div class="bar-track"><i class="bar-fill blue" style="width:21%"></i></div><b>21%</b></div><div class="bar-row"><span>en</span><div class="bar-track"><i class="bar-fill amber" style="width:12%"></i></div><b>12%</b></div></div></div><div><div class="card-note">设备</div><div class="bar-list"><div class="bar-row"><span>Mobile</span><div class="bar-track"><i class="bar-fill" style="width:72%"></i></div><b>72%</b></div><div class="bar-row"><span>Desktop</span><div class="bar-track"><i class="bar-fill blue" style="width:24%"></i></div><b>24%</b></div><div class="bar-row"><span>Other</span><div class="bar-track"><i class="bar-fill amber" style="width:4%"></i></div><b>4%</b></div></div></div><div><div class="card-note">来源</div><div class="bar-list"><div class="bar-row"><span>Direct</span><div class="bar-track"><i class="bar-fill" style="width:49%"></i></div><b>49%</b></div><div class="bar-row"><span>Search</span><div class="bar-track"><i class="bar-fill blue" style="width:38%"></i></div><b>38%</b></div><div class="bar-row"><span>Referral</span><div class="bar-track"><i class="bar-fill amber" style="width:13%"></i></div><b>13%</b></div></div></div></div></article>
    </section>`;
  return shell("traffic", "流量与试查", "从主页访问到地点查询、路线查询的匿名行为路径", content);
}

function downloads() {
  const rows = [
    ["1.0", "1", "318", "315", "99.1%", badge("当前版本", "success")],
    ["0.9", "18", "42", "40", "95.2%", badge("历史版本", "neutral")],
    ["—", "—", "3", "0", "0%", badge("元数据不可用", "error")],
  ];
  const content = `
    <section class="grid kpi-grid">
      ${kpi("下载请求", "318", "↑ 18.2%")}${kpi("下载 UV", "276", "↑ 15.4%")}${kpi("响应成功率", "99.1%", "↑ 0.3%")}${kpi("主页 → 下载", "21.5%", "成功独立访客")}${kpi("当前版本", "1.0 (1)", "36.8 MB")}${kpi("失败请求", "3", "↓ 2 次", "up")}
    </section>
    <section class="grid grid-main">
      <article class="card card-lg"><div class="card-head"><div><h2 class="card-title">下载请求趋势</h2><div class="card-note">请求次数、独立浏览器与成功响应</div></div><span class="card-meta">Android · 近 30 天</span></div><div class="legend"><span class="legend-key"><i class="legend-line" style="background:#00545b"></i>请求</span><span class="legend-key"><i class="legend-line" style="background:#68bcae"></i>UV</span></div>${lineChart({compact:true})}</article>
      <article class="card card-lg"><div class="card-head"><div><h2 class="card-title">平台分布</h2><div class="card-note">服务端从下载路由推导平台</div></div><span class="card-meta">平台枚举</span></div><div class="donut-row"><div class="donut" style="background:conic-gradient(#00545b 0 100%);"></div><div class="key-list"><div class="key-row"><span><i class="key-dot" style="background:#00545b"></i>Android</span><b>100%</b></div><div class="key-row"><span><i class="key-dot" style="background:#dce8ea"></i>iOS</span><b>未来预留</b></div></div></div><div class="annotation">“成功”表示下载接口已返回安装包响应，不表示用户安装完成。</div></article>
    </section>
    <section class="grid grid-2">
      <article class="card card-pad"><div class="card-head"><div><h2 class="card-title">版本明细</h2><div class="card-note">成功事件记录实际 versionName、versionCode 与 sizeBytes</div></div><span class="card-meta">3 个版本状态</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>versionName</th><th>versionCode</th><th>请求</th><th>成功</th><th>成功率</th><th>状态</th></tr></thead><tbody>${rows.map(r=>`<tr>${r.map((c,i)=>`<td class="${i<2 ? "mono" : ""}">${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div></article>
      <article class="card card-pad"><div class="card-head"><div><h2 class="card-title">失败分布</h2><div class="card-note">失败版本允许为空，业务下载不受统计写入影响</div></div><span class="card-meta">3 次</span></div><div class="bar-list"><div class="bar-row"><span>客户端中断</span><div class="bar-track"><i class="bar-fill red" style="width:67%"></i></div><b>2</b></div><div class="bar-row"><span>包文件不可用</span><div class="bar-track"><i class="bar-fill amber" style="width:33%"></i></div><b>1</b></div><div class="bar-row"><span>统计写入失败</span><div class="bar-track"><i class="bar-fill" style="width:0%"></i></div><b>0</b></div></div><div class="annotation">统计存储失败时公开下载接口继续响应，并在进程内累计 dropped count。</div></article>
    </section>`;
  return shell("downloads", "下载分析", "安装包请求、版本、平台和响应结果的可视化", content);
}

function eventRows() {
  return [
    ["2026-07-20 09:16:42", "page_view", "a83f…92d1", "zh-Hant", "mobile", "search", "200", "28ms"],
    ["2026-07-20 09:16:38", "place_query", "a83f…92d1", "zh-Hant", "mobile", "search", "200", "381ms"],
    ["2026-07-20 09:16:34", "place_query", "a83f…92d1", "zh-Hant", "mobile", "search", "200", "406ms"],
    ["2026-07-20 09:16:29", "route_query", "a83f…92d1", "zh-Hant", "mobile", "search", "200", "1.42s"],
    ["2026-07-20 09:15:51", "download_request", "7c91…ab20", "en", "desktop", "direct", "200", "612ms"],
    ["2026-07-20 09:15:12", "route_query", "4e22…19af", "zh-Hans", "mobile", "referral", "502", "2.10s"],
    ["2026-07-20 09:14:44", "page_view", "bd70…c412", "zh-Hant", "tablet", "internal", "200", "31ms"],
    ["2026-07-20 09:13:07", "place_query", "bd70…c412", "zh-Hant", "tablet", "internal", "200", "355ms"],
  ];
}

function events() {
  const content = `
    <section class="filters"><span class="filter-label">事件</span><span class="filter-chip active">全部</span><span class="filter-chip">主页访问</span><span class="filter-chip">地点查询</span><span class="filter-chip">路线查询</span><span class="filter-chip">下载请求</span><span class="filter-label">结果</span><span class="filter-chip">全部结果⌄</span><span class="filter-chip">语言⌄</span><span class="filter-chip">设备⌄</span><span class="spacer"></span><span class="filter-chip">搜索 Visitor ID</span></section>
    <div class="privacy-note"><span class="lock">◇</span><span>明细不保存 IP、完整 User-Agent、完整 Referrer、查询词、地点、坐标、请求体、Cookie 或 token。访客 ID 默认截断展示。</span></div>
    <section class="grid grid-4" style="margin-bottom:14px">${kpi("筛选结果", "17,742", "近 30 天")}${kpi("成功事件", "17,422", "98.2%")}${kpi("失败事件", "320", "1.8%", "down")}${kpi("独立访客", "3,216", "浏览器标识")}</section>
    <article class="card card-pad"><div class="card-head"><div><h2 class="card-title">匿名事件明细</h2><div class="card-note">按发生时间倒序 · 仅分页查看，不提供导出、删除或编辑</div></div><span class="card-meta">每页 50 条</span></div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th style="width:170px">时间</th><th style="width:140px">事件类型</th><th style="width:120px">Visitor ID</th><th>语言</th><th>设备</th><th>来源</th><th>状态</th><th>耗时</th></tr></thead><tbody>${eventRows().map(r=>`<tr>${r.map((c,i)=>`<td class="${i===2 ? "mono" : ""}">${i===6 ? badge(c, c==="200"?"success":"error") : c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
      <div class="pagination"><span>显示 1–50，共 17,742 条</span><span><span class="filter-chip">← 上一页</span>　1 / 355　<span class="filter-chip active">下一页 →</span></span></div>
    </article>`;
  return shell("events", "事件明细", "在严格脱敏边界内检查匿名原始事件", content, {granularity:"按时间倒序⌄"});
}

function timelineItem(time, event, detail, result = "成功") {
  return `<div class="timeline-item"><span class="timeline-dot"></span><span class="timeline-time">${time}</span><div><div class="timeline-event">${event}</div><div class="timeline-detail">${detail}</div></div><span>${badge(result, result === "成功" ? "success" : "error")}</span></div>`;
}

function visitor() {
  const content = `
    <section class="filters"><span class="filter-label">Visitor ID</span><span class="filter-chip active mono">a83f9273d84c4b2e9d819db05fe092d1</span><span class="filter-chip">复制完整 ID</span><span class="spacer"></span><span class="filter-chip">返回事件明细</span></section>
    <div class="privacy-note"><span class="lock">◇</span><span>这是服务器签发 HttpOnly Cookie 对应的匿名浏览器标识，不是自然人身份；清除 Cookie、切换浏览器或设备会成为新访客。</span></div>
    <section class="grid grid-4" style="margin-bottom:14px">${kpi("首次出现", "06/24", "2026 · 18:42")}${kpi("最后出现", "07/20", "09:16 · 今日")}${kpi("活跃会话", "18", "30 分钟切分")}${kpi("累计事件", "126", "4 类匿名事件")}</section>
    <section class="grid grid-main-reverse">
      <aside class="grid" style="align-content:start">
        <article class="card card-pad"><div class="card-head"><div><h2 class="card-title">访客摘要</h2><div class="card-note mono">a83f…92d1</div></div>${badge("近期活跃","success")}</div><div class="bar-list"><div class="bar-row"><span>主页访问</span><div class="bar-track"><i class="bar-fill" style="width:100%"></i></div><b>42</b></div><div class="bar-row"><span>地点查询</span><div class="bar-track"><i class="bar-fill blue" style="width:88%"></i></div><b>37</b></div><div class="bar-row"><span>路线查询</span><div class="bar-track"><i class="bar-fill amber" style="width:71%"></i></div><b>30</b></div><div class="bar-row"><span>下载请求</span><div class="bar-track"><i class="bar-fill" style="width:40%"></i></div><b>17</b></div></div></article>
        <article class="card card-pad"><div class="card-head"><div><h2 class="card-title">常见分类</h2><div class="card-note">最近 30 天</div></div></div><div class="key-list"><div class="key-row"><span>语言</span><b>zh-Hant</b></div><div class="key-row"><span>设备</span><b>mobile</b></div><div class="key-row"><span>来源</span><b>search</b></div><div class="key-row"><span>平台</span><b>android</b></div></div></article>
      </aside>
      <article class="card card-lg"><div class="card-head"><div><h2 class="card-title">会话时间线</h2><div class="card-note">按发生时间展示，不含查询内容与网络标识</div></div><span class="card-meta">最近 30 天 · 18 个会话</span></div><div class="session-divider">会话 #18 · 2026-07-20 · 5 个事件 · 持续 2 分 13 秒</div><div class="timeline">${timelineItem("09:16:42","访问主页","zh-Hant · mobile · search")}${timelineItem("09:16:38","地点查询","请求 #1 · 381ms")}${timelineItem("09:16:34","地点查询","请求 #2 · 406ms")}${timelineItem("09:16:29","路线查询","成功返回 · 1.42s")}${timelineItem("09:15:51","下载请求","Android · v1.0 (1) · 36.8 MB")}</div><div class="session-divider">超过 30 分钟无活动 · 新会话</div><div class="timeline">${timelineItem("昨日 21:08","访问主页","zh-Hant · mobile · direct")}${timelineItem("昨日 21:07","路线查询","上游超时 · 2.10s","失败")}</div></article>
    </section>`;
  return shell("visitor", "匿名访客", "基于服务器签发浏览器标识的会话与事件时间线", content, {granularity:"最近 30 天⌄"});
}

function performance() {
  const rows = [
    ["GET /downloads/android/latest/metadata", "12,480", "99.8%", "18ms", "28ms", badge("稳定","success")],
    ["POST /routes/query_places", "5,906", "98.9%", "214ms", "420ms", badge("稳定","success")],
    ["POST /routes/query_routes", "1,782", "98.7%", "820ms", "1.80s", badge("观察","warning")],
    ["GET /downloads/android/latest", "318", "99.1%", "330ms", "640ms", badge("稳定","success")],
  ];
  const content = `
    <section class="grid kpi-grid">${kpi("总请求", "20,486", "↑ 11.8%")}${kpi("成功率", "98.2%", "↓ 0.4%", "down")}${kpi("失败请求", "320", "1.8%", "down")}${kpi("全局 P50", "218ms", "↓ 12ms")}${kpi("全局 P95", "1.12s", "↑ 80ms", "down")}${kpi("统计丢弃", "7", "进程启动以来", "down")}</section>
    <section class="grid grid-main">
      <article class="card card-lg"><div class="card-head"><div><h2 class="card-title">P50 / P95 响应时间趋势</h2><div class="card-note">按端点、结果和时间范围筛选</div></div><span class="card-meta">毫秒</span></div><div class="legend"><span class="legend-key"><i class="legend-line" style="background:#00545b"></i>P95</span><span class="legend-key"><i class="legend-line" style="background:#68bcae"></i>P50</span></div>${lineChart()}</article>
      <article class="card card-lg danger-panel"><div class="card-head"><div><h2 class="card-title">失败类型</h2><div class="card-note">脱敏错误分类，不保存第三方原始响应</div></div><span class="card-meta">320 次</span></div><div class="bar-list"><div class="bar-row"><span>上游超时</span><div class="bar-track"><i class="bar-fill red" style="width:72%"></i></div><b>231</b></div><div class="bar-row"><span>上游拒绝</span><div class="bar-track"><i class="bar-fill amber" style="width:17%"></i></div><b>54</b></div><div class="bar-row"><span>校验失败</span><div class="bar-track"><i class="bar-fill blue" style="width:8%"></i></div><b>26</b></div><div class="bar-row"><span>包不可用</span><div class="bar-track"><i class="bar-fill" style="width:3%"></i></div><b>9</b></div></div><div class="annotation">公开业务接口保持自身错误语义；统计写入失败不会改变业务响应。</div></article>
    </section>
    <article class="card card-pad"><div class="card-head"><div><h2 class="card-title">端点性能</h2><div class="card-note">常用查询目标：在 100 万明细行规模下，监控查询与访客时间线不超过 1 秒</div></div><span class="card-meta">上一周期对比</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th style="width:310px">端点</th><th>请求</th><th>成功率</th><th>P50</th><th>P95</th><th>状态</th></tr></thead><tbody>${rows.map(r=>`<tr>${r.map((c,i)=>`<td class="${i===0?"mono":""}">${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div></article>`;
  return shell("performance", "失败与性能", "识别公开端点的失败变化和响应时间退化", content);
}

function system() {
  const content = `
    <section class="grid grid-4" style="margin-bottom:14px">
      <article class="card card-pad system-card"><div class="card-head"><h2 class="card-title">SQLite</h2>${badge("正常","success")}</div><div class="system-value">可读写</div><div class="system-detail">WAL 模式 · 持久目录<br>当前明细 742,618 行</div></article>
      <article class="card card-pad system-card"><div class="card-head"><h2 class="card-title">最后成功写入</h2>${badge("刚刚","success")}</div><div class="system-value">09:16:42</div><div class="system-detail">2026-07-20 · Asia/Hong_Kong<br>page_view · 28ms</div></article>
      <article class="card card-pad system-card warning-panel"><div class="card-head"><h2 class="card-title">Dropped count</h2>${badge("注意","warning")}</div><div class="system-value">7</div><div class="system-detail">自当前进程启动以来<br>不影响公开业务响应</div></article>
      <article class="card card-pad system-card"><div class="card-head"><h2 class="card-title">私有监听器</h2>${badge("仅本机","info")}</div><div class="system-value">:18081</div><div class="system-detail">127.0.0.1 · SSH 隧道访问<br>未注册到 Caddy 公网路由</div></article>
    </section>
    <section class="grid grid-2" style="margin-bottom:14px">
      <article class="card card-pad"><div class="card-head"><div><h2 class="card-title">运行状态</h2><div class="card-note">公开监听器与监控监听器隔离</div></div><span class="card-meta">单个 Go 进程</span></div><div class="key-list"><div class="key-row"><span>公开 HTTP</span><span>${badge("正常","success")}</span></div><div class="key-row"><span>私有监控 HTTP</span><span>${badge("正常","success")}</span></div><div class="key-row"><span>统计写入队列</span><span>${badge("实时","success")}</span></div><div class="key-row"><span>机器人过滤器</span><span>${badge("启用","info")}</span></div><div class="key-row"><span>匿名签名密钥</span><span>${badge("已加载","success")}</span></div><div class="key-row"><span>备份任务</span><span>${badge("未配置","neutral")}</span></div></div></article>
      <article class="card card-pad"><div class="card-head"><div><h2 class="card-title">存储概况</h2><div class="card-note">只保存明细；聚合在监控查询时执行</div></div><span class="card-meta">容量目标 ≤ 100 万</span></div><div class="bar-list"><div class="bar-row"><span>明细行</span><div class="bar-track"><i class="bar-fill" style="width:74%"></i></div><b>742k</b></div><div class="bar-row"><span>数据库大小</span><div class="bar-track"><i class="bar-fill blue" style="width:42%"></i></div><b>286 MB</b></div><div class="bar-row"><span>今日事件</span><div class="bar-track"><i class="bar-fill amber" style="width:61%"></i></div><b>612</b></div></div><div class="annotation">长期保留，不提供删除逻辑；不配置备份，统计数据允许丢失。</div></article>
    </section>
    <article class="card card-lg"><div class="card-head"><div><h2 class="card-title">隔离与降级路径</h2><div class="card-note">analytics bounded context 通过存储端口与 SQLite 适配器隔离</div></div><span class="card-meta">Fail-open</span></div><div class="architecture"><div class="arch-node">公开下载 / 路线接口</div><span class="arch-arrow">→</span><div class="arch-node accent">Analytics 应用服务</div><span class="arch-arrow">→</span><div class="arch-node">Storage Port</div><span class="arch-arrow">→</span><div class="arch-node">SQLite Adapter</div></div><div class="annotation">统计路径失败时：记录脱敏错误 → 增加 dropped count → 公开请求继续按原逻辑响应。私有 Dashboard 不可用不影响主页、试查或 APK 下载。</div></article>`;
  return shell("system", "系统状态", "数据库、统计写入、监听器和降级路径", content, {granularity:"实时状态"});
}

function mobile() {
  return `<div class="board mobile">
    <header class="mobile-head"><div class="mobile-title-row"><div class="mobile-brand"><span class="mobile-mark">B</span><span>BusIsComing Pulse</span></div><span class="badge success">● 正常</span></div></header>
    <main class="mobile-content"><div class="mobile-range"><div><div class="eyebrow">监控总览</div><h1>近 30 天</h1></div><span class="filter-chip active">按日⌄</span></div>
      <section class="mobile-kpis">${kpi("页面浏览量 PV","12,480","↑ 12.6%")}${kpi("独立浏览器 UV","3,216","↑ 8.4%")}${kpi("成功路线试查","846","↑ 6.9%")}${kpi("下载请求","318","↑ 18.2%")}</section>
      <section class="mobile-stack">
        <article class="card card-pad"><div class="card-head"><div><h2 class="card-title">访问趋势</h2><div class="card-note">PV / UV</div></div><span class="card-meta">近 30 天</span></div><svg class="mobile-chart" viewBox="0 0 340 150"><g class="chart-grid"><line x1="0" y1="30" x2="340" y2="30"/><line x1="0" y1="75" x2="340" y2="75"/><line x1="0" y1="120" x2="340" y2="120"/></g><path class="line-primary" d="M0 122 C22 116,32 90,55 99 S92 70,113 81 S153 43,177 60 S214 27,238 46 S277 26,299 39 S326 19,340 24"/><path class="line-secondary" d="M0 136 C23 130,35 116,58 122 S94 101,116 108 S154 84,180 94 S217 69,241 80 S278 65,302 71 S329 58,340 61"/></svg></article>
        <article class="card card-pad"><div class="card-head"><div><h2 class="card-title">试查漏斗</h2><div class="card-note">成功独立访客</div></div></div><div class="funnel"><div class="funnel-step"><div class="funnel-fill funnel-1"><span>主页</span><b>3,216</b></div></div><div class="funnel-step"><div class="funnel-fill funnel-2"><span>地点</span><b>2,444</b></div></div><div class="funnel-step"><div class="funnel-fill funnel-3"><span>路线</span><b>1,564</b></div></div></div></article>
        <article class="card card-pad"><div class="card-head"><div><h2 class="card-title">今日健康状态</h2><div class="card-note">更新于 09:16:42</div></div>${badge("正常","success")}</div><div class="key-list"><div class="key-row"><span>请求成功率</span><b>98.2%</b></div><div class="key-row"><span>P95</span><b>1.12s</b></div><div class="key-row"><span>统计丢弃</span><b>7</b></div><div class="key-row"><span>SQLite</span><b>可读写</b></div></div></article>
        <article class="card card-pad"><div class="card-head"><div><h2 class="card-title">最近下载</h2><div class="card-note">Android v1.0 (1)</div></div><span class="card-meta">36.8 MB</span></div><div class="bar-list"><div class="bar-row"><span>下载请求</span><div class="bar-track"><i class="bar-fill" style="width:78%"></i></div><b>318</b></div><div class="bar-row"><span>成功率</span><div class="bar-track"><i class="bar-fill blue" style="width:99%"></i></div><b>99.1%</b></div></div></article>
      </section>
    </main>
    <nav class="mobile-nav"><span class="mobile-nav-item active">总览</span><span class="mobile-nav-item">试查</span><span class="mobile-nav-item">下载</span><span class="mobile-nav-item">系统</span></nav>
  </div>`;
}

function states() {
  return `<div class="board states-board">
    <header class="doc-header"><div class="eyebrow">Pulse UI States</div><h1 class="doc-title">加载、空数据与不可用状态</h1><p class="doc-subtitle">所有监控页面必须区分请求加载、真正无数据、筛选无结果和数据库不可用。公开业务接口的可用性不由这些状态决定。</p></header>
    <section class="state-grid">
      <article class="state-card"><div class="state-label"><span>01 / Loading</span><span>Dashboard 初次加载</span></div><div class="state-preview"><div class="skeleton"><div class="skeleton-row short"></div><div class="grid grid-3"><div class="skeleton-row lg"></div><div class="skeleton-row lg"></div><div class="skeleton-row lg"></div></div><div class="skeleton-row"></div><div class="skeleton-row"></div><div class="skeleton-row" style="width:72%"></div></div></div></article>
      <article class="state-card"><div class="state-label"><span>02 / Empty</span><span>所选时间范围无事件</span></div><div class="state-preview"><div><div class="empty-icon">○</div><div class="empty-title">这个时间范围还没有数据</div><p class="empty-copy">调整日期范围或稍后再来查看。匿名统计仍在后台持续启用。</p><div class="control primary compact" style="margin-top:16px">查看近 30 天</div></div></div></article>
      <article class="state-card"><div class="state-label"><span>03 / Filter no result</span><span>筛选条件无匹配</span></div><div class="state-preview"><div><div class="empty-icon">⌕</div><div class="empty-title">没有符合筛选条件的事件</div><p class="empty-copy">现有数据未被删除。清除语言、设备、来源、结果或版本筛选后重试。</p><div class="control compact" style="margin-top:16px">清除全部筛选</div></div></div></article>
      <article class="state-card danger-panel"><div class="state-label"><span>04 / Database unavailable</span><span>${badge("监控不可用","error")}</span></div><div class="state-preview" style="background:#fffafa;border-color:#efcfd4"><div><div class="empty-icon" style="color:#a53d4b;background:#fcecef">!</div><div class="empty-title">暂时无法读取监控数据库</div><p class="empty-copy">公开主页、地点查询、路线查询和 APK 下载不受影响。系统会继续记录进程内 dropped count。</p><div class="control compact" style="margin-top:16px">重新载入监控数据</div></div></div></article>
    </section>
  </div>`;
}

function apk() {
  return `<div class="board apk-board">
    <header class="apk-header"><div><div class="eyebrow">Homepage Download Metadata</div><h1 class="doc-title">APK 版本与大小展示状态</h1><p class="doc-subtitle">元数据请求同时记录主页 page_view。请求失败只影响版本与大小文案，稳定下载 URL 始终保持可点击。</p></div><span class="badge info">zh-Hant · zh-Hans · en</span></header>
    <section class="apk-grid">
      <article class="apk-state"><div class="state-label"><span>01 / Metadata success</span><span>${badge("成功","success")}</span></div><div class="homepage-slice"><div class="eyebrow">下载 App</div><h2 style="margin:0;font-size:27px;letter-spacing:-.035em">把香港巴士路线带在身边</h2><p class="page-subtitle">Android 安装包由本站安全提供。</p><div class="download-card"><div class="download-platform"><span class="android-icon">A</span><div><div class="download-title">下载 Android APK</div><div class="download-meta">版本 1.0 (1) · 36.8 MB</div></div></div><span class="download-arrow">↓</span></div><div class="annotation">来自 GET /api/downloads/android/latest/metadata；页面前端把 sizeBytes 格式化为当前语言文案。</div></div></article>
      <article class="apk-state"><div class="state-label"><span>02 / Metadata unavailable</span><span>${badge("降级","warning")}</span></div><div class="homepage-slice"><div class="eyebrow">下载 App</div><h2 style="margin:0;font-size:27px;letter-spacing:-.035em">把香港巴士路线带在身边</h2><p class="page-subtitle">Android 安装包由本站安全提供。</p><div class="download-card"><div class="download-platform"><span class="android-icon">A</span><div><div class="download-title">下载 Android APK</div><div class="download-meta">版本与大小暂时不可用</div></div></div><span class="download-arrow">↓</span></div><div class="unavailable-note"><span>!</span><span>无需重新加载版本信息；下载仍可正常开始。</span></div><div class="annotation">不显示硬编码旧版本、不提供手动重试，也不让元数据错误阻断 APK 下载。</div></div></article>
    </section>
  </div>`;
}

function mobileInvestigation() {
  const compactEvent = ({ time, type, visitorId, locale, status, duration, failure = false }) => `
    <article class="card card-pad mobile-event-card">
      <div class="mobile-event-head"><span class="event-type">${type}</span>${badge(status, failure ? "error" : "success")}</div>
      <dl class="mobile-event-fields">
        <dt>时间</dt><dd>${time}</dd>
        <dt>Visitor ID</dt><dd class="mono">${visitorId}</dd>
        <dt>语言 · 设备</dt><dd>${locale} · mobile</dd>
        <dt>耗时</dt><dd>${duration}</dd>
      </dl>
    </article>`;

  return `<div class="board mobile mobile-investigation">
    <header class="mobile-head"><div class="mobile-title-row"><div class="mobile-brand"><span class="mobile-mark">B</span><span>BusIsComing Pulse</span></div>${badge("调查模式", "info")}</div></header>
    <main class="mobile-content">
      <section class="mobile-investigation-intro"><div><div class="eyebrow">事件明细 · 手机</div><h1>匿名访问调查</h1></div><span class="investigation-count">17,742<br><small>筛选结果</small></span></section>
      <section class="mobile-filter-stack" aria-label="事件筛选">
        <div><span class="filter-chip active">近 30 天</span><span class="filter-chip">事件：全部⌄</span></div>
        <div><span class="filter-chip">结果：失败⌄</span><span class="filter-chip">语言⌄</span><span class="filter-chip">设备⌄</span></div>
      </section>
      <div class="privacy-note"><span class="lock">◇</span><span>只显示允许的匿名字段；不保存 IP、查询词、地点、坐标、Cookie 或完整 User-Agent。</span></div>
      <section class="mobile-investigation-summary" aria-label="筛选结果摘要"><div><b>17,422</b><span>成功事件</span></div><div><b>320</b><span>失败事件</span></div><div><b>3,216</b><span>独立浏览器</span></div></section>
      <section class="mobile-event-section" aria-label="匿名事件明细">
        <div class="mobile-section-head"><div><h2>匿名事件</h2><p>按发生时间倒序</p></div><span>每页 50 条</span></div>
        <div class="mobile-event-cards">
          ${compactEvent({time:"2026-07-20 09:15:12",type:"route_query",visitorId:"4e22…19af",locale:"zh-Hans",status:"502 · 失败",duration:"2.10s",failure:true})}
          ${compactEvent({time:"2026-07-20 09:13:07",type:"place_query",visitorId:"bd70…c412",locale:"zh-Hant",status:"200 · 成功",duration:"355ms"})}
          ${compactEvent({time:"2026-07-20 09:12:44",type:"page_view",visitorId:"bd70…c412",locale:"zh-Hant",status:"200 · 成功",duration:"31ms"})}
        </div>
      </section>
      <section class="card card-pad mobile-visitor-search" aria-label="匿名访客精确搜索">
        <div class="card-head"><div><h2 class="card-title">精确查找 Visitor ID</h2><div class="card-note">只有维护者主动输入完整值时才显示完整标识</div></div></div>
        <div class="visitor-input mono">a83f9273d84c4b2e9d819db05fe092d1</div>
        <div class="visitor-actions"><button class="control primary" type="button">查找访客</button><button class="control" type="button">复制完整 ID</button></div>
        <p class="copy-feedback" aria-live="polite">✓ 已复制完整 Visitor ID</p>
      </section>
      <section class="card card-pad mobile-timeline" aria-label="会话时间线">
        <div class="card-head"><div><h2 class="card-title">会话时间线</h2><div class="card-note">30 分钟无活动后切分新会话</div></div><span class="card-meta">会话 #18</span></div>
        <div class="session-divider">2026-07-20 · 4 个事件 · 持续 51 秒</div>
        <div class="timeline">${timelineItem("09:16", "访问主页", "zh-Hant · search")}${timelineItem("09:15", "地点查询", "成功 · 381ms")}${timelineItem("09:15", "路线查询", "成功 · 1.42s")}${timelineItem("09:15", "下载请求", "Android · v1.0 (1)")}</div>
      </section>
      <nav class="mobile-pagination" aria-label="事件分页"><button class="control" type="button">← 上一页</button><span>1 / 355</span><button class="control primary" type="button">下一页 →</button></nav>
    </main>
    <nav class="mobile-secondary-nav"><span>总览</span><span class="active">事件</span><span>访客</span><span>系统</span></nav>
  </div>`;
}

function mobileApk() {
  const downloadCard = metadata => `<div class="download-card"><div class="download-platform"><span class="android-icon">A</span><div><div class="download-title">下载 Android APK</div><div class="download-meta">${metadata}</div></div></div><span class="download-arrow">↓</span></div>`;

  return `<div class="board mobile mobile-apk-board">
    <header class="mobile-apk-hero"><div class="mobile-brand"><span class="mobile-mark">B</span><span>BusIsComing</span></div><span class="badge info">zh-Hant · 简 · EN</span><div class="eyebrow">Homepage Download Metadata</div><h1>APK 版本与大小</h1><p>元数据失败只降级版本与大小，稳定下载入口始终可以使用。</p></header>
    <main class="mobile-apk-stack">
      <article class="mobile-apk-state" data-state="ready">
        <div class="state-label"><span>01 / Metadata ready</span>${badge("可用", "success")}</div>
        <div class="mobile-homepage-slice"><div class="eyebrow">下载 App</div><h2>把香港巴士路线带在身边</h2><p>Android 安装包由本站安全提供。</p>${downloadCard("版本 1.0 (1) · 36.8 MB")}<div class="locale-copy-list"><div><span>繁中</span><b>版本 1.0 (1) · 36.8 MB</b></div><div><span>简中</span><b>版本 1.0 (1) · 36.8 MB</b></div><div><span>EN</span><b>Version 1.0 (1) · 36.8 MB</b></div></div><div class="annotation">版本和大小由当前 metadata 按页面语言格式化。</div></div>
      </article>
      <article class="mobile-apk-state" data-state="unavailable">
        <div class="state-label"><span>02 / Metadata unavailable</span>${badge("降级", "warning")}</div>
        <div class="mobile-homepage-slice"><div class="eyebrow">下载 App</div><h2>把香港巴士路线带在身边</h2><p>Android 安装包由本站安全提供。</p>${downloadCard("版本与大小暂时不可用")}<div class="locale-copy-list compact"><div><span>繁中</span><b>版本及大小暫時未能提供</b></div><div><span>简中</span><b>版本与大小暂时不可用</b></div><div><span>EN</span><b>Version and size unavailable</b></div></div><div class="unavailable-note"><span class="unavailable-mark">!</span><span>无需重新载入版本信息；下载仍可正常开始。</span></div><div class="annotation">不显示旧版本、不自动或手动重试 metadata。</div></div>
      </article>
    </main>
  </div>`;
}

function queryFailure() {
  return `<div class="board query-failure-board">
    <header class="query-failure-header"><div><div class="eyebrow">Pulse UI States · Query Failure</div><h1 class="doc-title">查询失败也要保留调查上下文</h1><p class="doc-subtitle">普通失败允许手动重试；数据库不可用说明监控存储状态。两者不共用错误文案，也不影响公开主页、试查或下载。</p></div><span class="badge info">Desktop · 1440</span></header>
    <section class="query-failure-layout">
      <aside class="card card-pad retained-filters" aria-label="已保留筛选条件">
        <div class="card-head"><div><h2 class="card-title">已保留筛选</h2><div class="card-note">重试不会重置当前调查范围</div></div>${badge("4 项", "neutral")}</div>
        <div class="key-list"><div class="key-row"><span>时间范围</span><b>近 30 天</b></div><div class="key-row"><span>事件</span><b>路线查询</b></div><div class="key-row"><span>结果</span><b>失败</b></div><div class="key-row"><span>语言</span><b>zh-Hant</b></div></div>
        <div class="saved-query"><span class="saved-query-dot"></span><div><b>当前查询已保留</b><small>重新载入后继续使用相同筛选</small></div></div>
      </aside>
      <div class="query-failure-stack">
        <article class="query-error-panel" data-state="query-failure">
          <div class="state-label"><span>01 / Retryable query failure</span>${badge("可重试", "warning")}</div>
          <div class="query-error-content"><div class="query-error-icon">↻</div><div><h2>暂时无法载入这组监控数据</h2><p>请求可能因短暂网络或服务错误失败。筛选条件仍然保留，请在准备好后手动重试。</p><div class="query-error-actions"><button class="control primary" type="button">重试查询</button><button class="control" type="button">查看系统状态</button></div></div></div>
          <div class="error-footnote"><span>错误类别：query_unavailable</span><span>不会自动循环重试</span><span>公开业务不受影响</span></div>
        </article>
        <article class="query-error-panel database-error-panel" data-state="database-unavailable">
          <div class="state-label"><span>02 / Database unavailable</span>${badge("监控不可用", "error")}</div>
          <div class="database-error-content"><div class="query-error-icon">!</div><div><h2>监控数据库当前不可用</h2><p>聚合和明细暂时无法读取；系统状态仍会提供受控原因类别和进程内 dropped count。</p></div><div class="database-health"><span>SQLite</span><b>unavailable</b><small>公开 8080 继续运行</small></div></div>
        </article>
      </div>
    </section>
    <footer class="query-failure-footer"><span>BusIsComing Pulse v1.1</span><span>失败状态不泄露数据库路径、错误原文或请求内容</span></footer>
  </div>`;
}

const renderers = {
  overview,
  traffic,
  downloads,
  events,
  visitor,
  performance,
  system,
  mobile,
  states,
  apk,
  "mobile-investigation": mobileInvestigation,
  "mobile-apk": mobileApk,
  "query-failure": queryFailure,
};
const renderer = renderers[screen] || overview;
document.getElementById("app").innerHTML = renderer();
document.title = `BusIsComing Pulse · ${screen}`;
