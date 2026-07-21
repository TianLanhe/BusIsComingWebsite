package http

import (
	"context"
	"errors"
	"net/http"

	analyticsapp "busiscoming-website/backend/internal/analytics/application"
	"busiscoming-website/backend/internal/analytics/domain"
	platformhttp "busiscoming-website/backend/internal/platform/httpserver"
	"github.com/gin-gonic/gin"
)

type OverviewQuery interface {
	Execute(context.Context, domain.AnalyticsQuery) (analyticsapp.OverviewData, error)
}

type OverviewHandler struct {
	usecase OverviewQuery
}

func NewOverviewHandler(usecase OverviewQuery) *OverviewHandler {
	return &OverviewHandler{usecase: usecase}
}

type analyticsEnvelope struct {
	RequestID string          `json:"requestId"`
	Data      any             `json:"data"`
	Error     *analyticsError `json:"error"`
}

type analyticsError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func (handler *OverviewHandler) Get(c *gin.Context) {
	platformhttp.SetRequestMetadata(c, "getAnalyticsOverview", "analytics")
	c.Header("Cache-Control", "no-store")
	query, err := parseOverviewQuery(c.Request.URL.Query())
	if err != nil {
		respondAnalyticsError(c, http.StatusBadRequest, "ANALYTICS_INVALID_FILTER", "查询时间范围或筛选条件无效。")
		return
	}
	if handler.usecase == nil {
		respondAnalyticsError(c, http.StatusServiceUnavailable, "ANALYTICS_STORAGE_UNAVAILABLE", "匿名统计数据库暂时不可用，公开网站功能不受影响。")
		return
	}
	data, err := handler.usecase.Execute(c.Request.Context(), query)
	if err != nil {
		if errors.Is(err, analyticsapp.ErrStorageUnavailable) {
			respondAnalyticsError(c, http.StatusServiceUnavailable, "ANALYTICS_STORAGE_UNAVAILABLE", "匿名统计数据库暂时不可用，公开网站功能不受影响。")
			return
		}
		respondAnalyticsError(c, http.StatusInternalServerError, "ANALYTICS_QUERY_FAILED", "匿名统计查询暂时失败。")
		return
	}
	c.JSON(http.StatusOK, analyticsEnvelope{RequestID: platformhttp.RequestID(c), Data: data, Error: nil})
}

func respondAnalyticsError(c *gin.Context, status int, code, message string) {
	c.JSON(status, analyticsEnvelope{
		RequestID: platformhttp.RequestID(c), Data: nil,
		Error: &analyticsError{Code: code, Message: message},
	})
}
