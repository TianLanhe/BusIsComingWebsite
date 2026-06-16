package memory

import (
	"sync"
	"time"
)

type TTLCache[T any] struct {
	now     func() time.Time
	mu      sync.Mutex
	entries map[string]cacheEntry[T]
	maxSize int
}

type cacheEntry[T any] struct {
	value     T
	expiresAt time.Time
	hitCount  int
}

const defaultMaxKeys = 1024

func NewTTLCache[T any](now func() time.Time) *TTLCache[T] {
	if now == nil {
		now = time.Now
	}
	return &TTLCache[T]{now: now, entries: make(map[string]cacheEntry[T]), maxSize: defaultMaxKeys}
}

func (c *TTLCache[T]) Set(key string, value T, ttl time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()
	now := c.now()
	// 查询关键词和经纬度都来自用户输入，写入前先清理和限容，避免长时间运行后 map 无界增长。
	c.deleteExpiredLocked(now)
	if _, exists := c.entries[key]; !exists && len(c.entries) >= c.maxSize {
		c.evictOneLocked()
	}
	c.entries[key] = cacheEntry[T]{value: value, expiresAt: now.Add(ttl)}
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

func (c *TTLCache[T]) Len() int {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.deleteExpiredLocked(c.now())
	return len(c.entries)
}

func (c *TTLCache[T]) deleteExpiredLocked(now time.Time) {
	for key, entry := range c.entries {
		if !now.Before(entry.expiresAt) {
			delete(c.entries, key)
		}
	}
}

func (c *TTLCache[T]) evictOneLocked() {
	var candidate string
	for key, entry := range c.entries {
		if candidate == "" {
			candidate = key
			continue
		}
		current := c.entries[candidate]
		if entry.expiresAt.Before(current.expiresAt) || (entry.expiresAt.Equal(current.expiresAt) && entry.hitCount < current.hitCount) {
			candidate = key
		}
	}
	if candidate != "" {
		delete(c.entries, candidate)
	}
}

type RateLimiter struct {
	limit   int
	window  time.Duration
	now     func() time.Time
	mu      sync.Mutex
	hits    map[string][]time.Time
	maxKeys int
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
	return &RateLimiter{limit: limit, window: window, now: now, hits: make(map[string][]time.Time), maxKeys: defaultMaxKeys}
}

func (l *RateLimiter) Allow(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := l.now()
	threshold := now.Add(-l.window)
	// 限流 key 未来可能包含客户端维度，先在内存层统一做过期清理和最大 key 数保护。
	l.deleteExpiredLocked(threshold)
	if _, exists := l.hits[key]; !exists && len(l.hits) >= l.maxKeys {
		l.evictOldestKeyLocked()
	}
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

func (l *RateLimiter) Len() int {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.deleteExpiredLocked(l.now().Add(-l.window))
	return len(l.hits)
}

func (l *RateLimiter) deleteExpiredLocked(threshold time.Time) {
	for key, hits := range l.hits {
		active := hits[:0]
		for _, hit := range hits {
			if hit.After(threshold) {
				active = append(active, hit)
			}
		}
		if len(active) == 0 {
			delete(l.hits, key)
			continue
		}
		l.hits[key] = active
	}
}

func (l *RateLimiter) evictOldestKeyLocked() {
	var candidate string
	var oldest time.Time
	for key, hits := range l.hits {
		last := hits[len(hits)-1]
		if candidate == "" || last.Before(oldest) {
			candidate = key
			oldest = last
		}
	}
	if candidate != "" {
		delete(l.hits, candidate)
	}
}
