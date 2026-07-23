import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Schema = {
  required?: string[];
  properties?: Record<string, {
    $ref?: string;
    items?: { $ref?: string };
    type?: string | string[];
    enum?: unknown[];
    minItems?: number;
    maxItems?: number;
    description?: string;
  }>;
};

type OpenApiDocument = {
  openapi: string;
  paths: Record<string, Record<string, { operationId?: string }>>;
  components: { schemas: Record<string, Schema> };
};

const featurePath = resolve(process.cwd(), "../specs/012-analytics-dashboard-observability/contracts/analytics-monitoring-api.openapi.yaml");
const sharedPath = resolve(process.cwd(), "../shared/contracts/openapi/analytics-monitoring-api.openapi.yaml");
const featureSource = readFileSync(featurePath, "utf8");
const document = parse(featureSource) as OpenApiDocument;

describe("012 monitoring OpenAPI contract", () => {
  it("keeps the seven private operations stable", () => {
    const operations = Object.values(document.paths)
      .flatMap((path) => Object.values(path))
      .map((operation) => operation.operationId)
      .filter(Boolean);

    expect(document.openapi).toBe("3.1.0");
    expect(operations).toEqual([
      "getAnalyticsOverview",
      "getAnalyticsTraffic",
      "getAnalyticsDownloads",
      "listAnalyticsEvents",
      "getAnalyticsVisitor",
      "getAnalyticsPerformance",
      "getAnalyticsSystemStatus",
    ]);
  });

  it("uses only the daily heatmap item schema", () => {
    const schema = document.components.schemas.HeatmapCell;

    expect(schema.required).toEqual(["localDate", "bucketStart", "bucketEnd", "eventCount", "uv"]);
    expect(Object.keys(schema.properties ?? {})).toEqual(["localDate", "bucketStart", "bucketEnd", "eventCount", "uv"]);
    expect(schema.properties).not.toHaveProperty("weekday");
    expect(schema.properties).not.toHaveProperty("hour");
  });

  it("exposes event latency, full-range event summary, and visitor investigation fields", () => {
    const overview = document.components.schemas.OverviewData;
    const events = document.components.schemas.EventListData;
    const visitor = document.components.schemas.VisitorSummary;

    expect(overview.required).toContain("latencyByEvent");
    expect(overview.properties?.latencyByEvent?.items?.$ref).toBe("#/components/schemas/EventLatencySummary");
    expect(events.required).toContain("summary");
    expect(events.properties?.summary?.$ref).toBe("#/components/schemas/EventRangeSummary");
    expect(visitor.required).toEqual(expect.arrayContaining(["eventComposition", "commonPlatform"]));
  });

  it("defines the 012 event, traffic, performance, and nullable runtime additions", () => {
    const schemas = document.components.schemas;
    const summaryMetrics = schemas.EventListData.properties?.summaryMetrics;
    const trafficMetrics = schemas.TrafficData.properties?.metrics;
    const sqlite = schemas.SQLiteRuntimeStatus;
    const process = schemas.ProcessStatus;
    const listener = schemas.PrivateListenerStatus;

    expect(schemas.EventListData.required).toEqual(expect.arrayContaining(["meta", "summary", "summaryMetrics", "items", "pageInfo"]));
    expect(summaryMetrics?.items?.$ref).toBe("#/components/schemas/Metric");
    expect(summaryMetrics?.minItems).toBe(4);
    expect(summaryMetrics?.maxItems).toBe(4);
    expect(trafficMetrics?.items?.$ref).toBe("#/components/schemas/Metric");
    for (const key of ["pv", "uv", "placeQueryRequests", "placeQueryVisitors", "routeQueryRequests", "routeQueryVisitors"]) {
      expect(trafficMetrics?.description).toContain(`\`${key}\``);
    }
    expect(schemas.PercentileComparison.required).toEqual(["currentMs", "previousMs", "deltaMs", "deltaRate"]);
    expect(schemas.SLISeriesPoint.required).toEqual(["bucketStart", "bucketEnd", "eventType", "successfulPV", "totalPV", "successRate"]);
    expect(schemas.PerformanceData.required).toContain("sliSeries");
    expect(schemas.SystemData.required).toEqual(["generatedAt", "database", "sqlite", "process", "privateListener"]);
    expect(sqlite.required).toEqual(["version", "journalMode", "schemaVersion"]);
    expect(sqlite.properties?.version?.type).toEqual(["string", "null"]);
    expect(sqlite.properties?.journalMode?.type).toEqual(["string", "null"]);
    expect(process.required).toEqual(["startedAt", "uptimeMs", "droppedSinceStart"]);
    expect(process.properties?.startedAt?.type).toEqual(["string", "null"]);
    expect(process.properties?.uptimeMs?.type).toEqual(["integer", "null"]);
    expect(process.properties?.droppedSinceStart?.type).toEqual(["integer", "null"]);
    expect(listener.required).toEqual(["state", "bindAddress", "publicProxy"]);
    expect(listener.properties?.state?.type).toEqual(["string", "null"]);
    expect(listener.properties?.bindAddress?.type).toEqual(["string", "null"]);
  });

  it("keeps the shared runtime contract byte-for-byte synchronized", () => {
    expect(readFileSync(sharedPath, "utf8")).toBe(featureSource);
  });
});
