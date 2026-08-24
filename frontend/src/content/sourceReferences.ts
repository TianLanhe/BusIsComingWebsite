export const sourceReferences = {
  productPositioning: "product-fact:hong-kong-bus-planning-navigation",
  routeSearch: "product-fact:route-search-and-comparison",
  savedJourneys: "product-fact:saved-journeys",
  journeyGuidance: "product-fact:journey-guidance",
  crossOperatorArrivals: "product-fact:eligible-joint-route-first-leg-eta",
  predepartureMonitor: "product-fact:lock-screen-predeparture-monitor",
  minimumAndroid: "product-fact:min-sdk-25-android-7.1",
  screenshotManifest: "asset-contract:homepage-v1.3.1-screenshots",
  homepageBaselineSpec: "feature-contract:014-homepage-visual-system",
  homepageRefinementSpec: "feature-contract:015-refine-homepage-interactions",
  downloadApi: "openapi-contract:android-download",
  routeApi: "openapi-contract:route-query",
  figma: "https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec",
} as const;

export const sourceReferenceList = Object.values(sourceReferences);
