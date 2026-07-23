import { afterEach, describe, expect, it, vi } from "vitest";
import { AnalyticsClientError, fetchOverview, serializeAnalyticsQuery } from "./analyticsClient";
import type { AnalyticsQuery, OverviewData } from "./analyticsTypes";

const query: AnalyticsQuery = {
  from: "2026-06-21T00:00:00+08:00",
  to: "2026-07-21T00:00:00+08:00",
  granularity: "day",
  compare: true,
  locale: ["zh-Hant", "en"],
  device: ["mobile"],
  source: ["direct"],
  outcome: ["success"],
  platform: ["android", "ios"],
  versionName: ["1.0"],
  versionCode: [1],
};

describe("analyticsClient", () => {
  afterEach(() => vi.restoreAllMocks());

  it("serializes multi-select filters as repeated query keys", () => {
    const values = serializeAnalyticsQuery(query);
    expect(values.getAll("locale")).toEqual(["zh-Hant", "en"]);
    expect(values.getAll("platform")).toEqual(["android", "ios"]);
    expect(values.get("compare")).toBe("true");
    expect(values.get("versionCode")).toBe("1");
  });

  it("returns comparison metadata from the success envelope", async () => {
    const data = overviewFixture();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ requestId: "req-1", data, error: null }));
    const result = await fetchOverview(query);
    expect(result.meta.comparisonFrom).toBe("2026-05-22T00:00:00+08:00");
    expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining("locale=zh-Hant&locale=en"), expect.objectContaining({ cache: "no-store" }));
  });

  it("maps structured API failures without exposing response internals", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ requestId: "req-2", data: null, error: { code: "ANALYTICS_STORAGE_UNAVAILABLE", message: "暂时不可用" } }, 503),
    );
    await expect(fetchOverview(query)).rejects.toEqual(
      expect.objectContaining<Partial<AnalyticsClientError>>({ code: "ANALYTICS_STORAGE_UNAVAILABLE", status: 503 }),
    );
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function overviewFixture(): OverviewData {
  return {
    meta: {
      from: query.from,
      to: query.to,
      timezone: "Asia/Hong_Kong",
      granularity: "day",
      compare: true,
      comparisonFrom: "2026-05-22T00:00:00+08:00",
      comparisonTo: query.from,
      appliedFilters: { locale: [], device: [], source: [], outcome: [], platform: [], versionName: [], versionCode: [], eventType: [] },
      generatedAt: "2026-07-21T01:16:42Z",
      state: "ready",
    },
    metrics: [],
    trafficSeries: [],
    trialFunnel: { key: "trial", sessionGapMinutes: 30, stages: [] },
    downloadFunnel: { key: "download", sessionGapMinutes: 30, stages: [] },
    eventComposition: [],
    latency: { requestCount: 0, p50Ms: null, p95Ms: null },
    latencyByEvent: [
      { eventType: "page_view", requestCount: 0, p95Ms: null },
      { eventType: "place_query", requestCount: 0, p95Ms: null },
      { eventType: "route_query", requestCount: 0, p95Ms: null },
      { eventType: "download_request", requestCount: 0, p95Ms: null },
    ],
    downloadPlatforms: [],
    downloadVersions: [],
  };
}
