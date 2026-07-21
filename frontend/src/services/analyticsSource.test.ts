import { buildAnalyticsHeaders, classifyTrafficSource } from "./analyticsSource";
import { describe, expect, it } from "vitest";

describe("analytics source classification", () => {
  it.each([
    ["", "direct"],
    ["https://www.google.com/search?q=bus", "search"],
    ["https://www.bing.com/search?q=bus", "search"],
    ["https://duckduckgo.com/?q=bus", "search"],
    ["https://busiscoming.com/privacy/", "internal"],
    ["https://example.com/articles/hk-bus", "referral"],
    ["not a url", "unknown"],
  ])("maps %s to %s", (referrer, expected) => {
    expect(classifyTrafficSource(referrer, "https://busiscoming.com")).toBe(expected);
  });

  it("sends only finite headers and never the raw referrer", () => {
    const rawReferrer = "https://referrer-sentinel.example/private/path?token=secret";
    const headers = buildAnalyticsHeaders({
      homeLocale: "zh-Hant",
      referrer: rawReferrer,
      currentOrigin: "https://busiscoming.com",
    });
    expect(headers).toEqual({
      "X-BusIsComing-Home-Locale": "zh-Hant",
      "X-BusIsComing-Traffic-Source": "referral",
    });
    expect(JSON.stringify(headers)).not.toContain(rawReferrer);
    expect(Object.values(headers)).not.toContain(rawReferrer);
  });

  it("omits the homepage locale for shared route-query requests", () => {
    expect(
      buildAnalyticsHeaders({ referrer: "", currentOrigin: "https://busiscoming.com" }),
    ).toEqual({ "X-BusIsComing-Traffic-Source": "direct" });
  });
});
