package httpserver

import (
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
