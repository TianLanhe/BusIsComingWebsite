import etaArrivalsSheet from "../assets/app-screenshots/real/eta-arrivals-sheet.png";
import homeAllRoutesSheet from "../assets/app-screenshots/real/home-all-routes-sheet.png";
import homeFavoritesResults from "../assets/app-screenshots/real/home-favorites-results.png";
import lockscreenMonitor from "../assets/app-screenshots/real/lockscreen-monitor.png";
import screenshotManifest from "../assets/app-screenshots/real/manifest.json";
import routeDetailExpanded from "../assets/app-screenshots/real/route-detail-expanded.png";
import { sourceReferences } from "./sourceReferences";
import type { CarouselSlide, FeatureShowcaseId, SanitizedScreenshotAsset } from "./types";

const imageSources: Record<string, string> = {
  "home-favorites-results": homeFavoritesResults,
  "home-all-routes-sheet": homeAllRoutesSheet,
  "route-detail-expanded": routeDetailExpanded,
  "eta-arrivals-sheet": etaArrivalsSheet,
  "lockscreen-monitor": lockscreenMonitor,
};

function screenshotStatus(value: string): SanitizedScreenshotAsset["desensitizationStatus"] {
  if (value === "pending" || value === "approved" || value === "rejected") {
    return value;
  }

  throw new Error(`Unsupported screenshot status: ${value}`);
}

function galleryFor(featureId: FeatureShowcaseId) {
  const group = screenshotManifest.groups.find((item) => item.featureId === featureId);
  if (!group) {
    throw new Error(`Missing screenshot group: ${featureId}`);
  }

  const images = group.images
    .map<SanitizedScreenshotAsset>((image) => ({
      id: image.id,
      sourcePath: image.sourcePath,
      assetPath: image.outputPath,
      src: imageSources[image.id],
      order: image.order,
      isDefault: image.isDefault,
      desensitizationStatus: screenshotStatus(image.desensitizationStatus),
      redactedItems: image.redactedItems,
      retainedItems: image.retainedItems,
      alt: image.alt,
    }))
    .sort((a, b) => a.order - b.order);

  return {
    featureId,
    defaultImageId: images.find((image) => image.isDefault)?.id ?? images[0].id,
    manualOnly: true,
    hideStackWhenSingleImage: true,
    visualMode: "cinematic-phone-rail",
    allowThumbnailControls: false,
    images,
  } as const;
}

export const carouselSlides: CarouselSlide[] = [
  {
    id: "favorite-citybus-routes",
    order: 1,
    title: {
      "zh-Hant": "常用城巴路線，一按再查",
      "zh-Hans": "常用城巴路线，一键再查",
      en: "Saved Citybus routes in one tap",
    },
    description: {
      "zh-Hant": "儲低常搭城巴的起點和目的地，返工放工前一按再查，不用每次重新輸入。",
      "zh-Hans": "把常坐的城巴起终点保存起来，通勤前不用每次重新输入。",
      en: "Save frequent Citybus origins and destinations so repeat commute searches stay one tap away.",
    },
    gallery: galleryFor("favorite-citybus-routes"),
    sourceReference: sourceReferences.androidReadme,
    autoCarouselEligible: true,
  },
  {
    id: "route-comparison",
    order: 2,
    title: {
      "zh-Hant": "比較交通費用、時間與步行",
      "zh-Hans": "比较总车费、时间与步行",
      en: "Compare total fare, time, and walking distance",
    },
    description: {
      "zh-Hant": "同頁比較城巴候選路線，交通費用、候車時間和步行距離一次看清。",
      "zh-Hans": "同页比较城巴候选路线，连多程总车费、等候时间和步行距离一起看清。",
      en: "Compare Citybus options with multi-leg total fare, wait time, and walking distance in one view.",
    },
    gallery: galleryFor("route-comparison"),
    sourceReference: sourceReferences.routeResultsSpec,
    autoCarouselEligible: true,
  },
  {
    id: "eta-details",
    order: 3,
    title: {
      "zh-Hant": "抵站時間與路線詳情",
      "zh-Hans": "多班 ETA 与路线详情",
      en: "Multiple ETAs and route details",
    },
    description: {
      "zh-Hant": "打開路線詳情，查看城巴抵站時間、上落車提示和途經站點，出門前更有把握。",
      "zh-Hans": "打开路线详情，查看城巴到站时间、上下车提示和途经站点，出门前更有把握。",
      en: "Open a Citybus route card to inspect ETAs, boarding notes, and route details before leaving.",
    },
    gallery: galleryFor("eta-details"),
    sourceReference: sourceReferences.androidAgents,
    autoCarouselEligible: true,
  },
  {
    id: "predeparture-monitor",
    order: 4,
    title: {
      "zh-Hant": "出門前監測與語音提醒",
      "zh-Hans": "出门前监测与语音提醒",
      en: "Pre-departure monitoring and voice cues",
    },
    description: {
      "zh-Hant": "臨出門前短時間監測首程城巴抵站時間，配合通知與語音提示，少一點趕車壓力。",
      "zh-Hans": "临出门前短时间监测首程 ETA，配合通知与语音提示，少一点赶车压力。",
      en: "Monitor first-leg ETA shortly before leaving, with notification and voice cues to reduce last-minute rush.",
    },
    gallery: galleryFor("predeparture-monitor"),
    sourceReference: sourceReferences.notificationSpec,
    autoCarouselEligible: true,
  },
];
