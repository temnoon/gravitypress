import {
  PDFDocument,
  PDFPage,
  StandardFonts,
  rgb,
  PDFFont,
} from "pdf-lib";
import type { PrintSpec } from "@gravitypress/schemas";
import { TRIM_SIZE_LABELS } from "@gravitypress/schemas";

// ============================================
// Types
// ============================================

/** Trim sizes in inches, keyed by Lulu trim code */
const TRIM_INCHES: Record<string, { w: number; h: number }> = {
  "0600X0900": { w: 6, h: 9 },
  "0550X0850": { w: 5.5, h: 8.5 },
  "0583X0827": { w: 5.83, h: 8.27 },
  "0850X1100": { w: 8.5, h: 11 },
};

const PTS_PER_INCH = 72;

/** Standard bleed for Lulu: 0.125 inches on each side */
const BLEED_INCHES = 0.125;

export interface TextStyle {
  fontFamily?: "times" | "helvetica" | "courier";
  fontSize?: number; // points
  lineHeight?: number; // multiplier
  color?: { r: number; g: number; b: number }; // 0-1 each
  italic?: boolean;
  bold?: boolean;
  alignment?: "left" | "center" | "right";
}

export interface PageNumberConfig {
  startPage?: number;
  position?: "bottom-center" | "bottom-outside" | "top-center";
  fontSize?: number;
  skipPages?: number[]; // zero-indexed page numbers to skip
  startNumbering?: number; // page index to start numbering from
}

export interface ColophonMeta {
  sourceTitle?: string;
  sourceAuthor?: string;
  sourceId?: string; // e.g., Gutenberg ID
  transformationPersona?: string;
  curatorName?: string;
  date?: string;
  customText?: string;
}

export type PageContent =
  | { type: "svg"; svg: string }
  | { type: "text"; text: string; style?: TextStyle }
  | {
      type: "prompt";
      promptText: string;
      attribution?: string;
      responseLines?: number;
    }
  | { type: "blank" }
  | { type: "toc"; entries: { title: string; page: number }[] }
  | { type: "colophon"; meta: ColophonMeta };

// ============================================
// SVG Parser (minimal, for our generated SVGs)
// ============================================

interface SVGLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strokeR: number;
  strokeG: number;
  strokeB: number;
  strokeWidth: number;
}

interface SVGCircle {
  cx: number;
  cy: number;
  r: number;
  strokeR: number;
  strokeG: number;
  strokeB: number;
  strokeWidth: number;
  fill: boolean;
  fillR: number;
  fillG: number;
  fillB: number;
}

interface SVGRect {
  x: number;
  y: number;
  width: number;
  height: number;
  fillR: number;
  fillG: number;
  fillB: number;
}

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  hex = hex.replace("#", "");
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  return {
    r: parseInt(hex.substring(0, 2), 16) / 255,
    g: parseInt(hex.substring(2, 4), 16) / 255,
    b: parseInt(hex.substring(4, 6), 16) / 255,
  };
}

function parseAttr(el: string, attr: string): string | null {
  const regex = new RegExp(`${attr}="([^"]*)"`, "i");
  const match = el.match(regex);
  return match ? match[1] : null;
}

function parseNum(el: string, attr: string, fallback = 0): number {
  const val = parseAttr(el, attr);
  return val ? parseFloat(val) : fallback;
}

function parseColor(
  el: string,
  attr: string
): { r: number; g: number; b: number } {
  const val = parseAttr(el, attr);
  if (!val || val === "none" || val === "transparent")
    return { r: 0, g: 0, b: 0 };
  return parseHexColor(val);
}

/**
 * Parse our generated SVGs into draw commands.
 * These SVGs use inches as units with a viewBox matching the page size.
 * We need to convert to PDF points (72 per inch).
 */
