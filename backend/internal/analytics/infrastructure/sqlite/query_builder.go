package sqlite

import (
	"strings"
	"time"
)

const eventColumns = `
	id, occurred_at_ms, visitor_id, event_type, outcome, http_status, status_class,
	failure_category, duration_ms, locale, device_type, source_type,
	platform, version_name, version_code, size_bytes`

type eventQueryBuilder struct {
	where []string
	args  []any
}

func newEventQueryBuilder(from, to time.Time) *eventQueryBuilder {
	return &eventQueryBuilder{
		where: []string{"occurred_at_ms >= ?", "occurred_at_ms < ?"},
		args:  []any{from.UTC().UnixMilli(), to.UTC().UnixMilli()},
	}
}

func (builder *eventQueryBuilder) addIn(column string, values []string) {
	if len(values) == 0 {
		return
	}
	placeholders := make([]string, len(values))
	for index, value := range values {
		placeholders[index] = "?"
		builder.args = append(builder.args, value)
	}
	builder.where = append(builder.where, column+" IN ("+strings.Join(placeholders, ",")+")")
}

func (builder *eventQueryBuilder) addCursorBefore(occurredAt time.Time, eventID int64) {
	builder.where = append(builder.where, "(occurred_at_ms < ? OR (occurred_at_ms = ? AND id < ?))")
	millis := occurredAt.UTC().UnixMilli()
	builder.args = append(builder.args, millis, millis, eventID)
}

func (builder *eventQueryBuilder) selectSQL(order string) (string, []any) {
	query := "SELECT " + eventColumns + " FROM analytics_events WHERE " + strings.Join(builder.where, " AND ") + " ORDER BY occurred_at_ms " + order + ", id " + order
	return query, append([]any(nil), builder.args...)
}
