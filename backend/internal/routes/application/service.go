package application

import (
	"context"
	"fmt"
	"time"

	"busiscoming-website/backend/internal/routes/domain"
)

type Service struct {
	clock        func() time.Time
	places       PlaceSearcher
	routes       RouteSearcher
	etas         EtaService
	signer       Signer
	logger       Logger
	placeCache   Cache[[]domain.Place]
	routeCache   Cache[[]domain.RouteOption]
	allowRequest func(key string) bool
	defaultLimit int
}

func NewService(deps Dependencies) *Service {
	clock := deps.Clock
	if clock == nil {
		clock = time.Now
	}
	logger := deps.Logger
	if logger == nil {
		logger = DiscardLogger{}
	}
	defaultLimit := deps.DefaultLimit
	if defaultLimit <= 0 {
		defaultLimit = 100
	}
	return &Service{
		clock:        clock,
		places:       deps.PlaceService,
		routes:       deps.RouteService,
		etas:         deps.EtaService,
		signer:       deps.Signer,
		logger:       logger,
		placeCache:   deps.PlaceCache,
		routeCache:   deps.RouteCache,
		allowRequest: deps.AllowRequest,
		defaultLimit: defaultLimit,
	}
}

type QueryPlacesRequest struct {
	RequestID string
	Language  domain.Language
	Query     string
	Limit     int
}

type QueryPlacesResult struct {
	Places    []domain.PlaceCandidate `json:"places"`
	ExpiresAt time.Time               `json:"expiresAt"`
}

type QueryRoutesRequest struct {
	RequestID             string
	Language              domain.Language
	OriginPlaceToken      string
	DestinationPlaceToken string
}

type QueryRoutesResult struct {
	QueriedAt   time.Time            `json:"queriedAt"`
	ResultLimit int                  `json:"resultLimit"`
	Routes      []domain.RouteOption `json:"routes"`
}

type QueryEtasRequest struct {
	RequestID string
	Language  domain.Language
	EtaTokens []string
}

type QueryEtasResult struct {
	QueriedAt time.Time          `json:"queriedAt"`
	Etas      []domain.EtaStatus `json:"etas"`
}

func (s *Service) QueryPlaces(ctx context.Context, request QueryPlacesRequest) (QueryPlacesResult, *domain.QueryError) {
	start := s.clock()
	if !request.Language.Valid() || request.Query == "" {
		return QueryPlacesResult{}, domain.NewQueryError(domain.ErrInvalidArgument, "language and query are required")
	}
	if !s.allow("queryRoutePlaces") {
		return QueryPlacesResult{}, domain.NewQueryError(domain.ErrRateLimited, "too many place queries")
	}
	if s.places == nil || s.signer == nil {
		return QueryPlacesResult{}, domain.NewQueryError(domain.ErrInternal, "place service is not configured")
	}
	limit := request.Limit
	if limit <= 0 || limit > s.defaultLimit {
		limit = s.defaultLimit
	}
	cacheKey := fmt.Sprintf("places:%s:%s:%d", request.Language, request.Query, limit)
	places, cacheHit := s.cachedPlaces(cacheKey)
	if !cacheHit {
		var err error
		places, err = s.places.SearchPlaces(ctx, request.Query, request.Language, limit)
		if err != nil {
			s.logError(request.RequestID, "queryRoutePlaces", request.Language, domain.ErrExternalUnavailable, start)
			return QueryPlacesResult{}, domain.NewQueryError(domain.ErrExternalUnavailable, "place search unavailable")
		}
		if s.placeCache != nil {
			s.placeCache.Set(cacheKey, places, 5*time.Minute)
		}
	}
	candidates := make([]domain.PlaceCandidate, 0, len(places))
	var expiresAt time.Time
	for _, place := range places {
		token, tokenExpiresAt, err := s.signer.SignPlace(domain.PlaceTokenPayload{
			Subject:  domain.TokenSubjectPlace,
			Name:     place.Name,
			Lat:      place.Lat,
			Lon:      place.Lon,
			Language: request.Language,
			Provider: firstNonEmpty(place.Provider, "citybus"),
		})
		if err != nil {
			return QueryPlacesResult{}, domain.NewQueryError(domain.ErrInternal, "failed to sign place token")
		}
		expiresAt = tokenExpiresAt
		candidates = append(candidates, domain.PlaceCandidate{
			PlaceToken:  token,
			Name:        place.Name,
			DisplayHint: place.DisplayHint,
			Provider:    firstNonEmpty(place.Provider, "citybus"),
			ExpiresAt:   tokenExpiresAt,
		})
	}
	s.logResultWithCache(request.RequestID, "queryRoutePlaces", request.Language, len(candidates), start, cacheHit)
	return QueryPlacesResult{Places: candidates, ExpiresAt: expiresAt}, nil
}

