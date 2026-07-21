import { useId } from "react";
import type { TrafficSeriesPoint } from "../../services/analyticsTypes";
import { AccessibleChartFrame } from "./AccessibleChartFrame";

export function TrafficChart({ data, locale, summary }: { data: TrafficSeriesPoint[]; locale: string; summary: string }) {
  const gradient = useId().replace(/:/g, "");
  const width = 760;
  const height = 210;
  const max = Math.max(1, ...data.flatMap((point) => [point.pv, point.uv]));
  const xAt = (index: number) => data.length <= 1 ? width / 2 : index * width / (data.length - 1);
  const yAt = (value: number) => 180 - value / max * 145;
  const coordinate = (value: number, index: number) => `${xAt(index)},${yAt(value)}`;
  const pv = data.map((point, index) => coordinate(point.pv, index)).join(" ");
  const uv = data.map((point, index) => coordinate(point.uv, index)).join(" ");
  const rows = data.map((point) => [point.bucketStart, point.pv, point.uv]);
  const dataSummary = `${summary}: ${data.map((point) => `${point.bucketStart} PV ${point.pv} UV ${point.uv}`).join("; ")}`;
  return <AccessibleChartFrame title={summary} summary={dataSummary} columns={["Time", "PV", "UV"]} rows={rows}><div className="traffic-chart-wrap">
    <svg className="traffic-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={summary}>
      <defs><linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2799A8" stopOpacity=".25"/><stop offset="1" stopColor="#2799A8" stopOpacity="0"/></linearGradient></defs>
      <g className="chart-grid">{[35, 80, 125, 170].map((y) => <line key={y} x1="0" y1={y} x2={width} y2={y} />)}</g>
      {data.length > 0 && <><polygon points={`0,180 ${pv} ${width},180`} fill={`url(#${gradient})`} /><polyline points={pv} className="pv-line" /><polyline points={uv} className="uv-line" /><g className="chart-points">{data.map((point, index) => <g key={point.bucketStart}><circle cx={xAt(index)} cy={yAt(point.pv)} r="4" className="pv-point"><title>{`${point.bucketStart} · PV ${point.pv}`}</title></circle><rect x={xAt(index) - 3.5} y={yAt(point.uv) - 3.5} width="7" height="7" className="uv-point"><title>{`${point.bucketStart} · UV ${point.uv}`}</title></rect></g>)}</g></>}
    </svg>
    <div className="chart-axis">{data.filter((_, index) => index === 0 || index === data.length - 1 || index === Math.floor(data.length / 2)).map((point) => <span key={point.bucketStart}>{new Intl.DateTimeFormat(locale, { timeZone: "Asia/Hong_Kong", month: "2-digit", day: "2-digit" }).format(new Date(point.bucketStart))}</span>)}</div>
  </div></AccessibleChartFrame>;
}
