import type { MonitoringLocale } from "../app/MonitoringI18nProvider";
import { QueryState } from "../components/states/QueryState";
import { monitoringCopy } from "../content/copy";
import { detailText } from "../content/types";
import type { AnalyticsClientError } from "../services/analyticsClient";

export function DetailState({ loading, error, noData, locale }: { loading: boolean; error: AnalyticsClientError | null; noData: boolean; locale: MonitoringLocale }) {
  if (loading) return <QueryState kind="loading" title={monitoringCopy(locale, "loadingTitle")} body={monitoringCopy(locale, "loadingBody")} />;
  if (error?.code === "ANALYTICS_STORAGE_UNAVAILABLE") return <QueryState kind="storage_unavailable" title={monitoringCopy(locale, "storageUnavailableTitle")} body={monitoringCopy(locale, "storageUnavailableBody")} />;
  if (error) return <QueryState kind="query_failed" title={monitoringCopy(locale, "queryFailedTitle")} body={monitoringCopy(locale, "queryFailedBody")} />;
  if (noData) return <QueryState kind="no_results" title={detailText(locale, "noDetailData")} body={detailText(locale, "noDetailBody")} />;
  return null;
}
