package classification

import (
	"strings"

	"busiscoming-website/backend/internal/analytics/domain"
)

type Classifier struct{}

func NewClassifier() *Classifier { return &Classifier{} }

func (*Classifier) IsKnownBot(userAgent string) bool {
	normalized := strings.ToLower(userAgent)
	if normalized == "" {
		return false
	}
	for _, signature := range []string{
		"googlebot", "bingbot", "duckduckbot", "yandexbot", "baiduspider",
		"facebookexternalhit", "twitterbot", "linkedinbot", "slackbot", "discordbot",
		"headlesschrome", "playwright", "puppeteer", "lighthouse",
		"curl/", "wget/", "python-requests", "go-http-client",
	} {
		if strings.Contains(normalized, signature) {
			return true
		}
	}
	return false
}

func (*Classifier) Device(userAgent string) domain.DeviceType {
	normalized := strings.ToLower(userAgent)
	switch {
	case strings.Contains(normalized, "ipad") || strings.Contains(normalized, "tablet"):
		return domain.DeviceTablet
	case strings.Contains(normalized, "iphone") || strings.Contains(normalized, "mobile") || strings.Contains(normalized, "android"):
		return domain.DeviceMobile
	case strings.Contains(normalized, "windows nt") || strings.Contains(normalized, "macintosh") || strings.Contains(normalized, "x11") || strings.Contains(normalized, "cros"):
		return domain.DeviceDesktop
	default:
		return domain.DeviceOther
	}
}

func (*Classifier) Source(raw string) domain.SourceType {
	switch raw {
	case string(domain.SourceDirect):
		return domain.SourceDirect
	case string(domain.SourceSearch):
		return domain.SourceSearch
	case string(domain.SourceReferral):
		return domain.SourceReferral
	case string(domain.SourceInternal):
		return domain.SourceInternal
	case string(domain.SourceUnknown):
		return domain.SourceUnknown
	default:
		return domain.SourceUnknown
	}
}

func (*Classifier) Locale(homeLocale, bodyLocale, acceptLanguage string) domain.Locale {
	for _, raw := range []string{homeLocale, bodyLocale, acceptLanguage} {
		if locale := localeFrom(raw); locale != domain.LocaleUnknown {
			return locale
		}
	}
	return domain.LocaleUnknown
}

func localeFrom(raw string) domain.Locale {
	normalized := strings.ToLower(strings.TrimSpace(strings.Split(raw, ",")[0]))
	normalized = strings.Split(normalized, ";")[0]
	switch normalized {
	case "zh-hant", "zh-hk", "zh-tw":
		return domain.LocaleZhHant
	case "zh-hans", "zh-cn", "zh-sg":
		return domain.LocaleZhHans
	case "en", "en-us", "en-gb", "en-hk":
		return domain.LocaleEnglish
	default:
		return domain.LocaleUnknown
	}
}
