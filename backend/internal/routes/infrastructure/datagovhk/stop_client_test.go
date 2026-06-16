package datagovhk_test

import (
	"testing"

	"busiscoming-website/backend/internal/routes/domain"
	"busiscoming-website/backend/internal/routes/infrastructure/datagovhk"
)

func TestParseStopNameResponsePrefersCurrentLanguage(t *testing.T) {
	response := []byte(`{"data":{"name_tc":"興華邨興翠樓","name_sc":"兴华邨兴翠楼","name_en":"Hing Wah Estate Hing Tsui House"}}`)

	simplified, err := datagovhk.ParseStopNameResponse(response, domain.LanguageZhHans)
	if err != nil {
		t.Fatalf("parse simplified stop name: %v", err)
	}
	if simplified != "兴华邨兴翠楼" {
		t.Fatalf("expected simplified name, got %q", simplified)
	}

	english, err := datagovhk.ParseStopNameResponse(response, domain.LanguageEn)
	if err != nil {
		t.Fatalf("parse english stop name: %v", err)
	}
	if english != "Hing Wah Estate Hing Tsui House" {
		t.Fatalf("expected english name, got %q", english)
	}
}
