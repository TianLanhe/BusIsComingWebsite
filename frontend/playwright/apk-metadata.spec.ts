import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const readyMetadata = {
  platform: "android",
  status: "available",
  versionName: "1.0",
  versionCode: 1,
  fileName: "BusIsComing.apk",
  sizeBytes: 5_563_930,
  lastUpdated: "2026-07-07",
  downloadUrl: "/api/downloads/android/latest",
};

function countApkRequests(page: Page) {
  let count = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/downloads/android/latest") {
      count += 1;
    }
  });
  return () => count;
}

async function expectDisabledEntries(page: Page, name: string, state: string) {
  for (const sectionId of ["hero", "download"]) {
    const entry = page.locator(`#${sectionId}`).getByRole("button", { name });
    await expect(entry).toBeDisabled();
    await expect(entry).toHaveAttribute("aria-disabled", "true");
    await expect(entry).toHaveAttribute("data-download-state", state);
    await expect(entry).not.toHaveAttribute("href", /.+/);
    await expect(page.locator(`#${sectionId}`).getByRole("link", { name: /Download Android APK/ })).toHaveCount(0);
  }
}

type MetadataVisualState = "checking" | "ready" | "unavailable";

const englishCopy: Record<MetadataVisualState, string> = {
  checking: "Checking download…",
  ready: "Download Android APK",
  unavailable: "Android APK is temporarily unavailable",
};

async function stubMetadataState(page: Page, state: MetadataVisualState, metadata = readyMetadata) {
  await page.route("**/api/downloads/android/latest/metadata", async (route) => {
    if (state === "ready") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(metadata) });
      return;
    }
    if (state === "unavailable") {
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ code: "APK_METADATA_INVALID" }) });
      return;
    }
    await new Promise<void>(() => {});
  });
}

function actionForState(page: Page, sectionId: "hero" | "download", state: MetadataVisualState) {
  return page.locator(`#${sectionId} [data-download-state='android-${state}']`);
}

async function expectActionGeometry(page: Page, state: MetadataVisualState) {
  for (const sectionId of ["hero", "download"] as const) {
    const action = actionForState(page, sectionId, state);
    await expect(action).toBeVisible();
    const box = await action.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
    await expect(action).toHaveJSProperty("scrollWidth", await action.evaluate((element) => element.clientWidth));
  }
  const viewport = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);
}

async function expectEnglishTextFits(page: Page, state: MetadataVisualState) {
  for (const sectionId of ["hero", "download"] as const) {
    const action = actionForState(page, sectionId, state);
    const textMetrics = await action.evaluate((element) => {
      const label = element.querySelector("strong");
      const copy = element.querySelector("span");
      const detail = element.querySelector("small");
      const elementRect = element.getBoundingClientRect();
      const labelRect = label?.getBoundingClientRect();
      const detailRect = detail?.getBoundingClientRect();
      return {
        actionScrollWidth: element.scrollWidth,
        actionClientWidth: element.clientWidth,
        actionScrollHeight: element.scrollHeight,
        actionClientHeight: element.clientHeight,
        copyScrollWidth: copy?.scrollWidth ?? null,
        copyClientWidth: copy?.clientWidth ?? null,
        copyScrollHeight: copy?.scrollHeight ?? null,
        copyClientHeight: copy?.clientHeight ?? null,
        elementBottom: elementRect.bottom,
        labelBottom: labelRect?.bottom ?? null,
        detailBottom: detailRect?.bottom ?? null,
        detailScrollWidth: detail?.scrollWidth ?? null,
        detailClientWidth: detail?.clientWidth ?? null,
        detailScrollHeight: detail?.scrollHeight ?? null,
        detailClientHeight: detail?.clientHeight ?? null,
      };
    });
    expect(textMetrics.actionScrollWidth).toBeLessThanOrEqual(textMetrics.actionClientWidth);
    expect(textMetrics.actionScrollHeight).toBeLessThanOrEqual(textMetrics.actionClientHeight);
    expect(textMetrics.copyScrollWidth).toBeLessThanOrEqual(textMetrics.copyClientWidth!);
    expect(textMetrics.copyScrollHeight).toBeLessThanOrEqual(textMetrics.copyClientHeight!);
    expect(textMetrics.labelBottom).not.toBeNull();
    expect(textMetrics.labelBottom!).toBeLessThanOrEqual(textMetrics.elementBottom);
    if (state === "ready") {
      expect(textMetrics.detailBottom).not.toBeNull();
      expect(textMetrics.detailBottom!).toBeLessThanOrEqual(textMetrics.elementBottom);
      expect(textMetrics.detailScrollWidth).toBeLessThanOrEqual(textMetrics.detailClientWidth!);
      expect(textMetrics.detailScrollHeight).toBeLessThanOrEqual(textMetrics.detailClientHeight!);
    } else {
      expect(textMetrics.detailBottom).toBeNull();
    }
  }
}

