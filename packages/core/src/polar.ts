import { PolarGridConfig } from "@gravitypress/schemas";

/**
 * Render a polar grid as SVG (print-vector).
 * No DOM usage. No network. Deterministic output.
 */
export function renderPolarGridSVG(cfg: PolarGridConfig): string {
  // NOTE: Implement full geometry later.
  // For setup: return a minimal valid SVG as a sanity check.
  const width = cfg.paper === "A4" ? 8.27 : 8.5;
  const height = cfg.paper === "A4" ? 11.69 : 11;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}in" height="${height}in" viewBox="0 0 ${width} ${height}">
  <rect x="0" y="0" width="${width}" height="${height}" fill="white"/>
  <text x="${width/2}" y="${height/2}" font-size="0.2" text-anchor="middle" fill="#444">
    GravityPress polar grid stub (v1)
  </text>
</svg>`;
}
