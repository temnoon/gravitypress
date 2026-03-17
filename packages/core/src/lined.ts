import { LinedPageConfig, PAPER_DIMENSIONS } from "@gravitypress/schemas";

/**
 * Render a lined page as SVG (print-vector).
 * No DOM usage. No network. Deterministic output.
 */
export function renderLinedPageSVG(cfg: LinedPageConfig): string {
  const dims = PAPER_DIMENSIONS[cfg.paper];
  const width = dims.width;
  const height = dims.height;

  const elements: string[] = [];

  // Calculate drawable area
  const startX = cfg.marginLeft;
  const endX = width - cfg.marginRight;
  const startY = cfg.marginTop;
  const endY = height - cfg.marginBottom;

  // Convert thickness from points to inches
  const lineThickness = cfg.lineThickness / 72;
  const marginLineThickness = cfg.marginLineThickness / 72;

  // Draw horizontal lines
  let y = startY;
  while (y <= endY) {
    elements.push(
      `  <line x1="${startX.toFixed(4)}" y1="${y.toFixed(4)}" ` +
      `x2="${endX.toFixed(4)}" y2="${y.toFixed(4)}" ` +
      `stroke="${cfg.lineColor}" stroke-width="${lineThickness.toFixed(4)}"/>`
    );
    y += cfg.lineSpacing;
  }

  // Draw margin line (vertical red line)
  if (cfg.showMarginLine) {
    elements.push(
      `  <line x1="${cfg.marginLinePosition.toFixed(4)}" y1="${startY.toFixed(4)}" ` +
      `x2="${cfg.marginLinePosition.toFixed(4)}" y2="${endY.toFixed(4)}" ` +
      `stroke="${cfg.marginLineColor}" stroke-width="${marginLineThickness.toFixed(4)}"/>`
    );
  }

  // Draw header line (thicker line at top)
  if (cfg.showHeaderLine) {
    const headerY = startY + cfg.headerLineOffset;
    elements.push(
      `  <line x1="${startX.toFixed(4)}" y1="${headerY.toFixed(4)}" ` +
      `x2="${endX.toFixed(4)}" y2="${headerY.toFixed(4)}" ` +
      `stroke="${cfg.lineColor}" stroke-width="${(lineThickness * 2).toFixed(4)}"/>`
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}in" height="${height}in" viewBox="0 0 ${width} ${height}">
  <rect x="0" y="0" width="${width}" height="${height}" fill="white"/>
${elements.join('\n')}
</svg>`;
}
