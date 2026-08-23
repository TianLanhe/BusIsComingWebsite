import routeSearch540 from "../assets/app-screenshots/real/route-search-540.webp";
import routeSearch720 from "../assets/app-screenshots/real/route-search-720.webp";
import routeSearch1080 from "../assets/app-screenshots/real/route-search-1080.webp";
import savedJourneys540 from "../assets/app-screenshots/real/saved-journeys-540.webp";
import savedJourneys720 from "../assets/app-screenshots/real/saved-journeys-720.webp";
import savedJourneys1080 from "../assets/app-screenshots/real/saved-journeys-1080.webp";
import journeyGuidance540 from "../assets/app-screenshots/real/journey-guidance-540.webp";
import journeyGuidance720 from "../assets/app-screenshots/real/journey-guidance-720.webp";
import journeyGuidance1080 from "../assets/app-screenshots/real/journey-guidance-1080.webp";
import arrivals540 from "../assets/app-screenshots/real/cross-operator-arrivals-540.webp";
import arrivals720 from "../assets/app-screenshots/real/cross-operator-arrivals-720.webp";
import arrivals1080 from "../assets/app-screenshots/real/cross-operator-arrivals-1080.webp";
import monitor540 from "../assets/app-screenshots/real/predeparture-monitor-540.webp";
import monitor720 from "../assets/app-screenshots/real/predeparture-monitor-720.webp";
import monitor1080 from "../assets/app-screenshots/real/predeparture-monitor-1080.webp";
import type { HeroStoryId } from "./types";

export interface StoryAssetSource {
  src: string;
  srcSet: string;
  width: number;
  height: number;
}

export const storyAssets: Record<HeroStoryId, StoryAssetSource> = {
  "route-search": {
    src: routeSearch720,
    srcSet: `${routeSearch540} 540w, ${routeSearch720} 720w, ${routeSearch1080} 1080w`,
    width: 1080,
    height: 2172,
  },
  "saved-journeys": {
    src: savedJourneys720,
    srcSet: `${savedJourneys540} 540w, ${savedJourneys720} 720w, ${savedJourneys1080} 1080w`,
    width: 1080,
    height: 2172,
  },
  "journey-guidance": {
    src: journeyGuidance720,
    srcSet: `${journeyGuidance540} 540w, ${journeyGuidance720} 720w, ${journeyGuidance1080} 1080w`,
    width: 1080,
    height: 2172,
  },
  "cross-operator-arrivals": {
    src: arrivals720,
    srcSet: `${arrivals540} 540w, ${arrivals720} 720w, ${arrivals1080} 1080w`,
    width: 1080,
    height: 2172,
  },
  "predeparture-monitor": {
    src: monitor720,
    srcSet: `${monitor540} 540w, ${monitor720} 720w, ${monitor1080} 1080w`,
    width: 1080,
    height: 2400,
  },
};
