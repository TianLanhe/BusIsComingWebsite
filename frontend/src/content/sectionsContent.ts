import { sourceReferences } from "./sourceReferences";
import type { ContactEntry, FAQItem, FeatureItem } from "./types";

export const features: FeatureItem[] = [
  {
    id: "saved-routes",
    icon: "bookmark",
    title: {
      "zh-Hant": "儲存常用城巴路線",
      "zh-Hans": "保存常用城巴路线",
      en: "Save frequent Citybus routes",
    },
    description: {
      "zh-Hant": "保存常用起終點，一按回到城巴通勤查詢。",
      "zh-Hans": "保存常用起终点，一键回到城巴通勤查询。",
      en: "Keep frequent Citybus origin and destination pairs ready for repeat trips.",
    },
    sourceReference: sourceReferences.androidReadme,
  },
  {
    id: "route-comparison",
    icon: "scale",
    title: {
      "zh-Hant": "比較 Citybus 路線",
      "zh-Hans": "比较 Citybus 路线",
      en: "Compare Citybus options",
    },
    description: {
      "zh-Hant": "車費、行程時間、步行距離與抵站時間一頁看清。",
      "zh-Hans": "车费、时间、步行距离与 ETA 一页看清。",
      en: "Review fare, travel time, walking distance, and ETA together.",
    },
    sourceReference: sourceReferences.routeResultsSpec,
  },
  {
    id: "multiple-eta",
    icon: "clock",
    title: {
      "zh-Hant": "多班抵站時間",
      "zh-Hans": "多班 ETA",
      en: "Multiple ETAs",
    },
    description: {
      "zh-Hant": "查看城巴最多 3 班抵站時間，判斷是否要出門。",
      "zh-Hans": "查看最多 3 班到站时间，判断是否要出门。",
      en: "Inspect up to three Citybus arrival times before deciding when to leave.",
    },
    sourceReference: sourceReferences.androidAgents,
  },
  {
    id: "route-details",
    icon: "route",
    title: {
      "zh-Hant": "路線詳情",
      "zh-Hans": "路线详情",
      en: "Route details",
    },
    description: {
      "zh-Hant": "查看城巴上落車提示、途經站點和轉乘段。",
      "zh-Hans": "查看城巴上下车提示、途经站点和换乘段。",
      en: "Open Citybus boarding stops, passing stops, and transfer details.",
    },
    sourceReference: sourceReferences.androidReadme,
  },
  {
    id: "short-monitor",
    icon: "bell",
    title: {
      "zh-Hant": "出門前通知監測",
      "zh-Hans": "短时通知监测",
      en: "Short notification monitoring",
    },
    description: {
      "zh-Hant": "出門前監測首程城巴抵站時間，安心準備。",
      "zh-Hans": "出门前监测首程城巴 ETA，安心准备。",
      en: "Monitor first-leg Citybus ETA shortly before departure.",
    },
    sourceReference: sourceReferences.notificationSpec,
  },
  {
    id: "hkd-display",
    icon: "dollar",
    title: {
      "zh-Hant": "車費一眼看清",
      "zh-Hans": "车费一眼看清",
      en: "Fare at a glance",
    },
    description: {
      "zh-Hant": "每條候選路線直接顯示車費，毋須點入詳情才知道大約花費。",
      "zh-Hans": "每条候选路线直接显示车费，不用点进详情才知道大致花费。",
      en: "See the fare on each route option without opening details first.",
    },
    sourceReference: sourceReferences.routeResultsSpec,
  },
];

