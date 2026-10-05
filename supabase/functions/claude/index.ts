// Función de servidor: recibe la petición de la app, comprueba la sesión y llama a Claude.
// La clave de Anthropic vive solo aquí (secreto ANTHROPIC_API_KEY), nunca en el navegador.
import Anthropic from "npm:@anthropic-ai/sdk@0.131.0";
import { createClient } from "npm:@supabase/supabase-js@2.117.2";

const MODEL = "claude-opus-5-5";
// Nivel de esfuerzo según el tipo de tarea que pide la app
const EFFORT: Record<string, "low" | "medium" | "high"> = { quick: "low", default: "medium", complex: "high" };
const MAX_INPUT_CHARS = 120_000;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const fail = (code: string, message: string, status: number) => json({ error: { code, message } }, status);

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return fail("invalid_request", "Usa POST.", 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const authHeader = req.headers.get("Authorization") ?? "";
  const asUser = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
  const { data: { user } } = await asUser.auth.getUser();
  if (!user?.email) return fail("session_expired", "Tu sesión expiró. Vuelve a entrar.", 401);

  // Solo los correos autorizados pueden usar Claude (evita que otra cuenta gaste tu saldo)
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: allowed } = await admin.from("allowed_users").select("email").eq("email", user.email.toLowerCase()).maybeSingle();
  if (!allowed) return fail("not_granted", "Esta cuenta no está autorizada para usar Claude.", 403);

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return fail("not_configured", "Falta configurar la clave de Anthropic en Supabase.", 503);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return fail("invalid_request", "El cuerpo no es JSON.", 400); }
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
  const stream = client.beta.messages.stream(params as any, { signal: req.signal });

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
});
