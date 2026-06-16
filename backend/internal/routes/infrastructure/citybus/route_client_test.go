package citybus_test

import (
	"testing"

	"busiscoming-website/backend/internal/routes/domain"
	"busiscoming-website/backend/internal/routes/infrastructure/citybus"
)

func TestParseRouteResponseParsesAriaLabelAndP2PInfo(t *testing.T) {
	response := `
<div id="routelist2">
  <table aria-label="606 港元 6.1 預計 10 分鐘 步行距離 (約) 266 米" onclick="showroutep2p('1|*|CTB||606-1||10||20||O','list-a','general-a')"></table>
  <table aria-label="694 港元 5.0 至 307 港元 8.2 預計 35 分鐘 步行距離 (約) 400 米" onclick="showroutep2p('2|*|CTB||694-1||2||8||O|*|CTB||307-1||3||9||I','list-b','general-b')"></table>
</div>`

	routes, err := citybus.ParseRouteResponse(response, domain.LanguageZhHant)
	if err != nil {
		t.Fatalf("parse route response: %v", err)
	}
	if len(routes) != 2 {
		t.Fatalf("expected 2 routes, got %d", len(routes))
	}
	if routes[0].RouteLabel != "606" || routes[0].Fare.Amount != 6.1 || routes[0].DurationMinutes != 10 {
		t.Fatalf("unexpected first route: %#v", routes[0])
	}
	if len(routes[1].RouteNumbers) != 2 || routes[1].RouteNumbers[0] != "694" || routes[1].RouteNumbers[1] != "307" {
		t.Fatalf("expected transfer route numbers, got %#v", routes[1].RouteNumbers)
	}
	if len(routes[1].Legs) != 2 || routes[1].Legs[1].Route != "307" {
		t.Fatalf("expected parsed P2P legs, got %#v", routes[1].Legs)
	}
}

func TestParseStopMapResponseFindsBoardingAndAlightingStops(t *testing.T) {
	response := `
addstoponmap('001336','114.242089','22.267079','B','10','10 - 兴华邨兴翠楼','606-1','O');
addstoponmap('002180','114.196281','22.288516','A','20','20 - 渔湾邨','606-1','O');`
	leg := domain.P2PLeg{Company: "CTB", RouteVariant: "606-1", Route: "606", BoardingSeq: 10, AlightingSeq: 20, Bound: "O"}

	stops := citybus.ParseStopMapResponse(response, []domain.P2PLeg{leg})
	if len(stops) != 2 {
		t.Fatalf("expected 2 stops, got %d", len(stops))
	}
	if stops[0].StopID != "001336" || stops[0].DisplayName != "兴华邨兴翠楼" {
		t.Fatalf("unexpected first stop: %#v", stops[0])
	}
}
