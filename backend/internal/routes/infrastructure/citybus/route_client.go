package citybus

import (
	"context"
	"crypto/sha1"
	"encoding/hex"
	"errors"
	"fmt"
	"html"
	"io"
	"math"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"

	"busiscoming-website/backend/internal/routes/domain"
)

type RouteClient struct {
	BaseURL    string
	StopMapURL string
	HTTPClient *http.Client
	StopNames  StopNameResolver
	Now        func() time.Time
}

type StopNameResolver interface {
	ResolveStopName(ctx context.Context, stopID string, language domain.Language) (string, error)
}

func NewRouteClient() *RouteClient {
	return &RouteClient{
		BaseURL:    "https://mobile.citybus.com.hk/nwp3/ppsearch_p3.php",
		StopMapURL: "https://mobile.citybus.com.hk/nwp3/showstops2.php",
		HTTPClient: &http.Client{Timeout: 20 * time.Second},
		Now:        time.Now,
	}
}

func (c *RouteClient) SearchRoutes(ctx context.Context, origin domain.PlaceTokenPayload, destination domain.PlaceTokenPayload, language domain.Language) ([]domain.RouteOption, error) {
	client := c.HTTPClient
	if client == nil {
		client = http.DefaultClient
	}
	var allRoutes []domain.RouteOption
	for _, mode := range []string{"T", "F", "W"} {
		body, err := c.fetchRouteHTML(ctx, client, origin, destination, language, mode)
		if err != nil {
			continue
		}
		routes, err := ParseRouteResponse(body, language)
		if err != nil {
			continue
		}
		for index := range routes {
			c.fillStopPreview(ctx, client, &routes[index], language)
		}
		allRoutes = append(allRoutes, routes...)
	}
	if len(allRoutes) == 0 {
		return nil, errors.New("citybus route query returned no parseable results")
	}
	return dedupeRoutes(allRoutes), nil
}

func (c *RouteClient) fetchRouteHTML(ctx context.Context, client *http.Client, origin, destination domain.PlaceTokenPayload, language domain.Language, mode string) (string, error) {
	endpoint, err := url.Parse(firstNonEmpty(c.BaseURL, "https://mobile.citybus.com.hk/nwp3/ppsearch_p3.php"))
	if err != nil {
		return "", err
	}
	values := endpoint.Query()
	values.Set("slat", strconv.FormatFloat(origin.Lat, 'f', -1, 64))
	values.Set("slon", strconv.FormatFloat(origin.Lon, 'f', -1, 64))
	values.Set("elat", strconv.FormatFloat(destination.Lat, 'f', -1, 64))
	values.Set("elon", strconv.FormatFloat(destination.Lon, 'f', -1, 64))
	values.Set("t", c.now().In(time.FixedZone("HKT", 8*3600)).Format("2006-01-02 15:04"))
	values.Set("ws", "1.3")
	values.Set("leg", "2")
	values.Set("m1", mode)
	values.Set("l", LanguageParam(language))
	endpoint.RawQuery = values.Encode()
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint.String(), nil)
	if err != nil {
		return "", err
	}
	request.Header.Set("Accept", "*/*")
	request.Header.Set("Referer", "https://mobile.citybus.com.hk/nwp3/")
	response, err := client.Do(request)
	if err != nil {
		return "", err
	}
	defer response.Body.Close()
	body, err := io.ReadAll(response.Body)
	if err != nil {
		return "", err
	}
	if response.StatusCode < 200 || response.StatusCode > 299 {
		return "", errors.New("citybus route query failed")
	}
	return string(body), nil
}

func ParseRouteResponse(response string, language domain.Language) ([]domain.RouteOption, error) {
	routeList := routeListPattern.FindStringSubmatch(response)
	if routeList == nil {
		return nil, errors.New("citybus route response missing routelist2")
	}
	tableMatches := tablePattern.FindAllStringSubmatch(routeList[1], -1)
	routes := make([]domain.RouteOption, 0, len(tableMatches))
	for _, tableMatch := range tableMatches {
		table := tableMatch[0]
		if !strings.Contains(table, "預計") && !strings.Contains(strings.ToLower(table), "min") {
			continue
		}
		route, ok := parseRouteTable(table, language)
		if ok {
			routes = append(routes, route)
		}
	}
	if len(routes) == 0 {
		return nil, errors.New("citybus route response has no valid route rows")
	}
	domain.SortRouteOptions(routes)
	return routes, nil
}

