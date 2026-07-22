const screen = new URLSearchParams(window.location.search).get("screen") || "typography";

const trendCopy = {
  flat: "— 较上期持平",
  none: "○ 暂无同期数据",
  off: "◌ 未启用同期比较",
  up: "↗ +12.6% 较上期",
};

function header(eyebrow, title, subtitle) {
  return `<header class="doc-head"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${subtitle}</p></div><div class="version">Pulse v1.2<br><span>Dashboard Remediation</span></div></header>`;
}

function metric(label, value, trend = "up", hint = "") {
  return `<article class="metric"><div class="metric-label">${label}</div><div class="metric-value ${String(value).length > 8 ? "long" : ""}">${value}</div><div class="trend ${trend}">${trendCopy[trend]}</div>${hint ? `<div class="metric-hint">${hint}</div>` : ""}</article>`;
}

function card(title, note, content, className = "") {
  return `<article class="card ${className}"><div class="card-head"><div><h2>${title}</h2><p>${note}</p></div></div>${content}</article>`;
}

function typography() {
  const typeRows = [
    ["页面标题", "30 px / 700", "监控总览"],
    ["卡片标题", "18 px / 700", "访问与成功试查趋势"],
    ["正文与表格", "15 px / 400–600", "同一筛选范围内的匿名事件"],
    ["辅助、图例、坐标", "13 px / 400–650", "Asia/Hong_Kong · 自动刷新 60 秒"],
    ["指标标签", "14 px / 650", "独立浏览器 UV"],
    ["指标值", "40 px / 760", "3,216"],
  ];
  return `<main class="board desktop typography-board">
    ${header("14 · VISUAL SYSTEM", "字体与指标卡语义", "更适合长时间阅读的 C 级字号；删除无语义圆圈和光斑，用明确文字表达比较状态。")}
    <section class="metrics four">
      ${metric("页面浏览量 PV", "12,480", "up")}
      ${metric("成功地点查询 UV", "2,444", "flat", "按匿名独立浏览器去重")}
      ${metric("成功路线查询 UV", "1,564", "none")}
      ${metric("当前版本", "1.0 (1)", "off", "长值下限 32px")}
    </section>
    <section class="two-col">
      ${card("桌面字体比例", "1440px 画板 · 可见辅助文字不低于 13px", `<div class="type-table">${typeRows.map(([name,size,sample]) => `<div class="type-row"><span>${name}</span><b>${size}</b><em class="sample-${name}">${sample}</em></div>`).join("")}</div>`)}
      ${card("状态不是装饰", "趋势、数据可用性和比较开关使用不同语义", `<div class="state-stack"><div><span class="state-icon positive">↗</span><b>+12.6% 较上期</b><p>有上一周期且数值上升。</p></div><div><span class="state-icon neutral">—</span><b>较上期持平</b><p>明确表示 delta = 0，不显示“--”。</p></div><div><span class="state-icon empty">○</span><b>暂无同期数据</b><p>当前周期有值，但上一周期没有可比较数据。</p></div><div><span class="state-icon off">◌</span><b>未启用同期比较</b><p>维护者主动关闭比较，不暗示数据缺失。</p></div></div>`)}
    </section>
    <footer class="design-note"><b>响应式规则</b><span>手机指标 36px；页面标题 26px；卡片标题 16px；正文 14px；任何可见文字不低于 12px。</span><span>状态同时使用符号、文字和数值，不只依赖红绿颜色。</span></footer>
  </main>`;
}

