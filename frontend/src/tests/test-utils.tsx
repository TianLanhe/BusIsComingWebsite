import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { I18nProvider } from "../components/i18n/I18nProvider";

export function renderWithI18n(element: ReactElement) {
  return render(<I18nProvider>{element}</I18nProvider>);
}
