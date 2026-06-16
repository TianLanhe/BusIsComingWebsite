package citybus

import (
	"bufio"
	"context"
	"errors"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"busiscoming-website/backend/internal/routes/domain"
)

type PlaceClient struct {
	BaseURL    string
	HTTPClient *http.Client
	Now        func() time.Time
}

func NewPlaceClient() *PlaceClient {
	return &PlaceClient{
		BaseURL:    "https://mobile.citybus.com.hk/nwp3/bsearch_p3.php",
		HTTPClient: &http.Client{Timeout: 10 * time.Second},
		Now:        time.Now,
	}
}

func (c *PlaceClient) SearchPlaces(ctx context.Context, query string, language domain.Language, limit int) ([]domain.Place, error) {
	if strings.TrimSpace(query) == "" {
		return nil, nil
	}
	client := c.HTTPClient
	if client == nil {
		client = http.DefaultClient
	}
	endpoint, err := url.Parse(firstNonEmpty(c.BaseURL, "https://mobile.citybus.com.hk/nwp3/bsearch_p3.php"))
	if err != nil {
		return nil, err
	}
	values := endpoint.Query()
	values.Set("l", LanguageParam(language))
	values.Set("q", query)
	values.Set("limit", strconv.Itoa(limit))
	values.Set("timestamp", strconv.FormatInt(c.now().UnixMilli(), 10))
	endpoint.RawQuery = values.Encode()
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint.String(), nil)
	if err != nil {
		return nil, err
	}
	request.Header.Set("Accept", "*/*")
	request.Header.Set("X-Requested-With", "XMLHttpRequest")
	response, err := client.Do(request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	body, err := io.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}
	if response.StatusCode < 200 || response.StatusCode > 299 {
		return nil, errors.New("citybus place search failed")
	}
	return ParsePlaceResponse(string(body), limit)
}

func ParsePlaceResponse(response string, limit int) ([]domain.Place, error) {
	scanner := bufio.NewScanner(strings.NewReader(response))
	lines := make([]string, 0)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line != "" {
			lines = append(lines, line)
		}
	}
	if len(lines) < 2 {
		return nil, errors.New("citybus place response is empty or incomplete")
	}
	bodyLines := lines[1:]
	if len(bodyLines) == 1 && bodyLines[0] == "No Result" {
		return nil, nil
	}
	if limit <= 0 || limit > 100 {
		limit = 100
	}
	places := make([]domain.Place, 0, min(limit, len(bodyLines)))
	for _, line := range bodyLines {
		columns := strings.Split(line, "|")
		if len(columns) < 4 {
			continue
		}
		lat, latErr := strconv.ParseFloat(strings.TrimSpace(columns[2]), 64)
		lon, lonErr := strconv.ParseFloat(strings.TrimSpace(columns[3]), 64)
		name := strings.TrimSpace(columns[1])
		if latErr != nil || lonErr != nil || name == "" {
			continue
		}
		places = append(places, domain.Place{Name: name, Lat: lat, Lon: lon, Provider: "citybus"})
		if len(places) >= limit {
			break
		}
	}
	if len(places) == 0 {
		return nil, errors.New("citybus place response has no valid rows")
	}
	return places, nil
}

func (c *PlaceClient) now() time.Time {
	if c.Now != nil {
		return c.Now()
	}
	return time.Now()
}

func firstNonEmpty(value, fallback string) string {
	if value != "" {
		return value
	}
	return fallback
}
