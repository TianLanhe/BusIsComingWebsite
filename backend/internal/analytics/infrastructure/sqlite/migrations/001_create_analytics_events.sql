CREATE TABLE analytics_events (
    id INTEGER PRIMARY KEY,
    occurred_at_ms INTEGER NOT NULL,
    visitor_id TEXT NOT NULL CHECK(length(visitor_id) = 22),
    event_type TEXT NOT NULL CHECK(event_type IN ('page_view', 'place_query', 'route_query', 'download_request')),
    outcome TEXT NOT NULL CHECK(outcome IN ('success', 'failure')),
    http_status INTEGER CHECK(http_status BETWEEN 100 AND 599),
    status_class TEXT NOT NULL CHECK(status_class IN ('2xx', '3xx', '4xx', '5xx', 'aborted', 'unknown')),
    failure_category TEXT CHECK(failure_category IN (
        'invalid_request', 'invalid_token', 'same_place', 'rate_limited', 'not_found',
        'integrity_mismatch', 'external_timeout', 'external_unavailable',
        'client_aborted', 'internal', 'unknown'
    )),
    duration_ms INTEGER NOT NULL CHECK(duration_ms >= 0),
    locale TEXT NOT NULL CHECK(locale IN ('zh-Hant', 'zh-Hans', 'en', 'unknown')),
    device_type TEXT NOT NULL CHECK(device_type IN ('desktop', 'mobile', 'tablet', 'other')),
    source_type TEXT NOT NULL CHECK(source_type IN ('direct', 'search', 'referral', 'internal', 'unknown')),
    platform TEXT CHECK(platform IN ('android', 'ios', 'other')),
    version_name TEXT CHECK(length(version_name) <= 64),
    version_code INTEGER CHECK(version_code > 0),
    size_bytes INTEGER CHECK(size_bytes > 0),
    CHECK(
        (event_type = 'download_request') OR
        (platform IS NULL AND version_name IS NULL AND version_code IS NULL AND size_bytes IS NULL)
    ),
    CHECK(
        (outcome = 'success' AND status_class = '2xx' AND failure_category IS NULL) OR
        (outcome = 'failure' AND failure_category IS NOT NULL)
    ),
    CHECK(
        (event_type != 'download_request' OR outcome != 'success') OR
        (platform IS NOT NULL AND version_name IS NOT NULL AND version_code IS NOT NULL AND size_bytes IS NOT NULL)
    )
);

CREATE INDEX idx_analytics_events_time
    ON analytics_events(occurred_at_ms, id);
CREATE INDEX idx_analytics_events_type_time
    ON analytics_events(event_type, occurred_at_ms, id);
CREATE INDEX idx_analytics_events_visitor_time
    ON analytics_events(visitor_id, occurred_at_ms, id);
CREATE INDEX idx_analytics_events_time_visitor
    ON analytics_events(occurred_at_ms, visitor_id);
CREATE INDEX idx_analytics_events_outcome_time
    ON analytics_events(outcome, occurred_at_ms, id);
CREATE INDEX idx_analytics_events_download
    ON analytics_events(platform, version_name, version_code, occurred_at_ms)
    WHERE event_type = 'download_request';
CREATE INDEX idx_analytics_events_failure
    ON analytics_events(failure_category, occurred_at_ms)
    WHERE outcome = 'failure';
