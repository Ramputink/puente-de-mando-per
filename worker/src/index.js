// Sincronización de progreso de Puente de Mando PER: documentos JSON en D1, protegidos por el código de tripulación.
const PATH = /^(players\/[a-z_]{1,20}(\/srs\/[a-z0-9_]{1,20})?|duels\/[\w-]{1,64}|plan\/main)$/;
const MAX_BODY = 1_500_000;

async function sameCode(given, expected) {
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([given, expected].map(s => crypto.subtle.digest("SHA-256", enc.encode(s))));
  return crypto.subtle.timingSafeEqual(a, b);
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const cors = env.ORIGINS.split(",").includes(origin) ? {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    } : { Vary: "Origin" };
    const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...cors } });
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    const code = (req.headers.get("Authorization") || "").replace(/^Bearer /, "");
    if (!code || !(await sameCode(code, env.CREW_CODE))) return json({ error: "unauthorized" }, 401);

    const url = new URL(req.url);
    if (req.method === "GET" && url.pathname === "/ping") return json({ ok: true });

    if (req.method === "GET" && url.pathname === "/changes") {
      const since = Number(url.searchParams.get("since")) || 0;
      const now = Date.now();
      const { results } = await env.DB.prepare("SELECT path, data, updated FROM docs WHERE updated >= ?").bind(since).all();
      return json({ now, docs: results.map(r => ({ path: r.path, data: JSON.parse(r.data), updated: r.updated })) });
    }

    if (req.method === "PUT" && url.pathname === "/doc") {
      const path = url.searchParams.get("path") || "";
      if (!PATH.test(path)) return json({ error: "bad_path" }, 400);
      const body = await req.text();
      if (body.length > MAX_BODY) return json({ error: "too_large" }, 413);
      let parsed;
      try { parsed = JSON.parse(body); } catch { return json({ error: "bad_json" }, 400); }
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return json({ error: "bad_json" }, 400);
      const updated = Date.now();
      await env.DB.prepare("INSERT INTO docs (path, data, updated) VALUES (?1, ?2, ?3) ON CONFLICT(path) DO UPDATE SET data = ?2, updated = ?3").bind(path, body, updated).run();
      return json({ updated });
    }
    return json({ error: "not_found" }, 404);
  },
};
