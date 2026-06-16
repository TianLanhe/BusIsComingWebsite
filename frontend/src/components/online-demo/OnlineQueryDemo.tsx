import { ArrowLeftRight, Info, Loader2, MapPin, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { onlineQueryDemo } from "../../content/onlineQueryDemo";
import type { Locale } from "../../content/types";
import { uiCopy } from "../../content/uiCopy";
import {
  createRouteRequestId,
  queryEtas,
  queryPlaces,
  queryRoutes,
  RouteQueryClientError,
} from "../../services/routeQueryClient";
import type { ApiError, EtaStatus, PlaceCandidate, RouteOption } from "../../services/routeQueryTypes";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./OnlineQueryDemo.module.css";

type FieldName = "origin" | "destination";

interface PlaceFieldState {
  input: string;
  selected: PlaceCandidate | null;
  candidates: PlaceCandidate[];
  loading: boolean;
  touched: boolean;
  error: string | null;
}

type QueryStatus = "idle" | "loading" | "success" | "empty" | "error";

const emptyField = (): PlaceFieldState => ({
  input: "",
  selected: null,
  candidates: [],
  loading: false,
  touched: false,
  error: null,
});

export function OnlineQueryDemoSection() {
  const { locale, text } = useI18n();
  const [origin, setOrigin] = useState<PlaceFieldState>(() => emptyField());
  const [destination, setDestination] = useState<PlaceFieldState>(() => emptyField());
  const [queryStatus, setQueryStatus] = useState<QueryStatus>("idle");
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [etas, setEtas] = useState<Record<string, EtaStatus>>({});
  const [routeMessage, setRouteMessage] = useState<string | null>(null);
  const [retainedMessage, setRetainedMessage] = useState<string | null>(null);
  const [lastResultKey, setLastResultKey] = useState<string | null>(null);

  // 用递增序号丢弃旧的地点、路线和 ETA 响应，避免快速输入或语言切换覆盖最新状态。
  const placeRequestSeq = useRef<Record<FieldName, number>>({ origin: 0, destination: 0 });
  const routeRequestSeq = useRef(0);
  const etaRequestSeq = useRef(0);
  const previousLocale = useRef<Locale>(locale);

  usePlaceSearch("origin", origin, setOrigin, locale);
  usePlaceSearch("destination", destination, setDestination, locale);

  useEffect(() => {
    if (previousLocale.current === locale) {
      return;
    }
    previousLocale.current = locale;
    if (origin.selected && destination.selected && routes.length > 0) {
      void runRouteSearch({ reason: "language", preserveOnFailure: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  function usePlaceSearch(
    field: FieldName,
    fieldState: PlaceFieldState,
    setField: Dispatch<SetStateAction<PlaceFieldState>>,
    language: Locale,
  ) {
    useEffect(() => {
      const query = fieldState.input.trim();
      if (!query) {
        setField((current) => ({ ...current, candidates: [], loading: false, error: null }));
        return;
      }
      if (fieldState.selected && fieldState.selected.name === fieldState.input) {
        return;
      }
      const seq = placeRequestSeq.current[field] + 1;
      placeRequestSeq.current[field] = seq;
      const timeout = window.setTimeout(() => {
        setField((current) => ({ ...current, loading: true, error: null }));
        const requestId = createRouteRequestId(`places-${field}`);
        queryPlaces({ requestId, language, query, limit: 100 })
          .then((data) => {
            if (placeRequestSeq.current[field] !== seq) {
              return;
            }
            setField((current) => ({ ...current, candidates: data.places, loading: false, error: null }));
          })
          .catch((error) => {
            if (placeRequestSeq.current[field] !== seq) {
              return;
            }
            if (isAbortError(error)) {
              return;
            }
            setField((current) => ({
              ...current,
              candidates: [],
              loading: false,
              error: text(uiCopy.placeSearchFailed),
            }));
          });
      }, 300);
      return () => window.clearTimeout(timeout);
    }, [field, fieldState.input, fieldState.selected, language, setField, text]);
  }

  function updateInput(field: FieldName, value: string) {
    const setField = field === "origin" ? setOrigin : setDestination;
    setField((current) => ({
      ...current,
      input: value,
      selected: current.selected?.name === value ? current.selected : null,
      touched: true,
      error: null,
    }));
    clearRouteResultsAfterPlaceChange();
  }

  function selectPlace(field: FieldName, place: PlaceCandidate) {
    const setField = field === "origin" ? setOrigin : setDestination;
    setField({
      input: place.name,
      selected: place,
      candidates: [],
      loading: false,
      touched: true,
      error: null,
    });
    clearRouteResultsAfterPlaceChange();
  }

  function swapPlaces() {
    setOrigin(destination);
    setDestination(origin);
    setRoutes([]);
    setEtas({});
    setLastResultKey(null);
    setRetainedMessage(null);
    setRouteMessage(null);
    setQueryStatus("idle");
  }

  function clearRouteResultsAfterPlaceChange() {
    if (routes.length > 0 || lastResultKey || queryStatus !== "idle") {
      setRoutes([]);
      setEtas({});
      setLastResultKey(null);
      setRetainedMessage(null);
      setRouteMessage(null);
      setQueryStatus("idle");
    }
  }

  async function runRouteSearch(options: { reason: "manual" | "language"; preserveOnFailure: boolean }) {
    const validation = validateFields();
    if (!validation.ok) {
      return;
    }

    const originPlace = validation.origin;
    const destinationPlace = validation.destination;
    const requestKey = selectedRouteKey(originPlace, destinationPlace);
    const preserveExisting = options.preserveOnFailure && requestKey === lastResultKey && routes.length > 0;
    const seq = routeRequestSeq.current + 1;
    routeRequestSeq.current = seq;
    const requestId = createRouteRequestId("routes");

    setQueryStatus("loading");
    setRouteMessage(null);
    setRetainedMessage(null);
    if (!preserveExisting) {
      setRoutes([]);
      setEtas({});
    }

    try {
      const data = await queryRoutes({
        requestId,
        language: locale,
        originPlaceToken: originPlace.placeToken,
        destinationPlaceToken: destinationPlace.placeToken,
      });
      if (routeRequestSeq.current !== seq) {
        return;
      }
      setRoutes(data.routes);
      setLastResultKey(requestKey);
      setEtas(initialEtaState(data.routes));
      setQueryStatus(data.routes.length > 0 ? "success" : "empty");
      setRouteMessage(null);
      void runEtaSearch(data.routes, locale);
    } catch (error) {
      if (routeRequestSeq.current !== seq || isAbortError(error)) {
        return;
      }
      const message = routeErrorMessage(error, text);
      if (preserveExisting) {
        setQueryStatus("success");
        setRouteMessage(message);
        setRetainedMessage(
          options.reason === "language"
            ? `${text(uiCopy.languageRefreshFailed)} ${text(uiCopy.stillShowingPreviousResults)}`
            : text(uiCopy.stillShowingPreviousResults),
        );
        return;
      }
      setRoutes([]);
      setEtas({});
      setQueryStatus("error");
      setRouteMessage(message);
    }
  }

  function validateFields():
    | { ok: true; origin: PlaceCandidate; destination: PlaceCandidate }
    | { ok: false } {
    let valid = true;
    const originSelected = origin.selected;
    const destinationSelected = destination.selected;
    if (!originSelected || origin.input !== originSelected.name) {
      setOrigin((current) => ({ ...current, touched: true, error: text(uiCopy.selectCandidateRequired) }));
      valid = false;
    }
    if (!destinationSelected || destination.input !== destinationSelected.name) {
      setDestination((current) => ({ ...current, touched: true, error: text(uiCopy.selectCandidateRequired) }));
      valid = false;
    }
    if (!valid || !originSelected || !destinationSelected) {
      return { ok: false };
    }
    if (originSelected.name === destinationSelected.name || originSelected.placeToken === destinationSelected.placeToken) {
      setOrigin((current) => ({ ...current, error: text(uiCopy.samePlaceError) }));
      setDestination((current) => ({ ...current, error: text(uiCopy.samePlaceError) }));
      return { ok: false };
    }
    return { ok: true, origin: originSelected, destination: destinationSelected };
  }

  async function runEtaSearch(routeOptions: RouteOption[], language: Locale) {
    const etaTokens = routeOptions.map((route) => route.etaToken).filter((token): token is string => Boolean(token));
    if (etaTokens.length === 0) {
      setEtas(markEtaUnavailable(routeOptions));
      return;
    }
    const seq = etaRequestSeq.current + 1;
    etaRequestSeq.current = seq;
    const requestId = createRouteRequestId("etas");
    try {
      const data = await queryEtas({ requestId, language, etaTokens });
      if (etaRequestSeq.current !== seq) {
        return;
      }
      setEtas((current) => {
        const next = { ...current };
        for (const eta of data.etas) {
          next[eta.etaToken] = eta;
        }
        return next;
      });
    } catch {
      if (etaRequestSeq.current !== seq) {
        return;
      }
      setEtas(markEtaUnavailable(routeOptions));
    }
  }

  return (
    <section id="online-query" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.heading}>
          <h2>{text(onlineQueryDemo.title)}</h2>
          <p>{text(onlineQueryDemo.description)}</p>
          <p>{text(onlineQueryDemo.limitationNotice)}</p>
        </div>

        <div className={styles.demo} data-testid="online-query-demo">
          <form
            className={styles.queryBar}
            onSubmit={(event) => {
              event.preventDefault();
              void runRouteSearch({ reason: "manual", preserveOnFailure: true });
            }}
          >
            <PlaceInput
              field="origin"
              label={text(uiCopy.originLabel)}
              state={origin}
              placeholder={text(uiCopy.placeInputPlaceholder)}
              loadingText={text(uiCopy.placeSearchLoading)}
              emptyText={text(uiCopy.placeSearchEmpty)}
              onInput={updateInput}
              onSelect={selectPlace}
            />
            <button className={styles.swapButton} type="button" onClick={swapPlaces} aria-label={text(uiCopy.swapPlaces)}>
              <ArrowLeftRight aria-hidden="true" size={20} />
            </button>
            <PlaceInput
              field="destination"
              label={text(uiCopy.destinationLabel)}
              state={destination}
              placeholder={text(uiCopy.placeInputPlaceholder)}
              loadingText={text(uiCopy.placeSearchLoading)}
              emptyText={text(uiCopy.placeSearchEmpty)}
              onInput={updateInput}
              onSelect={selectPlace}
            />
            <button className={styles.queryButton} type="submit" disabled={queryStatus === "loading"}>
              {queryStatus === "loading" ? (
                <Loader2 aria-hidden="true" className={styles.loadingIcon} size={18} />
              ) : (
                <Search aria-hidden="true" size={18} />
              )}
              {queryStatus === "loading" ? text(uiCopy.searchingButton) : text(uiCopy.queryButton)}
            </button>
          </form>

          <div className={styles.resultPanel} data-testid="route-result-panel">
            {renderResultPanel({
              status: queryStatus,
              routes,
              etas,
              routeMessage,
              retainedMessage,
              locale,
              text,
            })}
          </div>

          <p className={styles.notice}>
            <Info aria-hidden="true" size={18} />
            <span>{text(onlineQueryDemo.scopeNotice)}</span>
          </p>
        </div>
      </div>
    </section>
  );
}

function PlaceInput({
  field,
  label,
  state,
  placeholder,
  loadingText,
  emptyText,
  onInput,
  onSelect,
}: {
  field: FieldName;
  label: string;
  state: PlaceFieldState;
  placeholder: string;
  loadingText: string;
  emptyText: string;
  onInput: (field: FieldName, value: string) => void;
  onSelect: (field: FieldName, place: PlaceCandidate) => void;
}) {
  const hasDropdown = state.input.trim().length > 0 && (!state.selected || state.selected.name !== state.input);
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input
        aria-invalid={Boolean(state.error)}
        autoComplete="off"
        value={state.input}
        placeholder={placeholder}
        onChange={(event) => onInput(field, event.target.value)}
      />
      {state.error ? <em className={styles.fieldError}>{state.error}</em> : null}
      {hasDropdown ? (
        <div className={styles.dropdown} data-testid={`${field}-place-dropdown`}>
          {state.loading ? <div className={styles.dropdownState}>{loadingText}</div> : null}
          {!state.loading && state.error ? <div className={styles.dropdownState}>{state.error}</div> : null}
          {!state.loading && !state.error && state.candidates.length === 0 ? <div className={styles.dropdownState}>{emptyText}</div> : null}
          {!state.loading && !state.error
            ? state.candidates.map((place) => (
                <button key={place.placeToken} type="button" onClick={() => onSelect(field, place)}>
                  <MapPin aria-hidden="true" size={16} />
                  <span>{place.name}</span>
                </button>
              ))
            : null}
        </div>
      ) : null}
    </label>
  );
}

function renderResultPanel({
  status,
  routes,
  etas,
  routeMessage,
  retainedMessage,
  locale,
  text,
}: {
  status: QueryStatus;
  routes: RouteOption[];
  etas: Record<string, EtaStatus>;
  routeMessage: string | null;
  retainedMessage: string | null;
  locale: Locale;
  text: ReturnType<typeof useI18n>["text"];
}) {
  if (status === "loading" && routes.length === 0) {
    return (
      <div className={styles.emptyState} data-testid="route-loading">
        <Loader2 aria-hidden="true" size={24} />
        <strong>{text(uiCopy.queryLoadingTitle)}</strong>
        <span>{text(uiCopy.queryLoadingDescription)}</span>
      </div>
    );
  }

  if (status === "idle") {
    return (
      <div className={styles.emptyState}>
        <strong>{text(onlineQueryDemo.initialEmptyTitle)}</strong>
        <span>{text(onlineQueryDemo.initialEmptyDescription)}</span>
      </div>
    );
  }

  if (status === "empty") {
    return (
      <div className={styles.emptyState}>
        <strong>{text(onlineQueryDemo.noRoutesTitle)}</strong>
        <span>{text(onlineQueryDemo.noRoutesDescription)}</span>
      </div>
    );
  }

  if (status === "error" && routes.length === 0) {
    return (
      <div className={styles.errorState}>
        <strong>{routeMessage ?? text(uiCopy.routeQueryFailed)}</strong>
      </div>
    );
  }

  return (
    <>
      <div className={styles.resultHeader}>
        <strong>{text(uiCopy.routeResultsTitle)}</strong>
        <span>
          {routes.length} {text(uiCopy.routeResultsCount)}
        </span>
      </div>
      {retainedMessage ? <div className={styles.retainedState}>{retainedMessage}</div> : null}
      {routeMessage ? <div className={styles.inlineError}>{routeMessage}</div> : null}
      <div className={styles.results}>
        {routes.map((route) => (
          <RouteCard key={route.routeId} route={route} eta={route.etaToken ? etas[route.etaToken] : undefined} locale={locale} text={text} />
        ))}
      </div>
    </>
  );
}

function RouteCard({
  route,
  eta,
  locale,
  text,
}: {
  route: RouteOption;
  eta?: EtaStatus;
  locale: Locale;
  text: ReturnType<typeof useI18n>["text"];
}) {
  return (
    <article className={styles.routeRow}>
      <div className={styles.routeMain}>
        <span className={styles.routeNumber}>{route.routeNumbers.length > 0 ? route.routeNumbers.join(" -> ") : route.routeLabel}</span>
        <em>{formatEta(route, eta, text)}</em>
      </div>
      <div className={styles.stopLine}>
        <span>{route.boardingStop.name || text(uiCopy.boardingStopLabel)}</span>
        <span aria-hidden="true">→</span>
        <span>{route.alightingStop.name || text(uiCopy.alightingStopLabel)}</span>
      </div>
      <dl>
        <div>
          <dt>{text(uiCopy.fareLabel)}</dt>
          <dd>{formatFare(route.fare.amount, locale)}</dd>
        </div>
        <div>
          <dt>{text(uiCopy.durationLabel)}</dt>
          <dd>{formatMinutes(route.durationMinutes, locale, text)}</dd>
        </div>
        <div>
          <dt>{text(uiCopy.walkingLabel)}</dt>
          <dd>{formatMeters(route.walkingDistanceMeters, locale)}</dd>
        </div>
      </dl>
    </article>
  );
}

function selectedRouteKey(origin: PlaceCandidate | null, destination: PlaceCandidate | null): string | null {
  if (!origin || !destination) {
    return null;
  }
  return `${origin.placeToken}|${destination.placeToken}`;
}

function initialEtaState(routes: RouteOption[]): Record<string, EtaStatus> {
  const now = new Date().toISOString();
  const state: Record<string, EtaStatus> = {};
  for (const route of routes) {
    if (route.etaToken) {
      state[route.etaToken] = { etaToken: route.etaToken, status: "waiting", updatedAt: now };
    }
  }
  return state;
}

function markEtaUnavailable(routes: RouteOption[]): Record<string, EtaStatus> {
  const now = new Date().toISOString();
  const state: Record<string, EtaStatus> = {};
  for (const route of routes) {
    if (route.etaToken) {
      state[route.etaToken] = { etaToken: route.etaToken, status: "unavailable", updatedAt: now };
    }
  }
  return state;
}

function formatEta(route: RouteOption, eta: EtaStatus | undefined, text: ReturnType<typeof useI18n>["text"]): string {
  if (!route.etaToken) {
    return text(uiCopy.etaUnavailable);
  }
  if (eta?.waitMinutes != null) {
    return `${text(uiCopy.waitLabel)} ${eta.waitMinutes} ${text(uiCopy.waitMinutesSuffix)}`;
  }
  if (!eta || eta.status === "waiting") {
    return text(uiCopy.etaLoading);
  }
  if (eta.status === "arriving") {
    return text(uiCopy.etaArriving);
  }
  if (eta.status === "unavailable") {
    return text(uiCopy.etaUnavailable);
  }
  return text(uiCopy.etaUnavailable);
}

function formatFare(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "HKD", currencyDisplay: "narrowSymbol" }).format(amount);
}

function formatMinutes(minutes: number, locale: Locale, text: ReturnType<typeof useI18n>["text"]): string {
  if (locale === "en") {
    return `${minutes} min`;
  }
  return `${minutes} ${text(uiCopy.waitMinutesSuffix)}`;
}

function formatMeters(meters: number, locale: Locale): string {
  return locale === "en" ? `${meters.toLocaleString("en")} m` : `${meters.toLocaleString(locale)} 米`;
}

function routeErrorMessage(error: unknown, text: ReturnType<typeof useI18n>["text"]): string {
  const apiError = error instanceof RouteQueryClientError ? error.apiError : undefined;
  return errorMessageForCode(apiError, text);
}

function errorMessageForCode(apiError: ApiError | undefined, text: ReturnType<typeof useI18n>["text"]): string {
  switch (apiError?.code) {
    case "RATE_LIMITED":
      return text(uiCopy.routeQueryRateLimited);
    case "PLACE_TOKEN_EXPIRED":
    case "ETA_TOKEN_EXPIRED":
      return text(uiCopy.routeQueryTokenExpired);
    case "PLACE_TOKEN_INVALID":
    case "ETA_TOKEN_INVALID":
      return text(uiCopy.routeQueryInvalidToken);
    case "SAME_PLACE":
      return text(uiCopy.samePlaceError);
    default:
      return text(uiCopy.routeQueryFailed);
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
