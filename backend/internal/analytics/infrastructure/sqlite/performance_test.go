package sqlite

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"testing"
	"time"

	analyticsapp "busiscoming-website/backend/internal/analytics/application"
	"busiscoming-website/backend/internal/analytics/domain"
)

const millionRowTestEnv = "BUS_RUN_MILLION_ROW_TEST"

func TestMillionRowCommonQueriesUseIndexesAndFinishWithinOneSecond(t *testing.T) {
	if os.Getenv(millionRowTestEnv) != "1" {
		t.Skip("set BUS_RUN_MILLION_ROW_TEST=1 to run the explicit one-million-row acceptance test")
	}

	ctx := context.Background()
	store, err := Open(ctx, filepath.Join(t.TempDir(), "analytics.sqlite"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = store.Close() })

	base := time.Date(2023, 1, 1, 0, 0, 0, 0, time.UTC)
	insertMillionAnalyticsEvents(t, store.db, base)
	to := base.AddDate(0, 0, 1000)
	from := to.AddDate(0, 0, -30)

	overviewBuilder := newEventQueryBuilder(from, to)
	overviewSQL, overviewArgs := overviewBuilder.selectSQL("ASC")
	assertQueryPlanUsesIndex(t, store.db, overviewSQL, overviewArgs, "idx_analytics_events_time")
	summarySQL, summaryArgs := overviewBuilder.summarySQL()
	assertQueryPlanUsesIndex(t, store.db, summarySQL, summaryArgs, "idx_analytics_events_time")
	assertQueryPlanUsesIndex(t, store.db,
		"SELECT "+eventColumns+" FROM analytics_events WHERE visitor_id = ? ORDER BY occurred_at_ms ASC, id ASC",
		[]any{millionRowVisitorID(17)}, "idx_analytics_events_visitor_time")

	overview := analyticsapp.NewQueryOverview(store, analyticsapp.ClockFunc(func() time.Time { return to }))
	assertP95FinishesWithinOneSecond(t, "近 30 天总览", func() error {
		data, queryErr := overview.Execute(ctx, domain.AnalyticsQuery{
			From: from, To: to, Granularity: domain.GranularityDay,
		})
		if queryErr == nil && len(data.Metrics) == 0 {
			return fmt.Errorf("overview metrics are unexpectedly empty")
		}
		return queryErr
	})

	assertP95FinishesWithinOneSecond(t, "逐日流量桶", func() error {
		data, queryErr := overview.Execute(ctx, domain.AnalyticsQuery{
			From: from, To: to, Granularity: domain.GranularityDay,
			EventTypes: []domain.EventType{domain.EventPageView},
		})
		// UTC 零点的 30 天半开区间在香港时区跨越 31 个日历日（首尾各一个部分日）。
		if queryErr == nil && len(data.TrafficSeries) != 31 {
			return fmt.Errorf("daily Hong Kong traffic bucket count = %d, want 31", len(data.TrafficSeries))
		}
		return queryErr
	})

	assertP95FinishesWithinOneSecond(t, "带多维筛选的事件摘要", func() error {
		_, queryErr := store.ListEvents(ctx, analyticsapp.EventListRequest{
			Query: domain.AnalyticsQuery{
				From: from, To: to, Granularity: domain.GranularityDay,
				EventTypes: []domain.EventType{domain.EventRouteQuery},
				Locales:    []domain.Locale{domain.LocaleZhHant},
				Outcomes:   []domain.Outcome{domain.OutcomeSuccess},
			},
			Limit: 50,
		})
		return queryErr
	})

	assertP95FinishesWithinOneSecond(t, "单 visitor 时间线", func() error {
		events, queryErr := store.LoadVisitorEvents(ctx, millionRowVisitorID(17))
		if queryErr == nil && len(events) == 0 {
			return fmt.Errorf("visitor timeline is unexpectedly empty")
		}
		return queryErr
	})

	var rowCount int64
	if err := store.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM analytics_events").Scan(&rowCount); err != nil {
		t.Fatal(err)
	}
	if rowCount != 1_000_000 {
		t.Fatalf("fixture row count = %d, want 1000000", rowCount)
	}
	assertNoDerivedAnalyticsTablesExist(t, store.db)
}

