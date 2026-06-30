package citybus_test

import (
	"context"
	"errors"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"testing"
	"time"

	"busiscoming-website/backend/internal/routes/domain"
	"busiscoming-website/backend/internal/routes/infrastructure/citybus"
	"busiscoming-website/backend/internal/routes/infrastructure/memory"
)

func TestParseRouteResponseParsesAriaLabelAndP2PInfo(t *testing.T) {
	response := `
<div id="routelist2">
  <table aria-label="606 港元 6.1 預計 10 分鐘 步行距離 (約) 266 米" onclick="showroutep2p('1|*|CTB||606-1||10||20||O','list-a','general-a')"></table>
  <table aria-label="694 港元 5.0 至 307 港元 8.2 預計 35 分鐘 步行距離 (約) 400 米" onclick="showroutep2p('2|*|CTB||694-1||2||8||O|*|CTB||307-1||3||9||I','list-b','general-b')"></table>
</div>`

	routes, err := citybus.ParseRouteResponse(response, domain.LanguageZhHant)
	if err != nil {
		t.Fatalf("parse route response: %v", err)
	}
	if len(routes) != 2 {
		t.Fatalf("expected 2 routes, got %d", len(routes))
	}
	if routes[0].RouteLabel != "606" || routes[0].Fare.Amount != 6.1 || routes[0].DurationMinutes != 10 {
		t.Fatalf("unexpected first route: %#v", routes[0])
	}
	if len(routes[1].RouteNumbers) != 2 || routes[1].RouteNumbers[0] != "694" || routes[1].RouteNumbers[1] != "307" {
		t.Fatalf("expected transfer route numbers, got %#v", routes[1].RouteNumbers)
	}
	if len(routes[1].Legs) != 2 || routes[1].Legs[1].Route != "307" {
		t.Fatalf("expected parsed P2P legs, got %#v", routes[1].Legs)
	}
}

func TestParseStopMapResponseFindsBoardingAndAlightingStops(t *testing.T) {
	response := `
addstoponmap('001336','114.242089','22.267079','B','10','10 - 兴华邨兴翠楼','606-1','O');
addstoponmap('002180','114.196281','22.288516','A','20','20 - 渔湾邨','606-1','O');`
	leg := domain.P2PLeg{Company: "CTB", RouteVariant: "606-1", Route: "606", BoardingSeq: 10, AlightingSeq: 20, Bound: "O"}

	stops := citybus.ParseStopMapResponse(response, []domain.P2PLeg{leg})
	if len(stops) != 2 {
		t.Fatalf("expected 2 stops, got %d", len(stops))
	}
	if stops[0].StopID != "001336" || stops[0].DisplayName != "兴华邨兴翠楼" {
		t.Fatalf("unexpected first stop: %#v", stops[0])
	}
}

func TestNormalizeStopDisplayName(t *testing.T) {
	cases := []struct {
		name string
		want string
	}{
		{name: "10 - 興華邨興翠樓", want: "興華邨興翠樓"},
		{name: "樂軒臺, 柴灣道", want: "樂軒臺"},
		{name: "乐轩台, 柴湾道", want: "乐轩台"},
		{name: "Lok Hin Terrace, Chai Wan Road", want: "Lok Hin Terrace"},
		{name: "10 - , 柴灣道", want: ""},
	}
	for _, tt := range cases {
		if got := citybus.NormalizeStopDisplayName(tt.name); got != tt.want {
			t.Fatalf("NormalizeStopDisplayName(%q)=%q, want %q", tt.name, got, tt.want)
		}
	}
}

func TestParseRouteResponseParsesThreeLanguageFixtures(t *testing.T) {
	cases := []struct {
		file     string
		language domain.Language
		wantName string
	}{
		{file: "zh-hant.html", language: domain.LanguageZhHant, wantName: "606"},
		{file: "zh-hans.html", language: domain.LanguageZhHans, wantName: "606"},
		{file: "en.html", language: domain.LanguageEn, wantName: "606"},
	}
	for _, tt := range cases {
		body := readRouteFixture(t, tt.file)
		routes, err := citybus.ParseRouteResponse(body, tt.language)
		if err != nil {
			t.Fatalf("parse %s: %v", tt.file, err)
		}
		if len(routes) != 1 {
			t.Fatalf("expected one route from %s, got %d", tt.file, len(routes))
		}
		route := routes[0]
		if route.RouteNumbers[0] != tt.wantName || route.Fare.Currency != "HKD" || route.Fare.Amount != 6.1 {
			t.Fatalf("unexpected route from %s: %#v", tt.file, route)
		}
		if route.DurationMinutes != 10 || route.WalkingDistanceMeters != 266 || route.RawInfo == "" || len(route.Legs) == 0 {
			t.Fatalf("expected full parsed route from %s, got %#v", tt.file, route)
		}
	}
}

