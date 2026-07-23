import { expect, test } from "@playwright/test";
import { detailEnvelopes } from "./fixtures/details";
import { overviewEnvelope } from "./fixtures/analytics";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("busiscoming.monitor.locale", "zh-Hans"));
  await page.route("**/api/analytics/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const body = pathname.endsWith("/overview") ? overviewEnvelope : detailEnvelopes[pathname as keyof typeof detailEnvelopes];
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
});

test("investigates an overview anomaly through event and visitor timeline", async ({ page }, testInfo) => {
  await page.goto("/#overview");
  if (testInfo.project.name.includes("mobile")) {
    await expect(page.locator(".traffic-chart")).toBeVisible();
    const layout = await page.evaluate(() => {
      const nav = document.querySelector<HTMLElement>(".mobile-bottom-nav");
      if (!nav) return null;
      return {
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        navWidth: nav.getBoundingClientRect().width,
      };
    });
    expect(layout).not.toBeNull();
    expect(layout?.documentWidth).toBe(layout?.viewportWidth);
    expect(layout?.navWidth).toBeLessThanOrEqual((layout?.viewportWidth ?? 0) - 24);
  }
  const eventLink = testInfo.project.name.includes("desktop")
    ? page.getByTestId("desktop-sidebar").getByRole("link", { name: "事件明细" })
    : page.getByTestId("mobile-bottom-nav").getByRole("link", { name: "事件明细" });
  await eventLink.click();
  await expect(page.getByRole("heading", { name: "事件明细" })).toBeVisible();
  const visibleEvent = testInfo.project.name.includes("desktop")
    ? page.locator(".event-table-wrap")
    : page.locator(".responsive-event-card");
  await expect(visibleEvent.getByText("abcdef…stuv").first()).toBeVisible();
  await visibleEvent.getByRole("button", { name: "查看访客" }).first().click();
  await expect(page.getByRole("heading", { name: "匿名访客" })).toBeVisible();
  await expect(page.getByText("会话 1")).toBeVisible();
  await page.getByRole("button", { name: "复制完整 ID" }).click();
  await expect(page.getByText("已复制完整匿名 ID")).toBeVisible();
  const path = testInfo.project.name.includes("desktop") ? "playwright-monitor/__screenshots__/investigation-desktop.png" : "playwright-monitor/__screenshots__/investigation-mobile.png";
  await page.screenshot({ path, fullPage: testInfo.project.name.includes("desktop") });
});
