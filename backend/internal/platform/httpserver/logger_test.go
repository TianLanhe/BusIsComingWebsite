package httpserver

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestRequestLoggerUsesOnlySanitizedStructuredFields(t *testing.T) {
	gin.SetMode(gin.TestMode)
	var output bytes.Buffer
	engine := gin.New()
	engine.Use(RequestLogger(&output))
	engine.POST("/safe", func(c *gin.Context) {
		SetRequestMetadata(c, "queryRoutePlaces", "routes")
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	request := httptest.NewRequest(http.MethodPost, "/safe?query-sentinel", strings.NewReader(`{"body":"body-sentinel"}`))
	request.RemoteAddr = "203.0.113.77:1234"
	request.Header.Set("User-Agent", "ua-sentinel")
	request.Header.Set("Referer", "https://referrer-sentinel.example/path")
	request.Header.Set("Cookie", "visitor=cookie-sentinel")
	request.Header.Set("X-Request-ID", "client-request-sentinel")
	response := httptest.NewRecorder()
	engine.ServeHTTP(response, request)

	logLine := output.String()
	for _, forbidden := range []string{"203.0.113.77", "query-sentinel", "body-sentinel", "ua-sentinel", "referrer-sentinel", "cookie-sentinel", "client-request-sentinel"} {
		if strings.Contains(logLine, forbidden) {
			t.Fatalf("request log leaked %q: %s", forbidden, logLine)
		}
	}
	for _, allowed := range []string{`"method":"POST"`, `"route":"/safe"`, `"operationId":"queryRoutePlaces"`, `"boundedContext":"routes"`, `"status":200`, `"bodySize"`} {
		if !strings.Contains(logLine, allowed) {
			t.Fatalf("missing %s in log: %s", allowed, logLine)
		}
	}
}

func TestRequestLoggerUsesUnmatchedInsteadOfActualURI(t *testing.T) {
	gin.SetMode(gin.TestMode)
	var output bytes.Buffer
	engine := gin.New()
	engine.Use(RequestLogger(&output))
	response := httptest.NewRecorder()
	engine.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/private-path-sentinel?query-sentinel", nil))
	if strings.Contains(output.String(), "private-path-sentinel") || strings.Contains(output.String(), "query-sentinel") {
		t.Fatalf("unmatched request leaked URI: %s", output.String())
	}
	if !strings.Contains(output.String(), `"route":"unmatched"`) {
		t.Fatalf("expected fixed unmatched route: %s", output.String())
	}
}
