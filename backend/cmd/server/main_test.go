package main

import "testing"

func TestServerAddressDefaultsToAllInterfaces(t *testing.T) {
	t.Setenv("BUS_HTTP_HOST", "")
	t.Setenv("PORT", "")

	if got := serverAddress(); got != "0.0.0.0:8080" {
		t.Fatalf("expected default all-interface address, got %q", got)
	}
}

func TestServerAddressAllowsHostAndPortOverrides(t *testing.T) {
	t.Setenv("BUS_HTTP_HOST", "192.168.1.10")
	t.Setenv("PORT", "9000")

	if got := serverAddress(); got != "192.168.1.10:9000" {
		t.Fatalf("expected custom address, got %q", got)
	}
}
