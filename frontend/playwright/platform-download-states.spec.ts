import { expect, test } from "@playwright/test";

test("iPhone state never triggers an APK download", async ({ page }) => {
  await page.goto("/en/");

  await expect(page.locator("#hero").getByText(/iPhone 暫未支援|iPhone is not supported yet/)).toBeVisible();
  await expect(page.locator("#hero").getByRole("button", { name: /iPhone/ })).toHaveCount(0);
});

test("download state survives language switching", async ({ page }) => {
  await page.goto("/en/");

  await page.getByTitle("English").click();
  await expect(page.locator("#download").getByText(/^Version .+ · .+ MB$/)).toBeVisible();

  await page.getByTitle("简体中文").click();
  await expect(page.locator("#download").getByText(/^版本 .+ · .+ MB$/)).toBeVisible();

  await page.getByTitle("繁體中文").click();
  await expect(page.locator("#download").getByText(/^版本 .+ · .+ MB$/)).toBeVisible();
});

test("metadata unavailable disables both Android entries without an APK request", async ({ page }) => {
  let apkRequestCount = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/downloads/android/latest") {
      apkRequestCount += 1;
    }
  });
  await page.route("**/api/downloads/android/latest/metadata", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ code: "APK_METADATA_INVALID" }),
    });
  });

  await page.goto("/en/");
  for (const sectionId of ["hero", "download"]) {
    const entry = page.locator(`#${sectionId}`).getByRole("button", { name: "Android APK is temporarily unavailable" });
    await expect(entry).toBeDisabled();
    await expect(entry).toHaveAttribute("aria-disabled", "true");
    await expect(entry).not.toHaveAttribute("href", /.+/);
    await expect(page.locator(`#${sectionId}`).getByRole("link", { name: /Download Android APK/ })).toHaveCount(0);
  }
  await expect(page.locator("a[href^='blob:']")).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveCount(0);
  expect(apkRequestCount).toBe(0);
});