function lineChart() {
  return `<div class="chart-shell"><div class="legend"><span><i class="pv"></i>主页 PV</span><span><i class="uv"></i>主页 UV</span><span><i class="route"></i>成功路线查询 UV</span></div><svg class="line-chart" viewBox="0 0 920 320" role="img" aria-label="Grafana 风格流量趋势"><g class="grid"><line x1="70" y1="24" x2="900" y2="24"/><line x1="70" y1="88" x2="900" y2="88"/><line x1="70" y1="152" x2="900" y2="152"/><line x1="70" y1="216" x2="900" y2="216"/><line x1="70" y1="280" x2="900" y2="280"/><line x1="70" y1="24" x2="70" y2="280"/><line x1="236" y1="24" x2="236" y2="280"/><line x1="402" y1="24" x2="402" y2="280"/><line x1="568" y1="24" x2="568" y2="280"/><line x1="734" y1="24" x2="734" y2="280"/><line x1="900" y1="24" x2="900" y2="280"/></g><g class="axis"><text x="23" y="285">0</text><text x="10" y="221">400</text><text x="10" y="157">800</text><text x="3" y="93">1.2k</text><text x="3" y="29">1.6k</text><text x="70" y="312">06/24</text><text x="217" y="312">06/30</text><text x="383" y="312">07/06</text><text x="549" y="312">07/12</text><text x="715" y="312">07/18</text><text x="859" y="312">07/23</text></g><path class="path pv" d="M70 245 L153 211 L236 225 L319 170 L402 188 L485 118 L568 143 L651 76 L734 101 L817 47 L900 71"/><path class="path uv" d="M70 268 L153 250 L236 258 L319 224 L402 236 L485 190 L568 205 L651 159 L734 176 L817 132 L900 145"/><path class="path route" d="M70 278 L153 272 L236 275 L319 258 L402 264 L485 240 L568 249 L651 224 L734 234 L817 207 L900 216"/><g class="points">${[70,153,236,319,402,485,568,651,734,817,900].map((x,i)=>`<circle cx="${x}" cy="${[245,211,225,170,188,118,143,76,101,47,71][i]}" r="4"/>`).join("")}</g><line class="crosshair" x1="651" y1="24" x2="651" y2="280"/></svg><div class="tooltip"><b>2026-07-14 · 香港时间</b><span><i class="pv"></i>主页 PV <strong>1,274</strong></span><span><i class="uv"></i>主页 UV <strong>612</strong></span><span><i class="route"></i>成功路线查询 UV <strong>188</strong></span></div></div>`;
}

function heatmap() {
  const days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  const cells = days.map((day, row) => `<div class="heat-row"><b>${day}</b>${Array.from({length:14},(_,col)=>{const n=(row*5+col*3)%6; return `<i class="heat h${n}" title="2026-07-${String(Math.min(23,col*7+row+1)).padStart(2,"0")}"></i>`;}).join("")}</div>`).join("");
  return `<div class="heat-wrap"><div class="heat-scroll"><div class="month-row"><span></span><b>5 月</b><b>6 月</b><b>7 月</b></div>${cells}<div class="heat-tooltip"><b>2026-07-14 · 周二</b><span>匿名事件 612</span><span>独立浏览器 UV 184</span></div></div></div><div class="heat-legend"><span>少</span>${[0,1,2,3,4,5].map(n=>`<i class="heat h${n}"></i>`).join("")}<span>多</span></div>`;
}

function charts() {
  return `<main class="board desktop charts-board">
    ${header("15 · DATA VISUALIZATION", "Grafana 式趋势与逐日热力图", "图例、坐标和 Tooltip 直接解释数据；图表下方不再堆放摘要或可见数据表。")}
    ${card("访问与成功试查趋势", "香港时间 · 近 30 天 · 按日", lineChart(), "chart-card")}
    ${card("匿名事件逐日热力图", "一天一个格子 · 周一至周日从上到下 · 周次从左到右", heatmap(), "heat-card")}
    <footer class="design-note"><b>交互说明</b><span>鼠标悬停或键盘聚焦同一时间桶时显示共享 Tooltip 与十字线。</span><span>辅助技术数据表视觉隐藏；日期过多时只滚动热力图绘图区。</span></footer>
  </main>`;
}

function miniMetric(label, value, note) {
  return `<div class="mini-metric"><span>${label}</span><b>${value}</b><small>${note}</small></div>`;
}