function screenshotPath(state: MetadataVisualState, projectName: string) {
  const viewport = projectName === "desktop-1440" ? "desktop" : "mobile";
  return path.join("playwright", "__screenshots__", `apk-download-${state}-${viewport}.png`);
}

test("keeps both metadata-ready entries as stable native links before any APK request", async ({ page }) => {
  const apkRequestCount = countApkRequests(page);
  await page.route("**/api/downloads/android/latest/metadata", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(readyMetadata) });
  });

  await page.goto("/en/");
  for (const sectionId of ["hero", "download"]) {
    const entry = page.locator(`#${sectionId}`).getByRole("link", { name: "Download Android APK" });
    await expect(entry).toHaveAttribute("href", "/api/downloads/android/latest");
    await expect(entry).toHaveAttribute("download", "BusIsComing.apk");
    await expect(entry).not.toHaveAttribute("href", /^blob:/);
  }
  expect(apkRequestCount()).toBe(0);
});

test.describe("APK metadata visual states", () => {
  for (const state of ["checking", "ready", "unavailable"] as const) {
    test(`keeps the ${state} state readable at both primary download entries`, async ({ page }, testInfo) => {
      await stubMetadataState(page, state);
      await page.goto("/en/");

      for (const sectionId of ["hero", "download"] as const) {
        const action = actionForState(page, sectionId, state);
        await expect(action).toHaveAccessibleName(englishCopy[state]);
      }
      await expectActionGeometry(page, state);
      await expectEnglishTextFits(page, state);

      if (state === "ready") {
        await expect(page.getByText("Version 1.0 · 5.3 MB")).toHaveCount(2);
      } else {
        await expect(page.getByText("Version 1.0 · 5.3 MB")).toHaveCount(0);
      }

      await page.screenshot({ path: screenshotPath(state, testInfo.project.name), fullPage: true });
    });
  }
});

test("keeps a contract-limit versionName contained at both ready entries", async ({ page }) => {
  await stubMetadataState(page, "ready", { ...readyMetadata, versionName: "v".repeat(64) });
  await page.goto("/en/");

  await expectActionGeometry(page, "ready");
  await expectEnglishTextFits(page, "ready");
});

test("keeps disabled entries visually inactive on hover", async ({ page }) => {
  await stubMetadataState(page, "unavailable");
  await page.goto("/en/");

  for (const sectionId of ["hero", "download"] as const) {
    const action = actionForState(page, sectionId, "unavailable");
    await action.hover();
    await expect(action).toHaveCSS("outline-style", "none");
    await expect(action).toHaveCSS("outline-width", "0px");
  }
});

test("keeps the Hero action row out of the preview column at the 981px dual-column boundary", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile-390", "981px is a desktop breakpoint regression.");
  await page.setViewportSize({ width: 981, height: 844 });
  await stubMetadataState(page, "ready");
  await page.goto("/en/");

  const row = page.getByTestId("hero-actions");
  const preview = page.getByTestId("hero-preview");
  const rowBox = await row.boundingBox();
  const previewBox = await preview.boundingBox();
  expect(rowBox).not.toBeNull();
  expect(previewBox).not.toBeNull();
  expect(rowBox!.x + rowBox!.width).toBeLessThanOrEqual(previewBox!.x);
});

test("reaches Hero and Download Section ready links with sequential Tab navigation and a visible focus ring", async ({ page }) => {
  await stubMetadataState(page, "ready");
  await page.goto("/en/");

  const heroAction = actionForState(page, "hero", "ready");
  const sectionAction = actionForState(page, "download", "ready");
  await expect(page.locator("body")).toBeFocused();

  let reachedHero = false;
  for (let tabPresses = 0; tabPresses < 16; tabPresses += 1) {
    await page.keyboard.press("Tab");
    if (await heroAction.evaluate((element) => document.activeElement === element)) {
      reachedHero = true;
      break;
    }
  }
  expect(reachedHero).toBe(true);
  await expect(heroAction).toBeFocused();
  await expect(heroAction).toHaveCSS("outline-style", "solid");
  await expect(heroAction).toHaveCSS("outline-width", "3px");

  let reachedDownloadSection = false;
  for (let tabPresses = 0; tabPresses < 40; tabPresses += 1) {
    await page.keyboard.press("Tab");
    if (await sectionAction.evaluate((element) => document.activeElement === element)) {
      reachedDownloadSection = true;
      break;
    }
  }
  expect(reachedDownloadSection).toBe(true);
  await expect(sectionAction).toBeFocused();
  await expect(sectionAction).toHaveCSS("outline-style", "solid");
  await expect(sectionAction).toHaveCSS("outline-width", "3px");
});

