import { sourceReferences } from "./sourceReferences";
import type { HeroStory } from "./types";

export const homepageStories: HeroStory[] = [
  {
    id: "route-search", order: 1, numberLabel: "01",
    shortLabel: { "zh-Hant": "搜尋", "zh-Hans": "搜索", en: "Search" },
    title: { "zh-Hant": "隨心搜尋，出發更輕鬆", "zh-Hans": "随心搜索，出发更轻松", en: "Search freely. Travel lighter." },
    description: {
      "zh-Hant": "輸入起終點，即時比較合適路線",
      "zh-Hans": "输入起终点，即时比较合适路线",
      en: "Enter your start and destination to compare suitable bus routes.",
    },
    lineBreakHints: {
      "zh-Hant": ["隨心搜尋，", "出發更輕鬆"],
      "zh-Hans": ["随心搜索，", "出发更轻松"],
      en: ["Search freely.", "Travel lighter."],
    },
    screenshotId: "route-search",
    alt: { "zh-Hant": "本次行程及候選巴士路線", "zh-Hans": "本次行程及候选巴士路线", en: "Current journey and suggested bus routes" },
    factReference: sourceReferences.routeSearch,
  },
  {
    id: "saved-journeys", order: 2, numberLabel: "02",
    shortLabel: { "zh-Hant": "行程", "zh-Hans": "行程", en: "Trips" },
    title: { "zh-Hant": "常走的路，一按更省心", "zh-Hans": "常走的路，一按更省心", en: "Your regular routes, one tap away." },
    description: {
      "zh-Hant": "路線、車費與候車時間集中比較，選擇更清楚",
      "zh-Hans": "路线、车费与候车时间集中比较，选择更清楚",
      en: "Compare routes, fares, and waiting times together for a clearer choice.",
    },
    lineBreakHints: {
      "zh-Hant": ["常走的路，", "一按更省心"],
      "zh-Hans": ["常走的路，", "一按更省心"],
      en: ["Your regular routes,", "one tap away."],
    },
    screenshotId: "saved-journeys",
    alt: { "zh-Hant": "常用行程及巴士路線比較", "zh-Hans": "常用行程及巴士路线比较", en: "Saved journeys and bus route comparison" },
    factReference: sourceReferences.savedJourneys,
  },
  {
    id: "journey-guidance", order: 3, numberLabel: "03",
    shortLabel: { "zh-Hant": "沿途", "zh-Hans": "沿途", en: "Journey" },
    title: { "zh-Hant": "一路看清，出行更安心", "zh-Hans": "一路看清，出行更安心", en: "See the journey. Travel with confidence." },
    description: {
      "zh-Hant": "路線、轉乘與目前位置，沿途心中有數",
      "zh-Hans": "路线、换乘与当前位置，沿途心中有数",
      en: "Keep the route, transfers, and your current position in view along the way.",
    },
    lineBreakHints: {
      "zh-Hant": ["一路看清，", "出行更安心"],
      "zh-Hans": ["一路看清，", "出行更安心"],
      en: ["See the journey.", "Travel with confidence."],
    },
    screenshotId: "journey-guidance",
    alt: { "zh-Hant": "路線、轉乘與目前位置畫面", "zh-Hans": "路线、换乘与当前位置画面", en: "Route, transfers, and current position view" },
    factReference: sourceReferences.journeyGuidance,
  },
  {
    id: "cross-operator-arrivals", order: 4, numberLabel: "04",
    shortLabel: { "zh-Hant": "班次", "zh-Hans": "班次", en: "Arrivals" },
    title: { "zh-Hant": "班次看得全，候車更從容", "zh-Hans": "班次看得全，候车更从容", en: "More arrivals in view. Less waiting uncertainty." },
    description: {
      "zh-Hant": "城巴、九巴與龍運到站時間集中呈現",
      "zh-Hans": "城巴、九巴与龙运到站时间集中呈现",
      en: "See Citybus, KMB, and Long Win arrival times together on eligible joint routes.",
    },
    lineBreakHints: {
      "zh-Hant": ["班次看得全，", "候車更從容"],
      "zh-Hans": ["班次看得全，", "候车更从容"],
      en: ["More arrivals in view.", "Less waiting uncertainty."],
    },
    screenshotId: "cross-operator-arrivals",
    alt: { "zh-Hant": "跨營運商巴士到站時間", "zh-Hans": "跨运营商巴士到站时间", en: "Bus arrivals across operators for an eligible route" },
    factReference: sourceReferences.crossOperatorArrivals,
  },
  {
    id: "predeparture-monitor", order: 5, numberLabel: "05",
    shortLabel: { "zh-Hant": "出門", "zh-Hans": "出门", en: "Leave" },
    title: { "zh-Hant": "不用盯手機，出門更有把握", "zh-Hans": "不用盯手机，出门更有把握", en: "Look up less. Leave with confidence." },
    description: {
      "zh-Hant": "啟動一次，鎖屏持續更新候車與步行時間",
      "zh-Hans": "启动一次，锁屏持续更新候车与步行时间",
      en: "Start once and keep waiting and walking times updated on your lock screen.",
    },
    lineBreakHints: {
      "zh-Hant": ["不用盯手機，", "出門更有把握"],
      "zh-Hans": ["不用盯手机，", "出门更有把握"],
      en: ["Look up less.", "Leave with confidence."],
    },
    screenshotId: "predeparture-monitor",
    alt: { "zh-Hant": "鎖屏上的候車與步行監控", "zh-Hans": "锁屏上的候车与步行监控", en: "Waiting and walking updates on the lock screen" },
    factReference: sourceReferences.predepartureMonitor,
  },
];
