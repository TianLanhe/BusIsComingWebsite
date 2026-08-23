import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../app/App";
import { resetDownloadMetadataForTests } from "../components/download/DownloadMetadataProvider";
import { I18nProvider } from "../components/i18n/I18nProvider";

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

function renderApp(pathname = "/en/") {
  window.history.replaceState({}, "", pathname);
  return render(<React.StrictMode><I18nProvider><App /></I18nProvider></React.StrictMode>);
}

describe("homepage APK metadata", () => {
  beforeEach(() => { resetDownloadMetadataForTests(); vi.restoreAllMocks(); });
  afterEach(() => cleanup());

  it("requests once in StrictMode, shares state, and preserves it across locale switches", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(readyMetadata), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    renderApp();
    expect(await screen.findByRole("link", { name: "Download Android App" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Download BusIsComing" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Choose language" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "简体中文" }));
    expect(await screen.findByRole("link", { name: "下载 Android App" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "下载 BusIsComing" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["404", () => Promise.resolve(new Response("{}", { status: 404 }))],
    ["500", () => Promise.resolve(new Response("{}", { status: 500 }))],
    ["network", () => Promise.reject(new TypeError("network down"))],
    ["invalid JSON", () => Promise.resolve(new Response("{", { status: 200 }))],
    ["unsafe URL", () => Promise.resolve(new Response(JSON.stringify({ ...readyMetadata, downloadUrl: "/unsafe.apk" }), { status: 200 }))],
  ])("fails closed after %s", async (_name, response) => {
    const fetchMock = vi.fn().mockImplementation(response);
    vi.stubGlobal("fetch", fetchMock);
    renderApp();
    expect(await screen.findAllByRole("button", { name: "The Android APK is temporarily unavailable" })).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "Download BusIsComing" })).not.toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it.each(["/en/privacy/", "/unknown/", "/en/extra/"])("does not fetch outside an exact homepage: %s", async (pathname) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderApp(pathname);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps both status controls disabled while metadata is pending", () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise<Response>(() => {})));
    renderApp();
    const buttons = screen.getAllByRole("button", { name: "Checking the latest version" });
    expect(buttons).toHaveLength(2);
    for (const button of buttons) expect(button).toBeDisabled();
    expect(within(document.querySelector("#download") as HTMLElement).queryByTestId("download-qr-code")).not.toBeInTheDocument();
  });
});
