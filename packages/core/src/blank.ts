import { BlankPageConfig, PAPER_DIMENSIONS } from "@gravitypress/schemas";

/**
 * Render a blank page as SVG.
 * Simple but useful for notebook composition.
 */
export function renderBlankPageSVG(cfg: BlankPageConfig): string {
  const dims = PAPER_DIMENSIONS[cfg.paper];
  const width = dims.width;
  const height = dims.height;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}in" height="${height}in" viewBox="0 0 ${width} ${height}">
  <rect x="0" y="0" width="${width}" height="${height}" fill="${cfg.backgroundColor}"/>
</svg>`;
}
