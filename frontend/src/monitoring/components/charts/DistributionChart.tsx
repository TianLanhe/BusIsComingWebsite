import type { DistributionPoint } from "../../services/analyticsTypes";

const colors = ["#00545B", "#2799A8", "#86CDBB", "#D98A14", "#8B5CF6"];

export function DistributionChart({ items, locale, labels = {} }: { items: DistributionPoint[]; locale: string; labels?: Record<string, string> }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  let cursor = 0;
  const segments = items.map((item, index) => {
    const start = cursor;
    cursor += (item.ratio ?? 0) * 100;
    return `${colors[index % colors.length]} ${start}% ${cursor}%`;
  }).join(", ");
  return <div className="distribution"><div className="donut" style={{ background: segments ? `conic-gradient(${segments})` : "#e8f0f0" }}><span>{new Intl.NumberFormat(locale, { notation: "compact" }).format(total)}</span></div><div className="distribution-list">{items.map((item, index) => <div key={item.key}><span><i style={{ background: colors[index % colors.length] }} />{labels[item.key] ?? item.key}</span><b>{item.ratio == null ? "—" : new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(item.ratio)}</b></div>)}</div></div>;
}
