import { expect, test } from "@playwright/test";

test("online query section is a static demo and does not call live services", async ({ page }, testInfo) => {
  const liveRequests: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("Citybus") || url.includes("DATA.GOV.HK") || url.includes("rt.data.gov.hk") || url.includes("ppsearch")) {
      liveRequests.push(url);
    }
  });

  await page.goto("/");
  await page.locator("#hero").getByRole("link", { name: /在線查詢|Online Query/ }).click();
  await expect(page.getByTestId("online-query-demo")).toBeVisible();
  await expect(page.getByLabel(/出發地|Origin/)).toHaveValue(/將軍澳站|Tseung Kwan O Station/);
  await expect(page.getByText("788")).toBeVisible();

  await page.getByRole("button", { name: /查詢|Search/ }).click();
  expect(liveRequests).toEqual([]);

  await page.screenshot({
    path: `../specs/001-homepage-v1/visual-review/${testInfo.project.name}-online-query.png`,
    fullPage: false,
  });
});
