import { extractPrompts, CURATED_BOOKS } from "@gravitypress/core";
import type { ExtractOptions } from "@gravitypress/core";

type CorsHeaders = Record<string, string>;
type Env = { NPE_API_BASE: string };

/**
 * Handle Gutenberg-related API routes.
 * All public (no auth required).
 */
export async function handleGutenbergRoute(
  req: Request,
  url: URL,
  corsHeaders: CorsHeaders,
  env?: Env
): Promise<Response | null> {
  const npeBase = env?.NPE_API_BASE || "https://npe-api.tem-527.workers.dev";

  // ---- Search Gutenberg via Gutendex ----
  if (url.pathname === "/api/gutenberg/search" && req.method === "GET") {
    const query = url.searchParams.get("q") || "";
    const page = url.searchParams.get("page") || "1";
    const topic = url.searchParams.get("topic") || "";

    const params = new URLSearchParams();
    if (query) params.set("search", query);
    if (topic) params.set("topic", topic);
    params.set("page", page);
    params.set("languages", "en");

    const res = await fetch(`https://gutendex.com/books?${params}`);
    if (!res.ok) {
      return jsonResponse(502, { error: "Gutendex search failed" }, corsHeaders);
    }

    const data = await res.json();
    // Simplify the response
    const books = ((data as any).results || []).map((b: any) => ({
      id: b.id,
      title: b.title,
      authors: (b.authors || []).map((a: any) => a.name),
      subjects: b.subjects || [],
      downloads: b.download_count,
    }));

    return jsonResponse(200, {
      count: (data as any).count,
      books,
      next: !!(data as any).next,
    }, corsHeaders);
  }

  // ---- Curated book list ----
  if (url.pathname === "/api/gutenberg/curated" && req.method === "GET") {
    return jsonResponse(200, { books: CURATED_BOOKS }, corsHeaders);
  }

  // ---- Get book structure (via npe-api preprocessor) ----
  if (url.pathname.match(/^\/api\/gutenberg\/book\/\d+\/structure$/) && req.method === "GET") {
    const idMatch = url.pathname.match(/\/book\/(\d+)\//);
    if (!idMatch) return jsonResponse(400, { error: "Invalid book ID" }, corsHeaders);
    const bookId = idMatch[1];

    // Proxy to npe-api's Gutenberg preprocessor (handles cleanup, chapter detection, paragraph extraction)
    const res = await fetch(`${npeBase}/gutenberg/book/${bookId}/structure`);
    if (!res.ok) {
      return jsonResponse(res.status, { error: "Failed to fetch book structure from npe-api" }, corsHeaders);
    }
    const data = await res.json();
    return jsonResponse(200, data, corsHeaders);
  }

  // ---- Get a specific section (via npe-api) ----
  if (url.pathname.match(/^\/api\/gutenberg\/book\/\d+\/section\/\d+$/) && req.method === "GET") {
    const match = url.pathname.match(/\/book\/(\d+)\/section\/(\d+)$/);
    if (!match) return jsonResponse(400, { error: "Invalid path" }, corsHeaders);

    const res = await fetch(`${npeBase}/gutenberg/book/${match[1]}/section/${match[2]}`);
    if (!res.ok) {
      return jsonResponse(res.status, { error: "Failed to fetch section" }, corsHeaders);
    }
    const data = await res.json();
    return jsonResponse(200, data, corsHeaders);
  }

  // ---- Fetch raw text (fallback, with Gutenberg header/footer stripped) ----
  if (url.pathname.match(/^\/api\/gutenberg\/book\/\d+\/text$/) && req.method === "GET") {
    const idMatch = url.pathname.match(/\/book\/(\d+)\//);
    if (!idMatch) return jsonResponse(400, { error: "Invalid book ID" }, corsHeaders);
    const bookId = idMatch[1];

    const text = await fetchGutenbergText(bookId);
    if (!text) {
      return jsonResponse(404, { error: "Book text not found" }, corsHeaders);
    }

    return jsonResponse(200, { bookId: +bookId, text, length: text.length }, corsHeaders);
  }

  // ---- Extract prompts from a post-social node (best quality — uses pyramid chunks + curator) ----
  if (url.pathname === "/api/gutenberg/prompts-from-node" && req.method === "POST") {
    const json = await req.json().catch(() => null) as Record<string, unknown> | null;
    if (!json) return jsonResponse(400, { error: "Invalid JSON" }, corsHeaders);

    const nodeId = json.nodeId as string;
    const title = (json.title as string) || "Unknown";
    const author = (json.author as string) || "Unknown";
    const gutenbergId = (json.gutenbergId as number) || 0;
    const maxPrompts = (json.maxPrompts as number) || 50;

    // Fetch chunks from post-social-api (already cleaned, chunked, and scored)
    const psBase = "https://post-social-api.tem-527.workers.dev";
    try {
      const chunksRes = await fetch(`${psBase}/api/nodes/${nodeId}/chapters?source=chunks`);
      if (!chunksRes.ok) {
        return jsonResponse(404, { error: "Node not found or no chunks available" }, corsHeaders);
      }
      const chunksData = await chunksRes.json() as any;
      const chapters = chunksData.chapters || [];

      // Concatenate chunk content for prompt extraction
      const text = chapters.map((ch: any) => ch.content || "").join("\n\n");

      if (!text || text.length < 100) {
        return jsonResponse(404, { error: "Node has insufficient text content" }, corsHeaders);
      }

      const prompts = extractPrompts(text, title, author, gutenbergId, { maxPrompts });
      return jsonResponse(200, {
        source: "post-social-node",
        nodeId,
        title,
        author,
        promptCount: prompts.length,
        prompts,
      }, corsHeaders);
    } catch (e) {
      return jsonResponse(502, { error: "Failed to fetch from post-social-api" }, corsHeaders);
    }
  }

  // ---- Extract prompts from a book (raw Gutenberg text, fallback) ----
  if (url.pathname === "/api/gutenberg/prompts" && req.method === "POST") {
    const json = await req.json().catch(() => null) as Record<string, unknown> | null;
    if (!json) {
      return jsonResponse(400, { error: "Invalid JSON" }, corsHeaders);
    }

    const bookId = json.bookId as number;
    const title = (json.title as string) || "Unknown";
    const author = (json.author as string) || "Unknown";
    const maxPrompts = (json.maxPrompts as number) || 50;

    // Try npe-api preprocessed sections first (clean text), then raw fallback
    let text = json.text as string | undefined;
    if (!text) {
      try {
        // Get structure from npe-api preprocessor
        const structRes = await fetch(`${npeBase}/gutenberg/book/${bookId}/structure`);
        if (structRes.ok) {
          const struct = await structRes.json() as any;
          // Fetch all sections and concatenate
          const sections: string[] = [];
          const sectionCount = struct.structure?.length || 0;
          for (let i = 0; i < sectionCount; i++) {
            const secRes = await fetch(`${npeBase}/gutenberg/book/${bookId}/section/${i}`);
            if (secRes.ok) {
              const sec = await secRes.json() as any;
              sections.push(sec.content || sec.text || "");
            }
          }
          if (sections.length > 0) {
            text = sections.join("\n\n");
          }
        }
      } catch {
        // Fall through to raw fetch
      }

      // Fallback: fetch raw and strip
      if (!text) {
        text = await fetchGutenbergText(String(bookId)) || undefined;
      }
    }

    if (!text) {
      return jsonResponse(404, { error: "Could not fetch book text" }, corsHeaders);
    }

    const options: ExtractOptions = {
      maxPrompts,
      types: json.types as any,
    };

    const prompts = extractPrompts(text, title, author, bookId, options);

    return jsonResponse(200, {
      bookId,
      title,
      author,
      promptCount: prompts.length,
      prompts,
    }, corsHeaders);
  }

  return null;
}

// ---- Helpers ----

async function fetchGutenbergText(bookId: string): Promise<string | null> {
  const urls = [
    `https://www.gutenberg.org/cache/epub/${bookId}/pg${bookId}.txt`,
    `https://www.gutenberg.org/files/${bookId}/${bookId}-0.txt`,
    `https://www.gutenberg.org/files/${bookId}/${bookId}.txt`,
  ];

  for (const u of urls) {
    try {
      const res = await fetch(u);
      if (res.ok) {
        return stripGutenbergWrapper(await res.text());
      }
    } catch {
      continue;
    }
  }
  return null;
}

function stripGutenbergWrapper(text: string): string {
  // Remove header (everything before "*** START OF")
  const startMarker = text.indexOf("*** START OF");
  if (startMarker !== -1) {
    const headerEnd = text.indexOf("\n", startMarker);
    if (headerEnd !== -1) text = text.substring(headerEnd + 1);
  }

  // Remove footer (everything after "*** END OF")
  const endMarker = text.indexOf("*** END OF");
  if (endMarker !== -1) {
    text = text.substring(0, endMarker);
  }

  return text.trim();
}

function jsonResponse(status: number, body: unknown, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}
