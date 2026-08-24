import { ArrowLeftRight, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { homepageContent } from "../../content/homepageContent";
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
import { WindField } from "../homepage/WindField";
import { useI18n } from "../i18n/I18nProvider";
import { PlaceCombobox } from "./PlaceCombobox";
import type { PlaceFieldName, PlaceFieldState } from "./PlaceCombobox";
import { RouteResultCard } from "./RouteResultCard";
import styles from "./OnlineQueryDemo.module.css";

type QueryStatus = "idle" | "loading" | "success" | "empty" | "error";

const emptyField = (): PlaceFieldState => ({
  input: "", selected: null, candidates: [], loading: false, touched: false, error: null,
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
  const placeRequestSeq = useRef<Record<PlaceFieldName, number>>({ origin: 0, destination: 0 });
  const routeRequestSeq = useRef(0);
  const etaRequestSeq = useRef(0);
  const previousLocale = useRef<Locale>(locale);

  usePlaceSearch("origin", origin, setOrigin, locale, text, placeRequestSeq);
  usePlaceSearch("destination", destination, setDestination, locale, text, placeRequestSeq);

  useEffect(() => {
    if (previousLocale.current === locale) return;
    previousLocale.current = locale;
    if (origin.selected && destination.selected && routes.length > 0) {
      void runRouteSearch({ reason: "language", preserveOnFailure: true });
    }
    // locale 切换必须保留选择和现有结果；重查失败只降级成 retained。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  function updateInput(field: PlaceFieldName, value: string) {
    const setField = field === "origin" ? setOrigin : setDestination;
    setField((current) => ({
      ...current,
      input: value,
      selected: current.selected?.name === value ? current.selected : null,
      touched: true,
      error: null,
    }));
    setRouteMessage(null);
    setRetainedMessage(null);
  }

  function selectPlace(field: PlaceFieldName, place: PlaceCandidate) {
    const setField = field === "origin" ? setOrigin : setDestination;
    setField({ input: place.name, selected: place, candidates: [], loading: false, touched: true, error: null });
    setRouteMessage(null);
    setRetainedMessage(null);
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

  function validateFields():
    | { ok: true; origin: PlaceCandidate; destination: PlaceCandidate }
    | { ok: false } {
    const originPlace = origin.selected;
    const destinationPlace = destination.selected;
    let valid = true;
    if (!originPlace || origin.input !== originPlace.name) {
      setOrigin((current) => ({ ...current, touched: true, error: text(uiCopy.selectCandidateRequired) }));
      valid = false;
    }
    if (!destinationPlace || destination.input !== destinationPlace.name) {
      setDestination((current) => ({ ...current, touched: true, error: text(uiCopy.selectCandidateRequired) }));
      valid = false;
    }
    if (!valid || !originPlace || !destinationPlace) return { ok: false };
    if (originPlace.placeToken === destinationPlace.placeToken || originPlace.name === destinationPlace.name) {
      setOrigin((current) => ({ ...current, error: text(uiCopy.samePlaceError) }));
      setDestination((current) => ({ ...current, error: text(uiCopy.samePlaceError) }));
      return { ok: false };
    }
    return { ok: true, origin: originPlace, destination: destinationPlace };
  }

  async function runRouteSearch(options: { reason: "manual" | "language"; preserveOnFailure: boolean }) {
    const validation = validateFields();
    if (!validation.ok) return;
    const requestKey = selectedRouteKey(validation.origin, validation.destination);
    const preserveExisting = options.preserveOnFailure && requestKey === lastResultKey && routes.length > 0;
    const seq = ++routeRequestSeq.current;
    setQueryStatus("loading");
    setRouteMessage(null);
    setRetainedMessage(null);
    if (!preserveExisting) {
      setRoutes([]);
      setEtas({});
    }
    try {
      const data = await queryRoutes({
        requestId: createRouteRequestId("routes"),
        language: locale,
        originPlaceToken: validation.origin.placeToken,
        destinationPlaceToken: validation.destination.placeToken,
      });
      if (routeRequestSeq.current !== seq) return;
      setRoutes(data.routes);
      setLastResultKey(requestKey);
      setEtas(initialEtaState(data.routes));
      setQueryStatus(data.routes.length > 0 ? "success" : "empty");
      void runEtaSearch(data.routes, locale);
    } catch (error) {
      if (routeRequestSeq.current !== seq || isAbortError(error)) return;
      const message = routeErrorMessage(error, text);
      if (preserveExisting) {
        setQueryStatus("success");
        setRouteMessage(message);
        setRetainedMessage(text(homepageContent.routeTrial.retainedState));
        return;
      }
      setRoutes([]);
      setEtas({});
      setQueryStatus("error");
      setRouteMessage(message);
    }
  }

  async function runEtaSearch(routeOptions: RouteOption[], language: Locale) {
    const tokens = routeOptions.map((route) => route.etaToken).filter((token): token is string => Boolean(token));
    if (tokens.length === 0) {
      setEtas(markEtaUnavailable(routeOptions));
      return;
    }
    const seq = ++etaRequestSeq.current;
    try {
      const data = await queryEtas({ requestId: createRouteRequestId("etas"), language, etaTokens: tokens });
      if (etaRequestSeq.current !== seq) return;
      setEtas((current) => {
        const next = { ...current };
        for (const eta of data.etas) next[eta.etaToken] = eta;
        return next;
      });
    } catch {
      if (etaRequestSeq.current === seq) setEtas(markEtaUnavailable(routeOptions));
    }
  }

  const statusSummary = queryStatus === "loading"
    ? text(uiCopy.queryLoadingTitle)
    : queryStatus === "success"
      ? routes.length + " " + text(uiCopy.routeResultsCount)
      : queryStatus === "error"
        ? text(homepageContent.routeTrial.errorState.title)
        : "";

  return (
    <section id="route-trial" className={styles.section}>
      <WindField intensity="route" />
      <div className={styles.inner}>
        <header className={styles.heading}>
          <p className={styles.eyebrow}>02 / ROUTE TRIAL</p>
          <h2>{text(homepageContent.routeTrial.title)}</h2>
          <p>{text(homepageContent.routeTrial.description)}</p>
        </header>
        <div className={styles.workbench} data-testid="online-query-demo">
          <form
            className={styles.queryPanel}
            onSubmit={(event) => { event.preventDefault(); void runRouteSearch({ reason: "manual", preserveOnFailure: true }); }}
          >
            <p className={styles.queryIndex}>01 / SET YOUR JOURNEY</p>
            <h3>{text({ "zh-Hant": "你想去哪裡？", "zh-Hans": "你想去哪里？", en: "Where are you going?" })}</h3>
            <div className={styles.placeControls} data-testid="journey-place-controls">
              <div className={styles.inputStack} data-testid="journey-input-stack">
                <PlaceCombobox
                  emptyText={text(uiCopy.placeSearchEmpty)}
                  field="origin"
                  label={text(homepageContent.routeTrial.originLabel)}
                  loadingText={text(uiCopy.placeSearchLoading)}
                  onInput={updateInput}
                  onSelect={selectPlace}
                  placeholder={text(uiCopy.placeInputPlaceholder)}
                  state={origin}
                />
                <PlaceCombobox
                  emptyText={text(uiCopy.placeSearchEmpty)}
                  field="destination"
                  label={text(homepageContent.routeTrial.destinationLabel)}
                  loadingText={text(uiCopy.placeSearchLoading)}
                  onInput={updateInput}
                  onSelect={selectPlace}
                  placeholder={text(uiCopy.placeInputPlaceholder)}
                  state={destination}
                />
              </div>
              <button className={styles.swapButton} type="button" onClick={swapPlaces} aria-label={text(uiCopy.swapPlaces)}>
                <ArrowLeftRight aria-hidden="true" size={18} />
              </button>
            </div>
            <button className={styles.queryButton} type="submit">
              {queryStatus === "loading" ? <Loader2 aria-hidden="true" size={18} /> : null}
              {queryStatus === "loading" ? text(uiCopy.searchingButton) : text(homepageContent.routeTrial.queryAction)}
            </button>
            <small>{text(homepageContent.routeTrial.scopeNotice)}</small>
          </form>

          <div className={styles.resultPanel} data-testid="route-result-panel">
            <RouteResultPanel
              etas={etas}
              onRetry={() => void runRouteSearch({ reason: "manual", preserveOnFailure: true })}
              retainedMessage={retainedMessage}
              routeMessage={routeMessage}
              routes={routes}
              status={queryStatus}
            />
          </div>
          <p className={styles.status} role="status" aria-live="polite">{statusSummary}</p>
        </div>
      </div>
    </section>
  );
}

function RouteResultPanel({
  status,
  routes,
  etas,
  routeMessage,
  retainedMessage,
  onRetry,
}: {
  status: QueryStatus;
  routes: RouteOption[];
  etas: Record<string, EtaStatus>;
  routeMessage: string | null;
  retainedMessage: string | null;
  onRetry: () => void;
}) {
  const { text } = useI18n();
  if (status === "loading" && routes.length === 0) {
    return (
      <div className={styles.loadingState} data-testid="route-loading">
        <p><strong>{text(uiCopy.queryLoadingTitle)}</strong>{text(uiCopy.queryLoadingDescription)}</p>
        {[0, 1, 2].map((item) => <span className={styles.skeleton} key={item} />)}
      </div>
    );
  }
  if (status === "idle") {
    return <EmptyState title={text(homepageContent.routeTrial.emptyState.title)} description={text(homepageContent.routeTrial.emptyState.description)} />;
  }
  if (status === "empty") {
    return <EmptyState title={text(uiCopy.noRoutesTitle)} description={text(uiCopy.noRoutesDescription)} action={text(uiCopy.adjustPlaces)} onAction={onRetry} />;
  }
  if (status === "error" && routes.length === 0) {
    return (
      <EmptyState
        title={text(homepageContent.routeTrial.errorState.title)}
        description={routeMessage ?? text(homepageContent.routeTrial.errorState.description)}
        action={text(homepageContent.routeTrial.retryAction)}
        onAction={onRetry}
        error
      />
    );
  }
  return (
    <>
      <header className={styles.resultHeader}>
        <div><small>{text({ "zh-Hant": "即時比較", "zh-Hans": "即时比较", en: "LIVE COMPARISON" })}</small><strong>{routes.length} {text(uiCopy.routeResultsCount)}</strong></div>
        {retainedMessage ? <span>{retainedMessage}</span> : null}
      </header>
      {routeMessage && !retainedMessage ? <p className={styles.inlineError}>{routeMessage}</p> : null}
      <div className={styles.results}>
        {routes.map((route) => <RouteResultCard key={route.routeId} route={route} eta={route.etaToken ? etas[route.etaToken] : undefined} />)}
      </div>
    </>
  );
}

function EmptyState({ title, description, action, onAction, error = false }: { title: string; description: string; action?: string; onAction?: () => void; error?: boolean }) {
  return (
    <div className={styles.emptyState} data-error={error ? "true" : "false"}>
      <span className={styles.stateMark} aria-hidden="true" />
      <strong>{title}</strong>
      <p>{description}</p>
      {action ? <button type="button" onClick={onAction}>{action}</button> : null}
    </div>
  );
}

function usePlaceSearch(
  field: PlaceFieldName,
  fieldState: PlaceFieldState,
  setField: Dispatch<SetStateAction<PlaceFieldState>>,
  locale: Locale,
  text: ReturnType<typeof useI18n>["text"],
  requestSeq: MutableRefObject<Record<PlaceFieldName, number>>,
) {
  useEffect(() => {
    const query = fieldState.input.trim();
    if (!query) {
      setField((current) => ({ ...current, candidates: [], loading: false, error: null }));
      return;
    }
    if (fieldState.selected?.name === fieldState.input) return;
    const seq = ++requestSeq.current[field];
    const timeout = window.setTimeout(() => {
      setField((current) => ({ ...current, loading: true, error: null }));
      queryPlaces({ requestId: createRouteRequestId("places-" + field), language: locale, query, limit: 100 })
        .then((data) => {
          if (requestSeq.current[field] === seq) setField((current) => ({ ...current, candidates: data.places, loading: false, error: null }));
        })
        .catch((error) => {
          if (requestSeq.current[field] !== seq || isAbortError(error)) return;
          setField((current) => ({ ...current, candidates: [], loading: false, error: text(uiCopy.placeSearchFailed) }));
        });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [field, fieldState.input, fieldState.selected, locale, requestSeq, setField, text]);
}

function selectedRouteKey(origin: PlaceCandidate, destination: PlaceCandidate) {
  return origin.placeToken + "|" + destination.placeToken;
}

function initialEtaState(routes: RouteOption[]) {
  const now = new Date().toISOString();
  return Object.fromEntries(routes.filter((route) => route.etaToken).map((route) => [route.etaToken!, { etaToken: route.etaToken!, status: "waiting", updatedAt: now } satisfies EtaStatus]));
}

function markEtaUnavailable(routes: RouteOption[]) {
  const now = new Date().toISOString();
  return Object.fromEntries(routes.filter((route) => route.etaToken).map((route) => [route.etaToken!, { etaToken: route.etaToken!, status: "unavailable", updatedAt: now } satisfies EtaStatus]));
}

function routeErrorMessage(error: unknown, text: ReturnType<typeof useI18n>["text"]) {
  const apiError = error instanceof RouteQueryClientError ? error.apiError : undefined;
  return errorMessageForCode(apiError, text);
}

function errorMessageForCode(apiError: ApiError | undefined, text: ReturnType<typeof useI18n>["text"]) {
  switch (apiError?.code) {
    case "RATE_LIMITED": return text(uiCopy.routeQueryRateLimited);
    case "PLACE_TOKEN_EXPIRED":
    case "ETA_TOKEN_EXPIRED": return text(uiCopy.routeQueryTokenExpired);
    case "PLACE_TOKEN_INVALID":
    case "ETA_TOKEN_INVALID": return text(uiCopy.routeQueryInvalidToken);
    case "SAME_PLACE": return text(uiCopy.samePlaceError);
    default: return text(uiCopy.routeQueryFailed);
  }
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}
