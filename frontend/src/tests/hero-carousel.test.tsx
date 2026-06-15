import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppPreviewCarousel } from "../components/hero/AppPreviewCarousel";
import { LanguageSwitcher } from "../components/i18n/LanguageSwitcher";
import { I18nProvider } from "../components/i18n/I18nProvider";
import { carouselSlides } from "../content/carouselSlides";
import { render } from "@testing-library/react";

describe("AppPreviewCarousel", () => {
  it("contains four ordered slides with placeholder status until real Android screenshots are supplied", () => {
    expect(carouselSlides).toHaveLength(4);
    expect(carouselSlides.map((slide) => slide.order)).toEqual([1, 2, 3, 4]);
    expect(carouselSlides.every((slide) => slide.screenshotStatus === "placeholder")).toBe(true);
  });

  it("changes slides and keeps the selected slide after language switching", () => {
    render(
      <I18nProvider>
        <LanguageSwitcher label="Language" />
        <AppPreviewCarousel />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByLabelText("Next slide"));
    expect(screen.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "route-comparison");

    fireEvent.click(screen.getByTitle("English"));
    expect(screen.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "route-comparison");
    expect(screen.getByText("Compare fare, time, and walking distance")).toBeInTheDocument();
  });
});
