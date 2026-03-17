import type {
  PrintSpec,
  ShippingAddress,
  ShippingLevel,
  CostCalculationResponse,
} from "@gravitypress/schemas";

// ============================================
// Pod Package ID Builder
// ============================================

/**
 * Build a Lulu Pod Package ID from a human-readable PrintSpec.
 * The ID encodes trim size, color, quality, binding, paper, and cover finish.
 *
 * For paperback/coil: {trim}{color}{quality}{binding}{paper}{coverFinish}XX
 * The last two chars are linen color + foil stamping (XX = none for PB/CO).
 */
export function buildPodPackageId(spec: PrintSpec): string {
  return `${spec.trimSize}${spec.interiorColor}${spec.printQuality}${spec.bindingType}${spec.paperStock}${spec.coverFinish}XX`;
}

// ============================================
// Spine Width Calculator
// ============================================

/** Approximate spine width in inches based on page count and paper stock */
export function calculateSpineWidth(
  pageCount: number,
  paperStock: string
): number {
  const thicknessPerPage: Record<string, number> = {
    "060UW444": 0.0025, // 60# white
    "060UC444": 0.0028, // 60# cream
    "080CW444": 0.003, // 80# coated
  };
  const perPage = thicknessPerPage[paperStock] ?? 0.0025;
  return pageCount * perPage;
}

// ============================================
// Lulu API Client
// ============================================

interface LuluClientConfig {
  clientId: string;
  clientSecret: string;
  sandbox?: boolean;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export class LuluClient {
  private baseUrl: string;
  private authUrl: string;
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: LuluClientConfig) {
    const host = config.sandbox
      ? "api.sandbox.lulu.com"
      : "api.lulu.com";
    this.baseUrl = `https://${host}`;
    this.authUrl = `https://${host}/auth/realms/glasstree/protocol/openid-connect/token`;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
  }

  // ---- Auth ----

  private async authenticate(): Promise<string> {
    // Return cached token if still valid (with 60s buffer)
    if (this.accessToken && Date.now() < this.tokenExpiry - 60_000) {
      return this.accessToken;
    }

    const credentials = btoa(`${this.clientId}:${this.clientSecret}`);
    const res = await fetch(this.authUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Lulu auth failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as TokenResponse;
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000;
    return this.accessToken;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const token = await this.authenticate();
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Lulu API ${method} ${path} failed (${res.status}): ${text}`);
    }

    return (await res.json()) as T;
  }

  // ---- Cost Calculation ----

  /**
   * Calculate printing + shipping cost without creating a job.
   * All monetary values returned as decimal strings.
   */
  async calculateCost(params: {
    podPackageId: string;
    pageCount: number;
    quantity: number;
    shippingAddress: ShippingAddress;
    shippingLevel: ShippingLevel;
  }): Promise<CostCalculationResponse> {
    return this.request("POST", "/print-job-cost-calculations/", {
      line_items: [
        {
          quantity: params.quantity,
          pod_package_id: params.podPackageId,
          page_count: params.pageCount,
        },
      ],
      shipping_address: params.shippingAddress,
      shipping_option: params.shippingLevel,
    });
  }

  // ---- Cover Dimensions ----

  /**
   * Get required cover dimensions for a given product and page count.
   * Returns dimensions needed to generate a correctly-sized cover PDF.
   */
  async getCoverDimensions(
    podPackageId: string,
    pageCount: number
  ): Promise<Record<string, unknown>> {
    return this.request("POST", "/cover-dimensions/", {
      pod_package_id: podPackageId,
      interior_page_count: pageCount,
    });
  }

  // ---- Print Jobs ----

  /**
   * Create a print job. Files (interior + cover) are provided as URLs
   * that Lulu will fetch (e.g., from R2 presigned URLs).
   */
  async createPrintJob(params: {
    contactEmail: string;
    title?: string;
    podPackageId: string;
    pageCount?: number;
    quantity: number;
    interiorUrl: string;
    coverUrl: string;
    shippingAddress: ShippingAddress;
    shippingLevel: ShippingLevel;
    externalId?: string;
  }): Promise<Record<string, unknown>> {
    return this.request("POST", "/print-jobs/", {
      contact_email: params.contactEmail,
      external_id: params.externalId,
      line_items: [
        {
          quantity: params.quantity,
          pod_package_id: params.podPackageId,
          page_count: params.pageCount,
          title: params.title,
          interior: params.interiorUrl,
          cover: params.coverUrl,
        },
      ],
      shipping_address: params.shippingAddress,
      shipping_level: params.shippingLevel,
    });
  }

  /** Get status of a print job */
  async getPrintJobStatus(
    printJobId: number
  ): Promise<Record<string, unknown>> {
    return this.request("GET", `/print-jobs/${printJobId}/status/`);
  }

  /** List print jobs with optional filters */
  async listPrintJobs(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
  }): Promise<Record<string, unknown>> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.pageSize) query.set("page_size", String(params.pageSize));
    if (params?.status) query.set("status", params.status);
    const qs = query.toString();
    return this.request("GET", `/print-jobs/${qs ? `?${qs}` : ""}`);
  }

  /** Cancel a print job (only if status is UNPAID) */
  async cancelPrintJob(printJobId: number): Promise<Record<string, unknown>> {
    return this.request("PUT", `/print-jobs/${printJobId}/status/`, {
      status: { name: "CANCELED" },
    });
  }

  // ---- File Validation ----

  /** Validate an interior PDF before creating a print job */
  async validateInterior(
    fileUrl: string,
    podPackageId?: string
  ): Promise<Record<string, unknown>> {
    return this.request("POST", "/validate-interior/", {
      file_url: fileUrl,
      pod_package_id: podPackageId,
    });
  }

  /** Check interior validation status */
  async getInteriorValidation(
    validationId: string
  ): Promise<Record<string, unknown>> {
    return this.request("GET", `/validate-interior/${validationId}/`);
  }

  /** Validate a cover PDF */
  async validateCover(
    fileUrl: string,
    podPackageId: string,
    pageCount: number
  ): Promise<Record<string, unknown>> {
    return this.request("POST", "/validate-cover/", {
      file_url: fileUrl,
      pod_package_id: podPackageId,
      interior_page_count: pageCount,
    });
  }

  /** Check cover validation status */
  async getCoverValidation(
    validationId: string
  ): Promise<Record<string, unknown>> {
    return this.request("GET", `/validate-cover/${validationId}/`);
  }
}
