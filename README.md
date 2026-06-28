<div align="center">
  <img src="frontend/src/assets/brand/busiscoming-logo-foreground.png" width="104" alt="BusIsComing logo">

# BusIsComing Website

BusIsComing Android App 的官方网站：介绍香港 Citybus 查询能力、提供在线路线试用查询，并交付 Android APK 下载入口。

[Official Website](https://www.busiscoming.com/)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react&logoColor=111)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![Go](https://img.shields.io/badge/Go-1.26-00add8?style=flat-square&logo=go&logoColor=white)](https://go.dev/)

</div>

## Overview

This repository contains the website for **BusIsComing**, an Android app focused on daily Hong Kong Citybus lookup. The site is intentionally scoped as a product homepage, not a general transport planner.

It currently provides:

- A modern, responsive homepage with real sanitized App screenshots.
- `zh-Hant`, `zh-Hans`, and `en` content switching.
- A live Citybus trial query backed by server-side route and ETA adapters.
- A controlled Android APK download endpoint.
- OpenAPI-first service contracts and deployment scripts for a single-server Caddy setup.
- SEO discovery basics: `robots.txt`, `sitemap.xml`, canonical metadata, and Search Console guidance.

> [!IMPORTANT]
> The website must stay aligned with the Android project facts in `/Users/jianglijie/AndroidStudioProjects/BusIsComming`. Do not expand copy or behavior into KMB, MTR, rail, ferry, walking, or full trip planning.

## Architecture

```text
Browser
  │
  ├─ Vite / React frontend
  │   ├─ Homepage content, i18n, screenshots, SEO metadata
  │   └─ Route query and download UI
  │
  └─ Go / Gin backend
      ├─ downloads bounded context
      │   └─ GET /api/downloads/android/latest
      └─ routes bounded context
          ├─ POST /api/routes/query_places
          ├─ POST /api/routes/query_routes
          └─ POST /api/routes/query_etas
```

The backend follows DDD boundaries:

- `domain`: business types, rules, and domain errors.
- `application`: use-case orchestration, caching, token validation, rate limiting.
- `infrastructure`: filesystem, Citybus, DATA.GOV.HK, HMAC, memory adapters, logging.
- `interfaces/http`: Gin routes, envelopes, request IDs, HTTP error mapping.

## Project Structure

```text
.
├── frontend/                  # React + Vite homepage
│   ├── public/                # favicon, robots.txt, sitemap.xml
│   └── src/
│       ├── assets/            # brand logo and sanitized App screenshots
│       ├── components/        # hero, query demo, sections, i18n
│       ├── content/           # tri-lingual content and product references
│       ├── services/          # route query client
│       └── tests/             # Vitest tests
├── backend/                   # Go service
│   ├── cmd/server/            # HTTP entrypoint
│   ├── downloads/android/     # managed current APK + metadata
│   └── internal/              # DDD contexts
├── shared/contracts/          # JSON Schema and OpenAPI contracts
├── specs/                     # Spec Kit feature artifacts
├── docs/                      # deployment, API, SEO notes
└── scripts/                   # local and remote deployment scripts
```

## Prerequisites

- Node.js compatible with the frontend lockfile
- npm
- Go 1.26.x
- Git
- For deployment: `bash`, `ssh`, `scp`, `tar`, `shasum`, `dig`, `file`, `mktemp`

Optional tools:

- Playwright browsers for end-to-end tests
- Android SDK build-tools `aapt` when replacing the managed APK

## Getting Started

Install frontend dependencies:

```bash
npm --prefix frontend install
```

Start the backend in one terminal:

```bash
cd backend
go run ./cmd/server
```

Start the frontend in another terminal:

```bash
npm --prefix frontend run dev
```

Open the app at:

```text
http://localhost:5173
```

The Vite dev server proxies `/api/*` to the Go backend.

### Useful Environment Variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `BUS_HTTP_HOST` | `0.0.0.0` | Backend listen host |
| `PORT` | `8080` | Backend listen port |
| `BUS_DOWNLOAD_ROOT` | `downloads/android` | Managed APK root |
| `ROUTE_QUERY_TOKEN_SECRET` | unset | HMAC secret for route tokens; set a non-empty value outside throwaway local runs |
| `FRONTEND_HOST` | `0.0.0.0` | Vite dev/preview host |
| `FRONTEND_PORT` | `5173` | Vite dev port |
| `BACKEND_HOST` | `0.0.0.0` | Backend host used by Vite proxy |
| `BACKEND_PORT` | `8080` | Backend port used by Vite proxy |

## Development Commands

Frontend:

```bash
npm --prefix frontend run test
npm --prefix frontend run build
npm --prefix frontend run test:e2e
```

Backend:

```bash
cd backend
go test ./...
go test -race ./internal/routes/application ./internal/routes/infrastructure/memory
```

OpenAPI:

```bash
npm --prefix frontend run openapi:lint
npm --prefix frontend run openapi:routes:lint
npm --prefix frontend run openapi:docs
```

Deployment script tests:

```bash
scripts/tests/deploy_test.sh
```

> [!NOTE]
> Playwright tests start their own backend and frontend servers using `frontend/playwright.config.ts`.

## API Contracts

OpenAPI is the source of truth for service APIs:

- `shared/contracts/openapi/download-api.openapi.yaml`
- `shared/contracts/openapi/route-query-api.openapi.yaml`

Generated previews are under:

- `shared/contracts/openapi/docs/download-api.html`
- `shared/contracts/openapi/docs/route-query-api.html`

The route query API uses a JSON envelope:

```json
{
  "requestId": "route-query-example",
  "data": {},
  "error": null
}
```

Frontend copy maps backend `error.code` values into tri-lingual user-facing messages.

## Android APK Management

The backend serves one current APK:

- APK: `backend/downloads/android/BusIsComing.apk`
- Metadata: `backend/downloads/android/current.json`
- Endpoint: `GET /api/downloads/android/latest`

To replace it:

```bash
backend/scripts/update_android_apk.py /path/to/BusIsComing.apk
```

Then verify:

```bash
cd backend
go test ./...
```

## Content, Assets, And Design

- Homepage content lives in `frontend/src/content/`.
- Brand assets live in `frontend/src/assets/brand/`.
- Real App screenshots are stored as sanitized copies in `frontend/src/assets/app-screenshots/real/`.
- New screenshots should update `frontend/src/assets/app-screenshots/real/manifest.json` and then run:

```bash
npm --prefix frontend run sanitize:screenshots
```

Current Figma/spec references are tracked in `specs/` and `frontend/src/content/sourceReferences.ts`.

> [!WARNING]
> Do not reference raw screenshots directly in the frontend. Use sanitized assets only.

## SEO

The site includes basic discovery signals:

- `frontend/public/robots.txt`
- `frontend/public/sitemap.xml`
- homepage canonical metadata in `frontend/index.html`
- deployment config that avoids returning homepage HTML for unknown paths

After deployment, follow:

- `docs/seo-first-indexing.md`

At minimum, verify:

```bash
curl https://www.busiscoming.com/robots.txt
curl https://www.busiscoming.com/sitemap.xml
curl -I https://www.busiscoming.com/not-a-real-page-for-seo-check
```

## Deployment

The project deploys to one Ubuntu 24.04 x86_64 server using immutable releases, Caddy, and systemd.

```bash
export BUS_DEPLOY_HOST=<server-ip>
export BUS_DEPLOY_DOMAIN=www.busiscoming.com

./scripts/deploy.sh deploy
./scripts/deploy.sh status
```

For Cloudflare-proxied DNS:

```bash
export BUS_DEPLOY_DNS_MODE=proxied
./scripts/deploy.sh deploy
```

Useful operations:

```bash
./scripts/deploy.sh list
./scripts/deploy.sh rollback
./scripts/deploy.sh logs --service backend
./scripts/deploy.sh logs --service caddy --lines 300
```

See `docs/deployment.md` for the full deployment model and operational boundaries.

## Project Guardrails

- User-visible website copy must support `zh-Hant`, `zh-Hans`, and `en`; `zh-Hant` and `en` copy must be localized with a natural, restrained product tone rather than literal translation.
- Product facts come from the Android BusIsComing project and this repo's specs.
- Scope is Hong Kong Citybus lookup only.
- Service APIs must remain OpenAPI-first.
- Server code must not use `panic` as business control flow.
- HTTP entrypoints must keep request logging and recovery enabled.
- New or complex project code should use focused naming and Chinese comments where they explain non-obvious rules, external constraints, state transitions, cache behavior, or degradation logic.

Spec Kit governance lives in:

- `.specify/memory/constitution.md`
- `AGENTS.md`
- `specs/`
