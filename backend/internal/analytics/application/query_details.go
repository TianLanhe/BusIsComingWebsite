package application

import (
	"context"
	"encoding/base64"
	"encoding/binary"
	"errors"
	"fmt"
	"sort"
	"strconv"
	"time"

	"busiscoming-website/backend/internal/analytics/domain"
)

var (
	ErrInvalidCursor   = errors.New("analytics cursor invalid")
	ErrVisitorNotFound = errors.New("analytics visitor not found")
)

type QueryDetails struct {
	store    DetailsStore
	health   RuntimeHealthReader
	clock    Clock
	listener ListenerStateReader
}

func NewQueryDetails(store DetailsStore, health RuntimeHealthReader, clock Clock, listener ListenerStateReader) *QueryDetails {
	return &QueryDetails{store: store, health: health, clock: clock, listener: listener}
}

func EncodeEventCursor(cursor domain.EventCursor) string {
	buffer := make([]byte, 16)
	binary.BigEndian.PutUint64(buffer[:8], uint64(cursor.OccurredAt.UTC().UnixMilli()))
	binary.BigEndian.PutUint64(buffer[8:], uint64(cursor.EventID))
	return base64.RawURLEncoding.EncodeToString(buffer)
}

func DecodeEventCursor(encoded string) (domain.EventCursor, error) {
	buffer, err := base64.RawURLEncoding.DecodeString(encoded)
	if err != nil || len(buffer) != 16 {
		return domain.EventCursor{}, ErrInvalidCursor
	}
	milliseconds := int64(binary.BigEndian.Uint64(buffer[:8]))
	eventID := int64(binary.BigEndian.Uint64(buffer[8:]))
	if eventID <= 0 {
		return domain.EventCursor{}, ErrInvalidCursor
	}
	return domain.EventCursor{OccurredAt: time.UnixMilli(milliseconds).UTC(), EventID: eventID}, nil
}

func (usecase *QueryDetails) Traffic(ctx context.Context, query domain.AnalyticsQuery) (TrafficData, error) {
	if err := query.Validate(); err != nil {
		return TrafficData{}, err
	}
	raw, err := usecase.loadEvents(ctx, query.From, query.To)
	if err != nil {
		return TrafficData{}, err
	}
	currentScope := scopeEvents(raw, query)
	state := queryState(len(raw), len(currentScope.traffic))
	current := aggregateOverview(currentScope, query.From, query.To, query.Granularity, state == domain.QueryReady)
	currentValues := trafficMetricValues(currentScope.traffic)
	previousValues, previousAvailable, comparisonFrom, comparisonTo, err := usecase.comparisonValues(ctx, query, func(events scopedOverviewEvents) (map[string]float64, bool) {
		return trafficMetricValues(events.traffic), len(events.traffic) > 0
	})
	if err != nil {
		return TrafficData{}, err
	}
	return TrafficData{
		Meta:    metaFor(query, state, comparisonFrom, comparisonTo, usecase.now()),
		Metrics: buildMetricsForKeys(currentValues, previousValues, query.Compare, state, []string{"pv", "uv", "successfulPlaceVisitors", "successfulRouteVisitors", "placeQueryRequests", "routeQueryRequests"}, previousAvailable),
		Series:  current.trafficSeries, TrialFunnel: current.trialFunnel, Heatmap: trafficHeatmap(currentScope.traffic, query.From, query.To),
		Locales: visitorDistribution(currentScope.traffic, func(event domain.AnalyticsEvent) string { return string(event.Locale) }),
		Devices: visitorDistribution(currentScope.traffic, func(event domain.AnalyticsEvent) string { return string(event.DeviceType) }),
		Sources: visitorDistribution(currentScope.traffic, func(event domain.AnalyticsEvent) string { return string(event.SourceType) }),
	}, nil
}

