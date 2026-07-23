const params = new URLSearchParams(window.location.search);
const screen = params.get("screen") || "date-tooltip";

const groups = [
  ["业务监控", ["总览", "流量与试查", "下载分析"]],
  ["技术监控", ["稳定性 & 时延", "系统状态"]],
  ["数据明细", ["事件明细", "访客明细"]],
];

function nav(active) {
  return `<aside class="v13-sidebar">
    <div class="v13-brand"><span>B</span><div><b>BusIsComing</b><small>Pulse</small></div></div>
    ${groups.map(([title, items]) => `<section><p>${title}</p>${items.map((item) => `<div class="${item === active ? "active" : ""}">${item}</div>`).join("")}</section>`).join("")}
    <div class="v13-private"><b>● 私有访问</b><span>127.0.0.1 · 实时写入</span></div>
  </aside>`;
}

function docHeader(index, title, body) {
  return `<header class="v13-doc-head"><div><span>${index} · PULSE V1.3</span><h1>${title}</h1><p>${body}</p></div><b>Analytics Observability<br><small>2026-07-24</small></b></header>`;
}

function shell(index, title, body, active, content, height) {
  return `<main class="v13-board" style="height:${height}px">${nav(active)}<section class="v13-main">${docHeader(index, title, body)}${content}</section></main>`;
}

function metric(label, value, trend, tone = "") {
  return `<article class="v13-metric"><span>${label}</span><strong>${value}</strong><small class="${tone}">${trend}</small></article>`;
}

function lineChart(kind = "latency") {
  const sli = kind === "sli";
  return `<svg class="v13-chart" viewBox="0 0 560 220" aria-hidden="true">
    <g class="v13-grid"><line x1="56" y1="30" x2="540" y2="30"/><line x1="56" y1="82" x2="540" y2="82"/><line x1="56" y1="134" x2="540" y2="134"/><line x1="56" y1="186" x2="540" y2="186"/></g>
    <g class="v13-axis"><line x1="56" y1="20" x2="56" y2="186"/><line x1="56" y1="186" x2="540" y2="186"/></g>
    <path class="v13-line teal" d="${sli ? "M56 48 L132 46 L208 55 L284 44 L360 49 L436 43 L512 47" : "M56 166 L132 154 L208 133 L284 145 L360 96 L436 118 L512 72"}"/>
    <path class="v13-line purple" d="${sli ? "M56 62 L132 58 L208 70 L284 53 L360 62 L436 54 L512 60" : "M56 149 L132 128 L208 143 L284 88 L360 111 L436 54 L512 76"}"/>
    <path class="v13-line amber" d="${sli ? "M56 82 L132 75 L208 96 L284 72 L360 87 L436 74 L512 80" : "M56 176 L132 168 L208 158 L284 153 L360 131 L436 140 L512 116"}"/>
    <path class="v13-line blue" d="${sli ? "M56 56 L132 52 L208 61 L284 51 L360 57 L436 50 L512 55" : "M56 181 L132 178 L208 174 L284 169 L360 158 L436 163 L512 149"}"/>
  </svg>`;
}

function legend() {
  return `<div class="v13-legend"><span class="teal">● 主页</span><span class="purple">● 地点</span><span class="amber">● 路线</span><span class="blue">● 下载</span></div>`;
}

function dateTooltip() {
  const content = `
    <section class="v13-top-control"><span>全局日期范围</span><b>2026/07/01 – 2026/07/24⌄</b></section>
    <div class="v13-date-grid">
      <article class="v13-card date-step"><em>第 1 / 2 步</em><h2>选择开始日期</h2><div class="date-input">2026 / 07 / 01</div><div class="calendar"><b>日</b><b>一</b><b>二</b><b>三</b><b>四</b><b>五</b><b>六</b><span>28</span><span>29</span><span>30</span><span class="selected">1</span><span>2</span><span>3</span><span>4</span></div><p>点选后自动进入结束日期；被浏览器阻止时保留一次点击入口。</p></article>
      <article class="v13-card date-step"><em>第 2 / 2 步</em><h2>选择结束日期</h2><div class="date-input">2026 / 07 / 24</div><div class="calendar"><b>日</b><b>一</b><b>二</b><b>三</b><b>四</b><b>五</b><b>六</b><span>19</span><span>20</span><span>21</span><span>22</span><span>23</span><span class="selected">24</span><span>25</span></div><p>选定后立即应用；Escape 或点击外部保持原范围。</p></article>
      <article class="v13-card date-done"><em>完成</em><h2>范围已应用</h2><strong>2026/07/01 – 2026/07/24</strong><p>右上角与高级筛选同步。跨年时显示两个完整年份。</p><div><span>开始日期</span><b>2026-07-01</b><span>结束日期</span><b>2026-07-24</b></div></article>
    </div>
    <article class="v13-card single-tooltip"><div><h2>单一 Tooltip 行为</h2><p>鼠标与键盘提示互斥，共用相同数据口径。</p>${legend()}</div>${lineChart()}<aside><b>7月23日</b><span>主页 PV <strong>4</strong></span><span>主页 UV <strong>1</strong></span><span>路线 UV <strong>1</strong></span></aside></article>
    <footer class="v13-note"><b>状态覆盖</b><span>非法顺序 · 未来日期 · 取消 · 浏览器阻止自动打开 · 鼠标/键盘输入切换</span></footer>`;
  return shell("18", "自定日期与单一 Tooltip", "时间范围可解释、双入口同步，图表任意时刻只显示一个提示框。", "总览", content, 1000);
}

