import { Languages } from "lucide-react";
import { useMonitoringI18n, type MonitoringLocale } from "../../app/MonitoringI18nProvider";
import { monitoringCopy } from "../../content/copy";

const labels: Record<MonitoringLocale, string> = { "zh-Hant": "繁體中文", "zh-Hans": "简体中文", en: "English" };

export function MonitoringLanguageSwitcher() {
  const { locale, setLocale } = useMonitoringI18n();
  return <label className="monitor-control language-control">
    <Languages size={15} aria-hidden="true" />
    <span className="sr-only">{monitoringCopy(locale, "language")}</span>
    <select value={locale} onChange={(event) => setLocale(event.target.value as MonitoringLocale)} aria-label={monitoringCopy(locale, "language")}>
      {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select>
  </label>;
}