func (usecase *QueryDetails) Downloads(ctx context.Context, query domain.AnalyticsQuery) (DownloadsData, error) {
	if err := query.Validate(); err != nil {
		return DownloadsData{}, err
	}
	raw, err := usecase.loadEvents(ctx, query.From, query.To)
	if err != nil {
		return DownloadsData{}, err
	}
	scoped := scopeEvents(raw, query)
	state := queryState(len(raw), len(scoped.download))
	currentValues := downloadMetricValues(scoped.download)
	previousValues, previousAvailable, comparisonFrom, comparisonTo, err := usecase.comparisonValues(ctx, query, func(events scopedOverviewEvents) (map[string]float64, bool) {
		return downloadMetricValues(events.download), len(events.download) > 0
	})
	if err != nil {
		return DownloadsData{}, err
	}
	combined := append(append([]domain.AnalyticsEvent(nil), scoped.traffic...), scoped.download...)
	return DownloadsData{
		Meta:           metaFor(query, state, comparisonFrom, comparisonTo, usecase.now()),
		Metrics:        buildMetricsForKeys(currentValues, previousValues, query.Compare, state, []string{"downloadRequests", "successfulDownloadResponses", "downloadUV", "downloadSuccessRate"}, previousAvailable),
		Series:         downloadSeries(scoped.download, query.From, query.To, query.Granularity, state == domain.QueryReady),
		DownloadFunnel: domain.DownloadFunnel(combined), Platforms: distributionByPlatform(scoped.download),
		Versions: distributionByVersion(scoped.download), Failures: failureDistribution(scoped.download),
	}, nil
}

func (usecase *QueryDetails) Events(ctx context.Context, query domain.AnalyticsQuery, visitorID string) (EventListData, error) {
	if query.Granularity == "" {
		query.Granularity = domain.GranularityDay
	}
	if err := query.Validate(); err != nil {
		return EventListData{}, err
	}
	if visitorID != "" && !domain.IsVisitorID(visitorID) {
		return EventListData{}, domain.ValidationError{Field: "visitorId", Rule: "invalid_format"}
	}
	limit := query.Limit
	if limit == 0 {
		limit = 50
	}
	var cursor *domain.EventCursor
	if query.Cursor != "" {
		decoded, err := DecodeEventCursor(query.Cursor)
		if err != nil {
			return EventListData{}, err
		}
		cursor = &decoded
	}
	if usecase.store == nil {
		return EventListData{}, ErrStorageUnavailable
	}
	page, err := usecase.store.ListEvents(ctx, EventListRequest{Query: query, VisitorID: visitorID, Cursor: cursor, Limit: limit})
	if err != nil {
		return EventListData{}, fmt.Errorf("%w: list events", ErrStorageUnavailable)
	}
	state := domain.QueryReady
	if page.Summary.TotalCount == 0 {
		if hasEventFilters(query) || visitorID != "" {
			state = domain.QueryNoResults
		} else {
			state = domain.QueryNoData
		}
	}
	return EventListData{
		Meta: metaFor(query, state, nil, nil, usecase.now()), Summary: page.Summary, Items: eventDetails(page.Items),
		PageInfo: pageInfo(limit, page.Summary.TotalCount, page.HasMore, page.Items),
	}, nil
}

