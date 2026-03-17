import { DotGridConfig, PAPER_DIMENSIONS } from "@gravitypress/schemas";

/**
 * Render a dot grid page as SVG (print-vector).
 * No DOM usage. No network. Deterministic output.
 */
export function renderDotGridSVG(cfg: DotGridConfig): string {
  const dims = PAPER_DIMENSIONS[cfg.paper];
  const width = dims.width;
  const height = dims.height;

  const elements: string[] = [];

  // Calculate drawable area
  const startX = cfg.marginLeft;
  const endX = width - cfg.marginRight;
  const startY = cfg.marginTop;
  const endY = height - cfg.marginBottom;

  // Draw dots
  let y = startY;
  while (y <= endY) {
    let x = startX;
    while (x <= endX) {
      elements.push(
        `  <circle cx="${x.toFixed(4)}" cy="${y.toFixed(4)}" r="${cfg.dotRadius.toFixed(4)}" fill="${cfg.dotColor}"/>`
      );
      x += cfg.dotSpacing;
    }
    y += cfg.dotSpacing;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}in" height="${height}in" viewBox="0 0 ${width} ${height}">
  <rect x="0" y="0" width="${width}" height="${height}" fill="white"/>
${elements.join('\n')}
</svg>`;
}
