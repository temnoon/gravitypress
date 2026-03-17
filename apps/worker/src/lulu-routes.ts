import {
  LuluClient,
  buildPodPackageId,
} from "@gravitypress/core";
import {
  PrintSpec,
  CostCalculationRequest,
  ShippingAddress,
  ShippingLevel,
} from "@gravitypress/schemas";

type Env = {
  LULU_CLIENT_ID: string;
  LULU_CLIENT_SECRET: string;
  LULU_API_BASE?: string;
  LULU_SANDBOX_CLIENT_ID?: string;
  LULU_SANDBOX_CLIENT_SECRET?: string;
};

function createLuluClient(env: Env): LuluClient {
  // Use sandbox credentials if available and LULU_API_BASE points to sandbox
  const isSandbox =
    env.LULU_API_BASE?.includes("sandbox") ||
    (!env.LULU_CLIENT_ID && !!env.LULU_SANDBOX_CLIENT_ID);

  return new LuluClient({
    clientId: isSandbox
      ? env.LULU_SANDBOX_CLIENT_ID!
      : env.LULU_CLIENT_ID,
    clientSecret: isSandbox
      ? env.LULU_SANDBOX_CLIENT_SECRET!
      : env.LULU_CLIENT_SECRET,
    sandbox: isSandbox,
  });
}

/**
 * Handle Lulu-related API routes.
 * Returns a Response if the route matches, or null to pass through.
 */
