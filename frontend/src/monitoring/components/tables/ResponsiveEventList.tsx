import { ArrowRight, Clock3 } from "lucide-react";
import type { MonitoringLocale } from "../../app/MonitoringI18nProvider";
import { detailText, eventLabels } from "../../content/types";
import type { EventDetail } from "../../services/analyticsTypes";
import { formatDate, truncateVisitorID } from "./EventTable";

export function ResponsiveEventList({ items, locale, onViewVisitor }: { items: EventDetail[]; locale: MonitoringLocale; onViewVisitor: (visitorID: string) => void }) {
  return <div className="responsive-event-list">{items.map((event) => <article className="responsive-event-card" key={event.eventId}><header><code>{eventLabels[event.eventType][locale]}</code><span className={`outcome-badge ${event.outcome}`}>{event.outcome}</span></header><dl><dt>{detailText(locale, "eventTime")}</dt><dd>{formatDate(event.occurredAt, locale)}</dd><dt>{detailText(locale, "visitorId")}</dt><dd>{truncateVisitorID(event.visitorId)}</dd><dt>{detailText(locale, "latency")}</dt><dd><Clock3 size={11} />{event.durationMs}ms</dd></dl><button type="button" onClick={() => onViewVisitor(event.visitorId)}>{detailText(locale, "viewVisitor")}<ArrowRight size={13} /></button></article>)}</div>;
}
