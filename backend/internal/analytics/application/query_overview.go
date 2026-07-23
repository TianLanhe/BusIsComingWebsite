package application

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"time"

	"busiscoming-website/backend/internal/analytics/domain"
)

var ErrStorageUnavailable = errors.New("analytics storage unavailable")

type QueryOverview struct {
	store OverviewEventStore
	clock Clock
}

func NewQueryOverview(store OverviewEventStore, clock Clock) *QueryOverview {
	return &QueryOverview{store: store, clock: clock}
}

func (usecase *QueryOverview) Execute(ctx context.Context, query domain.AnalyticsQuery) (OverviewData, error) {
	if err := query.Validate(); err != nil {
		return OverviewData{}, err
	}
	currentRaw, err := usecase.store.LoadOverviewEvents(ctx, query.From, query.To)
	if err != nil {
		return OverviewData{}, fmt.Errorf("%w: load current overview events", ErrStorageUnavailable)
	}
	current := scopeEvents(currentRaw, query)
	state := domain.QueryReady
	if len(currentRaw) == 0 {
		state = domain.QueryNoData
	} else if len(current.combined) == 0 {
		state = domain.QueryNoResults
	}

	var comparisonFrom, comparisonTo *time.Time
	var previous overviewAggregate
	if query.Compare {
		from, to := domain.PreviousRange(query.From, query.To)
		comparisonFrom, comparisonTo = &from, &to
		previousRaw, loadErr := usecase.store.LoadOverviewEvents(ctx, from, to)
		if loadErr != nil {
			return OverviewData{}, fmt.Errorf("%w: load comparison overview events", ErrStorageUnavailable)
		}
		previous = aggregateOverview(scopeEvents(previousRaw, query), from, to, query.Granularity, state == domain.QueryReady)
	}

	currentAggregate := aggregateOverview(current, query.From, query.To, query.Granularity, state == domain.QueryReady)
	data := OverviewData{
		Meta: AnalyticsMeta{
			From: query.From, To: query.To, Timezone: "Asia/Hong_Kong", Granularity: query.Granularity,
			Compare: query.Compare, ComparisonFrom: comparisonFrom, ComparisonTo: comparisonTo,
			AppliedFilters: appliedFilters(query), GeneratedAt: usecase.clock.Now().UTC(), State: state,
		},
		Metrics:           buildMetrics(currentAggregate.metricValues, previous.metricValues, query.Compare, state),
		TrafficSeries:     currentAggregate.trafficSeries,
		TrialFunnel:       currentAggregate.trialFunnel,
		DownloadFunnel:    currentAggregate.downloadFunnel,
		EventComposition:  currentAggregate.eventComposition,
		Latency:           currentAggregate.latency,
		DownloadPlatforms: currentAggregate.downloadPlatforms,
		DownloadVersions:  currentAggregate.downloadVersions,
	}
	return data, nil
}

type scopedOverviewEvents struct {
	traffic  []domain.AnalyticsEvent
	download []domain.AnalyticsEvent
	combined []domain.AnalyticsEvent
}

// 平台和版本是下载事实的属性，不能让它们过滤主页 PV/UV 或路线试查。
func scopeEvents(events []domain.AnalyticsEvent, query domain.AnalyticsQuery) scopedOverviewEvents {
	result := scopedOverviewEvents{}
	for _, event := range events {
		if !matchesGlobalFilters(event, query) {
			continue
		}
		if event.EventType == domain.EventDownloadRequest {
			if matchesDownloadFilters(event, query) {
				result.download = append(result.download, event)
				result.combined = append(result.combined, event)
			}
			continue
		}
		result.traffic = append(result.traffic, event)
		result.combined = append(result.combined, event)
	}
	return result
}

func matchesGlobalFilters(event domain.AnalyticsEvent, query domain.AnalyticsQuery) bool {
	return containsOrEmpty(query.Locales, event.Locale) && containsOrEmpty(query.DeviceTypes, event.DeviceType) &&
		containsOrEmpty(query.SourceTypes, event.SourceType) && containsOrEmpty(query.Outcomes, event.Outcome) &&
		containsOrEmpty(query.EventTypes, event.EventType)
}

func matchesDownloadFilters(event domain.AnalyticsEvent, query domain.AnalyticsQuery) bool {
	if len(query.Platforms) == 0 && len(query.VersionNames) == 0 && len(query.VersionCodes) == 0 {
		return true
	}
	if event.Download == nil {
		return false
	}
	return containsOrEmpty(query.Platforms, event.Download.Platform) &&
		containsOrEmpty(query.VersionNames, event.Download.VersionName) &&
		containsOrEmpty(query.VersionCodes, event.Download.VersionCode)
}

