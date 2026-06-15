package downloadhttp

import "github.com/gin-gonic/gin"

func RegisterRoutes(router gin.IRouter, handler *Handler) {
	router.GET("/api/downloads/android/latest", handler.DownloadLatestAndroidAPK)
}
