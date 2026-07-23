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

  it("formats positive storage and uptime without rounding them down", async () => {
    const compact = system();
    compact.database.sizeBytes = 512;
    compact.process.uptimeMs = 30_000;
    render(<MonitoringI18nProvider initialLocale="zh-Hans"><FilterProvider><SystemPage loadSystem={async () => compact} /></FilterProvider></MonitoringI18nProvider>);
    expect(await screen.findByText("512 B")).toBeInTheDocument();
    expect(screen.getByText("30 秒")).toBeInTheDocument();
    expect(screen.queryByText("监听 127.0.0.1:18081")).not.toBeInTheDocument();
  });

  it.each([
    [30_000, "30 秒"],
    [60_000, "1 分鐘"],
    [3_600_000, "1 小時"],
  ])("uses Hong Kong Traditional Chinese duration units for %dms", async (uptimeMs, expected) => {
    const compact = system();
    compact.process.uptimeMs = uptimeMs;
    render(<MonitoringI18nProvider initialLocale="zh-Hant"><FilterProvider><SystemPage loadSystem={async () => compact} /></FilterProvider></MonitoringI18nProvider>);
    expect(await screen.findByText(expected)).toBeInTheDocument();
  });

  it.each([
    ["zh-Hans", "<1 秒"],
    ["zh-Hant", "<1 秒"],
    ["en", "<1 s"],
  ] as const)("keeps positive subsecond uptime visible in %s", async (locale, expected) => {
    const compact = system();
    compact.process.uptimeMs = 499;
    render(<MonitoringI18nProvider initialLocale={locale}><FilterProvider><SystemPage loadSystem={async () => compact} /></FilterProvider></MonitoringI18nProvider>);
    expect(await screen.findByText(expected)).toBeInTheDocument();
    expect(screen.queryByText(/^0 (秒|s)$/)).not.toBeInTheDocument();
  });
});

function system(): SystemData { return { generatedAt: "2026-07-21T01:00:00Z", database: { state: "available", rowCount: 100, todayLocalDate: "2026-07-21", todayRowCount: 2, sizeBytes: 4096, lastSuccessfulWriteAt: "2026-07-21T00:59:00Z" }, sqlite: { version: "3.50.4", journalMode: "wal", schemaVersion: "001" }, process: { startedAt: "2026-07-20T00:00:00Z", uptimeMs: 2, droppedSinceStart: 2 }, privateListener: { state: "available", bindAddress: "127.0.0.1:18081", publicProxy: false } }; }
