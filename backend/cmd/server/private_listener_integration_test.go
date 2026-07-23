package main

import (
	"bytes"
	"context"
	"errors"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"testing"
	"time"

	analyticsapp "busiscoming-website/backend/internal/analytics/application"
	analyticshttp "busiscoming-website/backend/internal/analytics/interfaces/http"
	platformhttp "busiscoming-website/backend/internal/platform/httpserver"
	"github.com/gin-gonic/gin"
)

func TestPublicAndPrivateListenersKeepMonitoringResourcesPhysicallySeparated(t *testing.T) {
	gin.SetMode(gin.TestMode)
	uiRoot := t.TempDir()
	if err := os.WriteFile(filepath.Join(uiRoot, "index.html"), []byte("private-monitor-sentinel"), 0o600); err != nil {
		t.Fatal(err)
	}

	var output bytes.Buffer
	publicEngine := platformhttp.NewPublicEngine(&output, noOpAnalyticsMiddleware())
	publicEngine.GET("/healthz", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status": "ok"}) })
	privateEngine := platformhttp.NewPrivateEngine(&output)
	details := analyticsapp.NewQueryDetails(nil, nil, analyticsapp.ClockFunc(time.Now), nil)
	analyticshttp.RegisterPrivateRoutes(privateEngine, nil, details, uiRoot)
	privateEngine.GET("/__panic", func(c *gin.Context) { panic("private-handler-sentinel") })

	publicURL, privateURL, stop := startListenerPair(t, publicEngine, privateEngine)
	defer stop()

	if status := getStatus(t, publicURL+"/"); status != http.StatusNotFound {
		t.Fatalf("public listener exposed monitor HTML: %d", status)
	}
	query := "?from=2026-06-01T00%3A00%3A00Z&to=2026-07-01T00%3A00%3A00Z&granularity=day"
	if status := getStatus(t, publicURL+"/api/analytics/overview"+query); status != http.StatusNotFound {
		t.Fatalf("public listener exposed analytics API: %d", status)
	}
	if status := getStatus(t, privateURL+"/"); status != http.StatusOK {
		t.Fatalf("private listener did not serve monitor HTML: %d", status)
	}

	privatePaths := []string{
		"/api/analytics/overview" + query,
		"/api/analytics/traffic" + query,
		"/api/analytics/downloads" + query,
		"/api/analytics/events" + query,
		"/api/analytics/visitor",
		"/api/analytics/performance" + query,
		"/api/analytics/system",
	}
	for _, path := range privatePaths {
		if status := getStatus(t, privateURL+path); status == http.StatusNotFound {
			t.Fatalf("private listener is missing route %s", path)
		}
	}

	if status := getStatus(t, privateURL+"/__panic"); status != http.StatusInternalServerError {
		t.Fatalf("private panic status = %d, want 500", status)
	}
	if status := getStatus(t, publicURL+"/healthz"); status != http.StatusOK {
		t.Fatalf("public listener did not survive private handler panic: %d", status)
	}
}

func TestPrivateListenerStartupFailureDoesNotStopPublicListener(t *testing.T) {
	gin.SetMode(gin.TestMode)
	publicListener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	publicEngine := platformhttp.NewPublicEngine(&bytes.Buffer{}, noOpAnalyticsMiddleware())
	publicEngine.GET("/healthz", func(c *gin.Context) { c.Status(http.StatusOK) })
	publicServer := &http.Server{Handler: publicEngine, ReadHeaderTimeout: time.Second}

	ctx, cancel := context.WithCancel(context.Background())
	reports := make(chan platformhttp.ServerReport, 8)
	supervisor := platformhttp.NewSupervisor([]platformhttp.ManagedServer{
		{Name: "public", Required: true, Serve: func() error { return publicServer.Serve(publicListener) }, Shutdown: publicServer.Shutdown},
		{Name: "private", Required: false, Serve: func() error { return errors.New("private bind failed") }, Shutdown: func(context.Context) error { return nil }},
	}, time.Second, func(report platformhttp.ServerReport) { reports <- report })
	result := make(chan error, 1)
	go func() { result <- supervisor.Run(ctx) }()

	waitForListenerReport(t, reports, "private", platformhttp.ListenerUnavailable)
	if status := getStatus(t, "http://"+publicListener.Addr().String()+"/healthz"); status != http.StatusOK {
		t.Fatalf("public listener stopped after private startup failure: %d", status)
	}
	cancel()
	if err := <-result; err != nil {
		t.Fatalf("supervisor returned after optional private failure: %v", err)
	}
}

func startListenerPair(t *testing.T, publicHandler, privateHandler http.Handler) (string, string, func()) {
	t.Helper()
	publicListener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	privateListener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		_ = publicListener.Close()
		t.Fatal(err)
	}
	publicServer := &http.Server{Handler: publicHandler, ReadHeaderTimeout: time.Second}
	privateServer := &http.Server{Handler: privateHandler, ReadHeaderTimeout: time.Second}
	ctx, cancel := context.WithCancel(context.Background())
	supervisor := platformhttp.NewSupervisor([]platformhttp.ManagedServer{
		{Name: "public", Required: true, Serve: func() error { return publicServer.Serve(publicListener) }, Shutdown: publicServer.Shutdown},
		{Name: "private", Required: false, Serve: func() error { return privateServer.Serve(privateListener) }, Shutdown: privateServer.Shutdown},
	}, time.Second, nil)
	result := make(chan error, 1)
	go func() { result <- supervisor.Run(ctx) }()
	stop := func() {
		cancel()
		if err := <-result; err != nil {
			t.Errorf("listener pair shutdown: %v", err)
		}
	}
	return "http://" + publicListener.Addr().String(), "http://" + privateListener.Addr().String(), stop
}

func getStatus(t *testing.T, url string) int {
	t.Helper()
	client := &http.Client{Timeout: 2 * time.Second}
	response, err := client.Get(url)
	if err != nil {
		t.Fatalf("GET %s: %v", url, err)
	}
	defer response.Body.Close()
	return response.StatusCode
}

func waitForListenerReport(t *testing.T, reports <-chan platformhttp.ServerReport, name string, state platformhttp.ListenerState) {
	t.Helper()
	timer := time.NewTimer(2 * time.Second)
	defer timer.Stop()
	for {
		select {
		case report := <-reports:
			if report.Name == name && report.State == state {
				return
			}
		case <-timer.C:
			t.Fatalf("timed out waiting for %s=%s", name, state)
		}
	}
}