function parseSVGElements(
  svg: string,
  pageWidthPts: number,
  pageHeightPts: number
): { lines: SVGLine[]; circles: SVGCircle[]; rects: SVGRect[] } {
  const lines: SVGLine[] = [];
  const circles: SVGCircle[] = [];
  const rects: SVGRect[] = [];

  // Get viewBox dimensions (in inches for our SVGs)
  const vbMatch = svg.match(/viewBox="([^"]*)"/);
  let vbWidth = pageWidthPts / PTS_PER_INCH;
  let vbHeight = pageHeightPts / PTS_PER_INCH;
  if (vbMatch) {
    const parts = vbMatch[1].split(/\s+/).map(Number);
    vbWidth = parts[2];
    vbHeight = parts[3];
  }

  const scaleX = pageWidthPts / vbWidth;
  const scaleY = pageHeightPts / vbHeight;

  // Parse <line> elements
  const lineRegex = /<line\s[^>]*\/>/gi;
  for (const match of svg.matchAll(lineRegex)) {
    const el = match[0];
    const color = parseColor(el, "stroke");
    lines.push({
      x1: parseNum(el, "x1") * scaleX,
      y1: pageHeightPts - parseNum(el, "y1") * scaleY, // flip Y for PDF
      x2: parseNum(el, "x2") * scaleX,
      y2: pageHeightPts - parseNum(el, "y2") * scaleY,
      strokeR: color.r,
      strokeG: color.g,
      strokeB: color.b,
      strokeWidth: parseNum(el, "stroke-width") * scaleX,
    });
  }

  // Parse <circle> elements
  const circleRegex = /<circle\s[^>]*\/>/gi;
  for (const match of svg.matchAll(circleRegex)) {
    const el = match[0];
    const fillAttr = parseAttr(el, "fill");
    const isFilled = fillAttr !== null && fillAttr !== "none";
    const fillColor = isFilled
      ? parseHexColor(fillAttr!)
      : { r: 0, g: 0, b: 0 };
    const strokeAttr = parseAttr(el, "stroke");
    const strokeColor = strokeAttr
      ? parseHexColor(strokeAttr)
      : { r: 0, g: 0, b: 0 };
    circles.push({
      cx: parseNum(el, "cx") * scaleX,
      cy: pageHeightPts - parseNum(el, "cy") * scaleY,
      r: parseNum(el, "r") * scaleX,
      strokeR: strokeColor.r,
      strokeG: strokeColor.g,
      strokeB: strokeColor.b,
      strokeWidth: parseNum(el, "stroke-width") * scaleX,
      fill: isFilled,
      fillR: fillColor.r,
      fillG: fillColor.g,
      fillB: fillColor.b,
    });
  }

  // Parse <rect> elements (skip the white background rect)
  const rectRegex = /<rect\s[^>]*\/>/gi;
  for (const match of svg.matchAll(rectRegex)) {
    const el = match[0];
    const fill = parseAttr(el, "fill");
    if (fill === "white" || fill === "#ffffff" || fill === "#fff") continue; // skip background
    const color = fill ? parseHexColor(fill) : { r: 1, g: 1, b: 1 };
    rects.push({
      x: parseNum(el, "x") * scaleX,
      y: pageHeightPts - parseNum(el, "y") * scaleY - parseNum(el, "height") * scaleY,
      width: parseNum(el, "width") * scaleX,
      height: parseNum(el, "height") * scaleY,
      fillR: color.r,
      fillG: color.g,
      fillB: color.b,
    });
  }

  return { lines, circles, rects };
}

// ============================================
// PDF Composer
// ============================================

export class PDFComposer {
  private trimSize: string;
  private widthPts: number;
  private heightPts: number;
  private bleedPts: number;
  private includeBleed: boolean;

  constructor(
    trimSize: string = "0600X0900",
    options?: { includeBleed?: boolean }
  ) {
    this.trimSize = trimSize;
    const dims = TRIM_INCHES[trimSize] || { w: 6, h: 9 };
    this.widthPts = dims.w * PTS_PER_INCH;
    this.heightPts = dims.h * PTS_PER_INCH;
    this.bleedPts = BLEED_INCHES * PTS_PER_INCH;
    this.includeBleed = options?.includeBleed ?? true;
  }

