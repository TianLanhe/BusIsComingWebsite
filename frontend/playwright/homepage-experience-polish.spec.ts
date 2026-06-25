import { expect, test, type Page } from "@playwright/test";

async function clickExposedBackCard(page: Page, imageId: string) {
  await page.locator(`button[data-image-id="${imageId}"]`).click();
}

test("captures homepage experience polish visual evidence", async ({ page }, testInfo) => {
  await page.goto("/");

  const projectName = testInfo.project.name;
  const isMobile = projectName.includes("mobile");
  await expect(page.getByTestId("feature-showcase")).toBeVisible();
  await expect(page.getByTestId("screenshot-stack-thumbnails")).toHaveCount(0);
  await expect(page.getByText(/01|02|03|04/)).toHaveCount(0);
  await expect(page.getByTestId("screenshot-rail")).toHaveAttribute("data-visual-mode", "stair-card-deck");
  await clickExposedBackCard(page, "home-all-routes-sheet");
  await expect(page.getByTestId("screenshot-rail")).toHaveAttribute("data-active-image-id", "home-all-routes-sheet");

  const mainBox = await page.getByTestId("screenshot-deck-main").boundingBox();
  const backBoxes = await page.getByTestId("screenshot-deck-card").evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { bottom: rect.bottom };
    }),
  );
  expect(mainBox).not.toBeNull();
  for (const backBox of backBoxes) {
    expect(backBox.bottom).toBeLessThanOrEqual(mainBox!.y + mainBox!.height + 2);
  }

  await expect(page.locator("header img").first()).toHaveAttribute("src", /busiscoming-logo-foreground/);
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    document.body.style.scrollBehavior = "auto";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

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
