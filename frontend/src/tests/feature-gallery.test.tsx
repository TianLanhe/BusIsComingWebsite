import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppPreviewCarousel } from "../components/hero/AppPreviewCarousel";
import { renderWithI18n } from "./test-utils";

function dragEvent(type: "pointerdown" | "pointerup", clientX: number) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clientX", { value: clientX });
  Object.defineProperty(event, "pointerId", { value: 1 });
  return event;
}

describe("feature screenshot gallery", () => {
  it("shows the default deck image first and lets the user click a same-scene card into the main image", () => {
    renderWithI18n(<AppPreviewCarousel />);

    expect(screen.getByTestId("screenshot-rail")).toHaveAttribute("data-active-image-id", "home-favorites-results");
    expect(screen.getByTestId("screenshot-rail")).toHaveAttribute("data-visual-mode", "stair-card-deck");
    expect(screen.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "favorite-citybus-routes");
    expect(screen.getAllByTestId("screenshot-deck-card")).toHaveLength(1);
    expect(screen.queryByTestId("screenshot-stack-thumbnails")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show same-scene screenshot 2" }));

    expect(screen.getByTestId("screenshot-rail")).toHaveAttribute("data-active-image-id", "home-all-routes-sheet");
    expect(screen.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "favorite-citybus-routes");
  });

  it("uses drag and swipe for scene changes only while preserving each scene image choice", () => {
    renderWithI18n(<AppPreviewCarousel />);

    fireEvent.click(screen.getByRole("button", { name: "Show same-scene screenshot 2" }));
    expect(screen.getByTestId("screenshot-rail")).toHaveAttribute("data-active-image-id", "home-all-routes-sheet");

    fireEvent(screen.getByTestId("feature-showcase"), dragEvent("pointerdown", 240));
    fireEvent(screen.getByTestId("feature-showcase"), dragEvent("pointerup", 120));
    expect(screen.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "route-comparison");
    expect(screen.getByTestId("screenshot-rail")).toHaveAttribute("data-active-image-id", "home-favorites-results");

    fireEvent.keyDown(screen.getByTestId("feature-showcase"), { key: "ArrowLeft" });
    expect(screen.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "favorite-citybus-routes");
    expect(screen.getByTestId("screenshot-rail")).toHaveAttribute("data-active-image-id", "home-all-routes-sheet");
  });

  it("hides back deck cards and stack controls when the active feature has a single screenshot", () => {
    renderWithI18n(<AppPreviewCarousel initialFeatureId="route-comparison" />);

    expect(screen.getByTestId("screenshot-rail")).toHaveAttribute("data-active-image-id", "home-favorites-results");
    expect(screen.queryByTestId("screenshot-deck-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("screenshot-stack-thumbnails")).not.toBeInTheDocument();
  });

  it("keeps the user-confirmed image mapping for detail and monitor scenes", () => {
    renderWithI18n(<AppPreviewCarousel initialFeatureId="eta-details" />);

    expect(screen.getByTestId("screenshot-rail")).toHaveAttribute("data-active-image-id", "route-detail-expanded");
    expect(screen.getAllByTestId("screenshot-deck-card")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Show same-scene screenshot 2" }));
    expect(screen.getByTestId("screenshot-rail")).toHaveAttribute("data-active-image-id", "eta-arrivals-sheet");

    renderWithI18n(<AppPreviewCarousel initialFeatureId="predeparture-monitor" />);
    const rails = screen.getAllByTestId("screenshot-rail");
    expect(rails[1]).toHaveAttribute("data-active-image-id", "lockscreen-monitor");
  });
});
