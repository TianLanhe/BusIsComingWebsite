import type { DownloadManifest } from "./types";

export const downloadManifest: DownloadManifest = {
  version: "2026-06-16.android-apk-1",
  lastUpdated: "2026-06-16",
  platforms: {
    android: {
      platform: "android",
      status: "available",
      label: {
        "zh-Hant": "Android",
        "zh-Hans": "Android",
        en: "Android",
      },
      description: {
        "zh-Hant": "現行 Android 安裝包",
        "zh-Hans": "当前 Android 安装包",
        en: "Current Android package",
      },
      actionLabel: {
        "zh-Hant": "下載 Android APK",
        "zh-Hans": "下载 Android APK",
        en: "Download Android APK",
      },
      downloadUrl: "/api/downloads/android/latest",
      disabledReason: null,
      artifact: null,
    },
    ios: {
      platform: "ios",
      status: "unsupported",
      label: {
        "zh-Hant": "iPhone",
        "zh-Hans": "iPhone",
        en: "iPhone",
      },
      description: {
        "zh-Hant": "暫未支援",
        "zh-Hans": "暂未支持",
        en: "Not supported yet",
      },
      actionLabel: {
        "zh-Hant": "敬請期待",
        "zh-Hans": "敬请期待",
        en: "Coming soon",
      },
      downloadUrl: null,
      disabledReason: {
        "zh-Hant": "iPhone 暫未支援，現階段請先使用 Android 版本。",
        "zh-Hans": "iPhone 暂未支持，敬请期待。",
        en: "iPhone is not supported yet.",
      },
      artifact: null,
    },
  },
};