test("blocks both entries and makes zero APK requests while metadata is checking", async ({ page }) => {
  const apkRequestCount = countApkRequests(page);
  await page.route("**/api/downloads/android/latest/metadata", () => new Promise<void>(() => {}));

  await page.goto("/en/");
  await expectDisabledEntries(page, "Checking download…", "android-checking");
  await expect(page.locator("a[href^='blob:']")).toHaveCount(0);
  expect(apkRequestCount()).toBe(0);
});

test("keeps the Hero action row stable across checking, unavailable, and ready", async ({ page }, testInfo) => {
  let metadataState: MetadataVisualState = "checking";
  await page.route("**/api/downloads/android/latest/metadata", async (route) => {
    if (metadataState === "ready") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(readyMetadata) });
      return;
    }
    if (metadataState === "unavailable") {
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ code: "APK_METADATA_INVALID" }) });
      return;
    }
    await new Promise<void>(() => {});
  });

  await page.goto("/en/");
  const actionRow = page.getByTestId("hero-actions");
  const checkingBox = await actionRow.boundingBox();
  const checkingActionBox = await actionForState(page, "hero", "checking").boundingBox();
  const checkingDownloadBox = await actionForState(page, "download", "checking").boundingBox();
  const checkingDownloadSectionBox = await page.locator("#download").boundingBox();
  expect(checkingBox).not.toBeNull();
  expect(checkingActionBox).not.toBeNull();
  expect(checkingDownloadBox).not.toBeNull();
  expect(checkingDownloadSectionBox).not.toBeNull();
  if (testInfo.project.name === "desktop-1440") {
    await expect(actionRow).toHaveCSS("flex-wrap", "nowrap");
    expect(checkingActionBox!.width).toBeCloseTo(320, 0);
  } else {
    expect(checkingActionBox!.width).toBeCloseTo(checkingBox!.width, 0);
  }

  metadataState = "ready";
  await page.reload();
  const readyBox = await actionRow.boundingBox();
  const readyActionBox = await actionForState(page, "hero", "ready").boundingBox();
  const readyDownloadBox = await actionForState(page, "download", "ready").boundingBox();
  const readyDownloadSectionBox = await page.locator("#download").boundingBox();
  expect(readyBox).not.toBeNull();
  expect(readyActionBox).not.toBeNull();
  expect(readyDownloadBox).not.toBeNull();
  expect(readyDownloadSectionBox).not.toBeNull();
  expect(Math.abs(readyBox!.height - checkingBox!.height)).toBeLessThanOrEqual(1);
  expect(Math.abs(readyDownloadBox!.height - checkingDownloadBox!.height)).toBeLessThanOrEqual(1);
  expect(Math.abs(readyDownloadSectionBox!.height - checkingDownloadSectionBox!.height)).toBeLessThanOrEqual(1);
  if (testInfo.project.name === "desktop-1440") {
    await expect(actionRow).toHaveCSS("flex-wrap", "nowrap");
    expect(readyActionBox!.width).toBeCloseTo(320, 0);
  } else {
    expect(readyActionBox!.width).toBeCloseTo(readyBox!.width, 0);
  }

  metadataState = "unavailable";
  await page.reload();
  const unavailableBox = await actionRow.boundingBox();
  const unavailableActionBox = await actionForState(page, "hero", "unavailable").boundingBox();
  const unavailableDownloadBox = await actionForState(page, "download", "unavailable").boundingBox();
  const unavailableDownloadSectionBox = await page.locator("#download").boundingBox();
  expect(unavailableBox).not.toBeNull();
  expect(unavailableActionBox).not.toBeNull();
  expect(unavailableDownloadBox).not.toBeNull();
  expect(unavailableDownloadSectionBox).not.toBeNull();
  expect(Math.abs(readyBox!.height - unavailableBox!.height)).toBeLessThanOrEqual(1);
  expect(Math.abs(readyDownloadBox!.height - unavailableDownloadBox!.height)).toBeLessThanOrEqual(1);
  expect(Math.abs(readyDownloadSectionBox!.height - unavailableDownloadSectionBox!.height)).toBeLessThanOrEqual(1);
  if (testInfo.project.name === "desktop-1440") {
    await expect(actionRow).toHaveCSS("flex-wrap", "nowrap");
    expect(unavailableActionBox!.width).toBeCloseTo(320, 0);
  } else {
    expect(unavailableActionBox!.width).toBeCloseTo(unavailableBox!.width, 0);
  }
});

test("blocks both entries and makes zero APK requests when metadata is unavailable", async ({ page }) => {
  const apkRequestCount = countApkRequests(page);
  await page.route("**/api/downloads/android/latest/metadata", async (route) => {
    await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ code: "APK_METADATA_INVALID" }) });
  });

  await page.goto("/en/");
  await expectDisabledEntries(page, "Android APK is temporarily unavailable", "android-unavailable");
  await expect(page.locator("a[href^='blob:']")).toHaveCount(0);
  expect(apkRequestCount()).toBe(0);
});
