export type Locale = "zh-Hant" | "zh-Hans" | "en";

export type LocalizedString = Record<Locale, string>;

export interface TextPair {
  title: LocalizedString;
  description: LocalizedString;
}

export interface Action {
  label: LocalizedString;
  target: string;
}

export type DownloadPlatformId = "android" | "ios";
export type DownloadStatus = "available" | "unsupported" | "temporarily-unavailable";

export interface DownloadPlatform {
  platform: DownloadPlatformId;
  status: DownloadStatus;
  label: LocalizedString;
  description: LocalizedString;
  actionLabel: LocalizedString;
  downloadUrl: string | null;
  disabledReason: LocalizedString | null;
}

export interface DownloadManifest {
  version: string;
  lastUpdated: string;
  platforms: Record<DownloadPlatformId, DownloadPlatform>;
}

export interface CarouselSlide {
  id: string;
  order: number;
  title: LocalizedString;
  description: LocalizedString;
  screenshot: string;
  screenshotStatus: "real" | "placeholder";
  sourceReference: string;
}

export interface FeatureItem {
  id: string;
  title: LocalizedString;
  description: LocalizedString;
  icon: string;
  sourceReference: string;
}

export interface DemoRouteResult {
  routeNumber: string;
  operator: string;
  fare: string;
  duration: LocalizedString;
  walkingDistance: LocalizedString;
  etaDisplay: LocalizedString;
}

export interface OnlineQueryDemo {
  title: LocalizedString;
  mode: "static-demo";
  origin: LocalizedString;
  destination: LocalizedString;
  resultRows: DemoRouteResult[];
  limitationNotice: LocalizedString;
  scopeNotice: LocalizedString;
}

export interface FAQItem {
  id: string;
  category: "android-install" | "ios-status" | "online-query-limit" | "data-scope" | "other";
  question: LocalizedString;
  answer: LocalizedString;
}

export interface ContactEntry {
  id: string;
  label: LocalizedString;
  description: LocalizedString;
  href: string;
  priority: "secondary";
}

export interface HomePageContent {
  metadata: {
    version: string;
    lastUpdated: string;
    sourceReferences: string[];
  };
  navigation: {
    brand: LocalizedString;
    items: Array<{
      id: string;
      label: LocalizedString;
      target: string;
    }>;
    languageLabel: LocalizedString;
  };
  hero: {
    headline: LocalizedString;
    subheading: LocalizedString;
    bullets: TextPair[];
    primaryAction: Action;
    secondaryAction: Action;
    carouselSlides: CarouselSlide[];
  };
  features: FeatureItem[];
  onlineQueryDemo: OnlineQueryDemo;
  downloadSection: {
    title: LocalizedString;
    description: LocalizedString;
    manifestRef: string;
  };
  faq: FAQItem[];
  contact: ContactEntry[];
  scopeExclusions: LocalizedString[];
  figmaReference: {
    fileUrl: string;
    desktopNode: string;
    mobileNode: string;
    downloadStatesNode: string;
    carouselStatesNode: string;
    versionNote: string;
  };
}

export type DownloadButtonState = "default" | "android-expanded" | "iphone-expanded";
