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
      "zh-Hant": "多程總車費、時間、步行距離與 ETA 一頁看清。",
      "zh-Hans": "多程总车费、时间、步行距离与 ETA 一页看清。",
      en: "Review total multi-leg fare, travel time, walking distance, and ETA together.",
    },
    sourceReference: sourceReferences.routeResultsSpec,
  },
  {
    id: "multiple-eta",
    icon: "clock",
    title: {
      "zh-Hant": "多班 ETA",
      "zh-Hans": "多班 ETA",
      en: "Multiple ETAs",
    },
    description: {
      "zh-Hant": "查看城巴最多 3 班到站時間，判斷是否要出門。",
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
      "zh-Hant": "短時通知監測",
      "zh-Hans": "短时通知监测",
      en: "Short notification monitoring",
    },
    description: {
      "zh-Hant": "出門前監測首程城巴 ETA，安心準備。",
      "zh-Hans": "出门前监测首程城巴 ETA，安心准备。",
      en: "Monitor first-leg Citybus ETA shortly before departure.",
    },
    sourceReference: sourceReferences.notificationSpec,
  },
  {
    id: "hkd-display",
    icon: "dollar",
    title: {
      "zh-Hant": "多程總車費一眼睇清",
      "zh-Hans": "多程总车费一眼看清",
      en: "Clear multi-leg total fare",
    },
    description: {
      "zh-Hant": "比較城巴方案時，可直接看到多程全程總車費，而不只是幣種標示。",
      "zh-Hans": "比较城巴方案时，可直接看到多程全程总车费，而不只是币种显示。",
      en: "Compare Citybus options by total multi-leg fare, not just the currency label.",
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
      "zh-Hant": "第一版網站只提供靜態城巴示例，方便理解結果形態；完整查詢能力以 App 為準。",
      "zh-Hans": "第一版网站只提供静态演示，帮助理解结果形态；完整查询能力以 App 为准。",
      en: "The first website version is a static Citybus demo to show result shape. The complete query workflow belongs in the app.",
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
      "zh-Hant": "問題回報與聯絡開發者",
      "zh-Hans": "问题反馈与联系开发者",
      en: "Feedback and developer contact",
    },
    description: {
      "zh-Hant": "如果下載或查詢說明有問題，可先透過專案入口回報。",
      "zh-Hans": "如果下载或查询说明有问题，可先通过项目入口反馈。",
      en: "Report issues with download or query information through the project contact entry.",
    },
    href: "mailto:feedback@busiscoming.local",
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
