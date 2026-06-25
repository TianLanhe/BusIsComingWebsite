import { defineConfig } from "@playwright/test";

const backendHost = process.env.BUS_HTTP_HOST ?? "0.0.0.0";
const backendPort = process.env.PORT ?? process.env.BACKEND_PORT ?? "18080";
const frontendHost = process.env.FRONTEND_HOST ?? "0.0.0.0";
const frontendPort = process.env.FRONTEND_PORT ?? "5184";
const browserHost = process.env.PLAYWRIGHT_HOST ?? "127.0.0.1";

export default defineConfig({
  testDir: "./playwright",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: `http://${browserHost}:${frontendPort}`,
    reducedMotion: "no-preference",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "cd ../backend && go run ./cmd/server",
      url: `http://${browserHost}:${backendPort}/healthz`,
      env: {
        BUS_HTTP_HOST: backendHost,
        PORT: backendPort,
        GOCACHE: "/tmp/busiscoming-go-build",
      },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npm run dev -- --port ${frontendPort} --strictPort`,
      url: `http://${browserHost}:${frontendPort}`,
      env: {
        FRONTEND_HOST: frontendHost,
        FRONTEND_PORT: frontendPort,
        BACKEND_HOST: browserHost,
        BACKEND_PORT: backendPort,
      },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: "desktop-1440",
      use: { viewport: { width: 1440, height: 960 } },
    },
    {
      name: "mobile-390",
      use: { viewport: { width: 390, height: 844 }, isMobile: true },
    },
  ],
});
