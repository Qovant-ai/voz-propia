// Función de servidor de Voz Propia (app personal, sin cuentas).
// Cada dispositivo manda su llave de acceso en "x-vp-key"; aquí se compara su huella SHA-256 con public.app_keys.
// Con la llave válida: lee y guarda documentos (public.vp_docs) y llama a Claude.
// La clave de Anthropic vive solo aquí (secreto ANTHROPIC_API_KEY), nunca en el navegador.
import Anthropic from "npm:@anthropic-ai/sdk@0.131.0";
import { createClient } from "npm:@supabase/supabase-js@2.117.2";

const MODEL = "claude-opus-5-5";
// Nivel de esfuerzo según el tipo de tarea que pide la app
const EFFORT: Record<string, "low" | "medium" | "high"> = { quick: "low", default: "medium", complex: "high" };
const MAX_INPUT_CHARS = 120_000;
const PATH = /^[A-Za-z0-9_-]+(\/[A-Za-z0-9_.:-]+)+$/;
const PREFIX = /^[A-Za-z0-9_-]+(\/[A-Za-z0-9_.:-]+)*$/;
const FIELD = /^[A-Za-z0-9_]+$/;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "x-vp-key, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const fail = (code: string, message: string, status: number) => json({ error: { code, message } }, status);

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

async function sha256(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

type Turn = { role: "user" | "assistant"; content: string };
function readInput(body: Record<string, unknown>): Turn[] | null {
  if (typeof body.prompt === "string" && body.prompt.trim()) return [{ role: "user", content: body.prompt }];
  if (Array.isArray(body.messages)) {
    const turns = body.messages
      .filter((m): m is Turn => !!m && (m as Turn).role in { user: 1, assistant: 1 } && typeof (m as Turn).content === "string" && (m as Turn).content.trim() !== "")
      .map((m) => ({ role: m.role, content: m.content }));
    if (turns.length && turns[0].role === "user" && turns[turns.length - 1].role === "user") return turns;
  }
  return null;
}

function errorCode(e: unknown): string {
  if (e instanceof Anthropic.RateLimitError) return "rate_limited";
  if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) return "not_configured";
  if (e instanceof Anthropic.BadRequestError) return "invalid_request";
  if (e instanceof Anthropic.APIUserAbortError) return "cancelled";
  return "upstream_error";
}

function claude(body: Record<string, unknown>, signal: AbortSignal) {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return fail("not_configured", "Falta configurar la clave de Anthropic en Supabase.", 503);
  const messages = readInput(body);
  if (!messages) return fail("invalid_request", "Falta el texto para Claude.", 400);
  if (messages.reduce((n, m) => n + m.content.length, 0) > MAX_INPUT_CHARS) return fail("prompt_too_large", "El texto es demasiado largo.", 413);
  const effort = EFFORT[String(body.tier ?? "default")] ?? "medium";

  const client = new Anthropic({ apiKey });
  // Respaldo automático del servidor si el modelo rechaza una petición (fallbacks: "default")
  const params = {
    model: MODEL,
    max_tokens: 32000,
    output_config: { effort },
    messages,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  };
  // deno-lint-ignore no-explicit-any
  const stream = client.beta.messages.stream(params as any, { signal });

  const enc = new TextEncoder();
  const out = new ReadableStream({
    async start(ctrl) {
      const send = (o: unknown) => ctrl.enqueue(enc.encode(`data: ${JSON.stringify(o)}\n\n`));
      try {
        for await (const ev of stream) {
          if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") send({ t: ev.delta.text });
        }
        const msg = await stream.finalMessage();
        if (msg.stop_reason === "refusal") send({ error: { code: "refused", message: "Claude no pudo responder a esta petición." } });
        else send({ done: true, stop: msg.stop_reason, truncated: msg.stop_reason === "max_tokens" });
      } catch (e) {
        send({ error: { code: errorCode(e), message: e instanceof Error ? e.message.slice(0, 200) : "Error" } });
      }
      ctrl.close();
    },
    cancel() { stream.abort(); },
  });
  return new Response(out, { headers: { ...cors, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return fail("invalid_request", "Usa POST.", 405);

  const key = req.headers.get("x-vp-key") ?? "";
  if (key.length < 32 || key.length > 200) return fail("not_granted", "Este dispositivo no tiene la llave de acceso.", 401);
  const { data: granted, error: keyErr } = await admin.from("app_keys").select("hash").eq("hash", await sha256(key)).is("revoked_at", null).maybeSingle();
  if (keyErr) return fail("upstream_error", "No se pudo revisar la llave de acceso.", 500);
  if (!granted) return fail("not_granted", "La llave de acceso no es válida.", 403);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return fail("invalid_request", "El cuerpo no es JSON.", 400); }
  const T = () => admin.from("vp_docs");
  const path = String(body.path ?? "");

  switch (body.op) {
    case "ping":
      return json({ ok: true });
    case "get": {
      if (!PATH.test(path)) return fail("invalid_request", "Ruta no válida.", 400);
      const { data, error } = await T().select("data").eq("path", path).maybeSingle();
      return error ? fail("db_error", error.message, 500) : json({ data: data?.data ?? null });
    }
    case "set": {
      if (!PATH.test(path) || body.data == null || typeof body.data !== "object") return fail("invalid_request", "Ruta o datos no válidos.", 400);
      const { error } = await T().upsert({ path, data: body.data }, { onConflict: "path" });
      return error ? fail("db_error", error.message, 500) : json({ ok: true });
    }
    case "delete": {
      if (!PATH.test(path)) return fail("invalid_request", "Ruta no válida.", 400);
      const { error } = await T().delete().eq("path", path);
      return error ? fail("db_error", error.message, 500) : json({ ok: true });
    }
    case "list": {
      const prefix = String(body.prefix ?? ""), order = body.order ? String(body.order) : "";
      if (!PREFIX.test(prefix) || (order && !FIELD.test(order))) return fail("invalid_request", "Colección no válida.", 400);
      const depth = prefix.split("/").length + 1;
      let q = T().select("path,data").like("path", prefix + "/%");
      q = order ? q.order("data->" + order, { ascending: body.dir !== "desc", nullsFirst: false }) : q.order("path");
      q = q.limit(Math.min(Math.max(Number(body.limit) || 1000, 1), 1000));
      const { data, error } = await q;
      if (error) return fail("db_error", error.message, 500);
      return json({ docs: (data ?? []).filter((r) => r.path.split("/").length === depth) });
    }
    case "claude":
      return claude(body, req.signal);
    default:
      return fail("invalid_request", "Operación desconocida.", 400);
  }
});
