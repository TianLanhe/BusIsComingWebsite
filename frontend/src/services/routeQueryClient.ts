import type {
  ApiEnvelope,
  ApiError,
  QueryEtasData,
  QueryEtasRequest,
  QueryPlacesData,
  QueryPlacesRequest,
  QueryRoutesData,
  QueryRoutesRequest,
} from "./routeQueryTypes";

type RouteQueryPath = "/api/routes/query_places" | "/api/routes/query_routes" | "/api/routes/query_etas";

export class RouteQueryClientError extends Error {
  readonly apiError: ApiError;
  readonly requestId: string;
  readonly status: number;

  constructor(apiError: ApiError, requestId: string, status: number) {
    super(apiError.message);
    this.name = "RouteQueryClientError";
    this.apiError = apiError;
    this.requestId = requestId;
    this.status = status;
  }
}

export function createRouteRequestId(prefix = "route-query"): string {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function queryPlaces(request: QueryPlacesRequest, signal?: AbortSignal): Promise<QueryPlacesData> {
  return postEnvelope<QueryPlacesRequest, QueryPlacesData>("/api/routes/query_places", request, signal);
}

export async function queryRoutes(request: QueryRoutesRequest, signal?: AbortSignal): Promise<QueryRoutesData> {
  return postEnvelope<QueryRoutesRequest, QueryRoutesData>("/api/routes/query_routes", request, signal);
}

export async function queryEtas(request: QueryEtasRequest, signal?: AbortSignal): Promise<QueryEtasData> {
  return postEnvelope<QueryEtasRequest, QueryEtasData>("/api/routes/query_etas", request, signal);
}

async function postEnvelope<TRequest extends { requestId: string }, TData>(
  path: RouteQueryPath,
  request: TRequest,
  signal?: AbortSignal,
): Promise<TData> {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(request),
    signal,
  });
  const envelope = (await response.json()) as ApiEnvelope<TData>;
  const requestId = envelope.requestId || request.requestId;
  if (!response.ok || envelope.error) {
    throw new RouteQueryClientError(
      envelope.error ?? { code: "INTERNAL_ERROR", message: "route query failed" },
      requestId,
      response.status,
    );
  }
  if (!envelope.data) {
    throw new RouteQueryClientError({ code: "INTERNAL_ERROR", message: "route query response missing data" }, requestId, response.status);
  }
  return envelope.data;
}
