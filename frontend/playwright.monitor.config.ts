import { defineConfig } from "@playwright/test";

const publicHost = process.env.BUS_HTTP_HOST ?? "127.0.0.1";
const publicPort = process.env.PORT ?? process.env.BACKEND_PORT ?? "18082";
const privateHost = "127.0.0.1";
const privatePort = "18081";
const frontendHost = process.env.MONITOR_FRONTEND_HOST ?? "127.0.0.1";
const frontendPort = process.env.MONITOR_FRONTEND_PORT ?? "5185";

export default defineConfig({
  testDir: "./playwright-monitor",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: `http://${frontendHost}:${frontendPort}`,
    contextOptions: {
      reducedMotion: "reduce",
    },
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "cd ../backend && go run ./cmd/server",
      url: `http://${publicHost}:${publicPort}/healthz`,
      env: {
        BUS_HTTP_HOST: publicHost,
        PORT: publicPort,
        BUS_ANALYTICS_PRIVATE_PORT: privatePort,
        BUS_ANALYTICS_UI_ROOT: "../frontend/dist-monitor",
        GOCACHE: "/tmp/busiscoming-go-build",
      },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npm run dev:monitor -- --port ${frontendPort} --strictPort`,
      url: `http://${frontendHost}:${frontendPort}`,
      env: {
        MONITOR_FRONTEND_HOST: frontendHost,
        MONITOR_FRONTEND_PORT: frontendPort,
        BUS_ANALYTICS_PRIVATE_HOST: privateHost,
        BUS_ANALYTICS_PRIVATE_PORT: privatePort,
      },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: "monitor-desktop-1440",
      use: { viewport: { width: 1440, height: 1200 } },
    },
    {
      name: "monitor-mobile-390",
      use: { viewport: { width: 390, height: 844 }, isMobile: true },
    },
  ],
});
