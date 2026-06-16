package citybus_test

import (
	"testing"

	"busiscoming-website/backend/internal/routes/domain"
	"busiscoming-website/backend/internal/routes/infrastructure/citybus"
)

func TestLanguageParamMapsWebsiteLocales(t *testing.T) {
	cases := map[domain.Language]string{
		domain.LanguageZhHant: "0",
		domain.LanguageEn:     "1",
		domain.LanguageZhHans: "2",
	}

	for language, expected := range cases {
		if actual := citybus.LanguageParam(language); actual != expected {
			t.Fatalf("LanguageParam(%s)=%s, expected %s", language, actual, expected)
		}
	}
}
