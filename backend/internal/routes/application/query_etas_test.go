package application_test

import (
	"context"
	"testing"
	"time"

	"busiscoming-website/backend/internal/routes/application"
	"busiscoming-website/backend/internal/routes/domain"
	"busiscoming-website/backend/internal/routes/infrastructure/signing"
)

func TestServiceQueryEtasKeepsUnavailableForSingleFailure(t *testing.T) {
	now := time.Date(2026, 6, 16, 12, 0, 0, 0, time.UTC)
	signer := signing.NewTokenSigner([]byte("test-secret"), func() time.Time { return now })
	okToken, _, err := signer.SignEta(domain.EtaTokenPayload{
		Subject:     domain.TokenSubjectEta,
		RouteID:     "route-ok",
		RouteNumber: "606",
		StopID:      "001336",
		Direction:   "O",
		Language:    domain.LanguageZhHans,
	})
	if err != nil {
		t.Fatalf("sign eta token: %v", err)
	}
	badToken, _, err := signer.SignEta(domain.EtaTokenPayload{
		Subject:     domain.TokenSubjectEta,
		RouteID:     "route-bad",
		RouteNumber: "307",
		StopID:      "009999",
		Direction:   "I",
		Language:    domain.LanguageZhHans,
	})
	if err != nil {
		t.Fatalf("sign eta token: %v", err)
	}
	service := application.NewService(application.Dependencies{
		Clock:      func() time.Time { return now },
		Signer:     signer,
		EtaService: fakeEtaService{statuses: map[string]domain.EtaStatus{okToken: waitingStatus(okToken, now)}},
		Logger:     application.DiscardLogger{},
	})

	result, qErr := service.QueryEtas(context.Background(), application.QueryEtasRequest{
		RequestID: "req-eta",
		Language:  domain.LanguageZhHans,
		EtaTokens: []string{okToken, badToken},
	})
	if qErr != nil {
		t.Fatalf("query etas: %v", qErr)
	}
	if len(result.Etas) != 2 {
		t.Fatalf("expected two ETA statuses, got %d", len(result.Etas))
	}
	if result.Etas[0].Status != domain.EtaWaiting || result.Etas[1].Status != domain.EtaUnavailable {
		t.Fatalf("unexpected ETA statuses: %#v", result.Etas)
	}
}

type fakeEtaService struct {
	statuses map[string]domain.EtaStatus
}

func (f fakeEtaService) QueryEta(_ context.Context, token string, payload domain.EtaTokenPayload) (domain.EtaStatus, error) {
	if status, ok := f.statuses[token]; ok {
		return status, nil
	}
	return domain.UnavailableEtaStatus(token, payload.ExpiresAt), nil
}

func waitingStatus(token string, now time.Time) domain.EtaStatus {
	minutes := 3
	return domain.EtaStatus{EtaToken: token, Status: domain.EtaWaiting, WaitMinutes: &minutes, UpdatedAt: now}
}
