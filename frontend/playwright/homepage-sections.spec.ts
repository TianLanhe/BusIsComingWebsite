import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./helpers/homepageVisual";

test("the four-section story ends with one-open FAQ, contact, and a light footer", async ({ page }) => {
  await page.goto("/en/");
  const sections = ["features", "route-trial", "download", "faq", "contact"];
  const boxes = await Promise.all(sections.map((id) => page.locator(`#${id}`).boundingBox()));
  boxes.forEach((box) => expect(box).not.toBeNull());
  for (let index = 1; index < boxes.length; index += 1) expect(boxes[index]!.y).toBeGreaterThan(boxes[index - 1]!.y);

  const faq = page.locator("#faq");
  const installation = faq.getByRole("button", { name: /How do I install/ });
  const coverage = faq.getByRole("button", { name: /Which bus data/ });
  await expect(installation).toHaveAttribute("aria-expanded", "true");
  await coverage.click();
  await expect(installation).toHaveAttribute("aria-expanded", "false");
  await expect(coverage).toHaveAttribute("aria-expanded", "true");

  await expect(page.locator("#contact").getByRole("link", { name: /Contact us directly/ })).toHaveAttribute("href", "mailto:hezhenyu966@gmail.com");
  await expect(page.locator("footer").getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/en/privacy/");
  await expectNoHorizontalOverflow(page);
});
