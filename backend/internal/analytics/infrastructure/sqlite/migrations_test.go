package sqlite

import (
	"context"
	"path/filepath"
	"testing"
)

func TestMigrationsAreIdempotentAndCreateOnlyDetailFacts(t *testing.T) {
	store, err := Open(context.Background(), filepath.Join(t.TempDir(), "analytics.db"))
	if err != nil {
		t.Fatalf("open store: %v", err)
	}
	defer store.Close()

	if err := store.Migrate(context.Background()); err != nil {
		t.Fatalf("second migration must be idempotent: %v", err)
	}

	rows, err := store.db.QueryContext(context.Background(), `SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name`)
	if err != nil {
		t.Fatalf("list tables: %v", err)
	}
	defer rows.Close()
	tables := map[string]bool{}
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			t.Fatalf("scan table: %v", err)
		}
		tables[name] = true
	}
	if !tables["analytics_events"] || !tables["schema_migrations"] {
		t.Fatalf("missing required tables: %#v", tables)
	}
	for _, forbidden := range []string{"visitors", "sessions", "funnels", "daily_analytics", "analytics_summary"} {
		if tables[forbidden] {
			t.Fatalf("forbidden aggregate table exists: %s", forbidden)
		}
	}
}

func TestMigrationCreatesPlannedIndexes(t *testing.T) {
	store, err := Open(context.Background(), filepath.Join(t.TempDir(), "analytics.db"))
	if err != nil {
		t.Fatalf("open store: %v", err)
	}
	defer store.Close()

	rows, err := store.db.QueryContext(context.Background(), `SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'analytics_events'`)
	if err != nil {
		t.Fatalf("list indexes: %v", err)
	}
	defer rows.Close()
	indexes := map[string]bool{}
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			t.Fatalf("scan index: %v", err)
		}
		indexes[name] = true
	}
	for _, name := range []string{
		"idx_analytics_events_time",
		"idx_analytics_events_type_time",
		"idx_analytics_events_visitor_time",
		"idx_analytics_events_time_visitor",
		"idx_analytics_events_outcome_time",
		"idx_analytics_events_download",
		"idx_analytics_events_failure",
	} {
		if !indexes[name] {
			t.Errorf("missing planned index %s", name)
		}
	}
}
