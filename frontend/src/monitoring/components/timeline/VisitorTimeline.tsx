import type { MonitoringLocale } from "../../app/MonitoringI18nProvider";
import { detailText, eventLabels } from "../../content/types";
import type { DerivedSession } from "../../services/analyticsTypes";
import { formatDate } from "../tables/EventTable";

export function VisitorTimeline({ sessions, locale }: { sessions: DerivedSession[]; locale: MonitoringLocale }) {
  return <div className="visitor-timeline">{sessions.map((session) => <section key={session.ordinal}><div className="session-divider"><b>{detailText(locale, "session")} {session.ordinal}</b><span>{session.eventCount} · {Math.round(session.durationMs / 1000)}s</span></div><div className="timeline-events">{session.events.map((event) => <div className="timeline-event" key={event.eventId}><i /><time>{formatDate(event.occurredAt, locale)}</time><div><b>{eventLabels[event.eventType][locale]}</b><span>{event.deviceType} · {event.sourceType} · {event.durationMs}ms</span></div><em className={`outcome-badge ${event.outcome}`}>{event.outcome}</em></div>)}</div></section>)}</div>;
}