func TestSearchRoutesResolvesStopNamesAndFallbacksToShortShowstopsDisplayName(t *testing.T) {
	client := newRouteClientForTest(func(req *http.Request) (*http.Response, error) {
		if req.URL.Path == "/showstops2.php" {
			return textResponse(200, stopMapBody("樂軒臺, 柴灣道", "漁灣邨, 柴灣道")), nil
		}
		if req.URL.Query().Get("m1") == "T" {
			return textResponse(200, routeBody("606", "6.1", 10, 266, "1|*|CTB||606-1||10||20||O")), nil
		}
		return textResponse(200, emptyRouteBody()), nil
	})
	client.StopNames = fakeStopNameResolver{
		names:    map[string]string{"001336": "樂軒臺, 柴灣道"},
		failures: map[string]bool{"002180": true},
	}

	routes, err := client.SearchRoutes(context.Background(), sampleOrigin(), sampleDestination(), domain.LanguageZhHant)
	if err != nil {
		t.Fatalf("search routes: %v", err)
	}
	if routes[0].BoardingStop.Name != "樂軒臺" {
		t.Fatalf("expected StopClient short boarding name, got %#v", routes[0].BoardingStop)
	}
	if routes[0].AlightingStop.Name != "漁灣邨" {
		t.Fatalf("expected showstops2 fallback short alighting name, got %#v", routes[0].AlightingStop)
	}
}

func TestSearchRoutesCachesStopMapSuccessAcrossQueries(t *testing.T) {
	now := time.Date(2026, 7, 1, 12, 0, 0, 0, time.UTC)
	var stopMapRequests int
	logger := &capturingLogger{}
	client := newRouteClientForTest(func(req *http.Request) (*http.Response, error) {
		if req.URL.Path == "/showstops2.php" {
			stopMapRequests++
			return textResponse(200, stopMapBody("興華邨興翠樓", "漁灣邨")), nil
		}
		if req.URL.Query().Get("m1") == "T" {
			return textResponse(200, routeBody("606", "6.1", 10, 266, "1|*|CTB||606-1||10||20||O")), nil
		}
		return textResponse(200, emptyRouteBody()), nil
	})
	client.StopMapCache = memory.NewTTLCache[[]domain.P2PStop](func() time.Time { return now })
	client.Logger = logger

	for i := 0; i < 2; i++ {
		if _, err := client.SearchRoutes(context.Background(), sampleOrigin(), sampleDestination(), domain.LanguageZhHant); err != nil {
			t.Fatalf("search routes %d: %v", i, err)
		}
	}
	if stopMapRequests != 1 {
		t.Fatalf("expected cached second stop map lookup, got %d requests", stopMapRequests)
	}
	if !logger.hasEvent("stopMapResolve", "cache_hit") {
		t.Fatal("expected cache_hit observation for stop map cache")
	}

	now = now.Add(25 * time.Hour)
	if _, err := client.SearchRoutes(context.Background(), sampleOrigin(), sampleDestination(), domain.LanguageZhHant); err != nil {
		t.Fatalf("search routes after expiry: %v", err)
	}
	if stopMapRequests != 2 {
		t.Fatalf("expected expired cache to fetch again, got %d requests", stopMapRequests)
	}
}

func TestSearchRoutesDoesNotCacheStopMapFailures(t *testing.T) {
	stopMapBodyForCall := ""
	var stopMapRequests int
	client := newRouteClientForTest(func(req *http.Request) (*http.Response, error) {
		if req.URL.Path == "/showstops2.php" {
			stopMapRequests++
			return textResponse(200, stopMapBodyForCall), nil
		}
		if req.URL.Query().Get("m1") == "T" {
			return textResponse(200, routeBody("606", "6.1", 10, 266, "1|*|CTB||606-1||10||20||O")), nil
		}
		return textResponse(200, emptyRouteBody()), nil
	})
	client.StopMapCache = memory.NewTTLCache[[]domain.P2PStop](time.Now)

	routes, err := client.SearchRoutes(context.Background(), sampleOrigin(), sampleDestination(), domain.LanguageZhHant)
	if err != nil {
		t.Fatalf("search routes with empty stop map: %v", err)
	}
	if routes[0].BoardingStop.Name != "" {
		t.Fatalf("expected empty preview before stop map success, got %#v", routes[0].BoardingStop)
	}

	stopMapBodyForCall = stopMapBody("興華邨興翠樓", "漁灣邨")
	routes, err = client.SearchRoutes(context.Background(), sampleOrigin(), sampleDestination(), domain.LanguageZhHant)
	if err != nil {
		t.Fatalf("search routes after stop map success: %v", err)
	}
	if stopMapRequests != 2 {
		t.Fatalf("expected failure not to be cached, got %d requests", stopMapRequests)
	}
	if routes[0].BoardingStop.Name != "興華邨興翠樓" {
		t.Fatalf("expected second lookup to fill preview, got %#v", routes[0].BoardingStop)
	}
}

