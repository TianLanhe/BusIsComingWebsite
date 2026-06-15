import type { OnlineQueryDemo } from "./types";

export const onlineQueryDemo: OnlineQueryDemo = {
  title: {
    "zh-Hant": "在線查詢",
    "zh-Hans": "在线查询",
    en: "Online Query",
  },
  mode: "static-demo",
  origin: {
    "zh-Hant": "將軍澳站",
    "zh-Hans": "将军澳站",
    en: "Tseung Kwan O Station",
  },
  destination: {
    "zh-Hant": "中環（交易廣場）",
    "zh-Hans": "中环（交易广场）",
    en: "Central (Exchange Square)",
  },
  resultRows: [
    {
      routeNumber: "788",
      operator: "Citybus",
      fare: "HK$11.7",
      duration: {
        "zh-Hant": "約 42 分鐘",
        "zh-Hans": "约 42 分钟",
        en: "About 42 min",
      },
      walkingDistance: {
        "zh-Hant": "約 450 米",
        "zh-Hans": "约 450 米",
        en: "About 450 m",
      },
      etaDisplay: {
        "zh-Hant": "ETA 10:36 · 6 分鐘後",
        "zh-Hans": "ETA 10:36 · 6 分钟后",
        en: "ETA 10:36 · in 6 min",
      },
    },
    {
      routeNumber: "796X",
      operator: "Citybus",
      fare: "HK$11.7",
      duration: {
        "zh-Hant": "約 47 分鐘",
        "zh-Hans": "约 47 分钟",
        en: "About 47 min",
      },
      walkingDistance: {
        "zh-Hant": "約 620 米",
        "zh-Hans": "约 620 米",
        en: "About 620 m",
      },
      etaDisplay: {
        "zh-Hant": "ETA 10:40 · 10 分鐘後",
        "zh-Hans": "ETA 10:40 · 10 分钟后",
        en: "ETA 10:40 · in 10 min",
      },
    },
    {
      routeNumber: "797",
      operator: "Citybus",
      fare: "HK$11.7",
      duration: {
        "zh-Hant": "約 50 分鐘",
        "zh-Hans": "约 50 分钟",
        en: "About 50 min",
      },
      walkingDistance: {
        "zh-Hant": "約 550 米",
        "zh-Hans": "约 550 米",
        en: "About 550 m",
      },
      etaDisplay: {
        "zh-Hant": "ETA 10:44 · 14 分鐘後",
        "zh-Hans": "ETA 10:44 · 14 分钟后",
        en: "ETA 10:44 · in 14 min",
      },
    },
  ],
  limitationNotice: {
    "zh-Hant": "在線查詢功能部分受限，完整功能請下載 App 使用。",
    "zh-Hans": "在线查询功能部分受限，完整功能请下载 App 使用。",
    en: "Online query is limited on the web. Download the app for the complete experience.",
  },
  scopeNotice: {
    "zh-Hant": "第一版只展示靜態香港巴士查詢演示，不提供即時查詢、完整出行規劃、地鐵、鐵路或渡輪查詢。",
    "zh-Hans": "第一版只展示静态香港巴士查询演示，不提供实时查询、完整出行规划、地铁、铁路或渡轮查询。",
    en: "This first version is a static Hong Kong bus demo only. It does not provide live search, full trip planning, MTR, rail, or ferry lookup.",
  },
};
