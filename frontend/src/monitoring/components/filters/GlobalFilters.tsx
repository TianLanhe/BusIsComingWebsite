import { Filter, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { useAnalyticsFilters } from "../../app/FilterProvider";
import { useMonitoringI18n } from "../../app/MonitoringI18nProvider";
import { monitoringCopy } from "../../content/copy";
import type { AnalyticsLocale, DeviceType, EventType, Outcome, Platform, SourceType } from "../../services/analyticsTypes";

export function GlobalFilters() {
  const filters = useAnalyticsFilters();
  const { locale } = useMonitoringI18n();
  const t = (key: Parameters<typeof monitoringCopy>[1]) => monitoringCopy(locale, key);
  const [startDate, setStartDate] = useState(filters.resolvedRange.displayStartDate);
  const [endDate, setEndDate] = useState(filters.resolvedRange.displayEndDate);
  const [dateError, setDateError] = useState<"dateInvalid" | "dateFuture" | "dateOrder" | null>(null);

  useEffect(() => {
    setStartDate(filters.resolvedRange.displayStartDate);
    setEndDate(filters.resolvedRange.displayEndDate);
  }, [filters.resolvedRange.displayEndDate, filters.resolvedRange.displayStartDate]);

  const applyCustomRange = () => {
    const error = filters.setCustomRange(startDate, endDate);
    setDateError(error ? ({ invalid: "dateInvalid", future: "dateFuture", order: "dateOrder" } as const)[error.code] : null);
  };

  const applyPreset = (days: 7 | 30 | 90) => {
    setDateError(null);
    filters.setRangeDays(days);
  };

  return <details className="global-filters">
    <summary><SlidersHorizontal size={15} />{t("filters")}<span className="filter-count">{activeCount(filters.query)}</span></summary>
    <div className="filter-panel">
      <fieldset className="filter-group date-range-group">
        <legend>{t("dateRange")}</legend>
        <div className="date-presets">
          {([7, 30, 90] as const).map((days) => <button
            type="button"
            key={days}
            className={filters.selection.kind === "preset" && filters.selection.presetDays === days ? "active" : ""}
            aria-pressed={filters.selection.kind === "preset" && filters.selection.presetDays === days}
            onClick={() => applyPreset(days)}
          >{t(days === 7 ? "range7" : days === 30 ? "range30" : "range90")}</button>)}
        </div>
        <div className="custom-date-fields">
          <label>{t("startDate")}<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
          <label>{t("endDate")}<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
          <button type="button" className="apply-date" onClick={applyCustomRange}>{t("applyRange")}</button>
        </div>
        {dateError && <p className="date-range-error" role="alert">{t(dateError)}</p>}
      </fieldset>
      <FilterGroup label={t("language")} values={["zh-Hant", "zh-Hans", "en"]} selected={filters.query.locale} toggle={(value) => filters.toggleLocale(value as AnalyticsLocale)} />
      <FilterGroup label={t("device")} values={["mobile", "desktop", "tablet"]} selected={filters.query.device} labels={{ mobile: t("mobile"), desktop: t("desktop") }} toggle={(value) => filters.toggleDevice(value as DeviceType)} />
      <FilterGroup label={t("source")} values={["direct", "search", "referral"]} selected={filters.query.source} labels={{ direct: t("direct"), search: t("search"), referral: t("referral") }} toggle={(value) => filters.toggleSource(value as SourceType)} />
      <FilterGroup label={t("outcome")} values={["success", "failure"]} selected={filters.query.outcome} labels={{ success: t("success"), failure: t("failure") }} toggle={(value) => filters.toggleOutcome(value as Outcome)} />
      <FilterGroup label={t("platform")} values={["android", "ios"]} selected={filters.query.platform} toggle={(value) => filters.togglePlatform(value as Platform)} />
      <FilterGroup label={t("eventType")} values={["page_view", "place_query", "route_query", "download_request"]} selected={filters.query.eventType ?? []} labels={{ page_view: t("pageView"), place_query: t("placeQuery"), route_query: t("routeQuery"), download_request: t("downloadRequest") }} toggle={(value) => filters.toggleEventType(value as EventType)} />
      <label className="compare-switch"><input type="checkbox" checked={filters.query.compare} onChange={(event) => filters.setCompare(event.target.checked)} />{t("compare")}</label>
      <span className="filter-privacy"><Filter size={13} />{t("visitorTransport")}</span>
    </div>
  </details>;
}

function FilterGroup({ label, values, selected, labels = {}, toggle }: { label: string; values: string[]; selected: readonly string[]; labels?: Record<string, string>; toggle: (value: string) => void }) {
  return <fieldset className="filter-group"><legend>{label}</legend><div>{values.map((value) => <button type="button" key={value} className={selected.includes(value) ? "active" : ""} onClick={() => toggle(value)} aria-pressed={selected.includes(value)}>{labels[value] ?? value}</button>)}</div></fieldset>;
}

function activeCount(query: ReturnType<typeof useAnalyticsFilters>["query"]) {
  return query.locale.length + query.device.length + query.source.length + query.outcome.length + query.platform.length + (query.eventType?.length ?? 0);
}
