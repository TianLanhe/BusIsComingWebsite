package logging

import (
	"encoding/json"
	"io"
	"strings"
	"time"

	"busiscoming-website/backend/internal/routes/domain"
)

type JSONLogger struct {
	writer io.Writer
}

func NewJSONLogger(writer io.Writer) *JSONLogger {
	return &JSONLogger{writer: writer}
}

func (l *JSONLogger) Info(event domain.QueryLogEvent) {
	if l == nil || l.writer == nil {
		return
	}
	entry := map[string]any{
		"ts":          time.Now().UTC().Format(time.RFC3339Nano),
		"requestId":   event.RequestID,
		"operationId": event.OperationID,
		"stage":       event.Stage,
		"language":    event.Language,
	}
	if event.OriginName != "" {
		entry["originName"] = event.OriginName
	}
	if event.DestinationName != "" {
		entry["destinationName"] = event.DestinationName
	}
	if event.ErrorCode != "" {
		entry["errorCode"] = event.ErrorCode
	}
	if event.DurationMs > 0 {
		entry["durationMs"] = event.DurationMs
	}
	if event.ResultCount != nil {
		entry["resultCount"] = *event.ResultCount
	}
	if event.CacheHit != nil {
		entry["cacheHit"] = *event.CacheHit
	}
	if len(event.Fields) > 0 {
		for key, value := range sanitizeFields(event.Fields) {
			entry[key] = value
		}
	}
	encoded, err := json.Marshal(entry)
	if err != nil {
		return
	}
	_, _ = l.writer.Write(append(encoded, '\n'))
}

func sanitizeFields(fields map[string]any) map[string]any {
	sanitized := make(map[string]any)
	for key, value := range fields {
		if isSensitiveKey(key) {
			sanitized[key] = "[redacted]"
			continue
		}
		sanitized[key] = value
	}
	return sanitized
}

func isSensitiveKey(key string) bool {
	normalized := strings.ToLower(key)
	return strings.Contains(normalized, "token") ||
		strings.Contains(normalized, "cookie") ||
		strings.Contains(normalized, "url") ||
		strings.Contains(normalized, "html") ||
		strings.Contains(normalized, "raw")
}
