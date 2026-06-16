package citybus

import "busiscoming-website/backend/internal/routes/domain"

func LanguageParam(language domain.Language) string {
	// Citybus mobile P2P endpoint uses numeric language ids: 0=繁中, 1=英文, 2=简中。
	switch language {
	case domain.LanguageEn:
		return "1"
	case domain.LanguageZhHans:
		return "2"
	default:
		return "0"
	}
}
