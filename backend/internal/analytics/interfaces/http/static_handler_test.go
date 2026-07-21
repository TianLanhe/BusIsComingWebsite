package http

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestStaticFallbackIsNoStoreAndDoesNotMaskPrivateAPI404(t *testing.T) {
	gin.SetMode(gin.TestMode)
	root := t.TempDir()
	if err := os.WriteFile(filepath.Join(root, "index.html"), []byte("dashboard"), 0o600); err != nil {
		t.Fatal(err)
	}
	engine := gin.New()
	RegisterStaticFallback(engine, root)

	page := httptest.NewRecorder()
	engine.ServeHTTP(page, httptest.NewRequest(http.MethodGet, "/events", nil))
	if page.Code != http.StatusOK || page.Header().Get("Cache-Control") != "no-store" || page.Body.String() != "dashboard" {
		t.Fatalf("unexpected SPA fallback: status=%d cache=%q body=%q", page.Code, page.Header().Get("Cache-Control"), page.Body.String())
	}

	api := httptest.NewRecorder()
	engine.ServeHTTP(api, httptest.NewRequest(http.MethodGet, "/api/analytics/missing", nil))
	if api.Code != http.StatusNotFound || api.Header().Get("Cache-Control") != "no-store" {
		t.Fatalf("unexpected API fallback: status=%d cache=%q", api.Code, api.Header().Get("Cache-Control"))
	}
}
