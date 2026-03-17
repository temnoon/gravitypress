import { useRef } from "react";
import type { SequenceEntry } from "../hooks/useNotebook";
import { pageTypeLabel } from "../hooks/useNotebook";

interface Props {
  pages: SequenceEntry[];
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
  onRemove: (index: number) => void;
  onReorder: (from: number, to: number) => void;
  onClear: () => void;
}

export function SequenceBuilder({ pages, selectedIndex, onSelect, onRemove, onReorder, onClear }: Props) {
  const dragIdx = useRef<number | null>(null);

  return (
    <div className="sequence-builder">
      <div className="sequence-header">
        <span>{pages.length} page{pages.length !== 1 ? "s" : ""}</span>
        {pages.length > 0 && (
          <button className="btn-sm btn-ghost" onClick={onClear}>Clear All</button>
        )}
      </div>
      {pages.length === 0 ? (
        <div className="sequence-empty">Add pages using the picker above</div>
      ) : (
        <div className="sequence-list">
          {pages.map((entry, i) => {
            // Count which number this type is
            const typeCount = pages.slice(0, i + 1).filter(p => p.config.type === entry.config.type).length;
            return (
              <div
                key={entry.id}
                className={`sequence-item ${selectedIndex === i ? "selected" : ""}`}
                draggable
                onDragStart={() => { dragIdx.current = i; }}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={() => {
                  if (dragIdx.current !== null && dragIdx.current !== i) {
                    onReorder(dragIdx.current, i);
                  }
                  dragIdx.current = null;
                }}
                onClick={() => onSelect(selectedIndex === i ? null : i)}
              >
                <span className="seq-handle">⠿</span>
                <span className="seq-num">{i + 1}</span>
                <span className="seq-type">{pageTypeLabel(entry.config.type)} #{typeCount}</span>
                <button
                  className="seq-delete"
                  onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                >×</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
