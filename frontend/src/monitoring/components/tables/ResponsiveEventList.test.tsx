import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResponsiveEventList } from "./ResponsiveEventList";

const event = { eventId: "99", occurredAt: "2026-07-21T00:00:00Z", visitorId: "abcdefghijklmnopqrstuv", eventType: "route_query" as const, outcome: "success" as const, httpStatus: 200, statusClass: "2xx" as const, failureCategory: null, durationMs: 420, locale: "zh-Hant" as const, deviceType: "mobile" as const, sourceType: "direct" as const, download: null };

describe("ResponsiveEventList", () => {
  it("renders an accessible key-value event card and opens the exact visitor", () => {
    const onViewVisitor = vi.fn();
    render(<ResponsiveEventList items={[event]} locale="zh-Hans" onViewVisitor={onViewVisitor} />);
    expect(screen.getByText("时间")).toBeInTheDocument();
    expect(screen.getByText("匿名访客")).toBeInTheDocument();
    expect(screen.getByText("耗时")).toBeInTheDocument();
    expect(screen.getByText("结果")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "查看访客" }));
    expect(onViewVisitor).toHaveBeenCalledWith("abcdefghijklmnopqrstuv");
  });
});
