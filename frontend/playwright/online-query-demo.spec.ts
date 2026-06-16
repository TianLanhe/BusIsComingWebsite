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
  await expect(page.getByLabel(/出發地|Origin/)).toHaveValue(/已脫敏起點|Sanitized origin/);
  await expect(page.getByTestId("online-query-demo").getByText("Citybus A")).toBeVisible();

  await page.getByRole("button", { name: /查詢|Search/ }).click();
  expect(liveRequests).toEqual([]);

  await page.screenshot({
    path: `../specs/003-homepage-ui-optimization/visual-review/${testInfo.project.name}-online-query-v2.png`,
    fullPage: false,
  });
});
