import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppPreviewCarousel } from "../components/hero/AppPreviewCarousel";
import { renderWithI18n } from "./test-utils";

describe("feature screenshot gallery", () => {
  it("shows the default image first and lets the user manually promote a stacked image", () => {
    renderWithI18n(<AppPreviewCarousel />);

    expect(screen.getByTestId("screenshot-stack")).toHaveAttribute("data-active-image-id", "favorite-citybus-routes-1");

    fireEvent.click(screen.getByRole("button", { name: /Show saved Citybus route setup 2/ }));

    expect(screen.getByTestId("screenshot-stack")).toHaveAttribute("data-active-image-id", "favorite-citybus-routes-2");
  });

  it("hides stack controls when the active feature has a single screenshot", () => {
    renderWithI18n(<AppPreviewCarousel initialFeatureId="route-comparison" />);

    expect(screen.getByTestId("screenshot-stack")).toHaveAttribute("data-active-image-id", "route-comparison-1");
    expect(screen.queryByTestId("screenshot-stack-thumbnails")).not.toBeInTheDocument();
  });
});
