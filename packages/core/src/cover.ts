import {
  PDFDocument,
  StandardFonts,
  rgb,
  degrees,
  PDFFont,
} from "pdf-lib";
import type { PrintSpec } from "@gravitypress/schemas";
import { calculateSpineWidth } from "./lulu";

// ============================================
// Types
// ============================================

const PTS_PER_INCH = 72;
const BLEED_INCHES = 0.125;

const TRIM_INCHES: Record<string, { w: number; h: number }> = {
  "0600X0900": { w: 6, h: 9 },
  "0550X0850": { w: 5.5, h: 8.5 },
  "0583X0827": { w: 5.83, h: 8.27 },
  "0850X1100": { w: 8.5, h: 11 },
};

export interface CoverConfig {
  title: string;
  subtitle?: string;
  author?: string;
  backgroundColor?: string; // hex color, default white
  textColor?: string; // hex color, default black
  spineText?: string; // defaults to title
  backCoverText?: string;
  /** SVG string from a page generator to use as background pattern */
  backgroundPattern?: string;
}

export interface CoverDimensions {
  trimWidth: number; // inches
  trimHeight: number; // inches
  spineWidth: number; // inches
  bleed: number; // inches
  totalWidthPts: number; // points (full spread)
  totalHeightPts: number; // points
  // Zones in points (from left edge)
  backCoverX: number;
  backCoverWidth: number;
  spineX: number;
  spinePtsWidth: number;
  frontCoverX: number;
  frontCoverWidth: number;
}

// ============================================
// Dimension Calculator
// ============================================

export function calculateCoverDimensions(
  trimSize: string,
  pageCount: number,
  paperStock: string,
  bindingType: string
): CoverDimensions {
  const trim = TRIM_INCHES[trimSize] || { w: 6, h: 9 };
  const bleed = BLEED_INCHES;

  // No spine for saddle stitch or coil
  const spineWidth =
    bindingType === "SS" || bindingType === "CO"
      ? 0
      : calculateSpineWidth(pageCount, paperStock);

  const totalWidthInches = bleed + trim.w + spineWidth + trim.w + bleed;
  const totalHeightInches = bleed + trim.h + bleed;

  const totalWidthPts = totalWidthInches * PTS_PER_INCH;
  const totalHeightPts = totalHeightInches * PTS_PER_INCH;
  const bleedPts = bleed * PTS_PER_INCH;
  const trimWidthPts = trim.w * PTS_PER_INCH;
  const spinePtsWidth = spineWidth * PTS_PER_INCH;

  return {
    trimWidth: trim.w,
    trimHeight: trim.h,
    spineWidth,
    bleed,
    totalWidthPts,
    totalHeightPts,
    backCoverX: bleedPts,
    backCoverWidth: trimWidthPts,
    spineX: bleedPts + trimWidthPts,
    spinePtsWidth,
    frontCoverX: bleedPts + trimWidthPts + spinePtsWidth,
    frontCoverWidth: trimWidthPts,
  };
}

// ============================================
// Cover Generator
// ============================================

function parseHex(hex: string): { r: number; g: number; b: number } {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  return {
    r: parseInt(hex.substring(0, 2), 16) / 255,
    g: parseInt(hex.substring(2, 4), 16) / 255,
    b: parseInt(hex.substring(4, 6), 16) / 255,
  };
}

/**
 * Generate a print-ready cover PDF as a single spread (back + spine + front).
 * Returns a Uint8Array of the PDF.
 */
