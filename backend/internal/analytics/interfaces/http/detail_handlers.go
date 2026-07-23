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

const visitorIDHeader = "X-Analytics-Visitor-ID"

type DetailsQuery interface {
	Traffic(context.Context, domain.AnalyticsQuery) (analyticsapp.TrafficData, error)
	Downloads(context.Context, domain.AnalyticsQuery) (analyticsapp.DownloadsData, error)
	Events(context.Context, domain.AnalyticsQuery, string) (analyticsapp.EventListData, error)
	Visitor(context.Context, string, int, string) (analyticsapp.VisitorData, error)
	Performance(context.Context, domain.AnalyticsQuery) (analyticsapp.PerformanceData, error)
	System(context.Context) analyticsapp.SystemData
}

type DetailHandlers struct {
	usecase DetailsQuery
}

func NewDetailHandlers(usecase DetailsQuery) *DetailHandlers {
	return &DetailHandlers{usecase: usecase}
}

func (handlers *DetailHandlers) Traffic(c *gin.Context) {
	handlers.runRange(c, "getAnalyticsTraffic", false, func(ctx context.Context, query domain.AnalyticsQuery) (any, error) {
		return handlers.usecase.Traffic(ctx, query)
	})
}

func (handlers *DetailHandlers) Downloads(c *gin.Context) {
	handlers.runRange(c, "getAnalyticsDownloads", false, func(ctx context.Context, query domain.AnalyticsQuery) (any, error) {
		return handlers.usecase.Downloads(ctx, query)
	})
}

func (handlers *DetailHandlers) Events(c *gin.Context) {
	handlers.runRange(c, "listAnalyticsEvents", true, func(ctx context.Context, query domain.AnalyticsQuery) (any, error) {
		return handlers.usecase.Events(ctx, query, c.GetHeader(visitorIDHeader))
	})
}

func (handlers *DetailHandlers) Performance(c *gin.Context) {
	handlers.runRange(c, "getAnalyticsPerformance", false, func(ctx context.Context, query domain.AnalyticsQuery) (any, error) {
		return handlers.usecase.Performance(ctx, query)
	})
}

func (handlers *DetailHandlers) Visitor(c *gin.Context) {
	platformhttp.SetRequestMetadata(c, "getAnalyticsVisitor", "analytics")
	c.Header("Cache-Control", "no-store")
	limit, cursor, err := parseVisitorPagination(c.Request.URL.Query())
	visitorID := c.GetHeader(visitorIDHeader)
	if err != nil || !domain.IsVisitorID(visitorID) {
		respondAnalyticsError(c, http.StatusBadRequest, "ANALYTICS_INVALID_FILTER", "匿名 visitor 或分页条件无效。")
		return
	}
	if handlers.usecase == nil {
		respondAnalyticsError(c, http.StatusServiceUnavailable, "ANALYTICS_STORAGE_UNAVAILABLE", "匿名统计数据库暂时不可用，公开网站功能不受影响。")
		return
	}
	data, err := handlers.usecase.Visitor(c.Request.Context(), visitorID, limit, cursor)
	if err != nil {
		respondDetailsError(c, err)
		return
	}
	c.JSON(http.StatusOK, analyticsEnvelope{RequestID: platformhttp.RequestID(c), Data: data, Error: nil})
}

func (handlers *DetailHandlers) System(c *gin.Context) {
	platformhttp.SetRequestMetadata(c, "getAnalyticsSystemStatus", "analytics")
	c.Header("Cache-Control", "no-store")
	if len(c.Request.URL.Query()) > 0 {
		respondAnalyticsError(c, http.StatusBadRequest, "ANALYTICS_INVALID_FILTER", "系统状态请求格式无效。")
		return
	}
	if handlers.usecase == nil {
		respondAnalyticsError(c, http.StatusInternalServerError, "ANALYTICS_QUERY_FAILED", "匿名统计查询暂时失败。")
		return
	}
	c.JSON(http.StatusOK, analyticsEnvelope{RequestID: platformhttp.RequestID(c), Data: handlers.usecase.System(c.Request.Context()), Error: nil})
}

func (handlers *DetailHandlers) runRange(c *gin.Context, operationID string, paginated bool, execute func(context.Context, domain.AnalyticsQuery) (any, error)) {
	platformhttp.SetRequestMetadata(c, operationID, "analytics")
	c.Header("Cache-Control", "no-store")
	query, err := parseDetailsQuery(c.Request.URL.Query(), paginated)
	if err != nil {
		respondAnalyticsError(c, http.StatusBadRequest, "ANALYTICS_INVALID_FILTER", "查询时间范围或筛选条件无效。")
		return
	}
	if handlers.usecase == nil {
		respondAnalyticsError(c, http.StatusServiceUnavailable, "ANALYTICS_STORAGE_UNAVAILABLE", "匿名统计数据库暂时不可用，公开网站功能不受影响。")
		return
	}
	data, err := execute(c.Request.Context(), query)
	if err != nil {
		respondDetailsError(c, err)
		return
	}
	c.JSON(http.StatusOK, analyticsEnvelope{RequestID: platformhttp.RequestID(c), Data: data, Error: nil})
}

func respondDetailsError(c *gin.Context, err error) {
	var validation domain.ValidationError
	switch {
	case errors.Is(err, analyticsapp.ErrInvalidCursor):
		respondAnalyticsError(c, http.StatusBadRequest, "ANALYTICS_INVALID_CURSOR", "分页游标无效或已经过期。")
	case errors.As(err, &validation):
		respondAnalyticsError(c, http.StatusBadRequest, "ANALYTICS_INVALID_FILTER", "查询时间范围或筛选条件无效。")
	case errors.Is(err, analyticsapp.ErrVisitorNotFound):
		respondAnalyticsError(c, http.StatusNotFound, "ANALYTICS_VISITOR_NOT_FOUND", "未找到该匿名 visitor 的统计明细。")
	case errors.Is(err, analyticsapp.ErrStorageUnavailable):
		respondAnalyticsError(c, http.StatusServiceUnavailable, "ANALYTICS_STORAGE_UNAVAILABLE", "匿名统计数据库暂时不可用，公开网站功能不受影响。")
	default:
		respondAnalyticsError(c, http.StatusInternalServerError, "ANALYTICS_QUERY_FAILED", "匿名统计查询暂时失败。")
	}
}
