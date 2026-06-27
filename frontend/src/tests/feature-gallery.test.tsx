import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppPreviewCarousel } from "../components/hero/AppPreviewCarousel";
import { renderWithI18n } from "./test-utils";

function dragEvent(type: "pointerdown" | "pointerup", clientX: number) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clientX", { value: clientX });
  Object.defineProperty(event, "pointerId", { value: 1 });
  Object.defineProperty(event, "pointerType", { value: "touch" });
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

  it("uses screenshot drag for same-feature images and copy drag for feature scenes", () => {
    renderWithI18n(<AppPreviewCarousel />);

    fireEvent.click(screen.getByRole("button", { name: "Show same-scene screenshot 2" }));
    expect(screen.getByTestId("screenshot-rail")).toHaveAttribute("data-active-image-id", "home-all-routes-sheet");

    fireEvent(screen.getByTestId("screenshot-rail"), dragEvent("pointerdown", 120));
    fireEvent(screen.getByTestId("screenshot-rail"), dragEvent("pointerup", 260));
    expect(screen.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "favorite-citybus-routes");
    expect(screen.getByTestId("screenshot-rail")).toHaveAttribute("data-active-image-id", "home-favorites-results");

    fireEvent(screen.getByTestId("active-slide"), dragEvent("pointerdown", 240));
    fireEvent(screen.getByTestId("active-slide"), dragEvent("pointerup", 120));
    expect(screen.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "route-comparison");
    expect(screen.getByTestId("screenshot-rail")).toHaveAttribute("data-active-image-id", "home-favorites-results");

    fireEvent.keyDown(screen.getByTestId("feature-showcase"), { key: "ArrowLeft" });
    expect(screen.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "favorite-citybus-routes");
    expect(screen.getByTestId("screenshot-rail")).toHaveAttribute("data-active-image-id", "home-favorites-results");
  });

  it("opens a same-feature lightbox with zoom controls and closes back to the current image", () => {
    renderWithI18n(<AppPreviewCarousel />);

    fireEvent.click(screen.getByTestId("screenshot-deck-main"));
    const dialog = screen.getByRole("dialog", { name: "View app screenshot" });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByTestId("lightbox-image")).toHaveAttribute("data-image-id", "home-favorites-results");

    fireEvent.click(within(dialog).getByRole("button", { name: "Zoom in" }));
    expect(screen.getByTestId("lightbox-image")).toHaveAttribute("data-zoom", "1.25");

    fireEvent.click(within(dialog).getByRole("button", { name: "Next screenshot in this feature" }));
    expect(screen.getByTestId("lightbox-image")).toHaveAttribute("data-image-id", "home-all-routes-sheet");
    expect(screen.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "favorite-citybus-routes");

    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "View app screenshot" })).not.toBeInTheDocument();
    expect(screen.getByTestId("screenshot-rail")).toHaveAttribute("data-active-image-id", "home-all-routes-sheet");
  });

  it("does not show same-feature lightbox switching controls for a single-image feature", () => {
    renderWithI18n(<AppPreviewCarousel initialFeatureId="route-comparison" />);

    fireEvent.click(screen.getByTestId("screenshot-deck-main"));
    const dialog = screen.getByRole("dialog", { name: "View app screenshot" });

    expect(within(dialog).queryByRole("button", { name: "Next screenshot in this feature" })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Previous screenshot in this feature" })).not.toBeInTheDocument();
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
