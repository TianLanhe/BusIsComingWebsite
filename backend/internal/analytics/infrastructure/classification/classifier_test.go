package classification

import (
	"testing"

	"busiscoming-website/backend/internal/analytics/domain"
)

func TestClassifierExcludesKnownBots(t *testing.T) {
	classifier := NewClassifier()
	for _, userAgent := range []string{
		"Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
		"Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
		"facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
		"Twitterbot/1.0",
		"Mozilla/5.0 HeadlessChrome/126.0.0.0 Safari/537.36",
		"curl/8.7.1",
	} {
		if !classifier.IsKnownBot(userAgent) {
			t.Errorf("expected bot classification for %q", userAgent)
		}
	}
}

func TestClassifierKeepsRealBrowserCounterexamples(t *testing.T) {
	classifier := NewClassifier()
	tests := []struct {
		name      string
		userAgent string
		device    domain.DeviceType
	}{
		{"desktop", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36", domain.DeviceDesktop},
		{"iphone", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1", domain.DeviceMobile},
		{"android", "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36", domain.DeviceMobile},
		{"ipad", "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1", domain.DeviceTablet},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if classifier.IsKnownBot(test.userAgent) {
				t.Fatal("real browser was excluded")
			}
			if got := classifier.Device(test.userAgent); got != test.device {
				t.Fatalf("expected %s, got %s", test.device, got)
			}
		})
	}
}

func TestClassifierUsesOnlyFiniteSourceAndLocaleValues(t *testing.T) {
	classifier := NewClassifier()
	for raw, expected := range map[string]domain.SourceType{
		"direct": domain.SourceDirect, "search": domain.SourceSearch, "referral": domain.SourceReferral,
		"internal": domain.SourceInternal, "unknown": domain.SourceUnknown, "https://secret.example/path": domain.SourceUnknown,
	} {
		if got := classifier.Source(raw); got != expected {
			t.Errorf("source %q: expected %s, got %s", raw, expected, got)
		}
	}
	if got := classifier.Locale("zh-Hant", "", "en-US"); got != domain.LocaleZhHant {
		t.Fatalf("home locale should win, got %s", got)
	}
	if got := classifier.Locale("", "zh-Hans", "en-US"); got != domain.LocaleZhHans {
		t.Fatalf("validated body locale should win, got %s", got)
	}
	if got := classifier.Locale("", "", "en-US,en;q=0.9"); got != domain.LocaleEnglish {
		t.Fatalf("accept-language fallback failed, got %s", got)
	}
	if got := classifier.Locale("fr", "de", "xx"); got != domain.LocaleUnknown {
		t.Fatalf("invalid locale must fall back to unknown, got %s", got)
	}
	if got := classifier.Device("opaque-client"); got != domain.DeviceOther {
		t.Fatalf("unknown device must be other, got %s", got)
	}
}