func (usecase *QueryDetails) Visitor(ctx context.Context, visitorID string, limit int, encodedCursor string) (VisitorData, error) {
	if !domain.IsVisitorID(visitorID) {
		return VisitorData{}, domain.ValidationError{Field: "visitorId", Rule: "invalid_format"}
	}
	if limit == 0 {
		limit = 50
	}
	if limit < 1 || limit > 100 {
		return VisitorData{}, domain.ValidationError{Field: "limit", Rule: "out_of_range"}
	}
	var cursor *domain.EventCursor
	if encodedCursor != "" {
		decoded, err := DecodeEventCursor(encodedCursor)
		if err != nil {
			return VisitorData{}, err
		}
		cursor = &decoded
	}
	if usecase.store == nil {
		return VisitorData{}, ErrStorageUnavailable
	}
	events, err := usecase.store.LoadVisitorEvents(ctx, visitorID)
	if err != nil {
		return VisitorData{}, fmt.Errorf("%w: load visitor", ErrStorageUnavailable)
	}
	if len(events) == 0 {
		return VisitorData{}, ErrVisitorNotFound
	}
	sortEventsAscending(events)
	allSessions := domain.DeriveSessions(events, nil)
	descending := append([]domain.AnalyticsEvent(nil), events...)
	sort.Slice(descending, func(i, j int) bool { return eventAfter(descending[i], descending[j]) })
	if cursor != nil {
		descending = filterAfterCursor(descending, *cursor)
	}
	hasMore := len(descending) > limit
	if hasMore {
		descending = descending[:limit]
	}
	selected := make(map[int64]struct{}, len(descending))
	for _, event := range descending {
		selected[event.EventID] = struct{}{}
	}
	return VisitorData{
		GeneratedAt: usecase.now(), Timezone: "Asia/Hong_Kong",
		Visitor: visitorSummary(events, int64(len(allSessions))), Sessions: selectedSessions(allSessions, selected),
		PageInfo: pageInfo(limit, int64(len(events)), hasMore, descending),
	}, nil
}

func (usecase *QueryDetails) Performance(ctx context.Context, query domain.AnalyticsQuery) (PerformanceData, error) {
	if err := query.Validate(); err != nil {
		return PerformanceData{}, err
	}
	raw, err := usecase.loadEvents(ctx, query.From, query.To)
	if err != nil {
		return PerformanceData{}, err
	}
	scoped := scopeEvents(raw, query)
	state := queryState(len(raw), len(scoped.combined))
	currentValues := performanceMetricValues(scoped.combined)
	previousValues, previousAvailable, comparisonFrom, comparisonTo, err := usecase.comparisonValues(ctx, query, func(events scopedOverviewEvents) (map[string]float64, bool) {
		return performanceMetricValues(events.combined), len(events.combined) > 0
	})
	if err != nil {
		return PerformanceData{}, err
	}
	return PerformanceData{
		Meta:      metaFor(query, state, comparisonFrom, comparisonTo, usecase.now()),
		Metrics:   buildMetricsForKeys(currentValues, previousValues, query.Compare, state, []string{"requestCount", "requestSuccessRate", "p50Ms", "p95Ms"}, previousAvailable),
		Endpoints: endpointPerformance(scoped.combined), LatencySeries: latencySeries(scoped.combined, query.From, query.To, query.Granularity, state == domain.QueryReady),
		Failures: failureDistribution(scoped.combined),
	}, nil
}

func (usecase *QueryDetails) System(ctx context.Context) SystemData {
	snapshot := RuntimeHealthSnapshot{DatabaseState: DatabaseUnavailable, ProcessStartedAt: usecase.now()}
	if usecase.health != nil {
		snapshot = usecase.health.Snapshot()
	}
	database := DatabaseStatus{State: snapshot.DatabaseState, LastSuccessfulWriteAt: snapshot.LastSuccessfulWriteAt}
	if usecase.store != nil {
		storage, err := usecase.store.ReadStorageSnapshot(ctx)
		if err != nil {
			database.State = DatabaseUnavailable
		} else {
			database.RowCount, database.SizeBytes = storage.DatabaseRowCount, storage.DatabaseSizeBytes
		}
	}
	listenerState := "starting"
	if usecase.listener != nil {
		listenerState = usecase.listener.State()
	}
	return SystemData{
		GeneratedAt: usecase.now(), Database: database,
		Process:         ProcessStatus{StartedAt: snapshot.ProcessStartedAt, DroppedSinceStart: snapshot.DroppedSinceStart},
		PrivateListener: PrivateListenerStatus{State: listenerState, BindAddress: "127.0.0.1:18081", PublicProxy: false},
	}
}

