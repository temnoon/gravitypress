import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// ============================================
// Booklet Imposition (Saddle Stitch)
// ============================================
//
// Takes a composed PDF and reorders pages for duplex printing
// on a home printer. When printed double-sided (flip on short edge),
// the sheets can be folded and stapled to form a booklet.
//
// Each physical sheet holds 4 booklet pages (2 per side).
// The imposition order for N total pages, sheet i (0-indexed):
//   Front: left = page[N-1 - i*2],  right = page[i*2]
//   Back:  left = page[i*2 + 1],    right = page[N-2 - i*2]
//
// When you fold the stack in half and read left-to-right,
// you get pages 1, 2, 3, ... N in order.
//
// Max supported: 32 sheets (128 pages), recommended 24 sheets (96 pages).

export interface BookletOptions {
  /** Maximum sheets. Pages beyond this are dropped. Default 24. */
  maxSheets?: number;
  /** Add edition number to each sheet as a faint watermark */
  editionNumber?: number;
  /** Total in edition (e.g., "7 of 50") */
  editionTotal?: number;
}

/**
 * Impose a PDF for saddle-stitch booklet printing.
 *
 * Input: a regular sequential PDF (page 1, 2, 3, ... N)
 * Output: a PDF with 2-up pages arranged for duplex printing.
 *
 * Each output page is a landscape sheet with two booklet pages
 * placed side by side at their original size and proportions.
 *
 * Print instructions:
 * 1. Print double-sided, flip on short edge
 * 2. Stack all sheets in order
 * 3. Fold the stack in half
 * 4. Staple along the spine (fold line)
 */
export async function imposeBooklet(
  sourcePdf: Uint8Array,
  options?: BookletOptions
): Promise<Uint8Array> {
  const maxSheets = options?.maxSheets ?? 24;
  const srcDoc = await PDFDocument.load(sourcePdf);
  const srcPages = srcDoc.getPages();

  // Pad to multiple of 4
  let totalPages = srcPages.length;
  const remainder = totalPages % 4;
  if (remainder !== 0) {
    totalPages += 4 - remainder;
  }

  // Clamp to max sheets
  const maxPages = maxSheets * 4;
  if (totalPages > maxPages) {
    totalPages = maxPages;
  }

  // Get source page dimensions (assume all same size)
  const firstPage = srcPages[0];
  const { width: pageWidth, height: pageHeight } = firstPage.getSize();

  // Output sheet: landscape orientation
  // Two source pages side by side, each at original size
  const sheetWidth = pageWidth * 2;
  const sheetHeight = pageHeight;

  const outDoc = await PDFDocument.create();
  outDoc.setCreator("GravityPress Booklet Imposer");

  if (options?.editionNumber) {
    outDoc.setTitle(
      `Boutique Edition ${options.editionNumber}${options.editionTotal ? ` of ${options.editionTotal}` : ""}`
    );
  }

  const totalSheets = totalPages / 4;

  // Embed all source pages we need
  const embeddedPages: (Awaited<ReturnType<typeof outDoc.embedPage>> | null)[] = [];
  for (let i = 0; i < totalPages; i++) {
    if (i < srcPages.length) {
      const [embedded] = await outDoc.embedPages([srcDoc.getPage(i)]);
      embeddedPages.push(embedded);
    } else {
      embeddedPages.push(null); // blank padding page
    }
  }

  // Edition numbering font
  let editionFont: Awaited<ReturnType<typeof outDoc.embedFont>> | null = null;
  if (options?.editionNumber) {
    editionFont = await outDoc.embedFont(StandardFonts.Helvetica);
  }

  for (let sheet = 0; sheet < totalSheets; sheet++) {
    // Front side: two pages
    const frontLeft = totalPages - 1 - sheet * 2;
    const frontRight = sheet * 2;

    // Back side: two pages
    const backLeft = sheet * 2 + 1;
    const backRight = totalPages - 2 - sheet * 2;

    // ---- Front side ----
    const frontPage = outDoc.addPage([sheetWidth, sheetHeight]);

    // Left half — draw at original size, positioned at left
    if (embeddedPages[frontLeft]) {
      frontPage.drawPage(embeddedPages[frontLeft]!, {
        x: 0,
        y: 0,
      });
    }

    // Right half — draw at original size, positioned at midpoint
    if (embeddedPages[frontRight]) {
      frontPage.drawPage(embeddedPages[frontRight]!, {
        x: pageWidth,
        y: 0,
      });
    }

    // Edition number watermark (faint, bottom center of sheet)
    if (options?.editionNumber && editionFont) {
      const edText = options.editionTotal
        ? `Boutique Edition ${options.editionNumber} of ${options.editionTotal} — Sheet ${sheet + 1}/${totalSheets}`
        : `Edition ${options.editionNumber} — Sheet ${sheet + 1}/${totalSheets}`;
      const edWidth = editionFont.widthOfTextAtSize(edText, 6);
      frontPage.drawText(edText, {
        x: (sheetWidth - edWidth) / 2,
        y: 8,
        size: 6,
        font: editionFont,
        color: rgb(0.8, 0.8, 0.8),
      });
    }

    // ---- Back side ----
    const backPage = outDoc.addPage([sheetWidth, sheetHeight]);

    // Left half
    if (embeddedPages[backLeft]) {
      backPage.drawPage(embeddedPages[backLeft]!, {
        x: 0,
        y: 0,
      });
    }

    // Right half
    if (embeddedPages[backRight]) {
      backPage.drawPage(embeddedPages[backRight]!, {
        x: pageWidth,
        y: 0,
      });
    }
  }

  return await outDoc.save();
}

/**
 * Get booklet page count info for a given number of content pages.
 */
export function getBookletPageCount(contentPages: number): {
  totalPages: number;
  sheets: number;
  blankPagesAdded: number;
} {
  let totalPages = contentPages;
  const remainder = totalPages % 4;
  const blankPagesAdded = remainder === 0 ? 0 : 4 - remainder;
  totalPages += blankPagesAdded;

  return {
    totalPages,
    sheets: totalPages / 4,
    blankPagesAdded,
  };
}
