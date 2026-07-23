import type { Locale } from "../content/types";

export type TrafficSource = "direct" | "search" | "referral" | "internal" | "unknown";

const searchHosts = ["google.", "bing.com", "duckduckgo.com", "baidu.com", "search.yahoo.com"];

export function classifyTrafficSource(referrer: string, currentOrigin: string): TrafficSource {
  if (!referrer) {
    return "direct";
  }
  try {
    const referrerUrl = new URL(referrer);
    const siteOrigin = new URL(currentOrigin).origin;
    if (referrerUrl.origin === siteOrigin) {
      return "internal";
    }
    const host = referrerUrl.hostname.toLowerCase();
    return searchHosts.some((candidate) => host.includes(candidate)) ? "search" : "referral";
  } catch {
    return "unknown";
  }
}

interface AnalyticsHeaderOptions {
  homeLocale?: Locale;
  referrer?: string;
  currentOrigin?: string;
}

export function buildAnalyticsHeaders(options: AnalyticsHeaderOptions = {}): Record<string, string> {
  const referrer = options.referrer ?? (typeof document === "undefined" ? "" : document.referrer);
  const currentOrigin = options.currentOrigin ?? (typeof window === "undefined" ? "https://busiscoming.com" : window.location.origin);
  const headers: Record<string, string> = {
    "X-BusIsComing-Traffic-Source": classifyTrafficSource(referrer, currentOrigin),
  };
  if (options.homeLocale) {
    headers["X-BusIsComing-Home-Locale"] = options.homeLocale;
  }
  return headers;
}