func (usecase *QueryDetails) loadEvents(ctx context.Context, from, to time.Time) ([]domain.AnalyticsEvent, error) {
	if usecase.store == nil {
		return nil, ErrStorageUnavailable
	}
	events, err := usecase.store.LoadOverviewEvents(ctx, from, to)
	if err != nil {
		return nil, fmt.Errorf("%w: load analytics details", ErrStorageUnavailable)
	}
	return events, nil
}

func (usecase *QueryDetails) now() time.Time {
	if usecase.clock == nil {
		return time.Now().UTC()
	}
	return usecase.clock.Now().UTC()
}

func (usecase *QueryDetails) comparisonValues(ctx context.Context, query domain.AnalyticsQuery, aggregate func(scopedOverviewEvents) (map[string]float64, bool)) (map[string]float64, bool, *time.Time, *time.Time, error) {
	if !query.Compare {
		return map[string]float64{}, false, nil, nil, nil
	}
	from, to := domain.PreviousRange(query.From, query.To)
	raw, err := usecase.loadEvents(ctx, from, to)
	if err != nil {
		return nil, false, nil, nil, err
	}
	values, available := aggregate(scopeEvents(raw, query))
	return values, available, &from, &to, nil
}

func metaFor(query domain.AnalyticsQuery, state domain.QueryState, comparisonFrom, comparisonTo *time.Time, generatedAt time.Time) AnalyticsMeta {
	return AnalyticsMeta{From: query.From, To: query.To, Timezone: "Asia/Hong_Kong", Granularity: query.Granularity, Compare: query.Compare, ComparisonFrom: comparisonFrom, ComparisonTo: comparisonTo, AppliedFilters: appliedFilters(query), GeneratedAt: generatedAt, State: state}
}

func queryState(rawCount, filteredCount int) domain.QueryState {
	if rawCount == 0 {
		return domain.QueryNoData
	}
	if filteredCount == 0 {
		return domain.QueryNoResults
	}
	return domain.QueryReady
}

func trafficMetricValues(events []domain.AnalyticsEvent) map[string]float64 {
	pageVisitors, placeVisitors, routeVisitors := map[string]struct{}{}, map[string]struct{}{}, map[string]struct{}{}
	var pv, placeRequests, routeRequests int64
	for _, event := range events {
		switch event.EventType {
		case domain.EventPageView:
			pv++
			pageVisitors[event.VisitorID] = struct{}{}
		case domain.EventPlaceQuery:
			placeRequests++
			if event.Outcome == domain.OutcomeSuccess {
				placeVisitors[event.VisitorID] = struct{}{}
			}
		case domain.EventRouteQuery:
			routeRequests++
			if event.Outcome == domain.OutcomeSuccess {
				routeVisitors[event.VisitorID] = struct{}{}
			}
		}
	}
	return map[string]float64{"pv": float64(pv), "uv": float64(len(pageVisitors)), "successfulPlaceVisitors": float64(len(placeVisitors)), "successfulRouteVisitors": float64(len(routeVisitors)), "placeQueryRequests": float64(placeRequests), "routeQueryRequests": float64(routeRequests)}
}

func downloadMetricValues(events []domain.AnalyticsEvent) map[string]float64 {
	visitors := make(map[string]struct{})
	var successes int64
	for _, event := range events {
		visitors[event.VisitorID] = struct{}{}
		if event.Outcome == domain.OutcomeSuccess {
			successes++
		}
	}
	return map[string]float64{"downloadRequests": float64(len(events)), "successfulDownloadResponses": float64(successes), "downloadUV": float64(len(visitors)), "downloadSuccessRate": safeDivide(successes, int64(len(events)))}
}

