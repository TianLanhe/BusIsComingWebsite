import { describe, expect, it, vi } from "vitest";
import { createViteRootRedirectMiddleware } from "../../viteRootRedirect";

describe("public Vite root redirect", () => {
  it.each(["GET", "HEAD"])("redirects %s exact root to Traditional Chinese with an empty body", (method) => {
    const next = vi.fn();
    const response = responseRecorder();
    createViteRootRedirectMiddleware()({ method, url: "/?source=local" } as never, response as never, next);
    expect(response.statusCode).toBe(302);
    expect(response.headers.Location).toBe("/zh-hant/");
    expect(response.body).toBe("");
    expect(next).not.toHaveBeenCalled();
  });

  it.each([
    ["POST", "/"],
    ["GET", "/zh-hant/"],
    ["GET", "/favicon.webp"],
    ["GET", "/api/downloads/android/latest"],
  ])("passes %s %s to the next Vite handler", (method, url) => {
    const next = vi.fn();
    const response = responseRecorder();
    createViteRootRedirectMiddleware()({ method, url } as never, response as never, next);
    expect(next).toHaveBeenCalledOnce();
    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({});
  });
});

function responseRecorder() {
  return {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: "",
    writeHead(statusCode: number, headers: Record<string, string>) { this.statusCode = statusCode; Object.assign(this.headers, headers); return this; },
    end(body = "") { this.body += body; },
  };
}
