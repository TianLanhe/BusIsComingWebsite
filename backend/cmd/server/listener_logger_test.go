package main

import (
	"bytes"
	"strings"
	"testing"

	platformhttp "busiscoming-website/backend/internal/platform/httpserver"
)

func TestWriteListenerReportPreservesSanitizedPanicEvidence(t *testing.T) {
	var output bytes.Buffer
	writeListenerReport(&output, platformhttp.ServerReport{
		Name: "private", State: platformhttp.ListenerUnavailable, Reason: "panic_recovered",
		ErrorKind: "panic", Context: "listener_serve", StackHash: "a1b2c3d4e5f60708",
	})
	text := output.String()
	for _, expected := range []string{`"listener":"private"`, `"reason":"panic_recovered"`, `"errorKind":"panic"`, `"context":"listener_serve"`, `"stackHash":"a1b2c3d4e5f60708"`} {
		if !strings.Contains(text, expected) {
			t.Fatalf("missing controlled listener field %s in %s", expected, text)
		}
	}
	if strings.Contains(text, "sensitive panic value") {
		t.Fatalf("listener log leaked panic text: %s", text)
	}
}
