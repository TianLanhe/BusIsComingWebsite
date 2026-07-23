import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FilterProvider } from "../app/FilterProvider";
import { MonitoringI18nProvider } from "../app/MonitoringI18nProvider";
import type { VisitorData } from "../services/analyticsTypes";
import { VisitorPage } from "./VisitorPage";

describe("VisitorPage", () => {
  it("shows the Figma-ordered visitor cards, preferences, nullable platform, return and copy feedback", async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    renderPage(<VisitorPage initialVisitorID="abcdefghijklmnopqrstuv" loadVisitor={async () => visitor()} />);
    expect(await screen.findByText("事件类型构成")).toBeInTheDocument();
    expect(screen.getByText("首次出现")).toBeInTheDocument();
    expect(screen.getByText("最后出现")).toBeInTheDocument();
    expect(screen.getByText("会话")).toBeInTheDocument();
    expect(screen.getByText("累计事件")).toBeInTheDocument();
    expect(screen.getByText("访客偏好")).toBeInTheDocument();
    const preferences = screen.getByText("访客偏好").closest("article")!;
    expect(within(preferences).getByText("语言")).toBeInTheDocument();
    expect(within(preferences).getByText("平台")).toBeInTheDocument();
    expect(within(preferences).getByText("设备")).toBeInTheDocument();
    expect(screen.getByText("暂无下载平台数据")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "返回事件明细" })).toHaveAttribute("href", "#events");
    fireEvent.click(screen.getByRole("button", { name: "复制完整 ID" }));
    expect(await screen.findByText("已复制完整匿名 ID")).toHaveAttribute("aria-live", "polite");
  });

  it("rejects a truncated identifier without issuing a query", () => {
    const loader = vi.fn();
    renderPage(<VisitorPage loadVisitor={loader} />);
    fireEvent.change(screen.getByPlaceholderText("输入完整匿名 visitor ID"), { target: { value: "abcdef…stuv" } });
    fireEvent.click(screen.getByRole("button", { name: "查询访客" }));
    expect(screen.getByRole("alert")).toHaveTextContent("22");
    expect(loader).not.toHaveBeenCalled();
  });
});

function renderPage(element: React.ReactElement) { return render(<MonitoringI18nProvider initialLocale="zh-Hans"><FilterProvider now={() => new Date("2026-07-21T00:00:00+08:00")}>{element}</FilterProvider></MonitoringI18nProvider>); }
function visitor(): VisitorData { return { generatedAt: "2026-07-21T01:00:00Z", timezone: "Asia/Hong_Kong", visitor: { visitorId: "abcdefghijklmnopqrstuv", firstSeenAt: "2026-07-20T00:00:00Z", lastSeenAt: "2026-07-21T00:00:00Z", eventCount: 3, sessionCount: 1, commonLocale: "zh-Hant", commonDeviceType: "mobile", commonSourceType: "direct", eventComposition: [{ key: "page_view", count: 1, ratio: 1 / 3 }, { key: "route_query", count: 2, ratio: 2 / 3 }], commonPlatform: null }, sessions: [{ ordinal: 1, startedAt: "2026-07-20T00:00:00Z", endedAt: "2026-07-20T00:20:00Z", durationMs: 1_200_000, eventCount: 3, events: [] }], pageInfo: { limit: 50, nextCursor: null, hasMore: false, totalCount: 3 } }; }
