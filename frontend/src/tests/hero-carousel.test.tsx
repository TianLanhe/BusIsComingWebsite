import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppPreviewCarousel } from "../components/hero/AppPreviewCarousel";
import { LanguageSwitcher } from "../components/i18n/LanguageSwitcher";
import { I18nProvider } from "../components/i18n/I18nProvider";
import { carouselSlides } from "../content/carouselSlides";
import { render } from "@testing-library/react";

describe("AppPreviewCarousel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("contains four ordered feature showcase items backed by approved screenshot galleries", () => {
    expect(carouselSlides).toHaveLength(4);
    expect(carouselSlides.map((slide) => slide.order)).toEqual([1, 2, 3, 4]);
    expect(carouselSlides.map((slide) => slide.id)).toEqual([
      "favorite-citybus-routes",
      "route-comparison",
      "eta-details",
      "predeparture-monitor",
    ]);
    expect(carouselSlides.every((slide) => slide.gallery.manualOnly)).toBe(true);
    expect(carouselSlides.every((slide) => slide.gallery.images.every((image) => image.desensitizationStatus === "approved"))).toBe(true);
  });

  it("auto-rotates the four feature items without left or right arrow buttons", () => {
    render(
      <I18nProvider>
        <LanguageSwitcher label="Language" />
        <AppPreviewCarousel />
      </I18nProvider>,
    );

    expect(screen.queryByLabelText("Next slide")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Previous slide")).not.toBeInTheDocument();
    expect(screen.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "favorite-citybus-routes");

    act(() => {
      vi.advanceTimersByTime(4_600);
    });

    expect(screen.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "route-comparison");
  });

  it("pauses automatic feature rotation during user interaction and keeps state after language switching", () => {
    render(
      <I18nProvider>
        <LanguageSwitcher label="Language" />
        <AppPreviewCarousel />
      </I18nProvider>,
    );

    fireEvent.pointerEnter(screen.getByTestId("feature-showcase"));

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(screen.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "favorite-citybus-routes");

    fireEvent.pointerLeave(screen.getByTestId("feature-showcase"));
    act(() => {
      vi.advanceTimersByTime(4_600);
    });
    expect(screen.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "route-comparison");

    fireEvent.click(screen.getByTitle("English"));
    expect(screen.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "route-comparison");
    expect(screen.getByText("Compare total fare, time, and walking distance")).toBeInTheDocument();
  });
});
