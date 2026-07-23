package http

import (
	"go/parser"
	"go/token"
	"path/filepath"
	"testing"
)

func TestTrackingMiddlewareDependsOnlyOnApplicationPorts(t *testing.T) {
	file, err := parser.ParseFile(token.NewFileSet(), filepath.Join("tracking_middleware.go"), nil, parser.ImportsOnly)
	if err != nil {
		t.Fatal(err)
	}
	for _, imported := range file.Imports {
		path := imported.Path.Value
		if path == `"busiscoming-website/backend/internal/analytics/infrastructure/classification"` || path == `"busiscoming-website/backend/internal/analytics/infrastructure/signing"` {
			t.Fatalf("HTTP adapter must depend on application ports, not concrete infrastructure: %s", path)
		}
	}
}
