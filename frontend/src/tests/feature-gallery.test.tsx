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
  it("shows the default image first and lets the user drag to the adjacent rail image", () => {
    renderWithI18n(<AppPreviewCarousel />);

    expect(screen.getByTestId("screenshot-rail")).toHaveAttribute("data-active-image-id", "favorite-citybus-routes-1");
    expect(screen.getByTestId("screenshot-rail")).toHaveAttribute("data-visual-mode", "cinematic-phone-rail");
    expect(screen.getAllByTestId("screenshot-rail-preview")).toHaveLength(1);
    expect(screen.queryByTestId("screenshot-stack-thumbnails")).not.toBeInTheDocument();

    fireEvent(screen.getByTestId("feature-showcase"), dragEvent("pointerdown", 240));
    fireEvent(screen.getByTestId("feature-showcase"), dragEvent("pointerup", 120));

    expect(screen.getByTestId("screenshot-rail")).toHaveAttribute("data-active-image-id", "favorite-citybus-routes-2");
  });

  it("hides adjacent rail previews and stack controls when the active feature has a single screenshot", () => {
    renderWithI18n(<AppPreviewCarousel initialFeatureId="route-comparison" />);

    expect(screen.getByTestId("screenshot-rail")).toHaveAttribute("data-active-image-id", "route-comparison-1");
    expect(screen.queryByTestId("screenshot-rail-preview")).not.toBeInTheDocument();
    expect(screen.queryByTestId("screenshot-stack-thumbnails")).not.toBeInTheDocument();
  });
});
