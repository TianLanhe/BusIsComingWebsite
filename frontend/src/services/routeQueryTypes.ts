import type { Locale } from "../content/types";

export type QueryErrorCode =
  | "INVALID_ARGUMENT"
  | "SAME_PLACE"
  | "PLACE_TOKEN_INVALID"
  | "PLACE_TOKEN_EXPIRED"
  | "ETA_TOKEN_INVALID"
  | "ETA_TOKEN_EXPIRED"
  | "RATE_LIMITED"
  | "EXTERNAL_SERVICE_UNAVAILABLE"
  | "EXTERNAL_TIMEOUT"
  | "PARSE_FAILED"
  | "INTERNAL_ERROR";

export interface ApiError {
  code: QueryErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiEnvelope<TData> {
  requestId: string;
  data: TData | null;
  error: ApiError | null;
}

export interface PlaceCandidate {
  placeToken: string;
  name: string;
  displayHint?: string;
  provider: "citybus";
  expiresAt: string;
}

export interface RouteOption {
  routeId: string;
  operator: "citybus";
  routeNumbers: string[];
  routeLabel: string;
  boardingStop: StopSummary;
  alightingStop: StopSummary;
  fare: MoneyAmount;
  durationMinutes: number;
  walkingDistanceMeters: number;
  sortIndex: number;
  etaToken?: string;
  etaExpiresAt?: string;
}

export interface StopSummary {
  name: string;
  stopId?: string;
}

export interface MoneyAmount {
  currency: "HKD";
  amount: number;
}

export type EtaStatusValue = "waiting" | "arriving" | "unavailable";

export interface EtaStatus {
  etaToken: string;
  status: EtaStatusValue;
  waitMinutes?: number;
  updatedAt: string;
}

export interface QueryPlacesData {
  places: PlaceCandidate[];
  expiresAt: string;
}

export interface QueryRoutesData {
  queriedAt: string;
  resultLimit: 20;
  routes: RouteOption[];
}

export interface QueryEtasData {
  queriedAt: string;
  etas: EtaStatus[];
}

export interface QueryPlacesRequest {
  requestId: string;
  language: Locale;
  query: string;
  limit: number;
}

export interface QueryRoutesRequest {
  requestId: string;
  language: Locale;
  originPlaceToken: string;
  destinationPlaceToken: string;
}

export interface QueryEtasRequest {
  requestId: string;
  language: Locale;
  etaTokens: string[];
}
