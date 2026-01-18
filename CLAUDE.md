# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GravityPress is a Node.js/Express web application for creating customizable notebook designs with visual design tools. The primary focus is a Polar Graph Designer that creates circular/radial graph patterns as SVG assets for printable notebooks.

## Commands

```bash
npm start        # Run production server (node server.js)
npm run dev      # Run dev server with auto-reload (nodemon server.js)
```

The app runs at http://localhost:3000. The Polar Graph Designer is at `/api/polar-graph`.

No test or lint commands are currently configured.

## Architecture

**Client-Server Structure:**
- `server.js` - Express entry point, mounts API routers, serves static files from `public/`
- `public/index.html` - Single-page app for Polar Graph Designer
- `public/js/polarGraph.js` - Main client-side logic using SVG.js 3.1.1 for rendering
- `src/api/` - Express route handlers (polarGraph.js, notebookBuilder.js)
- `src/config/config.json` - Centralized configuration for API paths and defaults

**Key Technical Details:**
- SVG rendering uses SVG.js library loaded from CDN
- Client state persists to browser localStorage
- Backend API routes exist but are mostly stub implementations
- React components exist in `src/components/` but are not integrated/bundled yet

**Rendering Pipeline:**
The polar graph generates an SVG canvas (default 1500x1500px) with configurable circles, spokes, colors, and gradients. Export to SVG is supported.

## Configuration

`src/config/config.json` defines:
- Server port (3000)
- API endpoints (`/api/polar-graph`, `/api/notebook-builder`)
- Default values for circles, spokes, page size, orientation
