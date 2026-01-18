import { z } from "zod";

export const PaperSize = z.enum(["LETTER", "A4"]);
export const ColorMode = z.enum(["SOLID", "GRADIENT", "RAINBOW"]);

export const PolarGridConfig = z.object({
  version: z.literal(1),
  paper: PaperSize.default("LETTER"),
  dpiPreview: z.number().int().min(72).max(600).default(150),

  // layout (in inches, because print workflows)
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

export const RenderRequest = z.object({
  kind: z.literal("polar-grid"),
  config: PolarGridConfig
});

export type RenderRequest = z.infer<typeof RenderRequest>;

export const RenderResponse = z.object({
  svg: z.string()
});
export type RenderResponse = z.infer<typeof RenderResponse>;
