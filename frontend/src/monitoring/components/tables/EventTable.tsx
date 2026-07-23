import { ArrowRight } from "lucide-react";
import type { MonitoringLocale } from "../../app/MonitoringI18nProvider";
import { detailText, dimensionText, eventLabels } from "../../content/types";
import type { EventDetail } from "../../services/analyticsTypes";

export function EventTable({ items, locale, onViewVisitor }: { items: EventDetail[]; locale: MonitoringLocale; onViewVisitor: (visitorID: string) => void }) {
  return <div className="event-table-wrap"><table className="event-table"><caption className="sr-only">{detailText(locale, "eventsSubtitle")}</caption><thead><tr><th scope="col">{detailText(locale, "eventTime")}</th><th scope="col">{detailText(locale, "eventType")}</th><th scope="col">{detailText(locale, "visitorId")}</th><th scope="col">{detailText(locale, "outcome")}</th><th scope="col">{detailText(locale, "latency")}</th><th scope="col">{detailText(locale, "details")}</th></tr></thead><tbody>{items.map((event) => <tr key={event.eventId}><td>{formatDate(event.occurredAt, locale)}</td><td><code>{eventLabels[event.eventType][locale]}</code></td><td><span className="visitor-short">{truncateVisitorID(event.visitorId)}</span></td><td><span className={`outcome-badge ${event.outcome}`}>{dimensionText(locale, event.outcome)}</span></td><td>{event.durationMs}ms</td><td><button type="button" onClick={() => onViewVisitor(event.visitorId)}>{detailText(locale, "viewVisitor")}<ArrowRight size={13} /></button></td></tr>)}</tbody></table></div>;
}

export function truncateVisitorID(visitorID: string) { return visitorID.length > 12 ? `${visitorID.slice(0, 6)}…${visitorID.slice(-4)}` : visitorID; }
export function formatDate(value: string, locale: string) { return new Intl.DateTimeFormat(locale, { timeZone: "Asia/Hong_Kong", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date(value)); }
