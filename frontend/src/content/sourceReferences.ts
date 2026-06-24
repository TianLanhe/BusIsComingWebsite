export const sourceReferences = {
  androidReadme: "Android project README",
  androidAgents: "Android project AGENTS",
  androidLauncherForeground:
    "/Users/jianglijie/AndroidStudioProjects/BusIsComming/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png",
  uiStyleGuide: "Android project UI style guide",
  routeResultsSpec: "Android project route query results spec",
  notificationSpec: "Android project notification monitoring spec",
  homepageV2Spec: "specs/003-homepage-ui-optimization/spec.md",
  homepageExperiencePolishSpec: "specs/005-homepage-experience-polish/spec.md",
  homepageExperiencePolishContract: "specs/005-homepage-experience-polish/contracts/homepage-experience-content.schema.json",
  screenshotManifest: "frontend/src/assets/app-screenshots/real/manifest.json",
  androidDownloadSpec: "specs/002-android-apk-download/spec.md",
  figma: "https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU",
  figmaExperiencePolish: "https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec",
  // 香港交通网站只作为 zh-Hant 措辞参考，App 功能事实仍以 Android 主项目和本仓库规格为准。
  citybusWordingReference: "https://www.citybus.com.hk/",
  hkeMobilityWordingReference: "https://www.hkemobility.gov.hk/",
  transportDepartmentWordingReference: "https://www.td.gov.hk/",
  govHkTransportWordingReference: "https://www.gov.hk/tc/residents/transport/publictransport/",
} as const;

export const sourceReferenceList = Object.values(sourceReferences);
