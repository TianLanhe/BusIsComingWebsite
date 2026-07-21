import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../app/App";
import { resetDownloadMetadataForTests } from "../components/download/DownloadMetadataProvider";
import { I18nProvider } from "../components/i18n/I18nProvider";
import { downloadManifest } from "../content/downloadManifest";
import { homepageContent } from "../content/homepageContent";

const readyMetadata = {
  platform: "android" as const,
  status: "available" as const,
  versionName: "1.0",
  versionCode: 1,
  fileName: "BusIsComing.apk",
  sizeBytes: 5_563_930,
  lastUpdated: "2026-07-07",
  downloadUrl: "/api/downloads/android/latest" as const,
};

function renderApp(pathname = "/en/") {
  window.history.replaceState({}, "", pathname);
  return render(<React.StrictMode><I18nProvider><App /></I18nProvider></React.StrictMode>);
}

describe("homepage APK metadata", () => {
  beforeEach(() => {
    resetDownloadMetadataForTests();
    vi.restoreAllMocks();
  });

  afterEach(() => cleanup());

  it("requests once in StrictMode, shares the result, and does not refetch after a language switch", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(readyMetadata), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    renderApp();

    expect(await screen.findAllByText(/Android APK 1\.0 · 5\.3 MB/)).not.toHaveLength(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/downloads/android/latest/metadata", expect.objectContaining({
      cache: "no-store",
      headers: expect.objectContaining({
        Accept: "application/json",
        "X-BusIsComing-Home-Locale": "en",
        "X-BusIsComing-Traffic-Source": expect.any(String),
      }),
    }));

    fireEvent.click(screen.getByTitle("简体中文"));
    expect(await screen.findAllByText(/Android APK 1\.0 · 5\.3 MB/)).not.toHaveLength(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows a localised unavailable state without retry or stale values and keeps download reachable", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: "APK_METADATA_INVALID" }), { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    renderApp("/zh-hans/");

    expect(await screen.findAllByText(/版本和大小暂时不可用/)).not.toHaveLength(0);
    expect(screen.queryByText(/版本 1\.0|4\.8 MB/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /重新加载|重试版本/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /下载 Android APK/ })).toHaveAttribute("href", "/api/downloads/android/latest");
    expect(screen.getByRole("button", { name: /下载 Android APK/ })).toBeEnabled();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it.each(["/en/privacy/", "/unknown/", "/en/extra/"])("does not request metadata outside an exact homepage: %s", async (pathname) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderApp(pathname);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("contains no static APK version or size fallback", () => {
    const staticContent = JSON.stringify({ downloadManifest, homepageContent });
    expect(staticContent).not.toContain("4.8 MB");
    expect(staticContent).not.toContain('"sizeBytes":5009547');
    expect(staticContent).not.toContain("Android APK 1.0");
  });
});
