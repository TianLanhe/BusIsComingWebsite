package main

import (
	"fmt"
	"net"
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
	address, err := configuredPrivateServerAddress()
	if err != nil {
		return ""
	}
	return address
}

func configuredPrivateServerAddress() (string, error) {
	host := getenv("BUS_ANALYTICS_PRIVATE_HOST", "127.0.0.1")
	if host != "localhost" {
		ip := net.ParseIP(host)
		if ip == nil || !ip.IsLoopback() {
			return "", fmt.Errorf("analytics private listener must use a loopback host")
		}
	}
	port, err := strconv.Atoi(getenv("BUS_ANALYTICS_PRIVATE_PORT", "18081"))
	if err != nil || port < 1 || port > 65535 {
		return "", fmt.Errorf("analytics private listener port is invalid")
	}
	// 对外快照只公开契约允许的一种 loopback 字面量，避免把输入别名当作运行时网络身份。
	return "127.0.0.1:" + strconv.Itoa(port), nil
}