func parseRouteTable(table string, language domain.Language) (domain.RouteOption, bool) {
	attrs := attributeText(table)
	label := html.UnescapeString(firstAttr(attrs, "aria-label"))
	text := stripTags(table)
	searchText := firstNonEmpty(label, text)
	segments, totalFare := parseSegments(searchText)
	duration := firstInt(durationPattern, searchText)
	walking := firstInt(walkingPattern, searchText)
	if len(segments) == 0 || duration < 0 || walking < 0 {
		return domain.RouteOption{}, false
	}
	rawInfo, listID, generalInfo := parseShowRouteP2P(table)
	legs := ParseP2PLegs(rawInfo)
	routeLabel := strings.Join(segments, " \u2192 ")
	route := domain.RouteOption{
		RouteID:               buildRouteID(segments, duration, walking, rawInfo),
		Operator:              "citybus",
		RouteNumbers:          segments,
		RouteLabel:            routeLabel,
		Fare:                  domain.MoneyAmount{Currency: "HKD", Amount: totalFare},
		DurationMinutes:       duration,
		WalkingDistanceMeters: walking,
		RawInfo:               rawInfo,
		ListID:                listID,
		GeneralInfo:           generalInfo,
		Legs:                  legs,
	}
	if len(legs) > 0 {
		firstLeg := legs[0]
		route.EtaPayload = &domain.EtaTokenPayload{
			Subject:      domain.TokenSubjectEta,
			RouteID:      route.RouteID,
			RouteNumber:  firstLeg.Route,
			Direction:    firstLeg.Bound,
			ServiceType:  "1",
			Language:     language,
			Company:      firstLeg.Company,
			RouteVariant: firstLeg.RouteVariant,
			BoardingSeq:  firstLeg.BoardingSeq,
			AlightingSeq: firstLeg.AlightingSeq,
			RawInfo:      rawInfo,
		}
	}
	return route, true
}

func ParseP2PLegs(rawInfo string) []domain.P2PLeg {
	// rawInfo 来自 Citybus showroutep2p，字段中包含公司、路线 variant、上下车 seq 和方向，是后续 showstops2 与 ETA token 的唯一稳定关联。
	parts := strings.Split(rawInfo, "|*|")
	if len(parts) < 2 {
		return nil
	}
	count, err := strconv.Atoi(strings.TrimSpace(parts[0]))
	if err != nil || count <= 0 {
		return nil
	}
	legs := make([]domain.P2PLeg, 0, count)
	for _, rawLeg := range parts[1:] {
		fields := strings.Split(rawLeg, "||")
		if len(fields) < 5 {
			continue
		}
		boardingSeq, boardingErr := strconv.Atoi(strings.TrimSpace(fields[2]))
		alightingSeq, alightingErr := strconv.Atoi(strings.TrimSpace(fields[3]))
		if boardingErr != nil || alightingErr != nil {
			continue
		}
		routeVariant := strings.TrimSpace(fields[1])
		bound := strings.TrimSpace(fields[4])
		legs = append(legs, domain.P2PLeg{
			Company:      strings.TrimSpace(fields[0]),
			RouteVariant: routeVariant,
			Route:        strings.Split(routeVariant, "-")[0],
			BoardingSeq:  boardingSeq,
			AlightingSeq: alightingSeq,
			Bound:        bound,
			Direction:    directionPath(bound),
		})
	}
	if len(legs) != count {
		return nil
	}
	return legs
}

func ParseStopMapResponse(response string, legs []domain.P2PLeg) []domain.P2PStop {
	matches := addStopPattern.FindAllStringSubmatch(response, -1)
	stops := make([]domain.P2PStop, 0, len(matches))
	for _, match := range matches {
		args := parseFunctionArgs(match[1])
		if len(args) < 8 {
			continue
		}
		lon, lonErr := strconv.ParseFloat(args[1], 64)
		lat, latErr := strconv.ParseFloat(args[2], 64)
		seq, seqErr := strconv.Atoi(args[4])
		if lonErr != nil || latErr != nil || seqErr != nil {
			continue
		}
		routeVariant := args[6]
		legIndex := 0
		for index, leg := range legs {
			if leg.RouteVariant == routeVariant {
				legIndex = index
				break
			}
		}
		stops = append(stops, domain.P2PStop{
			LegIndex:     legIndex,
			Company:      legValue(legs, legIndex).Company,
			RouteVariant: routeVariant,
			PublicRoute:  strings.Split(routeVariant, "-")[0],
			Bound:        args[7],
			Sequence:     seq,
			StopID:       args[0],
			RawName:      args[5],
			DisplayName:  stationDisplayName(args[5]),
			Lat:          lat,
			Lon:          lon,
			MarkerType:   args[3],
		})
	}
	return stops
}

