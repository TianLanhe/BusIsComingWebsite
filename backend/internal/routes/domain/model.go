package domain

import (
	"fmt"
	"math"
	"sort"
	"time"
)

type Language string

const (
	LanguageZhHant Language = "zh-Hant"
	LanguageZhHans Language = "zh-Hans"
	LanguageEn     Language = "en"
)

func (l Language) Valid() bool {
	return l == LanguageZhHant || l == LanguageZhHans || l == LanguageEn
}

type ErrorCode string

const (
	ErrInvalidArgument     ErrorCode = "INVALID_ARGUMENT"
	ErrSamePlace           ErrorCode = "SAME_PLACE"
	ErrPlaceTokenInvalid   ErrorCode = "PLACE_TOKEN_INVALID"
	ErrPlaceTokenExpired   ErrorCode = "PLACE_TOKEN_EXPIRED"
	ErrEtaTokenInvalid     ErrorCode = "ETA_TOKEN_INVALID"
	ErrEtaTokenExpired     ErrorCode = "ETA_TOKEN_EXPIRED"
	ErrRateLimited         ErrorCode = "RATE_LIMITED"
	ErrExternalUnavailable ErrorCode = "EXTERNAL_SERVICE_UNAVAILABLE"
	ErrExternalTimeout     ErrorCode = "EXTERNAL_TIMEOUT"
	ErrParseFailed         ErrorCode = "PARSE_FAILED"
	ErrInternal            ErrorCode = "INTERNAL_ERROR"
)

type QueryError struct {
	Code    ErrorCode      `json:"code"`
	Message string         `json:"message"`
	Details map[string]any `json:"details,omitempty"`
}

func NewQueryError(code ErrorCode, message string) *QueryError {
	return &QueryError{Code: code, Message: message}
}

