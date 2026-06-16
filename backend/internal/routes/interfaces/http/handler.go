package http

import (
	"context"

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
		respondError(c, "", domain.NewQueryError(domain.ErrInvalidArgument, "invalid JSON body"))
		return
	}
	result, qErr := h.service.QueryPlaces(c.Request.Context(), application.QueryPlacesRequest(body))
	if qErr != nil {
		respondError(c, body.RequestID, qErr)
		return
	}
	respondOK(c, body.RequestID, result)
}

func (h *Handler) QueryRoutes(c *gin.Context) {
	var body queryRoutesJSON
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, "", domain.NewQueryError(domain.ErrInvalidArgument, "invalid JSON body"))
		return
	}
	result, qErr := h.service.QueryRoutes(c.Request.Context(), application.QueryRoutesRequest(body))
	if qErr != nil {
		respondError(c, body.RequestID, qErr)
		return
	}
	respondOK(c, body.RequestID, result)
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
