import { PageConfig } from "@gravitypress/schemas";
import { renderPageSVG } from "@gravitypress/core";
import { handleLuluRoute } from "./lulu-routes";
import { handleGutenbergRoute } from "./gutenberg-routes";

type Env = {
  NPE_API_BASE: string;
  HUMANIZER_API_BASE?: string;
  LULU_CLIENT_ID: string;
  LULU_CLIENT_SECRET: string;
  LULU_API_BASE?: string;
  LULU_SANDBOX_CLIENT_ID?: string;
  LULU_SANDBOX_CLIENT_SECRET?: string;
  // GP_R2: R2Bucket;
};

function cors(origin: string | null) {
  // Lock to humanizer.com origins and dev localhost
  const allow = origin && (
    origin.endsWith(".humanizer.com") ||
    origin === "https://humanizer.com" ||
    origin.endsWith(".gravitypress.org") ||
    origin === "https://gravitypress.org" ||
    origin.endsWith(".gravity-press.com") ||
    origin === "https://gravity-press.com" ||
    origin.startsWith("http://localhost:")
  );
  return {
    "Access-Control-Allow-Origin": allow ? origin! : "null",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Authorization,Content-Type",
    "Access-Control-Max-Age": "86400"
  };
}

async function verifyAuth(env: Env, authHeader: string | null): Promise<{ sub: string } | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length);

  // Call npe-api to validate token/session
  const res = await fetch(`${env.NPE_API_BASE}/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
  });

  if (!res.ok) return null;
  return await res.json() as { sub: string };
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const origin = req.headers.get("Origin");
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(origin) });
    }

    const url = new URL(req.url);

    // Public, offline-friendly endpoint: render SVG without auth
    if (url.pathname === "/api/render/svg" && req.method === "POST") {
      const json = await req.json().catch(() => null);
      const parsed = PageConfig.safeParse(json);
      if (!parsed.success) {
        return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.issues }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...cors(origin) }
        });
      }
      const svg = renderPageSVG(parsed.data);
      return new Response(JSON.stringify({ svg }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...cors(origin) }
      });
    }

    // Health check endpoint
    if (url.pathname === "/health" && req.method === "GET") {
      return new Response(JSON.stringify({ status: "ok", service: "gravitypress-worker" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...cors(origin) }
      });
    }

    // Gutenberg routes (all public)
    const gutenbergResponse = await handleGutenbergRoute(req, url, cors(origin), env);
    if (gutenbergResponse) return gutenbergResponse;

    // Lulu routes (some public, some auth-required — handled internally)
    const auth = await verifyAuth(env, req.headers.get("Authorization"));

    const luluResponse = await handleLuluRoute(req, url, env, cors(origin), auth);
    if (luluResponse) return luluResponse;
    if (!auth) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...cors(origin) }
      });
    }

    // Presets endpoints (stub)
    if (url.pathname.startsWith("/api/presets")) {
      // TODO: implement presets CRUD
      return new Response(JSON.stringify({ message: "Presets endpoint (not implemented)", user: auth.sub }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...cors(origin) }
      });
    }

    // Catalog endpoints (stub)
    if (url.pathname.startsWith("/api/catalog")) {
      // TODO: implement catalog listing
      return new Response(JSON.stringify({ message: "Catalog endpoint (not implemented)", user: auth.sub }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...cors(origin) }
      });
    }

    // Gift endpoints (stub)
    if (url.pathname.startsWith("/api/gift")) {
      // TODO: implement gifting
      return new Response(JSON.stringify({ message: "Gift endpoint (not implemented)", user: auth.sub }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...cors(origin) }
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...cors(origin) }
    });
  }
};
