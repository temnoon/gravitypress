import { z } from "zod";

// ============================================
// Prompt Page
// ============================================

export const PromptPageConfig = z.object({
  version: z.literal(1),
  type: z.literal("prompt").default("prompt"),
  paper: z.enum(["LETTER", "A4", "A5", "HALF_LETTER"]).default("LETTER"),

  // layout (in inches)
  marginTop: z.number().min(0).max(3).default(0.75),
  marginBottom: z.number().min(0).max(3).default(0.75),
  marginLeft: z.number().min(0).max(3).default(1),
  marginRight: z.number().min(0).max(3).default(0.75),

  // prompt content
  promptText: z.string().min(1).max(2000),
  sourceAttribution: z.string().max(500).optional(),

  // prompt area styling
  promptFontSize: z.number().min(8).max(24).default(11), // points
  promptAreaFraction: z.number().min(0.1).max(0.6).default(0.25), // fraction of drawable height

  // response area
  responseType: z.enum(["lined", "blank", "dot"]).default("lined"),
  lineSpacing: z.number().min(0.1).max(1).default(0.3125), // college ruled
  lineColor: z.string().default("#c0c0c0"),
  dotSpacing: z.number().min(0.1).max(1).default(0.1967), // 5mm
  dotRadius: z.number().min(0.005).max(0.05).default(0.012),
  dotColor: z.string().default("#cccccc"),

  // divider between prompt and response area
  showDivider: z.boolean().default(true),
  dividerColor: z.string().default("#999999"),
});

export type PromptPageConfig = z.infer<typeof PromptPageConfig>;
