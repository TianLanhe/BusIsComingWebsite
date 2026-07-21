package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	analyticsapp "busiscoming-website/backend/internal/analytics/application"
	analyticsqlite "busiscoming-website/backend/internal/analytics/infrastructure/sqlite"
	analyticshttp "busiscoming-website/backend/internal/analytics/interfaces/http"
	downloadapp "busiscoming-website/backend/internal/downloads/application"
	"busiscoming-website/backend/internal/downloads/infrastructure/filesystem"
	downloadhttp "busiscoming-website/backend/internal/downloads/interfaces/http"
	platformhttp "busiscoming-website/backend/internal/platform/httpserver"
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
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	if err := run(ctx); err != nil {
		log.Printf("server stopped: %v", err)
		os.Exit(1)
	}
}

func run(ctx context.Context) error {
	now := time.Now
	processStartedAt := now().UTC()
	health := analyticsapp.NewRuntimeHealth(processStartedAt)
	writeConfig := parseAnalyticsWriteTimeout(os.Getenv("ANALYTICS_WRITE_TIMEOUT_MS"))
	if !writeConfig.Enabled {
		health.SetDatabaseState(analyticsapp.DatabaseDegraded, writeConfig.Reason)
	}

	var analyticsStore *analyticsqlite.Store
	store, err := analyticsqlite.Open(ctx, getenv("BUS_ANALYTICS_DB_PATH", "../shared/analytics/analytics.sqlite"))
	if err != nil {
		health.SetDatabaseState(analyticsapp.DatabaseUnavailable, analyticsapp.ReasonOpenFailed)
		writeControlledEvent(os.Stderr, "analytics_store", "open_failed")
	} else {
		analyticsStore = store
		defer analyticsStore.Close()
	}

	publicEngine := platformhttp.NewPublicEngine(os.Stdout, noOpAnalyticsMiddleware())
	publicEngine.GET("/healthz", func(c *gin.Context) {
		platformhttp.SetRequestMetadata(c, "getPublicHealth", "platform")
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	registerDownloadRoutes(publicEngine)
	registerRouteQueryRoutes(publicEngine, now)

	privateEngine := platformhttp.NewPrivateEngine(os.Stdout)
	analyticshttp.RegisterStaticFallback(privateEngine, getenv("BUS_ANALYTICS_UI_ROOT", "../frontend/dist-monitor"))

	publicServer := &http.Server{
		Addr:              publicServerAddress(),
		Handler:           publicEngine,
		ReadHeaderTimeout: 10 * time.Second,
	}
	privateServer := &http.Server{
		Addr:              privateServerAddress(),
		Handler:           privateEngine,
		ReadHeaderTimeout: 10 * time.Second,
	}
	supervisor := platformhttp.NewSupervisor([]platformhttp.ManagedServer{
		{Name: "public", Required: true, Serve: publicServer.ListenAndServe, Shutdown: publicServer.Shutdown},
		{Name: "private", Required: false, Serve: privateServer.ListenAndServe, Shutdown: privateServer.Shutdown},
	}, 10*time.Second, func(report platformhttp.ServerReport) {
		writeControlledEvent(os.Stderr, "listener_"+report.Name, string(report.State))
	})
	return supervisor.Run(ctx)
}

func registerDownloadRoutes(engine *gin.Engine) {
	downloadRoot := getenv("BUS_DOWNLOAD_ROOT", "downloads/android")
	repository := filesystem.NewArtifactRepository(downloadRoot)
	checksum := filesystem.NewChecksumCalculator()
	usecase := downloadapp.NewDownloadCurrentAPK(repository, checksum)
	downloadhttp.RegisterRoutes(engine, downloadhttp.NewHandler(usecase))
}

func registerRouteQueryRoutes(engine *gin.Engine, now func() time.Time) {
	routeLogger := routelogging.NewJSONLogger(os.Stdout)
	routeLimiter := memory.NewRateLimiter(120, time.Minute, now)
	placeCache := memory.NewTTLCache[[]domain.Place](now)
	routeCache := memory.NewTTLCache[[]domain.RouteOption](now)
	stopNameCache := memory.NewTTLCache[string](now)
	stopMapCache := memory.NewTTLCache[[]domain.P2PStop](now)
	stopClient := datagovhk.NewStopClient()
	stopClient.Cache = stopNameCache
	stopClient.NormalizeName = citybus.NormalizeStopDisplayName
	stopClient.Logger = routeLogger
	citybusRouteClient := citybus.NewRouteClient()
	citybusRouteClient.StopNames = stopClient
	citybusRouteClient.StopMapCache = stopMapCache
	citybusRouteClient.Logger = routeLogger
	service := routeapp.NewService(routeapp.Dependencies{
		Clock:        now,
		PlaceService: citybus.NewPlaceClient(),
		RouteService: citybusRouteClient,
		EtaService:   datagovhk.NewEtaClient(),
		Signer:       signing.NewTokenSigner([]byte(os.Getenv("ROUTE_QUERY_TOKEN_SECRET")), now),
		Logger:       routeLogger,
		PlaceCache:   placeCache,
		RouteCache:   routeCache,
		AllowRequest: func(key string) bool { return routeLimiter.Allow(key) },
		DefaultLimit: 100,
	})
	routehttp.RegisterRoutes(engine, routehttp.NewHandler(service))
}

func noOpAnalyticsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) { c.Next() }
}

func writeControlledEvent(output *os.File, event, state string) {
	_ = json.NewEncoder(output).Encode(map[string]string{"event": event, "state": state})
}

func getenv(key string, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
