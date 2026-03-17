# GravityPress

A Humanizer-family app for turning your physical notebooks into digital books.

## What It Does

1. **Scan** - Upload photos of your notebook pages
2. **Extract** - OCR text extraction and image description via cloud_image
3. **Transform** - Apply humanizer transformations (humanize, formalize, rewrite)
4. **Export** - Assemble selected pages into a markdown book

## Tech Stack

- **Frontend**: Vite + React + TypeScript (Cloudflare Pages)
- **Worker**: Cloudflare Workers API
- **Auth**: npe-api (shared Humanizer account system)
- **OCR**: cloud_image service
- **Monorepo**: pnpm workspaces

## Project Structure

```
apps/
  web/              # React frontend
  worker/           # Cloudflare Worker API
  electron/         # Reserved for desktop app
packages/
  schemas/          # Zod schemas (shared types)
  core/             # Pure SVG generators (offline)
  ui/               # Reserved for shared components
```

## Development

```bash
pnpm install         # Install dependencies
pnpm dev             # Run all dev servers
pnpm dev:web         # Web app only (http://localhost:5173)
pnpm dev:worker      # Worker only
pnpm build           # Build all packages
pnpm typecheck       # Type-check all packages
pnpm format          # Format with Prettier
```

## Environment Variables

Create `apps/web/.env.local`:

```
VITE_NPE_API_BASE=https://npe-api.tem-527.workers.dev
VITE_CLOUD_IMAGE_BASE=https://cloud-image.tem-527.workers.dev
```

## License

GPL-2.0 - See [LICENSE](LICENSE)
