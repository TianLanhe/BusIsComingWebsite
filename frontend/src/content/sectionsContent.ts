import { sourceReferences } from "./sourceReferences";
import type { ContactEntry, FAQItem, FeatureItem } from "./types";

export const features: FeatureItem[] = [
  {
    id: "saved-routes",
    icon: "bookmark",
    title: {
      "zh-Hant": "儲存常用路線",
      "zh-Hans": "保存常用路线",
      en: "Save frequent routes",
    },
    description: {
      "zh-Hant": "保存常用起終點，一按回到通勤查詢。",
      "zh-Hans": "保存常用起终点，一按回到通勤查询。",
      en: "Keep frequent origin and destination pairs ready for repeat trips.",
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
      "zh-Hant": "車費、時間、步行距離與 ETA 一頁看清。",
      "zh-Hans": "车费、时间、步行距离与 ETA 一页看清。",
      en: "Review fare, travel time, walking distance, and ETA together.",
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
      "zh-Hant": "查看最多 3 班到站時間，判斷是否要出門。",
      "zh-Hans": "查看最多 3 班到站时间，判断是否要出门。",
      en: "Inspect up to three arrival times before deciding when to leave.",
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
      "zh-Hant": "查看上下車站、途經站點和轉乘段。",
      "zh-Hans": "查看上下车站、途经站点和换乘段。",
      en: "Open boarding stops, passing stops, and transfer details.",
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
      "zh-Hant": "出門前監測首程巴士 ETA，安心準備。",
      "zh-Hans": "出门前监测首程巴士 ETA，安心准备。",
      en: "Monitor first-leg ETA shortly before departure.",
    },
    sourceReference: sourceReferences.notificationSpec,
  },
  {
    id: "hkd-display",
    icon: "dollar",
    title: {
      "zh-Hant": "HK$ 清晰顯示",
      "zh-Hans": "HK$ 清晰显示",
      en: "Clear HK$ fare display",
    },
    description: {
      "zh-Hant": "所有車費以 HK$ 顯示，方便比較。",
      "zh-Hans": "所有车费以 HK$ 显示，方便比较。",
      en: "All fares are shown in HK$ for quick comparison.",
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
      "zh-Hant": "第一版網站只提供靜態演示，幫助理解結果形態；完整查詢能力以 App 為準。",
      "zh-Hans": "第一版网站只提供静态演示，帮助理解结果形态；完整查询能力以 App 为准。",
      en: "The first website version is a static demo to show result shape. The complete query workflow belongs in the app.",
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
      "zh-Hant": "BusIsComing 聚焦香港巴士查詢，不提供完整出行規劃、地鐵、鐵路、渡輪或其他非香港巴士交通工具查詢。",
      "zh-Hans": "BusIsComing 聚焦香港巴士查询，不提供完整出行规划、地铁、铁路、渡轮或其他非香港巴士交通工具查询。",
      en: "BusIsComing focuses on Hong Kong bus lookup. It does not provide full trip planning, MTR, rail, ferry, or other non-bus lookup.",
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
    "zh-Hant": "不提供完整出行路線規劃。",
    "zh-Hans": "不提供完整出行路线规划。",
    en: "Full trip planning is out of scope.",
  },
  {
    "zh-Hant": "不提供地鐵、鐵路、渡輪或其他非香港巴士交通工具查詢。",
    "zh-Hans": "不提供地铁、铁路、渡轮或其他非香港巴士交通工具查询。",
    en: "MTR, rail, ferry, and non-Hong Kong-bus lookup are out of scope.",
  },
];