function stability() {
  const content = `
    <div class="v13-date-pill">2026/07/01 – 2026/07/24</div>
    <section class="v13-metrics six">${metric("总请求", "20,486", "↗ +11.8% 较上期", "good")}${metric("成功率", "98.2%", "↘ -0.4% 较上期", "bad")}${metric("P50", "218 ms", "↘ -18 ms 较上期", "good")}${metric("P95", "1,120 ms", "↗ +8.2% 较上期", "bad")}${metric("失败请求", "320", "1.8% 总请求")}${metric("Dropped", "7", "进程启动以来")}</section>
    <section class="v13-chart-grid">
      <article class="v13-card"><header><div><h2>响应时间趋势</h2><p>四类事件 · 单位 ms</p></div><button>P95⌄</button></header>${lineChart()}${legend()}</article>
      <article class="v13-card"><header><div><h2>SLI 成功率</h2><p>成功 PV ÷ 总 PV · 无请求桶留空</p></div><b>%</b></header>${lineChart("sli")}${legend()}</article>
    </section>
    <article class="v13-card endpoint-card"><header><div><h2>公开接口效能</h2><p>下降为改善，上升为恶化；颜色不是唯一线索。</p></div></header><table><thead><tr><th>Operation ID</th><th>请求</th><th>成功率</th><th>P50</th><th>P50 较上期</th><th>P95</th><th>P95 较上期</th></tr></thead><tbody><tr><td>getLatestAndroidApkMetadata</td><td>4,822</td><td>99.9%</td><td>28 ms</td><td class="good">↘ -4 ms</td><td>43 ms</td><td>— 无变化</td></tr><tr><td>queryRoutePlaces</td><td>8,240</td><td>98.7%</td><td>218 ms</td><td class="good">↘ -8.4%</td><td>932 ms</td><td class="bad">↗ +72 ms</td></tr><tr><td>queryRouteOptions</td><td>6,102</td><td>96.4%</td><td>420 ms</td><td>暂无同期数据</td><td>1,800 ms</td><td class="bad">↗ +9.1%</td></tr><tr><td>downloadLatestAndroidApk</td><td>1,322</td><td>99.7%</td><td>37 ms</td><td class="good">↘ -100%</td><td>61 ms</td><td>+61 ms（上期为 0）</td></tr></tbody></table></article>
    <footer class="v13-note"><b>比较边界</b><span>持平 · 上期为 0 · 暂无同期样本 · 当前无样本 · 比较关闭</span></footer>`;
  return shell("19", "稳定性 & 时延", "P50/P95 单独选择、四类事件 SLI、端点同期比较和明确单位。", "稳定性 & 时延", content, 1200);
}

function business() {
  const eventMetrics = `${metric("筛选结果", "17,742", "↗ +6.2% 较上期", "good")}${metric("成功事件", "17,422", "— 与上期无变化")}${metric("失败事件", "320", "↗ +28 较上期", "bad")}${metric("独立访客", "3,216", "↗ +4.8% 较上期", "good")}`;
  const trafficMetrics = `${metric("主页浏览 PV", "8,642", "↗ +7.1%", "good")}${metric("主页浏览 UV", "3,216", "↗ +4.8%", "good")}${metric("地点查询 PV", "6,980", "↗ +9.4%", "good")}${metric("地点查询 UV", "2,104", "↗ +5.3%", "good")}${metric("路线查询 PV", "4,312", "↘ -2.1%")}${metric("路线查询 UV", "1,564", "— 与上期无变化")}`;
  const content = `
    <article class="v13-section"><h2>事件明细 · 同期比较</h2><p>四张卡均来自完整筛选范围，不受当前 50 条分页影响。</p><section class="v13-metrics four">${eventMetrics}</section></article>
    <article class="v13-card compare-states"><h2>比较语义</h2><div><span class="good">↗ 数量增长</span><span class="bad">↗ 失败增加</span><span>— 无变化</span><span>暂无同期数据</span><span>比较已关闭</span></div></article>
    <article class="v13-section"><h2>流量与试查 · 六项指标</h2><p>PV 包含成功和失败；UV 按匿名 Visitor ID 分别去重，不代表自然人。</p><section class="v13-metrics six">${trafficMetrics}</section></article>
    <article class="v13-card business-chart"><header><div><h2>浏览与成功试查趋势</h2><p>保持既有主页 PV、主页 UV、成功路线查询 UV 三条序列。</p></div></header>${lineChart()}${legend()}</article>`;
  return shell("20", "业务与事件指标", "事件同期卡和主页、地点、路线六项 PV/UV，保持既有趋势口径。", "流量与试查", content, 1000);
}

