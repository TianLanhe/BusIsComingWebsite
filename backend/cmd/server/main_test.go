package main

import "testing"

func TestPublicServerAddressDefaultsToLoopback(t *testing.T) {
	t.Setenv("BUS_HTTP_HOST", "")
	t.Setenv("PORT", "")
	if got := publicServerAddress(); got != "127.0.0.1:8080" {
		t.Fatalf("expected loopback default, got %q", got)
	}
}

func TestPublicServerAddressAllowsExplicitDeploymentOverride(t *testing.T) {
	t.Setenv("BUS_HTTP_HOST", "0.0.0.0")
	t.Setenv("PORT", "9000")
	if got := publicServerAddress(); got != "0.0.0.0:9000" {
		t.Fatalf("expected explicit deployment address, got %q", got)
	}
}
