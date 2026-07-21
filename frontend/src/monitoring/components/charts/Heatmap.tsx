import type { HeatmapCell } from "../../services/analyticsTypes";

const weekdays: Record<string, string[]> = { "zh-Hans": ["一", "二", "三", "四", "五", "六", "日"], "zh-Hant": ["一", "二", "三", "四", "五", "六", "日"], en: ["M", "T", "W", "T", "F", "S", "S"] };

export function Heatmap({ cells, locale, label }: { cells: HeatmapCell[]; locale: string; label: string }) {
  const max = Math.max(1, ...cells.map((cell) => cell.eventCount));
  const byKey = new Map(cells.map((cell) => [`${cell.weekday}-${cell.hour}`, cell]));
  return <div className="heatmap-frame" role="img" aria-label={label}>
    <div className="heatmap-hours"><span />{Array.from({ length: 12 }, (_, index) => <span key={index}>{String(index * 2).padStart(2, "0")}</span>)}</div>
    {(weekdays[locale] ?? weekdays["zh-Hant"]).map((weekday, row) => <div className="heatmap-row" key={`${weekday}-${row}`}><span>{weekday}</span>{Array.from({ length: 12 }, (_, column) => {
      const first = byKey.get(`${row + 1}-${column * 2}`)?.eventCount ?? 0;
      const second = byKey.get(`${row + 1}-${column * 2 + 1}`)?.eventCount ?? 0;
      const count = first + second;
      return <i key={column} style={{ "--heat": Math.max(.06, count / (max * 2)) } as React.CSSProperties} title={`${weekday} ${column * 2}:00 · ${count}`}><span className="sr-only">{weekday} {column * 2}:00 {count}</span></i>;
    })}</div>)}
  </div>;
}
