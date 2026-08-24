import { expect, type Page } from "@playwright/test";

/**
 * 视觉基线只在字体、全部舞台图片和真实状态机都稳定后采集。
 * 这里不使用任意 sleep；持续风带由调用方添加 data-visual-paused 后交给 CSS 静止。
 */
export async function waitForHomepageVisual(page: Page) {
  await page.evaluate(async () => {
    document.documentElement.dataset.visualPaused = "true";
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    document.documentElement.style.scrollBehavior = "auto";
    document.body.style.scrollBehavior = "auto";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    // 浏览器可能为了让刚点击的底部故事按钮避开工具栏而滚动；等一个绘制周期后
    // 再归零，视觉基线只比较页面状态，不把浏览器自动聚焦滚动误记为设计变化。
    await new Promise<void>((resolve) => requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      resolve();
    }));
    await document.fonts.ready;
    const stage = document.querySelector<HTMLElement>("[data-testid='hero-story-stage']");
    const requestedId = stage?.dataset.requestedStoryId;
    const images = Array.from(document.querySelectorAll<HTMLImageElement>(
      requestedId ? `[data-testid='hero-story-stage'] [data-story-id='${requestedId}'] img` : "[data-testid='hero-story-stage'] img",
    ));
    await Promise.all(images.map((image) => image.complete ? image.decode().catch(() => undefined) : new Promise<void>((resolve) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => resolve(), { once: true });
    })));
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.getByTestId("hero-story-stage")).toHaveAttribute("data-transition-state", "settled");
  await expect.poll(() => page.getByTestId("hero-story-stage").evaluate((element) => (
    element.getAttribute("data-requested-story-id") === element.getAttribute("data-settled-story-id")
  ))).toBe(true);
}

export async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
}
