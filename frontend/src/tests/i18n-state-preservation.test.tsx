import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../app/App";
import { resetDownloadMetadataForTests } from "../components/download/DownloadMetadataProvider";
import { I18nProvider } from "../components/i18n/I18nProvider";

const readyMetadata = {
  platform: "android",
  status: "available",
  versionName: "1.3.1",
  versionCode: 19,
  fileName: "BusIsComing-v1.3.1.apk",
  sizeBytes: 2_621_440,
  lastUpdated: "2026-08-24",
  downloadUrl: "/api/downloads/android/latest",
};

describe("homepage locale state preservation", () => {
  beforeEach(() => {
    resetDownloadMetadataForTests();
    vi.restoreAllMocks();
  });

  it("keeps story, FAQ, hash, and shared download metadata while changing locale in place", async () => {
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, string>;
      if (url.endsWith("/metadata")) return jsonResponse(readyMetadata);
      if (url.endsWith("/query_places")) {
        const origin = body.query.includes("origin");
        return jsonResponse({ requestId: "places", data: {
          places: [{ placeToken: origin ? "origin-token" : "destination-token", name: origin ? "Origin Place" : "Destination Place", provider: "citybus", expiresAt: "2026-08-24T12:15:00Z" }],
          expiresAt: "2026-08-24T12:15:00Z",
        }, error: null });
      }
      if (url.endsWith("/query_routes")) return jsonResponse({ requestId: "routes", data: {
        queriedAt: "2026-08-24T12:00:00Z", resultLimit: 20,
        routes: [{
          routeId: "route-606", operator: "citybus", routeNumbers: ["606"], routeLabel: "606",
          boardingStop: { name: "Boarding" }, alightingStop: { name: "Alighting" },
          fare: { currency: "HKD", amount: 6.1 }, durationMinutes: 10, walkingDistanceMeters: 266,
          sortIndex: 0, etaToken: "eta-606", etaExpiresAt: "2026-08-24T12:05:00Z",
        }],
      }, error: null });
      if (url.endsWith("/query_etas")) return jsonResponse({ requestId: "etas", data: {
        queriedAt: "2026-08-24T12:00:01Z",
        etas: [{ etaToken: "eta-606", status: "waiting", waitMinutes: 6, updatedAt: "2026-08-24T12:00:01Z" }],
      }, error: null });
      return new Response(null, { status: 204 });
    });
    vi.stubGlobal("fetch", fetchMock);
    window.history.replaceState({}, "", "/en/#features");

    render(<I18nProvider><App /></I18nProvider>);
    expect(await screen.findAllByRole("link", { name: /Download/ })).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: /04.*Arrivals/ }));
    fireEvent.click(screen.getByRole("button", { name: /Which bus data/ }));
    await choosePlace("Origin", "origin", "Origin Place");
    await choosePlace("Destination", "destination", "Destination Place");
    fireEvent.click(screen.getByRole("button", { name: "Compare bus routes →" }));
    expect(await screen.findByText("606")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "简" }));

    await waitFor(() => expect(screen.getByTestId("hero-title")).toHaveTextContent("班次看得全，候车更从容"));
    expect(screen.getByRole("button", { name: /04.*班次/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /目前支持哪些巴士数据/ })).toHaveAttribute("aria-expanded", "true");
    expect(window.location.pathname).toBe("/zh-hans/");
    expect(window.location.hash).toBe("#features");
    expect(screen.getByDisplayValue("Origin Place")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Destination Place")).toBeInTheDocument();
    expect(screen.getByText("606")).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([input]) => String(input).endsWith("/metadata"))).toHaveLength(1);
  });
});

async function choosePlace(label: string, keyword: string, candidateName: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value: keyword } });
  fireEvent.click(await screen.findByRole("option", { name: candidateName }));
}

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
}
