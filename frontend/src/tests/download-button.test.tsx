import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DownloadSegmentedButton } from "../components/download/DownloadSegmentedButton";
import { HeroIntro } from "../components/hero/HeroIntro";
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

  it("renders the hero primary action as a direct Android APK download", () => {
    renderWithI18n(<HeroIntro />);

    const heroDownload = screen.getByRole("link", { name: /Download Android APK/ });
    expect(heroDownload).toHaveAttribute("href", "/api/downloads/android/latest");
    expect(heroDownload).toHaveAttribute("download", "BusIsComing.apk");
    expect(heroDownload).not.toHaveAttribute("href", "#download");
    expect(screen.getByText(/Android APK 1.0/)).toBeInTheDocument();
    expect(screen.getByText(/iPhone is not supported yet/)).toBeInTheDocument();
  });

  it("renders a simple Android download entry instead of a platform segmented control", () => {
    renderWithI18n(<DownloadSegmentedButton />);

    expect(screen.getByTestId("download-segmented-button")).toHaveAttribute("data-state", "android-ready");
    expect(screen.getByRole("button", { name: /Download Android APK/ })).toBeInTheDocument();
    expect(screen.getByText(/About 4.8 MB/)).toBeInTheDocument();
    expect(screen.getByText(/iPhone is not supported yet/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^iPhone$/ })).not.toBeInTheDocument();
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

    fireEvent.click(screen.getByRole("button", { name: /Download Android APK/ }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/downloads/android/latest", { cache: "no-store" });
    });
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
  });

  it("shows a failure state when Android download fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 500 })));

    renderWithI18n(<DownloadSegmentedButton />);

    fireEvent.click(screen.getByRole("button", { name: /Download Android APK/ }));

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("Download is unavailable or failed verification. Please try again later.");
    expect(screen.getByTestId("download-segmented-button")).toHaveAttribute("data-download-status", "failed");
  });

  it("keeps the iPhone status informational and never triggers a download", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderWithI18n(<DownloadSegmentedButton />);

    expect(screen.getByText("iPhone is not supported yet.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /iPhone/ })).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
