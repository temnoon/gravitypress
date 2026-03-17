import { PolarGridConfig, PAPER_DIMENSIONS } from "@gravitypress/schemas";

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

function interpolateColor(startHex: string, endHex: string, progress: number): string {
  const s = hexToRgb(startHex);
  const e = hexToRgb(endHex);
  const r = Math.round(s.r + (e.r - s.r) * progress);
  const g = Math.round(s.g + (e.g - s.g) * progress);
  const b = Math.round(s.b + (e.b - s.b) * progress);
  return `rgb(${r},${g},${b})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
}

function getColor(
  mode: string,
  solidColor: string,
  index: number,
  total: number,
  startHue: number,
  endHue: number,
  gradientStart?: string,
  gradientEnd?: string
): string {
  if (mode === "SOLID") return solidColor;

  if (mode === "RAINBOW") {
    const t = total > 1 ? index / (total - 1) : 0;
    const hue = startHue + t * (endHue - startHue);
    return hslToHex(hue % 360, 70, 45);
  }

  if ((mode === "GRADIENT_PLUS" || mode === "GRADIENT") && gradientStart && gradientEnd) {
    const t = total > 1 ? index / (total - 1) : 0;
    return interpolateColor(gradientStart, gradientEnd, t);
  }

  return solidColor;
}

function getStrokeWidth(thicknessArray: number[], index: number): number {
  if (thicknessArray.length === 0) return 0.35;
  return thicknessArray[index % thicknessArray.length] / 72;
}

/**
 * Render a polar grid as SVG (print-vector).
 * No DOM usage. No network. Deterministic output.
 */
export function renderPolarGridSVG(cfg: PolarGridConfig): string {
  const dims = PAPER_DIMENSIONS[cfg.paper];
  const width = dims.width;
  const height = dims.height;

  const drawableWidth = width - cfg.marginInner - cfg.marginOuter;
  const drawableHeight = height - cfg.marginTop - cfg.marginBottom;
  const cx = cfg.marginInner + drawableWidth / 2;
  const cy = cfg.marginTop + drawableHeight / 2;
  const maxRadius = Math.min(drawableWidth, drawableHeight) / 2;

  const actualCircles = cfg.extendCircles
    ? Math.ceil(Math.sqrt(2) * cfg.circles)
    : cfg.circles;

  const elements: string[] = [];

  // Draw circles
  for (let i = actualCircles; i >= 1; i--) {
    const radius = (i / cfg.circles) * maxRadius;
    const color = getColor(
      cfg.circleColorMode, cfg.circleSolid, i - 1, actualCircles,
      cfg.rainbowStartHue, cfg.rainbowEndHue,
      cfg.circleGradientStart, cfg.circleGradientEnd
    );
    const strokeWidth = getStrokeWidth(cfg.circleThickness, i - 1);
    elements.push(
      `  <circle cx="${cx.toFixed(4)}" cy="${cy.toFixed(4)}" r="${radius.toFixed(4)}" ` +
      `fill="none" stroke="${color}" stroke-width="${strokeWidth.toFixed(4)}"/>`
    );
  }

  // Draw spokes
  for (let i = 0; i < cfg.spokes; i++) {
    const angle = (i / cfg.spokes) * 2 * Math.PI - Math.PI / 2;

    let startRadius = 0;
    if (cfg.spokeStartCircles.length > 0) {
      const startCircle = cfg.spokeStartCircles[i % cfg.spokeStartCircles.length];
      startRadius = (startCircle / cfg.circles) * maxRadius;
    }

    let endRadius = maxRadius;
    if (cfg.spokeEndCircles && cfg.spokeEndCircles.length > 0) {
      const endCircle = cfg.spokeEndCircles[i % cfg.spokeEndCircles.length];
      endRadius = (endCircle / cfg.circles) * maxRadius;
    }

    const x1 = cx + Math.cos(angle) * startRadius;
    const y1 = cy + Math.sin(angle) * startRadius;
    const x2 = cx + Math.cos(angle) * endRadius;
    const y2 = cy + Math.sin(angle) * endRadius;

    const color = getColor(
      cfg.spokeColorMode, cfg.spokeSolid, i, cfg.spokes,
      cfg.rainbowStartHue, cfg.rainbowEndHue,
      cfg.spokeGradientStart, cfg.spokeGradientEnd
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
