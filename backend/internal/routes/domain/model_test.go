package domain_test

import (
	"testing"
	"time"

	"busiscoming-website/backend/internal/routes/domain"
)

func TestPlaceTokenPayloadSamePlace(t *testing.T) {
	origin := domain.PlaceTokenPayload{Lat: 22.267079, Lon: 114.242089}
	same := domain.PlaceTokenPayload{Lat: 22.267079, Lon: 114.242089}
	different := domain.PlaceTokenPayload{Lat: 22.288516, Lon: 114.196281}

	if !origin.SamePlace(same) {
		t.Fatal("expected identical coordinates to be treated as same place")
	}
	if origin.SamePlace(different) {
		t.Fatal("expected different coordinates to be queryable")
	}
}

func TestQueryErrorCarriesStableCode(t *testing.T) {
	err := domain.NewQueryError(domain.ErrRateLimited, "too many requests")

	if err.Code != domain.ErrRateLimited {
		t.Fatalf("expected code %s, got %s", domain.ErrRateLimited, err.Code)
	}
	if err.Error() != "RATE_LIMITED: too many requests" {
		t.Fatalf("unexpected error string: %s", err.Error())
	}
}

func TestRouteOptionSortKeyUsesDurationThenIndex(t *testing.T) {
	slower := domain.RouteOption{RouteID: "slow", DurationMinutes: 12, SortIndex: 0}
	faster := domain.RouteOption{RouteID: "fast", DurationMinutes: 10, SortIndex: 1}

	routes := []domain.RouteOption{slower, faster}
	domain.SortRouteOptions(routes)

	if routes[0].RouteID != "fast" {
		t.Fatalf("expected faster route first, got %s", routes[0].RouteID)
	}
}

func TestEtaStatusUnavailableKeepsUpdatedAt(t *testing.T) {
	now := time.Date(2026, 6, 16, 12, 0, 0, 0, time.UTC)
	status := domain.UnavailableEtaStatus("token", now)

	if status.Status != domain.EtaUnavailable || status.UpdatedAt != now {
		t.Fatalf("unexpected unavailable ETA status: %#v", status)
	}
}