func TestSearchRoutesIsolatesStopMapCacheByLanguage(t *testing.T) {
	var stopMapRequests int
	client := newRouteClientForTest(func(req *http.Request) (*http.Response, error) {
		if req.URL.Path == "/showstops2.php" {
			stopMapRequests++
			if req.URL.Query().Get("l") == "2" {
				return textResponse(200, stopMapBody("兴华邨兴翠楼", "渔湾邨")), nil
			}
			return textResponse(200, stopMapBody("興華邨興翠樓", "漁灣邨")), nil
		}
		if req.URL.Query().Get("m1") == "T" {
			return textResponse(200, routeBody("606", "6.1", 10, 266, "1|*|CTB||606-1||10||20||O")), nil
		}
		return textResponse(200, emptyRouteBody()), nil
	})
	client.StopMapCache = memory.NewTTLCache[[]domain.P2PStop](time.Now)

	traditional, err := client.SearchRoutes(context.Background(), sampleOrigin(), sampleDestination(), domain.LanguageZhHant)
	if err != nil {
		t.Fatalf("search traditional routes: %v", err)
	}
	simplified, err := client.SearchRoutes(context.Background(), sampleOrigin(), sampleDestination(), domain.LanguageZhHans)
	if err != nil {
		t.Fatalf("search simplified routes: %v", err)
	}
	if stopMapRequests != 2 {
		t.Fatalf("expected language-isolated stop map cache, got %d requests", stopMapRequests)
	}
	if traditional[0].BoardingStop.Name != "興華邨興翠樓" || simplified[0].BoardingStop.Name != "兴华邨兴翠楼" {
		t.Fatalf("unexpected language-specific names: %#v %#v", traditional[0].BoardingStop, simplified[0].BoardingStop)
	}
}

func TestSearchRoutesFillsEtaStopIDFromCachedStopMap(t *testing.T) {
	var stopMapRequests int
	client := newRouteClientForTest(func(req *http.Request) (*http.Response, error) {
		if req.URL.Path == "/showstops2.php" {
			stopMapRequests++
			return textResponse(200, stopMapBody("興華邨興翠樓", "漁灣邨")), nil
		}
		if req.URL.Query().Get("m1") == "T" {
			return textResponse(200, routeBody("606", "6.1", 10, 266, "1|*|CTB||606-1||10||20||O")), nil
		}
		return textResponse(200, emptyRouteBody()), nil
	})
	client.StopMapCache = memory.NewTTLCache[[]domain.P2PStop](time.Now)

	if _, err := client.SearchRoutes(context.Background(), sampleOrigin(), sampleDestination(), domain.LanguageZhHant); err != nil {
		t.Fatalf("prime stop map cache: %v", err)
	}
	routes, err := client.SearchRoutes(context.Background(), sampleOrigin(), sampleDestination(), domain.LanguageZhHant)
	if err != nil {
		t.Fatalf("search from cached stop map: %v", err)
	}
	if stopMapRequests != 1 {
		t.Fatalf("expected second lookup from cache, got %d stop map requests", stopMapRequests)
	}
	if routes[0].EtaPayload == nil || routes[0].EtaPayload.StopID != "001336" {
		t.Fatalf("expected cached stop map to fill ETA stop id, got %#v", routes[0].EtaPayload)
	}
}

