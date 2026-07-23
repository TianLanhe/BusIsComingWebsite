package sqlite

import (
	"context"
	"database/sql"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
	"time"

	"busiscoming-website/backend/internal/analytics/domain"
)

func TestSQLiteVersionIncludesWALResetFix(t *testing.T) {
	store, err := Open(context.Background(), filepath.Join(t.TempDir(), "analytics.db"))
	if err != nil {
		t.Fatalf("open store: %v", err)
	}
	defer store.Close()

	version, err := store.RuntimeVersion(context.Background())
	if err != nil {
		t.Fatalf("runtime version: %v", err)
	}
	if compareSQLiteVersions(version, "3.51.3") < 0 {
		t.Fatalf("SQLite %s does not contain the required WAL-reset fix", version)
	}
}

func TestSQLiteConnectionPragmas(t *testing.T) {
	store, err := Open(context.Background(), filepath.Join(t.TempDir(), "analytics.db"))
	if err != nil {
		t.Fatalf("open store: %v", err)
	}
	defer store.Close()

	connections := make([]*sql.Conn, 0, 4)
	defer func() {
		for _, connection := range connections {
			connection.Close()
		}
	}()
	for index := 0; index < 4; index++ {
		connection, err := store.db.Conn(context.Background())
		if err != nil {
			t.Fatalf("acquire connection %d: %v", index, err)
		}
		connections = append(connections, connection)
		var journalMode string
		var synchronous int
		var busyTimeout int
		if err := connection.QueryRowContext(context.Background(), `PRAGMA journal_mode`).Scan(&journalMode); err != nil {
			t.Fatal(err)
		}
		if err := connection.QueryRowContext(context.Background(), `PRAGMA synchronous`).Scan(&synchronous); err != nil {
			t.Fatal(err)
		}
		if err := connection.QueryRowContext(context.Background(), `PRAGMA busy_timeout`).Scan(&busyTimeout); err != nil {
			t.Fatal(err)
		}
		if strings.ToLower(journalMode) != "wal" || synchronous != 1 || busyTimeout <= 0 {
			t.Fatalf("connection %d has unexpected pragmas: journal=%s synchronous=%d busy_timeout=%d", index, journalMode, synchronous, busyTimeout)
		}
	}
}

func TestStoreWritesValidatedEvent(t *testing.T) {
	store, err := Open(context.Background(), filepath.Join(t.TempDir(), "analytics.db"))
	if err != nil {
		t.Fatalf("open store: %v", err)
	}
	defer store.Close()

	status := 200
	event := domain.AnalyticsEvent{
		OccurredAt:  time.UnixMilli(1_721_017_200_123).UTC(),
		VisitorID:   "abcdefghijklmnopqrstuv",
		EventType:   domain.EventPageView,
		Outcome:     domain.OutcomeSuccess,
		HTTPStatus:  &status,
		StatusClass: domain.Status2xx,
		DurationMS:  10,
		Locale:      domain.LocaleZhHant,
		DeviceType:  domain.DeviceDesktop,
		SourceType:  domain.SourceDirect,
	}
	if err := store.WriteEvent(context.Background(), event); err != nil {
		t.Fatalf("write event: %v", err)
	}
	var count int
	if err := store.db.QueryRow(`SELECT COUNT(*) FROM analytics_events`).Scan(&count); err != nil {
		t.Fatal(err)
	}
	if count != 1 {
		t.Fatalf("expected one detail event, got %d", count)
	}
}

func compareSQLiteVersions(left, right string) int {
	leftParts := strings.Split(left, ".")
	rightParts := strings.Split(right, ".")
	for index := 0; index < 3; index++ {
		leftValue, _ := strconv.Atoi(leftParts[index])
		rightValue, _ := strconv.Atoi(rightParts[index])
		if leftValue < rightValue {
			return -1
		}
		if leftValue > rightValue {
			return 1
		}
	}
	return 0
}
