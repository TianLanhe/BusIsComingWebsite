package datagovhk

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"sort"
	"time"

	"busiscoming-website/backend/internal/routes/domain"
)

type EtaClient struct {
	BaseURL    string
	HTTPClient *http.Client
	Now        func() time.Time
}

func NewEtaClient() *EtaClient {
	return &EtaClient{
		BaseURL:    "https://rt.data.gov.hk/v2/transport/citybus",
		HTTPClient: &http.Client{Timeout: 10 * time.Second},
		Now:        time.Now,
	}
}

func (c *EtaClient) QueryEta(ctx context.Context, token string, payload domain.EtaTokenPayload) (domain.EtaStatus, error) {
	client := c.HTTPClient
	if client == nil {
		client = http.DefaultClient
	}
	base := firstNonEmpty(c.BaseURL, "https://rt.data.gov.hk/v2/transport/citybus")
	endpoint, err := url.JoinPath(base, "eta", payload.Company, payload.StopID, payload.RouteNumber)
	if err != nil {
		return domain.UnavailableEtaStatus(token, c.now()), err
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return domain.UnavailableEtaStatus(token, c.now()), err
	}
	request.Header.Set("Accept", "application/json")
	response, err := client.Do(request)
	if err != nil {
		return domain.UnavailableEtaStatus(token, c.now()), err
	}
	defer response.Body.Close()
	body, err := io.ReadAll(response.Body)
	if err != nil {
		return domain.UnavailableEtaStatus(token, c.now()), err
	}
	if response.StatusCode < 200 || response.StatusCode > 299 {
		return domain.UnavailableEtaStatus(token, c.now()), nil
	}
	return ParseEtaResponse(token, string(body), payload, c.now()), nil
}

func ParseEtaResponse(token string, response string, payload domain.EtaTokenPayload, now time.Time) domain.EtaStatus {
	var decoded struct {
		Data []etaRecord `json:"data"`
	}
	if err := json.Unmarshal([]byte(response), &decoded); err != nil {
		return domain.UnavailableEtaStatus(token, now)
	}
	for _, candidate := range matchedEtaCandidates(decoded.Data, payload) {
		minutes := int(candidate.etaTime.Sub(now).Minutes())
		if candidate.etaTime.After(now) && candidate.etaTime.Sub(now)%time.Minute != 0 {
			minutes++
		}
		if minutes <= 0 {
			return domain.EtaStatus{EtaToken: token, Status: domain.EtaArriving, UpdatedAt: now}
		}
		return domain.EtaStatus{EtaToken: token, Status: domain.EtaWaiting, WaitMinutes: &minutes, UpdatedAt: now}
	}
	return domain.UnavailableEtaStatus(token, now)
}

func matchedEtaCandidates(records []etaRecord, payload domain.EtaTokenPayload) []etaCandidate {
	routeStopDirectionCandidates := make([]etaCandidate, 0, len(records))
	strictCandidates := make([]etaCandidate, 0, len(records))
	for _, record := range records {
		if record.Route != payload.RouteNumber || record.Stop != payload.StopID || record.Direction != payload.Direction {
			continue
		}
		etaTime, err := time.Parse(time.RFC3339, record.Eta)
		if err != nil {
			continue
		}
		candidate := etaCandidate{record: record, etaTime: etaTime}
		routeStopDirectionCandidates = append(routeStopDirectionCandidates, candidate)
		if payload.BoardingSeq > 0 && record.Seq == payload.BoardingSeq {
			strictCandidates = append(strictCandidates, candidate)
		}
	}

	// Android App 會在公開 ETA 的 seq 與 P2P boardingSeq 不一致時，回退到同路線同站同方向記錄。
	matchedCandidates := routeStopDirectionCandidates
	if payload.BoardingSeq > 0 && len(strictCandidates) > 0 {
		matchedCandidates = strictCandidates
	}
	sort.SliceStable(matchedCandidates, func(i, j int) bool {
		leftSeq := normalizedEtaSequence(matchedCandidates[i].record.EtaSeq)
		rightSeq := normalizedEtaSequence(matchedCandidates[j].record.EtaSeq)
		if leftSeq != rightSeq {
			return leftSeq < rightSeq
		}
		return matchedCandidates[i].etaTime.Before(matchedCandidates[j].etaTime)
	})
	return matchedCandidates
}

func normalizedEtaSequence(sequence int) int {
	if sequence > 0 {
		return sequence
	}
	return int(^uint(0) >> 1)
}

type etaRecord struct {
	Route     string `json:"route"`
	Stop      string `json:"stop"`
	Direction string `json:"dir"`
	Seq       int    `json:"seq"`
	EtaSeq    int    `json:"eta_seq"`
	Eta       string `json:"eta"`
}

type etaCandidate struct {
	record  etaRecord
	etaTime time.Time
}

func (c *EtaClient) now() time.Time {
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
