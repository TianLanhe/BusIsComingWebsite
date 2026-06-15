import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/tests/**/*.{test,spec}.{ts,tsx}"],
    setupFiles: "./src/tests/setup.ts",
    css: true,
    environmentOptions: {
      jsdom: {
        url: "http://127.0.0.1:5173/",
      },
    },
  },
});
