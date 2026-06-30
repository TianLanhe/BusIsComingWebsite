package datagovhk

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"busiscoming-website/backend/internal/routes/domain"
)

type StopClient struct {
	BaseURL       string
	HTTPClient    *http.Client
	Cache         StopNameCache
	NormalizeName func(string) string
	Logger        Logger
}

type StopNameCache interface {
	Get(string) (string, bool)
	Set(string, string, time.Duration)
}

type Logger interface {
	Info(domain.QueryLogEvent)
}

func NewStopClient() *StopClient {
	return &StopClient{
		BaseURL:    "https://rt.data.gov.hk/v2/transport/citybus/stop",
		HTTPClient: &http.Client{Timeout: 10 * time.Second},
	}
}

func (c *StopClient) ResolveStopName(ctx context.Context, stopID string, language domain.Language) (string, error) {
	if strings.TrimSpace(stopID) == "" {
		return "", errors.New("stop id is required")
	}
	cacheKey := stopNameCacheKey(stopID, language)
	if c.Cache != nil {
		if cached, ok := c.Cache.Get(cacheKey); ok {
			c.logCacheEvent("cache_hit", stopID, language, true, "")
			return cached, nil
		}
		c.logCacheEvent("cache_miss", stopID, language, false, "")
	}
	client := c.HTTPClient
	if client == nil {
		client = http.DefaultClient
	}
	endpoint, err := url.Parse(strings.TrimRight(firstNonEmpty(c.BaseURL, "https://rt.data.gov.hk/v2/transport/citybus/stop"), "/") + "/" + url.PathEscape(stopID))
	if err != nil {
		return "", err
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint.String(), nil)
	if err != nil {
		return "", err
	}
	response, err := client.Do(request)
	if err != nil {
		c.logCacheEvent("external_degraded", stopID, language, false, "request_failed")
		return "", err
	}
	defer response.Body.Close()
	body, err := io.ReadAll(response.Body)
	if err != nil {
		c.logCacheEvent("external_degraded", stopID, language, false, "read_failed")
		return "", err
	}
	if response.StatusCode < 200 || response.StatusCode > 299 {
		c.logCacheEvent("external_degraded", stopID, language, false, "http_status")
		return "", errors.New("datagovhk stop query failed")
	}
	name, err := ParseStopNameResponse(body, language)
	if err != nil {
		c.logCacheEvent("external_degraded", stopID, language, false, "parse_failed")
		return "", err
	}
	normalized := c.normalizeName(name)
	if normalized == "" {
		c.logCacheEvent("external_degraded", stopID, language, false, "empty_normalized_name")
		return "", errors.New("datagovhk stop response missing displayable name")
	}
	if c.Cache != nil {
		// 站名属于稳定资料，只缓存成功短名；失败不缓存，避免短暂外部故障被放大为 1 天缺失。
		c.Cache.Set(cacheKey, normalized, 24*time.Hour)
	}
	c.logCacheEvent("external_request", stopID, language, false, "")
	return normalized, nil
}

func ParseStopNameResponse(body []byte, language domain.Language) (string, error) {
	var payload struct {
		Data map[string]string `json:"data"`
	}
	if err := json.Unmarshal(body, &payload); err != nil {
		return "", err
	}
	name := PreferredStopName(payload.Data, language)
	if name == "" {
		return "", errors.New("datagovhk stop response missing localized name")
	}
	return name, nil
}

func PreferredStopName(fields map[string]string, language domain.Language) string {
	// showstops2 主要用于补齐 stop id；站名以 DATA.GOV.HK 当前语言字段优先，失败时由调用方回退 Citybus 名称。
	keys := []string{"name_tc", "name_en", "name_sc"}
	switch language {
	case domain.LanguageZhHans:
		keys = []string{"name_sc", "name_tc", "name_en"}
	case domain.LanguageEn:
		keys = []string{"name_en", "name_tc", "name_sc"}
	}
	for _, key := range keys {
		if value := fields[key]; value != "" {
			return value
		}
	}
	return ""
}

func (c *StopClient) normalizeName(name string) string {
	if c.NormalizeName != nil {
		return c.NormalizeName(name)
	}
	return strings.TrimSpace(name)
}

func stopNameCacheKey(stopID string, language domain.Language) string {
	return "datagovhk-stop:" + string(language) + ":" + strings.TrimSpace(stopID)
}

func (c *StopClient) logCacheEvent(stage string, stopID string, language domain.Language, cacheHit bool, reason string) {
	if c.Logger == nil {
		return
	}
	fields := map[string]any{"stopId": stopID}
	if reason != "" {
		fields["reason"] = reason
	}
	c.Logger.Info(domain.QueryLogEvent{
		OperationID: "stopNameResolve",
		Stage:       stage,
		Language:    language,
		CacheHit:    &cacheHit,
		Fields:      fields,
	})
}