  /** Full page dimensions including bleed */
  private get fullWidth(): number {
    return this.includeBleed
      ? this.widthPts + 2 * this.bleedPts
      : this.widthPts;
  }

  private get fullHeight(): number {
    return this.includeBleed
      ? this.heightPts + 2 * this.bleedPts
      : this.heightPts;
  }

  /**
   * Compose an array of pages into a print-ready PDF.
   * Returns the PDF as a Uint8Array.
   */
  async compose(
    pages: PageContent[],
    options?: {
      pageNumbers?: PageNumberConfig;
      title?: string;
      author?: string;
    }
  ): Promise<Uint8Array> {
    const doc = await PDFDocument.create();

    if (options?.title) doc.setTitle(options.title);
    if (options?.author) doc.setAuthor(options.author);
    doc.setCreator("GravityPress");
    doc.setProducer("GravityPress / pdf-lib");

    // Embed fonts
    const timesRoman = await doc.embedFont(StandardFonts.TimesRoman);
    const timesItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);
    const timesBold = await doc.embedFont(StandardFonts.TimesRomanBold);
    const helvetica = await doc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const courier = await doc.embedFont(StandardFonts.Courier);

    const fonts = {
      times: timesRoman,
      timesItalic,
      timesBold,
      helvetica,
      helveticaBold,
      courier,
    };

    for (const pageContent of pages) {
      const page = doc.addPage([this.fullWidth, this.fullHeight]);

      // White background
      page.drawRectangle({
        x: 0,
        y: 0,
        width: this.fullWidth,
        height: this.fullHeight,
        color: rgb(1, 1, 1),
      });

      // Content offset for bleed
      const offsetX = this.includeBleed ? this.bleedPts : 0;
      const offsetY = this.includeBleed ? this.bleedPts : 0;

      switch (pageContent.type) {
        case "svg":
          this.drawSVGPage(page, pageContent.svg, offsetX, offsetY);
          break;
        case "text":
          this.drawTextPage(page, pageContent.text, pageContent.style, fonts, offsetX, offsetY);
          break;
        case "blank":
          // Just the white background, already drawn
          break;
        case "toc":
          this.drawTOCPage(page, pageContent.entries, fonts, offsetX, offsetY);
          break;
        case "colophon":
          this.drawColophonPage(page, pageContent.meta, fonts, offsetX, offsetY);
          break;
        case "prompt":
          this.drawPromptPage(
            page,
            pageContent.promptText,
            pageContent.attribution,
            pageContent.responseLines ?? 25,
            fonts,
            offsetX,
            offsetY
          );
          break;
      }
    }

    // Add page numbers
    if (options?.pageNumbers) {
      this.addPageNumbers(doc, options.pageNumbers, fonts.times);
    }