func (e *QueryError) Error() string {
	if e == nil {
		return ""
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

type TokenSubject string

const (
	TokenSubjectPlace TokenSubject = "place"
	TokenSubjectEta   TokenSubject = "eta"
)

type PlaceCandidate struct {
	PlaceToken  string    `json:"placeToken"`
	Name        string    `json:"name"`
	DisplayHint string    `json:"displayHint,omitempty"`
	Provider    string    `json:"provider"`
	ExpiresAt   time.Time `json:"expiresAt"`
}

type Place struct {
	Name        string
	DisplayHint string
	Lat         float64
	Lon         float64
	Provider    string
}

type PlaceTokenPayload struct {
	Subject   TokenSubject `json:"subject"`
	Name      string       `json:"name"`
	Lat       float64      `json:"lat"`
	Lon       float64      `json:"lon"`
	Language  Language     `json:"language"`
	Provider  string       `json:"provider"`
	IssuedAt  time.Time    `json:"issuedAt"`
	ExpiresAt time.Time    `json:"expiresAt"`
}

func (p PlaceTokenPayload) SamePlace(other PlaceTokenPayload) bool {
	const epsilon = 0.000001
	return math.Abs(p.Lat-other.Lat) < epsilon && math.Abs(p.Lon-other.Lon) < epsilon
}

type StopSummary struct {
	Name   string `json:"name"`
	StopID string `json:"stopId,omitempty"`
}

type MoneyAmount struct {
	Currency string  `json:"currency"`
	Amount   float64 `json:"amount"`
}

type RouteOption struct {
	RouteID               string           `json:"routeId"`
	Operator              string           `json:"operator"`
	RouteNumbers          []string         `json:"routeNumbers"`
	RouteLabel            string           `json:"routeLabel"`
	BoardingStop          StopSummary      `json:"boardingStop"`
	AlightingStop         StopSummary      `json:"alightingStop"`
	Fare                  MoneyAmount      `json:"fare"`
	DurationMinutes       int              `json:"durationMinutes"`
	WalkingDistanceMeters int              `json:"walkingDistanceMeters"`
	SortIndex             int              `json:"sortIndex"`
	EtaToken              string           `json:"etaToken,omitempty"`
	EtaExpiresAt          *time.Time       `json:"etaExpiresAt,omitempty"`
	EtaPayload            *EtaTokenPayload `json:"-"`
	RawInfo               string           `json:"-"`
	GeneralInfo           string           `json:"-"`
	ListID                string           `json:"-"`
	Legs                  []P2PLeg         `json:"-"`
}

func SortRouteOptions(routes []RouteOption) {
	sort.SliceStable(routes, func(i, j int) bool {
		if routes[i].DurationMinutes == routes[j].DurationMinutes {
			return routes[i].SortIndex < routes[j].SortIndex
		}
		return routes[i].DurationMinutes < routes[j].DurationMinutes
	})
	for index := range routes {
		routes[index].SortIndex = index
	}
}

type P2PLeg struct {
	Company      string `json:"company"`
	RouteVariant string `json:"routeVariant"`
	Route        string `json:"route"`
	BoardingSeq  int    `json:"boardingSeq"`
	AlightingSeq int    `json:"alightingSeq"`
	Bound        string `json:"bound"`
	Direction    string `json:"direction,omitempty"`
}

type P2PStop struct {
	LegIndex     int
	Company      string
	RouteVariant string
	PublicRoute  string
	Bound        string
	Sequence     int
	StopID       string
	RawName      string
	DisplayName  string
	Lat          float64
	Lon          float64
	MarkerType   string
}

type EtaTokenPayload struct {
	Subject      TokenSubject `json:"subject"`
	RouteID      string       `json:"routeId"`
	RouteNumber  string       `json:"routeNumber"`
	StopID       string       `json:"stopId"`
	Direction    string       `json:"direction,omitempty"`
	ServiceType  string       `json:"serviceType,omitempty"`
	Language     Language     `json:"language"`
	Company      string       `json:"company,omitempty"`
	RouteVariant string       `json:"routeVariant,omitempty"`
	BoardingSeq  int          `json:"boardingSeq,omitempty"`
	AlightingSeq int          `json:"alightingSeq,omitempty"`
	RawInfo      string       `json:"rawInfo,omitempty"`
	IssuedAt     time.Time    `json:"issuedAt"`
	ExpiresAt    time.Time    `json:"expiresAt"`
}

type EtaState string

const (
	EtaWaiting     EtaState = "waiting"
	EtaArriving    EtaState = "arriving"
	EtaUnavailable EtaState = "unavailable"
)

type EtaStatus struct {
	EtaToken    string    `json:"etaToken"`
	Status      EtaState  `json:"status"`
	WaitMinutes *int      `json:"waitMinutes,omitempty"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

func UnavailableEtaStatus(token string, updatedAt time.Time) EtaStatus {
	return EtaStatus{EtaToken: token, Status: EtaUnavailable, UpdatedAt: updatedAt}
}

type QueryLogEvent struct {
	RequestID       string         `json:"requestId,omitempty"`
	OperationID     string         `json:"operationId,omitempty"`
	Stage           string         `json:"stage,omitempty"`
	Language        Language       `json:"language,omitempty"`
	OriginName      string         `json:"originName,omitempty"`
	OriginLat       *float64       `json:"originLat,omitempty"`
	OriginLon       *float64       `json:"originLon,omitempty"`
	DestinationName string         `json:"destinationName,omitempty"`
	DestinationLat  *float64       `json:"destinationLat,omitempty"`
	DestinationLon  *float64       `json:"destinationLon,omitempty"`
	DurationMs      int64          `json:"durationMs,omitempty"`
	ResultCount     *int           `json:"resultCount,omitempty"`
	CacheHit        *bool          `json:"cacheHit,omitempty"`
	ErrorCode       string         `json:"errorCode,omitempty"`
	Fields          map[string]any `json:"fields,omitempty"`
}
