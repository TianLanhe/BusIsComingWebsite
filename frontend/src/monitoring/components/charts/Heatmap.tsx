import { useMemo, useState } from "react";
import { monitoringCopy } from "../../content/copy";
import type { HeatmapCell } from "../../services/analyticsTypes";

const weekdays: Record<string, string[]> = {
  "zh-Hans": ["一", "二", "三", "四", "五", "六", "日"],
  "zh-Hant": ["一", "二", "三", "四", "五", "六", "日"],
  en: ["M", "T", "W", "T", "F", "S", "S"],
};

export function Heatmap({ cells, locale, label }: { cells: HeatmapCell[]; locale: string; label: string }) {
  const [active, setActive] = useState<HeatmapCell | null>(null);
  const ordered = useMemo(() => [...cells].sort((left, right) => left.localDate.localeCompare(right.localDate)), [cells]);
  const max = Math.max(1, ...ordered.map((cell) => cell.eventCount));
  const firstWeekday = ordered.length === 0 ? 0 : mondayIndex(ordered[0].localDate);
  const paddingEnd = (7 - ((firstWeekday + ordered.length) % 7)) % 7;
  const columns = Math.max(1, Math.ceil((firstWeekday + ordered.length) / 7));
  const t = (key: Parameters<typeof monitoringCopy>[1]) => monitoringCopy(locale as "zh-Hans" | "zh-Hant" | "en", key);

  return <div className="daily-heatmap">
    <div className="heatmap-weekdays" aria-hidden="true">{(weekdays[locale] ?? weekdays["zh-Hant"]).map((day, index) => <span key={index}>{day}</span>)}</div>
    <div className="heatmap-scroll">
      <div
        className="daily-heatmap-grid"
        role="grid"
        aria-label={label}
        style={{ gridTemplateRows: "repeat(7, 28px)", gridTemplateColumns: `repeat(${columns}, 28px)` }}
      >
        {Array.from({ length: firstWeekday }, (_, index) => <span className="heatmap-padding" aria-hidden="true" key={`start-${index}`} />)}
        {ordered.map((cell) => <button
          type="button"
          role="gridcell"
          key={cell.localDate}
          aria-label={cellLabel(cell, locale, t)}
          style={{ "--heat": Math.max(.06, cell.eventCount / max) } as React.CSSProperties}
          onFocus={() => setActive(cell)}
          onMouseEnter={() => setActive(cell)}
          onBlur={() => setActive(null)}
          onMouseLeave={() => setActive(null)}
        />)}
        {Array.from({ length: paddingEnd }, (_, index) => <span className="heatmap-padding" aria-hidden="true" key={`end-${index}`} />)}
      </div>
    </div>
    <div className="heatmap-strength" aria-label="强度图例"><span>{t("heatmapLess")}</span>{[.08, .28, .5, .72, 1].map((value) => <i key={value} style={{ "--heat": value } as React.CSSProperties} />)}<span>{t("heatmapMore")}</span></div>
    {active && <div className="heatmap-tooltip" role="status">{cellLabel(active, locale, t)}</div>}
  </div>;
}

function mondayIndex(date: string) {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  return (weekday + 6) % 7;
}

function cellLabel(cell: HeatmapCell, locale: string, t: (key: Parameters<typeof monitoringCopy>[1]) => string) {
  const date = new Intl.DateTimeFormat(locale, { timeZone: "Asia/Hong_Kong", year: "numeric", month: "short", day: "numeric" }).format(new Date(cell.bucketStart));
  return `${date} · ${t("heatmapEvents")} ${new Intl.NumberFormat(locale).format(cell.eventCount)} · ${t("heatmapUv")} ${new Intl.NumberFormat(locale).format(cell.uv)}`;
}
