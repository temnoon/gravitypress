import { useState } from "react";
import { renderPageSVG, composePDF, generateCoverPDF, imposeBooklet, getBookletPageCount } from "@gravitypress/core";
import type { PageContent } from "@gravitypress/core";
import type { NotebookState } from "../hooks/useNotebook";

interface Props {
  state: NotebookState;
}

export function ExportPanel({ state }: Props) {
  const [generating, setGenerating] = useState<string | null>(null);
  const [progress, setProgress] = useState("");

  const { pages, cover, printSpec } = state;
  const pageCount = pages.length;
  const bookletInfo = getBookletPageCount(pageCount);

  async function generatePages(): Promise<PageContent[]> {
    const content: PageContent[] = [];
    for (let i = 0; i < pages.length; i++) {
      setProgress(`Rendering page ${i + 1} of ${pages.length}...`);
      const svg = renderPageSVG(pages[i].config);
      content.push({ type: "svg", svg });
      // Yield to UI
      if (i % 10 === 0) await new Promise((r) => setTimeout(r, 0));
    }
    return content;
  }

  function downloadBlob(data: Uint8Array, filename: string) {
    const blob = new Blob([data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportInterior() {
    if (pageCount === 0) return;
    setGenerating("interior");
    try {
      const content = await generatePages();
      setProgress("Composing PDF...");
      const pdf = await composePDF(content, printSpec, {
        title: cover.title,
        author: cover.author,
        pageNumbers: { startPage: 1, position: "bottom-center" },
      });
      downloadBlob(pdf, `${cover.title || "notebook"}-interior.pdf`);
    } finally {
      setGenerating(null);
      setProgress("");
    }
  }

  async function exportCover() {
    if (pageCount === 0) return;
    setGenerating("cover");
    try {
      setProgress("Generating cover...");
      const pdf = await generateCoverPDF(cover, printSpec, pageCount);
      downloadBlob(pdf, `${cover.title || "notebook"}-cover.pdf`);
    } finally {
      setGenerating(null);
      setProgress("");
    }
  }

  async function exportBooklet() {
    if (pageCount === 0) return;
    setGenerating("booklet");
    try {
      const content = await generatePages();
      setProgress("Composing PDF...");
      const interior = await composePDF(content, printSpec, {
        title: cover.title,
        author: cover.author,
        pageNumbers: { startPage: 1, position: "bottom-center" },
        includeBleed: false,
      });
      setProgress("Imposing booklet...");
      const booklet = await imposeBooklet(interior, { maxSheets: 24 });
      downloadBlob(booklet, `${cover.title || "notebook"}-booklet.pdf`);
    } finally {
      setGenerating(null);
      setProgress("");
    }
  }

  const disabled = pageCount === 0 || generating !== null;

  return (
    <div className="export-panel">
      <h3>Export</h3>

      {generating && <div className="export-progress">{progress}</div>}

      <div className="export-actions">
        <button className="btn btn-primary" onClick={exportInterior} disabled={disabled}>
          Download Interior PDF
        </button>
        <button className="btn" onClick={exportCover} disabled={disabled}>
          Download Cover PDF
        </button>
        <div className="export-divider" />
        <button className="btn btn-accent" onClick={exportBooklet} disabled={disabled}>
          Boutique Booklet PDF
        </button>
        {pageCount > 0 && (
          <span className="export-hint">
            {bookletInfo.sheets} sheets, fold & staple
            {bookletInfo.blankPagesAdded > 0 && ` (+${bookletInfo.blankPagesAdded} blank)`}
          </span>
        )}
      </div>
    </div>
  );
}
