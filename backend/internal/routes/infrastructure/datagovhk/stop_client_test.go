package datagovhk_test

import (
	"context"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"busiscoming-website/backend/internal/routes/domain"
	"busiscoming-website/backend/internal/routes/infrastructure/citybus"
	"busiscoming-website/backend/internal/routes/infrastructure/datagovhk"
	"busiscoming-website/backend/internal/routes/infrastructure/memory"
)

func TestParseStopNameResponsePrefersCurrentLanguage(t *testing.T) {
	response := []byte(`{"data":{"name_tc":"興華邨興翠樓","name_sc":"兴华邨兴翠楼","name_en":"Hing Wah Estate Hing Tsui House"}}`)

	simplified, err := datagovhk.ParseStopNameResponse(response, domain.LanguageZhHans)
	if err != nil {
		t.Fatalf("parse simplified stop name: %v", err)
	}
	if simplified != "兴华邨兴翠楼" {
		t.Fatalf("expected simplified name, got %q", simplified)
	}

	english, err := datagovhk.ParseStopNameResponse(response, domain.LanguageEn)
	if err != nil {
		t.Fatalf("parse english stop name: %v", err)
	}
	if english != "Hing Wah Estate Hing Tsui House" {
		t.Fatalf("expected english name, got %q", english)
	}
}

func TestStopClientCachesSuccessfulShortNameForOneDay(t *testing.T) {
	now := time.Date(2026, 7, 1, 12, 0, 0, 0, time.UTC)
	var requests int
	client := newStopClientForTest(func(req *http.Request) (*http.Response, error) {
		requests++
		return stopTextResponse(200, `{"data":{"name_tc":"樂軒臺, 柴灣道","name_sc":"乐轩台, 柴湾道","name_en":"Lok Hin Terrace, Chai Wan Road"}}`), nil
	})
	client.Cache = memory.NewTTLCache[string](func() time.Time { return now })
	client.NormalizeName = citybus.NormalizeStopDisplayName

	first, err := client.ResolveStopName(context.Background(), "001336", domain.LanguageZhHant)
	if err != nil {
		t.Fatalf("resolve first stop name: %v", err)
	}
	second, err := client.ResolveStopName(context.Background(), "001336", domain.LanguageZhHant)
	if err != nil {
		t.Fatalf("resolve cached stop name: %v", err)
	}
	if first != "樂軒臺" || second != "樂軒臺" {
		t.Fatalf("expected cached short name, got %q and %q", first, second)
	}
	if requests != 1 {
		t.Fatalf("expected one external request, got %d", requests)
	}
}

func TestStopClientDoesNotCacheFailures(t *testing.T) {
	cases := []struct {
		name   string
		status int
		body   string
	}{
		{name: "http status", status: 500, body: `{"data":{"name_tc":"樂軒臺"}}`},
		{name: "empty result", status: 200, body: `{"data":{}}`},
		{name: "invalid json", status: 200, body: `{`},
		{name: "empty normalized", status: 200, body: `{"data":{"name_tc":"10 - , 柴灣道"}}`},
	}
	for _, tt := range cases {
		t.Run(tt.name, func(t *testing.T) {
			var requests int
			client := newStopClientForTest(func(req *http.Request) (*http.Response, error) {
				requests++
				return stopTextResponse(tt.status, tt.body), nil
			})
			client.Cache = memory.NewTTLCache[string](time.Now)
			client.NormalizeName = citybus.NormalizeStopDisplayName

			for i := 0; i < 2; i++ {
				if _, err := client.ResolveStopName(context.Background(), "001336", domain.LanguageZhHant); err == nil {
					t.Fatalf("expected failure on attempt %d", i)
				}
			}
			if requests != 2 {
				t.Fatalf("expected failure not to be cached, got %d requests", requests)
			}
		})
	}
}

func TestStopClientIsolatesLanguageAndRetriesAfterExpiry(t *testing.T) {
	now := time.Date(2026, 7, 1, 12, 0, 0, 0, time.UTC)
	var requests int
	client := newStopClientForTest(func(req *http.Request) (*http.Response, error) {
		requests++
		return stopTextResponse(200, `{"data":{"name_tc":"樂軒臺, 柴灣道","name_sc":"乐轩台, 柴湾道","name_en":"Lok Hin Terrace, Chai Wan Road"}}`), nil
	})
	client.Cache = memory.NewTTLCache[string](func() time.Time { return now })
	client.NormalizeName = citybus.NormalizeStopDisplayName

	traditional, err := client.ResolveStopName(context.Background(), "001336", domain.LanguageZhHant)
	if err != nil {
		t.Fatalf("resolve traditional stop name: %v", err)
	}
	simplified, err := client.ResolveStopName(context.Background(), "001336", domain.LanguageZhHans)
	if err != nil {
		t.Fatalf("resolve simplified stop name: %v", err)
	}
	english, err := client.ResolveStopName(context.Background(), "001336", domain.LanguageEn)
	if err != nil {
		t.Fatalf("resolve english stop name: %v", err)
	}
	if traditional != "樂軒臺" || simplified != "乐轩台" || english != "Lok Hin Terrace" {
		t.Fatalf("unexpected localized names: %q %q %q", traditional, simplified, english)
	}
	if requests != 3 {
		t.Fatalf("expected language-isolated cache requests, got %d", requests)
	}

	now = now.Add(25 * time.Hour)
	if _, err := client.ResolveStopName(context.Background(), "001336", domain.LanguageZhHant); err != nil {
		t.Fatalf("resolve expired stop name: %v", err)
	}
	if requests != 4 {
		t.Fatalf("expected expired entry to retry external service, got %d requests", requests)
	}
}

func newStopClientForTest(handler func(*http.Request) (*http.Response, error)) *datagovhk.StopClient {
	return &datagovhk.StopClient{
		BaseURL:    "https://datagovhk.test/stop",
		HTTPClient: &http.Client{Transport: stopRoundTripFunc(handler)},
	}
}

type stopRoundTripFunc func(*http.Request) (*http.Response, error)

func (f stopRoundTripFunc) RoundTrip(req *http.Request) (*http.Response, error) {
	return f(req)
}

func stopTextResponse(status int, body string) *http.Response {
	return &http.Response{
		StatusCode: status,
		Body:       io.NopCloser(strings.NewReader(body)),
		Header:     make(http.Header),
	}
}
