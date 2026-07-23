package sqlite

import (
	"context"
	"fmt"
	"strings"

	analyticsapp "busiscoming-website/backend/internal/analytics/application"
	"busiscoming-website/backend/internal/analytics/domain"
)

func (store *Store) ListEvents(ctx context.Context, request analyticsapp.EventListRequest) (analyticsapp.StoredEventPage, error) {
	base := newEventQueryBuilder(request.Query.From, request.Query.To)
	addEventFilters(base, request.Query)
	if request.VisitorID != "" {
		base.addEqual("visitor_id", request.VisitorID)
	}
	summaryQuery, summaryArguments := base.summarySQL()
	var summary analyticsapp.EventRangeSummary
	if err := store.db.QueryRowContext(ctx, summaryQuery, summaryArguments...).Scan(
		&summary.TotalCount, &summary.SuccessCount, &summary.FailureCount, &summary.UniqueVisitors,
	); err != nil {
		return analyticsapp.StoredEventPage{}, fmt.Errorf("summarize analytics events: %w", err)
	}
	page := base.clone()
	if request.Cursor != nil {
		page.addCursorBefore(request.Cursor.OccurredAt, request.Cursor.EventID)
	}
	query, arguments := page.selectSQL("DESC")
	query += " LIMIT ?"
	arguments = append(arguments, request.Limit+1)
	rows, err := store.db.QueryContext(ctx, query, arguments...)
	if err != nil {
		return analyticsapp.StoredEventPage{}, fmt.Errorf("query analytics event page: %w", err)
	}
	defer rows.Close()
	items := make([]domain.AnalyticsEvent, 0, request.Limit+1)
	for rows.Next() {
		event, scanErr := scanAnalyticsEvent(rows)
		if scanErr != nil {
			return analyticsapp.StoredEventPage{}, fmt.Errorf("scan analytics event page: %w", scanErr)
		}
		items = append(items, event)
	}
	if err := rows.Err(); err != nil {
		return analyticsapp.StoredEventPage{}, fmt.Errorf("iterate analytics event page: %w", err)
	}
	hasMore := len(items) > request.Limit
	if hasMore {
		items = items[:request.Limit]
	}
	return analyticsapp.StoredEventPage{Items: items, Summary: summary, HasMore: hasMore}, nil
}

func (store *Store) LoadVisitorEvents(ctx context.Context, visitorID string) ([]domain.AnalyticsEvent, error) {
	query := "SELECT " + eventColumns + " FROM analytics_events WHERE visitor_id = ? ORDER BY occurred_at_ms ASC, id ASC"
	rows, err := store.db.QueryContext(ctx, query, visitorID)
	if err != nil {
		return nil, fmt.Errorf("query visitor analytics events: %w", err)
	}
	defer rows.Close()
	events := make([]domain.AnalyticsEvent, 0)
	for rows.Next() {
		event, scanErr := scanAnalyticsEvent(rows)
		if scanErr != nil {
			return nil, fmt.Errorf("scan visitor analytics event: %w", scanErr)
		}
		events = append(events, event)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate visitor analytics events: %w", err)
	}
	return events, nil
}

func addEventFilters(builder *eventQueryBuilder, query domain.AnalyticsQuery) {
	builder.addIn("locale", localeStrings(query.Locales))
	builder.addIn("device_type", deviceStrings(query.DeviceTypes))
	builder.addIn("source_type", sourceStrings(query.SourceTypes))
	builder.addIn("outcome", outcomeStrings(query.Outcomes))
	builder.addIn("platform", platformStrings(query.Platforms))
	builder.addIn("version_name", query.VersionNames)
	if len(query.VersionCodes) > 0 {
		placeholders := make([]string, len(query.VersionCodes))
		for index, value := range query.VersionCodes {
			placeholders[index] = "?"
			builder.args = append(builder.args, value)
		}
		builder.where = append(builder.where, "version_code IN ("+strings.Join(placeholders, ",")+")")
	}
	builder.addIn("event_type", eventTypeStrings(query.EventTypes))
}

func localeStrings(values []domain.Locale) []string {
	result := make([]string, len(values))
	for index, value := range values {
		result[index] = string(value)
	}
	return result
}
func deviceStrings(values []domain.DeviceType) []string {
	result := make([]string, len(values))
	for index, value := range values {
		result[index] = string(value)
	}
	return result
}
func sourceStrings(values []domain.SourceType) []string {
	result := make([]string, len(values))
	for index, value := range values {
		result[index] = string(value)
	}
	return result
}
func outcomeStrings(values []domain.Outcome) []string {
	result := make([]string, len(values))
	for index, value := range values {
		result[index] = string(value)
	}
	return result
}
func platformStrings(values []domain.Platform) []string {
	result := make([]string, len(values))
	for index, value := range values {
		result[index] = string(value)
	}
	return result
}
func eventTypeStrings(values []domain.EventType) []string {
	result := make([]string, len(values))
	for index, value := range values {
		result[index] = string(value)
	}
	return result
}
