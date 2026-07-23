package http

import "github.com/gin-gonic/gin"

// RegisterPrivateRoutes is the single composition point for monitoring resources.
// It must only receive the loopback-bound private engine.
func RegisterPrivateRoutes(engine *gin.Engine, overview OverviewQuery, details DetailsQuery, uiRoot string) {
	overviewHandler := NewOverviewHandler(overview)
	detailHandlers := NewDetailHandlers(details)
	engine.GET("/api/analytics/overview", overviewHandler.Get)
	engine.GET("/api/analytics/traffic", detailHandlers.Traffic)
	engine.GET("/api/analytics/downloads", detailHandlers.Downloads)
	engine.GET("/api/analytics/events", detailHandlers.Events)
	engine.GET("/api/analytics/visitor", detailHandlers.Visitor)
	engine.GET("/api/analytics/performance", detailHandlers.Performance)
	engine.GET("/api/analytics/system", detailHandlers.System)
	RegisterStaticFallback(engine, uiRoot)
}