func insertMillionAnalyticsEvents(t *testing.T, database *sql.DB, base time.Time) {
	t.Helper()
	if _, err := database.Exec("PRAGMA synchronous=OFF"); err != nil {
		t.Fatal(err)
	}
	const statement = `
		INSERT INTO analytics_events (
			occurred_at_ms, visitor_id, event_type, outcome, http_status, status_class,
			failure_category, duration_ms, locale, device_type, source_type,
			platform, version_name, version_code, size_bytes
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	prepared, err := database.Prepare(statement)
	if err != nil {
		t.Fatal(err)
	}
	defer prepared.Close()

	eventTypes := []string{"page_view", "place_query", "route_query", "download_request"}
	locales := []string{"zh-Hant", "zh-Hans", "en", "unknown"}
	devices := []string{"desktop", "mobile", "tablet", "other"}
	sources := []string{"direct", "search", "referral", "internal", "unknown"}
	for batchStart := 0; batchStart < 1_000_000; batchStart += 10_000 {
		transaction, beginErr := database.Begin()
		if beginErr != nil {
			t.Fatal(beginErr)
		}
		batchStatement := transaction.Stmt(prepared)
		for index := batchStart; index < batchStart+10_000; index++ {
			occurredAt := base.AddDate(0, 0, index/1000).Add(time.Duration(index%1000) * 86_400 * time.Millisecond)
			eventType := eventTypes[index%len(eventTypes)]
			outcome, statusClass := "success", "2xx"
			var failure any
			httpStatus := 200
			if index%10 == 0 {
				outcome, statusClass, failure, httpStatus = "failure", "5xx", "internal", 503
			}
			var platform, versionName, versionCode, sizeBytes any
			if eventType == "download_request" {
				if index%8 == 3 {
					platform = "ios"
				} else {
					platform = "android"
				}
				versionName, versionCode, sizeBytes = fmt.Sprintf("1.%d", index%5), int64(index%5+1), int64(5_000_000+index%10_000)
			}
			if _, execErr := batchStatement.Exec(
				occurredAt.UnixMilli(), millionRowVisitorID(index%10_000), eventType, outcome,
				httpStatus, statusClass, failure, int64(index%1500), locales[index%len(locales)],
				devices[index%len(devices)], sources[index%len(sources)],
				platform, versionName, versionCode, sizeBytes,
			); execErr != nil {
				_ = transaction.Rollback()
				t.Fatalf("insert fixture row %d: %v", index, execErr)
			}
		}
		batchStatement.Close()
		if commitErr := transaction.Commit(); commitErr != nil {
			t.Fatal(commitErr)
		}
	}
	if _, err := database.Exec("PRAGMA optimize"); err != nil {
		t.Fatal(err)
	}
}

func millionRowVisitorID(value int) string {
	return fmt.Sprintf("v%021d", value)
}

func assertQueryPlanUsesIndex(t *testing.T, database *sql.DB, query string, args []any, indexName string) {
	t.Helper()
	rows, err := database.Query("EXPLAIN QUERY PLAN "+query, args...)
	if err != nil {
		t.Fatal(err)
	}
	defer rows.Close()
	var plan strings.Builder
	for rows.Next() {
		var id, parent, unused int
		var detail string
		if err := rows.Scan(&id, &parent, &unused, &detail); err != nil {
			t.Fatal(err)
		}
		plan.WriteString(detail)
		plan.WriteByte('\n')
	}
	if err := rows.Err(); err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(plan.String(), indexName) {
		t.Fatalf("query plan does not use %s:\n%s", indexName, plan.String())
	}
}

func assertP95FinishesWithinOneSecond(t *testing.T, name string, query func() error) {
	t.Helper()
	const warmupSamples = 2
	const measuredSamples = 20
	for sample := 0; sample < warmupSamples; sample++ {
		if err := query(); err != nil {
			t.Fatalf("%s warmup %d failed: %v", name, sample+1, err)
		}
	}

	durations := make([]time.Duration, 0, measuredSamples)
	for sample := 0; sample < measuredSamples; sample++ {
		startedAt := time.Now()
		if err := query(); err != nil {
			t.Fatalf("%s sample %d failed: %v", name, sample+1, err)
		}
		durations = append(durations, time.Since(startedAt))
	}
	sort.Slice(durations, func(left, right int) bool { return durations[left] < durations[right] })
	// 20 个样本的最近秩 P95 是排序后的第 19 个值（1-based），与产品侧 P95 口径一致。
	p95 := durations[18]
	if p95 >= time.Second {
		t.Fatalf("%s P95 took %s, want < 1s (samples=%v)", name, p95, durations)
	}
	t.Logf("%s: P95=%s, min=%s, max=%s, samples=%d", name, p95, durations[0], durations[len(durations)-1], measuredSamples)
}

func assertNoDerivedAnalyticsTablesExist(t *testing.T, database *sql.DB) {
	t.Helper()
	rows, err := database.Query(`SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`)
	if err != nil {
		t.Fatal(err)
	}
	defer rows.Close()
	names := make(map[string]struct{})
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			t.Fatal(err)
		}
		names[name] = struct{}{}
	}
	_, hasEvents := names["analytics_events"]
	_, hasMigrations := names["schema_migrations"]
	if len(names) != 2 || !hasEvents || !hasMigrations {
		t.Fatalf("unexpected analytics tables: %v", names)
	}
}