function details() {
  const content = `
    <section class="v13-detail-columns">
      <article class="v13-workspace">
        <header><span>访客明细</span><h2>对齐 Figma 的调查摘要</h2><p>a8f4c2907d5e4b1f9a1d22　复制完整 ID</p></header>
        <div class="visitor-four"><div><span>首次出现</span><b>06/24</b><small>18:42</small></div><div><span>最后出现</span><b>07/23</b><small>09:16</small></div><div><span>会话</span><b>18</b><small>30 分钟切分</small></div><div><span>累计事件</span><b>126</b><small>4 类事件</small></div></div>
        <div class="visitor-lower"><section><h3>事件构成</h3><p><span>主页访问</span><b>42</b></p><p><span>地点查询</span><b>37</b></p><p><span>路线查询</span><b>30</b></p><p><span>下载请求</span><b>17</b></p></section><section><h3>访客偏好</h3><p><span>语言</span><b>繁体中文</b></p><p><span>平台</span><b>Android</b></p><p><span>装置</span><b>手机</b></p><small>没有下载事件时显示“暂无平台数据”</small></section></div>
        <div class="timeline-v13"><h3>会话 #18 · 5 个事件</h3><p>● 09:16　访问主页</p><p>● 09:16　地点查询</p><p>● 09:15　路线查询</p></div>
      </article>
      <article class="v13-workspace">
        <header><span>系统状态</span><h2>SQLite 与服务运行信息</h2><p>删除重复存储概况和隔离与降级路径。</p></header>
        <div class="system-top"><div><span>数据库</span><b>可读写</b><small>动态状态</small></div><div><span>最后成功写入</span><b>09:16:42</b><small>香港时间</small></div><div><span>Dropped</span><b>7</b><small>进程启动以来</small></div><div><span>私有监听器</span><b>正常</b><small>仅本机</small></div></div>
        <section class="system-panel"><h3>SQLite 明细存储</h3><dl><dt>总明细数</dt><dd>1,002,486</dd><dt>今日明细数</dt><dd>684</dd><dt>主数据文件大小</dt><dd>86.4 MB</dd><dt>最后成功写入</dt><dd>09:16:42</dd></dl></section>
        <section class="system-panel"><h3>运行信息</h3><dl><dt>SQLite / Journal</dt><dd>3.51.3 / WAL</dd><dt>Schema 版本</dt><dd>002</dd><dt>进程启动 / 运行时长</dt><dd>07/20 21:16 / 3d 12h</dd><dt>监听地址</dt><dd>127.0.0.1:18081</dd></dl></section>
      </article>
    </section>
    <footer class="v13-note"><b>隐私边界</b><span>不展示数据库绝对路径、签名密钥、客户端网络标识、请求内容或内部错误原文。</span></footer>`;
  return shell("21", "系统与访客明细", "访客摘要恢复原型，系统状态聚焦存储、运行、进程和监听器。", "访客明细", content, 1200);
}

function mobile() {
  return `<main class="v13-mobile">
    <header><div><span>B</span><b>BusIsComing Pulse</b></div><em>● 正常</em></header>
    <section class="mobile-v13-content">
      <small>22 · MOBILE OBSERVABILITY</small><h1>稳定性 & 时延</h1><p>香港时间 · 自定范围</p>
      <button class="mobile-date">2026/07/01 – 2026/07/24⌄</button>
      <article class="mobile-step"><em>第 1 / 2 步</em><h2>选择开始日期</h2><b>2026 / 07 / 01</b><p>完成后进入结束日期；取消不改变已应用范围。</p></article>
      <div class="mobile-v13-metrics">${metric("P50", "218 ms", "↘ -18 ms 较上期", "good")}${metric("P95", "1,120 ms", "↗ +8.2% 较上期", "bad")}</div>
      <article class="v13-card mobile-chart-card"><header><div><h2>响应时间趋势</h2><p>四类事件 · 单位 ms</p></div><button>P95⌄</button></header>${lineChart()}${legend()}</article>
      <article class="v13-card mobile-chart-card"><header><div><h2>SLI 成功率</h2><p>成功 PV ÷ 总 PV</p></div><b>%</b></header>${lineChart("sli")}${legend()}</article>
      <article class="mobile-summary"><h2>访客明细</h2><div><span>首次出现 <b>06/24</b></span><span>最后出现 <b>07/23</b></span><span>会话 <b>18</b></span><span>累计事件 <b>126</b></span></div><p>访客偏好　繁体中文 · Android · 手机</p></article>
      <article class="mobile-summary"><h2>SQLite 明细存储</h2><p>总明细 1,002,486 · 今日 684</p><p>86.4 MB · WAL · Schema 002</p></article>
    </section>
    <nav><b>总览</b><span>业务</span><span>技术</span><span>明细</span></nav>
  </main>`;
}

const screens = { "date-tooltip": dateTooltip, stability, business, details, mobile };
document.getElementById("app").innerHTML = (screens[screen] || dateTooltip)();
