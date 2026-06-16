package http

import "github.com/gin-gonic/gin"

func RegisterRoutes(router gin.IRouter, handler *Handler) {
	router.POST("/api/routes/query_places", handler.QueryPlaces)
	router.POST("/api/routes/query_routes", handler.QueryRoutes)
	router.POST("/api/routes/query_etas", handler.QueryEtas)
}
