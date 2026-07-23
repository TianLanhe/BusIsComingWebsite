package sqlite

import (
	"context"
	"fmt"
	"os"

	analyticsapp "busiscoming-website/backend/internal/analytics/application"
)

func (store *Store) ReadStorageSnapshot(ctx context.Context) (analyticsapp.SystemStorageSnapshot, error) {
	var rowCount int64
	if err := store.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM analytics_events").Scan(&rowCount); err != nil {
		return analyticsapp.SystemStorageSnapshot{}, fmt.Errorf("read analytics row count: %w", err)
	}
	info, err := os.Stat(store.path)
	if err != nil {
		return analyticsapp.SystemStorageSnapshot{}, fmt.Errorf("read analytics database size: %w", err)
	}
	size := info.Size()
	return analyticsapp.SystemStorageSnapshot{DatabaseRowCount: &rowCount, DatabaseSizeBytes: &size}, nil
}
