package memory

import (
	"sync"
	"time"
)

type TTLCache[T any] struct {
	now     func() time.Time
	mu      sync.Mutex
	entries map[string]cacheEntry[T]
}

type cacheEntry[T any] struct {
	value     T
	expiresAt time.Time
	hitCount  int
}

func NewTTLCache[T any](now func() time.Time) *TTLCache[T] {
	if now == nil {
		now = time.Now
	}
	return &TTLCache[T]{now: now, entries: make(map[string]cacheEntry[T])}
}

func (c *TTLCache[T]) Set(key string, value T, ttl time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.entries[key] = cacheEntry[T]{value: value, expiresAt: c.now().Add(ttl)}
}

func (c *TTLCache[T]) Get(key string) (T, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	entry, ok := c.entries[key]
	var zero T
	if !ok {
		return zero, false
	}
	if !c.now().Before(entry.expiresAt) {
		delete(c.entries, key)
		return zero, false
	}
	entry.hitCount++
	c.entries[key] = entry
	return entry.value, true
}

type RateLimiter struct {
	limit  int
	window time.Duration
	now    func() time.Time
	mu     sync.Mutex
	hits   map[string][]time.Time
}

func NewRateLimiter(limit int, window time.Duration, now func() time.Time) *RateLimiter {
	if now == nil {
		now = time.Now
	}
	if limit <= 0 {
		limit = 1
	}
	if window <= 0 {
		window = time.Minute
	}
	return &RateLimiter{limit: limit, window: window, now: now, hits: make(map[string][]time.Time)}
}

func (l *RateLimiter) Allow(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := l.now()
	threshold := now.Add(-l.window)
	active := l.hits[key][:0]
	for _, hit := range l.hits[key] {
		if hit.After(threshold) {
			active = append(active, hit)
		}
	}
	if len(active) >= l.limit {
		l.hits[key] = active
		return false
	}
	active = append(active, now)
	l.hits[key] = active
	return true
}
