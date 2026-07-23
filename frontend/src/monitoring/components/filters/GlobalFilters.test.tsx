import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FilterProvider } from "../../app/FilterProvider";
import { MonitoringI18nProvider } from "../../app/MonitoringI18nProvider";
import { GlobalFilters } from "./GlobalFilters";
import "../../styles/tokens.css";
import "../../styles/dashboard.css";

function renderFilters(locale: "zh-Hans" | "zh-Hant" | "en" = "zh-Hans") {
  return render(<MonitoringI18nProvider initialLocale={locale}>
    <FilterProvider now={() => new Date("2026-07-23T12:00:00+08:00")}>
      <GlobalFilters />
    </FilterProvider>
  </MonitoringI18nProvider>);
}

describe("GlobalFilters", () => {
  it("offers 7/30/90 presets and an inclusive custom range", () => {
    renderFilters();
    fireEvent.click(screen.getByText("筛选"));
    expect(screen.getByRole("button", { name: "近 7 天" })).toHaveStyle({ minHeight: "44px" });
    expect(screen.getByRole("button", { name: "近 30 天" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "近 90 天" })).toBeInTheDocument();
    expect(screen.getByLabelText("开始日期")).toHaveAttribute("type", "date");
    expect(screen.getByLabelText("结束日期")).toHaveAttribute("type", "date");
  });

  it("shows a localized inline error and leaves the active query unchanged", () => {
    renderFilters("en");
    fireEvent.click(screen.getByText("Filters"));
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-07-24" } });
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2026-07-23" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply dates" }));
    expect(screen.getByRole("alert")).toHaveTextContent("start date cannot be after");
  });

  it("synchronizes custom dates from the shared applied range after the top control commits", () => {
    render(<MonitoringI18nProvider initialLocale="zh-Hans">
      <FilterProvider now={() => new Date("2026-07-24T12:00:00+08:00")}>
        <GlobalFilters />
      </FilterProvider>
    </MonitoringI18nProvider>);
    fireEvent.click(screen.getByText("筛选"));
    fireEvent.change(screen.getByLabelText("开始日期"), { target: { value: "2025-12-31" } });
    fireEvent.change(screen.getByLabelText("结束日期"), { target: { value: "2026-01-02" } });
    fireEvent.click(screen.getByRole("button", { name: "应用日期" }));

    expect(screen.getByLabelText("开始日期")).toHaveValue("2025-12-31");
    expect(screen.getByLabelText("结束日期")).toHaveValue("2026-01-02");
  });
});
