import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getInitialLocale, t, writeStoredLocale } from "../../content/locales";
import { localeFromPathname, localizedPathForLocale } from "../../content/seo";
import type { Locale, LocalizedString } from "../../content/types";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  text: (value: LocalizedString) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getInitialLocaleForCurrentUrl(): Locale {
  if (typeof window === "undefined") {
    return getInitialLocale();
  }
  return localeFromPathname(window.location.pathname) ?? getInitialLocale();
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getInitialLocaleForCurrentUrl());

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    const syncLocaleFromHistory = () => {
      const localeFromUrl = localeFromPathname(window.location.pathname);
      setLocaleState(localeFromUrl ?? getInitialLocale());
    };

    window.addEventListener("popstate", syncLocaleFromHistory);
    return () => window.removeEventListener("popstate", syncLocaleFromHistory);
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const setLocale = (nextLocale: Locale) => {
      setLocaleState(nextLocale);
      writeStoredLocale(nextLocale);
      if (typeof window !== "undefined") {
        // localizedPathForLocale 会保留当前页面类型，避免从 privacy 语言切换回首页路径。
        const nextPath = localizedPathForLocale(nextLocale);
        if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== nextPath) {
          window.history.pushState({}, "", nextPath);
        }
      }
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
