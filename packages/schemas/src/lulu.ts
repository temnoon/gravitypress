import { z } from "zod";

// ============================================
// Lulu Print API Schemas
// ============================================

export const ShippingLevel = z.enum([
  "MAIL",
  "PRIORITY_MAIL",
  "GROUND_HD",
  "GROUND_BUS",
  "GROUND",
  "EXPEDITED",
  "EXPRESS",
]);
export type ShippingLevel = z.infer<typeof ShippingLevel>;

export const ShippingAddress = z.object({
  name: z.string().optional(),
  street1: z.string(),
  street2: z.string().optional(),
  city: z.string(),
  state_code: z.string().optional(),
  country_code: z.string().length(2),
  postcode: z.string().max(64),
  phone_number: z.string().max(20),
  email: z.string().email().optional(),
  organization: z.string().optional(),
  is_business: z.boolean().default(false),
});
export type ShippingAddress = z.infer<typeof ShippingAddress>;

export const PrintJobStatus = z.enum([
  "CREATED",
  "UNPAID",
  "PAYMENT_IN_PROGRESS",
  "PRODUCTION_READY",
  "PRODUCTION_DELAYED",
  "IN_PRODUCTION",
  "ERROR",
  "SHIPPED",
  "CANCELED",
  "ACCEPTED",
  "REJECTED",
]);
export type PrintJobStatus = z.infer<typeof PrintJobStatus>;

// ============================================
// Pod Package ID Components
// ============================================

/** Trim sizes supported for notebooks MVP */
export const TrimSize = z.enum([
  "0600X0900", // 6x9
  "0550X0850", // 5.5x8.5
  "0583X0827", // A5
  "0850X1100", // 8.5x11 (US Letter)
]);
export type TrimSize = z.infer<typeof TrimSize>;

export const TRIM_SIZE_LABELS: Record<string, string> = {
  "0600X0900": '6" × 9" (US Trade)',
  "0550X0850": '5.5" × 8.5" (Digest)',
  "0583X0827": "A5 (5.83\" × 8.27\")",
  "0850X1100": '8.5" × 11" (US Letter)',
};

export const InteriorColor = z.enum(["BW", "FC"]);
export type InteriorColor = z.infer<typeof InteriorColor>;

export const PrintQuality = z.enum(["STD", "PRE"]);
export type PrintQuality = z.infer<typeof PrintQuality>;

export const BindingType = z.enum([
  "PB", // Perfect Binding (paperback)
  "CO", // Coil
  "LW", // Linen Wrap (hardcover)
  "CW", // Casewrap (hardcover)
  "SS", // Saddle Stitch
]);
export type BindingType = z.infer<typeof BindingType>;

export const BINDING_LABELS: Record<string, string> = {
  PB: "Paperback",
  CO: "Coil Bound",
  LW: "Linen Wrap Hardcover",
  CW: "Casewrap Hardcover",
  SS: "Saddle Stitch",
};

export const PaperStock = z.enum([
  "060UW444", // 60# Uncoated White
  "060UC444", // 60# Uncoated Cream
  "080CW444", // 80# Coated White
]);
export type PaperStock = z.infer<typeof PaperStock>;

export const PAPER_LABELS: Record<string, string> = {
  "060UW444": "60# White (standard)",
  "060UC444": "60# Cream",
  "080CW444": "80# Coated White (photo/color)",
};

export const CoverFinish = z.enum(["M", "G"]); // Matte, Gloss
export type CoverFinish = z.infer<typeof CoverFinish>;

// ============================================
// Print Spec (human-readable config → Pod Package ID)
// ============================================

export const PrintSpec = z.object({
  trimSize: TrimSize.default("0600X0900"),
  interiorColor: InteriorColor.default("BW"),
  printQuality: PrintQuality.default("STD"),
  bindingType: BindingType.default("PB"),
  paperStock: PaperStock.default("060UW444"),
  coverFinish: CoverFinish.default("M"),
});
export type PrintSpec = z.infer<typeof PrintSpec>;

// ============================================
// Line Item
// ============================================

export const LineItemCreate = z.object({
  quantity: z.number().int().min(1),
  pod_package_id: z.string().max(27),
  title: z.string().max(255).optional(),
  page_count: z.number().int().min(2).optional(),
  interior: z.string().url().optional(),
  cover: z.string().url().optional(),
  printable_id: z.string().uuid().optional(),
});
export type LineItemCreate = z.infer<typeof LineItemCreate>;

// ============================================
// Print Job
// ============================================

export const PrintJobCreateRequest = z.object({
  contact_email: z.string().email(),
  line_items: z.array(LineItemCreate).min(1),
  shipping_address: ShippingAddress,
  shipping_level: ShippingLevel,
  external_id: z.string().optional(),
  production_delay: z.number().int().min(60).max(2880).default(60),
});
export type PrintJobCreateRequest = z.infer<typeof PrintJobCreateRequest>;

// ============================================
// Cost Calculation
// ============================================

export const CostCalculationRequest = z.object({
  line_items: z
    .array(
      z.object({
        quantity: z.number().int().min(1),
        pod_package_id: z.string().max(27),
        page_count: z.number().int().min(2),
      })
    )
    .min(1),
  shipping_address: ShippingAddress,
  shipping_option: ShippingLevel,
});
export type CostCalculationRequest = z.infer<typeof CostCalculationRequest>;

export const CostLineItem = z.object({
  quantity: z.number(),
  cost_excl_discounts: z.string(),
  cost_excl_tax: z.string(),
  tax_rate: z.string(),
  total_cost_excl_tax: z.string(),
  total_cost_incl_tax: z.string(),
  total_tax: z.string(),
});
export type CostLineItem = z.infer<typeof CostLineItem>;

export const CostCalculationResponse = z.object({
  currency: z.string(),
  line_item_costs: z.array(CostLineItem),
  shipping_cost: z.object({
    total_cost_excl_tax: z.string(),
    total_cost_incl_tax: z.string(),
    total_tax: z.string(),
  }),
  total_cost_excl_tax: z.string(),
  total_cost_incl_tax: z.string(),
  total_tax: z.string(),
});
export type CostCalculationResponse = z.infer<typeof CostCalculationResponse>;

// ============================================
// Cover Dimensions
// ============================================

export const CoverDimensionsRequest = z.object({
  pod_package_id: z.string().max(27),
  page_count: z.number().int().min(2),
});
export type CoverDimensionsRequest = z.infer<typeof CoverDimensionsRequest>;
