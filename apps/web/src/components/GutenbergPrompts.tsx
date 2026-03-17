import { useState } from "react";
import { CURATED_BOOKS } from "@gravitypress/core";
import type { WritingPrompt } from "@gravitypress/core";
import type { PageConfig } from "@gravitypress/schemas";
import { trimToPaper } from "../hooks/useNotebook";

interface Props {
  trimSize: string;
  onAddPages: (configs: PageConfig[]) => void;
}

const WORKER_BASE = import.meta.env.VITE_GP_WORKER_BASE || "http://localhost:8787";

type Step = "browse" | "extracting" | "curate";

export function GutenbergPrompts({ trimSize, onAddPages }: Props) {
  const [step, setStep] = useState<Step>("browse");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedBook, setSelectedBook] = useState<{ id: number; title: string; author: string } | null>(null);
  const [prompts, setPrompts] = useState<WritingPrompt[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [promptCount, setPromptCount] = useState(30);
  const [responseType, setResponseType] = useState<"lined" | "blank" | "dot">("lined");
  const [error, setError] = useState("");

  const paper = trimToPaper(trimSize);

  async function searchBooks() {
    if (!search.trim()) return;
    setSearching(true);
    setError("");
    try {
      const res = await fetch(`${WORKER_BASE}/api/gutenberg/search?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      setSearchResults((data as any).books || []);
    } catch (e) {
      setError("Search failed. Is the worker running?");
    } finally {
      setSearching(false);
    }
  }

  async function extractFromBook(book: { id: number; title: string; author: string; nodeId?: string }) {
    setSelectedBook(book);
    setStep("extracting");
    setError("");
    try {
      let res: Response;

      if (book.nodeId) {
        // Use post-social node (higher quality — pyramid-chunked, curator-scored)
        res = await fetch(`${WORKER_BASE}/api/gutenberg/prompts-from-node`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nodeId: book.nodeId,
            gutenbergId: book.id,
            title: book.title,
            author: book.author,
            maxPrompts: promptCount,
          }),
        });
      } else {
        // Fallback to raw Gutenberg text
        res = await fetch(`${WORKER_BASE}/api/gutenberg/prompts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookId: book.id,
            title: book.title,
            author: book.author,
            maxPrompts: promptCount,
          }),
        });
      }

      if (!res.ok) throw new Error("Extraction failed");
      const data = await res.json();
      const extracted = (data as any).prompts as WritingPrompt[];
      setPrompts(extracted);
      setSelected(new Set(extracted.map((_, i) => i)));
      setStep("curate");
    } catch (e) {
      setError("Failed to extract prompts. Try another book.");
      setStep("browse");
    }
  }

  function addToNotebook() {
    const pages: PageConfig[] = [];
    const selectedPrompts = prompts.filter((_, i) => selected.has(i));

    for (const prompt of selectedPrompts) {
      // Prompt page
      pages.push({
        version: 1,
        type: "prompt",
        paper,
        marginTop: 0.75,
        marginBottom: 0.75,
        marginLeft: 1,
        marginRight: 0.75,
        promptText: prompt.promptText,
        sourceAttribution: `${prompt.sourceAuthor}, "${prompt.sourceBook}"`,
        promptFontSize: 11,
        promptAreaFraction: 0.25,
        responseType,
        lineSpacing: 0.3125,
        lineColor: "#c0c0c0",
        dotSpacing: 0.1967,
        dotRadius: 0.012,
        dotColor: "#cccccc",
        showDivider: true,
        dividerColor: "#999999",
      } as PageConfig);
    }

    onAddPages(pages);
    setStep("browse");
    setPrompts([]);
    setSelected(new Set());
  }

  function togglePrompt(i: number) {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelected(next);
  }

  return (
    <div className="gutenberg-panel">
      {step === "browse" && (
        <>
          <h3>Prompt Books from Gutenberg</h3>

          <div className="form-row" style={{ marginBottom: 12 }}>
            <label className="form-field" style={{ flex: 1 }}>
              <span>Prompts to extract</span>
              <input
                type="number"
                min={5}
                max={100}
                value={promptCount}
                onChange={(e) => setPromptCount(+e.target.value)}
                style={{ padding: "7px 10px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13 }}
              />
            </label>
            <label className="form-field" style={{ flex: 1 }}>
              <span>Response area</span>
              <select
                value={responseType}
                onChange={(e) => setResponseType(e.target.value as any)}
                style={{ padding: "7px 10px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13 }}
              >
                <option value="lined">Lined</option>
                <option value="dot">Dot Grid</option>
                <option value="blank">Blank</option>
              </select>
            </label>
          </div>

          {/* Search */}
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search Gutenberg..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchBooks()}
            />
            <button className="btn btn-sm" onClick={searchBooks} disabled={searching}>
              {searching ? "..." : "Search"}
            </button>
          </div>

          {error && <div className="error-msg">{error}</div>}

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="book-list">
              <div className="book-list-header">Search Results</div>
              {searchResults.map((b: any) => (
                <button
                  key={b.id}
                  className="book-item"
                  onClick={() => extractFromBook({ id: b.id, title: b.title, author: b.authors?.[0] || "Unknown" })}
                >
                  <span className="book-title">{b.title}</span>
                  <span className="book-author">{b.authors?.join(", ")}</span>
                </button>
              ))}
            </div>
          )}

          {/* Curated list */}
          <div className="book-list">
            <div className="book-list-header">Curated Classics</div>
            {CURATED_BOOKS.map((b) => (
              <button
                key={b.id}
                className="book-item"
                onClick={() => extractFromBook({ id: b.id, title: b.title, author: b.author })}
              >
                <span className="book-title">{b.title}</span>
                <span className="book-author">{b.author}</span>
                <span className="book-cat">{b.category}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === "extracting" && (
        <div className="extracting">
          <h3>Extracting prompts...</h3>
          <p>Reading "{selectedBook?.title}" by {selectedBook?.author}</p>
          <p className="text-muted">This may take a moment for longer texts.</p>
        </div>
      )}

      {step === "curate" && (
        <>
          <div className="curate-header">
            <h3>{prompts.length} prompts from "{selectedBook?.title}"</h3>
            <div className="curate-actions">
              <button className="btn btn-sm" onClick={() => setSelected(new Set(prompts.map((_, i) => i)))}>
                Select All
              </button>
              <button className="btn btn-sm" onClick={() => setSelected(new Set())}>
                Clear
              </button>
              <button className="btn btn-sm" onClick={() => { setStep("browse"); setPrompts([]); }}>
                ← Back
              </button>
            </div>
          </div>

          <div className="prompt-list">
            {prompts.map((p, i) => (
              <label key={i} className={`prompt-item ${selected.has(i) ? "selected" : ""}`}>
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => togglePrompt(i)}
                />
                <div className="prompt-content">
                  <span className="prompt-type-badge">{p.type}</span>
                  <span className="prompt-text">{p.promptText.slice(0, 120)}...</span>
                </div>
              </label>
            ))}
          </div>

          <button
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 12 }}
            onClick={addToNotebook}
            disabled={selected.size === 0}
          >
            Add {selected.size} prompt page{selected.size !== 1 ? "s" : ""} to notebook
          </button>
        </>
      )}
    </div>
  );
}
