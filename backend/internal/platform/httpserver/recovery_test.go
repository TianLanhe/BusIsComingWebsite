package httpserver

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestRecoveryReturnsControlled500WithoutPanicOrRequestDump(t *testing.T) {
	gin.SetMode(gin.TestMode)
	var output bytes.Buffer
	engine := gin.New()
	engine.Use(Recovery(&output))
	engine.POST("/panic", func(c *gin.Context) {
		panic("panic-value-sentinel")
	})

	request := httptest.NewRequest(http.MethodPost, "/panic?query-sentinel", strings.NewReader("body-sentinel"))
	request.Header.Set("Cookie", "cookie-sentinel")
	response := httptest.NewRecorder()
	engine.ServeHTTP(response, request)

	if response.Code != http.StatusInternalServerError {
		t.Fatalf("expected controlled 500, got %d", response.Code)
	}
	combined := output.String() + response.Body.String()
	for _, forbidden := range []string{"panic-value-sentinel", "query-sentinel", "body-sentinel", "cookie-sentinel"} {
		if strings.Contains(combined, forbidden) {
			t.Fatalf("recovery leaked %q: %s", forbidden, combined)
		}
	}
	if !strings.Contains(response.Body.String(), `"code":"internal_error"`) {
		t.Fatalf("unexpected response: %s", response.Body.String())
	}
	if !strings.Contains(output.String(), `"event":"panic_recovered"`) {
		t.Fatalf("missing controlled recovery event: %s", output.String())
	}
}
