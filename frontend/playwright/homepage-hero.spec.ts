import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, waitForHomepageVisual } from "./helpers/homepageVisual";

const metadata = {
  platform: "android", status: "available", versionName: "1.3.1", versionCode: 19,
  fileName: "BusIsComing.apk", sizeBytes: 2_621_440, lastUpdated: "2026-08-24",
  downloadUrl: "/api/downloads/android/latest",
};

test("approved first screen keeps the title, CTAs, phone frame, and story rail in order", async ({ page }, testInfo) => {
  await page.route("**/api/downloads/android/latest/metadata", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(metadata) }));
  await page.goto("/zh-hant/");
  await waitForHomepageVisual(page);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("隨心搜尋，出發更輕鬆");
  await expect(page.locator("#root > header")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "選擇語言" }).getByRole("link")).toHaveCount(3);
  await expect(page.locator("#features").getByRole("img", { name: "BusIsComing" })).toBeVisible();
  const primary = page.locator("#features").getByRole("link", { name: "下載 Android App" });
  const secondary = page.locator("#features").getByRole("link", { name: "路線試查 →" });
  await expect(primary).toBeVisible();
  await expect(secondary).toBeVisible();
  const primaryBox = await primary.boundingBox();
  const secondaryBox = await secondary.boundingBox();
  expect(primaryBox!.x).toBeLessThan(secondaryBox!.x);
  await expect(primary).toHaveAttribute("href", testInfo.project.name === "desktop-1440" ? "#download" : "/api/downloads/android/latest");

  const stageBox = await page.getByTestId("hero-story-stage").boundingBox();
  const frontPhone = page.locator('[data-slot="front"]');
  const frontBox = await frontPhone.boundingBox();
  const railBox = await page.getByRole("group", { name: /五個功能故事/ }).boundingBox();
  expect(frontBox).not.toBeNull();
  expect(railBox).not.toBeNull();
  const frameRatio = await frontPhone.evaluate((phone) => phone.offsetWidth / phone.offsetHeight);
  expect(frameRatio).toBeCloseTo(1080 / 2172, 2);
  const imageGeometry = await frontPhone.locator("img").evaluate((image) => {
    const style = window.getComputedStyle(image);
    return {
      naturalRatio: image.naturalWidth / image.naturalHeight,
      objectFit: style.objectFit,
      objectPosition: style.objectPosition,
      renderedWidth: image.getBoundingClientRect().width,
      renderedHeight: image.getBoundingClientRect().height,
      screenWidth: image.parentElement?.getBoundingClientRect().width ?? 0,
      screenHeight: image.parentElement?.getBoundingClientRect().height ?? 0,
    };
  });
  // `srcset` 会把 naturalWidth 映射到 CSS intrinsic width 并取整；比例以 2 位精度验收。
  expect(imageGeometry.naturalRatio).toBeCloseTo(1080 / 2172, 2);
  expect(imageGeometry.objectFit).toBe("cover");
  expect(imageGeometry.objectPosition).toBe("50% 0%");
  expect(imageGeometry.renderedWidth).toBeCloseTo(imageGeometry.screenWidth, 1);
  expect(imageGeometry.renderedHeight).toBeCloseTo(imageGeometry.screenHeight, 1);
  if (testInfo.project.name.startsWith("mobile")) {
    expect(railBox!.y).toBeGreaterThanOrEqual(frontBox!.y + frontBox!.height);
    expect(stageBox!.y + stageBox!.height).toBeLessThanOrEqual(railBox!.y + 1);
  }
  await expect(page.getByText("2026-08-24")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test("mobile browser chrome cannot compress the phone stage under the story rail", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "以 mobile context 覆盖浏览器 chrome 压缩后的短 viewport");

  await page.route("**/api/downloads/android/latest/metadata", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(metadata) }));

  const mobileViewports = [
    { width: 390, height: 720, phoneWidth: 204, phoneCenterY: 205 },
    { width: 320, height: 720, phoneWidth: 186, phoneCenterY: 187 },
    { width: 432, height: 760, phoneWidth: 204, phoneCenterY: 205 },
  ];

  for (const viewport of mobileViewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/zh-hant/");
    await waitForHomepageVisual(page);

    const stageBox = await page.getByTestId("hero-story-stage").boundingBox();
    const frontPhone = page.locator('[data-slot="front"]');
    const frontBox = await frontPhone.boundingBox();
    const railBox = await page.getByRole("group", { name: /五個功能故事/ }).boundingBox();
    expect(stageBox).not.toBeNull();
    expect(frontBox).not.toBeNull();
    expect(railBox).not.toBeNull();

    const frameSize = await frontPhone.evaluate((phone) => ({
      width: phone.offsetWidth,
      height: phone.offsetHeight,
    }));
    expect(frameSize.width).toBe(viewport.phoneWidth);
    expect(frameSize.width / frameSize.height).toBeCloseTo(1080 / 2172, 2);
    expect(Math.abs(frontBox!.x + frontBox!.width / 2 - viewport.width / 2)).toBeLessThan(1);
    expect(Math.abs(frontBox!.y + frontBox!.height / 2 - stageBox!.y - viewport.phoneCenterY)).toBeLessThan(1);
    expect(frontBox!.y + frontBox!.height).toBeLessThanOrEqual(railBox!.y);
    expect(stageBox!.y + stageBox!.height).toBeLessThanOrEqual(railBox!.y + 1);
    await expectNoHorizontalOverflow(page);
  }
});

