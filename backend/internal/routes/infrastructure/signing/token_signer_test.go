package signing_test

import (
	"testing"
	"time"

	"busiscoming-website/backend/internal/routes/domain"
	"busiscoming-website/backend/internal/routes/infrastructure/signing"
)

func TestTokenSignerSignsAndVerifiesPlaceToken(t *testing.T) {
	now := time.Date(2026, 6, 16, 12, 0, 0, 0, time.UTC)
	signer := signing.NewTokenSigner([]byte("test-secret"), func() time.Time { return now })
	payload := domain.PlaceTokenPayload{
		Subject:  domain.TokenSubjectPlace,
		Name:     "兴华邨兴翠楼",
		Lat:      22.267079,
		Lon:      114.242089,
		Language: domain.LanguageZhHans,
		Provider: "citybus",
	}

	token, expiresAt, err := signer.SignPlace(payload)
	if err != nil {
		t.Fatalf("sign place token: %v", err)
	}

	verified, err := signer.VerifyPlace(token)
	if err != nil {
		t.Fatalf("verify place token: %v", err)
	}
	if verified.Name != payload.Name || verified.Lat != payload.Lat || verified.Lon != payload.Lon {
		t.Fatalf("verified payload mismatch: %#v", verified)
	}
	if expiresAt.Sub(now) != 15*time.Minute {
		t.Fatalf("expected 15 minute place token, got %s", expiresAt.Sub(now))
	}
}

func TestTokenSignerRejectsTamperedToken(t *testing.T) {
	now := time.Date(2026, 6, 16, 12, 0, 0, 0, time.UTC)
	signer := signing.NewTokenSigner([]byte("test-secret"), func() time.Time { return now })
	token, _, err := signer.SignPlace(domain.PlaceTokenPayload{
		Subject:  domain.TokenSubjectPlace,
		Name:     "兴华邨兴翠楼",
		Lat:      22.267079,
		Lon:      114.242089,
		Language: domain.LanguageZhHans,
		Provider: "citybus",
	})
	if err != nil {
		t.Fatalf("sign place token: %v", err)
	}

	replacement := "A"
	if token[len(token)-1:] == replacement {
		replacement = "B"
	}
	tampered := token[:len(token)-1] + replacement
	if _, err := signer.VerifyPlace(tampered); err == nil {
		t.Fatal("expected tampered token to be rejected")
	}
}

func TestTokenSignerRejectsExpiredEtaToken(t *testing.T) {
	now := time.Date(2026, 6, 16, 12, 0, 0, 0, time.UTC)
	current := now
	signer := signing.NewTokenSigner([]byte("test-secret"), func() time.Time { return current })
	token, _, err := signer.SignEta(domain.EtaTokenPayload{
		Subject:      domain.TokenSubjectEta,
		RouteID:      "route-1",
		RouteNumber:  "606",
		StopID:       "001336",
		Direction:    "O",
		ServiceType:  "1",
		Language:     domain.LanguageZhHans,
		Company:      "CTB",
		BoardingSeq:  10,
		AlightingSeq: 20,
		RawInfo:      "1|*|CTB||606-1||10||20||O",
	})
	if err != nil {
		t.Fatalf("sign eta token: %v", err)
	}

	current = now.Add(6 * time.Minute)
	if _, err := signer.VerifyEta(token); err == nil {
		t.Fatal("expected expired eta token to be rejected")
	}
}
