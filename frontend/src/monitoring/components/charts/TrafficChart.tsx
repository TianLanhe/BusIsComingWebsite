import type { TrafficSeriesPoint } from "../../services/analyticsTypes";
import { TimeSeriesChart, type TimeSeriesDefinition } from "./TimeSeriesChart";

export function TrafficChart({ data, locale, summary, emptyLabel = "No data" }: {
  data: TrafficSeriesPoint[];
  locale: string;
  summary: string;
  emptyLabel?: string;
}) {
  const labels = locale === "en"
    ? ["Homepage PV", "Homepage UV", "Successful route-query UV"]
    : locale === "zh-Hans"
      ? ["主页 PV", "主页 UV", "成功路线查询 UV"]
      : ["主頁 PV", "主頁 UV", "成功路線查詢 UV"];
  const series: TimeSeriesDefinition[] = [
    { key: "pv", label: labels[0], unit: "count", color: "#00545b", lineStyle: "solid", pointShape: "circle" },
    { key: "uv", label: labels[1], unit: "count", color: "#8b5cf6", lineStyle: "dashed", pointShape: "square" },
    { key: "successfulRouteVisitors", label: labels[2], unit: "count", color: "#d98a14", lineStyle: "solid", pointShape: "diamond" },
  ];
  const points = data.map((point) => ({
    bucketStart: point.bucketStart,
    pv: point.pv,
    uv: point.uv,
    successfulRouteVisitors: point.successfulRouteVisitors,
  }));
  return <TimeSeriesChart title={summary} data={points} series={series} locale={locale} emptyLabel={emptyLabel} />;
}
