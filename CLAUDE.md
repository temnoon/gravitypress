# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GravityPress is a Humanizer-family app for creating customizable notebook designs with visual design tools. The primary focus is a Polar Graph Designer that creates circular/radial graph patterns as SVG assets for printable notebooks. The app works offline-first for generation/preview/export, with optional cloud features (preset sync, store, gifting) requiring authentication via npe-api.

## Commands

```bash
pnpm install         # Install all dependencies
pnpm build           # Build all packages and apps
pnpm dev             # Run all dev servers in parallel
pnpm dev:web         # Run web app only (Vite, http://localhost:5173)
pnpm dev:worker      # Run worker only (Wrangler)
pnpm typecheck       # Type-check all packages
pnpm format          # Format code with Prettier
```

## Architecture

**Monorepo Structure (pnpm workspaces):**

```
apps/
  web/              # Vite/React/TS frontend (Cloudflare Pages)
  worker/           # Cloudflare Worker API (auth, presets, catalog)
  electron/         # Reserved for offline-first desktop app
packages/
  schemas/          # Zod schemas shared across all apps
  core/             # Pure SVG generator logic (no network, no DOM)
  ui/               # Reserved for shared UI components
```

**Key Design Principles:**
- `@gravitypress/core` is network-free and DOM-free - usable in browser, worker, and Node
- `@gravitypress/schemas` defines all request/response types with Zod validation
- Generator runs client-side; server is optional for cloud features
- Authentication via npe-api (`https://npe-api.tem-527.workers.dev`)

**Data Flow:**
1. User configures polar grid in web UI
2. `@gravitypress/core/renderPolarGridSVG()` generates SVG string
3. Export: direct SVG download (always offline) or PDF via browser print
4. Cloud sync (authenticated): presets saved via worker API to R2

## Schemas

`packages/schemas/src/index.ts` defines:
- `PolarGridConfig` - all parameters for polar graph generation
- `RenderRequest` / `RenderResponse` - API contract for server-side rendering

## Worker API Endpoints

- `POST /api/render/svg` - Public, renders SVG from config
- `GET /health` - Health check
- `/api/presets/*` - Auth-required, preset CRUD (stub)
- `/api/catalog/*` - Auth-required, catalog listing (stub)
- `/api/gift/*` - Auth-required, gifting (stub)

## Environment Variables

**apps/web/.env.local:**
```
VITE_GP_WORKER_BASE=https://gravitypress.humanizer.com
VITE_NPE_API_BASE=https://npe-api.tem-527.workers.dev
```

**apps/worker (wrangler.toml or secrets):**
```
NPE_API_BASE=https://npe-api.tem-527.workers.dev
```

## Authentication Pattern

Bearer token auth via npe-api:
1. Login via npe-api returns JWT
2. Frontend stores token, sends `Authorization: Bearer <token>`
3. Worker validates via `POST /auth/verify` to npe-api
4. Offline mode: all generation works without auth, cloud features fail gracefully
