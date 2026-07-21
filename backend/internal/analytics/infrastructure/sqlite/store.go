package sqlite

import (
	"context"
	"database/sql"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"busiscoming-website/backend/internal/analytics/domain"
	_ "modernc.org/sqlite"
)

const minimumSQLiteVersion = "3.51.3"

type Store struct {
	db   *sql.DB
	path string
}

func Open(ctx context.Context, path string) (*Store, error) {
	if path == "" {
		return nil, fmt.Errorf("analytics database path is required")
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o750); err != nil {
		return nil, fmt.Errorf("prepare analytics database directory: %w", err)
	}
	parameters := url.Values{}
	parameters.Add("_pragma", "journal_mode(WAL)")
	parameters.Add("_pragma", "synchronous(NORMAL)")
	parameters.Add("_pragma", "busy_timeout(5000)")
	location := url.URL{Scheme: "file", Path: filepath.Clean(path), RawQuery: parameters.Encode()}
	database, err := sql.Open("sqlite", location.String())
	if err != nil {
		return nil, fmt.Errorf("open analytics database: %w", err)
	}
	database.SetMaxOpenConns(4)
	database.SetMaxIdleConns(4)
	store := &Store{db: database, path: path}
	if err := database.PingContext(ctx); err != nil {
		database.Close()
		return nil, fmt.Errorf("ping analytics database: %w", err)
	}
	version, err := store.RuntimeVersion(ctx)
	if err != nil {
		database.Close()
		return nil, err
	}
	if compareVersions(version, minimumSQLiteVersion) < 0 {
		database.Close()
		return nil, fmt.Errorf("analytics sqlite runtime is unsupported")
	}
	if err := store.Migrate(ctx); err != nil {
		database.Close()
		return nil, err
	}
	return store, nil
}

func (store *Store) Close() error { return store.db.Close() }

func (store *Store) RuntimeVersion(ctx context.Context) (string, error) {
	var version string
	if err := store.db.QueryRowContext(ctx, `SELECT sqlite_version()`).Scan(&version); err != nil {
		return "", fmt.Errorf("read analytics sqlite runtime version: %w", err)
	}
	return version, nil
}

func (store *Store) WriteEvent(ctx context.Context, event domain.AnalyticsEvent) error {
	if err := event.Validate(); err != nil {
		return err
	}
	var failure any
	if event.FailureCategory != nil {
		failure = string(*event.FailureCategory)
	}
	var platform, versionName any
	var versionCode, sizeBytes any
	if event.Download != nil {
		platform = string(event.Download.Platform)
		if event.Download.VersionName != "" {
			versionName = event.Download.VersionName
		}
		if event.Download.VersionCode > 0 {
			versionCode = event.Download.VersionCode
		}
		if event.Download.SizeBytes > 0 {
			sizeBytes = event.Download.SizeBytes
		}
	}
	_, err := store.db.ExecContext(ctx, `
		INSERT INTO analytics_events (
			occurred_at_ms, visitor_id, event_type, outcome, http_status, status_class,
			failure_category, duration_ms, locale, device_type, source_type,
			platform, version_name, version_code, size_bytes
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		event.OccurredAt.UnixMilli(), event.VisitorID, event.EventType, event.Outcome,
		event.HTTPStatus, event.StatusClass, failure, event.DurationMS, event.Locale,
		event.DeviceType, event.SourceType, platform, versionName, versionCode, sizeBytes,
	)
	if err != nil {
		return fmt.Errorf("write analytics event: %w", err)
	}
	return nil
}

func compareVersions(left, right string) int {
	leftParts := strings.Split(left, ".")
	rightParts := strings.Split(right, ".")
	for index := 0; index < 3; index++ {
		leftValue := versionPart(leftParts, index)
		rightValue := versionPart(rightParts, index)
		if leftValue < rightValue {
			return -1
		}
		if leftValue > rightValue {
			return 1
		}
	}
	return 0
}

func versionPart(parts []string, index int) int {
	if index >= len(parts) {
		return 0
	}
	value, _ := strconv.Atoi(parts[index])
	return value
}
