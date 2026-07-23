import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FilterProvider } from "../app/FilterProvider";
import { MonitoringI18nProvider } from "../app/MonitoringI18nProvider";
import type { SystemData } from "../services/analyticsTypes";
import { SystemPage } from "./SystemPage";

describe("SystemPage", () => {
  it("shows exactly twelve live technical facts without duplicate configuration sections", async () => {
    render(<MonitoringI18nProvider initialLocale="zh-Hans"><FilterProvider><SystemPage loadSystem={async () => system()} /></FilterProvider></MonitoringI18nProvider>);
    expect((await screen.findAllByTestId("system-fact")).length).toBe(12);
    expect(screen.getByText("SQLite 明细存储")).toBeInTheDocument();
    expect(screen.getByText("SQLite 运行信息")).toBeInTheDocument();
    expect(screen.getByText("服务运行信息")).toBeInTheDocument();
    expect(screen.queryByText("存储概况")).not.toBeInTheDocument();
    expect(screen.queryByText("隔离与降级路径")).not.toBeInTheDocument();
    expect(screen.queryByText("配置事实")).not.toBeInTheDocument();
    expect(screen.getByTestId("system-workspace").textContent).not.toMatch(/IP|User-Agent|Referrer|token/i);
  });

  it("keeps successful facts visible when one probe has no data", async () => {
    const partial = system();
    partial.sqlite.journalMode = null;
    partial.privateListener.bindAddress = null;
    render(<MonitoringI18nProvider initialLocale="zh-Hans"><FilterProvider><SystemPage loadSystem={async () => partial} /></FilterProvider></MonitoringI18nProvider>);
    expect((await screen.findAllByText("无数据")).length).toBe(2);
    expect(screen.getByText("3.50.4")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });
});

function system(): SystemData { return { generatedAt: "2026-07-21T01:00:00Z", database: { state: "available", rowCount: 100, todayLocalDate: "2026-07-21", todayRowCount: 2, sizeBytes: 4096, lastSuccessfulWriteAt: "2026-07-21T00:59:00Z" }, sqlite: { version: "3.50.4", journalMode: "wal", schemaVersion: "001" }, process: { startedAt: "2026-07-20T00:00:00Z", uptimeMs: 2, droppedSinceStart: 2 }, privateListener: { state: "available", bindAddress: "127.0.0.1:18081", publicProxy: false } }; }