    return await doc.save();
  }

  // ---- SVG Page ----

  private drawSVGPage(
    page: PDFPage,
    svg: string,
    offsetX: number,
    offsetY: number
  ): void {
    const { lines, circles, rects } = parseSVGElements(
      svg,
      this.widthPts,
      this.heightPts
    );

    for (const rect of rects) {
      page.drawRectangle({
        x: rect.x + offsetX,
        y: rect.y + offsetY,
        width: rect.width,
        height: rect.height,
        color: rgb(rect.fillR, rect.fillG, rect.fillB),
      });
    }

    for (const line of lines) {
      page.drawLine({
        start: { x: line.x1 + offsetX, y: line.y1 + offsetY },
        end: { x: line.x2 + offsetX, y: line.y2 + offsetY },
        thickness: line.strokeWidth,
        color: rgb(line.strokeR, line.strokeG, line.strokeB),
      });
    }

    for (const circle of circles) {
      if (circle.fill) {
        page.drawCircle({
          x: circle.cx + offsetX,
          y: circle.cy + offsetY,
          size: circle.r,
          color: rgb(circle.fillR, circle.fillG, circle.fillB),
        });
      }
      if (circle.strokeWidth > 0) {
        page.drawCircle({
          x: circle.cx + offsetX,
          y: circle.cy + offsetY,
          size: circle.r,
          borderColor: rgb(circle.strokeR, circle.strokeG, circle.strokeB),
          borderWidth: circle.strokeWidth,
        });
      }
    }
  }

  // ---- Text Page ----

  private drawTextPage(
    page: PDFPage,
    text: string,
    style: TextStyle | undefined,
    fonts: Record<string, PDFFont>,
    offsetX: number,
    offsetY: number
  ): void {
    const fontSize = style?.fontSize ?? 11;
    const lineHeight = (style?.lineHeight ?? 1.5) * fontSize;
    const color = style?.color ?? { r: 0.1, g: 0.1, b: 0.1 };
    const alignment = style?.alignment ?? "left";

    let font: PDFFont;
    if (style?.fontFamily === "helvetica") {
      font = style?.bold ? fonts.helveticaBold : fonts.helvetica;
    } else if (style?.fontFamily === "courier") {
      font = fonts.courier;
    } else {
      font = style?.italic
        ? fonts.timesItalic
        : style?.bold
          ? fonts.timesBold
          : fonts.times;
    }

    // Margins in points (0.75" top/bottom, 1" sides)
    const marginTop = 0.75 * PTS_PER_INCH;
    const marginBottom = 0.75 * PTS_PER_INCH;
    const marginLeft = 1 * PTS_PER_INCH;
    const marginRight = 0.75 * PTS_PER_INCH;

    const textWidth = this.widthPts - marginLeft - marginRight;
    const lines = this.wrapText(text, font, fontSize, textWidth);

    let y = this.heightPts - marginTop + offsetY;
    const minY = marginBottom + offsetY;

    for (const line of lines) {
      if (y < minY) break;

      let x = marginLeft + offsetX;
      if (alignment === "center") {
        const w = font.widthOfTextAtSize(line, fontSize);
        x = offsetX + (this.widthPts - w) / 2;
      } else if (alignment === "right") {
        const w = font.widthOfTextAtSize(line, fontSize);
        x = offsetX + this.widthPts - marginRight - w;
      }

      page.drawText(line, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
      });

      y -= lineHeight;
    }
  }

  // ---- TOC Page ----

  private drawTOCPage(
    page: PDFPage,
    entries: { title: string; page: number }[],
    fonts: Record<string, PDFFont>,
    offsetX: number,
    offsetY: number
  ): void {
    const titleFont = fonts.timesBold;
    const entryFont = fonts.times;
    const marginLeft = 1 * PTS_PER_INCH;
    const marginRight = 0.75 * PTS_PER_INCH;
    const marginTop = 1.5 * PTS_PER_INCH;

    // Title
    let y = this.heightPts - marginTop + offsetY;
    page.drawText("Contents", {
      x: marginLeft + offsetX,
      y,
      size: 18,
      font: titleFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 36;

    // Entries
    for (const entry of entries) {
      if (y < 72 + offsetY) break;

      const titleText = entry.title;
      const pageText = String(entry.page);
      const titleWidth = entryFont.widthOfTextAtSize(titleText, 11);
      const pageWidth = entryFont.widthOfTextAtSize(pageText, 11);
      const rightEdge = offsetX + this.widthPts - marginRight;

      page.drawText(titleText, {
        x: marginLeft + offsetX,
        y,
        size: 11,
        font: entryFont,
        color: rgb(0.1, 0.1, 0.1),
      });

      page.drawText(pageText, {
        x: rightEdge - pageWidth,
        y,
        size: 11,
        font: entryFont,
        color: rgb(0.1, 0.1, 0.1),
      });

      // Dot leader
      const dotsStart = marginLeft + offsetX + titleWidth + 8;
      const dotsEnd = rightEdge - pageWidth - 8;
      const dotWidth = entryFont.widthOfTextAtSize(".", 11);
      const dotSpacing = dotWidth * 2.5;
      let dx = dotsStart;
      while (dx < dotsEnd) {
        page.drawText(".", {
          x: dx,
          y,
          size: 11,
          font: entryFont,
          color: rgb(0.6, 0.6, 0.6),
        });
        dx += dotSpacing;
      }

      y -= 20;
    }
  }

  // ---- Colophon Page ----

  private drawColophonPage(
    page: PDFPage,
    meta: ColophonMeta,
    fonts: Record<string, PDFFont>,
    offsetX: number,
    offsetY: number
  ): void {
    const font = fonts.times;
    const boldFont = fonts.timesBold;
    const italicFont = fonts.timesItalic;
    const marginLeft = 1.25 * PTS_PER_INCH;
    const fontSize = 9;
    const lineHeight = 15;

    // Position colophon in the lower portion of the page
    let y = this.heightPts * 0.45 + offsetY;

    const drawLabel = (label: string, value: string) => {
      page.drawText(label, {
        x: marginLeft + offsetX,
        y,
        size: 7,
        font: boldFont,
        color: rgb(0.5, 0.5, 0.5),
      });
      y -= lineHeight;
      page.drawText(value, {
        x: marginLeft + offsetX,
        y,
        size: fontSize,
        font: font,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= lineHeight * 1.5;
    };

    // Divider line
    page.drawLine({
      start: { x: marginLeft + offsetX, y: y + 10 },
      end: { x: offsetX + this.widthPts - marginLeft, y: y + 10 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
    y -= 10;

    if (meta.sourceTitle) {
      drawLabel("SOURCE", `"${meta.sourceTitle}"${meta.sourceAuthor ? ` by ${meta.sourceAuthor}` : ""}${meta.sourceId ? ` (${meta.sourceId})` : ""}`);
    }

    if (meta.transformationPersona) {
      drawLabel("TRANSFORMATION", `Persona: ${meta.transformationPersona}`);
    }

    if (meta.curatorName) {
      drawLabel("CURATOR", `${meta.curatorName}${meta.date ? ` — ${meta.date}` : ""}`);
    }

    if (meta.customText) {
      y -= 5;
      page.drawText(meta.customText, {
        x: marginLeft + offsetX,
        y,
        size: 8,
        font: italicFont,
        color: rgb(0.4, 0.4, 0.4),
      });
      y -= lineHeight;
    }

    // Default rights statement
    y -= 10;
    page.drawText(
      "This work draws from the public domain. This arrangement",
      {
        x: marginLeft + offsetX,
        y,
        size: 7.5,
        font: italicFont,
        color: rgb(0.5, 0.5, 0.5),
      }
    );
    y -= 12;
    page.drawText("is offered freely to future readers and remixers.", {
      x: marginLeft + offsetX,
      y,
      size: 7.5,
      font: italicFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    y -= 24;
    page.drawText("Printed by GravityPress — gravity-press.com", {
      x: marginLeft + offsetX,
      y,
      size: 7,
      font: font,
      color: rgb(0.6, 0.6, 0.6),
    });
  }

  // ---- Prompt Page ----

  private drawPromptPage(
    page: PDFPage,
    promptText: string,
    attribution: string | undefined,
    responseLines: number,
    fonts: Record<string, PDFFont>,
    offsetX: number,
    offsetY: number
  ): void {
    const marginLeft = 1 * PTS_PER_INCH;
    const marginRight = 0.75 * PTS_PER_INCH;
    const marginTop = 0.75 * PTS_PER_INCH;
    const textWidth = this.widthPts - marginLeft - marginRight;

    const promptFont = fonts.timesItalic;
    const attrFont = fonts.times;
    const fontSize = 11;
    const lineHeight = fontSize * 1.6;

    // Draw prompt text
    const promptLines = this.wrapText(promptText, promptFont, fontSize, textWidth);
    let y = this.heightPts - marginTop + offsetY;

    for (const line of promptLines) {
      page.drawText(line, {
        x: marginLeft + offsetX,
        y,
        size: fontSize,
        font: promptFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= lineHeight;
    }

    // Attribution
    if (attribution) {
      y -= 4;
      const attrText = `— ${attribution}`;
      const attrWidth = attrFont.widthOfTextAtSize(attrText, 9);
      page.drawText(attrText, {
        x: offsetX + this.widthPts - marginRight - attrWidth,
        y,
        size: 9,
        font: attrFont,
        color: rgb(0.5, 0.5, 0.5),
      });
      y -= 18;
    }

    // Dashed divider
    y -= 8;
    const dashLen = 3;
    const gapLen = 3;
    let dx = marginLeft + offsetX;
    const endX = offsetX + this.widthPts - marginRight;
    while (dx < endX) {
      const segEnd = Math.min(dx + dashLen, endX);
      page.drawLine({
        start: { x: dx, y },
        end: { x: segEnd, y },
        thickness: 0.4,
        color: rgb(0.6, 0.6, 0.6),
      });
      dx += dashLen + gapLen;
    }
    y -= 16;

    // Response lines
    const responseSpacing = 0.3125 * PTS_PER_INCH; // college ruled
    const minY = 0.75 * PTS_PER_INCH + offsetY;
    for (let i = 0; i < responseLines && y > minY; i++) {
      page.drawLine({
        start: { x: marginLeft + offsetX, y },
        end: { x: offsetX + this.widthPts - marginRight, y },
        thickness: 0.35,
        color: rgb(0.78, 0.78, 0.78),
      });
      y -= responseSpacing;
    }
  }

  // ---- Page Numbers ----

  private addPageNumbers(
    doc: PDFDocument,
    config: PageNumberConfig,
    font: PDFFont
  ): void {
    const pages = doc.getPages();
    const fontSize = config.fontSize ?? 9;
    const startNum = config.startPage ?? 1;
    const startIdx = config.startNumbering ?? 0;

    for (let i = startIdx; i < pages.length; i++) {
      if (config.skipPages?.includes(i)) continue;

      const page = pages[i];
      const num = String(startNum + (i - startIdx));
      const numWidth = font.widthOfTextAtSize(num, fontSize);
      const { width, height } = page.getSize();

      let x: number;
      let y: number;

      if (config.position === "top-center") {
        x = (width - numWidth) / 2;
        y = height - 0.5 * PTS_PER_INCH;
      } else if (config.position === "bottom-outside") {
        // Even pages: left, odd pages: right
        x =
          i % 2 === 0
            ? 0.75 * PTS_PER_INCH
            : width - 0.75 * PTS_PER_INCH - numWidth;
        y = 0.4 * PTS_PER_INCH;
      } else {
        // bottom-center (default)
        x = (width - numWidth) / 2;
        y = 0.4 * PTS_PER_INCH;
      }

      page.drawText(num, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
    }
  }

  // ---- Text Wrapping ----

  private wrapText(
    text: string,
    font: PDFFont,
    fontSize: number,
    maxWidth: number
  ): string[] {
    const paragraphs = text.split("\n");
    const allLines: string[] = [];

    for (const para of paragraphs) {
      if (para.trim() === "") {
        allLines.push("");
        continue;
      }

      const words = para.split(/\s+/);
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);

        if (testWidth > maxWidth && currentLine) {
          allLines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) allLines.push(currentLine);
    }

    return allLines;
  }
}

// ============================================
// Convenience function
// ============================================

/**
 * Compose pages into a print-ready PDF for Lulu.
 * Returns Uint8Array of the PDF.
 */
export async function composePDF(
  pages: PageContent[],
  printSpec: PrintSpec,
  options?: {
    pageNumbers?: PageNumberConfig;
    title?: string;
    author?: string;
    includeBleed?: boolean;
  }
): Promise<Uint8Array> {
  const composer = new PDFComposer(printSpec.trimSize, {
    includeBleed: options?.includeBleed ?? true,
  });
  return composer.compose(pages, options);
}
