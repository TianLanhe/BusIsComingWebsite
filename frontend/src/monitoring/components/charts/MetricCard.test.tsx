import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Metric } from "../../services/analyticsTypes";
import { MetricCard } from "./MetricCard";

const metric = (overrides: Partial<Metric> = {}): Metric => ({
  key: "pv",
  value: 100,
  previousValue: 90,
  delta: 10,
  deltaRate: 10 / 90,
  ...overrides,
});

describe("MetricCard", () => {
  it("renders signed direction and localized comparison text without decorative nodes", () => {
    const { container } = render(<MetricCard label="PV" metric={metric()} locale="zh-Hans" compareEnabled />);
    expect(screen.getByText("+11.1%")).toBeInTheDocument();
    expect(screen.getByText("对比上期")).toBeInTheDocument();
    expect(container.querySelector(".metric-label i")).toBeNull();
    expect(container.querySelector("[data-decoration]")).toBeNull();
  });

  it.each([
    [metric({ previousValue: 100, delta: 0, deltaRate: 0 }), true, "较上期持平"],
    [metric({ previousValue: null, delta: null, deltaRate: null }), true, "暂无同期数据"],
    [metric(), false, "未启用同期比较"],
    [metric({ value: null }), true, "暂无当前数据"],
  ] as const)("explains every non-directional state", (value, compareEnabled, copy) => {
    render(<MetricCard label="PV" metric={value} locale="zh-Hans" compareEnabled={compareEnabled} />);
    expect(screen.getByText(copy)).toBeInTheDocument();
    expect(screen.queryByText("—%")).not.toBeInTheDocument();
  });

  it("uses the long-value floor without reducing semantic emphasis", () => {
    render(<MetricCard label="PV" metric={metric({ value: 123_456_789 })} locale="en" compareEnabled />);
    expect(screen.getByText("123,456,789")).toHaveClass("metric-value", "long");
  });

  it("formats response time with ms and marks an increasing latency as worse", () => {
    render(<MetricCard label="P95" metric={metric({ value: 180, previousValue: 120, delta: 60, deltaRate: .5 })} locale="zh-Hans" format="durationMs" compareEnabled presentation="lower_is_better" />);
    expect(screen.getByText("180 ms")).toBeInTheDocument();
    expect(screen.getByText("+60 ms")).toBeInTheDocument();
    expect(screen.getByTestId("metric-card").querySelector(".worse")).not.toBeNull();
  });
});