function eventTable() {
  return `<div class="privacy">◇ 不保存 IP、完整 UA/Referrer、查询词、地点、坐标、Cookie 或 token</div><div class="mini-metrics">${miniMetric("筛选结果","17,742","完整筛选范围")}${miniMetric("成功事件","17,422","98.2%")}${miniMetric("失败事件","320","1.8%")}${miniMetric("独立浏览器","3,216","匿名 Visitor ID")}</div><table><thead><tr><th>时间</th><th>事件</th><th>Visitor ID</th><th>语言 / 设备</th><th>状态</th><th>耗时</th></tr></thead><tbody><tr><td>09:16:42</td><td>page_view</td><td>a8f4…1d22</td><td>zh-Hant / mobile</td><td><span class="ok">成功</span></td><td>28ms</td></tr><tr><td>09:16:29</td><td>route_query</td><td>a8f4…1d22</td><td>zh-Hant / mobile</td><td><span class="ok">成功</span></td><td>1.42s</td></tr></tbody></table><div class="pager"><span>1–50 / 17,742</span><span>上一页　1 / 355　<b>下一页 →</b></span></div>`;
}

function visitorPanel() {
  return `<div class="search">a8f4c2907d5e4b1f9a1d22　 <b>复制完整 ID</b></div><div class="mini-metrics">${miniMetric("首次出现","06/24","18:42")}${miniMetric("最后出现","07/23","09:16")}${miniMetric("会话","18","30 分钟切分")}${miniMetric("累计事件","126","4 类事件")}</div><div class="split"><div class="composition"><b>事件构成</b><p><span>主页访问</span><strong>42</strong></p><p><span>地点查询</span><strong>37</strong></p><p><span>路线查询</span><strong>30</strong></p><p><span>下载请求</span><strong>17</strong></p></div><div class="timeline"><b>会话 #18 · 5 个事件</b><p><i></i><span>09:16 访问主页</span></p><p><i></i><span>09:16 地点查询</span></p><p><i></i><span>09:15 路线查询</span></p></div></div>`;
}

function performancePanel() {
  return `<div class="mini-metrics six">${miniMetric("总请求","20,486","较上期 +11.8%")}${miniMetric("成功率","98.2%","较上期 -0.4%")}${miniMetric("失败","320","1.8%")}${miniMetric("P50","218ms","成功请求")}${miniMetric("P95","1.12s","成功请求")}${miniMetric("Dropped","7","进程启动以来")}</div><div class="perf-row"><div><b>P50 / P95 趋势</b><svg viewBox="0 0 370 90"><path class="mini-line" d="M0 72 L52 64 L104 68 L156 42 L208 51 L260 25 L312 38 L370 17"/><path class="mini-line second" d="M0 83 L52 78 L104 80 L156 68 L208 72 L260 57 L312 63 L370 50"/></svg></div><div class="endpoint"><b>端点性能</b><p><span>metadata</span><strong>28ms</strong></p><p><span>place_query</span><strong>420ms</strong></p><p><span>route_query</span><strong>1.80s</strong></p></div></div>`;
}

function systemPanel() {
  return `<div class="system-grid"><div><span>数据库</span><b>可读写</b><small>动态状态</small></div><div><span>最后成功写入</span><b>09:16:42</b><small>动态状态</small></div><div><span>Dropped count</span><b>7</b><small>动态状态</small></div><div><span>私有监听器</span><b>仅本机</b><small>动态状态</small></div></div><div class="fact-grid"><div><b>运行状态</b><p>公开 HTTP 与私有监控 HTTP 隔离</p><p>每条事件在短 deadline 内同步尝试一次</p></div><div><b>存储概况</b><p>长期保留 · 只保存明细</p><p>无备份 · 统计数据允许丢失</p></div><div><b>隔离与降级</b><p>无写入队列 · 配置事实</p><p>private listener 不经公网代理</p></div></div>`;
}

