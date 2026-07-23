package sqlite

import (
	"context"
	"database/sql"
	"embed"
	"fmt"
	"sort"
)

//go:embed migrations/*.sql
var migrationFiles embed.FS

func (store *Store) Migrate(ctx context.Context) error {
	transaction, err := store.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin analytics migration: %w", err)
	}
	defer transaction.Rollback()

	if _, err := transaction.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version TEXT PRIMARY KEY,
			applied_at_ms INTEGER NOT NULL
		)`); err != nil {
		return fmt.Errorf("create analytics migration metadata: %w", err)
	}

	entries, err := migrationFiles.ReadDir("migrations")
	if err != nil {
		return fmt.Errorf("read analytics migrations: %w", err)
	}
	sort.Slice(entries, func(left, right int) bool { return entries[left].Name() < entries[right].Name() })
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		applied, err := migrationApplied(ctx, transaction, entry.Name())
		if err != nil {
			return err
		}
		if applied {
			continue
		}
		statement, err := migrationFiles.ReadFile("migrations/" + entry.Name())
		if err != nil {
			return fmt.Errorf("read analytics migration: %w", err)
		}
		if _, err := transaction.ExecContext(ctx, string(statement)); err != nil {
			return fmt.Errorf("apply analytics migration: %w", err)
		}
		if _, err := transaction.ExecContext(ctx, `INSERT INTO schema_migrations(version, applied_at_ms) VALUES (?, unixepoch('subsec') * 1000)`, entry.Name()); err != nil {
			return fmt.Errorf("record analytics migration: %w", err)
		}
	}
	if err := transaction.Commit(); err != nil {
		return fmt.Errorf("commit analytics migrations: %w", err)
	}
	return nil
}

func migrationApplied(ctx context.Context, transaction *sql.Tx, version string) (bool, error) {
	var value int
	err := transaction.QueryRowContext(ctx, `SELECT 1 FROM schema_migrations WHERE version = ?`, version).Scan(&value)
	if err == sql.ErrNoRows {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("read analytics migration state: %w", err)
	}
	return true, nil
}
