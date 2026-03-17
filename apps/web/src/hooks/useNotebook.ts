import { useReducer, useEffect } from "react";
import type { PageConfig, PrintSpec } from "@gravitypress/schemas";
import type { CoverConfig } from "@gravitypress/core";

// ============================================
// Types
// ============================================

export interface SequenceEntry {
  id: string;
  config: PageConfig;
}

export interface NotebookState {
  pages: SequenceEntry[];
  cover: CoverConfig;
  printSpec: PrintSpec;
  activePanel: "pages" | "cover" | "print" | "export";
  selectedPageIndex: number | null;
  previewPageIndex: number;
}

type Action =
  | { type: "ADD_PAGES"; configs: PageConfig[] }
  | { type: "REMOVE_PAGE"; index: number }
  | { type: "REORDER"; from: number; to: number }
  | { type: "UPDATE_PAGE"; index: number; config: PageConfig }
  | { type: "SET_COVER"; cover: Partial<CoverConfig> }
  | { type: "SET_PRINT_SPEC"; spec: Partial<PrintSpec> }
  | { type: "SET_PANEL"; panel: NotebookState["activePanel"] }
  | { type: "SELECT_PAGE"; index: number | null }
  | { type: "SET_PREVIEW"; index: number }
  | { type: "CLEAR_PAGES" }
  | { type: "LOAD"; state: NotebookState };

// ============================================
// Defaults
// ============================================

const defaultCover: CoverConfig = {
  title: "My Notebook",
  subtitle: "",
  author: "",
  backgroundColor: "#ffffff",
  textColor: "#222222",
  backCoverText: "",
};

const defaultPrintSpec: PrintSpec = {
  trimSize: "0600X0900",
  interiorColor: "BW",
  printQuality: "STD",
  bindingType: "PB",
  paperStock: "060UW444",
  coverFinish: "M",
};

const initialState: NotebookState = {
  pages: [],
  cover: defaultCover,
  printSpec: defaultPrintSpec,
  activePanel: "pages",
  selectedPageIndex: null,
  previewPageIndex: 0,
};

// ============================================
// Reducer
// ============================================

function reducer(state: NotebookState, action: Action): NotebookState {
  switch (action.type) {
    case "ADD_PAGES": {
      const newEntries: SequenceEntry[] = action.configs.map((config) => ({
        id: crypto.randomUUID(),
        config,
      }));
      const pages = [...state.pages, ...newEntries];
      return { ...state, pages, previewPageIndex: state.pages.length };
    }
    case "REMOVE_PAGE": {
      const pages = state.pages.filter((_, i) => i !== action.index);
      return {
        ...state,
        pages,
        selectedPageIndex: null,
        previewPageIndex: Math.min(state.previewPageIndex, Math.max(0, pages.length - 1)),
      };
    }
    case "REORDER": {
      const pages = [...state.pages];
      const [moved] = pages.splice(action.from, 1);
      pages.splice(action.to, 0, moved);
      return { ...state, pages };
    }
    case "UPDATE_PAGE": {
      const pages = state.pages.map((p, i) =>
        i === action.index ? { ...p, config: action.config } : p
      );
      return { ...state, pages };
    }
    case "SET_COVER":
      return { ...state, cover: { ...state.cover, ...action.cover } };
    case "SET_PRINT_SPEC":
      return { ...state, printSpec: { ...state.printSpec, ...action.spec } };
    case "SET_PANEL":
      return { ...state, activePanel: action.panel };
    case "SELECT_PAGE":
      return {
        ...state,
        selectedPageIndex: action.index,
        previewPageIndex: action.index ?? state.previewPageIndex,
      };
    case "SET_PREVIEW":
      return { ...state, previewPageIndex: action.index };
    case "CLEAR_PAGES":
      return { ...state, pages: [], selectedPageIndex: null, previewPageIndex: 0 };
    case "LOAD":
      return action.state;
    default:
      return state;
  }
}

// ============================================
// Hook
// ============================================

const STORAGE_KEY = "gp-notebook";

function loadSaved(): NotebookState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function useNotebook() {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    return loadSaved() || init;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return { state, dispatch };
}

// ============================================
// Helpers
// ============================================

/** Map Lulu trim size to PaperSize for SVG generators */
export function trimToPaper(trimSize: string): "LETTER" | "A4" | "A5" | "HALF_LETTER" {
  switch (trimSize) {
    case "0850X1100": return "LETTER";
    case "0583X0827": return "A5";
    case "0550X0850": return "HALF_LETTER";
    default: return "LETTER"; // 6x9 → use LETTER for preview
  }
}

export function pageTypeLabel(type: string): string {
  switch (type) {
    case "polar": return "Polar Grid";
    case "lined": return "Lined";
    case "dot": return "Dot Grid";
    case "cartesian": return "Graph Paper";
    case "blank": return "Blank";
    case "prompt": return "Prompt";
    default: return type;
  }
}
