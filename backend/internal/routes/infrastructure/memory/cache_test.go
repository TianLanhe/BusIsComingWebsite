package memory_test

import (
	"testing"
	"time"

	"busiscoming-website/backend/internal/routes/infrastructure/memory"
)

func TestTTLCacheExpiresEntries(t *testing.T) {
	now := time.Date(2026, 6, 16, 12, 0, 0, 0, time.UTC)
	cache := memory.NewTTLCache[string](func() time.Time { return now })
	cache.Set("places", "cached", time.Minute)

	value, ok := cache.Get("places")
	if !ok || value != "cached" {
		t.Fatalf("expected cache hit, got value=%q ok=%v", value, ok)
	}

	now = now.Add(2 * time.Minute)
	if _, ok := cache.Get("places"); ok {
		t.Fatal("expected expired cache entry to miss")
	}
}

func TestRateLimiterBlocksAfterLimit(t *testing.T) {
	now := time.Date(2026, 6, 16, 12, 0, 0, 0, time.UTC)
	limiter := memory.NewRateLimiter(2, time.Minute, func() time.Time { return now })

	if !limiter.Allow("queryRoutePlaces") || !limiter.Allow("queryRoutePlaces") {
		t.Fatal("expected first two requests to be allowed")
	}
	if limiter.Allow("queryRoutePlaces") {
		t.Fatal("expected third request inside window to be blocked")
	}

	now = now.Add(time.Minute + time.Second)
	if !limiter.Allow("queryRoutePlaces") {
		t.Fatal("expected limiter window to reset")
	}
}
