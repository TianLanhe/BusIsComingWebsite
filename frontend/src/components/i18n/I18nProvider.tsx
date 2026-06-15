import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getInitialLocale, t, writeStoredLocale } from "../../content/locales";
import type { Locale, LocalizedString } from "../../content/types";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  text: (value: LocalizedString) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getInitialLocale());

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    const setLocale = (nextLocale: Locale) => {
      setLocaleState(nextLocale);
      writeStoredLocale(nextLocale);
    };

    return {
      locale,
      setLocale,
      text: (localized: LocalizedString) => t(localized, locale),
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return value;
}
