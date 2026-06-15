import type { DownloadManifest } from "./types";

export const downloadManifest: DownloadManifest = {
  version: "2026-06-16.homepage-v1",
  lastUpdated: "2026-06-16",
  platforms: {
    android: {
      platform: "android",
      status: "temporarily-unavailable",
      label: {
        "zh-Hant": "Android",
        "zh-Hans": "Android",
        en: "Android",
      },
      description: {
        "zh-Hant": "下載資源待接入",
        "zh-Hans": "下载资源待接入",
        en: "Download file pending",
      },
      actionLabel: {
        "zh-Hant": "Android APK",
        "zh-Hans": "Android APK",
        en: "Android APK",
      },
      downloadUrl: null,
      disabledReason: {
        "zh-Hant": "目前未在網站倉庫中找到可發布 APK；提供正式檔案後即可開放下載。",
        "zh-Hans": "目前未在网站仓库中找到可发布 APK；提供正式文件后即可开放下载。",
        en: "No publishable APK is available in this website repository yet. Add the official file to enable download.",
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
    },
  },
};
