package http

import (
	"fmt"
	"net/url"
	"strconv"
	"time"

	"busiscoming-website/backend/internal/analytics/domain"
)

func parseOverviewQuery(values url.Values) (domain.AnalyticsQuery, error) {
	from, err := time.Parse(time.RFC3339, values.Get("from"))
	if err != nil {
		return domain.AnalyticsQuery{}, fmt.Errorf("invalid from")
	}
	to, err := time.Parse(time.RFC3339, values.Get("to"))
	if err != nil {
		return domain.AnalyticsQuery{}, fmt.Errorf("invalid to")
	}
	granularity, err := parseGranularity(values.Get("granularity"), to.Sub(from))
	if err != nil {
		return domain.AnalyticsQuery{}, err
	}
	compare := true
	if raw := values.Get("compare"); raw != "" {
		compare, err = strconv.ParseBool(raw)
		if err != nil {
			return domain.AnalyticsQuery{}, fmt.Errorf("invalid compare")
		}
	}
	query := domain.AnalyticsQuery{From: from, To: to, Granularity: granularity, Compare: compare}
	if query.Locales, err = parseValues(values["locale"], func(value string) (domain.Locale, bool) {
		parsed := domain.Locale(value)
		return parsed, domain.IsLocale(parsed)
	}); err != nil {
		return domain.AnalyticsQuery{}, err
	}
	if query.DeviceTypes, err = parseValues(values["device"], func(value string) (domain.DeviceType, bool) {
		parsed := domain.DeviceType(value)
		return parsed, domain.IsDeviceType(parsed)
	}); err != nil {
		return domain.AnalyticsQuery{}, err
	}
	if query.SourceTypes, err = parseValues(values["source"], func(value string) (domain.SourceType, bool) {
		parsed := domain.SourceType(value)
		return parsed, domain.IsSourceType(parsed)
	}); err != nil {
		return domain.AnalyticsQuery{}, err
	}
	if query.Outcomes, err = parseValues(values["outcome"], func(value string) (domain.Outcome, bool) {
		parsed := domain.Outcome(value)
		return parsed, domain.IsOutcome(parsed)
	}); err != nil {
		return domain.AnalyticsQuery{}, err
	}
	if query.Platforms, err = parseValues(values["platform"], func(value string) (domain.Platform, bool) {
		parsed := domain.Platform(value)
		return parsed, domain.IsPlatform(parsed)
	}); err != nil {
		return domain.AnalyticsQuery{}, err
	}
	if query.VersionNames, err = parseValues(values["versionName"], func(value string) (string, bool) {
		return value, value != "" && len(value) <= 64
	}); err != nil {
		return domain.AnalyticsQuery{}, err
	}
	if query.VersionCodes, err = parseValues(values["versionCode"], func(value string) (int64, bool) {
		parsed, parseErr := strconv.ParseInt(value, 10, 64)
		return parsed, parseErr == nil && parsed > 0
	}); err != nil {
		return domain.AnalyticsQuery{}, err
	}
	if err := query.Validate(); err != nil {
		return domain.AnalyticsQuery{}, err
	}
	return query, nil
}

func parseDetailsQuery(values url.Values, allowPagination bool) (domain.AnalyticsQuery, error) {
	query, err := parseOverviewQuery(values)
	if err != nil {
		return domain.AnalyticsQuery{}, err
	}
	query.EventTypes, err = parseValues(values["eventType"], func(value string) (domain.EventType, bool) {
		parsed := domain.EventType(value)
		return parsed, domain.IsEventType(parsed)
	})
	if err != nil {
		return domain.AnalyticsQuery{}, err
	}
	if allowPagination {
		query.Compare = false
		if raw := values.Get("limit"); raw != "" {
			if len(values["limit"]) != 1 {
				return domain.AnalyticsQuery{}, fmt.Errorf("invalid limit")
			}
			query.Limit, err = strconv.Atoi(raw)
			if err != nil || query.Limit < 1 || query.Limit > 100 {
				return domain.AnalyticsQuery{}, fmt.Errorf("invalid limit")
			}
		}
		if len(values["cursor"]) > 1 || len(values.Get("cursor")) > 512 {
			return domain.AnalyticsQuery{}, fmt.Errorf("invalid cursor")
		}
		query.Cursor = values.Get("cursor")
	}
	if err := query.Validate(); err != nil {
		return domain.AnalyticsQuery{}, err
	}
	return query, nil
}

func parseVisitorPagination(values url.Values) (int, string, error) {
	allowed := map[string]struct{}{"limit": {}, "cursor": {}}
	for key := range values {
		if _, ok := allowed[key]; !ok {
			return 0, "", fmt.Errorf("unsupported query")
		}
	}
	limit := 50
	var err error
	if raw := values.Get("limit"); raw != "" {
		if len(values["limit"]) != 1 {
			return 0, "", fmt.Errorf("invalid limit")
		}
		limit, err = strconv.Atoi(raw)
		if err != nil || limit < 1 || limit > 100 {
			return 0, "", fmt.Errorf("invalid limit")
		}
	}
	cursor := values.Get("cursor")
	if len(values["cursor"]) > 1 || len(cursor) > 512 {
		return 0, "", fmt.Errorf("invalid cursor")
	}
	return limit, cursor, nil
}

func parseGranularity(raw string, duration time.Duration) (domain.Granularity, error) {
	if raw == "" {
		switch {
		case duration <= 48*time.Hour:
			return domain.GranularityHour, nil
		case duration <= 90*24*time.Hour:
			return domain.GranularityDay, nil
		case duration <= 365*24*time.Hour:
			return domain.GranularityWeek, nil
		default:
			return domain.GranularityMonth, nil
		}
	}
	granularity := domain.Granularity(raw)
	if granularity != domain.GranularityHour && granularity != domain.GranularityDay && granularity != domain.GranularityWeek && granularity != domain.GranularityMonth {
		return "", fmt.Errorf("invalid granularity")
	}
	return granularity, nil
}

func parseValues[T comparable](raw []string, parse func(string) (T, bool)) ([]T, error) {
	result := make([]T, 0, len(raw))
	seen := make(map[T]struct{}, len(raw))
	for _, value := range raw {
		parsed, ok := parse(value)
		if !ok {
			return nil, fmt.Errorf("invalid filter")
		}
		if _, duplicate := seen[parsed]; duplicate {
			return nil, fmt.Errorf("duplicate filter")
		}
		seen[parsed] = struct{}{}
		result = append(result, parsed)
	}
	return result, nil
}
