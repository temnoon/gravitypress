import { z } from "zod";

// ============================================
// Common Types
// ============================================

export const PaperSize = z.enum(["LETTER", "A4", "A5", "HALF_LETTER"]);
export type PaperSize = z.infer<typeof PaperSize>;

export const ColorMode = z.enum(["SOLID", "GRADIENT", "RAINBOW"]);
export type ColorMode = z.infer<typeof ColorMode>;

// Paper dimensions in inches
export const PAPER_DIMENSIONS: Record<string, { width: number; height: number }> = {
  LETTER: { width: 8.5, height: 11 },
  A4: { width: 8.27, height: 11.69 },
  A5: { width: 5.83, height: 8.27 },
  HALF_LETTER: { width: 5.5, height: 8.5 },
};

// ============================================
// Polar Grid
// ============================================

export const PolarGridConfig = z.object({
  version: z.literal(1),
  type: z.literal("polar").default("polar"),
  paper: PaperSize.default("LETTER"),
  dpiPreview: z.number().int().min(72).max(600).default(150),

  // layout (in inches)
  marginTop: z.number().min(0).max(2).default(0.5),
  marginBottom: z.number().min(0).max(2).default(0.5),
  marginInner: z.number().min(0).max(2).default(0.6),
  marginOuter: z.number().min(0).max(2).default(0.5),

  // polar specifics
  circles: z.number().int().min(1).max(400).default(24),
  spokes: z.number().int().min(1).max(360).default(24),

  circleThickness: z.array(z.number().min(0.1).max(10)).default([0.35]),
  spokeThickness: z.array(z.number().min(0.1).max(10)).default([0.35]),

  circleColorMode: ColorMode.default("SOLID"),
  spokeColorMode: ColorMode.default("SOLID"),
  circleSolid: z.string().default("#000000"),
  spokeSolid: z.string().default("#000000"),

  rainbowStartHue: z.number().min(0).max(360).default(0),
  rainbowEndHue: z.number().min(0).max(360).default(360),

  spokeStartCircles: z.array(z.number().int().min(0).max(400)).default([])
});

export type PolarGridConfig = z.infer<typeof PolarGridConfig>;

// ============================================
// Lined Page
// ============================================

export const LinedPageConfig = z.object({
  version: z.literal(1),
  type: z.literal("lined").default("lined"),
  paper: PaperSize.default("LETTER"),

  // layout (in inches)
  marginTop: z.number().min(0).max(3).default(1),
  marginBottom: z.number().min(0).max(3).default(0.75),
  marginLeft: z.number().min(0).max(3).default(1.25),
  marginRight: z.number().min(0).max(3).default(0.75),

  // line specifics
  lineSpacing: z.number().min(0.1).max(1).default(0.3125), // 5/16 inch (college ruled)
  lineColor: z.string().default("#a0c4e8"),
  lineThickness: z.number().min(0.1).max(2).default(0.5),

  // optional margin line
  showMarginLine: z.boolean().default(true),
  marginLinePosition: z.number().min(0).max(3).default(1.25),
  marginLineColor: z.string().default("#f4a4a4"),
  marginLineThickness: z.number().min(0.1).max(2).default(0.5),

  // optional header line (thicker line at top)
  showHeaderLine: z.boolean().default(false),
  headerLineOffset: z.number().min(0).max(2).default(0.5),
});

export type LinedPageConfig = z.infer<typeof LinedPageConfig>;

// ============================================
// Dot Grid
// ============================================

export const DotGridConfig = z.object({
  version: z.literal(1),
  type: z.literal("dot").default("dot"),
  paper: PaperSize.default("LETTER"),

  // layout (in inches)
  marginTop: z.number().min(0).max(3).default(0.5),
  marginBottom: z.number().min(0).max(3).default(0.5),
  marginLeft: z.number().min(0).max(3).default(0.5),
  marginRight: z.number().min(0).max(3).default(0.5),

  // dot specifics
  dotSpacing: z.number().min(0.1).max(1).default(0.1967), // 5mm in inches
  dotRadius: z.number().min(0.005).max(0.05).default(0.015),
  dotColor: z.string().default("#cccccc"),
});

export type DotGridConfig = z.infer<typeof DotGridConfig>;

// ============================================
// Cartesian Grid (Graph Paper)
// ============================================

export const CartesianGridConfig = z.object({
  version: z.literal(1),
  type: z.literal("cartesian").default("cartesian"),
  paper: PaperSize.default("LETTER"),

  // layout (in inches)
  marginTop: z.number().min(0).max(3).default(0.5),
  marginBottom: z.number().min(0).max(3).default(0.5),
  marginLeft: z.number().min(0).max(3).default(0.5),
  marginRight: z.number().min(0).max(3).default(0.5),

  // grid specifics
  gridSpacing: z.number().min(0.05).max(1).default(0.25), // 1/4 inch
  lineColor: z.string().default("#c0c0c0"),
  lineThickness: z.number().min(0.1).max(2).default(0.25),

  // major grid lines
  showMajorLines: z.boolean().default(true),
  majorLineEvery: z.number().int().min(2).max(20).default(4),
  majorLineColor: z.string().default("#808080"),
  majorLineThickness: z.number().min(0.1).max(3).default(0.5),
});

export type CartesianGridConfig = z.infer<typeof CartesianGridConfig>;

// ============================================
// Blank Page
// ============================================

export const BlankPageConfig = z.object({
  version: z.literal(1),
  type: z.literal("blank").default("blank"),
  paper: PaperSize.default("LETTER"),
  backgroundColor: z.string().default("#ffffff"),
});

export type BlankPageConfig = z.infer<typeof BlankPageConfig>;

// ============================================
// Prompt Page
// ============================================

import { PromptPageConfig } from "./prompt";
export { PromptPageConfig } from "./prompt";
export type { PromptPageConfig as PromptPageConfigType } from "./prompt";

// ============================================
// Union Type for All Page Configs
// ============================================

export const PageConfig = z.discriminatedUnion("type", [
  PolarGridConfig,
  LinedPageConfig,
  DotGridConfig,
  CartesianGridConfig,
  BlankPageConfig,
  PromptPageConfig,
]);

export type PageConfig = z.infer<typeof PageConfig>;

// ============================================
// API Types
// ============================================

export const RenderRequest = z.object({
  kind: z.enum(["polar-grid", "lined", "dot-grid", "cartesian", "blank", "prompt"]),
  config: PageConfig
});

export type RenderRequest = z.infer<typeof RenderRequest>;

export const RenderResponse = z.object({
  svg: z.string()
});

export type RenderResponse = z.infer<typeof RenderResponse>;

// ============================================
// Lulu / Print Schemas
// ============================================

export {
  ShippingLevel,
  ShippingAddress,
  PrintJobStatus,
  TrimSize,
  TRIM_SIZE_LABELS,
  InteriorColor,
  PrintQuality,
  BindingType,
  BINDING_LABELS,
  PaperStock,
  PAPER_LABELS,
  CoverFinish,
  PrintSpec,
  LineItemCreate,
  PrintJobCreateRequest,
  CostCalculationRequest,
  CostCalculationResponse,
  CostLineItem,
  CoverDimensionsRequest,
} from "./lulu";
