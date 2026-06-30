import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { I18nProvider } from "../components/i18n/I18nProvider";
import type { Locale } from "../content/types";

interface RenderWithI18nOptions {
  pathname?: string;
  locale?: Locale;
}

function pathnameForLocale(locale: Locale): string {
  if (locale === "zh-Hans") {
    return "/zh-hans/";
  }
  if (locale === "en") {
    return "/en/";
  }
  return "/zh-hant/";
}

export function renderWithI18n(element: ReactElement, options: RenderWithI18nOptions = {}) {
  const pathname = options.pathname ?? (options.locale ? pathnameForLocale(options.locale) : "/zh-hant/");
  window.history.replaceState({}, "", pathname);
  return render(<I18nProvider>{element}</I18nProvider>);
}
