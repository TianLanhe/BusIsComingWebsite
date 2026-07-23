import type { MonitoringLocale } from "../app/MonitoringI18nProvider";
import type { EventType } from "../services/analyticsTypes";

export type DetailCopyKey = keyof typeof detailCopy.en;
type LocalizedDetailCopy = Record<MonitoringLocale, Record<string, string>>;

export const detailCopy = {
  "zh-Hans": {
    trafficSubtitle: "主页访问、地点试查与路线查询的时段及来源分析", downloadsSubtitle: "下载请求、成功响应、平台与版本表现", eventsSubtitle: "只读匿名事件明细与稳定游标分页", visitorSubtitle: "使用完整匿名 ID 调查会话路径", performanceSubtitle: "公开统计入口的成功率、分位值与受控失败", systemSubtitle: "本机统计存储、写入与私有监听器健康状态",
    trafficTrend: "访问与成功试查趋势", heatmap: "访问时段热力图", heatmapNote: "香港时间 · 颜色越深表示匿名事件越多", dimensions: "语言、设备与来源", versions: "版本表现", downloadTrend: "下载请求趋势", failures: "失败分类", platforms: "平台分布",
    eventTime: "时间", eventType: "事件类型", visitorId: "匿名访客", outcome: "结果", latency: "耗时", details: "详情", viewVisitor: "查看访客明细", nextPage: "下一页", pageSummary: "共 {count} 条匿名事件", privacyDetail: "仅显示允许字段；不含 IP、完整 UA/Referrer、查询词、地点、坐标或 token。",
    visitorSearch: "输入完整匿名 visitor ID", searchVisitor: "查询访客", copyId: "复制完整 ID", copiedId: "已复制完整匿名 ID", session: "会话", sessionTimeline: "会话时间线", visitorSummary: "访客摘要", firstSeen: "首次出现", lastSeen: "最后出现", eventCount: "累计事件", sessionCount: "会话", commonLocale: "常用语言", commonDevice: "常用设备", commonSource: "常见来源", invalidVisitorId: "请输入 22 位完整匿名 visitor ID", sessionRule: "相邻事件间隔超过 30 分钟时划分为新会话",
    endpointPerformance: "公开接口性能", latencyTrend: "响应时间趋势", systemDatabase: "SQLite 明细存储", systemProcess: "写入进程", systemListener: "私有监听器", rowCount: "明细行数", databaseSize: "文件大小", dropped: "启动后丢弃", publicProxy: "公网代理", healthy: "可用", degraded: "降级", unavailable: "不可用", noPublicProxy: "未启用",
    previousPage: "上一页", requestSuccess: "成功率", requests: "请求数", failureRequests: "失败请求", uniqueVisitors: "独立浏览器", controlledCategories: "受控失败类别", nearestRank: "nearest-rank 分位值", noDetailData: "当前工作区暂无结果", noDetailBody: "调整时间范围或筛选条件后再查看。", lastSuccessfulWrite: "最近成功写入", processStarted: "进程启动时间", listenerState: "监听器状态", listenerAddress: "监听地址", writeHealth: "写入健康",
    eventSummaryTotal: "完整范围事件", eventSummarySuccess: "成功事件", eventSummaryFailure: "失败事件", eventSummaryVisitors: "独立浏览器",
    itemRange: "第 {start}–{end} 条，共 {total} 条", pagePosition: "第 {page} 页", eventComposition: "事件类型构成", commonPlatform: "常见下载平台", noPlatformData: "暂无下载平台数据",
    backToEvents: "返回事件明细", copyFailed: "复制失败，请手动复制", configurationFact: "配置事实", runtimeStatus: "运行状态", storageOverview: "存储概况", isolationFallback: "隔离与降级路径",
    retentionLongTerm: "匿名事件明细长期保留", backupDisabled: "未启用备份，统计数据允许丢失", writeQueueDisabled: "未启用写入队列，每次同步尝试一次", detailOnlyStorage: "只保存事件明细，查询时即时聚合", droppedUnavailable: "Dropped 暂不可用",
    sqliteVersion: "SQLite 版本", journalMode: "Journal Mode", schemaVersion: "Schema 版本", todayRowCount: "香港今日明细", processUptime: "进程运行时长", sqliteRuntime: "SQLite 运行信息", serviceRuntime: "服务运行信息", noData: "无数据", visitorPreferences: "访客偏好",
  },
  "zh-Hant": {
    trafficSubtitle: "主頁瀏覽、地點試查及巴士路線查詢的時段與來源分析", downloadsSubtitle: "下載請求、成功回應、平台及版本表現", eventsSubtitle: "唯讀匿名事件明細及穩定游標分頁", visitorSubtitle: "使用完整匿名 ID 調查工作階段路徑", performanceSubtitle: "公開統計入口的成功率、分位值及受控失敗", systemSubtitle: "本機統計儲存、寫入及私人監聽器健康狀態",
    trafficTrend: "瀏覽與成功試查趨勢", heatmap: "瀏覽時段熱力圖", heatmapNote: "香港時間 · 顏色越深代表匿名事件越多", dimensions: "語言、裝置與來源", versions: "版本表現", downloadTrend: "下載請求趨勢", failures: "失敗分類", platforms: "平台分佈",
    eventTime: "時間", eventType: "事件類型", visitorId: "匿名訪客", outcome: "結果", latency: "耗時", details: "詳情", viewVisitor: "查看訪客明細", nextPage: "下一頁", pageSummary: "共 {count} 項匿名事件", privacyDetail: "只顯示允許欄位；不含 IP、完整 UA/Referrer、查詢字詞、地點、座標或 token。",
    visitorSearch: "輸入完整匿名 visitor ID", searchVisitor: "查詢訪客", copyId: "複製完整 ID", copiedId: "已複製完整匿名 ID", session: "工作階段", sessionTimeline: "工作階段時間線", visitorSummary: "訪客摘要", firstSeen: "首次出現", lastSeen: "最後出現", eventCount: "累計事件", sessionCount: "工作階段", commonLocale: "常用語言", commonDevice: "常用裝置", commonSource: "常見來源", invalidVisitorId: "請輸入 22 位完整匿名 visitor ID", sessionRule: "相鄰事件相隔超過 30 分鐘時劃分為新工作階段",
    endpointPerformance: "公開接口效能", latencyTrend: "回應時間趨勢", systemDatabase: "SQLite 明細儲存", systemProcess: "寫入程序", systemListener: "私人監聽器", rowCount: "明細行數", databaseSize: "檔案大小", dropped: "啟動後捨棄", publicProxy: "公網代理", healthy: "可用", degraded: "降級", unavailable: "無法使用", noPublicProxy: "未啟用",
    previousPage: "上一頁", requestSuccess: "成功率", requests: "請求數", failureRequests: "失敗請求", uniqueVisitors: "獨立瀏覽器", controlledCategories: "受控失敗類別", nearestRank: "nearest-rank 分位值", noDetailData: "目前工作區暫無結果", noDetailBody: "調整時段或篩選條件後再查看。", lastSuccessfulWrite: "最近成功寫入", processStarted: "程序啟動時間", listenerState: "監聽器狀態", listenerAddress: "監聽地址", writeHealth: "寫入健康",
    eventSummaryTotal: "完整時段事件", eventSummarySuccess: "成功事件", eventSummaryFailure: "失敗事件", eventSummaryVisitors: "獨立瀏覽器",
    itemRange: "第 {start}–{end} 項，共 {total} 項", pagePosition: "第 {page} 頁", eventComposition: "事件類型構成", commonPlatform: "常用下載平台", noPlatformData: "暫無下載平台數據",
    backToEvents: "返回事件明細", copyFailed: "複製失敗，請手動複製", configurationFact: "配置事實", runtimeStatus: "運行狀態", storageOverview: "儲存概況", isolationFallback: "隔離與降級路徑",
    retentionLongTerm: "匿名事件明細長期保留", backupDisabled: "未啟用備份，統計數據可接受遺失", writeQueueDisabled: "未啟用寫入佇列，每次同步嘗試一次", detailOnlyStorage: "只儲存事件明細，查詢時即時聚合", droppedUnavailable: "Dropped 暫時無法讀取",
    sqliteVersion: "SQLite 版本", journalMode: "Journal Mode", schemaVersion: "Schema 版本", todayRowCount: "香港今日明細", processUptime: "程序運行時間", sqliteRuntime: "SQLite 運行資訊", serviceRuntime: "服務運行資訊", noData: "暫無資料", visitorPreferences: "訪客偏好",
  },
  en: {
    trafficSubtitle: "Time and source analysis for homepage visits and route trials", downloadsSubtitle: "Download requests, successful responses, platforms, and versions", eventsSubtitle: "Read-only anonymous events with stable cursor pagination", visitorSubtitle: "Investigate session paths with an exact anonymous ID", performanceSubtitle: "Success rates, percentiles, and controlled failures for public entry points", systemSubtitle: "Local event storage, write health, and private listener status",
    trafficTrend: "Traffic and successful trial trend", heatmap: "Traffic heatmap", heatmapNote: "Hong Kong time · darker cells mean more anonymous events", dimensions: "Language, device & source", versions: "Version performance", downloadTrend: "Download request trend", failures: "Failure categories", platforms: "Platform mix",
    eventTime: "Time", eventType: "Event", visitorId: "Anonymous visitor", outcome: "Outcome", latency: "Latency", details: "Details", viewVisitor: "View visitor detail", nextPage: "Next page", pageSummary: "{count} anonymous events", privacyDetail: "Allowed fields only; no IP, full UA/referrer, query text, places, coordinates, or tokens.",
    visitorSearch: "Enter the full anonymous visitor ID", searchVisitor: "Find visitor", copyId: "Copy full ID", copiedId: "Full anonymous ID copied", session: "Session", sessionTimeline: "Session timeline", visitorSummary: "Visitor summary", firstSeen: "First seen", lastSeen: "Last seen", eventCount: "Total events", sessionCount: "Sessions", commonLocale: "Common language", commonDevice: "Common device", commonSource: "Common source", invalidVisitorId: "Enter the complete 22-character anonymous visitor ID", sessionRule: "A new session starts after more than 30 minutes without an event",
    endpointPerformance: "Public endpoint performance", latencyTrend: "Latency trend", systemDatabase: "SQLite detail store", systemProcess: "Write process", systemListener: "Private listener", rowCount: "Detail rows", databaseSize: "File size", dropped: "Dropped since start", publicProxy: "Public proxy", healthy: "Available", degraded: "Degraded", unavailable: "Unavailable", noPublicProxy: "Disabled",
    previousPage: "Previous page", requestSuccess: "Success rate", requests: "Requests", failureRequests: "Failed requests", uniqueVisitors: "Unique browsers", controlledCategories: "Controlled failure categories", nearestRank: "Nearest-rank percentiles", noDetailData: "No results in this workspace", noDetailBody: "Try a different date range or filter selection.", lastSuccessfulWrite: "Last successful write", processStarted: "Process started", listenerState: "Listener state", listenerAddress: "Listener address", writeHealth: "Write health",
    eventSummaryTotal: "Events in range", eventSummarySuccess: "Successful events", eventSummaryFailure: "Failed events", eventSummaryVisitors: "Unique browsers",
    itemRange: "Items {start}–{end} of {total}", pagePosition: "Page {page}", eventComposition: "Event mix", commonPlatform: "Common download platform", noPlatformData: "No download platform data",
    backToEvents: "Back to event detail", copyFailed: "Copy failed; copy the ID manually", configurationFact: "Configuration fact", runtimeStatus: "Runtime status", storageOverview: "Storage overview", isolationFallback: "Isolation & fallback",
    retentionLongTerm: "Anonymous event details are retained long term", backupDisabled: "Backups are disabled; analytics data may be lost", writeQueueDisabled: "No write queue; each event gets one synchronous attempt", detailOnlyStorage: "Only event details are stored; aggregations run at query time", droppedUnavailable: "Dropped count unavailable",
    sqliteVersion: "SQLite version", journalMode: "Journal mode", schemaVersion: "Schema version", todayRowCount: "Hong Kong events today", processUptime: "Process uptime", sqliteRuntime: "SQLite runtime", serviceRuntime: "Service runtime", noData: "No data", visitorPreferences: "Visitor preferences",
  },
} satisfies LocalizedDetailCopy;

