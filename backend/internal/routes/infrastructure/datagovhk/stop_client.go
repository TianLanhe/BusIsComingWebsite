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
	BaseURL    string
	HTTPClient *http.Client
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
		return "", err
	}
	defer response.Body.Close()
	body, err := io.ReadAll(response.Body)
	if err != nil {
		return "", err
	}
	if response.StatusCode < 200 || response.StatusCode > 299 {
		return "", errors.New("datagovhk stop query failed")
	}
	return ParseStopNameResponse(body, language)
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
