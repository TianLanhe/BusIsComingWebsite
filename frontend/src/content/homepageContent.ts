import { carouselSlides } from "./carouselSlides";
import { onlineQueryDemo } from "./onlineQueryDemo";
import { contact, faq, features, scopeExclusions } from "./sectionsContent";
import { sourceReferenceList, sourceReferences } from "./sourceReferences";
import type { HomePageContent } from "./types";

export const homepageContent: HomePageContent = {
  metadata: {
    version: "2026-06-16.homepage-v2",
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
      "zh-Hant": "城巴查詢，出門前心中有數",
      "zh-Hans": "城巴查询，出门前心中有数",
      en: "Citybus lookup before you head out",
    },
    subheading: {
      "zh-Hant": "為日常搭城巴而設的 Android App，保存常用起終點，快速比較 Citybus 路線、多程總車費、步行距離與首程 ETA。",
      "zh-Hans": "为日常乘坐城巴而设的 Android App，保存常用起终点，快速比较 Citybus 路线、多程总车费、步行距离与首程 ETA。",
      en: "An Android app for daily Citybus trips: save frequent searches and compare Citybus routes, total multi-leg fare, walking distance, and first-leg ETA.",
    },
    bullets: [
      {
        title: {
          "zh-Hant": "儲存常用起終點",
          "zh-Hans": "保存常用起终点",
          en: "Save frequent trips",
        },
        description: {
          "zh-Hant": "一按重開常用城巴查詢",
          "zh-Hans": "一键重打开常用城巴查询",
          en: "Reopen commute searches in one tap",
        },
      },
      {
        title: {
          "zh-Hant": "比較總車費、時間與步行距離",
          "zh-Hans": "比较总车费、时间与步行距离",
          en: "Compare fare, time, and walk",
        },
        description: {
          "zh-Hant": "以多程總車費、總行程時間和 ETA 輔助判斷",
          "zh-Hans": "以多程总车费、总行程时间和 ETA 辅助判断",
          en: "Use total fare, journey time, and ETA to decide",
        },
      },
      {
        title: {
          "zh-Hant": "出門前短時監測",
          "zh-Hans": "出门前短时监测",
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
        "zh-Hant": "下載 Android APK",
        "zh-Hans": "下载 Android APK",
        en: "Download Android APK",
      },
      target: "/api/downloads/android/latest",
      kind: "download",
      downloadFileName: "BusIsComing.apk",
    },
    secondaryAction: {
      label: {
        "zh-Hant": "在線查詢",
        "zh-Hans": "在线查询",
        en: "Online Query",
      },
      target: "#online-query",
      kind: "anchor",
    },
    apkMeta: {
      "zh-Hant": "Android APK 1.0 · 約 4.8 MB",
      "zh-Hans": "Android APK 1.0 · 约 4.8 MB",
      en: "Android APK 1.0 · About 4.8 MB",
    },
    iphoneStatus: {
      "zh-Hant": "iPhone 暫未支援",
      "zh-Hans": "iPhone 暂未支持",
      en: "iPhone is not supported yet",
    },
  },
  featureShowcase: carouselSlides,
  features,
  onlineQueryDemo,
  downloadSection: {
    title: {
      "zh-Hant": "下載 BusIsComing",
      "zh-Hans": "下载 BusIsComing",
      en: "Download BusIsComing",
    },
    description: {
      "zh-Hant": "現時先提供 Android APK，按下即可下載；iPhone 版本暫未支援。",
      "zh-Hans": "Android 是第一优先平台，当前 APK 可直接下载；iPhone 暂未支持。",
      en: "Android is the first target platform, and the current APK is available now; iPhone is not supported yet.",
    },
    manifestRef: "frontend/src/content/downloadManifest.ts",
    androidCard: {
      title: {
        "zh-Hant": "Android APK",
        "zh-Hans": "Android APK",
        en: "Android APK",
      },
      meta: {
        "zh-Hant": "版本 1.0 · 約 4.8 MB",
        "zh-Hans": "版本 1.0 · 约 4.8 MB",
        en: "Version 1.0 · About 4.8 MB",
      },
      primaryAction: {
        label: {
          "zh-Hant": "下載 Android APK",
          "zh-Hans": "下载 Android APK",
          en: "Download Android APK",
        },
        target: "/api/downloads/android/latest",
        kind: "download",
        downloadFileName: "BusIsComing.apk",
      },
      backupAction: {
        label: {
          "zh-Hant": "重新下載",
          "zh-Hans": "重新下载",
          en: "Download again",
        },
        target: "/api/downloads/android/latest",
        kind: "download",
        downloadFileName: "BusIsComing.apk",
      },
    },
    iphoneStatus: {
      "zh-Hant": "iPhone 暫未支援，現階段請先使用 Android 版本。",
      "zh-Hans": "iPhone 暂未支持，现阶段请先使用 Android 版本。",
      en: "iPhone is not supported yet. Use the Android APK for now.",
    },
  },
  faq,
  contact,
  scopeExclusions,
  figmaReference: {
    fileUrl: sourceReferences.figma,
    pageNode: "10:2",
    desktopNode: "10:3",
    mobileNode: "10:44",
    downloadStatesNode: "10:75",
    carouselStatesNode: "10:87",
    notesNode: "10:176",
    versionNote: "2026-06-16 homepage v2 plan: desktop, mobile, download states, carousel, screenshot stack, and implementation notes.",
  },
};
