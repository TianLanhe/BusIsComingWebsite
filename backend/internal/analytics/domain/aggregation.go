package domain

import (
	"math"
	"sort"
	"strconv"
	"time"
)

const SessionGap = 30 * time.Minute

// DeriveSessions 只让范围前事件参与首个会话的边界判断，不把它泄漏到返回的
// 会话明细中。相邻事件正好相隔 30 分钟仍属于同一会话，超过才拆分。
func DeriveSessions(events []AnalyticsEvent, preceding *AnalyticsEvent) []DerivedSession {
	ordered := append([]AnalyticsEvent(nil), events...)
	sort.SliceStable(ordered, func(i, j int) bool {
		if ordered[i].VisitorID != ordered[j].VisitorID {
			return ordered[i].VisitorID < ordered[j].VisitorID
		}
		if !ordered[i].OccurredAt.Equal(ordered[j].OccurredAt) {
			return ordered[i].OccurredAt.Before(ordered[j].OccurredAt)
		}
		return ordered[i].EventID < ordered[j].EventID
	})

	var sessions []DerivedSession
	ordinals := make(map[string]int)
	for _, event := range ordered {
		index := len(sessions) - 1
		continues := index >= 0 && sessions[index].Events[0].VisitorID == event.VisitorID &&
			event.OccurredAt.Sub(sessions[index].EndedAt) <= SessionGap
		if !continues {
			ordinals[event.VisitorID]++
			session := DerivedSession{
				Ordinal: ordinals[event.VisitorID], StartedAt: event.OccurredAt,
				EndedAt: event.OccurredAt, EventCount: 1, Events: []AnalyticsEvent{event},
			}
			// 范围前事件只决定当前会话是否早已开始；对外序号和起止时间仍从
			// 查询范围内第一条事件开始，避免越界明细进入私有 API。
			if preceding != nil && preceding.VisitorID == event.VisitorID &&
				event.OccurredAt.Sub(preceding.OccurredAt) <= SessionGap {
				session.Ordinal = 1
				ordinals[event.VisitorID] = 1
			}
			sessions = append(sessions, session)
			continue
		}
		sessions[index].EndedAt = event.OccurredAt
		sessions[index].EventCount++
		sessions[index].Events = append(sessions[index].Events, event)
		sessions[index].DurationMS = sessions[index].EndedAt.Sub(sessions[index].StartedAt).Milliseconds()
	}
	return sessions
}

func TrialFunnel(events []AnalyticsEvent) Funnel {
	return orderedFunnel("trial", events, []funnelStep{
		{key: "homepage", eventType: EventPageView},
		{key: "successful_place_query", eventType: EventPlaceQuery, successOnly: true},
		{key: "successful_route_query", eventType: EventRouteQuery, successOnly: true},
	})
}

func DownloadFunnel(events []AnalyticsEvent) Funnel {
	return orderedFunnel("download", events, []funnelStep{
		{key: "homepage", eventType: EventPageView},
		{key: "successful_download_response", eventType: EventDownloadRequest, successOnly: true},
	})
}

type funnelStep struct {
	key         string
	eventType   EventType
	successOnly bool
}

func orderedFunnel(key string, events []AnalyticsEvent, steps []funnelStep) Funnel {
	qualified := make([]map[string]struct{}, len(steps))
	for index := range qualified {
		qualified[index] = make(map[string]struct{})
	}
	for _, session := range DeriveSessions(events, nil) {
		next := 0
		for _, event := range session.Events {
			if next >= len(steps) {
				break
			}
			step := steps[next]
			if event.EventType != step.eventType || (step.successOnly && event.Outcome != OutcomeSuccess) {
				continue
			}
			qualified[next][event.VisitorID] = struct{}{}
			next++
		}
	}
	stages := make([]FunnelStage, 0, len(steps))
	for index, step := range steps {
		count := int64(len(qualified[index]))
		stage := FunnelStage{Key: step.key, UniqueVisitors: count}
		if index > 0 {
			stage.FromPreviousRate = ratio(count, int64(len(qualified[index-1])))
			stage.FromFirstRate = ratio(count, int64(len(qualified[0])))
		}
		stages = append(stages, stage)
	}
	return Funnel{Key: key, SessionGapMinutes: 30, Stages: stages}
}

