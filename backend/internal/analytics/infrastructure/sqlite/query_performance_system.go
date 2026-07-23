package sqlite

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	analyticsapp "busiscoming-website/backend/internal/analytics/application"
)

func (store *Store) ReadStorageSnapshot(ctx context.Context, todayStart, tomorrowStart time.Time) (analyticsapp.SystemStorageSnapshot, error) {
	var rowCount int64
	if err := store.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM analytics_events").Scan(&rowCount); err != nil {
		return analyticsapp.SystemStorageSnapshot{}, fmt.Errorf("read analytics row count: %w", err)
	}
	snapshot := analyticsapp.SystemStorageSnapshot{DatabaseRowCount: &rowCount}

	// 每项探测独立降级；响应只传结果，不传文件路径、SQL 或底层错误。
	var todayCount int64
	if err := store.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM analytics_events WHERE occurred_at_ms >= ? AND occurred_at_ms < ?", todayStart.UnixMilli(), tomorrowStart.UnixMilli()).Scan(&todayCount); err == nil {
		snapshot.DatabaseTodayRowCount = &todayCount
	}
	if info, err := os.Stat(store.path); err == nil {
		size := info.Size()
		snapshot.DatabaseSizeBytes = &size
	}
	var version string
	if err := store.db.QueryRowContext(ctx, "SELECT sqlite_version()").Scan(&version); err == nil {
		snapshot.SQLiteVersion = &version
	}
	var journalMode string
	if err := store.db.QueryRowContext(ctx, "PRAGMA journal_mode").Scan(&journalMode); err == nil {
		journalMode = strings.ToLower(journalMode)
		snapshot.SQLiteJournalMode = &journalMode
	}
	var schemaVersion string
	if err := store.db.QueryRowContext(ctx, "SELECT COALESCE(MAX(version), '') FROM schema_migrations").Scan(&schemaVersion); err == nil && schemaVersion != "" {
		snapshot.SQLiteSchemaVersion = &schemaVersion
	}
	return snapshot, nil
}
