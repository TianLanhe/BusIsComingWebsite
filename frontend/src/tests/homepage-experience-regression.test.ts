import { describe, expect, it } from "vitest";
import { carouselSlides } from "../content/carouselSlides";
import { homepageContent } from "../content/homepageContent";
import { uiCopy } from "../content/uiCopy";

describe("homepage experience polish regression guards", () => {
  it("removes old support and thumbnail carousel signals from user-facing content", () => {
    const content = JSON.stringify({ homepageContent, uiCopy });
    const carouselVisibleCopy = carouselSlides
      .flatMap((slide) => [
        ...Object.values(slide.title),
        ...Object.values(slide.description),
        ...slide.gallery.images.flatMap((image) => Object.values(image.alt)),
      ])
      .join(" ");

    expect(content).not.toContain("feedback@busiscoming.local");
    expect(content).not.toContain("支援我們");
    expect(content).not.toContain("支持我们");
    expect(content).not.toContain('"Support"');
    expect(carouselVisibleCopy).not.toMatch(/\b0[1-4]\b/);
    expect(homepageContent.homepageExperience.carousel.usesThumbnailStack).toBe(false);
    expect(homepageContent.homepageExperience.carousel.usesPersistentArrows).toBe(false);
  });
});
