import { carouselSlides } from "./carouselSlides";
import { onlineQueryDemo } from "./onlineQueryDemo";
import { contact, faq, features, scopeExclusions } from "./sectionsContent";
import { sourceReferenceList, sourceReferences } from "./sourceReferences";
import type { HomePageContent } from "./types";
import { uiCopy } from "./uiCopy";

export const homepageContent: HomePageContent = {
  metadata: {
    version: "2026-06-24.homepage-experience-polish",
    lastUpdated: "2026-06-25",
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
          "zh-Hant": "網上試查",
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
          "zh-Hant": "聯絡我們",
          "zh-Hans": "联系我们",
          en: "Contact Us",
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
      "zh-Hant": "為日常搭城巴而設的 Android App，儲低常用起點和目的地，快速比較 Citybus 路線、交通費用、步行距離與首程抵站時間。",
      "zh-Hans": "为日常乘坐城巴而设的 Android App，保存常用起终点，快速比较 Citybus 路线、车费、步行距离与首程 ETA。",
      en: "An Android app for daily Citybus trips: save frequent searches and compare Citybus routes, fare, walking distance, and first-leg ETA.",
    },
    bullets: [
      {
        title: {
          "zh-Hant": "儲存常用起終點",
          "zh-Hans": "保存常用起终点",
          en: "Save frequent trips",
        },
        description: {
          "zh-Hant": "常用城巴查詢一按再開",
          "zh-Hans": "一键重打开常用城巴查询",
          en: "Reopen commute searches in one tap",
        },
      },
      {
        title: {
          "zh-Hant": "車費一眼看清",
          "zh-Hans": "车费一眼看清",
          en: "Compare fare, time, and walk",
        },
        description: {
          "zh-Hant": "用交通費用、行程時間和抵站時間輔助判斷",
          "zh-Hans": "以车费、总行程时间和 ETA 辅助判断",
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
          "zh-Hant": "監測首程抵站時間，安心出門",
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
        "zh-Hant": "網上試查",
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
      "zh-Hant": "現時先提供 Android APK，一按即可下載；iPhone 版本暫未支援。",
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
  homepageExperience: {
    metadata: {
      version: "2026-06-24.homepage-experience-polish",
      lastUpdated: "2026-06-25",
    },
    carousel: {
      autoAdvanceMs: 3000,
      featureOrder: ["favorite-citybus-routes", "route-comparison", "eta-details", "predeparture-monitor"],
      visualMode: "stair-card-deck",
      supportsSwipe: true,
      supportsDesktopDrag: true,
      supportsKeyboardSwitching: true,
      showsNumericLabels: false,
      usesThumbnailStack: false,
      usesPersistentArrows: false,
    },
    brandLogo: {
      sourcePath: sourceReferences.androidLauncherForeground,
      outputPath: "frontend/src/assets/brand/busiscoming-logo-foreground.png",
      backgroundRemoved: true,
      transparent: true,
      usesLauncherPlate: false,
      placements: ["header", "footer", "favicon"],
    },
    contact: {
      navLabel: {
        "zh-Hant": "聯絡我們",
        "zh-Hans": "联系我们",
        en: "Contact Us",
      },
      email: "hezhenyu966@gmail.com",
      href: "mailto:hezhenyu966@gmail.com",
    },
    localizedCopyReview: {
      scope: ["navigation", "hero", "carousel", "features", "online-query", "download", "faq", "footer", "status", "accessibility"],
      zhHantTone: "hong-kong-practical-written",
      enTone: "natural-restrained-product",
      translationMode: "locale-adapted-not-literal",
      toneGuardrail: "clear-natural-not-colloquial-or-bureaucratic",
      allLocalesRequired: ["zh-Hant", "zh-Hans", "en"],
    },
    figmaReference: {
      fileUrl: sourceReferences.figmaExperiencePolish,
      pluginPath: "specs/005-homepage-experience-polish/figma-plugin/manifest.json",
      pageName: "Homepage Experience Polish - 005",
      nodeNames: [
        "Desktop 1440 / Stair Card Deck: 29:3",
        "Mobile 390 / Stair Card Deck: 29:44",
        "Carousel States / Scene Dots and Deck Click: 29:83",
        "Brand Contact States: 29:101",
        "Spec Notes: 29:108",
      ],
    },
  },
  figmaReference: {
    fileUrl: sourceReferences.figmaExperiencePolish,
    pageNode: "Homepage Experience Polish - 005",
    desktopNode: "29:3",
    mobileNode: "29:44",
    downloadStatesNode: "29:101",
    carouselStatesNode: "29:83",
    notesNode: "29:108",
    versionNote:
      "2026-06-25 homepage experience polish: stair-card-deck carousel, scene-only drag, same-scene deck click, brand contact states, and spec notes.",
  },
  homepageUiPolish: {
    metadata: {
      version: "2026-06-27.homepage-ui-polish",
      lastUpdated: "2026-06-27",
    },
    heroGallery: {
      desktopScale: "medium",
      showZoomIndicator: false,
      splitGestureZones: {
        screenshotZoneAction: "switch-same-feature-image",
        copyZoneAction: "switch-feature",
      },
      lightbox: {
        enabled: true,
        sameFeatureOnly: true,
        supportsZoom: true,
        supportsPan: true,
        supportsKeyboardClose: true,
        controls: {
          close: uiCopy.closeLightbox,
          zoomIn: uiCopy.zoomInScreenshot,
          zoomOut: uiCopy.zoomOutScreenshot,
          resetZoom: uiCopy.resetScreenshotZoom,
          previousImage: uiCopy.previousScreenshot,
          nextImage: uiCopy.nextScreenshot,
        },
      },
    },
    featureGrid: {
      mobileColumns: 2,
      desktopUnchanged: true,
      minimumFeatureCount: 6,
      futureFeatureCount: 10,
    },
    routeResultCard: {
      mobileCompact: true,
      desktopUnchanged: true,
      metricLayout: "inline-label-value",
      missingStopFallback: uiCopy.stopInfoUnavailable,
      metrics: [
        {
          id: "fare",
          label: uiCopy.fareLabel,
          valueStyle: "emphasized",
        },
        {
          id: "duration",
          label: uiCopy.durationLabel,
          valueStyle: "emphasized",
        },
        {
          id: "walking",
          label: uiCopy.walkingLabel,
          valueStyle: "emphasized",
        },
      ],
    },
    fareCopy: {
      title: {
        "zh-Hant": "車費一眼看清",
        "zh-Hans": "车费一眼看清",
        en: "Fare at a glance",
      },
      description: {
        "zh-Hant": "同頁比較車費、行程時間和步行距離，方便按日常需要揀城巴路線。",
        "zh-Hans": "同页比较车费、行程时间和步行距离，方便按日常需要选择城巴路线。",
        en: "Compare fare, journey time, and walking distance together when choosing a Citybus route.",
      },
      forbiddenPhrases: [
        "多程总车费一眼看清",
        "多程總車費一眼看清",
        "比较城巴方案时，可直接看到多程全程总车费，而不只是币种显示。",
        "比較城巴方案時，可直接看到多程全程總車費，而不只是幣種顯示。",
        "not just the currency label",
      ],
    },
    figmaReference: {
      fileUrl: sourceReferences.figmaExperiencePolish,
      pageName: "Homepage UI Polish - 007",
      nodeNames: [
        "Desktop 1440 / Hero Medium Screenshot Deck",
        "Desktop 1440 / Screenshot Lightbox",
        "Mobile 390 / Compact Feature Grid",
        "Mobile 390 / Compact Route Result Card",
        "Interaction States / Split Gesture Zones",
        "Spec Notes",
      ],
      nodeIdsResolved: false,
    },
  },
};