func (c *RouteClient) fillStopPreview(ctx context.Context, client *http.Client, route *domain.RouteOption, language domain.Language) {
	if len(route.Legs) == 0 || route.RawInfo == "" {
		return
	}
	endpoint, err := url.Parse(firstNonEmpty(c.StopMapURL, "https://mobile.citybus.com.hk/nwp3/showstops2.php"))
	if err != nil {
		return
	}
	values := endpoint.Query()
	values.Set("r", route.RawInfo)
	values.Set("l", LanguageParam(language))
	endpoint.RawQuery = values.Encode()
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint.String(), nil)
	if err != nil {
		return
	}
	response, err := client.Do(request)
	if err != nil {
		return
	}
	defer response.Body.Close()
	body, err := io.ReadAll(response.Body)
	if err != nil {
		return
	}
	stops := ParseStopMapResponse(string(body), route.Legs)
	if len(stops) == 0 {
		return
	}
	firstLeg := route.Legs[0]
	lastLeg := route.Legs[len(route.Legs)-1]
	board := findStop(stops, 0, firstLeg.RouteVariant, firstLeg.BoardingSeq)
	alight := findStop(stops, len(route.Legs)-1, lastLeg.RouteVariant, lastLeg.AlightingSeq)
	if board != nil {
		route.BoardingStop = domain.StopSummary{Name: c.resolveStopName(ctx, board, language), StopID: board.StopID}
		if route.EtaPayload != nil {
			route.EtaPayload.StopID = board.StopID
		}
	}
	if alight != nil {
		route.AlightingStop = domain.StopSummary{Name: c.resolveStopName(ctx, alight, language), StopID: alight.StopID}
	}
}

func (c *RouteClient) resolveStopName(ctx context.Context, stop *domain.P2PStop, language domain.Language) string {
	if stop == nil {
		return ""
	}
	if c.StopNames != nil && stop.StopID != "" {
		if name, err := c.StopNames.ResolveStopName(ctx, stop.StopID, language); err == nil && name != "" {
			return name
		}
	}
	return stop.DisplayName
}

func findStop(stops []domain.P2PStop, legIndex int, routeVariant string, seq int) *domain.P2PStop {
	for index := range stops {
		if stops[index].LegIndex == legIndex && stops[index].RouteVariant == routeVariant && stops[index].Sequence == seq {
			return &stops[index]
		}
	}
	for index := range stops {
		if stops[index].RouteVariant == routeVariant && stops[index].Sequence == seq {
			return &stops[index]
		}
	}
	return nil
}

func dedupeRoutes(routes []domain.RouteOption) []domain.RouteOption {
	seen := make(map[string]domain.RouteOption)
	order := make([]string, 0, len(routes))
	for _, route := range routes {
		key := strings.Join(route.RouteNumbers, ">") + fmt.Sprintf("|%.1f|%d|%d|%s", route.Fare.Amount, route.DurationMinutes, route.WalkingDistanceMeters, route.RawInfo)
		if _, ok := seen[key]; !ok {
			order = append(order, key)
			seen[key] = route
		}
	}
	result := make([]domain.RouteOption, 0, len(order))
	for _, key := range order {
		result = append(result, seen[key])
	}
	domain.SortRouteOptions(result)
	return result
}

func attributeText(tag string) string {
	end := strings.Index(tag, ">")
	if end < 0 {
		return tag
	}
	return tag[:end]
}

func firstAttr(attrs, name string) string {
	pattern := regexp.MustCompile(name + `="([^"]*)"`)
	match := pattern.FindStringSubmatch(attrs)
	if match == nil {
		return ""
	}
	return match[1]
}

func stripTags(value string) string {
	return strings.TrimSpace(tagPattern.ReplaceAllString(value, " "))
}

