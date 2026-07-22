package httpserver

import (
	"bytes"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestPublicEngineRunsInjectedAnalyticsMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)
	called := 0
	engine := NewPublicEngine(io.Discard, func(c *gin.Context) {
		called++
		c.Next()
	})
	engine.GET("/ok", func(c *gin.Context) { c.Status(http.StatusNoContent) })
	engine.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/ok", nil))
	if called != 1 {
		t.Fatalf("expected one injected analytics call, got %d", called)
	}
}

func TestPublicEngineRecoversAnalyticsMiddlewarePanic(t *testing.T) {
	gin.SetMode(gin.TestMode)
	var output bytes.Buffer
	engine := NewPublicEngine(&output, func(*gin.Context) {
		panic("analytics-middleware-sensitive-value")
	})
	engine.GET("/ok", func(c *gin.Context) { c.Status(http.StatusNoContent) })
	response := httptest.NewRecorder()
	engine.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/ok", nil))

	if response.Code != http.StatusInternalServerError {
		t.Fatalf("expected analytics middleware panic to be recovered as 500, got %d", response.Code)
	}
	if bytes.Contains(output.Bytes(), []byte("analytics-middleware-sensitive-value")) {
		t.Fatalf("panic value leaked to sanitized log: %s", output.String())
	}
}

func TestPrivateEngineHasNoAnalyticsInjectionPoint(t *testing.T) {
	gin.SetMode(gin.TestMode)
	engine := NewPrivateEngine(io.Discard)
	engine.GET("/ok", func(c *gin.Context) { c.Status(http.StatusNoContent) })
	response := httptest.NewRecorder()
	engine.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/ok", nil))
	if response.Code != http.StatusNoContent {
		t.Fatalf("unexpected private response: %d", response.Code)
	}
}