func TestSearchRoutesRunsModesConcurrently(t *testing.T) {
	var mu sync.Mutex
	active := 0
	maxActive := 0
	delays := map[string]time.Duration{"T": 40 * time.Millisecond, "F": 70 * time.Millisecond, "W": 100 * time.Millisecond}
	client := newRouteClientForTest(func(req *http.Request) (*http.Response, error) {
		if req.URL.Path == "/showstops2.php" {
			return textResponse(200, stopMapBody("興華邨興翠樓", "漁灣邨")), nil
		}
		mode := req.URL.Query().Get("m1")
		mu.Lock()
		active++
		if active > maxActive {
			maxActive = active
		}
		mu.Unlock()
		time.Sleep(delays[mode])
		mu.Lock()
		active--
		mu.Unlock()
		return textResponse(200, routeBody("606"+mode, "6.1", 10, 266, "1|*|CTB||606"+mode+"-1||10||20||O")), nil
	})

	start := time.Now()
	routes, err := client.SearchRoutes(context.Background(), sampleOrigin(), sampleDestination(), domain.LanguageZhHant)
	elapsed := time.Since(start)
	if err != nil {
		t.Fatalf("search routes: %v", err)
	}
	if len(routes) != 3 {
		t.Fatalf("expected three mode results, got %d", len(routes))
	}
	if maxActive < 2 {
		t.Fatalf("expected concurrent route mode requests, max active=%d", maxActive)
	}
	if elapsed >= 180*time.Millisecond {
		t.Fatalf("expected concurrent modes to finish below serial time, elapsed=%s", elapsed)
	}
}

func TestSearchRoutesKeepsSuccessfulModeOnPartialFailure(t *testing.T) {
	client := newRouteClientForTest(func(req *http.Request) (*http.Response, error) {
		if req.URL.Path == "/showstops2.php" {
			return textResponse(200, stopMapBody("興華邨興翠樓", "漁灣邨")), nil
		}
		switch req.URL.Query().Get("m1") {
		case "T":
			return textResponse(200, routeBody("606", "6.1", 10, 266, "1|*|CTB||606-1||10||20||O")), nil
		case "F":
			return textResponse(502, "bad gateway"), nil
		default:
			return textResponse(200, emptyRouteBody()), nil
		}
	})

	routes, err := client.SearchRoutes(context.Background(), sampleOrigin(), sampleDestination(), domain.LanguageZhHant)
	if err != nil {
		t.Fatalf("expected successful mode to survive failures: %v", err)
	}
	if len(routes) != 1 || routes[0].RouteNumbers[0] != "606" {
		t.Fatalf("unexpected routes: %#v", routes)
	}
}

func TestSearchRoutesRecoversModePanicAndLogsObservations(t *testing.T) {
	logger := &capturingLogger{}
	client := newRouteClientForTest(func(req *http.Request) (*http.Response, error) {
		if req.URL.Path == "/showstops2.php" {
			return textResponse(200, stopMapBody("興華邨興翠樓", "漁灣邨")), nil
		}
		switch req.URL.Query().Get("m1") {
		case "T":
			return textResponse(200, routeBody("606", "6.1", 10, 266, "1|*|CTB||606-1||10||20||O")), nil
		case "F":
			panic("synthetic mode panic")
		default:
			return textResponse(200, emptyRouteBody()), nil
		}
	})
	client.Logger = logger

	routes, err := client.SearchRoutes(context.Background(), sampleOrigin(), sampleDestination(), domain.LanguageZhHant)
	if err != nil {
		t.Fatalf("expected panic to be recovered: %v", err)
	}
	if len(routes) != 1 {
		t.Fatalf("expected successful route after panic recovery, got %d", len(routes))
	}
	if !logger.hasEvent("citybusRouteMode", "panic_recovery") {
		t.Fatal("expected panic_recovery observation")
	}
	if !logger.hasEvent("citybusRouteMode", "mode_failed") {
		t.Fatal("expected failed mode observation")
	}
	for _, event := range logger.eventsSnapshot() {
		for key := range event.Fields {
			lower := strings.ToLower(key)
			if strings.Contains(lower, "token") || strings.Contains(lower, "url") || strings.Contains(lower, "html") || strings.Contains(lower, "raw") {
				t.Fatalf("unexpected sensitive log field %q in %#v", key, event)
			}
		}
	}
}

