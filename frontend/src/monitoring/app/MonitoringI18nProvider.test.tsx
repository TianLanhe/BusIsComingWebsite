import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MonitoringI18nProvider, useMonitoringI18n } from "./MonitoringI18nProvider";

function Probe() {
  const { locale, setLocale } = useMonitoringI18n();
  return <><output>{locale}</output><button onClick={() => setLocale("en")}>English</button></>;
}

describe("MonitoringI18nProvider", () => {
  const values = new Map<string, string>();
  let languageGetter: { mockReturnValue: (value: string) => unknown };
  beforeEach(() => {
    values.clear();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      clear: () => values.clear(),
    });
    languageGetter = vi.spyOn(window.navigator, "language", "get").mockReturnValue("fr-FR");
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("falls back to Hong Kong traditional Chinese for an unknown browser language", () => {
    render(<MonitoringI18nProvider><Probe /></MonitoringI18nProvider>);
    expect(screen.getByText("zh-Hant")).toBeInTheDocument();
  });

  it.each([
    ["en-US", "en"],
    ["zh-CN", "zh-Hans"],
    ["zh-HK", "zh-Hant"],
  ])("selects %s as %s when no preference is stored", (browserLanguage, expected) => {
    languageGetter.mockReturnValue(browserLanguage);
    render(<MonitoringI18nProvider><Probe /></MonitoringI18nProvider>);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("persists a language switch", () => {
    render(<MonitoringI18nProvider initialLocale="zh-Hant"><Probe /></MonitoringI18nProvider>);
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(screen.getByText("en")).toBeInTheDocument();
    expect(localStorage.getItem("busiscoming.monitor.locale")).toBe("en");
  });
});
