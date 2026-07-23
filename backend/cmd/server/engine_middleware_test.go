package main

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	platformhttp "busiscoming-website/backend/internal/platform/httpserver"
	"github.com/gin-gonic/gin"
)

func TestPublicEngineMiddlewareOrder(t *testing.T) {
	gin.SetMode(gin.TestMode)
	var output bytes.Buffer
	analyticsSawRequestID := false
	analyticsSawRecoveredStatus := false
	analytics := func(c *gin.Context) {
		analyticsSawRequestID = platformhttp.RequestID(c) != ""
		c.Next()
		analyticsSawRecoveredStatus = c.Writer.Status() == http.StatusInternalServerError
	}
	engine := platformhttp.NewPublicEngine(&output, analytics)
	engine.GET("/panic", func(c *gin.Context) { panic("sensitive panic") })
	response := httptest.NewRecorder()
	engine.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/panic", nil))

	if !analyticsSawRequestID {
		t.Fatal("request logger must initialize server request ID before analytics")
	}
	if !analyticsSawRecoveredStatus {
		t.Fatal("recovery must complete before analytics observes the response")
	}
	if response.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", response.Code)
	}
}

func TestPrivateEngineHasLoggerAndRecovery(t *testing.T) {
	gin.SetMode(gin.TestMode)
	var output bytes.Buffer
	engine := platformhttp.NewPrivateEngine(&output)
	engine.GET("/panic", func(c *gin.Context) { panic("sensitive panic") })
	response := httptest.NewRecorder()
	engine.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/panic", nil))
	if response.Code != http.StatusInternalServerError || output.Len() == 0 {
		t.Fatalf("private engine did not apply recovery/logger: status=%d log=%s", response.Code, output.String())
	}
}