func PreviousRange(from, to time.Time) (time.Time, time.Time) {
	return from.Add(-to.Sub(from)), from
}

// TimeBuckets 在指定时区内推进自然小时、日、周或月，再把首尾裁剪到查询范围。
// 这避免月份天数与潜在夏令时变化被固定 duration 误算。
func TimeBuckets(from, to time.Time, granularity Granularity, location *time.Location) []TimeBucket {
	if !to.After(from) {
		return nil
	}
	start := from.In(location)
	end := to.In(location)
	var buckets []TimeBucket
	for cursor := start; cursor.Before(end); {
		next := nextBucketBoundary(cursor, granularity, location)
		if next.After(end) {
			next = end
		}
		buckets = append(buckets, TimeBucket{Start: cursor, End: next})
		cursor = next
	}
	return buckets
}

func nextBucketBoundary(current time.Time, granularity Granularity, location *time.Location) time.Time {
	local := current.In(location)
	switch granularity {
	case GranularityHour:
		boundary := time.Date(local.Year(), local.Month(), local.Day(), local.Hour(), 0, 0, 0, location).Add(time.Hour)
		return boundary
	case GranularityDay:
		return time.Date(local.Year(), local.Month(), local.Day()+1, 0, 0, 0, 0, location)
	case GranularityWeek:
		days := 8 - int(local.Weekday())
		if local.Weekday() == time.Sunday {
			days = 1
		}
		return time.Date(local.Year(), local.Month(), local.Day()+days, 0, 0, 0, 0, location)
	case GranularityMonth:
		return time.Date(local.Year(), local.Month()+1, 1, 0, 0, 0, 0, location)
	default:
		return local
	}
}

// NearestRank 使用 ceil(P*N) 的 nearest-rank 定义；空样本返回 null。
func NearestRank(values []int64, percentile float64) *int64 {
	if len(values) == 0 || percentile <= 0 || percentile > 1 {
		return nil
	}
	ordered := append([]int64(nil), values...)
	sort.Slice(ordered, func(i, j int) bool { return ordered[i] < ordered[j] })
	index := int(math.Ceil(percentile*float64(len(ordered)))) - 1
	value := ordered[index]
	return &value
}

// SLISuccessRate 保留「没有请求」与「所有请求失败」两个不同的领域事实：前者
// 没有可计算的比率，后者则是实际的 0%。调用方据此避免把空桶画成失败。
func SLISuccessRate(successfulPV, totalPV int64) *float64 {
	if totalPV == 0 {
		return nil
	}
	value := float64(successfulPV) / float64(totalPV)
	return &value
}

// SLISeries 在领域层一次完成香港时间桶、固定事件顺序与空桶语义，应用层只负责 DTO 映射。
func SLISeries(events []AnalyticsEvent, buckets []TimeBucket, location *time.Location) []SLISeriesPoint {
	types := []EventType{EventPageView, EventPlaceQuery, EventRouteQuery, EventDownloadRequest}
	type counts struct{ successful, total int64 }
	grouped := make(map[string]*counts, len(buckets)*len(types))
	key := func(bucket int, eventType EventType) string { return strconv.Itoa(bucket) + ":" + string(eventType) }
	for _, event := range events {
		at := event.OccurredAt.In(location)
		for index, bucket := range buckets {
			if at.Before(bucket.Start) || !at.Before(bucket.End) {
				continue
			}
			item := grouped[key(index, event.EventType)]
			if item == nil {
				item = &counts{}
				grouped[key(index, event.EventType)] = item
			}
			item.total++
			if event.Outcome == OutcomeSuccess {
				item.successful++
			}
			break
		}
	}
	result := make([]SLISeriesPoint, 0, len(buckets)*len(types))
	for index, bucket := range buckets {
		for _, eventType := range types {
			item := grouped[key(index, eventType)]
			var successful, total int64
			if item != nil {
				successful, total = item.successful, item.total
			}
			result = append(result, SLISeriesPoint{BucketStart: bucket.Start, BucketEnd: bucket.End, EventType: eventType, SuccessfulPV: successful, TotalPV: total, SuccessRate: SLISuccessRate(successful, total)})
		}
	}
	return result
}

func ratio(numerator, denominator int64) *float64 {
	if denominator == 0 {
		return nil
	}
	value := float64(numerator) / float64(denominator)
	return &value
}
