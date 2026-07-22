import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer } from "node:net";
import process from "node:process";

const root = new URL("../", import.meta.url);
const viteBin = new URL("node_modules/.bin/vite", root).pathname;

await assertMonitorConfigUnchanged();
await runCommand("npm", ["run", "build:public"]);
await verifyMode("dev", []);
await verifyMode("preview", ["preview"]);
console.log("vite-root-redirect verification passed for dev and preview");

async function verifyMode(mode, leadingArgs) {
  const port = await randomPort();
  const child = spawn(viteBin, [...leadingArgs, "--config", "vite.config.ts", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
    cwd: root,
    env: { ...process.env, FORCE_COLOR: "0" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { output += chunk; });
  try {
    const base = `http://127.0.0.1:${port}`;
    await waitUntilReady(base, child, () => output);
    await assertRedirect(base, "GET");
    await assertRedirect(base, "HEAD");
    const postStatus = await assertPassThrough(base, "POST", "/");
    const localeStatus = await assertSuccess(base, "/zh-hant/");
    const assetStatus = await assertSuccess(base, "/favicon.webp");
    const apiStatus = await assertPassThrough(base, "GET", "/api/__root_redirect_probe__");
    console.log(`${mode}: GET/HEAD=302, POST /=${postStatus}, locale=${localeStatus}, asset=${assetStatus}, api=${apiStatus} on ${port}`);
  } finally {
    child.kill("SIGTERM");
    await Promise.race([new Promise((resolve) => child.once("exit", resolve)), new Promise((resolve) => setTimeout(resolve, 3_000))]);
  }
}

async function assertRedirect(base, method) {
  const response = await fetch(`${base}/?verification=1`, { method, redirect: "manual" });
  if (response.status !== 302 || response.headers.get("location") !== "/zh-hant/") throw new Error(`${method} root did not return 302 /zh-hant/`);
  if ((await response.text()) !== "") throw new Error(`${method} root response body must be empty`);
}

async function assertSuccess(base, pathname) {
  const response = await fetch(base + pathname, { redirect: "manual" });
  if (!response.ok || response.status === 302) throw new Error(`${pathname} did not retain its Vite behavior: ${response.status}`);
  return response.status;
}

async function assertPassThrough(base, method, pathname) {
  const response = await fetch(base + pathname, { method, redirect: "manual" });
  if (response.status === 302 || response.headers.has("location")) throw new Error(`${method} ${pathname} was unexpectedly redirected`);
  return response.status;
}

async function waitUntilReady(base, child, getOutput) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode != null) throw new Error(`Vite exited before readiness:\n${getOutput()}`);
    try {
      const response = await fetch(`${base}/favicon.webp`);
      if (response.ok) return;
    } catch { /* process is still starting */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Vite readiness timed out:\n${getOutput()}`);
}

async function assertMonitorConfigUnchanged() {
  const source = await readFile(new URL("vite.monitor.config.ts", root), "utf8");
  if (source.includes("publicRootRedirect") || source.includes("busiscoming-public-root-redirect")) throw new Error("monitor Vite config must not install the public root redirect plugin");
}

function randomPort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, env: process.env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(" ")} exited ${code}`)));
  });
}
