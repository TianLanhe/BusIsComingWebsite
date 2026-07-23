import { afterEach, describe, expect, it, vi } from "vitest";
import { AnalyticsClientError } from "./analyticsClient";
import { fetchEvents, fetchVisitor } from "./analyticsDetailsClient";
import type { AnalyticsQuery } from "./analyticsTypes";

const query: AnalyticsQuery = { from: "2026-07-01T00:00:00+08:00", to: "2026-07-02T00:00:00+08:00", granularity: "day", compare: false, locale: [], device: [], source: [], outcome: [], platform: [], versionName: [], versionCode: [] };

describe("analyticsDetailsClient", () => {
  afterEach(() => vi.restoreAllMocks());

  it("serializes keyset pagination and only sends exact visitor in the private header", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ requestId: "r", data: { meta: meta(), items: [], pageInfo: { limit: 50, nextCursor: null, hasMore: false, totalCount: 0 } }, error: null }));
    await fetchEvents({ ...query, cursor: "opaque-next", limit: 50 }, "abcdefghijklmnopqrstuv");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("cursor=opaque-next");
    expect(url).not.toContain("abcdefghijklmnopqrstuv");
    expect(init.headers).toMatchObject({ "X-Analytics-Visitor-ID": "abcdefghijklmnopqrstuv" });
  });

  it("uses the full visitor ID only in the visitor header", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ requestId: "r", data: visitorData(), error: null }));
    await fetchVisitor("abcdefghijklmnopqrstuv", 50);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).not.toContain("abcdefghijklmnopqrstuv");
    expect(init.headers).toMatchObject({ "X-Analytics-Visitor-ID": "abcdefghijklmnopqrstuv" });
  });

  it("maps detail error envelopes", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ requestId: "r", data: null, error: { code: "ANALYTICS_INVALID_CURSOR", message: "bad" } }, 400));
    await expect(fetchEvents(query)).rejects.toEqual(expect.objectContaining<Partial<AnalyticsClientError>>({ code: "ANALYTICS_INVALID_CURSOR", status: 400 }));
  });
});

const meta = () => ({ from: query.from, to: query.to, timezone: "Asia/Hong_Kong", granularity: "day", compare: false, comparisonFrom: null, comparisonTo: null, appliedFilters: { locale: [], device: [], source: [], outcome: [], platform: [], versionName: [], versionCode: [], eventType: [] }, generatedAt: query.to, state: "no_data" });
const visitorData = () => ({ generatedAt: query.to, timezone: "Asia/Hong_Kong", visitor: { visitorId: "abcdefghijklmnopqrstuv", firstSeenAt: query.from, lastSeenAt: query.to, eventCount: 1, sessionCount: 1, commonLocale: "zh-Hant", commonDeviceType: "mobile", commonSourceType: "direct" }, sessions: [], pageInfo: { limit: 50, nextCursor: null, hasMore: false, totalCount: 1 } });
function jsonResponse(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }); }
