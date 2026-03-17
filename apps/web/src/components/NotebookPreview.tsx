import { useMemo } from "react";
import { renderPageSVG } from "@gravitypress/core";
import type { SequenceEntry } from "../hooks/useNotebook";

interface Props {
  pages: SequenceEntry[];
  currentIndex: number;
  onNavigate: (index: number) => void;
}

export function NotebookPreview({ pages, currentIndex, onNavigate }: Props) {
  const currentConfig = pages[currentIndex]?.config;

  const svgString = useMemo(() => {
    if (!currentConfig) return null;
    try {
      return renderPageSVG(currentConfig);
    } catch {
      return null;
    }
  }, [currentConfig ? JSON.stringify(currentConfig) : null]);

  if (pages.length === 0) {
    return (
      <div className="preview-pane">
        <div className="preview-empty">
          <p>Your notebook is empty</p>
          <p className="preview-hint">Add pages from the sidebar to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="preview-pane">
      <div className="preview-svg">
        {svgString ? (
          <div dangerouslySetInnerHTML={{ __html: svgString }} />
        ) : (
          <div className="preview-empty">No preview available</div>
        )}
      </div>
      <div className="preview-nav">
        <button
          disabled={currentIndex <= 0}
          onClick={() => onNavigate(currentIndex - 1)}
        >
          ← Prev
        </button>
        <span className="preview-page-num">
          Page {currentIndex + 1} of {pages.length}
        </span>
        <button
          disabled={currentIndex >= pages.length - 1}
          onClick={() => onNavigate(currentIndex + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
