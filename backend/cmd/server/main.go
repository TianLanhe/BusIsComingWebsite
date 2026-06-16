package main

import (
	"log"
	"net/http"
	"os"
	"time"

	downloadapp "busiscoming-website/backend/internal/downloads/application"
	"busiscoming-website/backend/internal/downloads/infrastructure/filesystem"
	downloadhttp "busiscoming-website/backend/internal/downloads/interfaces/http"
	routeapp "busiscoming-website/backend/internal/routes/application"
	"busiscoming-website/backend/internal/routes/domain"
	"busiscoming-website/backend/internal/routes/infrastructure/citybus"
	"busiscoming-website/backend/internal/routes/infrastructure/datagovhk"
	routelogging "busiscoming-website/backend/internal/routes/infrastructure/logging"
	"busiscoming-website/backend/internal/routes/infrastructure/memory"
	"busiscoming-website/backend/internal/routes/infrastructure/signing"
	routehttp "busiscoming-website/backend/internal/routes/interfaces/http"
	"github.com/gin-gonic/gin"
)

func main() {
	downloadRoot := getenv("BUS_DOWNLOAD_ROOT", "downloads/android")
	port := getenv("PORT", "8080")
	now := time.Now

	repository := filesystem.NewArtifactRepository(downloadRoot)
	checksum := filesystem.NewChecksumCalculator()
	usecase := downloadapp.NewDownloadCurrentAPK(repository, checksum)
	handler := downloadhttp.NewHandler(usecase)

	routeLogger := routelogging.NewJSONLogger(os.Stdout)
	routeLimiter := memory.NewRateLimiter(120, time.Minute, now)
	placeCache := memory.NewTTLCache[[]domain.Place](now)
	routeCache := memory.NewTTLCache[[]domain.RouteOption](now)
	citybusRouteClient := citybus.NewRouteClient()
	citybusRouteClient.StopNames = datagovhk.NewStopClient()
	routeService := routeapp.NewService(routeapp.Dependencies{
		Clock:        now,
		PlaceService: citybus.NewPlaceClient(),
		RouteService: citybusRouteClient,
		EtaService:   datagovhk.NewEtaClient(),
		Signer:       signing.NewTokenSigner([]byte(os.Getenv("ROUTE_QUERY_TOKEN_SECRET")), now),
		Logger:       routeLogger,
		PlaceCache:   placeCache,
		RouteCache:   routeCache,
		AllowRequest: func(key string) bool {
			return routeLimiter.Allow(key)
		},
		DefaultLimit: 100,
	})
	routeHandler := routehttp.NewHandler(routeService)

	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery())
	router.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	downloadhttp.RegisterRoutes(router, handler)
	routehttp.RegisterRoutes(router, routeHandler)

	listenAddress := "127.0.0.1:" + port
	routeLogger.Info(domain.QueryLogEvent{
		OperationID: "server",
		Stage:       "startup",
		Fields: map[string]any{
			"listenAddress": listenAddress,
			"routesApi":     true,
		},
	})
	defer routeLogger.Info(domain.QueryLogEvent{OperationID: "server", Stage: "shutdown"})
	if err := router.Run(listenAddress); err != nil {
		routeLogger.Info(domain.QueryLogEvent{
			OperationID: "server",
			Stage:       "error",
			ErrorCode:   string(domain.ErrInternal),
			Fields: map[string]any{
				"error": err.Error(),
			},
		})
		log.Fatalf("server failed: %v", err)
	}
}

func getenv(key string, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
