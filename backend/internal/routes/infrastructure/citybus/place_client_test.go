package citybus_test

import (
	"testing"

	"busiscoming-website/backend/internal/routes/infrastructure/citybus"
)

func TestParsePlaceResponseParsesPipeRows(t *testing.T) {
	response := "header\n1|兴华邨兴翠楼|22.267079|114.242089\n2|渔湾邨|22.288516|114.196281\n"

	places, err := citybus.ParsePlaceResponse(response, 100)
	if err != nil {
		t.Fatalf("parse place response: %v", err)
	}
	if len(places) != 2 {
		t.Fatalf("expected 2 places, got %d", len(places))
	}
	if places[0].Name != "兴华邨兴翠楼" || places[0].Lat != 22.267079 || places[0].Lon != 114.242089 {
		t.Fatalf("unexpected first place: %#v", places[0])
	}
}

func TestParsePlaceResponseReturnsEmptyForNoResult(t *testing.T) {
	places, err := citybus.ParsePlaceResponse("header\nNo Result\n", 100)
	if err != nil {
		t.Fatalf("parse no result response: %v", err)
	}
	if len(places) != 0 {
		t.Fatalf("expected no places, got %d", len(places))
	}
}
