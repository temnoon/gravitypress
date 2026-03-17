import { useNotebook } from "../hooks/useNotebook";
import { PageTypePicker } from "./PageTypePicker";
import { SequenceBuilder } from "./SequenceBuilder";
import { NotebookPreview } from "./NotebookPreview";
import { CoverCustomizer } from "./CoverCustomizer";
import { PrintSpecSelector } from "./PrintSpecSelector";
import { ExportPanel } from "./ExportPanel";
import { GutenbergPrompts } from "./GutenbergPrompts";
import { PageConfigurator } from "./PageConfigurator";

const TABS = [
  { key: "pages", label: "Pages" },
  { key: "gutenberg", label: "Gutenberg" },
  { key: "cover", label: "Cover" },
  { key: "print", label: "Print" },
] as const;

export function NotebookComposer() {
  const { state, dispatch } = useNotebook();

  const selectedPage = state.selectedPageIndex !== null ? state.pages[state.selectedPageIndex] : null;
  const isEditing = selectedPage !== null && state.activePanel === "pages";

  return (
    <div className="composer">
      {/* Sidebar */}
      <div className="composer-sidebar">
        <div className="composer-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`tab ${state.activePanel === tab.key ? "active" : ""}`}
              onClick={() => dispatch({ type: "SET_PANEL", panel: tab.key })}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="composer-panel">
          {state.activePanel === "pages" && !isEditing && (
            <>
              <PageTypePicker
                trimSize={state.printSpec.trimSize}
                onAdd={(configs) => dispatch({ type: "ADD_PAGES", configs })}
              />
              <SequenceBuilder
                pages={state.pages}
                selectedIndex={state.selectedPageIndex}
                onSelect={(i) => dispatch({ type: "SELECT_PAGE", index: i })}
                onRemove={(i) => dispatch({ type: "REMOVE_PAGE", index: i })}
                onReorder={(from, to) => dispatch({ type: "REORDER", from, to })}
                onClear={() => dispatch({ type: "CLEAR_PAGES" })}
              />
            </>
          )}

          {isEditing && selectedPage && (
            <PageConfigurator
              config={selectedPage.config}
              pageIndex={state.selectedPageIndex!}
              onChange={(i, config) => dispatch({ type: "UPDATE_PAGE", index: i, config })}
              onClose={() => dispatch({ type: "SELECT_PAGE", index: null })}
            />
          )}

          {state.activePanel === "gutenberg" && (
            <GutenbergPrompts
              trimSize={state.printSpec.trimSize}
              onAddPages={(configs) => dispatch({ type: "ADD_PAGES", configs })}
            />
          )}

          {state.activePanel === "cover" && (
            <CoverCustomizer
              cover={state.cover}
              onChange={(update) => dispatch({ type: "SET_COVER", cover: update })}
            />
          )}

          {state.activePanel === "print" && (
            <PrintSpecSelector
              spec={state.printSpec}
              pageCount={state.pages.length}
              onChange={(update) => dispatch({ type: "SET_PRINT_SPEC", spec: update })}
            />
          )}
        </div>

        <ExportPanel state={state} />
      </div>

      {/* Preview */}
      <NotebookPreview
        pages={state.pages}
        currentIndex={state.previewPageIndex}
        onNavigate={(i) => dispatch({ type: "SET_PREVIEW", index: i })}
      />
    </div>
  );
}
