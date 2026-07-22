import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FilterProvider } from "../app/FilterProvider";
import { MonitoringI18nProvider } from "../app/MonitoringI18nProvider";
import type { SystemData } from "../services/analyticsTypes";
import { SystemPage } from "./SystemPage";

describe("SystemPage", () => {
  it("separates four dynamic cards from typed configuration facts without sensitive values", async () => {
    render(<MonitoringI18nProvider initialLocale="zh-Hans"><FilterProvider><SystemPage loadSystem={async () => system()} /></FilterProvider></MonitoringI18nProvider>);
    expect((await screen.findAllByTestId("dynamic-status-card")).length).toBe(4);
    expect(screen.getByText("运行状态")).toBeInTheDocument();
    expect(screen.getByText("存储概况")).toBeInTheDocument();
    expect(screen.getByText("隔离与降级路径")).toBeInTheDocument();
    expect(screen.getAllByText("配置事实").length).toBeGreaterThan(0);
    expect(screen.getByText("匿名事件明细长期保留")).toBeInTheDocument();
    expect(screen.getByText("未启用备份，统计数据允许丢失")).toBeInTheDocument();
    expect(screen.getByText("未启用写入队列，每次同步尝试一次")).toBeInTheDocument();
    expect(screen.getByTestId("system-workspace").textContent).not.toMatch(/IP|User-Agent|Referrer|token/i);
  });
});

function system(): SystemData { return { generatedAt: "2026-07-21T01:00:00Z", database: { state: "available", rowCount: 100, sizeBytes: 4096, lastSuccessfulWriteAt: "2026-07-21T00:59:00Z" }, process: { startedAt: "2026-07-20T00:00:00Z", droppedSinceStart: 2 }, privateListener: { state: "available", bindAddress: "127.0.0.1:18081", publicProxy: false } }; }
