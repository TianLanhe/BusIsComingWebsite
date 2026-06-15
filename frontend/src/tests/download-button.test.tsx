import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DownloadSegmentedButton } from "../components/download/DownloadSegmentedButton";
import { renderWithI18n } from "./test-utils";

describe("DownloadSegmentedButton", () => {
  it("shows Android and iPhone in the default segmented state", () => {
    renderWithI18n(<DownloadSegmentedButton />);

    expect(screen.getByText("Android")).toBeInTheDocument();
    expect(screen.getByText("iPhone")).toBeInTheDocument();
    expect(screen.getByTestId("download-segmented-button")).toHaveAttribute("data-state", "default");
  });

  it("expands Android and shows the current download resource fallback", () => {
    renderWithI18n(<DownloadSegmentedButton />);

    fireEvent.mouseEnter(screen.getByText("Android"));

    expect(screen.getByTestId("download-segmented-button")).toHaveAttribute("data-state", "android-expanded");
    expect(screen.getByText("Android APK")).toBeInTheDocument();
    expect(screen.getByText(/No publishable APK is available/)).toBeInTheDocument();
  });

  it("expands iPhone without triggering a download state", () => {
    renderWithI18n(<DownloadSegmentedButton />);

    fireEvent.mouseEnter(screen.getByText("iPhone"));
    fireEvent.click(screen.getByTestId("download-expanded"));

    expect(screen.getByTestId("download-segmented-button")).toHaveAttribute("data-state", "iphone-expanded");
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
    expect(screen.getByText("iPhone is not supported yet.")).toBeInTheDocument();
  });
});