func containsOrEmpty[T comparable](values []T, target T) bool {
	if len(values) == 0 {
		return true
	}
	for _, value := range values {
		if value == target {
			return true
		}
	}
	return false
}

type overviewAggregate struct {
	metricValues      map[string]float64
	trafficSeries     []domain.TrafficSeriesPoint
	trialFunnel       domain.Funnel
	downloadFunnel    domain.Funnel
	eventComposition  []domain.DistributionItem
	latency           domain.LatencySummary
	downloadPlatforms []domain.DistributionItem
	downloadVersions  []domain.VersionDistribution
}

func aggregateOverview(events scopedOverviewEvents, from, to time.Time, granularity domain.Granularity, includeSeries bool) overviewAggregate {
	pageVisitors := make(map[string]struct{})
	pv := int64(0)
	successfulRoutes := int64(0)
	for _, event := range events.traffic {
		if event.EventType == domain.EventPageView {
			pv++
			pageVisitors[event.VisitorID] = struct{}{}
		}
		if event.EventType == domain.EventRouteQuery && event.Outcome == domain.OutcomeSuccess {
			successfulRoutes++
		}
	}
	downloadRequests := int64(len(events.download))
	successes := int64(0)
	latencies := make([]int64, 0, len(events.combined))
	for _, event := range events.combined {
		if event.Outcome == domain.OutcomeSuccess {
			successes++
		}
		latencies = append(latencies, event.DurationMS)
	}
	uv := int64(len(pageVisitors))
	values := map[string]float64{
		"pv":                     float64(pv),
		"uv":                     float64(uv),
		"viewsPerVisitor":        safeDivide(pv, uv),
		"successfulRouteQueries": float64(successfulRoutes),
		"downloadRequests":       float64(downloadRequests),
		"requestSuccessRate":     safeDivide(successes, int64(len(events.combined))),
	}
	combinedForDownloadFunnel := append(append([]domain.AnalyticsEvent(nil), events.traffic...), events.download...)
	result := overviewAggregate{
		metricValues: values,
		trialFunnel:  domain.TrialFunnel(events.traffic), downloadFunnel: domain.DownloadFunnel(combinedForDownloadFunnel),
		eventComposition:  distributionByEventType(events.combined),
		latency:           domain.LatencySummary{RequestCount: int64(len(latencies)), P50MS: domain.NearestRank(latencies, .5), P95MS: domain.NearestRank(latencies, .95)},
		downloadPlatforms: distributionByPlatform(events.download), downloadVersions: distributionByVersion(events.download),
	}
	if includeSeries {
		result.trafficSeries = buildTrafficSeries(events.traffic, from, to, granularity)
	} else {
		result.trafficSeries = []domain.TrafficSeriesPoint{}
	}
	return result
}

func buildMetrics(current, previous map[string]float64, compare bool, state domain.QueryState) []domain.Metric {
	keys := []string{"pv", "uv", "viewsPerVisitor", "successfulRouteQueries", "downloadRequests", "requestSuccessRate"}
	metrics := make([]domain.Metric, 0, len(keys))
	for _, key := range keys {
		metric := domain.Metric{Key: key}
		if state == domain.QueryReady {
			value := current[key]
			metric.Value = &value
		}
		if compare {
			previousValue := previous[key]
			metric.PreviousValue = &previousValue
			if metric.Value != nil {
				delta := *metric.Value - previousValue
				metric.Delta = &delta
				if previousValue != 0 {
					deltaRate := delta / previousValue
					metric.DeltaRate = &deltaRate
				}
			}
		}
		metrics = append(metrics, metric)
	}
	return metrics
}

