import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

function androidEntry(sectionId: "hero" | "download") {
  const section = document.querySelector<HTMLElement>(`#${sectionId}`);
  if (!section) throw new Error(`Missing #${sectionId}`);
  return within(section);
}

function expectUnavailableEntries() {
  for (const sectionId of ["hero", "download"] as const) {
    const entry = androidEntry(sectionId).getByRole("button", { name: "Android APK is temporarily unavailable" });
    expect(entry).toBeDisabled();
    expect(entry).toHaveAttribute("aria-disabled", "true");
    expect(entry).toHaveAttribute("data-download-state", "android-unavailable");
    expect(entry).not.toHaveAttribute("href");
    expect(androidEntry(sectionId).queryByRole("link", { name: /Download Android APK/ })).not.toBeInTheDocument();
  }
}

describe("homepage APK metadata", () => {
  beforeEach(() => {
    resetDownloadMetadataForTests();
    vi.restoreAllMocks();
  });

  afterEach(() => cleanup());

  it("keeps both entries disabled while the shared metadata request is pending", () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise<Response>(() => {})));
    renderApp();

    for (const sectionId of ["hero", "download"] as const) {
      const entry = androidEntry(sectionId).getByRole("button", { name: "Checking download…" });
      expect(entry).toBeDisabled();
      expect(entry).toHaveAttribute("aria-disabled", "true");
      expect(entry).toHaveAttribute("data-download-state", "android-checking");
      expect(entry).not.toHaveAttribute("href");
    }
  });

  it("requests once in StrictMode, shares the result, and does not refetch after a language switch", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(readyMetadata), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    renderApp();

    for (const sectionId of ["hero", "download"] as const) {
      const entry = await androidEntry(sectionId).findByRole("link", { name: /Download Android APK/ });
      expect(entry).toHaveAttribute("download", "BusIsComing.apk");
      expect(entry).toHaveAttribute("href", "/api/downloads/android/latest");
      expect(entry).toHaveTextContent("Version 1.0 · 5.3 MB");
    }
    expect(androidEntry("download").getAllByText(/iPhone is not supported yet/)).toHaveLength(1);
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
    for (const sectionId of ["hero", "download"] as const) {
      expect(await androidEntry(sectionId).findByRole("link", { name: /下载 Android APK/ })).toHaveTextContent("版本 1.0 · 5.3 MB");
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["404", () => Promise.resolve(new Response(JSON.stringify({ code: "APK_METADATA_MISSING" }), { status: 404 }))],
    ["500", () => Promise.resolve(new Response(JSON.stringify({ code: "APK_METADATA_INVALID" }), { status: 500 }))],
    ["network failure", () => Promise.reject(new TypeError("network down"))],
    ["invalid JSON", () => Promise.resolve(new Response("{", { status: 200 }))],
    ["invalid downloadUrl", () => Promise.resolve(new Response(JSON.stringify({ ...readyMetadata, downloadUrl: "/unsafe.apk" }), { status: 200 }))],
    ["unsafe fileName", () => Promise.resolve(new Response(JSON.stringify({ ...readyMetadata, fileName: "nested/BusIsComing.apk" }), { status: 200 }))],
    ["invalid sizeBytes", () => Promise.resolve(new Response(JSON.stringify({ ...readyMetadata, sizeBytes: 0 }), { status: 200 }))],
    ["versionName beyond the 64-character contract limit", () => Promise.resolve(new Response(JSON.stringify({ ...readyMetadata, versionName: "v".repeat(65) }), { status: 200 }))],
    ["calendar-invalid lastUpdated", () => Promise.resolve(new Response(JSON.stringify({ ...readyMetadata, lastUpdated: "2026-99-99" }), { status: 200 }))],
  ])("disables both entries without a static fallback or retry after %s", async (_scenario, createResponse) => {
    const fetchMock = vi.fn().mockImplementation(createResponse);
    vi.stubGlobal("fetch", fetchMock);
    renderApp();

    await screen.findAllByRole("button", { name: "Android APK is temporarily unavailable" });
    expectUnavailableEntries();
    expect(screen.queryByText(/Version 1\.0|5\.3 MB/)).not.toBeInTheDocument();
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
