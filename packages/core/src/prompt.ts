import { PAPER_DIMENSIONS } from "@gravitypress/schemas";
import type { PromptPageConfigType as PromptPageConfig } from "@gravitypress/schemas";

/**
 * Render a prompt page as SVG.
 * Top area: prompt text + optional attribution.
 * Bottom area: lined, dot grid, or blank space for the reader's response.
 * No DOM usage. No network. Deterministic output.
 */
export function renderPromptPageSVG(cfg: PromptPageConfig): string {
  const dims = PAPER_DIMENSIONS[cfg.paper];
  const width = dims.width;
  const height = dims.height;

  const elements: string[] = [];

  // Drawable area
  const startX = cfg.marginLeft;
  const endX = width - cfg.marginRight;
  const startY = cfg.marginTop;
  const endY = height - cfg.marginBottom;
  const drawableWidth = endX - startX;
  const drawableHeight = endY - startY;

  // Split into prompt area and response area
  const promptAreaHeight = drawableHeight * cfg.promptAreaFraction;
  const dividerY = startY + promptAreaHeight;
  const responseStartY = dividerY + (cfg.showDivider ? 0.15 : 0.05);

  // ---- Prompt Area ----

  // Font size in inches (from points)
  const fontSize = cfg.promptFontSize / 72;
  const lineHeight = fontSize * 1.6;

  // Wrap prompt text into lines
  // Approximate: ~10 chars per inch at typical font size
  const charsPerLine = Math.floor(drawableWidth / (fontSize * 0.55));
  const promptLines = wrapText(cfg.promptText, charsPerLine);

  // Render prompt text
  let textY = startY + lineHeight;
  for (const line of promptLines) {
    if (textY > dividerY - lineHeight) break; // don't overflow into response area
    elements.push(
      `  <text x="${startX.toFixed(4)}" y="${textY.toFixed(4)}" ` +
        `font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize.toFixed(4)}" ` +
        `font-style="italic" fill="#333333">` +
        escapeXml(line) +
        `</text>`
    );
    textY += lineHeight;
  }

  // Source attribution (smaller, right-aligned)
  if (cfg.sourceAttribution) {
    const attrFontSize = fontSize * 0.75;
    const attrY = dividerY - attrFontSize * 0.5;
    elements.push(
      `  <text x="${endX.toFixed(4)}" y="${attrY.toFixed(4)}" ` +
        `font-family="Georgia, 'Times New Roman', serif" font-size="${attrFontSize.toFixed(4)}" ` +
        `fill="#888888" text-anchor="end">` +
        escapeXml(`— ${cfg.sourceAttribution}`) +
        `</text>`
    );
  }

  // ---- Divider ----

  if (cfg.showDivider) {
    const divThickness = 0.5 / 72; // 0.5pt
    elements.push(
      `  <line x1="${startX.toFixed(4)}" y1="${dividerY.toFixed(4)}" ` +
        `x2="${endX.toFixed(4)}" y2="${dividerY.toFixed(4)}" ` +
        `stroke="${cfg.dividerColor}" stroke-width="${divThickness.toFixed(4)}" ` +
        `stroke-dasharray="0.05,0.03"/>`
    );
  }

  // ---- Response Area ----

  if (cfg.responseType === "lined") {
    const lineThickness = 0.5 / 72;
    let y = responseStartY;
    while (y <= endY) {
      elements.push(
        `  <line x1="${startX.toFixed(4)}" y1="${y.toFixed(4)}" ` +
          `x2="${endX.toFixed(4)}" y2="${y.toFixed(4)}" ` +
          `stroke="${cfg.lineColor}" stroke-width="${lineThickness.toFixed(4)}"/>`
      );
      y += cfg.lineSpacing;
    }
  } else if (cfg.responseType === "dot") {
    let y = responseStartY;
    while (y <= endY) {
      let x = startX;
      while (x <= endX) {
        elements.push(
          `  <circle cx="${x.toFixed(4)}" cy="${y.toFixed(4)}" ` +
            `r="${cfg.dotRadius.toFixed(4)}" fill="${cfg.dotColor}"/>`
        );
        x += cfg.dotSpacing;
      }
      y += cfg.dotSpacing;
    }
  }
  // "blank" — no marks in response area

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}in" height="${height}in" viewBox="0 0 ${width} ${height}">
  <rect x="0" y="0" width="${width}" height="${height}" fill="white"/>
${elements.join("\n")}
</svg>`;
}

/** Simple word-wrap for SVG text (no DOM available) */
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (current.length + word.length + 1 > maxChars && current.length > 0) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Escape XML special characters */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
