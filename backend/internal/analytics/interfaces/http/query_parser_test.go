package http

import (
	"net/url"
	"testing"
)

func TestParseDetailsEventsKeepsCompareAndPaginationTogether(t *testing.T) {
	values := url.Values{
		"from": {"2026-07-01T00:00:00Z"}, "to": {"2026-07-02T00:00:00Z"},
		"compare": {"true"}, "limit": {"50"}, "cursor": {"cursor-value"},
	}
	query, err := parseDetailsQuery(values, true)
	if err != nil {
		t.Fatal(err)
	}
	if !query.Compare || query.Limit != 50 || query.Cursor != "cursor-value" {
		t.Fatalf("events must retain compare without changing pagination: %#v", query)
	}
}
