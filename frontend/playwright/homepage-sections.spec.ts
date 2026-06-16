import { expect, test } from "@playwright/test";

test("downstream sections appear in the confirmed order with required scope information", async ({ page }, testInfo) => {
  await page.goto("/");

  const features = page.locator("#features");
  const online = page.locator("#online-query");
  const download = page.locator("#download");
  const faq = page.locator("#faq");
  const contact = page.locator("#contact");

  await expect(features).toBeVisible();
  await expect(online).toBeVisible();
  await expect(download).toBeVisible();
  await expect(faq).toBeVisible();
  await expect(contact).toBeVisible();

  const boxes = await Promise.all([features, online, download, faq, contact].map((locator) => locator.boundingBox()));
  expect(boxes.every(Boolean)).toBe(true);
  expect(boxes[0]!.y).toBeLessThan(boxes[1]!.y);
  expect(boxes[1]!.y).toBeLessThan(boxes[2]!.y);
  expect(boxes[2]!.y).toBeLessThan(boxes[3]!.y);
  expect(boxes[3]!.y).toBeLessThan(boxes[4]!.y);

  await expect(online.getByText(/完整出行規劃|full trip planning/)).toBeVisible();
  await expect(online.getByText(/九巴、港鐵、鐵路或渡輪|KMB, MTR, rail, or ferry/)).toBeVisible();

  await page.screenshot({
    path: `../specs/003-homepage-ui-optimization/visual-review/${testInfo.project.name}-sections-v2.png`,
    fullPage: true,
  });
});
