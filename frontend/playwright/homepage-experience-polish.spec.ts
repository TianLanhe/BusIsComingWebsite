import { expect, test } from "@playwright/test";

test("captures homepage experience polish visual evidence", async ({ page }, testInfo) => {
  await page.goto("/");

  const projectName = testInfo.project.name;
  const isMobile = projectName.includes("mobile");
  await expect(page.getByTestId("feature-showcase")).toBeVisible();
  await expect(page.getByTestId("screenshot-stack-thumbnails")).toHaveCount(0);
  await expect(page.getByText(/01|02|03|04/)).toHaveCount(0);
  await expect(page.locator("header img").first()).toHaveAttribute("src", /busiscoming-logo-foreground/);

  await page.screenshot({
    path: `../specs/005-homepage-experience-polish/visual-review/${isMobile ? "mobile-390" : "desktop-1440"}-carousel-rail.png`,
    fullPage: false,
  });

  await page.locator("#contact").scrollIntoViewIfNeeded();
  await expect(page.getByRole("link", { name: /hezhenyu966@gmail.com/ })).toBeVisible();
  await page.screenshot({
    path: `../specs/005-homepage-experience-polish/visual-review/${isMobile ? "mobile-390" : "desktop-1440"}-brand-contact.png`,
    fullPage: true,
  });
});
