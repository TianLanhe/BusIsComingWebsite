package httpserver

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"io"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	requestIDKey      = "platform.request_id"
	operationIDKey    = "platform.operation_id"
	boundedContextKey = "platform.bounded_context"
)

type synchronizedWriter struct {
	writer io.Writer
	mutex  sync.Mutex
}

func (writer *synchronizedWriter) Write(value []byte) (int, error) {
	writer.mutex.Lock()
	defer writer.mutex.Unlock()
	return writer.writer.Write(value)
}

func RequestLogger(output io.Writer) gin.HandlerFunc {
	return func(c *gin.Context) {
		startedAt := time.Now()
		requestID := newRequestID()
		c.Set(requestIDKey, requestID)
		c.Next()

		route := c.FullPath()
		if route == "" {
			route = "unmatched"
		}
		operationID, _ := c.Get(operationIDKey)
		boundedContext, _ := c.Get(boundedContextKey)
		if operationID == nil || boundedContext == nil {
			fallbackOperation, fallbackContext := metadataForRoute(c.Request.Method, route)
			if operationID == nil {
				operationID = fallbackOperation
			}
			if boundedContext == nil {
				boundedContext = fallbackContext
			}
		}
		writeJSON(output, map[string]any{
			"event":          "http_request",
			"requestId":      requestID,
			"method":         c.Request.Method,
			"route":          route,
			"operationId":    stringValue(operationID, "unmatched"),
			"boundedContext": stringValue(boundedContext, "platform"),
			"status":         c.Writer.Status(),
			"durationMs":     time.Since(startedAt).Milliseconds(),
			"bodySize":       c.Writer.Size(),
		})
	}
}

func SetRequestMetadata(c *gin.Context, operationID, boundedContext string) {
	c.Set(operationIDKey, operationID)
	c.Set(boundedContextKey, boundedContext)
}

func RequestID(c *gin.Context) string {
	value, _ := c.Get(requestIDKey)
	result, _ := value.(string)
	return result
}

func newRequestID() string {
	buffer := make([]byte, 12)
	if _, err := rand.Read(buffer); err == nil {
		return base64.RawURLEncoding.EncodeToString(buffer)
	}
	return base64.RawURLEncoding.EncodeToString([]byte(time.Now().UTC().Format("150405.000000000")))
}

func writeJSON(output io.Writer, value map[string]any) {
	encoded, err := json.Marshal(value)
	if err != nil {
		return
	}
	encoded = append(encoded, '\n')
	_, _ = output.Write(encoded)
}

func stringValue(value any, fallback string) string {
	text, ok := value.(string)
	if !ok || text == "" {
		return fallback
	}
	return text
}

func metadataForRoute(method, route string) (string, string) {
	key := method + " " + route
	switch key {
	case "GET /healthz":
		return "getPublicHealth", "platform"
	case "GET /api/downloads/android/latest":
		return "downloadLatestAndroidApk", "downloads"
	case "GET /api/downloads/android/latest/metadata":
		return "getLatestAndroidApkMetadata", "downloads"
	case "POST /api/routes/query_places":
		return "queryRoutePlaces", "routes"
	case "POST /api/routes/query_routes":
		return "queryRouteOptions", "routes"
	case "POST /api/routes/query_etas":
		return "queryRouteEtas", "routes"
	default:
		return "unmatched", "platform"
	}
}
