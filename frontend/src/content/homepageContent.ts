import { homepageStories } from "./homepageStories";
import { sourceReferenceList, sourceReferences } from "./sourceReferences";
import type { HomepageContentV3 } from "./types";

export const homepageContent: HomepageContentV3 = {
  metadata: { version: "3.0.0", lastReviewed: "2026-08-24", sourceReferences: sourceReferenceList },
  navigation: {
    brand: { "zh-Hant": "BusIsComing", "zh-Hans": "BusIsComing", en: "BusIsComing" },
    items: [
      { id: "features", label: { "zh-Hant": "功能", "zh-Hans": "功能", en: "Features" }, target: "#features" },
      { id: "faq", label: { "zh-Hant": "常見問題", "zh-Hans": "常见问题", en: "FAQ" }, target: "#faq" },
      { id: "contact", label: { "zh-Hant": "聯絡我們", "zh-Hans": "联系我们", en: "Contact" }, target: "#contact" },
    ],
    languageLabel: { "zh-Hant": "選擇語言", "zh-Hans": "选择语言", en: "Choose language" },
  },
  hero: {
    eyebrow: { "zh-Hant": "香港巴士出行 APP", "zh-Hans": "香港巴士出行 APP", en: "HONG KONG BUS APP" },
    productPositioning: {
      "zh-Hant": "香港巴士路線規劃與導航 App",
      "zh-Hans": "香港巴士路线规划与导航 App",
      en: "A Hong Kong bus route planner and navigation app",
    },
    primaryAction: {
      label: { "zh-Hant": "下載 Android App", "zh-Hans": "下载 Android App", en: "Download Android App" },
      target: "#download",
    },
    secondaryAction: {
      label: { "zh-Hant": "路線試查 →", "zh-Hans": "路线试查 →", en: "Try route search →" },
      target: "#route-trial",
    },
    stories: homepageStories,
  },
  routeTrial: {
    title: {
      "zh-Hant": "不用先下載，現在就試一程。",
      "zh-Hans": "不用先下载，现在就试一程。",
      en: "Try a bus journey before you download.",
    },
    description: {
      "zh-Hant": "選擇起點和目的地，整理合適的巴士路線。",
      "zh-Hans": "选择起点和目的地，整理合适的巴士路线。",
      en: "Choose your origin and destination to compare suitable bus routes.",
    },
    originLabel: { "zh-Hant": "起點", "zh-Hans": "起点", en: "Origin" },
    destinationLabel: { "zh-Hant": "目的地", "zh-Hans": "目的地", en: "Destination" },
    queryAction: { "zh-Hant": "比較巴士路線 →", "zh-Hans": "比较巴士路线 →", en: "Compare bus routes →" },
    retryAction: { "zh-Hant": "再試一次", "zh-Hans": "再试一次", en: "Try again" },
    emptyState: {
      title: {
        "zh-Hant": "路線會在這裡出現",
        "zh-Hans": "路线会在这里出现",
        en: "Your route options will appear here",
      },
      description: {
        "zh-Hant": "選好起點和目的地後，便可比較候車、車費、耗時與步行距離。",
        "zh-Hans": "选好起点和目的地后，即可比较候车、车费、耗时与步行距离。",
        en: "Choose both places to compare waiting time, fare, journey time, and walking distance.",
      },
    },
    errorState: {
      title: {
        "zh-Hant": "路線暫時無法取得",
        "zh-Hans": "路线暂时无法获取",
        en: "Routes are temporarily unavailable",
      },
      description: {
        "zh-Hant": "你的起點和目的地仍然保留，可以稍後再試。",
        "zh-Hans": "你的起点和目的地仍会保留，可以稍后再试。",
        en: "Your selected places are still here. You can try again shortly.",
      },
    },
    retainedState: {
      "zh-Hant": "暫未更新，仍顯示上次結果",
      "zh-Hans": "暂未更新，仍显示上次结果",
      en: "Not refreshed — showing the previous result",
    },
    metricLabels: {
      fare: { "zh-Hant": "車費", "zh-Hans": "车费", en: "Fare" },
      duration: { "zh-Hant": "耗時", "zh-Hans": "耗时", en: "Time" },
      walking: { "zh-Hant": "步行", "zh-Hans": "步行", en: "Walk" },
      eta: { "zh-Hant": "候車", "zh-Hans": "候车", en: "Wait" },
    },
    scopeNotice: {
      "zh-Hant": "網站提供香港巴士路線試查；完整行程、沿途導航與鎖屏更新請在 App 使用。",
      "zh-Hans": "网站提供香港巴士路线试查；完整行程、沿途导航与锁屏更新请在 App 中使用。",
      en: "The website offers a Hong Kong bus route trial. Use the app for saved journeys, guidance, and lock-screen updates.",
    },
  },
  downloadDecision: {
    title: {
      "zh-Hant": "路線找到了，把它帶在身邊。",
      "zh-Hans": "路线找到了，把它带在身边。",
      en: "Found your route? Take it with you.",
    },
    description: {
      "zh-Hant": "下載 Android App，保存常用行程，沿途查看並在出門前持續掌握時間。",
      "zh-Hans": "下载 Android App，保存常用行程，沿途查看并在出门前持续掌握时间。",
      en: "Download the Android app to save journeys, follow the route, and keep departure timing close at hand.",
    },
    minimumAndroid: { "zh-Hant": "Android 7.1+", "zh-Hans": "Android 7.1+", en: "Android 7.1+" },
    readyAction: { "zh-Hant": "下載 BusIsComing", "zh-Hans": "下载 BusIsComing", en: "Download BusIsComing" },
    checkingState: { "zh-Hant": "正在取得版本資料", "zh-Hans": "正在获取版本信息", en: "Checking the latest version" },
    unavailableState: {
      "zh-Hant": "Android APK 暫時未能下載",
      "zh-Hans": "Android APK 暂时无法下载",
      en: "The Android APK is temporarily unavailable",
    },
    metadataLabels: {
      version: { "zh-Hant": "版本", "zh-Hans": "版本", en: "Version" },
      minimumSystem: { "zh-Hant": "系統", "zh-Hans": "系统", en: "System" },
      size: { "zh-Hant": "大小", "zh-Hans": "大小", en: "Size" },
      updated: { "zh-Hant": "更新", "zh-Hans": "更新", en: "Updated" },
    },
    installationNote: {
      "zh-Hant": "下載後依照 Android 畫面提示安裝。",
      "zh-Hans": "下载后按 Android 画面提示安装。",
      en: "After downloading, follow the Android prompts to install.",
    },
  },
  supportEnding: {
    title: {
      "zh-Hant": "出發前，也許你想知道。",
      "zh-Hans": "出发前，也许你想知道。",
      en: "A few things before you set off.",
    },
    faq: [
      {
        id: "android-install",
        defaultOpen: true,
        question: { "zh-Hant": "Android APK 如何安裝？", "zh-Hans": "Android APK 如何安装？", en: "How do I install the Android APK?" },
        answer: {
          "zh-Hant": "下載 APK 後，依照 Android 的畫面提示允許此來源安裝，再開啟檔案完成安裝。",
          "zh-Hans": "下载 APK 后，按 Android 的画面提示允许此来源安装，再打开文件完成安装。",
          en: "Download the APK, follow Android's prompt to allow this install source, then open the file to finish.",
        },
      },
      {
        id: "data-coverage",
        defaultOpen: false,
        question: { "zh-Hant": "目前支援哪些巴士資料？", "zh-Hans": "目前支持哪些巴士数据？", en: "Which bus data is currently covered?" },
        answer: {
          "zh-Hant": "路線規劃以 App 已支援的香港巴士路線資料為準；符合條件的聯營路線可集中顯示城巴、九巴與龍運的首程到站時間。營運商覆蓋會按資料可用性逐步擴展。",
          "zh-Hans": "路线规划以 App 已支持的香港巴士路线数据为准；符合条件的联营路线可集中显示城巴、九巴与龙运的首程到站时间。运营商覆盖会随数据可用性逐步扩展。",
          en: "Route planning follows the Hong Kong bus data currently supported by the app. Eligible joint routes can show first-leg Citybus, KMB, and Long Win arrivals together; coverage grows only when reliable data is available.",
        },
      },
      {
        id: "website-app-difference",
        defaultOpen: false,
        question: { "zh-Hant": "網站試查和 App 有甚麼分別？", "zh-Hans": "网站试查和 App 有什么区别？", en: "How is the website trial different from the app?" },
        answer: {
          "zh-Hant": "網站適合快速試查路線；App 另外提供常用行程、沿途路線與目前位置、完整班次，以及鎖屏持續更新候車與步行時間。",
          "zh-Hans": "网站适合快速试查路线；App 还提供常用行程、沿途路线与当前位置、完整班次，以及锁屏持续更新候车与步行时间。",
          en: "The website is for a quick route trial. The app adds saved journeys, route and position guidance, fuller arrivals, and lock-screen waiting and walking updates.",
        },
      },
      {
        id: "iphone-support",
        defaultOpen: false,
        question: { "zh-Hant": "iPhone 可以使用嗎？", "zh-Hans": "iPhone 可以使用吗？", en: "Can I use it on iPhone?" },
        answer: {
          "zh-Hant": "暫時只提供 Android 版本，iPhone 版本尚未推出。",
          "zh-Hans": "目前只提供 Android 版本，iPhone 版本尚未推出。",
          en: "Only the Android version is available for now. An iPhone version has not been released.",
        },
      },
    ],
    contact: {
      label: { "zh-Hant": "直接聯絡我們", "zh-Hans": "直接联系我们", en: "Contact us directly" },
      target: "mailto:hezhenyu966@gmail.com",
    },
    privacyLink: {
      label: { "zh-Hant": "私隱政策", "zh-Hans": "隐私政策", en: "Privacy Policy" },
      href: { "zh-Hant": "/zh-hant/privacy/", "zh-Hans": "/zh-hans/privacy/", en: "/en/privacy/" },
    },
    backToTop: {
      label: { "zh-Hant": "返回頂部 ↑", "zh-Hans": "返回顶部 ↑", en: "Back to top ↑" },
      target: "#top",
    },
  },
  scopeExclusions: [
    { "zh-Hant": "網站試查不取代完整 App 體驗。", "zh-Hans": "网站试查不替代完整 App 体验。", en: "The website trial does not replace the full app experience." },
    { "zh-Hant": "聯營首程到站時間不等於完整跨營運商路線規劃。", "zh-Hans": "联营首程到站时间不等于完整跨运营商路线规划。", en: "Joint-route first-leg arrivals do not imply full cross-operator route planning." },
    { "zh-Hant": "不提供港鐵、鐵路或渡輪路線規劃。", "zh-Hans": "不提供港铁、铁路或渡轮路线规划。", en: "MTR, rail, and ferry route planning are outside this product." },
  ],
  figmaReference: {
    fileUrl: sourceReferences.figma,
    sectionNode: "119:64",
    desktopHeroNode: "119:176",
    mobileHeroNode: "119:461",
    designVersion: "Homepage Visual System v1.3.1 — FINAL",
  },
};
