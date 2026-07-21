package http

import "github.com/gin-gonic/gin"

// RegisterPrivateRoutes is the single composition point for monitoring resources.
// It must only receive the loopback-bound private engine.
func RegisterPrivateRoutes(engine *gin.Engine, overview OverviewQuery, uiRoot string) {
	handler := NewOverviewHandler(overview)
	engine.GET("/api/analytics/overview", handler.Get)
	RegisterStaticFallback(engine, uiRoot)
}
