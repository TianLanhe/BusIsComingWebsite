package logging_test

import (
	"bytes"
	"strings"
	"testing"

	"busiscoming-website/backend/internal/routes/domain"
	routeLogging "busiscoming-website/backend/internal/routes/infrastructure/logging"
)

func TestLoggerRedactsSensitiveFields(t *testing.T) {
	var output bytes.Buffer
	logger := routeLogging.NewJSONLogger(&output)

	logger.Info(domain.QueryLogEvent{
		RequestID:   "client-request-sentinel",
		OperationID: "queryRouteOptions",
		Stage:       "external_call",
		Language:    domain.LanguageZhHans,
		OriginName:  "origin-name-sentinel",
		ErrorCode:   string(domain.ErrExternalUnavailable),
		Fields: map[string]any{
			"token":       "place-token-secret",
			"cookie":      "PHPSESSID=secret",
			"externalURL": "https://mobile.citybus.com.hk/nwp3/ppsearch_p3.php?slat=1&slon=2",
			"rawHTML":     "<html>secret</html>",
			"error":       "panic-value-sentinel",
			"reason":      "request_failed",
		},
	})

	logLine := output.String()
	for _, forbidden := range []string{"place-token-secret", "PHPSESSID", "slat=1", "<html>", "client-request-sentinel", "origin-name-sentinel", "panic-value-sentinel"} {
		if strings.Contains(logLine, forbidden) {
			t.Fatalf("log line leaked %q: %s", forbidden, logLine)
		}
	}
	if !strings.Contains(logLine, `"reason":"request_failed"`) {
		t.Fatalf("expected bounded reason to remain, got %s", logLine)
	}
}