export function detailText(locale: MonitoringLocale, key: DetailCopyKey) { return detailCopy[locale]?.[key] ?? detailCopy["zh-Hant"][key]; }

export const eventLabels: Record<EventType, Record<MonitoringLocale, string>> = {
  page_view: { "zh-Hans": "主页访问", "zh-Hant": "主頁瀏覽", en: "Homepage view" },
  place_query: { "zh-Hans": "地点查询", "zh-Hant": "地點查詢", en: "Place query" },
  route_query: { "zh-Hans": "路线查询", "zh-Hant": "路線查詢", en: "Route query" },
  download_request: { "zh-Hans": "下载请求", "zh-Hant": "下載請求", en: "Download request" },
};

const dimensions: Record<string, Record<MonitoringLocale, string>> = {
  success: { "zh-Hans": "成功", "zh-Hant": "成功", en: "Success" }, failure: { "zh-Hans": "失败", "zh-Hant": "失敗", en: "Failure" },
  mobile: { "zh-Hans": "手机", "zh-Hant": "手機", en: "Mobile" }, desktop: { "zh-Hans": "桌面", "zh-Hant": "桌面", en: "Desktop" }, tablet: { "zh-Hans": "平板", "zh-Hant": "平板", en: "Tablet" },
  direct: { "zh-Hans": "直接访问", "zh-Hant": "直接瀏覽", en: "Direct" }, search: { "zh-Hans": "搜索", "zh-Hant": "搜尋", en: "Search" }, referral: { "zh-Hans": "引荐", "zh-Hant": "轉介", en: "Referral" }, internal: { "zh-Hans": "站内", "zh-Hant": "站內", en: "Internal" },
  unknown: { "zh-Hans": "未知", "zh-Hant": "未知", en: "Unknown" }, other: { "zh-Hans": "其他", "zh-Hant": "其他", en: "Other" },
  "zh-Hans": { "zh-Hans": "简体中文", "zh-Hant": "簡體中文", en: "Simplified Chinese" }, "zh-Hant": { "zh-Hans": "繁体中文", "zh-Hant": "繁體中文", en: "Traditional Chinese" }, en: { "zh-Hans": "英语", "zh-Hant": "英文", en: "English" },
  android: { "zh-Hans": "Android", "zh-Hant": "Android", en: "Android" }, ios: { "zh-Hans": "iOS（预留）", "zh-Hant": "iOS（預留）", en: "iOS (reserved)" },
  invalid_request: { "zh-Hans": "无效请求", "zh-Hant": "無效請求", en: "Invalid request" }, not_found: { "zh-Hans": "资源不存在", "zh-Hant": "資源不存在", en: "Not found" }, rate_limited: { "zh-Hans": "请求受限", "zh-Hant": "請求受限", en: "Rate limited" },
  external_timeout: { "zh-Hans": "上游超时", "zh-Hant": "上游逾時", en: "Upstream timeout" }, external_unavailable: { "zh-Hans": "上游不可用", "zh-Hant": "上游無法使用", en: "Upstream unavailable" }, integrity_mismatch: { "zh-Hans": "完整性不匹配", "zh-Hant": "完整性不符", en: "Integrity mismatch" },
};

export function dimensionText(locale: MonitoringLocale, key: string) { return dimensions[key]?.[locale] ?? key; }
