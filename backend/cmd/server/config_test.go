package main

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	analyticsapp "busiscoming-website/backend/internal/analytics/application"
	analyticshttp "busiscoming-website/backend/internal/analytics/interfaces/http"
	platformhttp "busiscoming-website/backend/internal/platform/httpserver"
	"github.com/gin-gonic/gin"
)

func TestAnalyticsWriteTimeoutConfig(t *testing.T) {
	tests := []struct {
		name    string
		raw     string
		timeout time.Duration
		enabled bool
		reason  analyticsapp.HealthReason
	}{
		{"unset", "", 50 * time.Millisecond, true, analyticsapp.ReasonNone},
		{"minimum", "10", 10 * time.Millisecond, true, analyticsapp.ReasonNone},
		{"default explicit", "50", 50 * time.Millisecond, true, analyticsapp.ReasonNone},
		{"maximum", "200", 200 * time.Millisecond, true, analyticsapp.ReasonNone},
		{"below minimum", "9", 0, false, analyticsapp.ReasonInvalidWriteTimeout},
		{"above maximum", "201", 0, false, analyticsapp.ReasonInvalidWriteTimeout},
		{"zero", "0", 0, false, analyticsapp.ReasonInvalidWriteTimeout},
		{"negative", "-1", 0, false, analyticsapp.ReasonInvalidWriteTimeout},
		{"decimal", "10.5", 0, false, analyticsapp.ReasonInvalidWriteTimeout},
		{"text", "slow", 0, false, analyticsapp.ReasonInvalidWriteTimeout},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			config := parseAnalyticsWriteTimeout(test.raw)
			if config.Timeout != test.timeout || config.Enabled != test.enabled || config.Reason != test.reason {
				t.Fatalf("unexpected config: %#v", config)
			}
		})
	}
}

func TestServerAddresses(t *testing.T) {
	t.Setenv("BUS_HTTP_HOST", "")
	t.Setenv("PORT", "")
	t.Setenv("BUS_ANALYTICS_PRIVATE_PORT", "")
	if got := publicServerAddress(); got != "127.0.0.1:8080" {
		t.Fatalf("unexpected public default: %q", got)
	}
	if got := privateServerAddress(); got != "127.0.0.1:18081" {
		t.Fatalf("unexpected private default: %q", got)
	}

	t.Setenv("BUS_HTTP_HOST", "192.168.1.10")
	t.Setenv("PORT", "9000")
	t.Setenv("BUS_ANALYTICS_PRIVATE_PORT", "19081")
	if got := publicServerAddress(); got != "192.168.1.10:9000" {
		t.Fatalf("unexpected public override: %q", got)
	}
	if got := privateServerAddress(); got != "127.0.0.1:19081" {
		t.Fatalf("private listener must remain loopback: %q", got)
	}
}

func TestConfiguredPrivateServerAddressRejectsNonLoopback(t *testing.T) {
	for _, host := range []string{"localhost", "::1", "::ffff:127.0.0.1", "127.0.0.1"} {
		t.Run(host, func(t *testing.T) {
			t.Setenv("BUS_ANALYTICS_PRIVATE_HOST", host)
			t.Setenv("BUS_ANALYTICS_PRIVATE_PORT", "19081")
			if address, err := configuredPrivateServerAddress(); err != nil || address != "127.0.0.1:19081" {
				t.Fatalf("private listener failed to canonicalize %q: %q %v", host, address, err)
			}
		})
	}
	for _, host := range []string{"127.0.0.1x", "0.0.0.0", "::", "192.168.1.10", "not a host"} {
		t.Run("reject_"+host, func(t *testing.T) {
			t.Setenv("BUS_ANALYTICS_PRIVATE_HOST", host)
			if _, err := configuredPrivateServerAddress(); err == nil {
				t.Fatalf("private listener accepted %q", host)
			}
		})
	}
	t.Setenv("BUS_ANALYTICS_PRIVATE_HOST", "127.0.0.1")
	t.Setenv("BUS_ANALYTICS_PRIVATE_PORT", "19081")
	if address, err := configuredPrivateServerAddress(); err != nil || address != "127.0.0.1:19081" {
		t.Fatalf("actual configured loopback address was not preserved: %q %v", address, err)
	}
}

func TestConfiguredPrivateAddressIsTheSystemResponseAddress(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv("BUS_ANALYTICS_PRIVATE_HOST", "127.0.0.1")
	t.Setenv("BUS_ANALYTICS_PRIVATE_PORT", "19081")
	address, err := configuredPrivateServerAddress()
	if err != nil {
		t.Fatal(err)
	}
	engine := platformhttp.NewPrivateEngine(&bytes.Buffer{})
	details := analyticsapp.NewQueryDetailsWithBindAddress(nil, nil, analyticsapp.ClockFunc(time.Now), analyticsapp.ListenerStateFunc(func() string { return "available" }), address)
	analyticshttp.RegisterPrivateRoutes(engine, nil, details, "")
	response := httptest.NewRecorder()
	engine.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/api/analytics/system", nil))
	if response.Code != http.StatusOK || !bytes.Contains(response.Body.Bytes(), []byte(`"bindAddress":"127.0.0.1:19081"`)) {
		t.Fatalf("configured address was not injected: %d %s", response.Code, response.Body.String())
	}
}
