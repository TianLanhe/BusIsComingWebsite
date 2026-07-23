import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const monitorHost = process.env.MONITOR_FRONTEND_HOST ?? "127.0.0.1";
const monitorPort = Number(process.env.MONITOR_FRONTEND_PORT ?? 5174);
const privateApiHost = process.env.BUS_ANALYTICS_PRIVATE_HOST ?? "127.0.0.1";
const privateApiPort = process.env.BUS_ANALYTICS_PRIVATE_PORT ?? "18081";

export default defineConfig({
  root: "monitor",
  publicDir: false,
  plugins: [react()],
  server: {
    host: monitorHost,
    port: monitorPort,
    proxy: {
      "/api/analytics": {
        target: `http://${privateApiHost}:${privateApiPort}`,
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: monitorHost,
    port: Number(process.env.MONITOR_PREVIEW_PORT ?? 4174),
  },
  build: {
    outDir: "../dist-monitor",
    emptyOutDir: true,
  },
});
