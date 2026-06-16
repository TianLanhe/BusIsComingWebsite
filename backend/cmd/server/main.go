package main

import (
	"log"
	"net/http"
	"os"

	"busiscoming-website/backend/internal/downloads/application"
	"busiscoming-website/backend/internal/downloads/infrastructure/filesystem"
	downloadhttp "busiscoming-website/backend/internal/downloads/interfaces/http"
	"github.com/gin-gonic/gin"
)

func main() {
	downloadRoot := getenv("BUS_DOWNLOAD_ROOT", "downloads/android")

	repository := filesystem.NewArtifactRepository(downloadRoot)
	checksum := filesystem.NewChecksumCalculator()
	usecase := application.NewDownloadCurrentAPK(repository, checksum)
	handler := downloadhttp.NewHandler(usecase)

	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery())
	router.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	downloadhttp.RegisterRoutes(router, handler)

	if err := router.Run(serverAddress()); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}

func serverAddress() string {
	host := getenv("BUS_HTTP_HOST", "0.0.0.0")
	port := getenv("PORT", "8080")
	return host + ":" + port
}

func getenv(key string, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
