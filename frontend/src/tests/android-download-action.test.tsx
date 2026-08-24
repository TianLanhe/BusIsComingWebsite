import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AndroidDownloadAction } from "../components/download/AndroidDownloadAction";
import { DownloadMetadataLine } from "../components/download/DownloadMetadataLine";
import { DownloadMetadataProvider, resetDownloadMetadataForTests } from "../components/download/DownloadMetadataProvider";
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

function renderDownload(fetchResponse: Promise<Response>, locale: "zh-Hant" | "zh-Hans" | "en" = "en") {
  vi.stubGlobal("fetch", vi.fn().mockReturnValue(fetchResponse));
  return renderWithI18n(
    <DownloadMetadataProvider>
      <AndroidDownloadAction />
      <DownloadMetadataLine />
    </DownloadMetadataProvider>,
    { locale },
  );
}

describe("Android download action", () => {
  beforeEach(() => {
    resetDownloadMetadataForTests();
    vi.restoreAllMocks();
  });

  it("becomes a native APK link only after metadata succeeds", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(readyMetadata), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    renderWithI18n(<DownloadMetadataProvider><AndroidDownloadAction /><DownloadMetadataLine /></DownloadMetadataProvider>, { locale: "en" });
    const action = await screen.findByRole("link", { name: "Download BusIsComing" });
    expect(action).toHaveAttribute("href", "/api/downloads/android/latest");
    expect(action).toHaveAttribute("download", "BusIsComing-v1.3.1.apk");
    expect(screen.getByTestId("download-metadata-line")).toHaveTextContent("v1.3.1");
    expect(screen.getByTestId("download-metadata-line")).toHaveTextContent("Android 7.1+");
    expect(screen.getByTestId("download-metadata-line")).not.toHaveTextContent("21/08/2026");
    action.addEventListener("click", (event) => event.preventDefault(), { once: true });
    fireEvent.click(action);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("never exposes a download href while checking or unavailable", async () => {
    const pending = renderDownload(new Promise<Response>(() => {}));
    expect(screen.getByRole("button", { name: "Checking the latest version" })).toBeDisabled();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    pending.unmount();
    resetDownloadMetadataForTests();
    renderDownload(Promise.resolve(new Response("{}", { status: 404 })));
    expect(await screen.findByRole("button", { name: "The Android APK is temporarily unavailable" })).toBeDisabled();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it.each([
    ["zh-Hant", "下載 BusIsComing"],
    ["zh-Hans", "下载 BusIsComing"],
    ["en", "Download BusIsComing"],
  ] as const)("localizes the %s ready action", async (locale, name) => {
    renderDownload(Promise.resolve(new Response(JSON.stringify(readyMetadata), { status: 200, headers: { "Content-Type": "application/json" } })), locale);
    expect(await screen.findByRole("link", { name })).toBeInTheDocument();
  });
});
