import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TimeSeriesChart } from "./TimeSeriesChart";

const data = [
  { bucketStart: "2026-07-21T00:00:00+08:00", pv: 10, uv: 4 },
  { bucketStart: "2026-07-22T00:00:00+08:00", pv: 16, uv: 7 },
];
const series = [
  { key: "pv", label: "主页 PV", unit: "count" as const, color: "#00545b", lineStyle: "solid" as const, pointShape: "circle" as const },
  { key: "uv", label: "主页 UV", unit: "count" as const, color: "#8b5cf6", lineStyle: "dashed" as const, pointShape: "square" as const },
];

describe("TimeSeriesChart", () => {
  it("renders a complete legend, both axes, grid, and focusable points", () => {
    const { container } = render(<TimeSeriesChart title="流量趋势" data={data} series={series} locale="zh-Hans" emptyLabel="暂无数据" />);
    expect(screen.getByRole("list", { name: "图例" })).toHaveTextContent("主页 PV");
    expect(screen.getByRole("list", { name: "图例" })).toHaveTextContent("主页 UV");
    expect(container.querySelector(".recharts-xAxis")).not.toBeNull();
    expect(container.querySelector(".recharts-yAxis")).not.toBeNull();
    expect(container.querySelector(".recharts-cartesian-grid")).not.toBeNull();
    expect(screen.getAllByTestId("chart-point").length).toBeGreaterThan(0);
  });

  it("shares a bucket tooltip for keyboard focus and retains only a hidden data table", () => {
    const { container } = render(<TimeSeriesChart title="流量趋势" data={data} series={series} locale="zh-Hans" emptyLabel="暂无数据" />);
    fireEvent.focus(screen.getAllByTestId("chart-point")[0]);
    const tooltip = screen.getByRole("status");
    expect(tooltip).toHaveTextContent("主页 PV");
    expect(tooltip).toHaveTextContent("主页 UV");
    expect(container.querySelector("table")).toBeInTheDocument();
    expect(container.querySelector("figcaption")).toBeNull();
    expect(container.querySelector(".chart-visible-summary")).toBeNull();
  });

  it("renders an explicit empty state instead of a zero line", () => {
    render(<TimeSeriesChart title="流量趋势" data={[]} series={series} locale="en" emptyLabel="No chartable data" />);
    expect(screen.getByText("No chartable data")).toBeInTheDocument();
    expect(screen.queryByTestId("chart-point")).not.toBeInTheDocument();
  });
});
