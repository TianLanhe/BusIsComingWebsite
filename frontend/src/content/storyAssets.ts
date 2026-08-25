import routeSearchZh540 from "../assets/app-screenshots/real/route-search-zh-540.webp";
import routeSearchZh720 from "../assets/app-screenshots/real/route-search-zh-720.webp";
import routeSearchZh1080 from "../assets/app-screenshots/real/route-search-zh-1080.webp";
import routeSearchEn540 from "../assets/app-screenshots/real/route-search-en-540.webp";
import routeSearchEn720 from "../assets/app-screenshots/real/route-search-en-720.webp";
import routeSearchEn1080 from "../assets/app-screenshots/real/route-search-en-1080.webp";
import savedJourneysZh540 from "../assets/app-screenshots/real/saved-journeys-zh-540.webp";
import savedJourneysZh720 from "../assets/app-screenshots/real/saved-journeys-zh-720.webp";
import savedJourneysZh1080 from "../assets/app-screenshots/real/saved-journeys-zh-1080.webp";
import savedJourneysEn540 from "../assets/app-screenshots/real/saved-journeys-en-540.webp";
import savedJourneysEn720 from "../assets/app-screenshots/real/saved-journeys-en-720.webp";
import savedJourneysEn1080 from "../assets/app-screenshots/real/saved-journeys-en-1080.webp";
import journeyGuidanceZh540 from "../assets/app-screenshots/real/journey-guidance-zh-540.webp";
import journeyGuidanceZh720 from "../assets/app-screenshots/real/journey-guidance-zh-720.webp";
import journeyGuidanceZh1080 from "../assets/app-screenshots/real/journey-guidance-zh-1080.webp";
import journeyGuidanceEn540 from "../assets/app-screenshots/real/journey-guidance-en-540.webp";
import journeyGuidanceEn720 from "../assets/app-screenshots/real/journey-guidance-en-720.webp";
import journeyGuidanceEn1080 from "../assets/app-screenshots/real/journey-guidance-en-1080.webp";
import arrivalsZh540 from "../assets/app-screenshots/real/cross-operator-arrivals-zh-540.webp";
import arrivalsZh720 from "../assets/app-screenshots/real/cross-operator-arrivals-zh-720.webp";
import arrivalsZh1080 from "../assets/app-screenshots/real/cross-operator-arrivals-zh-1080.webp";
import arrivalsEn540 from "../assets/app-screenshots/real/cross-operator-arrivals-en-540.webp";
import arrivalsEn720 from "../assets/app-screenshots/real/cross-operator-arrivals-en-720.webp";
import arrivalsEn1080 from "../assets/app-screenshots/real/cross-operator-arrivals-en-1080.webp";
import monitorZh540 from "../assets/app-screenshots/real/predeparture-monitor-zh-540.webp";
import monitorZh720 from "../assets/app-screenshots/real/predeparture-monitor-zh-720.webp";
import monitorZh1080 from "../assets/app-screenshots/real/predeparture-monitor-zh-1080.webp";
import monitorEn540 from "../assets/app-screenshots/real/predeparture-monitor-en-540.webp";
import monitorEn720 from "../assets/app-screenshots/real/predeparture-monitor-en-720.webp";
import monitorEn1080 from "../assets/app-screenshots/real/predeparture-monitor-en-1080.webp";
import type { HeroStoryId, Locale } from "./types";

export type StoryAssetLocaleVariant = "zh" | "en";

export interface StoryAssetSource {
  src: string;
  srcSet: string;
  width: 1080;
  height: 2172;
}

const source = (small: string, medium: string, large: string): StoryAssetSource => ({
  src: medium,
  srcSet: `${small} 540w, ${medium} 720w, ${large} 1080w`,
  width: 1080,
  height: 2172,
});

export const storyAssetLocaleVariant: Record<Locale, StoryAssetLocaleVariant> = {
  "zh-Hant": "zh",
  "zh-Hans": "zh",
  en: "en",
};

export const storyAssets: Record<HeroStoryId, Record<StoryAssetLocaleVariant, StoryAssetSource>> = {
  "route-search": {
    zh: source(routeSearchZh540, routeSearchZh720, routeSearchZh1080),
    en: source(routeSearchEn540, routeSearchEn720, routeSearchEn1080),
  },
  "saved-journeys": {
    zh: source(savedJourneysZh540, savedJourneysZh720, savedJourneysZh1080),
    en: source(savedJourneysEn540, savedJourneysEn720, savedJourneysEn1080),
  },
  "journey-guidance": {
    zh: source(journeyGuidanceZh540, journeyGuidanceZh720, journeyGuidanceZh1080),
    en: source(journeyGuidanceEn540, journeyGuidanceEn720, journeyGuidanceEn1080),
  },
  "cross-operator-arrivals": {
    zh: source(arrivalsZh540, arrivalsZh720, arrivalsZh1080),
    en: source(arrivalsEn540, arrivalsEn720, arrivalsEn1080),
  },
  "predeparture-monitor": {
    zh: source(monitorZh540, monitorZh720, monitorZh1080),
    en: source(monitorEn540, monitorEn720, monitorEn1080),
  },
};

export function getStoryAsset(storyId: HeroStoryId, locale: Locale): StoryAssetSource {
  return storyAssets[storyId][storyAssetLocaleVariant[locale]];
}
