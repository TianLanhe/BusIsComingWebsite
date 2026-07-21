import type { AnalyticsEnvelope, AnalyticsErrorBody, AnalyticsQuery, OverviewData } from "./analyticsTypes";

export class AnalyticsClientError extends Error {
  readonly code: AnalyticsErrorBody["code"] | "ANALYTICS_QUERY_FAILED";
  readonly status: number;

  constructor(code: AnalyticsClientError["code"], status: number) {
    super(code);
    this.name = "AnalyticsClientError";
    this.code = code;
    this.status = status;
  }
}

export function serializeAnalyticsQuery(query: AnalyticsQuery): URLSearchParams {
  const values = new URLSearchParams({
    from: query.from,
    to: query.to,
    granularity: query.granularity,
    compare: String(query.compare),
  });
  const append = (key: string, items: readonly (string | number)[]) => {
    items.forEach((item) => values.append(key, String(item)));
  };
  append("locale", query.locale);
  append("device", query.device);
  append("source", query.source);
  append("outcome", query.outcome);
  append("platform", query.platform);
  append("versionName", query.versionName);
  append("versionCode", query.versionCode);
  return values;
}

export async function fetchOverview(query: AnalyticsQuery, signal?: AbortSignal): Promise<OverviewData> {
  let response: Response;
  try {
    response = await fetch(`/api/analytics/overview?${serializeAnalyticsQuery(query)}`, {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new AnalyticsClientError("ANALYTICS_QUERY_FAILED", 0);
  }
  let envelope: AnalyticsEnvelope<OverviewData>;
  try {
    envelope = await response.json() as AnalyticsEnvelope<OverviewData>;
  } catch {
    throw new AnalyticsClientError("ANALYTICS_QUERY_FAILED", response.status);
  }
  if (!response.ok || envelope.error || !envelope.data) {
    throw new AnalyticsClientError(envelope.error?.code ?? "ANALYTICS_QUERY_FAILED", response.status);
  }
  return envelope.data;
}
