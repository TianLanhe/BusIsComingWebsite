import { fireEvent, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DownloadMetadataProvider,
  resetDownloadMetadataForTests,
} from "../components/download/DownloadMetadataProvider";
import { HeroIntro } from "../components/hero/HeroIntro";
import { DownloadSection } from "../components/sections/DownloadSection";
import { renderWithI18n } from "./test-utils";

const readyMetadata = {
  platform: "android" as const,
  status: "available" as const,
  versionName: "1.2",
  versionCode: 11,
  fileName: "BusIsComing-v1.2.apk",
  sizeBytes: 5_937_523,
  lastUpdated: "2026-07-30",
  downloadUrl: "/api/downloads/android/latest" as const,
};

function renderDownloadEntries(locale: "zh-Hant" | "zh-Hans" | "en" = "en") {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(readyMetadata), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  }));
  vi.stubGlobal("fetch", fetchMock);

  renderWithI18n(
    <DownloadMetadataProvider>
      <section id="hero"><HeroIntro /></section>
      <DownloadSection />
    </DownloadMetadataProvider>,
    { locale },
  );

  return fetchMock;
}

describe("homepage Android download entries", () => {
  beforeEach(() => {
    resetDownloadMetadataForTests();
    vi.restoreAllMocks();
  });

  it("uses the checked metadata for the Hero native download link", async () => {
    const fetchMock = renderDownloadEntries();

    const heroDownload = await within(document.querySelector("#hero")!).findByRole("link", { name: /Download Android APK/ });
    expect(heroDownload).toHaveAttribute("href", "/api/downloads/android/latest");
    expect(heroDownload).toHaveAttribute("download", "BusIsComing-v1.2.apk");

    heroDownload.addEventListener("click", (event) => event.preventDefault(), { once: true });
    fireEvent.click(heroDownload);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls.map(([input]) => input)).not.toContain("/api/downloads/android/latest");
  });

  it("uses the checked metadata for the Download Section native download link", async () => {
    const fetchMock = renderDownloadEntries();

    const sectionEntry = screen.getByTestId("download-segmented-button");
    const sectionDownload = await within(sectionEntry).findByRole("link", { name: /Download Android APK/ });
    expect(sectionDownload).toHaveAttribute("href", "/api/downloads/android/latest");
    expect(sectionDownload).toHaveAttribute("download", "BusIsComing-v1.2.apk");
    expect(within(document.querySelector("#download") as HTMLElement).getByText("iPhone is not supported yet. Use the Android APK for now.")).toBeInTheDocument();

    sectionDownload?.addEventListener("click", (event) => event.preventDefault(), { once: true });
    fireEvent.click(sectionDownload!);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls.map(([input]) => input)).not.toContain("/api/downloads/android/latest");
  });

  it.each([
    ["zh-Hant", "下載 Android APK", "iPhone 暫未支援", "iPhone 暫未支援，現階段請先使用 Android 版本。"],
    ["zh-Hans", "下载 Android APK", "iPhone 暂未支持", "iPhone 暂未支持，现阶段请先使用 Android 版本。"],
    ["en", "Download Android APK", "iPhone is not supported yet", "iPhone is not supported yet. Use the Android APK for now."],
  ] as const)("keeps the %s Hero and Download Section iPhone statuses read-only", async (locale, actionName, heroIPhoneStatus, downloadIPhoneStatus) => {
    renderDownloadEntries(locale);

    const hero = document.querySelector("#hero") as HTMLElement;
    const download = document.querySelector("#download") as HTMLElement;
    const heroDownload = await within(hero).findByRole("link", { name: actionName });
    const sectionEntry = screen.getByTestId("download-segmented-button");
    const sectionDownload = await within(sectionEntry).findByRole("link", { name: actionName });
    expect(within(hero).getByText(heroIPhoneStatus)).toBeInTheDocument();
    expect(within(download).getByText(downloadIPhoneStatus)).toBeInTheDocument();
    expect(within(hero).queryByRole("link", { name: /iPhone/i })).not.toBeInTheDocument();
    expect(within(hero).queryByRole("button", { name: /iPhone/i })).not.toBeInTheDocument();
    expect(within(download).queryByRole("link", { name: /iPhone/i })).not.toBeInTheDocument();
    expect(within(download).queryByRole("button", { name: /iPhone/i })).not.toBeInTheDocument();

    expect(within(heroDownload).getByText(/Version|版本/)).toBeInTheDocument();
    expect(within(sectionDownload).getByText(/Version|版本/)).toBeInTheDocument();
  });
});
