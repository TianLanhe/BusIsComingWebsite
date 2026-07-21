import { AnalyticsClientError, serializeAnalyticsQuery } from "./analyticsClient";
import type { AnalyticsEnvelope, AnalyticsQuery, DownloadsData, EventListData, PerformanceData, SystemData, TrafficData, VisitorData } from "./analyticsTypes";

export const fetchTraffic = (query: AnalyticsQuery, signal?: AbortSignal) => fetchRange<TrafficData>("traffic", query, signal);
export const fetchDownloads = (query: AnalyticsQuery, signal?: AbortSignal) => fetchRange<DownloadsData>("downloads", query, signal);
export const fetchPerformance = (query: AnalyticsQuery, signal?: AbortSignal) => fetchRange<PerformanceData>("performance", query, signal);

export function fetchEvents(query: AnalyticsQuery, visitorID?: string, signal?: AbortSignal): Promise<EventListData> {
  const values = serializeDetailQuery(query);
  return request<EventListData>(`/api/analytics/events?${values}`, visitorID ? { "X-Analytics-Visitor-ID": visitorID } : {}, signal);
}

export function fetchVisitor(visitorID: string, limit = 50, cursor?: string, signal?: AbortSignal): Promise<VisitorData> {
  const values = new URLSearchParams({ limit: String(limit) });
  if (cursor) values.set("cursor", cursor);
  return request<VisitorData>(`/api/analytics/visitor?${values}`, { "X-Analytics-Visitor-ID": visitorID }, signal);
}

export function fetchSystem(signal?: AbortSignal): Promise<SystemData> {
  return request<SystemData>("/api/analytics/system", {}, signal);
}

function fetchRange<T>(workspace: string, query: AnalyticsQuery, signal?: AbortSignal): Promise<T> {
  return request<T>(`/api/analytics/${workspace}?${serializeDetailQuery(query)}`, {}, signal);
}

function serializeDetailQuery(query: AnalyticsQuery): URLSearchParams {
  const values = serializeAnalyticsQuery(query);
  query.eventType?.forEach((value) => values.append("eventType", value));
  if (query.limit != null) values.set("limit", String(query.limit));
  if (query.cursor) values.set("cursor", query.cursor);
  return values;
}

async function request<T>(url: string, privateHeaders: Record<string, string>, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { method: "GET", cache: "no-store", headers: { Accept: "application/json", ...privateHeaders }, signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new AnalyticsClientError("ANALYTICS_QUERY_FAILED", 0);
  }
  let envelope: AnalyticsEnvelope<T>;
  try { envelope = await response.json() as AnalyticsEnvelope<T>; } catch { throw new AnalyticsClientError("ANALYTICS_QUERY_FAILED", response.status); }
  if (!response.ok || envelope.error || !envelope.data) throw new AnalyticsClientError(envelope.error?.code ?? "ANALYTICS_QUERY_FAILED", response.status);
  return envelope.data;
}
