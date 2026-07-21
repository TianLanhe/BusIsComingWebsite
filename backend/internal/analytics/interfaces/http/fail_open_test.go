package http

import (
	"bytes"
	"context"
	"database/sql"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"sync/atomic"
	"testing"
	"time"

	analyticsapp "busiscoming-website/backend/internal/analytics/application"
	"busiscoming-website/backend/internal/analytics/domain"
	analyticsqlite "busiscoming-website/backend/internal/analytics/infrastructure/sqlite"
	platformhttp "busiscoming-website/backend/internal/platform/httpserver"
	"github.com/gin-gonic/gin"
)

type eventWriterFunc func(context.Context, domain.AnalyticsEvent) error

func (function eventWriterFunc) WriteEvent(ctx context.Context, event domain.AnalyticsEvent) error {
	return function(ctx, event)
}

func TestAnalyticsFailOpenForClosedAndLockedSQLite(t *testing.T) {
	tests := []struct {
		name  string
		setup func(t *testing.T) (*analyticsqlite.Store, func())
	}{
		{
			name: "closed database",
			setup: func(t *testing.T) (*analyticsqlite.Store, func()) {
				store, err := analyticsqlite.Open(context.Background(), filepath.Join(t.TempDir(), "analytics.sqlite"))
				if err != nil {
					t.Fatal(err)
				}
				if err := store.Close(); err != nil {
					t.Fatal(err)
				}
				return store, func() {}
			},
		},
		{
			name: "write lock",
			setup: func(t *testing.T) (*analyticsqlite.Store, func()) {
				databasePath := filepath.Join(t.TempDir(), "analytics.sqlite")
				store, err := analyticsqlite.Open(context.Background(), databasePath)
				if err != nil {
					t.Fatal(err)
				}
				locker, err := sql.Open("sqlite", "file:"+databasePath)
				if err != nil {
					t.Fatal(err)
				}
				if _, err := locker.Exec(`BEGIN IMMEDIATE`); err != nil {
					t.Fatal(err)
				}
				return store, func() {
					_, _ = locker.Exec(`ROLLBACK`)
					_ = locker.Close()
					_ = store.Close()
				}
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			store, cleanup := test.setup(t)
			defer cleanup()
			health := analyticsapp.NewRuntimeHealth(time.Now())
			recorder := analyticsapp.NewRecordEvent(store, 10*time.Millisecond, health)
			engine := trackedEngine(&bytes.Buffer{}, recorder)
			engine.POST("/api/routes/query_places", func(c *gin.Context) {
				c.Header("X-Business-Result", "stable")
				c.JSON(http.StatusOK, gin.H{"places": []string{"result"}})
			})
			startedAt := time.Now()
			response := httptest.NewRecorder()
			engine.ServeHTTP(response, httptest.NewRequest(http.MethodPost, "/api/routes/query_places", nil))
			if elapsed := time.Since(startedAt); elapsed > 250*time.Millisecond {
				t.Fatalf("storage failure blocked public response for %v", elapsed)
			}
			if response.Code != http.StatusOK || response.Header().Get("X-Business-Result") != "stable" || response.Body.String() != `{"places":["result"]}` {
				t.Fatalf("storage failure changed public response: status=%d body=%q", response.Code, response.Body.String())
			}
			if health.Snapshot().DroppedSinceStart != 1 {
				t.Fatalf("expected exactly one dropped event: %#v", health.Snapshot())
			}
		})
	}
}

func TestAnalyticsFailOpenKeepsPublicResponseAndDropsOnce(t *testing.T) {
	gin.SetMode(gin.TestMode)
	health := analyticsapp.NewRuntimeHealth(time.Now())
	var calls atomic.Int32
	writer := eventWriterFunc(func(ctx context.Context, _ domain.AnalyticsEvent) error {
		calls.Add(1)
		<-ctx.Done()
		return ctx.Err()
	})
	recorder := analyticsapp.NewRecordEvent(writer, 10*time.Millisecond, health)
	tracked := trackedEngine(&bytes.Buffer{}, recorder)
	baseline := platformhttp.NewPublicEngine(&bytes.Buffer{}, nil)
	registerStableResponse := func(engine *gin.Engine) {
		engine.POST("/api/routes/query_places", func(c *gin.Context) {
			c.Header("X-Business-Result", "stable")
			c.JSON(http.StatusOK, gin.H{"places": []string{"result"}})
		})
	}
	registerStableResponse(tracked)
	registerStableResponse(baseline)

	request := httptest.NewRequest(http.MethodPost, "/api/routes/query_places", nil)
	startedAt := time.Now()
	trackedResponse := httptest.NewRecorder()
	tracked.ServeHTTP(trackedResponse, request)
	elapsed := time.Since(startedAt)
	baselineResponse := httptest.NewRecorder()
	baseline.ServeHTTP(baselineResponse, httptest.NewRequest(http.MethodPost, "/api/routes/query_places", nil))

	if elapsed > 200*time.Millisecond {
		t.Fatalf("analytics exceeded fail-open bound: %v", elapsed)
	}
	if trackedResponse.Code != baselineResponse.Code || trackedResponse.Body.String() != baselineResponse.Body.String() || trackedResponse.Header().Get("X-Business-Result") != baselineResponse.Header().Get("X-Business-Result") {
		t.Fatalf("analytics changed public response: tracked=%#v baseline=%#v", trackedResponse.Result(), baselineResponse.Result())
	}
	if calls.Load() != 1 || health.Snapshot().DroppedSinceStart != 1 {
		t.Fatalf("expected one attempt and one drop: calls=%d health=%#v", calls.Load(), health.Snapshot())
	}
}