func performanceMetricValues(events []domain.AnalyticsEvent) map[string]float64 {
	var successes int64
	durations := make([]int64, 0, len(events))
	for _, event := range events {
		if event.Outcome == domain.OutcomeSuccess {
			successes++
		}
		durations = append(durations, event.DurationMS)
	}
	p50, p95 := domain.NearestRank(durations, .5), domain.NearestRank(durations, .95)
	values := map[string]float64{"requestCount": float64(len(events)), "requestSuccessRate": safeDivide(successes, int64(len(events)))}
	if p50 != nil {
		values["p50Ms"] = float64(*p50)
	}
	if p95 != nil {
		values["p95Ms"] = float64(*p95)
	}
	return values
}

func buildMetricsForKeys(current, previous map[string]float64, compare bool, state domain.QueryState, keys []string, previousAvailable bool) []domain.Metric {
	metrics := make([]domain.Metric, 0, len(keys))
	for _, key := range keys {
		metric := domain.Metric{Key: key}
		if state == domain.QueryReady {
			value := current[key]
			metric.Value = &value
		}
		if compare && previousAvailable {
			before := previous[key]
			metric.PreviousValue = &before
			if metric.Value != nil {
				delta := *metric.Value - before
				metric.Delta = &delta
				if before != 0 {
					rate := delta / before
					metric.DeltaRate = &rate
				}
			}
		}
		metrics = append(metrics, metric)
	}
	return metrics
}

func trafficHeatmap(events []domain.AnalyticsEvent, from, to time.Time) []HeatmapCell {
	location, _ := time.LoadLocation("Asia/Hong_Kong")
	type accumulator struct {
		count    int64
		visitors map[string]struct{}
	}
	buckets := domain.TimeBuckets(from, to, domain.GranularityDay, location)
	result := make([]HeatmapCell, 0, len(buckets))
	for _, bucket := range buckets {
		item := accumulator{visitors: make(map[string]struct{})}
		for _, event := range events {
			if event.OccurredAt.Before(bucket.Start) || !event.OccurredAt.Before(bucket.End) {
				continue
			}
			item.count++
			item.visitors[event.VisitorID] = struct{}{}
		}
		// 首尾桶沿用查询的半开边界，中间桶严格按香港自然日 00:00 切分。
		result = append(result, HeatmapCell{
			LocalDate:   bucket.Start.In(location).Format("2006-01-02"),
			BucketStart: bucket.Start,
			BucketEnd:   bucket.End,
			EventCount:  item.count,
			UV:          int64(len(item.visitors)),
		})
	}
	return result
}

func visitorDistribution(events []domain.AnalyticsEvent, keyFor func(domain.AnalyticsEvent) string) []domain.DistributionItem {
	sets := make(map[string]map[string]struct{})
	for _, event := range events {
		key := keyFor(event)
		if sets[key] == nil {
			sets[key] = make(map[string]struct{})
		}
		sets[key][event.VisitorID] = struct{}{}
	}
	counts := make(map[string]int64, len(sets))
	for key, visitors := range sets {
		counts[key] = int64(len(visitors))
	}
	return distributions(counts)
}

func downloadSeries(events []domain.AnalyticsEvent, from, to time.Time, granularity domain.Granularity, include bool) []DownloadSeriesPoint {
	if !include {
		return []DownloadSeriesPoint{}
	}
	location, _ := time.LoadLocation("Asia/Hong_Kong")
	buckets := domain.TimeBuckets(from, to, granularity, location)
	result := make([]DownloadSeriesPoint, len(buckets))
	for index, bucket := range buckets {
		visitors := make(map[string]struct{})
		point := DownloadSeriesPoint{BucketStart: bucket.Start, BucketEnd: bucket.End}
		for _, event := range events {
			at := event.OccurredAt.In(location)
			if at.Before(bucket.Start) || !at.Before(bucket.End) {
				continue
			}
			point.Requests++
			if event.Outcome == domain.OutcomeSuccess {
				point.SuccessfulResponses++
			}
			visitors[event.VisitorID] = struct{}{}
		}
		point.UV = int64(len(visitors))
		result[index] = point
	}
	return result
}

