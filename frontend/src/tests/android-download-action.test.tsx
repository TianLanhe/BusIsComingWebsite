import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AndroidDownloadAction } from "../components/download/AndroidDownloadAction";
import {
  DownloadMetadataProvider,
  resetDownloadMetadataForTests,
} from "../components/download/DownloadMetadataProvider";
import { renderWithI18n } from "./test-utils";

const localizedStatusCopy = [
  {
    locale: "zh-Hant" as const,
    checking: "正在檢查下載…",
    ready: "下載 Android APK",
    unavailable: "Android APK 暫時未能下載",
    version: "版本 1.2 · 5.7 MB",
  },
  {
    locale: "zh-Hans" as const,
    checking: "正在检查下载…",
    ready: "下载 Android APK",
    unavailable: "Android APK 暂时无法下载",
    version: "版本 1.2 · 5.7 MB",
  },
  {
    locale: "en" as const,
    checking: "Checking download…",
    ready: "Download Android APK",
    unavailable: "Android APK is temporarily unavailable",
    version: "Version 1.2 · 5.7 MB",
  },
];

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

function renderAction(fetchResponse: Promise<Response>, locale: "zh-Hant" | "zh-Hans" | "en" = "en") {
  vi.stubGlobal("fetch", vi.fn().mockReturnValue(fetchResponse));
  return renderWithI18n(
    <DownloadMetadataProvider>
      <AndroidDownloadAction />
    </DownloadMetadataProvider>,
    { locale },
  );
}

describe("AndroidDownloadAction", () => {
  beforeEach(() => {
    resetDownloadMetadataForTests();
    vi.restoreAllMocks();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:apk"),
    });
  });

  it("uses the checked metadata as a native APK link without reading APK bytes", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(readyMetadata), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    renderWithI18n(
      <DownloadMetadataProvider>
        <AndroidDownloadAction />
      </DownloadMetadataProvider>,
      { locale: "en" },
    );

    const action = await screen.findByRole("link", { name: /Download Android APK/ });
    expect(action).toHaveAttribute("href", "/api/downloads/android/latest");
    expect(action).toHaveAttribute("download", "BusIsComing-v1.2.apk");
    expect(action).toHaveTextContent("Version 1.2 · 5.7 MB");

    action.addEventListener("click", (event) => event.preventDefault(), { once: true });
    fireEvent.click(action);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls.map(([input]) => input)).not.toContain("/api/downloads/android/latest");
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("keeps the action disabled and without an APK href while metadata is checking", () => {
    renderAction(new Promise<Response>(() => {}));

    const action = screen.getByRole("button", { name: "Checking download…" });
    expect(action).toBeDisabled();
    expect(action).toHaveAttribute("aria-disabled", "true");
    expect(action).not.toHaveAttribute("href");
  });

  it("keeps the action disabled and without an APK href when metadata is unavailable", async () => {
    renderAction(Promise.resolve(new Response(JSON.stringify({ code: "APK_METADATA_MISSING" }), { status: 404 })));

    const action = await screen.findByRole("button", { name: "Android APK is temporarily unavailable" });
    expect(action).toBeDisabled();
    expect(action).toHaveAttribute("aria-disabled", "true");
    expect(action).not.toHaveAttribute("href");
    await waitFor(() => expect(URL.createObjectURL).not.toHaveBeenCalled());
  });

  it.each(localizedStatusCopy)("uses exact $locale visible status copy as the accessible action name", async ({
    locale,
    checking,
    ready,
    unavailable,
    version,
  }) => {
    const checkingView = renderAction(new Promise<Response>(() => {}), locale);
    const checkingAction = screen.getByRole("button", { name: checking });
    expect(checkingAction).toHaveTextContent(checking);
    expect(checkingAction).toBeDisabled();
    expect(checkingAction).toHaveAttribute("aria-disabled", "true");
    expect(checkingAction).not.toHaveAttribute("aria-describedby");
    expect(checkingAction).not.toHaveAccessibleDescription();
    checkingView.unmount();

    resetDownloadMetadataForTests();
    const unavailableView = renderAction(
      Promise.resolve(new Response(JSON.stringify({ code: "APK_METADATA_MISSING" }), { status: 404 })),
      locale,
    );
    const unavailableAction = await screen.findByRole("button", { name: unavailable });
    expect(unavailableAction).toHaveTextContent(unavailable);
    expect(unavailableAction).toBeDisabled();
    expect(unavailableAction).toHaveAttribute("aria-disabled", "true");
    expect(unavailableAction).not.toHaveAttribute("aria-describedby");
    expect(unavailableAction).not.toHaveAccessibleDescription();
    unavailableView.unmount();

    resetDownloadMetadataForTests();
    const readyView = renderAction(
      Promise.resolve(new Response(JSON.stringify(readyMetadata), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })),
      locale,
    );
    const readyAction = await screen.findByRole("link", { name: ready });
    expect(readyAction).toHaveTextContent(ready);
    expect(readyAction).toHaveTextContent(version);
    expect(readyAction).toHaveAttribute("download", "BusIsComing-v1.2.apk");
    expect(readyAction).toHaveAccessibleName(ready);
    expect(readyAction).toHaveAccessibleDescription(version);
    const descriptionId = readyAction.getAttribute("aria-describedby");
    expect(descriptionId).toBeTruthy();
    expect(document.getElementById(descriptionId!)).toHaveTextContent(version);
    readyView.unmount();
  });
});
