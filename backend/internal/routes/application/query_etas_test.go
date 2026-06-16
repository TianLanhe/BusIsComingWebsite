package application_test

import (
	"context"
	"sync"
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

func TestServiceQueryEtasDeduplicatesRepeatedTokens(t *testing.T) {
	now := time.Date(2026, 6, 16, 12, 0, 0, 0, time.UTC)
	signer := signing.NewTokenSigner([]byte("test-secret"), func() time.Time { return now })
	token, _, err := signer.SignEta(domain.EtaTokenPayload{
		Subject:     domain.TokenSubjectEta,
		RouteID:     "route-duplicate",
		RouteNumber: "606",
		StopID:      "001336",
		Direction:   "O",
		Language:    domain.LanguageZhHans,
	})
	if err != nil {
		t.Fatalf("sign eta token: %v", err)
	}
	etaService := &countingEtaService{statuses: map[string]domain.EtaStatus{token: waitingStatus(token, now)}}
	service := application.NewService(application.Dependencies{
		Clock:      func() time.Time { return now },
		Signer:     signer,
		EtaService: etaService,
		Logger:     application.DiscardLogger{},
	})

	result, qErr := service.QueryEtas(context.Background(), application.QueryEtasRequest{
		RequestID: "req-eta-duplicate",
		Language:  domain.LanguageZhHans,
		EtaTokens: []string{token, token},
	})
	if qErr != nil {
		t.Fatalf("query etas: %v", qErr)
	}
	if len(result.Etas) != 2 {
		t.Fatalf("expected duplicate token to keep two response rows, got %d", len(result.Etas))
	}
	if etaService.calls != 1 {
		t.Fatalf("expected duplicate token to call ETA service once, got %d", etaService.calls)
	}
}

func TestServiceQueryEtasRunsExternalQueriesConcurrently(t *testing.T) {
	now := time.Date(2026, 6, 16, 12, 0, 0, 0, time.UTC)
	signer := signing.NewTokenSigner([]byte("test-secret"), func() time.Time { return now })
	tokens := make([]string, 0, 4)
	statuses := make(map[string]domain.EtaStatus)
	for index := 0; index < 4; index++ {
		token, _, err := signer.SignEta(domain.EtaTokenPayload{
			Subject:     domain.TokenSubjectEta,
			RouteID:     "route-concurrent",
			RouteNumber: "606",
			StopID:      "001336",
			Direction:   "O",
			Language:    domain.LanguageZhHans,
			BoardingSeq: index + 1,
		})
		if err != nil {
			t.Fatalf("sign eta token: %v", err)
		}
		tokens = append(tokens, token)
		statuses[token] = waitingStatus(token, now)
	}
	etaService := &slowEtaService{statuses: statuses, delay: 60 * time.Millisecond}
	service := application.NewService(application.Dependencies{
		Clock:      func() time.Time { return now },
		Signer:     signer,
		EtaService: etaService,
		Logger:     application.DiscardLogger{},
	})

	start := time.Now()
	result, qErr := service.QueryEtas(context.Background(), application.QueryEtasRequest{
		RequestID: "req-eta-concurrent",
		Language:  domain.LanguageZhHans,
		EtaTokens: tokens,
	})
	elapsed := time.Since(start)
	if qErr != nil {
		t.Fatalf("query etas: %v", qErr)
	}
	if len(result.Etas) != len(tokens) {
		t.Fatalf("expected %d ETA statuses, got %d", len(tokens), len(result.Etas))
	}
	if etaService.maxActive < 2 {
		t.Fatalf("expected concurrent ETA calls, max active calls was %d", etaService.maxActive)
	}
	if elapsed >= 180*time.Millisecond {
		t.Fatalf("expected concurrent ETA calls to finish quickly, elapsed %s", elapsed)
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

type countingEtaService struct {
	statuses map[string]domain.EtaStatus
	calls    int
}

func (f *countingEtaService) QueryEta(_ context.Context, token string, payload domain.EtaTokenPayload) (domain.EtaStatus, error) {
	f.calls++
	if status, ok := f.statuses[token]; ok {
		return status, nil
	}
	return domain.UnavailableEtaStatus(token, payload.ExpiresAt), nil
}

type slowEtaService struct {
	statuses  map[string]domain.EtaStatus
	delay     time.Duration
	mu        sync.Mutex
	active    int
	maxActive int
}

func (f *slowEtaService) QueryEta(ctx context.Context, token string, payload domain.EtaTokenPayload) (domain.EtaStatus, error) {
	f.mu.Lock()
	f.active++
	if f.active > f.maxActive {
		f.maxActive = f.active
	}
	f.mu.Unlock()

	select {
	case <-time.After(f.delay):
	case <-ctx.Done():
		return domain.UnavailableEtaStatus(token, payload.ExpiresAt), ctx.Err()
	}

	f.mu.Lock()
	f.active--
	f.mu.Unlock()

	if status, ok := f.statuses[token]; ok {
		return status, nil
	}
	return domain.UnavailableEtaStatus(token, payload.ExpiresAt), nil
}
