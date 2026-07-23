import type { Connect, Plugin } from "vite";

export function createViteRootRedirectMiddleware(): Connect.NextHandleFunction {
  return (request, response, next) => {
    const method = request.method?.toUpperCase();
    const pathname = new URL(request.url ?? "/", "http://vite.local").pathname;
    // 只处理公开开发入口的 GET/HEAD 精确根 pathname；POST、locale、资源和 API 全部交回 Vite 原链路。
    if ((method !== "GET" && method !== "HEAD") || pathname !== "/") {
      next();
      return;
    }
    response.writeHead(302, { Location: "/zh-hant/", "Content-Length": "0" });
    response.end();
  };
}

export function publicRootRedirect(): Plugin {
  const install = (middlewares: Connect.Server) => middlewares.use(createViteRootRedirectMiddleware());
  return {
    name: "busiscoming-public-root-redirect",
    enforce: "pre",
    configureServer(server) { install(server.middlewares); },
    configurePreviewServer(server) { install(server.middlewares); },
  };
}