function workspaces() {
  const panels = [
    ["事件明细", "完整范围摘要、隐私边界、50 条分页", eventTable()],
    ["匿名访客", "22 位匿名标识、事件构成、30 分钟会话", visitorPanel()],
    ["失败与性能", "六个指标、P50/P95 趋势、失败与端点", performancePanel()],
    ["系统状态", "动态健康与固定配置事实分离", systemPanel()],
  ];
  return `<main class="board desktop workspaces-board">${header("16 · INVESTIGATION WORKSPACES", "四个详细工作区恢复", "沿用 v1.1 完整页面结构，以 v1.2 字号和真实统计口径恢复关键调查路径。")}
    <section class="workspace-grid">${panels.map(([title,note,content],i)=>`<article class="workspace"><div class="workspace-title"><span>0${i+4}</span><div><h2>${title}</h2><p>${note}</p></div></div>${content}</article>`).join("")}</section>
    <footer class="design-note"><b>局部降级</b><span>性能页的 system 辅助查询失败只影响 Dropped 指标。</span><span>系统页不展示数据库绝对路径、密钥、错误原文或客户端网络标识。</span></footer>
  </main>`;
}

function mobile() {
  return `<main class="board mobile-board"><header class="mobile-head"><div><span class="mobile-brand">B</span><b>BusIsComing Pulse</b></div><span class="live">● 正常</span></header><section class="mobile-content"><div class="eyebrow">17 · MOBILE REMEDIATION</div><h1>监控总览</h1><p class="mobile-sub">香港时间 · 近 30 天 · 包含今天</p><div class="mobile-actions"><button>自定义日期</button><button class="primary">刷新数据</button></div><section class="mobile-metrics">${metric("主页 UV","3,216","flat")}${metric("成功路线查询 UV","1,564","none")}</section>${card("访问与试查趋势","PV / UV / 成功路线查询 UV",`<div class="mobile-legend"><span>● PV</span><span>● UV</span><span>● 路线 UV</span></div><svg class="mobile-chart" viewBox="0 0 340 160"><g class="grid"><line x1="30" y1="20" x2="330" y2="20"/><line x1="30" y1="75" x2="330" y2="75"/><line x1="30" y1="130" x2="330" y2="130"/></g><path class="path pv" d="M30 118 L75 100 L120 106 L165 70 L210 82 L255 43 L300 55 L330 31"/><path class="path uv" d="M30 134 L75 124 L120 127 L165 108 L210 114 L255 91 L300 98 L330 83"/><line class="crosshair" x1="255" y1="20" x2="255" y2="130"/></svg><div class="mobile-tooltip"><b>07/18</b><span>PV 1,274 · UV 612 · 路线 UV 188</span></div>`,"mobile-chart-card")}${card("事件明细","手机使用 key-value 卡，不缩放桌面表格",`<div class="event-card"><div><b>路线查询</b><span class="ok">成功</span></div><dl><dt>时间</dt><dd>2026-07-23 09:16</dd><dt>Visitor ID</dt><dd>a8f4…1d22</dd><dt>语言 / 设备</dt><dd>zh-Hant / mobile</dd><dt>耗时</dt><dd>1.42s</dd></dl><button>查看匿名访客</button></div><div class="mobile-pager"><button>上一页</button><span>1 / 355</span><button>下一页</button></div>`) }${card("系统状态","动态状态与配置事实分离",`<div class="mobile-system"><p><span>数据库</span><b>可读写</b></p><p><span>最后成功写入</span><b>09:16:42</b></p><p><span>Dropped count</span><b>7</b></p><p><span>私有监听器</span><b>仅本机</b></p></div><div class="config-fact"><b>配置事实</b><span>长期保留 · 无备份 · 无写入队列 · 不经公网代理</span></div>`)}</section><nav class="mobile-nav"><b>总览</b><span>试查</span><span>事件</span><span>系统</span></nav></main>`;
}

const screens = { typography, charts, workspaces, mobile };
document.getElementById("app").innerHTML = (screens[screen] || typography)();
