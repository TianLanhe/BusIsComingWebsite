export type Locale = "zh-Hant" | "zh-Hans" | "en";

export type LocalizedString = Record<Locale, string>;

export interface TextPair {
  title: LocalizedString;
  description: LocalizedString;
}

export interface Action {
  label: LocalizedString;
  target: string;
  kind?: "download" | "anchor" | "external";
  downloadFileName?: string;
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
  artifact: DownloadArtifact | null;
}

export interface DownloadArtifact {
  appName: string;
  applicationId: string;
  versionName: string;
  versionCode: number;
  fileName: string;
  sizeBytes: number;
  sizeLabel: LocalizedString;
  sha256: string;
  lastUpdated: string;
}

export interface DownloadManifest {
  version: string;
  lastUpdated: string;
  platforms: Record<DownloadPlatformId, DownloadPlatform>;
}

export type FeatureShowcaseId = "favorite-citybus-routes" | "route-comparison" | "eta-details" | "predeparture-monitor";

export interface SanitizedScreenshotAsset {
  id: string;
  sourcePath: string;
  assetPath: string;
  src: string;
  order: number;
  isDefault: boolean;
  desensitizationStatus: "pending" | "approved" | "rejected";
  redactedItems: string[];
  retainedItems: string[];
  alt: LocalizedString;
}

export interface ScreenshotGallery {
  featureId: FeatureShowcaseId;
  defaultImageId: string;
  manualOnly: true;
  hideStackWhenSingleImage: true;
  visualMode: "stair-card-deck";
  lightboxEnabled: true;
  allowThumbnailControls: false;
  images: SanitizedScreenshotAsset[];
}

export interface HomepageFeatureShowcaseItem {
  id: FeatureShowcaseId;
  order: number;
  title: LocalizedString;
  description: LocalizedString;
  gallery: ScreenshotGallery;
  sourceReference: string;
  autoCarouselEligible: true;
}

export type CarouselSlide = HomepageFeatureShowcaseItem;

export type LocalizedCopyScope =
  | "navigation"
  | "hero"
  | "carousel"
  | "features"
  | "online-query"
  | "download"
  | "faq"
  | "footer"
  | "status"
  | "accessibility";

export interface BrandLogoAsset {
  sourcePath: string;
  outputPath: string;
  backgroundRemoved: true;
  transparent: true;
  usesLauncherPlate: false;
  placements: Array<"header" | "footer" | "favicon">;
}

export interface HomepageExperiencePolishContract {
  metadata: {
    version: string;
    lastUpdated: string;
  };
  carousel: {
    autoAdvanceMs: 3000;
    featureOrder: FeatureShowcaseId[];
    visualMode: "stair-card-deck";
    supportsSwipe: true;
    supportsDesktopDrag: true;
    supportsKeyboardSwitching: true;
    showsNumericLabels: false;
    usesThumbnailStack: false;
    usesPersistentArrows: false;
  };
  brandLogo: BrandLogoAsset;
  contact: {
    navLabel: LocalizedString;
    email: "hezhenyu966@gmail.com";
    href: "mailto:hezhenyu966@gmail.com";
  };
  localizedCopyReview: {
    scope: LocalizedCopyScope[];
    zhHantTone: "hong-kong-practical-written";
    enTone: "natural-restrained-product";
    translationMode: "locale-adapted-not-literal";
    toneGuardrail: "clear-natural-not-colloquial-or-bureaucratic";
    allLocalesRequired: Locale[];
  };
  figmaReference: {
    fileUrl: string;
    pluginPath: "specs/005-homepage-experience-polish/figma-plugin/manifest.json";
    pageName: "Homepage Experience Polish - 005";
    nodeNames: string[];
  };
}

export interface HomepageUiPolishContract {
  metadata: {
    version: string;
    lastUpdated: string;
  };
  heroGallery: {
    desktopScale: "medium";
    showZoomIndicator: false;
    splitGestureZones: {
      screenshotZoneAction: "switch-same-feature-image";
      copyZoneAction: "switch-feature";
    };
    lightbox: {
      enabled: true;
      sameFeatureOnly: true;
      supportsZoom: true;
      supportsPan: true;
      supportsKeyboardClose: true;
      controls: {
        close: LocalizedString;
        zoomIn: LocalizedString;
        zoomOut: LocalizedString;
        resetZoom: LocalizedString;
        previousImage: LocalizedString;
        nextImage: LocalizedString;
      };
    };
  };
  featureGrid: {
    mobileColumns: 2;
    desktopUnchanged: true;
    minimumFeatureCount: number;
    futureFeatureCount: number;
  };
  routeResultCard: {
    mobileCompact: true;
    desktopUnchanged: true;
    metricLayout: "inline-label-value";
    missingStopFallback: LocalizedString;
    metrics: Array<{
      id: "fare" | "duration" | "walking";
      label: LocalizedString;
      valueStyle: "emphasized";
    }>;
  };
  fareCopy: {
    title: LocalizedString;
    description: LocalizedString;
    forbiddenPhrases: string[];
  };
  figmaReference: {
    fileUrl: string;
    pageName: "Homepage UI Polish - 007";
    nodeNames: string[];
    nodeIds: Record<string, string>;
    nodeIdsResolved: boolean;
  };
}

export interface FeatureItem {
  id: string;
  title: LocalizedString;
  description: LocalizedString;
  icon: string;
  sourceReference: string;
}

export interface OnlineQueryDemo {
  title: LocalizedString;
  description: LocalizedString;
  limitationNotice: LocalizedString;
  initialEmptyTitle: LocalizedString;
  initialEmptyDescription: LocalizedString;
  noRoutesTitle: LocalizedString;
  noRoutesDescription: LocalizedString;
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
    apkMeta: LocalizedString;
    iphoneStatus: LocalizedString;
  };
  featureShowcase: HomepageFeatureShowcaseItem[];
  features: FeatureItem[];
  onlineQueryDemo: OnlineQueryDemo;
  downloadSection: {
    title: LocalizedString;
    description: LocalizedString;
    manifestRef: string;
    androidCard: {
      title: LocalizedString;
      meta: LocalizedString;
      primaryAction: Action;
      backupAction: Action;
    };
    iphoneStatus: LocalizedString;
  };
  faq: FAQItem[];
  contact: ContactEntry[];
  scopeExclusions: LocalizedString[];
  homepageExperience: HomepageExperiencePolishContract;
  homepageUiPolish: HomepageUiPolishContract;
  figmaReference: {
    fileUrl: string;
    pageNode: string;
    desktopNode: string;
    mobileNode: string;
    downloadStatesNode: string;
    carouselStatesNode: string;
    notesNode: string;
    versionNote: string;
  };
}

export type DownloadButtonState = "android-ready";
