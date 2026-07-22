import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { HeatmapCell } from "../../services/analyticsTypes";
import { Heatmap } from "./Heatmap";

const cells: HeatmapCell[] = Array.from({ length: 10 }, (_, index) => {
  const localDate = `2026-07-${String(index + 1).padStart(2, "0")}`;
  return { localDate, bucketStart: `${localDate}T00:00:00+08:00`, bucketEnd: `${localDate}T23:59:59+08:00`, eventCount: index * 2, uv: index };
});

describe("Heatmap", () => {
  it("lays out actual days top-to-bottom in seven weekday rows with padding cells", () => {
    const { container } = render(<Heatmap cells={cells} locale="zh-Hans" label="每日流量" />);
    expect(screen.getAllByRole("gridcell")).toHaveLength(10);
    expect(container.querySelectorAll(".heatmap-padding").length).toBeGreaterThan(0);
    expect(container.querySelector(".daily-heatmap-grid")).toHaveStyle({ gridTemplateRows: "repeat(7, 28px)" });
    expect(container.querySelector(".heatmap-scroll")).toHaveClass("heatmap-scroll");
  });

  it("shows date, event count, and UV from mouse or keyboard interaction", () => {
    render(<Heatmap cells={cells} locale="zh-Hans" label="每日流量" />);
    const cell = screen.getAllByRole("gridcell")[3];
    fireEvent.focus(cell);
    expect(screen.getByRole("status")).toHaveTextContent("2026");
    expect(screen.getByRole("status")).toHaveTextContent("事件总数");
    expect(screen.getByRole("status")).toHaveTextContent("独立浏览器 UV");
    expect(screen.getByLabelText("强度图例")).toHaveTextContent("少");
    expect(screen.getByLabelText("强度图例")).toHaveTextContent("多");
  });
});