func parseSegments(text string) ([]string, float64) {
	matches := routePricePattern.FindAllStringSubmatch(text, -1)
	segments := make([]string, 0, len(matches))
	var total float64
	for _, match := range matches {
		route := strings.TrimSpace(match[1])
		if route == "" {
			continue
		}
		price := 0.0
		if match[2] != "" {
			price, _ = strconv.ParseFloat(match[2], 64)
		} else if match[4] != "" {
			price, _ = strconv.ParseFloat(match[4], 64)
		}
		segments = append(segments, route)
		total += price
	}
	return segments, math.Round(total*10) / 10
}

func firstInt(pattern *regexp.Regexp, text string) int {
	match := pattern.FindStringSubmatch(text)
	if match == nil {
		return -1
	}
	value, err := strconv.Atoi(strings.ReplaceAll(match[1], ",", ""))
	if err != nil {
		return -1
	}
	return value
}

func parseShowRouteP2P(table string) (string, string, string) {
	match := showRoutePattern.FindStringSubmatch(table)
	if match == nil {
		return "", "", ""
	}
	return html.UnescapeString(match[1]), html.UnescapeString(match[2]), html.UnescapeString(match[3])
}

func parseFunctionArgs(argumentList string) []string {
	args := make([]string, 0)
	current := strings.Builder{}
	inQuote := false
	for _, char := range argumentList {
		switch {
		case char == '\'':
			inQuote = !inQuote
		case char == ',' && !inQuote:
			args = append(args, strings.TrimSpace(current.String()))
			current.Reset()
		default:
			current.WriteRune(char)
		}
	}
	if current.Len() > 0 || strings.HasSuffix(argumentList, ",") {
		args = append(args, strings.TrimSpace(current.String()))
	}
	for index := range args {
		args[index] = strings.Trim(args[index], "' ")
		args[index] = strings.TrimSpace(removeStopSequencePrefix(args[index]))
	}
	return args
}

func removeStopSequencePrefix(value string) string {
	return stopSequencePattern.ReplaceAllString(value, "")
}

func stationDisplayName(rawName string) string {
	return strings.TrimSpace(strings.Split(removeStopSequencePrefix(rawName), ",")[0])
}

func buildRouteID(segments []string, duration int, walking int, rawInfo string) string {
	hash := sha1.Sum([]byte(strings.Join(segments, ">") + fmt.Sprintf("|%d|%d|%s", duration, walking, rawInfo)))
	return "route-" + hex.EncodeToString(hash[:])[:12]
}

func directionPath(bound string) string {
	if bound == "O" {
		return "outbound"
	}
	if bound == "I" {
		return "inbound"
	}
	return ""
}

func legValue(legs []domain.P2PLeg, index int) domain.P2PLeg {
	if index >= 0 && index < len(legs) {
		return legs[index]
	}
	return domain.P2PLeg{}
}

func (c *RouteClient) now() time.Time {
	if c.Now != nil {
		return c.Now()
	}
	return time.Now()
}

var (
	routeListPattern    = regexp.MustCompile(`(?is)<[^>]+id=["']routelist2["'][^>]*>(.*)</[^>]+>`)
	tablePattern        = regexp.MustCompile(`(?is)<table\b[^>]*>.*?</table>|<table\b[^>]*/>`)
	tagPattern          = regexp.MustCompile(`(?is)<[^>]+>`)
	routePricePattern   = regexp.MustCompile(`(?:^|\s+至\s+)([^\s]+)\s+(?:港元\s*([0-9]+(?:\.[0-9]+)?)|(免費)|HK\$?\s*([0-9]+(?:\.[0-9]+)?))`)
	durationPattern     = regexp.MustCompile(`(?:預計|Estimated[^\d]*)\s*([0-9]+)\s*(?:分鐘|min)`)
	walkingPattern      = regexp.MustCompile(`(?:步行距離\s*\(約\)|Walking[^\d]*)\s*([0-9,]+)\s*(?:米|m)`)
	showRoutePattern    = regexp.MustCompile(`showroutep2p\('([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'`)
	addStopPattern      = regexp.MustCompile(`(?s)addstoponmap\((.*?)\)`)
	stopSequencePattern = regexp.MustCompile(`^\d+\s*-\s*`)
)
