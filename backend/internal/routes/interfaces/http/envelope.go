package http

import (
	"net/http"

	"busiscoming-website/backend/internal/routes/domain"
	"github.com/gin-gonic/gin"
)

type envelope struct {
	RequestID string             `json:"requestId"`
	Data      any                `json:"data"`
	Error     *domain.QueryError `json:"error"`
}

func respondOK(c *gin.Context, requestID string, data any) {
	c.JSON(http.StatusOK, envelope{RequestID: requestID, Data: data, Error: nil})
}

func respondError(c *gin.Context, requestID string, err *domain.QueryError) {
	if err == nil {
		err = domain.NewQueryError(domain.ErrInternal, "internal error")
	}
	c.JSON(statusForError(err.Code), envelope{RequestID: requestID, Data: nil, Error: err})
}

func statusForError(code domain.ErrorCode) int {
	switch code {
	case domain.ErrInvalidArgument:
		return http.StatusBadRequest
	case domain.ErrSamePlace, domain.ErrPlaceTokenInvalid, domain.ErrPlaceTokenExpired, domain.ErrEtaTokenInvalid, domain.ErrEtaTokenExpired:
		return http.StatusUnprocessableEntity
	case domain.ErrRateLimited:
		return http.StatusTooManyRequests
	case domain.ErrExternalTimeout:
		return http.StatusGatewayTimeout
	case domain.ErrExternalUnavailable, domain.ErrParseFailed:
		return http.StatusBadGateway
	default:
		return http.StatusInternalServerError
	}
}