func TestSearchRoutesMergesDeterministicallyBeforeDedupe(t *testing.T) {
	client := newRouteClientForTest(func(req *http.Request) (*http.Response, error) {
		if req.URL.Path == "/showstops2.php" {
			return textResponse(200, stopMapBody("興華邨興翠樓", "漁灣邨")), nil
		}
		switch req.URL.Query().Get("m1") {
		case "T":
			time.Sleep(60 * time.Millisecond)
			return textResponse(200, routeBody("606", "6.1", 10, 266, "1|*|CTB||606-1||10||20||O")), nil
		case "F":
			return textResponse(200, routeBody("608", "6.1", 10, 266, "1|*|CTB||608-1||10||20||O")), nil
		default:
			return textResponse(200, emptyRouteBody()), nil
		}
	})

	routes, err := client.SearchRoutes(context.Background(), sampleOrigin(), sampleDestination(), domain.LanguageZhHant)
	if err != nil {
		t.Fatalf("search routes: %v", err)
	}
	if len(routes) != 2 || routes[0].RouteNumbers[0] != "606" || routes[1].RouteNumbers[0] != "608" {
		t.Fatalf("expected deterministic T then F merge, got %#v", routes)
	}
}

func TestSearchRoutesReturnsExistingFallbackWhenAllModesFail(t *testing.T) {
	client := newRouteClientForTest(func(req *http.Request) (*http.Response, error) {
		return textResponse(200, emptyRouteBody()), nil
	})

	_, err := client.SearchRoutes(context.Background(), sampleOrigin(), sampleDestination(), domain.LanguageZhHant)
	if err == nil || !strings.Contains(err.Error(), "citybus route query returned no parseable results") {
		t.Fatalf("expected existing no parseable results error, got %v", err)
	}
}

func readRouteFixture(t *testing.T, file string) string {
	t.Helper()
	body, err := os.ReadFile("testdata/route-query/" + file)
	if err != nil {
		t.Fatalf("read fixture %s: %v", file, err)
	}
	return string(body)
}

func newRouteClientForTest(handler func(*http.Request) (*http.Response, error)) *citybus.RouteClient {
	return &citybus.RouteClient{
		BaseURL:    "https://citybus.test/ppsearch_p3.php",
		StopMapURL: "https://citybus.test/showstops2.php",
		HTTPClient: &http.Client{Transport: roundTripFunc(handler)},
		Now:        func() time.Time { return time.Date(2026, 7, 1, 12, 0, 0, 0, time.UTC) },
	}
}

func routeBody(route string, fare string, duration int, walking int, rawInfo string) string {
	return `<div id="routelist2"><table aria-label="` + route + ` 港元 ` + fare + ` 預計 ` + strconvItoa(duration) + ` 分鐘 步行距離 (約) ` + strconvItoa(walking) + ` 米" onclick="showroutep2p('` + rawInfo + `','list-a','general-a')"></table></div>`
}

func emptyRouteBody() string {
	return `<div id="routelist2"><table aria-label="沒有可用路線"></table></div>`
}

func stopMapBody(boardName string, alightName string) string {
	return `
addstoponmap('001336','114.242089','22.267079','B','10','10 - ` + boardName + `','606-1','O');
addstoponmap('002180','114.196281','22.288516','A','20','20 - ` + alightName + `','606-1','O');`
}

func sampleOrigin() domain.PlaceTokenPayload {
	return domain.PlaceTokenPayload{Name: "origin", Lat: 22.267079, Lon: 114.242089, Language: domain.LanguageZhHant}
}

func sampleDestination() domain.PlaceTokenPayload {
	return domain.PlaceTokenPayload{Name: "destination", Lat: 22.288516, Lon: 114.196281, Language: domain.LanguageZhHant}
}

type fakeStopNameResolver struct {
	names    map[string]string
	failures map[string]bool
}

func (f fakeStopNameResolver) ResolveStopName(_ context.Context, stopID string, _ domain.Language) (string, error) {
	if f.failures[stopID] {
		return "", errors.New("stop name unavailable")
	}
	return f.names[stopID], nil
}

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(req *http.Request) (*http.Response, error) {
	return f(req)
}

func textResponse(status int, body string) *http.Response {
	return &http.Response{
		StatusCode: status,
		Body:       io.NopCloser(strings.NewReader(body)),
		Header:     make(http.Header),
	}
}

type capturingLogger struct {
	mu     sync.Mutex
	events []domain.QueryLogEvent
}

func (l *capturingLogger) Info(event domain.QueryLogEvent) {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.events = append(l.events, event)
}

func (l *capturingLogger) hasEvent(operationID string, stage string) bool {
	for _, event := range l.eventsSnapshot() {
		if event.OperationID == operationID && event.Stage == stage {
			return true
		}
	}
	return false
}

func (l *capturingLogger) eventsSnapshot() []domain.QueryLogEvent {
	l.mu.Lock()
	defer l.mu.Unlock()
	return append([]domain.QueryLogEvent(nil), l.events...)
}

func strconvItoa(value int) string {
	return strconv.FormatInt(int64(value), 10)
}
