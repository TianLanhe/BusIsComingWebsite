import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AccessibleChartFrame } from "./charts/AccessibleChartFrame";
import { QueryState } from "./states/QueryState";
import { DashboardShell } from "./layout/DashboardShell";
import { FilterProvider } from "../app/FilterProvider";
import { MonitoringI18nProvider } from "../app/MonitoringI18nProvider";
import accessibilityCSS from "../styles/accessibility.css?raw";

describe("monitoring accessibility", () => {
  it("provides a chart summary and equivalent table instead of relying on colour", () => {
    render(<AccessibleChartFrame title="Traffic" summary="PV and UV by day" columns={["Day", "PV", "UV"]} rows={[["07-21", "10", "4"]]}><div data-testid="visual-chart" /></AccessibleChartFrame>);
    expect(screen.getByRole("figure", { name: "Traffic" })).toHaveTextContent("PV and UV by day");
    expect(screen.getByRole("table", { name: "Traffic" })).toHaveTextContent("07-21");
    expect(screen.getByTestId("visual-chart")).not.toHaveAttribute("aria-hidden");
  });

  it("announces query state changes", () => {
    render(<QueryState kind="query_failed" title="Failed" body="Filters preserved" retryLabel="Retry" onRetry={() => {}} />);
    expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "assertive");
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("defines visible focus, mobile touch targets, and reduced-motion fallbacks", () => {
    expect(accessibilityCSS).toMatch(/focus-visible/);
    expect(accessibilityCSS).toMatch(/min-(?:height|width):\s*44px/);
    expect(accessibilityCSS).toMatch(/prefers-reduced-motion:\s*reduce/);
    expect(accessibilityCSS).toMatch(/animation-duration:\s*0\.01ms/);
  });

  it("uses one three-group seven-route navigation source for sidebar, drawer, and mobile navigation", () => {
    render(<MonitoringI18nProvider initialLocale="zh-Hans"><FilterProvider now={() => new Date("2026-07-21T00:00:00+08:00")}><DashboardShell active="visitor"><div /></DashboardShell></FilterProvider></MonitoringI18nProvider>);
    expect(screen.getByTestId("desktop-sidebar")).toHaveTextContent("业务监控");
    expect(screen.getByTestId("desktop-sidebar")).toHaveTextContent("技术监控");
    expect(screen.getByTestId("desktop-sidebar")).toHaveTextContent("数据明细");
    expect(within(screen.getByTestId("desktop-sidebar")).getAllByRole("link")).toHaveLength(7);
    expect(screen.getByRole("link", { name: "访客明细" })).toHaveAttribute("aria-current", "page");
  });
});
