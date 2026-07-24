package sqlite

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"errors"
	"io"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
	"time"

	analyticsapp "busiscoming-website/backend/internal/analytics/application"
	"busiscoming-website/backend/internal/analytics/domain"
)

func TestStorageSnapshotKeepsOtherFactsWhenTotalCountProbeFails(t *testing.T) {
	for _, probe := range []string{"row", "today", "size", "version", "journal", "schema"} {
		t.Run(probe, func(t *testing.T) {
			path := filepath.Join(t.TempDir(), "analytics.sqlite")
			if probe != "size" {
				if err := os.WriteFile(path, []byte("sqlite-fixture"), 0o600); err != nil {
					t.Fatal(err)
				}
			}
			database, err := sql.Open("analytics-system-probe-failure", probe)
			if err != nil {
				t.Fatal(err)
			}
			defer database.Close()
			store := &Store{db: database, path: path}
			start := time.Date(2026, 7, 25, 0, 0, 0, 0, time.FixedZone("Asia/Hong_Kong", 8*60*60))
			snapshot, err := store.ReadStorageSnapshot(context.Background(), start, start.AddDate(0, 0, 1))
			if err != nil {
				t.Fatal(err)
			}
			facts := map[string]any{"row": snapshot.DatabaseRowCount, "today": snapshot.DatabaseTodayRowCount, "size": snapshot.DatabaseSizeBytes, "version": snapshot.SQLiteVersion, "journal": snapshot.SQLiteJournalMode, "schema": snapshot.SQLiteSchemaVersion}
			if !nilFact(facts[probe]) {
				t.Fatalf("failed %s probe must be null: %#v", probe, snapshot)
			}
			for name, value := range facts {
				if name != probe && nilFact(value) {
					t.Fatalf("failed %s probe cleared %s: %#v", probe, name, snapshot)
				}
			}
		})
	}
}

func nilFact(value any) bool { return value == nil || reflect.ValueOf(value).IsNil() }

func init() { sql.Register("analytics-system-probe-failure", probeFailureDriver{}) }

type probeFailureDriver struct{}

func (probeFailureDriver) Open(name string) (driver.Conn, error) {
	return probeFailureConn{failure: name}, nil
}

type probeFailureConn struct{ failure string }

func (probeFailureConn) Prepare(string) (driver.Stmt, error) {
	return nil, errors.New("prepare unsupported")
}
func (probeFailureConn) Close() error              { return nil }
func (probeFailureConn) Begin() (driver.Tx, error) { return nil, errors.New("transaction unsupported") }
func (connection probeFailureConn) QueryContext(_ context.Context, query string, _ []driver.NamedValue) (driver.Rows, error) {
	switch {
	case strings.Contains(query, "COUNT(*) FROM analytics_events") && !strings.Contains(query, "WHERE"):
		if connection.failure == "row" {
			return nil, errors.New("count probe failed")
		}
		return &probeRows{columns: []string{"COUNT(*)"}, values: [][]driver.Value{{int64(9)}}}, nil
	case strings.Contains(query, "WHERE occurred_at_ms"):
		if connection.failure == "today" {
			return nil, errors.New("today probe failed")
		}
		return &probeRows{columns: []string{"COUNT(*)"}, values: [][]driver.Value{{int64(4)}}}, nil
	case strings.Contains(query, "sqlite_version"):
		if connection.failure == "version" {
			return nil, errors.New("version probe failed")
		}
		return &probeRows{columns: []string{"sqlite_version()"}, values: [][]driver.Value{{"3.51.3"}}}, nil
	case strings.Contains(query, "PRAGMA journal_mode"):
		if connection.failure == "journal" {
			return nil, errors.New("journal probe failed")
		}
		return &probeRows{columns: []string{"journal_mode"}, values: [][]driver.Value{{"wal"}}}, nil
	case strings.Contains(query, "schema_migrations"):
		if connection.failure == "schema" {
			return nil, errors.New("schema probe failed")
		}
		return &probeRows{columns: []string{"version"}, values: [][]driver.Value{{"001"}}}, nil
	}
	return nil, errors.New("unexpected probe")
}

type probeRows struct {
	columns []string
	values  [][]driver.Value
}

func (rows probeRows) Columns() []string { return rows.columns }
func (rows probeRows) Close() error      { return nil }
func (rows *probeRows) Next(dest []driver.Value) error {
	if len(rows.values) == 0 {
		return io.EOF
	}
	copy(dest, rows.values[0])
	rows.values = rows.values[1:]
	return nil
}

func TestPerformanceAndSystemSummariesAreSafe(t *testing.T) {
	path := filepath.Join(t.TempDir(), "analytics.sqlite")
	store, err := Open(context.Background(), path)
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()
	base := time.Date(2026, 7, 1, 0, 0, 0, 0, time.UTC)
	success := overviewFixtureEvent(1, "abcdefghijklmnopqrstuv", domain.EventPlaceQuery, base)
	failure := overviewFixtureEvent(2, "0123456789abcdefghijkl", domain.EventPlaceQuery, base.Add(time.Minute))
	status := 429
	category := domain.FailureRateLimited
	failure.Outcome, failure.HTTPStatus, failure.StatusClass, failure.FailureCategory, failure.DurationMS = domain.OutcomeFailure, &status, domain.Status4xx, &category, 100
	for _, event := range []domain.AnalyticsEvent{success, failure} {
		if err := store.WriteEvent(context.Background(), event); err != nil {
			t.Fatal(err)
		}
	}
	health := analyticsapp.NewRuntimeHealth(base)
	health.RecordSuccessfulWrite(base.Add(time.Minute))
	usecase := analyticsapp.NewQueryDetailsWithBindAddress(store, health, analyticsapp.ClockFunc(func() time.Time { return base.Add(time.Hour) }), analyticsapp.ListenerStateFunc(func() string { return "available" }), "127.0.0.1:18081")
	performance, err := usecase.Performance(context.Background(), domain.AnalyticsQuery{From: base, To: base.Add(time.Hour), Granularity: domain.GranularityHour})
	if err != nil {
		t.Fatal(err)
	}
	if len(performance.Endpoints) != 4 || performance.Endpoints[1].SuccessRate == nil || len(performance.Failures) != 1 {
		t.Fatalf("unexpected performance: %#v", performance)
	}
	system := usecase.System(context.Background())
	if system.Database.State != analyticsapp.DatabaseAvailable || system.Database.RowCount == nil || *system.Database.RowCount != 2 || system.PrivateListener.BindAddress == nil || *system.PrivateListener.BindAddress != "127.0.0.1:18081" {
		t.Fatalf("unsafe system summary: %#v", system)
	}
}

func TestSystemReturnsUnavailableWithoutStore(t *testing.T) {
	health := analyticsapp.NewRuntimeHealth(time.Now())
	health.SetDatabaseState(analyticsapp.DatabaseUnavailable, analyticsapp.ReasonOpenFailed)
	result := analyticsapp.NewQueryDetails(nil, health, analyticsapp.ClockFunc(time.Now), nil).System(context.Background())
	if result.Database.State != analyticsapp.DatabaseUnavailable || result.Database.RowCount != nil {
		t.Fatalf("unexpected unavailable system: %#v", result)
	}
}
