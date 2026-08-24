import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./helpers/homepageVisual";

test("language links, stories, FAQ, and primary actions remain keyboard and touch reachable", async ({ page }) => {
  await page.goto("/en/");
  const targets = page.locator("#features a, #features button, #faq button, #contact a, footer a");
  const targetCount = await targets.count();
  for (let index = 0; index < targetCount; index += 1) {
    const target = targets.nth(index);
    if (!(await target.isVisible())) continue;
    const box = await target.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  await page.locator('[role="group"] button[data-story-id="saved-journeys"]').focus();
  await page.keyboard.press("End");
  await expect(page.locator('[role="group"] button[data-story-id="predeparture-monitor"]')).toBeFocused();
  await page.locator("#faq").getByRole("button", { name: /Which bus data/ }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#faq").getByRole("button", { name: /Which bus data/ })).toHaveAttribute("aria-expanded", "true");
  await expectNoHorizontalOverflow(page);
});

test("reduced motion stops the continuous wind field", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en/");
  const animationNames = await page.locator('[data-intensity="hero"] span').evaluateAll((nodes) =>
    nodes.map((node) => getComputedStyle(node).animationName),
  );
  expect(animationNames.every((name) => name === "none")).toBe(true);
});
