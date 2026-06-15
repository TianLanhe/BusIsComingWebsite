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
        "zh-Hant": "可下載 APK 1.0",
        "zh-Hans": "可下载 APK 1.0",
        en: "APK 1.0 available",
      },
      actionLabel: {
        "zh-Hant": "下載 Android APK",
        "zh-Hans": "下载 Android APK",
        en: "Download Android APK",
      },
      downloadUrl: "/api/downloads/android/latest",
      disabledReason: null,
      artifact: {
        appName: "BusIsComing",
        applicationId: "com.example.busiscoming",
        versionName: "1.0",
        versionCode: 1,
        fileName: "BusIsComing.apk",
        sizeBytes: 5009547,
        sizeLabel: {
          "zh-Hant": "約 4.8 MB",
          "zh-Hans": "约 4.8 MB",
          en: "About 4.8 MB",
        },
        sha256: "93e7930ee9e6b9cc05819bab895153ad985707bdcfff3e6bead60065acf07470",
        lastUpdated: "2026-06-16",
      },
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
        "zh-Hant": "iPhone 暫未支援，敬請期待。",
        "zh-Hans": "iPhone 暂未支持，敬请期待。",
        en: "iPhone is not supported yet.",
      },
      artifact: null,
    },
  },
};