test("desktop hero scales the approved 1440 by 960 composition without clipping or empty dead space", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "桌面连续缩放只需在 desktop context 验收");

  await page.route("**/api/downloads/android/latest/metadata", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(metadata) }));

  const desktopViewports = [
    {
      viewport: { width: 1470, height: 801 },
      stage: { x: 134.25, width: 1201.5, height: 801 },
      phoneWidth: 275.344,
      railWidth: 475.594,
      titleSize: 70.088,
    },
    {
      viewport: { width: 1728, height: 962 },
      stage: { x: 142.5, width: 1443, height: 962 },
      phoneWidth: 330.688,
      railWidth: 571.188,
      titleSize: 84.175,
    },
    {
      viewport: { width: 2560, height: 1318 },
      stage: { x: 291.5, width: 1977, height: 1318 },
      phoneWidth: 453.063,
      railWidth: 782.563,
      titleSize: 115.325,
    },
    {
      viewport: { width: 3840, height: 2160 },
      stage: { x: 300, width: 3240, height: 2160 },
      phoneWidth: 742.5,
      railWidth: 1282.5,
      titleSize: 189,
      sourceWidthLabel: "1080",
    },
  ];

  for (const expected of desktopViewports) {
    await page.setViewportSize(expected.viewport);
    await page.goto("/zh-hant/");
    await waitForHomepageVisual(page);

    const stageBox = await page.getByTestId("hero-story-stage").boundingBox();
    const frontPhone = page.locator('[data-slot="front"]');
    const frontBox = await frontPhone.boundingBox();
    const phoneBoxes = await page.locator("#features figure").evaluateAll((phones) => phones.map((phone) => {
      const box = phone.getBoundingClientRect();
      return { right: box.right };
    }));
    const languageBox = await page.getByRole("navigation", { name: "選擇語言" }).boundingBox();
    const contextNoteBox = await page.locator("#features aside").boundingBox();
    const frontWidth = await frontPhone.evaluate((phone) => phone.offsetWidth);
    const rail = page.getByRole("group", { name: /五個功能故事/ });
    const railBox = await rail.boundingBox();
    const titleSize = Number.parseFloat(await page.getByTestId("hero-title").evaluate((title) => getComputedStyle(title).fontSize));

    expect(stageBox).not.toBeNull();
    expect(frontBox).not.toBeNull();
    expect(languageBox).not.toBeNull();
    expect(contextNoteBox).not.toBeNull();
    expect(railBox).not.toBeNull();
    expect(Math.abs(stageBox!.x - expected.stage.x)).toBeLessThan(1.5);
    expect(Math.abs(stageBox!.width - expected.stage.width)).toBeLessThan(1.5);
    expect(Math.abs(stageBox!.height - expected.stage.height)).toBeLessThan(1.5);
    expect(Math.abs(frontWidth - expected.phoneWidth)).toBeLessThan(1.5);
    expect(Math.abs(railBox!.width - expected.railWidth)).toBeLessThan(1.5);
    expect(Math.abs(titleSize - expected.titleSize)).toBeLessThan(.75);
    expect(railBox!.y + railBox!.height).toBeLessThanOrEqual(expected.viewport.height);

    const designScale = Math.min(expected.viewport.width / 1440, expected.viewport.height / 960);
    const visualRightGap = stageBox!.x + stageBox!.width - Math.max(...phoneBoxes.map((box) => box.right));
    expect(visualRightGap).toBeGreaterThanOrEqual(-1);
    expect(visualRightGap).toBeLessThanOrEqual(designScale * 6);
    expect(frontBox!.y - languageBox!.y - languageBox!.height).toBeGreaterThanOrEqual(4);
    expect(Math.abs(contextNoteBox!.x - stageBox!.x - designScale * 776)).toBeLessThan(1.5);
    expect(Math.abs(contextNoteBox!.y - stageBox!.y - designScale * 738)).toBeLessThan(1.5);

    const labelsFit = await rail.locator("button").evaluateAll((buttons) => buttons.every((button) => {
      const railRect = button.parentElement?.getBoundingClientRect();
      const labelRect = button.lastElementChild?.getBoundingClientRect();
      return Boolean(railRect && labelRect && labelRect.bottom <= railRect.bottom && labelRect.bottom <= window.innerHeight);
    }));
    expect(labelsFit).toBe(true);
    if (expected.sourceWidthLabel) {
      const currentSrc = await frontPhone.locator("img").evaluate((image) => image.currentSrc);
      expect(currentSrc).toContain(`-${expected.sourceWidthLabel}.webp`);
    }
    await expectNoHorizontalOverflow(page);
  }
});
