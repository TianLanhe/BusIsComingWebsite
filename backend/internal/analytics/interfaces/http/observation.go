package http

import (
	"busiscoming-website/backend/internal/analytics/domain"
	"github.com/gin-gonic/gin"
)

const observationKey = "analytics.observation"

type RequestObservation struct {
	Locale          *domain.Locale
	FailureCategory *domain.FailureCategory
	Download        *domain.DownloadAttribution
}

func ObserveLocale(c *gin.Context, locale domain.Locale) {
	if !domain.IsLocale(locale) {
		return
	}
	observation(c).Locale = &locale
}

func ObserveFailure(c *gin.Context, category domain.FailureCategory) {
	if !domain.IsFailureCategory(category) {
		return
	}
	observation(c).FailureCategory = &category
}

func ObserveDownload(c *gin.Context, attribution domain.DownloadAttribution) {
	if !domain.IsPlatform(attribution.Platform) {
		return
	}
	copy := attribution
	observation(c).Download = &copy
}

func observation(c *gin.Context) *RequestObservation {
	if existing, ok := c.Get(observationKey); ok {
		if value, ok := existing.(*RequestObservation); ok {
			return value
		}
	}
	value := &RequestObservation{}
	c.Set(observationKey, value)
	return value
}
