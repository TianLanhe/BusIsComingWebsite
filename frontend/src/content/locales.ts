import type { Locale, LocalizedString } from "./types";

export const locales: Locale[] = ["zh-Hant", "zh-Hans", "en"];

export const localeNames: Record<Locale, string> = {
  "zh-Hant": "繁",
  "zh-Hans": "简",
  en: "EN",
};

export const localeLabels: Record<Locale, string> = {
  "zh-Hant": "繁體中文",
  "zh-Hans": "简体中文",
  en: "English",
};

const storageKey = "busiscoming.locale";

export function isLocale(value: string | null | undefined): value is Locale {
  return Boolean(value && locales.includes(value as Locale));
}

export function detectLocale(language = globalThis.navigator?.language): Locale {
  const normalized = language.toLowerCase();
  if (normalized.startsWith("zh-cn") || normalized.startsWith("zh-sg") || normalized.includes("hans")) {
    return "zh-Hans";
  }
  if (normalized.startsWith("en")) {
    return "en";
  }
  return "zh-Hant";
}

export function readStoredLocale(): Locale | null {
  try {
    if (typeof window === "undefined" || !("localStorage" in window)) {
      return null;
    }
    const stored = window.localStorage.getItem(storageKey);
    return isLocale(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function writeStoredLocale(locale: Locale): void {
  try {
    if (typeof window === "undefined" || !("localStorage" in window)) {
      return;
    }
    window.localStorage.setItem(storageKey, locale);
  } catch {
    // Storage can be unavailable in privacy modes; the UI still works with in-memory state.
  }
}

export function getInitialLocale(): Locale {
  return readStoredLocale() ?? detectLocale();
}

export function t(value: LocalizedString, locale: Locale): string {
  return value[locale] || value["zh-Hant"];
}
