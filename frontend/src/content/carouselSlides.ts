import favoriteRoutes from "../assets/app-screenshots/favorite-routes.svg";
import compareRoutes from "../assets/app-screenshots/compare-routes.svg";
import etaDetails from "../assets/app-screenshots/eta-details.svg";
import monitorNotice from "../assets/app-screenshots/monitor-notice.svg";
import { sourceReferences } from "./sourceReferences";
import type { CarouselSlide } from "./types";

export const carouselSlides: CarouselSlide[] = [
  {
    id: "favorite-routes",
    order: 1,
    title: {
      "zh-Hant": "常用路線快速查詢",
      "zh-Hans": "常用路线快速查询",
      en: "Fast saved-route lookup",
    },
    description: {
      "zh-Hant": "保存常用起終點，一按查看下一程 Citybus 候選路線。",
      "zh-Hans": "保存常用起终点，一按查看下一程 Citybus 候选路线。",
      en: "Save frequent origins and destinations, then reopen Citybus options in one tap.",
    },
    screenshot: favoriteRoutes,
    screenshotStatus: "placeholder",
    sourceReference: sourceReferences.androidReadme,
  },
  {
    id: "route-comparison",
    order: 2,
    title: {
      "zh-Hant": "比較路線、票價與步行距離",
      "zh-Hans": "比较路线、票价与步行距离",
      en: "Compare fare, time, and walking distance",
    },
    description: {
      "zh-Hant": "同頁比較 HK$ 車費、總行程時間、步行距離與首程 ETA。",
      "zh-Hans": "同页比较 HK$ 车费、总行程时间、步行距离与首程 ETA。",
      en: "Review HK$ fare, total journey time, walking distance, and first-leg ETA together.",
    },
    screenshot: compareRoutes,
    screenshotStatus: "placeholder",
    sourceReference: sourceReferences.routeResultsSpec,
  },
  {
    id: "eta-details",
    order: 3,
    title: {
      "zh-Hant": "多班 ETA 與路線詳情",
      "zh-Hans": "多班 ETA 与路线详情",
      en: "Multiple ETAs and route details",
    },
    description: {
      "zh-Hant": "打開路線卡片，查看最多 3 班到站時間、上下車站與途經站點。",
      "zh-Hans": "打开路线卡片，查看最多 3 班到站时间、上下车站与途经站点。",
      en: "Open a route card to inspect up to three arrivals, boarding stops, and route details.",
    },
    screenshot: etaDetails,
    screenshotStatus: "placeholder",
    sourceReference: sourceReferences.androidAgents,
  },
  {
    id: "monitor-notice",
    order: 4,
    title: {
      "zh-Hant": "出門前短時通知監測",
      "zh-Hans": "出门前短时通知监测",
      en: "Short pre-departure notification monitoring",
    },
    description: {
      "zh-Hant": "出門前啟動短時前台服務，定期刷新首程 ETA 並提供狀態提示。",
      "zh-Hans": "出门前启动短时前台服务，定期刷新首程 ETA 并提供状态提示。",
      en: "Start a short foreground monitor before leaving and keep first-leg ETA visible.",
    },
    screenshot: monitorNotice,
    screenshotStatus: "placeholder",
    sourceReference: sourceReferences.notificationSpec,
  },
];
