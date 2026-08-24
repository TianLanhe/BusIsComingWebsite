import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DownloadMetadataProvider, resetDownloadMetadataForTests } from "../components/download/DownloadMetadataProvider";
import { HeroSection } from "../components/hero/HeroSection";
import { DownloadSection } from "../components/sections/DownloadSection";
import { renderWithI18n } from "./test-utils";

const readyMetadata = {
  platform: "android" as const,
  status: "available" as const,
  versionName: "1.3.1",
  versionCode: 19,
  fileName: "BusIsComing-v1.3.1.apk",
  sizeBytes: 2_621_440,
  lastUpdated: "2026-08-21",
  downloadUrl: "/api/downloads/android/latest" as const,
};

describe("homepage download entries", () => {
  beforeEach(() => {
    resetDownloadMetadataForTests();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("routes the desktop Hero action to the download section without exposing an APK download", async () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(readyMetadata), { status: 200, headers: { "Content-Type": "application/json" } })));
    renderWithI18n(<DownloadMetadataProvider><HeroSection /></DownloadMetadataProvider>, { locale: "en" });
    const action = await screen.findByRole("link", { name: "Download Android App" });
    expect(action).toHaveAttribute("href", "#download");
    expect(action).not.toHaveAttribute("download");
  });

  it("shares one verified metadata request across Hero and Download", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(readyMetadata), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    renderWithI18n(<DownloadMetadataProvider><HeroSection /><DownloadSection /></DownloadMetadataProvider>, { locale: "en" });
    const hero = within(document.querySelector("#features") as HTMLElement);
    const download = within(document.querySelector("#download") as HTMLElement);
    expect(await hero.findByRole("link", { name: /Download (?:Android )?App/ })).toHaveAttribute("download", "BusIsComing-v1.3.1.apk");
    expect(await download.findByRole("link", { name: "Download BusIsComing" })).toHaveAttribute("href", "/api/downloads/android/latest");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps the route-trial CTA beside the primary Hero action", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(readyMetadata), { status: 200, headers: { "Content-Type": "application/json" } })));
    renderWithI18n(<DownloadMetadataProvider><HeroSection /></DownloadMetadataProvider>, { locale: "zh-Hant" });
    expect(await screen.findByRole("link", { name: "下載 Android App" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "路線試查 →" })).toHaveAttribute("href", "#route-trial");
  });
});
