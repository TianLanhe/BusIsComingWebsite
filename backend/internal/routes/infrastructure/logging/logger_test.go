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
		RequestID:   "req-1",
		OperationID: "queryRouteOptions",
		Stage:       "external_call",
		Language:    domain.LanguageZhHans,
		OriginName:  "兴华邨兴翠楼",
		ErrorCode:   string(domain.ErrExternalUnavailable),
		Fields: map[string]any{
			"token":       "place-token-secret",
			"cookie":      "PHPSESSID=secret",
			"externalURL": "https://mobile.citybus.com.hk/nwp3/ppsearch_p3.php?slat=1&slon=2",
			"rawHTML":     "<html>secret</html>",
			"safe":        "kept",
		},
	})

	logLine := output.String()
	for _, forbidden := range []string{"place-token-secret", "PHPSESSID", "slat=1", "<html>"} {
		if strings.Contains(logLine, forbidden) {
			t.Fatalf("log line leaked %q: %s", forbidden, logLine)
		}
	}
	if !strings.Contains(logLine, `"safe":"kept"`) {
		t.Fatalf("expected safe field to remain, got %s", logLine)
	}
}
