import { CartesianGridConfig, PAPER_DIMENSIONS } from "@gravitypress/schemas";

/**
 * Render a cartesian (graph paper) grid as SVG (print-vector).
 * No DOM usage. No network. Deterministic output.
 */
export function renderCartesianGridSVG(cfg: CartesianGridConfig): string {
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
  const majorLineThickness = cfg.majorLineThickness / 72;

  // Draw vertical lines
  let x = startX;
  let xIndex = 0;
  while (x <= endX) {
    const isMajor = cfg.showMajorLines && xIndex % cfg.majorLineEvery === 0;
    const color = isMajor ? cfg.majorLineColor : cfg.lineColor;
    const thickness = isMajor ? majorLineThickness : lineThickness;

    elements.push(
      `  <line x1="${x.toFixed(4)}" y1="${startY.toFixed(4)}" ` +
      `x2="${x.toFixed(4)}" y2="${endY.toFixed(4)}" ` +
      `stroke="${color}" stroke-width="${thickness.toFixed(4)}"/>`
    );
    x += cfg.gridSpacing;
    xIndex++;
  }

  // Draw horizontal lines
  let y = startY;
  let yIndex = 0;
  while (y <= endY) {
    const isMajor = cfg.showMajorLines && yIndex % cfg.majorLineEvery === 0;
    const color = isMajor ? cfg.majorLineColor : cfg.lineColor;
    const thickness = isMajor ? majorLineThickness : lineThickness;

    elements.push(
      `  <line x1="${startX.toFixed(4)}" y1="${y.toFixed(4)}" ` +
      `x2="${endX.toFixed(4)}" y2="${y.toFixed(4)}" ` +
      `stroke="${color}" stroke-width="${thickness.toFixed(4)}"/>`
    );
    y += cfg.gridSpacing;
    yIndex++;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}in" height="${height}in" viewBox="0 0 ${width} ${height}">
  <rect x="0" y="0" width="${width}" height="${height}" fill="white"/>
${elements.join('\n')}
</svg>`;
}
