import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const frontendHost = process.env.FRONTEND_HOST ?? "0.0.0.0";
const frontendPort = Number(process.env.FRONTEND_PORT ?? 5173);
const backendHost = process.env.BACKEND_HOST ?? "0.0.0.0";
const backendPort = process.env.BACKEND_PORT ?? process.env.PORT ?? "8080";

export default defineConfig({
  plugins: [react()],
  server: {
    host: frontendHost,
    port: frontendPort,
    proxy: {
      "/api": {
        target: `http://${backendHost === "0.0.0.0" ? "127.0.0.1" : backendHost}:${backendPort}`,
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: frontendHost,
    port: Number(process.env.FRONTEND_PREVIEW_PORT ?? process.env.FRONTEND_HTTP_PORT ?? 4173),
  },
});