func failureDistribution(events []domain.AnalyticsEvent) []domain.DistributionItem {
	counts := make(map[string]int64)
	for _, event := range events {
		if event.Outcome == domain.OutcomeFailure && event.FailureCategory != nil {
			counts[string(*event.FailureCategory)]++
		}
	}
	return distributions(counts)
}

func endpointPerformance(events []domain.AnalyticsEvent) []EndpointPerformance {
	definitions := []struct {
		operation string
		eventType domain.EventType
	}{{"getLatestAndroidApkMetadata", domain.EventPageView}, {"queryRoutePlaces", domain.EventPlaceQuery}, {"queryRouteOptions", domain.EventRouteQuery}, {"downloadLatestAndroidApk", domain.EventDownloadRequest}}
	result := make([]EndpointPerformance, 0, len(definitions))
	for _, definition := range definitions {
		var selected []domain.AnalyticsEvent
		for _, event := range events {
			if event.EventType == definition.eventType {
				selected = append(selected, event)
			}
		}
		durations := make([]int64, 0, len(selected))
		var successes int64
		for _, event := range selected {
			durations = append(durations, event.DurationMS)
			if event.Outcome == domain.OutcomeSuccess {
				successes++
			}
		}
		result = append(result, EndpointPerformance{OperationID: definition.operation, EventType: definition.eventType, RequestCount: int64(len(selected)), SuccessRate: ratioFloat(successes, int64(len(selected))), P50MS: domain.NearestRank(durations, .5), P95MS: domain.NearestRank(durations, .95)})
	}
	return result
}

func latencySeries(events []domain.AnalyticsEvent, from, to time.Time, granularity domain.Granularity, include bool) []LatencySeriesPoint {
	if !include {
		return []LatencySeriesPoint{}
	}
	location, _ := time.LoadLocation("Asia/Hong_Kong")
	buckets := domain.TimeBuckets(from, to, granularity, location)
	types := []domain.EventType{domain.EventPageView, domain.EventPlaceQuery, domain.EventRouteQuery, domain.EventDownloadRequest}
	result := make([]LatencySeriesPoint, 0, len(buckets)*len(types))
	for _, bucket := range buckets {
		for _, eventType := range types {
			durations := []int64{}
			for _, event := range events {
				at := event.OccurredAt.In(location)
				if event.EventType == eventType && !at.Before(bucket.Start) && at.Before(bucket.End) {
					durations = append(durations, event.DurationMS)
				}
			}
			result = append(result, LatencySeriesPoint{BucketStart: bucket.Start, BucketEnd: bucket.End, EventType: eventType, RequestCount: int64(len(durations)), P50MS: domain.NearestRank(durations, .5), P95MS: domain.NearestRank(durations, .95)})
		}
	}
	return result
}

func eventDetails(events []domain.AnalyticsEvent) []EventDetail {
	result := make([]EventDetail, 0, len(events))
	for _, event := range events {
		result = append(result, eventDetail(event))
	}
	return result
}
func eventDetail(event domain.AnalyticsEvent) EventDetail {
	return EventDetail{EventID: strconv.FormatInt(event.EventID, 10), OccurredAt: event.OccurredAt, VisitorID: event.VisitorID, EventType: event.EventType, Outcome: event.Outcome, HTTPStatus: event.HTTPStatus, StatusClass: event.StatusClass, FailureCategory: event.FailureCategory, DurationMS: event.DurationMS, Locale: event.Locale, DeviceType: event.DeviceType, SourceType: event.SourceType, Download: event.Download}
}

func pageInfo(limit int, total int64, hasMore bool, events []domain.AnalyticsEvent) PageInfo {
	var next *string
	if hasMore && len(events) > 0 {
		value := EncodeEventCursor(domain.EventCursor{OccurredAt: events[len(events)-1].OccurredAt, EventID: events[len(events)-1].EventID})
		next = &value
	}
	return PageInfo{Limit: limit, NextCursor: next, HasMore: hasMore, TotalCount: total}
}

