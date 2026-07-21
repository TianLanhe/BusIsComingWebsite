package main

import (
	"strconv"
	"time"

	analyticsapp "busiscoming-website/backend/internal/analytics/application"
)

type analyticsWriteTimeoutConfig struct {
	Timeout time.Duration
	Enabled bool
	Reason  analyticsapp.HealthReason
}

func parseAnalyticsWriteTimeout(raw string) analyticsWriteTimeoutConfig {
	if raw == "" {
		return analyticsWriteTimeoutConfig{Timeout: analyticsapp.DefaultWriteTimeout, Enabled: true}
	}
	milliseconds, err := strconv.Atoi(raw)
	if err != nil || milliseconds < 10 || milliseconds > 200 {
		return analyticsWriteTimeoutConfig{Enabled: false, Reason: analyticsapp.ReasonInvalidWriteTimeout}
	}
	return analyticsWriteTimeoutConfig{Timeout: time.Duration(milliseconds) * time.Millisecond, Enabled: true}
}

func publicServerAddress() string {
	host := getenv("BUS_HTTP_HOST", "127.0.0.1")
	port := getenv("PORT", "8080")
	return host + ":" + port
}

func privateServerAddress() string {
	return "127.0.0.1:" + getenv("BUS_ANALYTICS_PRIVATE_PORT", "18081")
}
