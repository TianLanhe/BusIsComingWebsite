import { queryPlaces } from "./routeQueryClient";
import { describe, expect, it, vi } from "vitest";

describe("route query analytics context", () => {
  it("adds only the bounded traffic-source header", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          requestId: "request-1",
          data: { places: [], expiresAt: "2026-07-22T00:00:00Z" },
          error: null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    await queryPlaces({ requestId: "request-1", language: "zh-Hant", query: "Central", limit: 10 });
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).toMatchObject({ "X-BusIsComing-Traffic-Source": "direct" });
    expect(init.headers).not.toHaveProperty("X-BusIsComing-Home-Locale");
    expect(init.headers).not.toHaveProperty("Referer");
    fetchMock.mockRestore();
  });
});
