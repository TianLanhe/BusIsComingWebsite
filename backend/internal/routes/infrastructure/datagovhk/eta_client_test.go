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

func TestParseEtaResponseFallsBackToRouteStopDirectionAndSortsByEtaSequence(t *testing.T) {
	now := time.Date(2026, 6, 16, 12, 0, 0, 0, time.FixedZone("HKT", 8*3600))
	response := `{"data":[
		{"route":"N118","stop":"001312","dir":"O","seq":3,"eta_seq":2,"eta":"2026-06-16T12:49:00+08:00","dest_tc":"深水埗","rmk_tc":""},
		{"route":"N118","stop":"001312","dir":"O","seq":3,"eta_seq":1,"eta":"2026-06-16T12:19:00+08:00","dest_tc":"深水埗","rmk_tc":""},
		{"route":"N118","stop":"001312","dir":"O","seq":3,"eta_seq":3,"eta":"","dest_tc":"深水埗","rmk_tc":"九巴時段"}
	]}`
	payload := domain.EtaTokenPayload{RouteNumber: "N118", StopID: "001312", Direction: "O", BoardingSeq: 5}

	status := datagovhk.ParseEtaResponse("token", response, payload, now)
	if status.Status != domain.EtaWaiting {
		t.Fatalf("expected waiting, got %#v", status)
	}
	if status.WaitMinutes == nil || *status.WaitMinutes != 19 {
		t.Fatalf("expected 19 minutes, got %#v", status.WaitMinutes)
	}
}

func TestParseEtaResponsePrefersStrictBoardingSeqBeforeFallback(t *testing.T) {
	now := time.Date(2026, 6, 16, 12, 0, 0, 0, time.FixedZone("HKT", 8*3600))
	response := `{"data":[
		{"route":"N118","stop":"001312","dir":"O","seq":3,"eta_seq":1,"eta":"2026-06-16T12:10:00+08:00","dest_tc":"深水埗","rmk_tc":""},
		{"route":"N118","stop":"001312","dir":"O","seq":5,"eta_seq":2,"eta":"2026-06-16T12:20:00+08:00","dest_tc":"深水埗","rmk_tc":""}
	]}`
	payload := domain.EtaTokenPayload{RouteNumber: "N118", StopID: "001312", Direction: "O", BoardingSeq: 5}

	status := datagovhk.ParseEtaResponse("token", response, payload, now)
	if status.Status != domain.EtaWaiting {
		t.Fatalf("expected waiting, got %#v", status)
	}
	if status.WaitMinutes == nil || *status.WaitMinutes != 20 {
		t.Fatalf("expected 20 minutes, got %#v", status.WaitMinutes)
	}
}

func TestParseEtaResponseFallsBackWhenStrictSeqHasNoParseableEta(t *testing.T) {
	now := time.Date(2026, 6, 16, 12, 0, 0, 0, time.FixedZone("HKT", 8*3600))
	response := `{"data":[
		{"route":"N118","stop":"001312","dir":"O","seq":5,"eta_seq":1,"eta":"","dest_tc":"深水埗","rmk_tc":"九巴時段"},
		{"route":"N118","stop":"001312","dir":"O","seq":3,"eta_seq":2,"eta":"2026-06-16T12:19:00+08:00","dest_tc":"深水埗","rmk_tc":""}
	]}`
	payload := domain.EtaTokenPayload{RouteNumber: "N118", StopID: "001312", Direction: "O", BoardingSeq: 5}

	status := datagovhk.ParseEtaResponse("token", response, payload, now)
	if status.Status != domain.EtaWaiting {
		t.Fatalf("expected waiting, got %#v", status)
	}
	if status.WaitMinutes == nil || *status.WaitMinutes != 19 {
		t.Fatalf("expected 19 minutes, got %#v", status.WaitMinutes)
	}
}
