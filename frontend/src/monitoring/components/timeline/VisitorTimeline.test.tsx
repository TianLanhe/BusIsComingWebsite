import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VisitorTimeline } from "./VisitorTimeline";

describe("VisitorTimeline", () => {
  it("explains the 30-minute boundary and renders session events", () => {
    render(<VisitorTimeline locale="zh-Hans" sessions={[{ ordinal: 1, startedAt: "2026-07-21T00:00:00Z", endedAt: "2026-07-21T00:30:00Z", durationMs: 1_800_000, eventCount: 1, events: [{ eventId: "1", occurredAt: "2026-07-21T00:00:00Z", visitorId: "abcdefghijklmnopqrstuv", eventType: "page_view", outcome: "success", httpStatus: 200, statusClass: "2xx", failureCategory: null, durationMs: 20, locale: "zh-Hant", deviceType: "mobile", sourceType: "direct", download: null }] }]} />);
    expect(screen.getByText(/30 分钟/)).toBeInTheDocument();
    expect(screen.getByText("会话 1")).toBeInTheDocument();
    expect(screen.getByText("主页访问")).toBeInTheDocument();
  });
});