export async function generateCoverPDF(
  config: CoverConfig,
  printSpec: PrintSpec,
  pageCount: number
): Promise<Uint8Array> {
  const dims = calculateCoverDimensions(
    printSpec.trimSize,
    pageCount,
    printSpec.paperStock,
    printSpec.bindingType
  );

  const doc = await PDFDocument.create();
  const page = doc.addPage([dims.totalWidthPts, dims.totalHeightPts]);

  // Embed fonts
  const titleFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const subtitleFont = await doc.embedFont(StandardFonts.Helvetica);
  const bodyFont = await doc.embedFont(StandardFonts.TimesRoman);
  const spineFont = await doc.embedFont(StandardFonts.Helvetica);

  // Colors
  const bg = parseHex(config.backgroundColor || "#ffffff");
  const fg = parseHex(config.textColor || "#222222");

  // ---- Background ----
  page.drawRectangle({
    x: 0,
    y: 0,
    width: dims.totalWidthPts,
    height: dims.totalHeightPts,
    color: rgb(bg.r, bg.g, bg.b),
  });

  // ---- Front Cover ----
  const frontCenterX = dims.frontCoverX + dims.frontCoverWidth / 2;
  const bleedPts = dims.bleed * PTS_PER_INCH;

  // Title
  const titleSize = calculateFontSize(config.title, titleFont, dims.frontCoverWidth * 0.75, 36, 14);
  const titleWidth = titleFont.widthOfTextAtSize(config.title, titleSize);
  const titleY = dims.totalHeightPts * 0.62;

  page.drawText(config.title, {
    x: frontCenterX - titleWidth / 2,
    y: titleY,
    size: titleSize,
    font: titleFont,
    color: rgb(fg.r, fg.g, fg.b),
  });

  // Subtitle
  if (config.subtitle) {
    const subSize = Math.max(titleSize * 0.55, 10);
    const subWidth = subtitleFont.widthOfTextAtSize(config.subtitle, subSize);
    page.drawText(config.subtitle, {
      x: frontCenterX - subWidth / 2,
      y: titleY - titleSize * 1.8,
      size: subSize,
      font: subtitleFont,
      color: rgb(fg.r, fg.g, fg.b),
    });
  }

  // Author
  if (config.author) {
    const authorSize = 12;
    const authorWidth = subtitleFont.widthOfTextAtSize(config.author, authorSize);
    page.drawText(config.author, {
      x: frontCenterX - authorWidth / 2,
      y: bleedPts + dims.trimHeight * PTS_PER_INCH * 0.12,
      size: authorSize,
      font: subtitleFont,
      color: rgb(fg.r, fg.g, fg.b),
    });
  }

  // Decorative line under title
  const lineY = titleY - titleSize * 0.7;
  const lineHalfWidth = Math.min(titleWidth * 0.6, dims.frontCoverWidth * 0.3);
  page.drawLine({
    start: { x: frontCenterX - lineHalfWidth, y: lineY },
    end: { x: frontCenterX + lineHalfWidth, y: lineY },
    thickness: 0.75,
    color: rgb(fg.r, fg.g, fg.b),
  });

  // ---- Spine ----
  if (dims.spinePtsWidth > 0) {
    const spineText = config.spineText || config.title;
    const spineCenterX = dims.spineX + dims.spinePtsWidth / 2;

    // Spine text runs bottom-to-top (standard for English books)
    // Only draw if spine is wide enough for text
    if (dims.spinePtsWidth > 12) {
      const spineSize = Math.min(dims.spinePtsWidth * 0.6, 10);
      const spineTextWidth = spineFont.widthOfTextAtSize(spineText, spineSize);

      // Rotate 90° counter-clockwise, centered on spine
      page.pushOperators(
        // Translate to spine center, rotate, then draw
      );

      // Use pdf-lib's rotation support
      const spineMidY = dims.totalHeightPts / 2;
      page.drawText(spineText, {
        x: spineCenterX + spineSize * 0.35,
        y: spineMidY - spineTextWidth / 2,
        size: spineSize,
        font: spineFont,
        color: rgb(fg.r, fg.g, fg.b),
        rotate: degrees(90),
      });
    }
  }

  // ---- Back Cover ----
  const backCenterX = dims.backCoverX + dims.backCoverWidth / 2;

  if (config.backCoverText) {
    // Wrap and draw back cover text
    const backSize = 10;
    const backMaxWidth = dims.backCoverWidth * 0.7;
    const lines = wrapText(config.backCoverText, bodyFont, backSize, backMaxWidth);
    let y = dims.totalHeightPts * 0.65;

    for (const line of lines) {
      const lineWidth = bodyFont.widthOfTextAtSize(line, backSize);
      page.drawText(line, {
        x: backCenterX - lineWidth / 2,
        y,
        size: backSize,
        font: bodyFont,
        color: rgb(fg.r, fg.g, fg.b),
      });
      y -= backSize * 1.6;
    }
  }

  // GravityPress branding on back cover (bottom)
  const brandText = "gravity-press.com";
  const brandSize = 7;
  const brandWidth = subtitleFont.widthOfTextAtSize(brandText, brandSize);
  page.drawText(brandText, {
    x: backCenterX - brandWidth / 2,
    y: bleedPts + 0.5 * PTS_PER_INCH,
    size: brandSize,
    font: subtitleFont,
    color: rgb(fg.r * 0.6 + 0.4, fg.g * 0.6 + 0.4, fg.b * 0.6 + 0.4),
  });

  return await doc.save();
}

// ---- Helpers ----

function calculateFontSize(
  text: string,
  font: PDFFont,
  maxWidth: number,
  maxSize: number,
  minSize: number
): number {
  let size = maxSize;
  while (size > minSize) {
    if (font.widthOfTextAtSize(text, size) <= maxWidth) return size;
    size -= 1;
  }
  return minSize;
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, fontSize) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}
