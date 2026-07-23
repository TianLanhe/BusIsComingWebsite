import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { monitoringCopy } from "../../content/copy";
import { AccessibleChartFrame } from "./AccessibleChartFrame";

export interface TimeSeriesDefinition {
  key: string;
  label: string;
  unit: "count" | "ms" | "percent";
  color: string;
  lineStyle: "solid" | "dashed";
  pointShape: "circle" | "square" | "diamond";
}

export type TimeSeriesDatum = {
  bucketStart: string;
  [key: string]: string | number | null | undefined;
};

export function TimeSeriesChart({ title, data, series, locale, emptyLabel }: {
  title: string;
  data: TimeSeriesDatum[];
  series: TimeSeriesDefinition[];
  locale: string;
  emptyLabel: string;
}) {
  const [interaction, setInteraction] = useState<{ mode: "pointer" | "keyboard" | null; index: number | null }>({ mode: null, index: null });
  const t = (key: Parameters<typeof monitoringCopy>[1]) => monitoringCopy(locale as "zh-Hans" | "zh-Hant" | "en", key);
  const active = interaction.index == null ? null : data[interaction.index] ?? null;
  const rows = data.map((point) => [formatTime(String(point.bucketStart), locale), ...series.map((item) => point[item.key] ?? "—")]);
  const visibleSeriesKey = series.map((item) => item.key).join("\u0000");

  useEffect(() => {
    setInteraction((current) => current.mode === null ? current : { mode: null, index: null });
  }, [data, visibleSeriesKey]);

  if (data.length === 0 || !series.some((item) => data.some((point) => typeof point[item.key] === "number"))) {
    return <div className="chart-empty" role="status">{emptyLabel}</div>;
  }

  return <AccessibleChartFrame
    title={title}
    summary={title}
    columns={[t("chartXAxis"), ...series.map((item) => item.label)]}
    rows={rows}
  >
    <div className="time-series-frame">
      <ul className="time-series-legend" role="list" aria-label={t("chartLegend")}>
        {series.map((item) => <li key={item.key}><i style={{ "--series-color": item.color } as React.CSSProperties} className={`${item.lineStyle} ${item.pointShape}`} />{item.label}</li>)}
      </ul>
      <div className="time-series-scroll">
        <LineChart
          width={820}
          height={300}
          data={data}
          margin={{ top: 18, right: 24, bottom: 16, left: 8 }}
          onMouseMove={(state) => {
            const index = Number(state?.activeTooltipIndex);
            if (Number.isInteger(index) && data[index]) setInteraction({ mode: "pointer", index });
          }}
          onMouseLeave={() => setInteraction((current) => current.mode === "pointer" ? { mode: null, index: null } : current)}
        >
          <CartesianGrid stroke="#dce8ea" strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="bucketStart" tickFormatter={(value) => formatTime(String(value), locale)} minTickGap={28} tick={{ fontSize: 12, fill: "#62747b" }} />
          <YAxis tickFormatter={(value) => new Intl.NumberFormat(locale, { notation: "compact" }).format(Number(value))} width={54} tick={{ fontSize: 12, fill: "#62747b" }} />
          <Tooltip active={interaction.mode === "pointer"} defaultIndex={interaction.index ?? 0} cursor={{ stroke: "#82979b", strokeDasharray: "3 3" }} content={<MouseTooltip series={series} locale={locale} />} />
          {active && <ReferenceLine x={active.bucketStart} stroke="#82979b" strokeDasharray="3 3" />}
          {series.map((item) => <Line
            key={item.key}
            type="monotone"
            dataKey={item.key}
            name={item.label}
            stroke={item.color}
            strokeWidth={2.25}
            strokeDasharray={item.lineStyle === "dashed" ? "7 5" : undefined}
            connectNulls={false}
            isAnimationActive={false}
            dot={(props) => <FocusableDot {...props} definition={item} onKeyboardActivate={(index) => setInteraction({ mode: "keyboard", index })} onPointerActivate={(index) => setInteraction({ mode: "pointer", index })} onBlur={() => setInteraction((current) => current.mode === "keyboard" ? { mode: null, index: null } : current)} />}
            activeDot={{ r: 5 }}
          />)}
        </LineChart>
      </div>
      {interaction.mode === "keyboard" && active && <div className="chart-keyboard-tooltip" role="status">
        <strong>{formatTime(String(active.bucketStart), locale, true)}</strong>
        {series.map((item) => <span key={item.key}><i style={{ background: item.color }} />{item.label}<b>{formatValue(active[item.key], item.unit, locale)}</b></span>)}
      </div>}
    </div>
  </AccessibleChartFrame>;
}

function FocusableDot(props: Record<string, unknown> & { definition: TimeSeriesDefinition; onKeyboardActivate: (index: number) => void; onPointerActivate: (index: number) => void; onBlur: () => void }) {
  const cx = Number(props.cx);
  const cy = Number(props.cy);
  const index = Number(props.index);
  if (!Number.isFinite(cx) || !Number.isFinite(cy)) return <g />;
  const common = {
    fill: props.definition.color,
    stroke: "#fff",
    strokeWidth: 2,
    tabIndex: 0,
    role: "button",
    "data-testid": "chart-point",
    "aria-label": `${props.definition.label} ${String(props.value ?? "")}`,
    onFocus: () => props.onKeyboardActivate(index),
    onBlur: props.onBlur,
    onMouseEnter: () => props.onPointerActivate(index),
  };
  if (props.definition.pointShape === "square") return <rect {...common} x={cx - 4} y={cy - 4} width={8} height={8} rx={1} />;
  if (props.definition.pointShape === "diamond") return <rect {...common} x={cx - 4} y={cy - 4} width={8} height={8} transform={`rotate(45 ${cx} ${cy})`} />;
  return <circle {...common} cx={cx} cy={cy} r={4} />;
}

function MouseTooltip({ active, payload, label, series, locale }: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number | null }>;
  label?: string;
  series: TimeSeriesDefinition[];
  locale: string;
}) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip">
    <strong>{formatTime(String(label), locale, true)}</strong>
    {series.map((item) => {
      const value = payload.find((entry) => entry.dataKey === item.key)?.value;
      return <span key={item.key}><i style={{ background: item.color }} />{item.label}<b>{formatValue(value, item.unit, locale)}</b></span>;
    })}
  </div>;
}

function formatValue(value: unknown, unit: TimeSeriesDefinition["unit"], locale: string) {
  if (typeof value !== "number") return "—";
  if (unit === "ms") return `${new Intl.NumberFormat(locale).format(value)} ms`;
  if (unit === "percent") return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(value);
  return new Intl.NumberFormat(locale).format(value);
}

function formatTime(value: string, locale: string, detailed = false) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Hong_Kong",
    month: detailed ? "short" : "2-digit",
    day: "2-digit",
    hour: detailed ? "2-digit" : undefined,
    minute: detailed ? "2-digit" : undefined,
    hour12: false,
  }).format(new Date(value));
}
