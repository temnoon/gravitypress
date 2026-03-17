import { PolarGridConfig } from "@gravitypress/schemas";

/**
 * Convert HSL to hex color
 */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Get color for an element based on color mode
 */
function getColor(
  mode: "SOLID" | "GRADIENT" | "RAINBOW",
  solidColor: string,
  index: number,
  total: number,
  startHue: number,
  endHue: number
): string {
  if (mode === "SOLID") {
    return solidColor;
  }

  if (mode === "RAINBOW" || mode === "GRADIENT") {
    const t = total > 1 ? index / (total - 1) : 0;
    const hue = startHue + t * (endHue - startHue);
    return hslToHex(hue % 360, 70, 45);
  }

  return solidColor;
}

/**
 * Get stroke width for an element, cycling through thickness array
 */
function getStrokeWidth(thicknessArray: number[], index: number): number {
  if (thicknessArray.length === 0) return 0.35;
  return thicknessArray[index % thicknessArray.length] / 72; // Convert points to inches
}

/**
 * Render a polar grid as SVG (print-vector).
 * No DOM usage. No network. Deterministic output.
 */
export function renderPolarGridSVG(cfg: PolarGridConfig): string {
  // Paper dimensions in inches
  const width = cfg.paper === "A4" ? 8.27 : 8.5;
  const height = cfg.paper === "A4" ? 11.69 : 11;

  // Calculate drawable area
  const drawableWidth = width - cfg.marginInner - cfg.marginOuter;
  const drawableHeight = height - cfg.marginTop - cfg.marginBottom;

  // Center point
  const cx = cfg.marginInner + drawableWidth / 2;
  const cy = cfg.marginTop + drawableHeight / 2;

  // Maximum radius (fit within drawable area)
  const maxRadius = Math.min(drawableWidth, drawableHeight) / 2;

  // Build SVG elements
  const elements: string[] = [];

  // Draw circles (from outer to inner for proper layering)
  for (let i = cfg.circles; i >= 1; i--) {
    const radius = (i / cfg.circles) * maxRadius;
    const color = getColor(
      cfg.circleColorMode,
      cfg.circleSolid,
      i - 1,
      cfg.circles,
      cfg.rainbowStartHue,
      cfg.rainbowEndHue
    );
    const strokeWidth = getStrokeWidth(cfg.circleThickness, i - 1);

    elements.push(
      `  <circle cx="${cx.toFixed(4)}" cy="${cy.toFixed(4)}" r="${radius.toFixed(4)}" ` +
      `fill="none" stroke="${color}" stroke-width="${strokeWidth.toFixed(4)}"/>`
    );
  }

  // Draw spokes
  for (let i = 0; i < cfg.spokes; i++) {
    const angle = (i / cfg.spokes) * 2 * Math.PI - Math.PI / 2; // Start from top

    // Determine starting radius for this spoke
    let startRadius = 0;
    if (cfg.spokeStartCircles.length > 0) {
      const startCircle = cfg.spokeStartCircles[i % cfg.spokeStartCircles.length];
      startRadius = (startCircle / cfg.circles) * maxRadius;
    }

    const x1 = cx + Math.cos(angle) * startRadius;
    const y1 = cy + Math.sin(angle) * startRadius;
    const x2 = cx + Math.cos(angle) * maxRadius;
    const y2 = cy + Math.sin(angle) * maxRadius;

    const color = getColor(
      cfg.spokeColorMode,
      cfg.spokeSolid,
      i,
      cfg.spokes,
      cfg.rainbowStartHue,
      cfg.rainbowEndHue
    );
    const strokeWidth = getStrokeWidth(cfg.spokeThickness, i);

    elements.push(
      `  <line x1="${x1.toFixed(4)}" y1="${y1.toFixed(4)}" ` +
      `x2="${x2.toFixed(4)}" y2="${y2.toFixed(4)}" ` +
      `stroke="${color}" stroke-width="${strokeWidth.toFixed(4)}"/>`
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}in" height="${height}in" viewBox="0 0 ${width} ${height}">
  <rect x="0" y="0" width="${width}" height="${height}" fill="white"/>
${elements.join('\n')}
</svg>`;
}