export const faq: FAQItem[] = [
  {
    id: "android-install",
    category: "android-install",
    question: {
      "zh-Hant": "Android App 如何安裝？",
      "zh-Hans": "Android App 如何安装？",
      en: "How do I install the Android app?",
    },
    answer: {
      "zh-Hant": "網站已提供目前 Android APK 下載。若 Android 系統提示安裝來源，請按你的裝置安全設定完成確認。",
      "zh-Hans": "网站已提供当前 Android APK 下载。若 Android 系统提示安装来源，请按你的设备安全设置完成确认。",
      en: "The current Android APK is available from this site. If Android asks about the install source, follow your device security settings.",
    },
  },
  {
    id: "ios-status",
    category: "ios-status",
    question: {
      "zh-Hant": "iPhone 版本是否支援？",
      "zh-Hans": "iPhone 版本是否支持？",
      en: "Is iPhone supported?",
    },
    answer: {
      "zh-Hant": "暫未支援 iPhone。網站會保留狀態提示，但不會跳轉到下載。",
      "zh-Hans": "暂未支持 iPhone。网站会保留状态提示，但不会跳转到下载。",
      en: "iPhone is not supported yet. The site shows the status but never redirects to a download.",
    },
  },
  {
    id: "online-query-limit",
    category: "online-query-limit",
    question: {
      "zh-Hant": "在線查詢是即時結果嗎？",
      "zh-Hans": "在线查询是实时结果吗？",
      en: "Is the online query live?",
    },
    answer: {
      "zh-Hant": "網站提供基礎城巴路線試查，結果依賴 Citybus 和公開抵站資料；儲存路線、監測、多班抵站時間和更多詳情請下載 App 使用。",
      "zh-Hans": "网站提供基础城巴路线试用，结果依赖 Citybus 和公开 ETA 资料；保存路线、监控、多班 ETA 和更多详情请下载 App 使用。",
      en: "The website provides a basic Citybus route trial backed by Citybus and public ETA data. Download the app for saved routes, monitoring, multi-ETA views, and more detail.",
    },
  },
  {
    id: "data-scope",
    category: "data-scope",
    question: {
      "zh-Hant": "網站支援哪些交通工具？",
      "zh-Hans": "网站支持哪些交通工具？",
      en: "Which transport modes are covered?",
    },
    answer: {
      "zh-Hant": "BusIsComing 現階段聚焦城巴 / Citybus 查詢，不提供九巴、港鐵、鐵路、渡輪、其他交通工具查詢或完整出行規劃。",
      "zh-Hans": "BusIsComing 现阶段聚焦城巴 / Citybus 查询，不提供九巴、港铁、铁路、渡轮、其他交通工具查询或完整出行规划。",
      en: "BusIsComing currently focuses on Citybus lookup. It does not cover KMB, MTR, rail, ferry, other transport modes, or full trip planning.",
    },
  },
];

export const contact: ContactEntry[] = [
  {
    id: "feedback",
    label: {
      "zh-Hant": "聯絡我們",
      "zh-Hans": "联系我们",
      en: "Contact Us",
    },
    description: {
      "zh-Hant": "如對下載、網頁試查或 App 說明有疑問，歡迎直接聯絡開發者。",
      "zh-Hans": "如对下载、网页试查或 App 说明有疑问，欢迎直接联系开发者。",
      en: "Contact the developer about download, website trial, or app information.",
    },
    href: "mailto:hezhenyu966@gmail.com",
    priority: "secondary",
  },
];

export const scopeExclusions = [
  {
    "zh-Hant": "現階段聚焦城巴 / Citybus 查詢。",
    "zh-Hans": "现阶段聚焦城巴 / Citybus 查询。",
    en: "Current coverage is focused on Citybus lookup.",
  },
  {
    "zh-Hant": "不提供完整出行路線規劃。",
    "zh-Hans": "不提供完整出行路线规划。",
    en: "Full trip planning is out of scope.",
  },
  {
    "zh-Hant": "不提供九巴、港鐵、鐵路、渡輪或其他非城巴交通工具查詢。",
    "zh-Hans": "不提供九巴、港铁、铁路、渡轮或其他非城巴交通工具查询。",
    en: "KMB, MTR, rail, ferry, and non-Citybus lookup are out of scope.",
  },
];
