/* ===================== App instalable: conecta Voz Propia con su servidor (Supabase) =====================
   App personal, sin cuentas: cada dispositivo guarda una llave de acceso la primera vez que se abre con el
   enlace personal (…/#k=LLAVE). Ofrece a la app la misma interfaz que el entorno de Claude:
   - db: documentos por ruta ("items/abc", "state/progress") a través de la función "vp".
   - sample: Claude a través de la misma función (la clave de Anthropic nunca llega al navegador).
   - downloads: guarda archivos con una descarga normal del navegador. */
(function () {
  const CFG = window.VP_CONFIG;
  const FN = CFG.url + "/functions/v1/vp";
  const KEY = "vp-access";
  const cp = v => v == null ? v : JSON.parse(JSON.stringify(v));
  const getKey = () => { try { return localStorage.getItem(KEY) || ""; } catch { return ""; } };
  const setKey = k => { try { k ? localStorage.setItem(KEY, k) : localStorage.removeItem(KEY); } catch {} };
  const keyFrom = s => { s = String(s).trim(); return (s.match(/k=([A-Za-z0-9_-]{32,200})/) || s.match(/^([A-Za-z0-9_-]{32,200})$/) || [])[1] || ""; };

  // El enlace personal trae la llave después de "#k=": se guarda en este dispositivo y se borra de la barra de direcciones
  const fromUrl = location.hash.match(/[#&]k=([A-Za-z0-9_-]{32,200})/);
  if (fromUrl) { setKey(fromUrl[1]); history.replaceState(null, "", location.pathname + location.search); }

  // Mensajes propios de esta versión (la app los mezcla con los suyos)
  window.VP_HOST = {
    errors: {
      not_granted: "Este dispositivo no tiene acceso. Ábrelo con tu enlace personal.",
      not_configured: "Falta configurar la clave de Anthropic en Supabase.",
      offline: "Sin conexión. Lo guardado y las prácticas siguen funcionando; para crear algo nuevo necesitas internet.",
      prompt_too_large: "El texto es demasiado largo para enviarlo.",
    },
  };

  /* ---------- Acceso ---------- */
  let ready, box = null;
  const granted = new Promise(r => (ready = r));
  // Con la llave guardada se entra de inmediato, aunque no haya conexión (lo local sigue funcionando)
  if (getKey()) { ready(); check(); } else showGate();
  // Si la llave dejó de ser válida, se vuelve a pedir
  async function check() {
    if (!navigator.onLine) return;
    try { await call("ping"); } catch (e) { if (e.code === "not_granted") { setKey(""); showGate("Esta llave ya no es válida. Abre tu enlace personal nuevo."); } }
  }

  async function call(op, payload = {}, signal) {
    if (!navigator.onLine) throw { code: "offline", text: "" };
    let res;
    try {
      res = await fetch(FN, { method: "POST", signal, body: JSON.stringify({ op, ...payload }),
        headers: { "content-type": "application/json", apikey: CFG.key, "x-vp-key": getKey() } });
    } catch { throw { code: signal?.aborted ? "cancelled" : "offline", text: "" }; }
    if (!res.ok) {
      let j = {}; try { j = await res.json(); } catch {}
      throw { code: j.error?.code || "upstream_error", message: j.error?.message, text: "" };
    }
    return res;
  }
  const callJson = async (op, payload) => (await call(op, payload)).json();

  /* ---------- db ---------- */
  const snap = (path, data) => ({ id: path.split("/").pop(), exists: data != null, data: () => cp(data ?? undefined), metadata: {} });
  function docRef(path) {
    const ref = {
      id: path.split("/").pop(), path,
      async get() { const { data } = await callJson("get", { path }); return snap(path, data); },
      async set(v) { await callJson("set", { path, data: cp(v) }); },
      async update(v) { const cur = await ref.get(); if (!cur.exists) throw { code: "invalid_argument" }; await ref.set({ ...cur.data(), ...v }); },
      async delete() { await callJson("delete", { path }); },
      collection: p => colRef(path + "/" + p),
    };
    return ref;
  }
  function colRef(path, o = {}) {
    return {
      path,
      doc: id => docRef(path + "/" + (id || Date.now().toString(36) + Math.random().toString(36).slice(2, 8))),
      orderBy: (f, dir = "asc") => colRef(path, { ...o, f, dir }),
      limit: n => colRef(path, { ...o, n }),
      async get() {
        const { docs: rows } = await callJson("list", { prefix: path, order: o.f, dir: o.dir, limit: o.n });
        const docs = rows.map(r => snap(r.path, r.data));
        return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: {} };
      },
      async add(v) { const r = this.doc(); await r.set(v); return r; },
    };
  }
  const db = { doc: docRef, collection: p => colRef(p) };

  /* ---------- sample (Claude) ---------- */
  async function sample(input, o = {}) {
    const tier = o.modelTier || "default";
    const res = await call("claude", typeof input === "string" ? { prompt: input, tier } : { messages: input, tier }, o.signal);
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
    return { text, truncated: !!end.truncated, modelTierApplied: tier };
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

  window.claude = { use: async name => { await granted; return { db, sample, downloads }[name] || null; } };

  /* ---------- Instalar ---------- */
  let installEvt = null;
  addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; });
  addEventListener("appinstalled", () => { installEvt = null; });
  const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

  /* ---------- Dispositivo en Ajustes ---------- */
  window.vpAccount = {
    row: () => `<div class="setrow"><h3>Este dispositivo</h3><p class="hint">Conectado con tu llave personal. Tus datos se sincronizan entre el celular y la tablet.</p>
      <div class="chips">${!standalone() && installEvt ? `<button class="btn small" data-vp="install">Instalar app</button>` : ""}<button class="btn quiet small" data-vp="logout">Desconectar este dispositivo</button></div>
      ${!standalone() && !installEvt ? `<p class="hint">Para instalarla: en Android, Chrome → menú ⋮ → «Instalar app»; en iPhone, Safari → Compartir → «Agregar a inicio»; en el computador, el ícono de instalar en la barra de direcciones.</p>` : ""}</div>`,
  };
  document.addEventListener("click", async e => {
    const b = e.target.closest?.("[data-vp]");
    if (!b) return;
    if (b.dataset.vp === "install" && installEvt) { installEvt.prompt(); await installEvt.userChoice.catch(() => {}); installEvt = null; b.remove(); }
    if (b.dataset.vp === "logout") {
      if (!confirm("¿Desconectar este dispositivo? Tus datos quedan guardados en el servidor; para volver a entrar necesitas tu enlace personal.")) return;
      setKey("");
      // Se borra la copia local de este dispositivo (salvo voces y velocidad, que son del dispositivo)
      try { Object.keys(localStorage).filter(k => k.startsWith("vp:") && !k.startsWith("vp:voice:")).forEach(k => localStorage.removeItem(k)); } catch {}
      location.replace(location.pathname);
    }
  });

  /* ---------- Pantalla de acceso (solo si este dispositivo aún no tiene la llave) ---------- */
  function showGate(note) {
    if (!box) {
      box = document.createElement("div");
      box.id = "vp-auth";
      box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-labelledby", "vp-auth-t");
      box.innerHTML = `<form class="vp-card" novalidate>
        <div class="vp-logo" aria-hidden="true"></div>
        <h1 id="vp-auth-t">Voz Propia</h1>
        <p class="hint">Esta es una app personal. Para conectar este dispositivo, abre tu enlace personal o pégalo aquí.</p>
        <label class="vp-f"><span>Enlace personal o llave</span><input name="k" autocomplete="off" autocapitalize="off" spellcheck="false" required></label>
        <p class="vp-msg" role="status" aria-live="polite"></p>
        <button class="btn wide" type="submit">Conectar</button>
      </form>`;
      const logo = document.querySelector("header .brand");
      if (logo) box.querySelector(".vp-logo").append(logo.cloneNode(true));
      box.querySelector("form").addEventListener("submit", connect);
      document.body.append(box);
    }
    msg(note || "", !!note);
    box.hidden = false;
    document.documentElement.classList.add("vp-locked");
    setTimeout(() => box.querySelector("input").focus(), 50);
  }
  function msg(t, bad) { const p = box.querySelector(".vp-msg"); p.textContent = t; p.classList.toggle("bad", !!bad); }
  async function connect(e) {
    e.preventDefault();
    const k = keyFrom(e.target.k.value), go = box.querySelector("button[type=submit]");
    if (!k) return msg("No encuentro una llave en lo que pegaste. Pega el enlace completo.", true);
    go.disabled = true; msg("Conectando…");
    setKey(k);
    try {
      await call("ping");
      box.hidden = true; document.documentElement.classList.remove("vp-locked");
      ready();
    } catch (err) {
      setKey("");
      msg(err.code === "offline" ? "Sin conexión. Conéctate a internet para la primera vez." : "Esa llave no es válida.", true);
    }
    go.disabled = false;
  }
})();
