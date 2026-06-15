import { carouselSlides } from "./carouselSlides";
import { onlineQueryDemo } from "./onlineQueryDemo";
import { contact, faq, features, scopeExclusions } from "./sectionsContent";
import { sourceReferenceList, sourceReferences } from "./sourceReferences";
import type { HomePageContent } from "./types";

export const homepageContent: HomePageContent = {
  metadata: {
    version: "2026-06-16.homepage-v1",
    lastUpdated: "2026-06-16",
    sourceReferences: sourceReferenceList,
  },
  navigation: {
    brand: {
      "zh-Hant": "BusIsComing",
      "zh-Hans": "BusIsComing",
      en: "BusIsComing",
    },
    items: [
      {
        id: "features",
        label: {
          "zh-Hant": "功能介紹",
          "zh-Hans": "功能介绍",
          en: "Features",
        },
        target: "#features",
      },
      {
        id: "online-query",
        label: {
          "zh-Hant": "在線查詢",
          "zh-Hans": "在线查询",
          en: "Online Query",
        },
        target: "#online-query",
      },
      {
        id: "faq",
        label: {
          "zh-Hant": "常見問題",
          "zh-Hans": "常见问题",
          en: "FAQ",
        },
        target: "#faq",
      },
      {
        id: "contact",
        label: {
          "zh-Hant": "支援我們",
          "zh-Hans": "支持我们",
          en: "Support",
        },
        target: "#contact",
      },
    ],
    languageLabel: {
      "zh-Hant": "語言",
      "zh-Hans": "语言",
      en: "Language",
    },
  },
  hero: {
    headline: {
      "zh-Hant": "香港巴士查詢，更快出門，更安心到達",
      "zh-Hans": "香港巴士查询，更快出门，更安心到达",
      en: "Hong Kong bus lookup for faster, calmer departures",
    },
    subheading: {
      "zh-Hant": "為香港巴士通勤而設的 Android App，保存常用起終點，快速比較 Citybus 路線、票價、步行距離與首程 ETA。",
      "zh-Hans": "为香港巴士通勤而设的 Android App，保存常用起终点，快速比较 Citybus 路线、票价、步行距离与首程 ETA。",
      en: "An Android app for Hong Kong bus commuters: save frequent trips and compare Citybus routes, fares, walking distance, and first-leg ETA.",
    },
    bullets: [
      {
        title: {
          "zh-Hant": "儲存常用起終點",
          "zh-Hans": "保存常用起终点",
          en: "Save frequent trips",
        },
        description: {
          "zh-Hant": "一按查詢常用通勤路線",
          "zh-Hans": "一键查询常用通勤路线",
          en: "Reopen commute searches in one tap",
        },
      },
      {
        title: {
          "zh-Hant": "比較車費、時間與步行距離",
          "zh-Hans": "比较车费、时间与步行距离",
          en: "Compare fare, time, and walk",
        },
        description: {
          "zh-Hant": "以 HK$、總行程時間和 ETA 輔助判斷",
          "zh-Hans": "以 HK$、总行程时间和 ETA 辅助判断",
          en: "Use HK$, total time, and ETA to decide",
        },
      },
      {
        title: {
          "zh-Hant": "出門前短時通知監測",
          "zh-Hans": "出门前短时通知监测",
          en: "Pre-departure monitoring",
        },
        description: {
          "zh-Hant": "監測首程 ETA，安心出門",
          "zh-Hans": "监测首程 ETA，安心出门",
          en: "Keep first-leg ETA visible before leaving",
        },
      },
    ],
    primaryAction: {
      label: {
        "zh-Hant": "下載 App",
        "zh-Hans": "下载 App",
        en: "Download App",
      },
      target: "#download",
    },
    secondaryAction: {
      label: {
        "zh-Hant": "在線查詢",
        "zh-Hans": "在线查询",
        en: "Online Query",
      },
      target: "#online-query",
    },
    carouselSlides,
  },
  features,
  onlineQueryDemo,
  downloadSection: {
    title: {
      "zh-Hant": "下載 BusIsComing",
      "zh-Hans": "下载 BusIsComing",
      en: "Download BusIsComing",
    },
    description: {
      "zh-Hant": "Android 是第一優先平台，當前 APK 可直接下載；iPhone 暫未支援。",
      "zh-Hans": "Android 是第一优先平台，当前 APK 可直接下载；iPhone 暂未支持。",
      en: "Android is the first target platform, and the current APK is available now; iPhone is not supported yet.",
    },
    manifestRef: "frontend/src/content/downloadManifest.ts",
  },
  faq,
  contact,
  scopeExclusions,
  figmaReference: {
    fileUrl: sourceReferences.figma,
    desktopNode: "4:2",
    mobileNode: "4:183",
    downloadStatesNode: "4:326",
    carouselStatesNode: "4:357",
    versionNote: "2026-06-15 v1 homepage, download states, carousel states, desktop and mobile frames.",
  },
};