func visitorSummary(events []domain.AnalyticsEvent, sessions int64) VisitorSummaryData {
	composition := make(map[string]int64)
	platforms := make(map[domain.Platform]int)
	for _, event := range events {
		composition[string(event.EventType)]++
		if event.Download != nil {
			platforms[event.Download.Platform]++
		}
	}
	var commonPlatform *domain.Platform
	if len(platforms) > 0 {
		value := mostCommon(platforms)
		commonPlatform = &value
	}
	return VisitorSummaryData{
		VisitorID: events[0].VisitorID, FirstSeenAt: events[0].OccurredAt, LastSeenAt: events[len(events)-1].OccurredAt,
		EventCount: int64(len(events)), SessionCount: sessions, CommonLocale: commonLocale(events), CommonDeviceType: commonDevice(events), CommonSourceType: commonSource(events),
		EventComposition: distributions(composition), CommonPlatform: commonPlatform,
	}
}
func commonLocale(events []domain.AnalyticsEvent) domain.Locale {
	counts := map[domain.Locale]int{}
	for _, e := range events {
		counts[e.Locale]++
	}
	return mostCommon(counts)
}
func commonDevice(events []domain.AnalyticsEvent) domain.DeviceType {
	counts := map[domain.DeviceType]int{}
	for _, e := range events {
		counts[e.DeviceType]++
	}
	return mostCommon(counts)
}
func commonSource(events []domain.AnalyticsEvent) domain.SourceType {
	counts := map[domain.SourceType]int{}
	for _, e := range events {
		counts[e.SourceType]++
	}
	return mostCommon(counts)
}
func mostCommon[T ~string](counts map[T]int) T {
	var result T
	best := -1
	keys := make([]string, 0, len(counts))
	for key := range counts {
		keys = append(keys, string(key))
	}
	sort.Strings(keys)
	for _, text := range keys {
		key := T(text)
		if counts[key] > best {
			best, result = counts[key], key
		}
	}
	return result
}

func selectedSessions(sessions []domain.DerivedSession, selected map[int64]struct{}) []SessionDetail {
	result := []SessionDetail{}
	for _, session := range sessions {
		events := []domain.AnalyticsEvent{}
		for _, event := range session.Events {
			if _, ok := selected[event.EventID]; ok {
				events = append(events, event)
			}
		}
		if len(events) == 0 {
			continue
		}
		result = append(result, SessionDetail{Ordinal: session.Ordinal, StartedAt: events[0].OccurredAt, EndedAt: events[len(events)-1].OccurredAt, DurationMS: events[len(events)-1].OccurredAt.Sub(events[0].OccurredAt).Milliseconds(), EventCount: len(events), Events: eventDetails(events)})
	}
	return result
}
func sortEventsAscending(events []domain.AnalyticsEvent) {
	sort.SliceStable(events, func(i, j int) bool {
		if events[i].OccurredAt.Equal(events[j].OccurredAt) {
			return events[i].EventID < events[j].EventID
		}
		return events[i].OccurredAt.Before(events[j].OccurredAt)
	})
}
func eventAfter(left, right domain.AnalyticsEvent) bool {
	if left.OccurredAt.Equal(right.OccurredAt) {
		return left.EventID > right.EventID
	}
	return left.OccurredAt.After(right.OccurredAt)
}
func filterAfterCursor(events []domain.AnalyticsEvent, cursor domain.EventCursor) []domain.AnalyticsEvent {
	result := events[:0]
	for _, event := range events {
		if event.OccurredAt.Before(cursor.OccurredAt) || (event.OccurredAt.Equal(cursor.OccurredAt) && event.EventID < cursor.EventID) {
			result = append(result, event)
		}
	}
	return result
}
func hasEventFilters(query domain.AnalyticsQuery) bool {
	return len(query.Locales)+len(query.DeviceTypes)+len(query.SourceTypes)+len(query.Outcomes)+len(query.Platforms)+len(query.VersionNames)+len(query.VersionCodes)+len(query.EventTypes) > 0
}
