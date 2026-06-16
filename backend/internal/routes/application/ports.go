package application

import (
	"context"
	"time"

	"busiscoming-website/backend/internal/routes/domain"
)

type PlaceSearcher interface {
	SearchPlaces(ctx context.Context, query string, language domain.Language, limit int) ([]domain.Place, error)
}

type RouteSearcher interface {
	SearchRoutes(ctx context.Context, origin domain.PlaceTokenPayload, destination domain.PlaceTokenPayload, language domain.Language) ([]domain.RouteOption, error)
}

type EtaService interface {
	QueryEta(ctx context.Context, token string, payload domain.EtaTokenPayload) (domain.EtaStatus, error)
}

type Signer interface {
	SignPlace(domain.PlaceTokenPayload) (string, time.Time, error)
	VerifyPlace(string) (domain.PlaceTokenPayload, error)
	SignEta(domain.EtaTokenPayload) (string, time.Time, error)
	VerifyEta(string) (domain.EtaTokenPayload, error)
}

type Logger interface {
	Info(domain.QueryLogEvent)
}

type Cache[T any] interface {
	Get(string) (T, bool)
	Set(string, T, time.Duration)
}

type DiscardLogger struct{}

func (DiscardLogger) Info(domain.QueryLogEvent) {}

type Dependencies struct {
	Clock        func() time.Time
	PlaceService PlaceSearcher
	RouteService RouteSearcher
	EtaService   EtaService
	Signer       Signer
	Logger       Logger
	PlaceCache   Cache[[]domain.Place]
	RouteCache   Cache[[]domain.RouteOption]
	AllowRequest func(key string) bool
	DefaultLimit int
}
