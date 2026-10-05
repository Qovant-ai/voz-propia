/* ===================== App instalable: conecta Voz Propia con Supabase =====================
   Ofrece a la app la misma interfaz que el entorno de Claude (claude.use("db" | "sample" | "downloads")):
   - db: documentos por ruta ("items/abc", "state/progress") en la tabla public.docs, solo los tuyos (RLS).
   - sample: Claude a través de la función del servidor "claude" (la clave de Anthropic nunca llega al navegador).
   - downloads: guarda archivos con una descarga normal del navegador. */
(function () {
  const CFG = window.VP_CONFIG;
  const sb = window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  const APP_URL = location.origin + location.pathname;
  const STORE_KEY = `sb-${new URL(CFG.url).hostname.split(".")[0]}-auth-token`;
  const stored = () => { try { return JSON.parse(localStorage.getItem(STORE_KEY) || "null"); } catch { return null; } };
  const cp = v => v == null ? v : JSON.parse(JSON.stringify(v));

  // Mensajes propios de esta versión (la app los mezcla con los suyos)
  window.VP_HOST = {
    errors: {
      not_granted: "Esta cuenta no está autorizada para crear contenido con Claude.",
      session_expired: "Tu sesión expiró. Sal y vuelve a entrar desde Biblioteca → Ajustes.",
      not_configured: "Falta configurar la clave de Anthropic en Supabase.",
      offline: "Sin conexión. Lo guardado y las prácticas siguen funcionando; para crear algo nuevo necesitas internet.",
      prompt_too_large: "El texto es demasiado largo para enviarlo.",
    },
  };

  /* ---------- Sesión ---------- */
  let ready, user = stored()?.user || null, leaving = false, box = null, mode = "signin";
  const authed = new Promise(r => (ready = r));
  // Al volver desde el enlace de "olvidé mi contraseña" la pantalla de contraseña nueva se mantiene abierta
const enter = u => { if (u) user = u; if (!(box && !box.hidden && mode === "reset")) hideLogin(); ready(); };
  // Con una sesión guardada se entra de inmediato, aunque no haya conexión (lo local sigue funcionando)
  if (stored()) ready();
  sb.auth.getSession().then(({ data }) => { if (data.session) enter(data.session.user); else if (!stored()) showLogin("signin"); })
    .catch(() => { if (!stored()) showLogin("signin"); });
  sb.auth.onAuthStateChange((ev, session) => {
    if (ev === "PASSWORD_RECOVERY") { if (session) user = session.user; setTimeout(() => showLogin("reset")); return; }
    if (session && (ev === "SIGNED_IN" || ev === "INITIAL_SESSION")) enter(session.user);
    if (ev === "SIGNED_OUT" && !leaving) location.replace(APP_URL);
  });
  async function token() {
    const { data } = await sb.auth.getSession();
    const t = data.session?.access_token;
    if (!t) throw { code: "session_expired" };
    return t;
  }

  /* ---------- db ---------- */
  const T = () => sb.from("docs");
  const ok = ({ data, error }) => {
    if (error) throw Object.assign(new Error(error.message), { code: /JWT|401/.test(error.message + error.code) ? "session_expired" : "db_error" });
    return data;
  };
  const snap = (path, data) => ({ id: path.split("/").pop(), exists: data != null, data: () => cp(data ?? undefined), metadata: {} });
  function docRef(path) {
    const ref = {
      id: path.split("/").pop(), path,
      async get() { const row = ok(await T().select("data").eq("path", path).maybeSingle()); return snap(path, row?.data); },
      async set(v) { ok(await T().upsert({ user_id: user?.id, path, data: cp(v) }, { onConflict: "user_id,path" })); },
      async update(v) { const cur = await ref.get(); if (!cur.exists) throw { code: "invalid_argument" }; await ref.set({ ...cur.data(), ...v }); },
      async delete() { ok(await T().delete().eq("path", path)); },
      collection: p => colRef(path + "/" + p),
    };
    return ref;
  }
  function colRef(path, o = {}) {
    const depth = path.split("/").length + 1;
    return {
      path,
      doc: id => docRef(path + "/" + (id || Date.now().toString(36) + Math.random().toString(36).slice(2, 8))),
      orderBy: (f, dir = "asc") => colRef(path, { ...o, f, dir }),
      limit: n => colRef(path, { ...o, n }),
      async get() {
        let q = T().select("path,data").like("path", path + "/%");
        q = o.f ? q.order("data->" + o.f, { ascending: o.dir !== "desc", nullsFirst: false }) : q.order("path");
        if (o.n) q = q.limit(o.n);
        const docs = ok(await q).filter(r => r.path.split("/").length === depth).map(r => snap(r.path, r.data));
        return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: {} };
      },
      async add(v) { const r = this.doc(); await r.set(v); return r; },
    };
  }
  const db = { doc: docRef, collection: p => colRef(p) };

  /* ---------- sample (Claude) ---------- */
  const FN = CFG.url + "/functions/v1/claude";
  async function sample(input, o = {}) {
    const body = typeof input === "string" ? { prompt: input } : { messages: input };
    body.tier = o.modelTier || "default";
    if (!navigator.onLine) throw { code: "offline", text: "" };
    let res;
    try {
      res = await fetch(FN, { method: "POST", signal: o.signal, body: JSON.stringify(body),
        headers: { "content-type": "application/json", apikey: CFG.key, authorization: "Bearer " + await token() } });
    } catch (e) { if (e?.code) throw e; throw { code: o.signal?.aborted ? "cancelled" : "offline", text: "" }; }
    if (!res.ok) {
      let j = {}; try { j = await res.json(); } catch {}
      throw { code: j.error?.code || (res.status === 401 ? "session_expired" : "upstream_error"), message: j.error?.message || j.message, text: "" };
    }
    const reader = res.body.getReader(), dec = new TextDecoder();
    let buf = "", text = "", end = null;
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf("\n\n")) >= 0) {
          const line = buf.slice(0, i); buf = buf.slice(i + 2);
          if (!line.startsWith("data: ")) continue;
          const ev = JSON.parse(line.slice(6));
          if (ev.t) { text += ev.t; o.onText?.({ text, delta: ev.t }); }
          else if (ev.error) throw { code: ev.error.code, message: ev.error.message, text };
          else if (ev.done) end = ev;
        }
      }
    } catch (e) {
      if (o.signal?.aborted) throw { code: "cancelled", text };
      if (e?.code) throw e;
      throw { code: "offline", text };
    }
    if (!end) throw { code: "upstream_error", text };
    return { text, truncated: !!end.truncated, modelTierApplied: body.tier };
  }
  const JSON_RULE = "\n\nReply with only valid JSON: no code fences and no text before or after it.";
  function parseJson(s) {
    s = String(s).trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    try { return JSON.parse(s); } catch {}
    const a = s.search(/[[{]/), b = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
    if (a >= 0 && b > a) try { return JSON.parse(s.slice(a, b + 1)); } catch {}
    return undefined;
  }
  sample.json = async (input, o = {}) => {
    const inp = typeof input === "string" ? input + JSON_RULE
      : input.map((m, i, a) => i === a.length - 1 ? { ...m, content: m.content + JSON_RULE } : m);
    const { text } = await sample(inp, { modelTier: o.modelTier, signal: o.signal });
    const v = parseJson(text);
    if (v === undefined) throw { code: "invalid_json" };
    return v;
  };
  sample.limits = async () => ({ maxPromptBytes: 120000 });

  /* ---------- downloads ---------- */
  const downloads = {
    async save({ filename, data, mimeType }) {
      const type = mimeType || (/\.html?$/i.test(filename) ? "text/html;charset=utf-8" : "application/octet-stream");
      const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], { type }));
      const a = Object.assign(document.createElement("a"), { href: url, download: filename });
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      return { status: "saved" };
    },
  };

  window.claude = { use: async name => { await authed; return { db, sample, downloads }[name] || null; } };

  /* ---------- Instalar ---------- */
  let installEvt = null;
  addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; });
  addEventListener("appinstalled", () => { installEvt = null; });
  const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

  /* ---------- Cuenta en Ajustes ---------- */
  const escH = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  window.vpAccount = {
    row: () => `<div class="setrow"><h3>Cuenta</h3><p class="hint">Conectado como <b>${escH(user?.email || "—")}</b>. Tus datos se sincronizan entre el computador, la tablet y el teléfono.</p>
      <div class="chips">${!standalone() && installEvt ? `<button class="btn small" data-vp="install">Instalar app</button>` : ""}<button class="btn quiet small" data-vp="logout">Cerrar sesión</button></div>
      ${!standalone() && !installEvt ? `<p class="hint">Para instalarla: en Chrome o Edge, el ícono de instalar en la barra de direcciones; en Android, menú ⋮ → «Instalar app»; en iPhone, Safari → Compartir → «Agregar a inicio».</p>` : ""}</div>`,
  };
  document.addEventListener("click", async e => {
    const b = e.target.closest?.("[data-vp]");
    if (!b) return;
    if (b.dataset.vp === "install" && installEvt) { installEvt.prompt(); await installEvt.userChoice.catch(() => {}); installEvt = null; b.remove(); }
    if (b.dataset.vp === "logout") {
      if (!confirm("¿Cerrar sesión en este dispositivo? Tus datos quedan guardados en tu cuenta.")) return;
      leaving = true;
      try { await sb.auth.signOut({ scope: "local" }); } catch {}
      // Se borra la copia local de este dispositivo (salvo voces y velocidad, que son del dispositivo)
      try { Object.keys(localStorage).filter(k => k.startsWith("vp:") && !k.startsWith("vp:voice:")).forEach(k => localStorage.removeItem(k)); } catch {}
      location.replace(APP_URL);
    }
  });

  /* ---------- Pantalla de entrada ---------- */
  const TXT = {
    signin: { t: "Entrar", p: "Entra con tu correo para sincronizar tus lecturas, tarjetas y progreso.", go: "Entrar" },
    signup: { t: "Crear cuenta", p: "Usa tu correo y una contraseña de al menos 8 caracteres. Te llegará un correo para confirmarla.", go: "Crear cuenta" },
    forgot: { t: "Recuperar contraseña", p: "Te enviaré un enlace para crear una contraseña nueva.", go: "Enviar enlace" },
    reset: { t: "Contraseña nueva", p: "Escribe tu contraseña nueva (al menos 8 caracteres).", go: "Guardar contraseña" },
  };
  function showLogin(m) {
    mode = m;
    if (!box) {
      box = document.createElement("div");
      box.id = "vp-auth";
      box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-labelledby", "vp-auth-t");
      box.innerHTML = `<form class="vp-card" novalidate>
        <div class="vp-logo" aria-hidden="true"></div>
        <h1 id="vp-auth-t"></h1><p class="hint" id="vp-auth-p"></p>
        <label class="vp-f" id="vp-f-email"><span>Correo</span><input type="email" name="email" autocomplete="email" inputmode="email" required></label>
        <label class="vp-f" id="vp-f-pass"><span>Contraseña</span><input type="password" name="pass" minlength="8" required></label>
        <p class="vp-msg" role="status" aria-live="polite"></p>
        <button class="btn wide" type="submit" id="vp-go"></button>
        <div class="vp-links"><button type="button" class="btn quiet small" data-m="signin">Entrar</button><button type="button" class="btn quiet small" data-m="signup">Crear cuenta</button><button type="button" class="btn quiet small" data-m="forgot">Olvidé mi contraseña</button></div>
      </form>`;
      const logo = document.querySelector("header .brand");
      if (logo) box.querySelector(".vp-logo").append(logo.cloneNode(true));
      box.addEventListener("click", e => { const b = e.target.closest("[data-m]"); if (b) { e.preventDefault(); showLogin(b.dataset.m); } });
      box.querySelector("form").addEventListener("submit", submit);
      document.body.append(box);
    }
    const x = TXT[mode], f = box.querySelector("form");
    box.querySelector("#vp-auth-t").textContent = x.t;
    box.querySelector("#vp-auth-p").textContent = x.p;
    box.querySelector("#vp-go").textContent = x.go;
    box.querySelector("#vp-f-email").hidden = mode === "reset";
    box.querySelector("#vp-f-pass").hidden = mode === "forgot";
    f.pass.autocomplete = mode === "signin" ? "current-password" : "new-password";
    box.querySelectorAll("[data-m]").forEach(b => (b.hidden = b.dataset.m === mode || mode === "reset"));
    msg("");
    box.hidden = false;
    document.documentElement.classList.add("vp-locked");
    setTimeout(() => (mode === "reset" ? f.pass : f.email.value ? f.pass : f.email).focus(), 50);
  }
  function hideLogin() { if (box) box.hidden = true; document.documentElement.classList.remove("vp-locked"); }
  const msg = (t, bad) => { const p = box.querySelector(".vp-msg"); p.textContent = t; p.classList.toggle("bad", !!bad); };
  const authErr = e => {
    const m = String(e?.message || e || "");
    if (/invalid login credentials/i.test(m)) return "Correo o contraseña incorrectos.";
    if (/email not confirmed/i.test(m)) return "Primero confirma tu correo: revisa tu bandeja de entrada (y spam).";
    if (/already registered|already exists/i.test(m)) return "Ya existe una cuenta con ese correo. Entra con tu contraseña.";
    if (/rate limit|too many/i.test(m)) return "Demasiados intentos seguidos. Espera unos minutos.";
    if (/password/i.test(m) && /least|short|weak/i.test(m)) return "La contraseña es muy corta o débil. Usa al menos 8 caracteres.";
    if (/fetch|network/i.test(m)) return "Sin conexión. Revisa internet y vuelve a intentar.";
    return "No se pudo completar: " + m;
  };
  async function submit(e) {
    e.preventDefault();
    const f = e.target, email = f.email.value.trim().toLowerCase(), pass = f.pass.value, go = box.querySelector("#vp-go");
    if (mode !== "reset" && !/^\S+@\S+\.\S+$/.test(email)) return msg("Escribe un correo válido.", true);
    if (mode !== "forgot" && pass.length < 8) return msg("La contraseña necesita al menos 8 caracteres.", true);
    go.disabled = true; msg("Un momento…");
    try {
      if (mode === "signin") {
        const { error } = await sb.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        msg("Entrando…");
      } else if (mode === "signup") {
        const { data, error } = await sb.auth.signUp({ email, password: pass, options: { emailRedirectTo: APP_URL } });
        if (error) throw error;
        if (data.user && !data.user.identities?.length) throw new Error("already registered");
        if (!data.session) { msg("Listo. Te envié un correo para confirmar la cuenta: ábrelo en este dispositivo y volverás aquí con la sesión iniciada."); f.pass.value = ""; }
      } else if (mode === "forgot") {
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: APP_URL });
        if (error) throw error;
        msg("Te envié un enlace para crear una contraseña nueva. Ábrelo en este dispositivo.");
      } else if (mode === "reset") {
        const { error } = await sb.auth.updateUser({ password: pass });
        if (error) throw error;
        f.pass.value = ""; hideLogin(); enter(user);
      }
    } catch (err) { msg(authErr(err), true); }
    go.disabled = false;
  }
})();