func (s *Service) QueryRoutes(ctx context.Context, request QueryRoutesRequest) (QueryRoutesResult, *domain.QueryError) {
	start := s.clock()
	if !request.Language.Valid() || request.OriginPlaceToken == "" || request.DestinationPlaceToken == "" {
		return QueryRoutesResult{}, domain.NewQueryError(domain.ErrInvalidArgument, "language and place tokens are required")
	}
	if !s.allow("queryRouteOptions") {
		return QueryRoutesResult{}, domain.NewQueryError(domain.ErrRateLimited, "too many route queries")
	}
	if s.routes == nil || s.signer == nil {
		return QueryRoutesResult{}, domain.NewQueryError(domain.ErrInternal, "route service is not configured")
	}
	origin, err := s.signer.VerifyPlace(request.OriginPlaceToken)
	if err != nil {
		return QueryRoutesResult{}, domain.NewQueryError(classifyPlaceTokenError(err), err.Error())
	}
	destination, err := s.signer.VerifyPlace(request.DestinationPlaceToken)
	if err != nil {
		return QueryRoutesResult{}, domain.NewQueryError(classifyPlaceTokenError(err), err.Error())
	}
	if origin.SamePlace(destination) {
		return QueryRoutesResult{}, domain.NewQueryError(domain.ErrSamePlace, "origin and destination are the same")
	}
	cacheKey := fmt.Sprintf("routes:%s:%.6f:%.6f:%.6f:%.6f", request.Language, origin.Lat, origin.Lon, destination.Lat, destination.Lon)
	routes, cacheHit := s.cachedRoutes(cacheKey)
	if !cacheHit {
		var err error
		routes, err = s.routes.SearchRoutes(ctx, origin, destination, request.Language)
		if err != nil {
			s.logRouteError(request.RequestID, "queryRouteOptions", request.Language, origin, destination, domain.ErrExternalUnavailable, start)
			return QueryRoutesResult{}, domain.NewQueryError(domain.ErrExternalUnavailable, "route query unavailable")
		}
		if s.routeCache != nil {
			s.routeCache.Set(cacheKey, cloneRoutes(routes), time.Minute)
		}
	}
	domain.SortRouteOptions(routes)
	if len(routes) > 20 {
		routes = routes[:20]
	}
	for index := range routes {
		if routes[index].EtaPayload == nil {
			continue
		}
		token, expiresAt, err := s.signer.SignEta(*routes[index].EtaPayload)
		if err != nil {
			return QueryRoutesResult{}, domain.NewQueryError(domain.ErrInternal, "failed to sign eta token")
		}
		routes[index].EtaToken = token
		routes[index].EtaExpiresAt = &expiresAt
	}
	s.logRouteResult(request.RequestID, "queryRouteOptions", request.Language, origin, destination, len(routes), start, cacheHit)
	return QueryRoutesResult{QueriedAt: s.clock(), ResultLimit: 20, Routes: routes}, nil
}

func (s *Service) QueryEtas(ctx context.Context, request QueryEtasRequest) (QueryEtasResult, *domain.QueryError) {
	start := s.clock()
	if !request.Language.Valid() || len(request.EtaTokens) == 0 {
		return QueryEtasResult{}, domain.NewQueryError(domain.ErrInvalidArgument, "language and eta tokens are required")
	}
	if !s.allow("queryRouteEtas") {
		return QueryEtasResult{}, domain.NewQueryError(domain.ErrRateLimited, "too many eta queries")
	}
	if s.etas == nil || s.signer == nil {
		return QueryEtasResult{}, domain.NewQueryError(domain.ErrInternal, "eta service is not configured")
	}
	statuses := make([]domain.EtaStatus, 0, len(request.EtaTokens))
	for _, token := range request.EtaTokens {
		payload, err := s.signer.VerifyEta(token)
		if err != nil {
			statuses = append(statuses, domain.UnavailableEtaStatus(token, s.clock()))
			continue
		}
		status, err := s.etas.QueryEta(ctx, token, payload)
		if err != nil {
			status = domain.UnavailableEtaStatus(token, s.clock())
		}
		statuses = append(statuses, status)
	}
	s.logResult(request.RequestID, "queryRouteEtas", request.Language, len(statuses), start)
	return QueryEtasResult{QueriedAt: s.clock(), Etas: statuses}, nil
}

