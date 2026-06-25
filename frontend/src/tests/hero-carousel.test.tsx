import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppPreviewCarousel } from "../components/hero/AppPreviewCarousel";
import { LanguageSwitcher } from "../components/i18n/LanguageSwitcher";
import { I18nProvider } from "../components/i18n/I18nProvider";
import { carouselSlides } from "../content/carouselSlides";

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

  it("auto-rotates the four feature items every three seconds without visible arrow controls", () => {
    render(
      <I18nProvider>
        <LanguageSwitcher label="Language" />
        <AppPreviewCarousel />
      </I18nProvider>,
    );

    expect(screen.queryByText("01")).not.toBeInTheDocument();
    expect(screen.queryByText("02")).not.toBeInTheDocument();
    expect(screen.queryByTestId("screenshot-stack-thumbnails")).not.toBeInTheDocument();
    expect(screen.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "favorite-citybus-routes");

    act(() => {
      vi.advanceTimersByTime(3_100);
    });

    expect(screen.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "route-comparison");

    act(() => {
      vi.advanceTimersByTime(6_100);
    });

    expect(screen.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "predeparture-monitor");
  });

  it("supports keyboard and screen-reader switching without persistent visual arrows", () => {
    render(
      <I18nProvider>
        <LanguageSwitcher label="Language" />
        <AppPreviewCarousel />
      </I18nProvider>,
    );

    const carousel = screen.getByTestId("feature-showcase");
    expect(screen.getByRole("button", { name: "Next feature" })).toHaveAttribute("data-testid", "carousel-next-feature");
    expect(screen.getByRole("button", { name: "Previous feature" })).toHaveAttribute("data-testid", "carousel-previous-feature");

    fireEvent.keyDown(carousel, { key: "ArrowRight" });
    expect(screen.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "route-comparison");

    fireEvent.keyDown(carousel, { key: "ArrowLeft" });
    expect(screen.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "favorite-citybus-routes");
  });

  it("lets users jump directly to a feature scene by clicking its pagination dot", () => {
    render(
      <I18nProvider>
        <LanguageSwitcher label="Language" />
        <AppPreviewCarousel />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Feature Multiple ETAs and route details" }));

    expect(screen.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "eta-details");
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
      vi.advanceTimersByTime(3_100);
    });
    expect(screen.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "route-comparison");

    fireEvent.click(screen.getByTitle("English"));
    expect(screen.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "route-comparison");
    expect(within(screen.getByTestId("active-slide")).getByText("Compare total fare, time, and walking distance")).toBeInTheDocument();
  });
});
