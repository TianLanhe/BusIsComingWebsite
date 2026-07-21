import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type MonitoringLocale = "zh-Hant" | "zh-Hans" | "en";

interface MonitoringI18nValue {
  locale: MonitoringLocale;
  setLocale: (locale: MonitoringLocale) => void;
}

const storageKey = "busiscoming.monitor.locale";
const MonitoringI18nContext = createContext<MonitoringI18nValue | null>(null);

function detectLocale(): MonitoringLocale {
  const language = navigator.language.toLowerCase();
  if (language.startsWith("en")) return "en";
  if (language.includes("hans") || language.startsWith("zh-cn") || language.startsWith("zh-sg")) return "zh-Hans";
  return "zh-Hant";
}

function initialLocale(): MonitoringLocale {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === "zh-Hant" || stored === "zh-Hans" || stored === "en") return stored;
  } catch {
    // Private browsing may deny storage; browser language remains a safe fallback.
  }
  return detectLocale();
}

export function MonitoringI18nProvider({ children, initialLocale: supplied }: { children: React.ReactNode; initialLocale?: MonitoringLocale }) {
  const [locale, setLocaleState] = useState<MonitoringLocale>(() => supplied ?? initialLocale());
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const value = useMemo(() => ({
    locale,
    setLocale: (next: MonitoringLocale) => {
      setLocaleState(next);
      try { localStorage.setItem(storageKey, next); } catch { /* keep in memory */ }
    },
  }), [locale]);
  return <MonitoringI18nContext.Provider value={value}>{children}</MonitoringI18nContext.Provider>;
}

export function useMonitoringI18n() {
  const value = useContext(MonitoringI18nContext);
  if (!value) throw new Error("useMonitoringI18n must be used inside MonitoringI18nProvider");
  return value;
}
