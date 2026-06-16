package datagovhk_test

import (
	"testing"
	"time"

	"busiscoming-website/backend/internal/routes/domain"
	"busiscoming-website/backend/internal/routes/infrastructure/datagovhk"
)

func TestParseEtaResponseReturnsWaitingStatus(t *testing.T) {
	now := time.Date(2026, 6, 16, 12, 0, 0, 0, time.FixedZone("HKT", 8*3600))
	response := `{"data":[{"route":"606","stop":"001336","dir":"O","seq":10,"eta_seq":1,"eta":"2026-06-16T12:49:00+08:00","dest_tc":"漁灣邨","rmk_tc":""}]}`
	payload := domain.EtaTokenPayload{RouteNumber: "606", StopID: "001336", Direction: "O", BoardingSeq: 10}

	status := datagovhk.ParseEtaResponse("token", response, payload, now)
	if status.Status != domain.EtaWaiting {
		t.Fatalf("expected waiting, got %#v", status)
	}
	if status.WaitMinutes == nil || *status.WaitMinutes != 49 {
		t.Fatalf("expected 49 minutes, got %#v", status.WaitMinutes)
	}
}

func TestParseEtaResponseReturnsUnavailableWhenNoMatch(t *testing.T) {
	now := time.Date(2026, 6, 16, 12, 0, 0, 0, time.FixedZone("HKT", 8*3600))
	payload := domain.EtaTokenPayload{RouteNumber: "606", StopID: "001336", Direction: "O", BoardingSeq: 10}

	status := datagovhk.ParseEtaResponse("token", `{"data":[]}`, payload, now)
	if status.Status != domain.EtaUnavailable {
		t.Fatalf("expected unavailable, got %#v", status)
	}
}
