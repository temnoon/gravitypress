import type { PageConfig } from "@gravitypress/schemas";

// ============================================
// Preset System
// ============================================
//
// Page design presets are pure data — JSON objects stored in
// localStorage, R2, or loaded from files. No color literals
// or design values in component code.

export interface Preset {
  id: string;
  name: string;
  category: string;
  type: string; // page type: "polar", "lined", "dot", etc.
  config: Partial<PageConfig>;
  tags?: string[];
}

export interface Palette {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    line: string;
    dot: string;
    gradientStart: string;
    gradientEnd: string;
  };
}

// ============================================
// Built-in Palettes
// ============================================

export const PALETTES: Palette[] = [
  {
    id: "classic",
    name: "Classic Notebook",
    colors: {
      primary: "#333333",
      secondary: "#666666",
      accent: "#a0c4e8",
      background: "#ffffff",
      line: "#a0c4e8",
      dot: "#cccccc",
      gradientStart: "#333333",
      gradientEnd: "#999999",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    colors: {
      primary: "#1a1a2e",
      secondary: "#16213e",
      accent: "#0f3460",
      background: "#ffffff",
      line: "#c4c4d4",
      dot: "#9999aa",
      gradientStart: "#1a1a2e",
      gradientEnd: "#0f3460",
    },
  },
  {
    id: "forest",
    name: "Forest",
    colors: {
      primary: "#2d6a4f",
      secondary: "#40916c",
      accent: "#52b788",
      background: "#ffffff",
      line: "#95d5b2",
      dot: "#b7e4c7",
      gradientStart: "#1b4332",
      gradientEnd: "#52b788",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    colors: {
      primary: "#d62828",
      secondary: "#f77f00",
      accent: "#fcbf49",
      background: "#ffffff",
      line: "#f4a261",
      dot: "#e9c46a",
      gradientStart: "#d62828",
      gradientEnd: "#fcbf49",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    colors: {
      primary: "#023e8a",
      secondary: "#0077b6",
      accent: "#0096c7",
      background: "#ffffff",
      line: "#90e0ef",
      dot: "#ade8f4",
      gradientStart: "#03045e",
      gradientEnd: "#90e0ef",
    },
  },
  {
    id: "lavender",
    name: "Lavender",
    colors: {
      primary: "#5e548e",
      secondary: "#9f86c0",
      accent: "#be95c4",
      background: "#ffffff",
      line: "#d4b8e0",
      dot: "#e0b0d5",
      gradientStart: "#5e548e",
      gradientEnd: "#e0aaff",
    },
  },
  {
    id: "rust",
    name: "Rust & Iron",
    colors: {
      primary: "#6c3428",
      secondary: "#a44a3f",
      accent: "#d4a373",
      background: "#ffffff",
      line: "#d4a373",
      dot: "#cdb4a0",
      gradientStart: "#6c3428",
      gradientEnd: "#d4a373",
    },
  },
  {
    id: "monochrome",
    name: "Monochrome",
    colors: {
      primary: "#000000",
      secondary: "#444444",
      accent: "#888888",
      background: "#ffffff",
      line: "#cccccc",
      dot: "#bbbbbb",
      gradientStart: "#000000",
      gradientEnd: "#cccccc",
    },
  },
  {
    id: "blueprint",
    name: "Blueprint",
    colors: {
      primary: "#003566",
      secondary: "#006494",
      accent: "#0582ca",
      background: "#ffffff",
      line: "#0582ca",
      dot: "#80c4e8",
      gradientStart: "#001d3d",
      gradientEnd: "#0582ca",
    },
  },
  {
    id: "rose",
    name: "Rose Gold",
    colors: {
      primary: "#b76e79",
      secondary: "#c9a0a0",
      accent: "#f4a4a4",
      background: "#ffffff",
      line: "#f4c2c2",
      dot: "#f0d0d0",
      gradientStart: "#8b4553",
      gradientEnd: "#f4c2c2",
    },
  },
];

// ============================================
// Built-in Page Presets
// ============================================

export const PAGE_PRESETS: Preset[] = [
  // ---- Polar ----
  {
    id: "polar-classic",
    name: "Classic Grid",
    category: "Simple",
    type: "polar",
    config: { circles: 16, spokes: 16, circleColorMode: "SOLID", spokeColorMode: "SOLID" },
  },
  {
    id: "polar-dense",
    name: "Dense Grid",
    category: "Simple",
    type: "polar",
    config: { circles: 48, spokes: 48, circleColorMode: "SOLID", spokeColorMode: "SOLID" },
  },
  {
    id: "polar-clock",
    name: "Clock Face",
    category: "Themed",
    type: "polar",
    config: { circles: 12, spokes: 12, circleThickness: [0.5, 0.2, 0.2, 0.2], spokeThickness: [0.8, 0.3, 0.3, 0.3, 0.3] },
  },
  {
    id: "polar-target",
    name: "Target",
    category: "Themed",
    type: "polar",
    config: { circles: 5, spokes: 4, circleThickness: [1, 0.5, 0.5, 0.5, 1] },
  },
  {
    id: "polar-rainbow",
    name: "Rainbow Spiral",
    category: "Colorful",
    type: "polar",
    config: { circles: 24, spokes: 24, circleColorMode: "RAINBOW", spokeColorMode: "RAINBOW", rainbowStartHue: 0, rainbowEndHue: 360 },
  },
  {
    id: "polar-gradient-burst",
    name: "Gradient Burst",
    category: "Colorful",
    type: "polar",
    config: { circles: 30, spokes: 36, circleColorMode: "GRADIENT_PLUS", spokeColorMode: "GRADIENT_PLUS" },
  },
  {
    id: "polar-starburst",
    name: "Starburst",
    category: "Artistic",
    type: "polar",
    config: { circles: 8, spokes: 48, spokeStartCircles: [0, 2, 0, 3, 0, 1], spokeThickness: [0.5, 0.2, 0.3, 0.2] },
  },
  {
    id: "polar-web",
    name: "Spider Web",
    category: "Artistic",
    type: "polar",
    config: { circles: 10, spokes: 24, spokeStartCircles: [0], circleThickness: [0.2], spokeThickness: [0.15] },
  },
  {
    id: "polar-extended",
    name: "Extended to Corners",
    category: "Layout",
    type: "polar",
    config: { circles: 20, spokes: 16, extendCircles: true },
  },
  {
    id: "polar-nested",
    name: "Nested Rings",
    category: "Artistic",
    type: "polar",
    config: { circles: 36, spokes: 12, circleThickness: [1, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2], spokeStartCircles: [0, 12, 0, 24, 0, 12] },
  },

  // ---- Lined ----
  {
    id: "lined-college",
    name: "College Ruled",
    category: "Standard",
    type: "lined",
    config: { lineSpacing: 0.3125, showMarginLine: true, showHeaderLine: false },
  },
  {
    id: "lined-wide",
    name: "Wide Ruled",
    category: "Standard",
    type: "lined",
    config: { lineSpacing: 0.4375, showMarginLine: true, showHeaderLine: false },
  },
  {
    id: "lined-narrow",
    name: "Narrow Ruled",
    category: "Standard",
    type: "lined",
    config: { lineSpacing: 0.1967, showMarginLine: false, showHeaderLine: false },
  },
  {
    id: "lined-legal",
    name: "Legal Pad",
    category: "Themed",
    type: "lined",
    config: { lineSpacing: 0.3438, showMarginLine: true, showHeaderLine: true, headerLineOffset: 0.5 },
  },
  {
    id: "lined-minimal",
    name: "Minimal Lines",
    category: "Simple",
    type: "lined",
    config: { lineSpacing: 0.3125, showMarginLine: false, showHeaderLine: false },
  },

  // ---- Dot ----
  {
    id: "dot-standard",
    name: "Standard (5mm)",
    category: "Standard",
    type: "dot",
    config: { dotSpacing: 0.1967, dotRadius: 0.015 },
  },
  {
    id: "dot-fine",
    name: "Fine (3mm)",
    category: "Dense",
    type: "dot",
    config: { dotSpacing: 0.118, dotRadius: 0.008 },
  },
  {
    id: "dot-wide",
    name: "Wide (8mm)",
    category: "Sparse",
    type: "dot",
    config: { dotSpacing: 0.315, dotRadius: 0.02 },
  },
  {
    id: "dot-bold",
    name: "Bold Dots",
    category: "Artistic",
    type: "dot",
    config: { dotSpacing: 0.25, dotRadius: 0.035 },
  },

  // ---- Cartesian ----
  {
    id: "cart-engineering",
    name: "Engineering (1/4\")",
    category: "Standard",
    type: "cartesian",
    config: { gridSpacing: 0.25, showMajorLines: true, majorLineEvery: 4 },
  },
  {
    id: "cart-5mm",
    name: "Metric (5mm)",
    category: "Standard",
    type: "cartesian",
    config: { gridSpacing: 0.1967, showMajorLines: true, majorLineEvery: 5 },
  },
  {
    id: "cart-fine",
    name: "Fine Grid",
    category: "Dense",
    type: "cartesian",
    config: { gridSpacing: 0.125, showMajorLines: true, majorLineEvery: 4 },
  },

  // ---- Prompt ----
  {
    id: "prompt-standard",
    name: "Standard Prompt",
    category: "Standard",
    type: "prompt",
    config: { promptAreaFraction: 0.25, responseType: "lined", promptFontSize: 11 },
  },
  {
    id: "prompt-half",
    name: "Half & Half",
    category: "Balanced",
    type: "prompt",
    config: { promptAreaFraction: 0.45, responseType: "lined", promptFontSize: 12 },
  },
  {
    id: "prompt-dot-response",
    name: "Prompt + Dot Grid",
    category: "Creative",
    type: "prompt",
    config: { promptAreaFraction: 0.2, responseType: "dot", promptFontSize: 11 },
  },
  {
    id: "prompt-freeform",
    name: "Prompt + Blank",
    category: "Creative",
    type: "prompt",
    config: { promptAreaFraction: 0.15, responseType: "blank", promptFontSize: 10 },
  },
];

// ============================================
// Preset + Palette Application
// ============================================

/**
 * Apply a palette's colors to a page config.
 * Maps palette color roles to the appropriate config fields based on page type.
 */
export function applyPalette(config: PageConfig, palette: Palette): PageConfig {
  const c = palette.colors;
  switch (config.type) {
    case "polar":
      return {
        ...config,
        circleSolid: c.primary,
        spokeSolid: c.secondary,
        circleGradientStart: c.gradientStart,
        circleGradientEnd: c.gradientEnd,
        spokeGradientStart: c.gradientStart,
        spokeGradientEnd: c.gradientEnd,
      };
    case "lined":
      return {
        ...config,
        lineColor: c.line,
        marginLineColor: c.accent,
      };
    case "dot":
      return { ...config, dotColor: c.dot };
    case "cartesian":
      return {
        ...config,
        lineColor: c.dot,
        majorLineColor: c.secondary,
      };
    case "prompt":
      return {
        ...config,
        lineColor: c.line,
        dotColor: c.dot,
        dividerColor: c.secondary,
      } as PageConfig;
    default:
      return config;
  }
}

/**
 * Apply a preset's partial config over a full config.
 */
export function applyPreset(baseConfig: PageConfig, preset: Preset): PageConfig {
  return { ...baseConfig, ...preset.config } as PageConfig;
}

// ============================================
// Persistence
// ============================================

const PRESETS_KEY = "gp-user-presets";
const PALETTES_KEY = "gp-user-palettes";

export function loadUserPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUserPresets(presets: Preset[]): void {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

export function loadUserPalettes(): Palette[] {
  try {
    const raw = localStorage.getItem(PALETTES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUserPalettes(palettes: Palette[]): void {
  localStorage.setItem(PALETTES_KEY, JSON.stringify(palettes));
}
