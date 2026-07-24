import { expect, test } from "@playwright/test";
import { overviewEnvelope } from "./fixtures/analytics";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-07-23T00:30:00+08:00"));
  await page.addInitScript(() => localStorage.setItem("busiscoming.monitor.locale", "zh-Hans"));
});

test("keeps cancellation out of the query, applies a cross-year range once, and synchronizes both date controls", async ({ page }) => {
  let queryCount = 0;
  await page.addInitScript(() => {
    Object.defineProperty(HTMLInputElement.prototype, "showPicker", { configurable: true, value: undefined });
  });
  await page.route("**/api/analytics/overview?**", async (route) => {
    queryCount += 1;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(overviewEnvelope) });
  });
  await page.goto("/#overview");
  await expect(page.getByTestId("chart-point").first()).toBeVisible();
  const initialQueryCount = queryCount;

  const trigger = page.getByRole("button", { name: /日期范围/ });
  await trigger.click();
  await page.getByRole("button", { name: "自定义日期", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "日期范围" });
  await expect(dialog).toContainText("第 1 步：选择开始日期");
  await dialog.getByLabel("开始日期").fill("2026-07-24");
  await expect(page.getByRole("alert")).toContainText("开始日期不能晚于香港今天");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  expect(queryCount).toBe(initialQueryCount);

  await trigger.click();
  await page.getByRole("button", { name: "自定义日期", exact: true }).click();
  await dialog.getByLabel("开始日期").fill("2026-07-23");
  await dialog.getByLabel("结束日期").fill("2026-07-22");
  await expect(page.getByRole("alert")).toContainText("开始日期不能晚于结束日期");
  await page.mouse.click(300, 700);
  await expect(dialog).toBeHidden();
  expect(queryCount).toBe(initialQueryCount);

  await trigger.click();
  await page.getByRole("button", { name: "自定义日期", exact: true }).click();
  await dialog.getByLabel("开始日期").fill("2025-12-31");
  await dialog.getByLabel("结束日期").fill("2026-01-02");
  await expect(trigger).toHaveAccessibleName(/2025\/12\/31 – 2026\/01\/02/);
  await expect.poll(() => queryCount).toBe(initialQueryCount + 1);

  await page.locator(".global-filters summary").click();
  const advanced = page.locator(".global-filters");
  await expect(advanced.getByLabel("开始日期")).toHaveValue("2025-12-31");
  await expect(advanced.getByLabel("结束日期")).toHaveValue("2026-01-02");
});

test("uses visible inline date inputs after a persistent showPicker failure without opening a native calendar", async ({ page }, testInfo) => {
  let queryCount = 0;
  await page.addInitScript(() => {
    (window as Window & { pickerCalls?: number }).pickerCalls = 0;
    Object.defineProperty(HTMLInputElement.prototype, "showPicker", {
      configurable: true,
      value() {
        (window as Window & { pickerCalls?: number }).pickerCalls! += 1;
        throw new DOMException("blocked");
      },
    });
  });
  await page.route("**/api/analytics/overview?**", async (route) => {
    queryCount += 1;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(overviewEnvelope) });
  });
  await page.goto("/#overview");
  await expect(page.getByTestId("chart-point").first()).toBeVisible();
  const initialQueryCount = queryCount;

  const trigger = page.getByRole("button", { name: /日期范围/ });
  await trigger.click();
  await page.getByRole("button", { name: "自定义日期", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "日期范围" });
  const start = dialog.getByLabel("开始日期");
  const end = dialog.getByLabel("结束日期");
  await expect(start).toBeVisible();
  await expect(end).toBeVisible();
  await start.fill("2026-07-20");
  await page.getByRole("button", { name: "选择结束日期", exact: true }).click();
  expect(await page.evaluate(() => (window as Window & { pickerCalls?: number }).pickerCalls)).toBe(2);
  await end.fill("2026-07-23");
  await expect.poll(() => queryCount).toBe(initialQueryCount + 1);
  expect(await trigger.evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);

  await page.getByTestId("chart-point").first().focus();
  await expect(page.locator(".chart-tooltip, .chart-keyboard-tooltip")).toHaveCount(1);
  const target = testInfo.project.name.includes("desktop")
    ? "playwright-monitor/__screenshots__/time-range-desktop.png"
    : "playwright-monitor/__screenshots__/time-range-mobile.png";
  await page.screenshot({ path: target });
});