func (s *Service) allow(key string) bool {
	if s.allowRequest == nil {
		return true
	}
	return s.allowRequest(key)
}

func (s *Service) logResult(requestID, operation string, language domain.Language, count int, start time.Time) {
	s.logResultWithCache(requestID, operation, language, count, start, false)
}

func (s *Service) logResultWithCache(requestID, operation string, language domain.Language, count int, start time.Time, cacheHit bool) {
	s.logger.Info(domain.QueryLogEvent{
		RequestID:   requestID,
		OperationID: operation,
		Stage:       "result",
		Language:    language,
		DurationMs:  s.clock().Sub(start).Milliseconds(),
		ResultCount: &count,
		CacheHit:    &cacheHit,
	})
}

func (s *Service) logRouteResult(requestID, operation string, language domain.Language, origin, destination domain.PlaceTokenPayload, count int, start time.Time, cacheHit bool) {
	originLat, originLon := origin.Lat, origin.Lon
	destinationLat, destinationLon := destination.Lat, destination.Lon
	s.logger.Info(domain.QueryLogEvent{
		RequestID:       requestID,
		OperationID:     operation,
		Stage:           "result",
		Language:        language,
		OriginName:      origin.Name,
		OriginLat:       &originLat,
		OriginLon:       &originLon,
		DestinationName: destination.Name,
		DestinationLat:  &destinationLat,
		DestinationLon:  &destinationLon,
		DurationMs:      s.clock().Sub(start).Milliseconds(),
		ResultCount:     &count,
		CacheHit:        &cacheHit,
	})
}

func (s *Service) logError(requestID, operation string, language domain.Language, code domain.ErrorCode, start time.Time) {
	s.logger.Info(domain.QueryLogEvent{
		RequestID:   requestID,
		OperationID: operation,
		Stage:       "error",
		Language:    language,
		DurationMs:  s.clock().Sub(start).Milliseconds(),
		ErrorCode:   string(code),
	})
}

func (s *Service) logRouteError(requestID, operation string, language domain.Language, origin, destination domain.PlaceTokenPayload, code domain.ErrorCode, start time.Time) {
	originLat, originLon := origin.Lat, origin.Lon
	destinationLat, destinationLon := destination.Lat, destination.Lon
	s.logger.Info(domain.QueryLogEvent{
		RequestID:       requestID,
		OperationID:     operation,
		Stage:           "error",
		Language:        language,
		OriginName:      origin.Name,
		OriginLat:       &originLat,
		OriginLon:       &originLon,
		DestinationName: destination.Name,
		DestinationLat:  &destinationLat,
		DestinationLon:  &destinationLon,
		DurationMs:      s.clock().Sub(start).Milliseconds(),
		ErrorCode:       string(code),
	})
}

func (s *Service) cachedPlaces(key string) ([]domain.Place, bool) {
	if s.placeCache == nil {
		return nil, false
	}
	places, ok := s.placeCache.Get(key)
	if !ok {
		return nil, false
	}
	return append([]domain.Place(nil), places...), true
}

func (s *Service) cachedRoutes(key string) ([]domain.RouteOption, bool) {
	if s.routeCache == nil {
		return nil, false
	}
	routes, ok := s.routeCache.Get(key)
	if !ok {
		return nil, false
	}
	return cloneRoutes(routes), true
}

func cloneRoutes(routes []domain.RouteOption) []domain.RouteOption {
	clone := append([]domain.RouteOption(nil), routes...)
	for index := range clone {
		clone[index].RouteNumbers = append([]string(nil), clone[index].RouteNumbers...)
		clone[index].Legs = append([]domain.P2PLeg(nil), clone[index].Legs...)
		clone[index].EtaToken = ""
		clone[index].EtaExpiresAt = nil
	}
	return clone
}

func classifyPlaceTokenError(err error) domain.ErrorCode {
	if err != nil && (fmt.Sprint(err) == "place token expired" || fmt.Sprint(err) == "eta token expired") {
		return domain.ErrPlaceTokenExpired
	}
	return domain.ErrPlaceTokenInvalid
}

func firstNonEmpty(value, fallback string) string {
	if value != "" {
		return value
	}
	return fallback
}