export async function handleLuluRoute(
  req: Request,
  url: URL,
  env: Env,
  corsHeaders: Record<string, string>,
  auth: { sub: string } | null
): Promise<Response | null> {
  // ---- Public: Build Pod Package ID from PrintSpec ----
  if (url.pathname === "/api/lulu/pod-package-id" && req.method === "POST") {
    const json = await req.json().catch(() => null);
    const parsed = PrintSpec.safeParse(json);
    if (!parsed.success) {
      return jsonResponse(400, { error: "Invalid PrintSpec", details: parsed.error.issues }, corsHeaders);
    }
    const podPackageId = buildPodPackageId(parsed.data);
    return jsonResponse(200, { podPackageId }, corsHeaders);
  }

  // ---- Public: Calculate cost ----
  if (url.pathname === "/api/lulu/price" && req.method === "POST") {
    const json = await req.json().catch(() => null);
    if (!json) {
      return jsonResponse(400, { error: "Invalid JSON" }, corsHeaders);
    }

    // Accept either raw CostCalculationRequest or simplified form
    const body = json as Record<string, unknown>;
    const { printSpec, pageCount, quantity, shippingAddress, shippingLevel } = body;

    let podPackageId: string;
    if (printSpec) {
      const specParsed = PrintSpec.safeParse(printSpec);
      if (!specParsed.success) {
        return jsonResponse(400, { error: "Invalid printSpec", details: specParsed.error.issues }, corsHeaders);
      }
      podPackageId = buildPodPackageId(specParsed.data);
    } else if (body.pod_package_id) {
      podPackageId = body.pod_package_id as string;
    } else {
      return jsonResponse(400, { error: "Provide printSpec or pod_package_id" }, corsHeaders);
    }

    const addrParsed = ShippingAddress.safeParse(shippingAddress);
    if (!addrParsed.success) {
      return jsonResponse(400, { error: "Invalid shippingAddress", details: addrParsed.error.issues }, corsHeaders);
    }

    const levelParsed = ShippingLevel.safeParse(shippingLevel || "MAIL");

    const client = createLuluClient(env);
    const cost = await client.calculateCost({
      podPackageId,
      pageCount: (pageCount as number) || 100,
      quantity: (quantity as number) || 1,
      shippingAddress: addrParsed.data,
      shippingLevel: levelParsed.success ? levelParsed.data : "MAIL",
    });

    return jsonResponse(200, { podPackageId, cost }, corsHeaders);
  }

  // ---- Public: Get cover dimensions ----
  if (url.pathname === "/api/lulu/cover-dimensions" && req.method === "POST") {
    const json = await req.json().catch(() => null);
    if (!json) {
      return jsonResponse(400, { error: "Invalid JSON" }, corsHeaders);
    }

    const coverBody = json as Record<string, unknown>;
    let podPackageId: string;
    if (coverBody.printSpec) {
      const specParsed = PrintSpec.safeParse(coverBody.printSpec);
      if (!specParsed.success) {
        return jsonResponse(400, { error: "Invalid printSpec" }, corsHeaders);
      }
      podPackageId = buildPodPackageId(specParsed.data);
    } else {
      podPackageId = coverBody.pod_package_id as string;
    }
    const pageCount = coverBody.pageCount as number;

    if (!podPackageId || !pageCount) {
      return jsonResponse(400, { error: "Provide (printSpec or pod_package_id) and pageCount" }, corsHeaders);
    }

    const client = createLuluClient(env);
    const dimensions = await client.getCoverDimensions(podPackageId, pageCount);
    return jsonResponse(200, { podPackageId, dimensions }, corsHeaders);
  }

  // ---- Auth required below ----
  if (!auth) return null;

  // ---- Create print job ----
  if (url.pathname === "/api/lulu/print-job" && req.method === "POST") {
    const json = await req.json().catch(() => null);
    if (!json) {
      return jsonResponse(400, { error: "Invalid JSON" }, corsHeaders);
    }

    const client = createLuluClient(env);
    const result = await client.createPrintJob(json as any);
    return jsonResponse(201, result, corsHeaders);
  }

  // ---- Get print job status ----
  const statusMatch = url.pathname.match(/^\/api\/lulu\/print-job\/(\d+)\/status$/);
  if (statusMatch && req.method === "GET") {
    const client = createLuluClient(env);
    const result = await client.getPrintJobStatus(parseInt(statusMatch[1]));
    return jsonResponse(200, result, corsHeaders);
  }

  // ---- List print jobs ----
  if (url.pathname === "/api/lulu/print-jobs" && req.method === "GET") {
    const client = createLuluClient(env);
    const result = await client.listPrintJobs({
      page: parseInt(url.searchParams.get("page") || "1"),
      pageSize: parseInt(url.searchParams.get("page_size") || "20"),
      status: url.searchParams.get("status") || undefined,
    });
    return jsonResponse(200, result, corsHeaders);
  }

  // ---- Cancel print job ----
  const cancelMatch = url.pathname.match(/^\/api\/lulu\/print-job\/(\d+)\/cancel$/);
  if (cancelMatch && req.method === "POST") {
    const client = createLuluClient(env);
    const result = await client.cancelPrintJob(parseInt(cancelMatch[1]));
    return jsonResponse(200, result, corsHeaders);
  }

  // ---- Validate interior ----
  if (url.pathname === "/api/lulu/validate-interior" && req.method === "POST") {
    const json = await req.json().catch(() => null);
    if (!json) return jsonResponse(400, { error: "Invalid JSON" }, corsHeaders);
    const client = createLuluClient(env);
    const result = await client.validateInterior(
      (json as any).file_url,
      (json as any).pod_package_id
    );
    return jsonResponse(200, result, corsHeaders);
  }

  // ---- Validate cover ----
  if (url.pathname === "/api/lulu/validate-cover" && req.method === "POST") {
    const json = await req.json().catch(() => null);
    if (!json) return jsonResponse(400, { error: "Invalid JSON" }, corsHeaders);
    const client = createLuluClient(env);
    const result = await client.validateCover(
      (json as any).file_url,
      (json as any).pod_package_id,
      (json as any).page_count
    );
    return jsonResponse(200, result, corsHeaders);
  }

  return null;
}

function jsonResponse(
  status: number,
  body: unknown,
  headers: Record<string, string>
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}
