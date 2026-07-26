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

  it("keeps pointer and keyboard tooltip modes mutually exclusive and clears them", () => {
    const { container } = render(<TimeSeriesChart title="流量趋势" data={data} series={series} locale="zh-Hans" emptyLabel="暂无数据" />);
    const point = screen.getAllByTestId("chart-point")[0];

    fireEvent.mouseEnter(point);
    expect(container.querySelector(".chart-keyboard-tooltip")).toBeNull();

    fireEvent.focus(screen.getAllByTestId("chart-point")[0]);
    expect(container.querySelectorAll(".chart-tooltip, .chart-keyboard-tooltip")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("主页 PV");

    fireEvent.mouseEnter(screen.getAllByTestId("chart-point")[0]);
    expect(container.querySelector(".chart-keyboard-tooltip")).toBeNull();
    expect(container.querySelector(".recharts-reference-line")).toBeInTheDocument();

    fireEvent.focus(screen.getAllByTestId("chart-point")[0]);
    fireEvent.blur(screen.getAllByTestId("chart-point")[0]);
    expect(container.querySelector(".chart-keyboard-tooltip")).toBeNull();
  });

  it("uses the hovered point index as the single source of truth for pointer tooltip content", () => {
    const { container } = render(<TimeSeriesChart title="流量趋势" data={data} series={series} locale="zh-Hans" emptyLabel="暂无数据" />);
    fireEvent.mouseEnter(screen.getAllByTestId("chart-point")[1]);

    const tooltip = container.querySelector(".chart-tooltip");
    expect(tooltip).toHaveTextContent("16");
    expect(tooltip).toHaveTextContent("7");
    expect(container.querySelectorAll(".chart-tooltip, .chart-keyboard-tooltip")).toHaveLength(1);
  });

  it("clears interaction when replacement data or a non-empty visible series changes", () => {
    const { container, rerender } = render(<TimeSeriesChart title="流量趋势" data={data} series={series} locale="zh-Hans" emptyLabel="暂无数据" />);
    fireEvent.focus(screen.getAllByTestId("chart-point")[0]);
    expect(container.querySelector(".chart-keyboard-tooltip")).toBeInTheDocument();

    rerender(<TimeSeriesChart title="流量趋势" data={[...data]} series={series} locale="zh-Hans" emptyLabel="暂无数据" />);
    expect(container.querySelector(".chart-keyboard-tooltip")).toBeNull();
    expect(container.querySelector(".recharts-reference-line")).toBeNull();

    fireEvent.mouseEnter(screen.getAllByTestId("chart-point")[0]);
    expect(container.querySelector(".recharts-reference-line")).toBeInTheDocument();
    rerender(<TimeSeriesChart title="流量趋势" data={[...data]} series={[series[0]]} locale="zh-Hans" emptyLabel="暂无数据" />);
    expect(container.querySelector(".chart-keyboard-tooltip")).toBeNull();
    expect(container.querySelector(".recharts-reference-line")).toBeNull();
  });

  it("renders an explicit empty state instead of a zero line", () => {
    render(<TimeSeriesChart title="流量趋势" data={[]} series={series} locale="en" emptyLabel="No chartable data" />);
    expect(screen.getByText("No chartable data")).toBeInTheDocument();
    expect(screen.queryByTestId("chart-point")).not.toBeInTheDocument();
  });

  it("formats SLI axis ticks as percentages while preserving zero and null points", () => {
    const { container } = render(<TimeSeriesChart title="SLI" data={[{ bucketStart: data[0].bucketStart, success: 0 }, { bucketStart: data[1].bucketStart, success: null }]} series={[{ key: "success", label: "Homepage", unit: "percent", color: "#00545b", lineStyle: "solid", pointShape: "circle" }]} locale="en" emptyLabel="No data" />);
    expect(screen.getByTestId("chart-point")).toHaveAttribute("aria-label", "Homepage 0%");
    expect(screen.getByRole("table", { name: "SLI" })).toHaveTextContent("0");
    expect(screen.getByRole("table", { name: "SLI" })).toHaveTextContent("—");
  });
});
