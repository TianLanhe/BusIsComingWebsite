import type { Funnel } from "../../services/analyticsTypes";

export function FunnelChart({ funnel, locale, labels }: { funnel: Funnel; locale: string; labels: Record<string, string> }) {
  const first = Math.max(funnel.stages[0]?.uniqueVisitors ?? 0, 1);
  const summary = funnel.stages.map((stage) => `${labels[stage.key] ?? stage.key}: ${new Intl.NumberFormat(locale).format(stage.uniqueVisitors)}`).join(", ");
  return <div className="funnel-chart" role="group" aria-label={summary}>{funnel.stages.map((stage, index) => <div className="funnel-row" key={stage.key}><div style={{ width: `${Math.max(38, stage.uniqueVisitors / first * 100)}%` }} className={`funnel-fill step-${index + 1}`}><span>{labels[stage.key] ?? stage.key}</span><b>{new Intl.NumberFormat(locale).format(stage.uniqueVisitors)}</b></div></div>)}</div>;
}
