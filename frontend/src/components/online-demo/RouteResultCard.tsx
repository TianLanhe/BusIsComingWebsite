import type { EtaStatus, RouteOption } from "../../services/routeQueryTypes";
import { homepageContent } from "../../content/homepageContent";
import type { Locale } from "../../content/types";
import { uiCopy } from "../../content/uiCopy";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./OnlineQueryDemo.module.css";

export function RouteResultCard({ route, eta }: { route: RouteOption; eta?: EtaStatus }) {
  const { locale, text } = useI18n();
  const hasStopPath = Boolean(route.boardingStop.name && route.alightingStop.name);
  const routeLabel = route.routeNumbers.length > 0 ? route.routeNumbers.join(" → ") : route.routeLabel;

  return (
    <article className={styles.routeRow} data-testid="route-card">
      <div className={styles.routeMain}>
        <strong className={styles.routeNumber}>{routeLabel}</strong>
        <em>{formatEta(route, eta, text)}</em>
      </div>
      {hasStopPath ? (
        <p className={styles.stopLine}>
          <span data-testid="route-origin-stop" title={route.boardingStop.name}>{route.boardingStop.name}</span>
          <span aria-hidden="true">→</span>
          <span data-testid="route-destination-stop" title={route.alightingStop.name}>{route.alightingStop.name}</span>
        </p>
      ) : (
        <p className={styles.stopFallback} data-testid="route-stop-fallback">{text(uiCopy.stopInfoUnavailable)}</p>
      )}
      <dl className={styles.metrics} data-testid="route-metrics">
        <div><dt>{text(homepageContent.routeTrial.metricLabels.fare)}</dt><dd>{formatFare(route.fare.amount, locale)}</dd></div>
        <div><dt className={styles.visuallyHidden}>{text(homepageContent.routeTrial.metricLabels.duration)}</dt><dd>{formatMetric(route.durationMinutes, locale, text(homepageContent.routeTrial.metricLabels.duration), text(uiCopy.durationUnit))}</dd></div>
        <div><dt className={styles.visuallyHidden}>{text(homepageContent.routeTrial.metricLabels.walking)}</dt><dd>{formatMetric(route.walkingDistanceMeters, locale, text(homepageContent.routeTrial.metricLabels.walking), text(uiCopy.walkingUnit))}</dd></div>
      </dl>
    </article>
  );
}

function formatEta(route: RouteOption, eta: EtaStatus | undefined, text: ReturnType<typeof useI18n>["text"]): string {
  if (!route.etaToken) return text(uiCopy.etaUnavailable);
  if (eta?.waitMinutes != null) return `${text(uiCopy.waitLabel)} ${eta.waitMinutes} ${text(uiCopy.waitMinutesSuffix)}`;
  if (!eta || eta.status === "waiting") return text(uiCopy.etaLoading);
  if (eta.status === "arriving") return text(uiCopy.etaArriving);
  return text(uiCopy.etaUnavailable);
}

function formatFare(amount: number, locale: Locale) {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "HKD", currencyDisplay: "narrowSymbol" }).format(amount);
}

function formatMetric(value: number, locale: Locale, label: string, unit: string) {
  return `${label} ${value.toLocaleString(locale)} ${unit}`;
}
