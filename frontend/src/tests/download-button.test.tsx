import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DownloadSegmentedButton } from "../components/download/DownloadSegmentedButton";
import { renderWithI18n } from "./test-utils";

describe("DownloadSegmentedButton", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:busiscoming-apk"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  it("shows Android and iPhone in the default segmented state", () => {
    renderWithI18n(<DownloadSegmentedButton />);

    expect(screen.getByText("Android")).toBeInTheDocument();
    expect(screen.getByText("iPhone")).toBeInTheDocument();
    expect(screen.getByTestId("download-segmented-button")).toHaveAttribute("data-state", "default");
  });

  it("expands Android and shows current APK metadata", async () => {
    renderWithI18n(<DownloadSegmentedButton />);

    fireEvent.mouseEnter(screen.getByText("Android"));

    await waitFor(() => {
      expect(screen.getByTestId("download-segmented-button")).toHaveAttribute("data-state", "android-expanded");
    });
    expect(screen.getByText("Download Android APK")).toBeInTheDocument();
    expect(screen.getByText(/APK 1.0 available/)).toBeInTheDocument();
    expect(screen.getByText(/About 4.8 MB/)).toBeInTheDocument();
  });

  it("downloads Android through the backend endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Blob(["apk"]), {
        status: 200,
        headers: { "Content-Type": "application/vnd.android.package-archive" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderWithI18n(<DownloadSegmentedButton />);

    fireEvent.click(screen.getByText("Android"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/downloads/android/latest", { cache: "no-store" });
    });
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
  });

  it("shows a failure state when Android download fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 500 })));

    renderWithI18n(<DownloadSegmentedButton />);

    fireEvent.click(screen.getByText("Android"));

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("Download is unavailable or failed verification. Please try again later.");
    expect(screen.getByTestId("download-segmented-button")).toHaveAttribute("data-download-status", "failed");
  });

  it("expands iPhone without triggering a download", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderWithI18n(<DownloadSegmentedButton />);

    fireEvent.focus(screen.getByText("iPhone"));

    await waitFor(() => {
      expect(screen.getByTestId("download-segmented-button")).toHaveAttribute("data-state", "iphone-expanded");
    });
    fireEvent.click(screen.getByTestId("download-expanded"));

    expect(screen.getByTestId("download-segmented-button")).toHaveAttribute("data-state", "iphone-expanded");
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
    expect(screen.getByText("iPhone is not supported yet.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
