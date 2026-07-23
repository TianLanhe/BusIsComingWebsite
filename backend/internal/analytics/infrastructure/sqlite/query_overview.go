package sqlite

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"busiscoming-website/backend/internal/analytics/domain"
)

func (store *Store) LoadOverviewEvents(ctx context.Context, from, to time.Time) ([]domain.AnalyticsEvent, error) {
	builder := newEventQueryBuilder(from, to)
	query, arguments := builder.selectSQL("ASC")
	rows, err := store.db.QueryContext(ctx, query, arguments...)
	if err != nil {
		return nil, fmt.Errorf("query analytics overview details: %w", err)
	}
	defer rows.Close()
	events := make([]domain.AnalyticsEvent, 0)
	for rows.Next() {
		event, scanErr := scanAnalyticsEvent(rows)
		if scanErr != nil {
			return nil, fmt.Errorf("scan analytics overview detail: %w", scanErr)
		}
		events = append(events, event)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate analytics overview details: %w", err)
	}
	return events, nil
}

type rowScanner interface {
	Scan(...any) error
}

func scanAnalyticsEvent(row rowScanner) (domain.AnalyticsEvent, error) {
	var (
		event                                  domain.AnalyticsEvent
		occurredAtMS                           int64
		eventType, outcome, statusClass        string
		locale, deviceType, sourceType         string
		failureCategory, platform, versionName sql.NullString
		httpStatus, versionCode, sizeBytes     sql.NullInt64
	)
	if err := row.Scan(
		&event.EventID, &occurredAtMS, &event.VisitorID, &eventType, &outcome, &httpStatus, &statusClass,
		&failureCategory, &event.DurationMS, &locale, &deviceType, &sourceType,
		&platform, &versionName, &versionCode, &sizeBytes,
	); err != nil {
		return domain.AnalyticsEvent{}, err
	}
	event.OccurredAt = time.UnixMilli(occurredAtMS).UTC()
	event.EventType = domain.EventType(eventType)
	event.Outcome = domain.Outcome(outcome)
	event.StatusClass = domain.StatusClass(statusClass)
	event.Locale = domain.Locale(locale)
	event.DeviceType = domain.DeviceType(deviceType)
	event.SourceType = domain.SourceType(sourceType)
	if httpStatus.Valid {
		parsed := int(httpStatus.Int64)
		event.HTTPStatus = &parsed
	}
	if failureCategory.Valid {
		failure := domain.FailureCategory(failureCategory.String)
		event.FailureCategory = &failure
	}
	if platform.Valid {
		event.Download = &domain.DownloadAttribution{
			Platform: domain.Platform(platform.String), VersionName: versionName.String,
			VersionCode: versionCode.Int64, SizeBytes: sizeBytes.Int64,
		}
	}
	return event, nil
}