func buildTrafficSeries(events []domain.AnalyticsEvent, from, to time.Time, granularity domain.Granularity) []domain.TrafficSeriesPoint {
	location, err := time.LoadLocation("Asia/Hong_Kong")
	if err != nil {
		return []domain.TrafficSeriesPoint{}
	}
	buckets := domain.TimeBuckets(from, to, granularity, location)
	points := make([]domain.TrafficSeriesPoint, len(buckets))
	for index, bucket := range buckets {
		pageVisitors := make(map[string]struct{})
		placeVisitors := make(map[string]struct{})
		routeVisitors := make(map[string]struct{})
		pv := int64(0)
		for _, event := range events {
			at := event.OccurredAt.In(location)
			if at.Before(bucket.Start) || !at.Before(bucket.End) {
				continue
			}
			switch event.EventType {
			case domain.EventPageView:
				pv++
				pageVisitors[event.VisitorID] = struct{}{}
			case domain.EventPlaceQuery:
				if event.Outcome == domain.OutcomeSuccess {
					placeVisitors[event.VisitorID] = struct{}{}
				}
			case domain.EventRouteQuery:
				if event.Outcome == domain.OutcomeSuccess {
					routeVisitors[event.VisitorID] = struct{}{}
				}
			}
		}
		points[index] = domain.TrafficSeriesPoint{
			BucketStart: bucket.Start, BucketEnd: bucket.End, PV: pv, UV: int64(len(pageVisitors)),
			SuccessfulPlaceVisitors: int64(len(placeVisitors)), SuccessfulRouteVisitors: int64(len(routeVisitors)),
		}
	}
	return points
}

func distributionByEventType(events []domain.AnalyticsEvent) []domain.DistributionItem {
	counts := make(map[string]int64)
	for _, event := range events {
		counts[string(event.EventType)]++
	}
	return distributions(counts)
}

func distributionByPlatform(events []domain.AnalyticsEvent) []domain.DistributionItem {
	counts := make(map[string]int64)
	for _, event := range events {
		if event.Download != nil {
			counts[string(event.Download.Platform)]++
		}
	}
	return distributions(counts)
}

func distributions(counts map[string]int64) []domain.DistributionItem {
	total := int64(0)
	keys := make([]string, 0, len(counts))
	for key, count := range counts {
		total += count
		keys = append(keys, key)
	}
	sort.Strings(keys)
	items := make([]domain.DistributionItem, 0, len(keys))
	for _, key := range keys {
		items = append(items, domain.DistributionItem{Key: key, Count: counts[key], Ratio: ratioFloat(counts[key], total)})
	}
	return items
}

func distributionByVersion(events []domain.AnalyticsEvent) []domain.VersionDistribution {
	type key struct {
		platform domain.Platform
		name     string
		code     int64
		size     int64
	}
	type accumulator struct {
		requests int64
		success  int64
		visitors map[string]struct{}
	}
	values := make(map[key]*accumulator)
	for _, event := range events {
		if event.Download == nil || event.Download.VersionName == "" || event.Download.VersionCode <= 0 || event.Download.SizeBytes <= 0 {
			continue
		}
		itemKey := key{event.Download.Platform, event.Download.VersionName, event.Download.VersionCode, event.Download.SizeBytes}
		item := values[itemKey]
		if item == nil {
			item = &accumulator{visitors: make(map[string]struct{})}
			values[itemKey] = item
		}
		item.requests++
		if event.Outcome == domain.OutcomeSuccess {
			item.success++
		}
		item.visitors[event.VisitorID] = struct{}{}
	}
	keys := make([]key, 0, len(values))
	for itemKey := range values {
		keys = append(keys, itemKey)
	}
	sort.Slice(keys, func(i, j int) bool {
		if keys[i].platform != keys[j].platform {
			return keys[i].platform < keys[j].platform
		}
		if keys[i].code != keys[j].code {
			return keys[i].code > keys[j].code
		}
		return keys[i].name < keys[j].name
	})
	result := make([]domain.VersionDistribution, 0, len(keys))
	for _, itemKey := range keys {
		item := values[itemKey]
		result = append(result, domain.VersionDistribution{
			Platform: itemKey.platform, VersionName: itemKey.name, VersionCode: itemKey.code,
			RequestCount: item.requests, SuccessfulResponses: item.success, UV: int64(len(item.visitors)), SizeBytes: itemKey.size,
		})
	}
	return result
}

func safeDivide(numerator, denominator int64) float64 {
	if denominator == 0 {
		return 0
	}
	return float64(numerator) / float64(denominator)
}

func ratioFloat(numerator, denominator int64) *float64 {
	if denominator == 0 {
		return nil
	}
	value := safeDivide(numerator, denominator)
	return &value
}

func appliedFilters(query domain.AnalyticsQuery) AppliedFilters {
	return AppliedFilters{
		Locales: nonNil(query.Locales), Devices: nonNil(query.DeviceTypes), Sources: nonNil(query.SourceTypes),
		Outcomes: nonNil(query.Outcomes), Platforms: nonNil(query.Platforms), VersionNames: nonNil(query.VersionNames),
		VersionCodes: nonNil(query.VersionCodes), EventTypes: nonNil(query.EventTypes),
	}
}

func nonNil[T any](values []T) []T {
	if values == nil {
		return []T{}
	}
	return values
}
