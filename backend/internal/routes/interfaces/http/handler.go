package http

import (
	"context"

	analyticsdomain "busiscoming-website/backend/internal/analytics/domain"
	analyticshttp "busiscoming-website/backend/internal/analytics/interfaces/http"
	"busiscoming-website/backend/internal/routes/application"
	"busiscoming-website/backend/internal/routes/domain"
	"github.com/gin-gonic/gin"
)

type RouteService interface {
	QueryPlaces(context.Context, application.QueryPlacesRequest) (application.QueryPlacesResult, *domain.QueryError)
	QueryRoutes(context.Context, application.QueryRoutesRequest) (application.QueryRoutesResult, *domain.QueryError)
	QueryEtas(context.Context, application.QueryEtasRequest) (application.QueryEtasResult, *domain.QueryError)
}

type Handler struct {
	service RouteService
}

func NewHandler(service RouteService) *Handler {
	return &Handler{service: service}
}

type queryPlacesJSON struct {
	RequestID string          `json:"requestId"`
	Language  domain.Language `json:"language"`
	Query     string          `json:"query"`
	Limit     int             `json:"limit"`
}

type queryRoutesJSON struct {
	RequestID             string          `json:"requestId"`
	Language              domain.Language `json:"language"`
	OriginPlaceToken      string          `json:"originPlaceToken"`
	DestinationPlaceToken string          `json:"destinationPlaceToken"`
}

type queryEtasJSON struct {
	RequestID string          `json:"requestId"`
	Language  domain.Language `json:"language"`
	EtaTokens []string        `json:"etaTokens"`
}

func (h *Handler) QueryPlaces(c *gin.Context) {
	var body queryPlacesJSON
	if err := c.ShouldBindJSON(&body); err != nil {
		analyticshttp.ObserveFailure(c, analyticsdomain.FailureInvalidRequest)
		respondError(c, "", domain.NewQueryError(domain.ErrInvalidArgument, "invalid JSON body"))
		return
	}
	analyticshttp.ObserveLocale(c, analyticsLocale(body.Language))
	result, qErr := h.service.QueryPlaces(c.Request.Context(), application.QueryPlacesRequest(body))
	if qErr != nil {
		analyticshttp.ObserveFailure(c, analyticsFailure(qErr.Code))
		respondError(c, body.RequestID, qErr)
		return
	}
	respondOK(c, body.RequestID, result)
}

func (h *Handler) QueryRoutes(c *gin.Context) {
	var body queryRoutesJSON
	if err := c.ShouldBindJSON(&body); err != nil {
		analyticshttp.ObserveFailure(c, analyticsdomain.FailureInvalidRequest)
		respondError(c, "", domain.NewQueryError(domain.ErrInvalidArgument, "invalid JSON body"))
		return
	}
	analyticshttp.ObserveLocale(c, analyticsLocale(body.Language))
	result, qErr := h.service.QueryRoutes(c.Request.Context(), application.QueryRoutesRequest(body))
	if qErr != nil {
		analyticshttp.ObserveFailure(c, analyticsFailure(qErr.Code))
		respondError(c, body.RequestID, qErr)
		return
	}
	respondOK(c, body.RequestID, result)
}

func analyticsLocale(language domain.Language) analyticsdomain.Locale {
	switch language {
	case domain.LanguageZhHant:
		return analyticsdomain.LocaleZhHant
	case domain.LanguageZhHans:
		return analyticsdomain.LocaleZhHans
	case domain.LanguageEn:
		return analyticsdomain.LocaleEnglish
	default:
		return analyticsdomain.LocaleUnknown
	}
}

func analyticsFailure(code domain.ErrorCode) analyticsdomain.FailureCategory {
	switch code {
	case domain.ErrInvalidArgument:
		return analyticsdomain.FailureInvalidRequest
	case domain.ErrSamePlace:
		return analyticsdomain.FailureSamePlace
	case domain.ErrPlaceTokenInvalid, domain.ErrPlaceTokenExpired:
		return analyticsdomain.FailureInvalidToken
	case domain.ErrRateLimited:
		return analyticsdomain.FailureRateLimited
	case domain.ErrExternalTimeout:
		return analyticsdomain.FailureExternalTimeout
	case domain.ErrExternalUnavailable, domain.ErrParseFailed:
		return analyticsdomain.FailureExternalUnavailable
	default:
		return analyticsdomain.FailureInternal
	}
}

func (h *Handler) QueryEtas(c *gin.Context) {
	var body queryEtasJSON
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, "", domain.NewQueryError(domain.ErrInvalidArgument, "invalid JSON body"))
		return
	}
	result, qErr := h.service.QueryEtas(c.Request.Context(), application.QueryEtasRequest(body))
	if qErr != nil {
		respondError(c, body.RequestID, qErr)
		return
	}
	respondOK(c, body.RequestID, result)
}
