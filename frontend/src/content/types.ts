export type Locale = "zh-Hant" | "zh-Hans" | "en";
export type SeoPageId = "home" | "privacy";
export type LocalizedString = Record<Locale, string>;

export interface Action {
  label: LocalizedString;
  target: string;
}

export type HeroStoryId =
  | "route-search"
  | "saved-journeys"
  | "journey-guidance"
  | "cross-operator-arrivals"
  | "predeparture-monitor";

export type HeroStageSlot = "front" | "near-left" | "near-right" | "far-left" | "far-right";

export interface HeroStory {
  id: HeroStoryId;
  order: 1 | 2 | 3 | 4 | 5;
  numberLabel: `0${1 | 2 | 3 | 4 | 5}`;
  shortLabel: LocalizedString;
  title: LocalizedString;
  description: LocalizedString;
  lineBreakHints: Record<Locale, string[]>;
  screenshotId: HeroStoryId;
  alt: LocalizedString;
  factReference: string;
}

export interface ManagedScreenshotOutput {
  assetPath: string;
  width: number;
  height: number;
  format: "png" | "webp" | "avif";
  sizeBytes: number;
  sha256: string;
}

export interface ManagedScreenshotVariant {
  sourceFileName: string;
  sourceFingerprint: { width: 1080; height: 1920; sha256: string };
  outputs: ManagedScreenshotOutput[];
  approvalStatus: "approved";
  desensitizationStatus: "approved";
  redactedItems: string[];
  retainedItems: string[];
  approvedAt: string;
}

export interface ManagedScreenshotAsset {
  id: HeroStoryId;
  storyId: HeroStoryId;
  order: number;
  variants: Record<"zh" | "en", ManagedScreenshotVariant>;
  alt: LocalizedString;
  provenanceLabel: string;
}

export interface HomepageFaqItem {
  id: "android-install" | "data-coverage" | "website-app-difference" | "iphone-support";
  question: LocalizedString;
  answer: LocalizedString;
  defaultOpen: boolean;
}

export interface HomepageContentV4 {
  metadata: {
    version: "4.0.0";
    lastReviewed: string;
    sourceReferences: string[];
  };
  siteChrome: {
    brandName: LocalizedString;
    brandAssetId: "busiscoming-app-logo";
    languageLabel: LocalizedString;
    languageOptions: Record<Locale, string>;
    privacyBackHome: { label: LocalizedString; href: Record<Locale, string> };
  };
  hero: {
    eyebrow: LocalizedString;
    productPositioning: LocalizedString;
    primaryAction: Action;
    secondaryAction: Action;
    stories: HeroStory[];
  };
  routeTrial: {
    title: LocalizedString;
    description: LocalizedString;
    originLabel: LocalizedString;
    destinationLabel: LocalizedString;
    queryAction: LocalizedString;
    retryAction: LocalizedString;
    emptyState: { title: LocalizedString; description: LocalizedString };
    errorState: { title: LocalizedString; description: LocalizedString };
    retainedState: LocalizedString;
    metricLabels: Record<"fare" | "duration" | "walking" | "eta", LocalizedString>;
    scopeNotice: LocalizedString;
  };
  downloadDecision: {
    title: LocalizedString;
    description: LocalizedString;
    minimumAndroid: LocalizedString;
    readyAction: LocalizedString;
    checkingState: LocalizedString;
    unavailableState: LocalizedString;
    metadataLabels: Record<"version" | "minimumSystem" | "size", LocalizedString>;
    installationNote: LocalizedString;
  };
  supportEnding: {
    title: LocalizedString;
    faq: HomepageFaqItem[];
    contact: Action;
    privacyLink: { label: LocalizedString; href: Record<Locale, string> };
    backToTop: Action;
  };
  scopeExclusions: LocalizedString[];
  figmaReference: {
    fileUrl: string;
    baseline: {
      sectionNode: "119:64";
      desktopHeroNode: "119:176";
      mobileHeroNode: "119:461";
      designVersion: "Homepage Visual System v1.3.1 — FINAL";
    };
    refinement: {
      sectionNode: "136:292";
      desktopHeroNode: "136:341";
      mobileHeroNode: "136:439";
      narrowHeroNode: "136:484";
      designVersion: "Homepage refinement 2026-08-25 — FINAL";
    };
  };
}

export type HomePageContent = HomepageContentV4;

export type SummaryCardId =
  | "no-account-identity"
  | "no-ads-sale"
  | "device-first-saved-routes"
  | "external-services-as-needed";

export interface SummaryCard {
  id: SummaryCardId;
  order: number;
  title: LocalizedString;
  description: LocalizedString;
}

export type PolicySectionId =
  | "scope"
  | "what-we-do-not-collect"
  | "functional-processing"
  | "third-party-services"
  | "your-choices";

export type PrivacyRequiredFact =
  | "website"
  | "android-app"
  | "no-account"
  | "no-ad-tracking"
  | "no-sale"
  | "route-query-data"
  | "gps-coordinate"
  | "google-geocoding-api"
  | "citybus"
  | "data-gov-hk"
  | "short-term-service-logs"
  | "device-local-saved-routes"
  | "notification-monitoring"
  | "speech-reminders"
  | "user-controls"
  | "app-local-retention"
  | "android-system-backup"
  | "contact-email";

export interface PolicySection {
  id: PolicySectionId;
  order: number;
  title: LocalizedString;
  paragraphs: LocalizedString[];
  bullets?: LocalizedString[];
  requiredFacts: PrivacyRequiredFact[];
}

export interface PrivacyPolicyContent {
  metadata: {
    version: string;
    lastUpdated: string;
    contactEmail: "hezhenyu966@gmail.com";
    appliesTo: Array<"website" | "android-app">;
  };
  hero: { eyebrow: LocalizedString; title: LocalizedString; lead: LocalizedString };
  summaryCards: SummaryCard[];
  sections: PolicySection[];
}

export interface SeoPageLocale {
  path: string;
  htmlLang: string;
  canonical: string;
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  twitterTitle: string;
  twitterDescription: string;
}

export interface SeoPageGroup {
  pageId: SeoPageId;
  defaultLocale: Locale;
  xDefault: string;
  changefreq: "weekly" | "monthly" | "yearly";
  priority: number;
  locales: Record<Locale, SeoPageLocale>;
}
