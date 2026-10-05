/* ===================== Núcleo: utilidades, estado, guardado, voz ===================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
const plain = s => String(s ?? "").replace(/\*\*/g, "");
const DAY = 864e5;
const pad2 = n => String(n).padStart(2, "0");
const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const today = () => dayKey();
const dateN = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d; };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const clone = o => JSON.parse(JSON.stringify(o));
const fmtMin = m => m > 0 && m < 1 ? "<1" : String(Math.round(m));
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const LANG_NAME = { en: "inglés", fr: "francés" };
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
function toast(msg, ms = 2600) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => t.hidden = true, ms); }
const fmtDay = (d, opts = { weekday: "long", day: "numeric", month: "long" }) => { try { return new Intl.DateTimeFormat("es-CL", opts).format(d); } catch { return dayKey(d); } };

const LS = {
  get(k, d) { try { const v = localStorage.getItem("vp:" + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem("vp:" + k, JSON.stringify(v)); } catch {} },
};

/* ---------- Estado ---------- */
const DEF_PROGRESS = () => ({ stats: {}, cats: {}, errors: { en: {}, fr: {} }, frVerbIdx: 0, level: {}, goal: 15, newPerDay: 15, rate: {}, today: null, deleted: [], wpm: { en: [], fr: [] }, updatedAt: 0 });
function loadProgress(o) {
  const p = Object.assign(DEF_PROGRESS(), o || {});
  p.errors = Object.assign({ en: {}, fr: {} }, p.errors || {});
  p.wpm = Object.assign({ en: [], fr: [] }, p.wpm || {});
  p.deleted ||= []; p.stats ||= {}; p.cats ||= {}; p.level ||= {}; p.rate ||= {};
  return p;
}
const S = {
  lang: LS.get("lang", "en") === "fr" ? "fr" : "en",
  tab: "hoy", sub: null, reading: null, speakMode: "decir", libSeg: "guardado",
  items: LS.get("items", []), cards: LS.get("cards", []), progress: loadProgress(LS.get("progress", null)),
  profile: LS.get("profile", null), db: null, sample: null, downloads: null, ready: false, busy: false,
};

/* ---------- Guardado: base de datos del artefacto (sincroniza teléfono y tablet) + copia local ---------- */
let chain = Promise.resolve();
const queue = fn => (chain = chain.then(fn).catch(e => console.warn("db", e)));
let progTimer = null;
function saveProgress(now) {
  S.progress.updatedAt = Date.now();
  LS.set("progress", S.progress);
  if (!S.db) return;
  clearTimeout(progTimer);
  progTimer = setTimeout(flushProgress, now ? 0 : 1500);
}
function flushProgress() {
  clearTimeout(progTimer); progTimer = null;
  if (S.db) { const v = clone(S.progress); queue(() => S.db.doc("state/progress").set(v)); }
}
document.addEventListener("visibilitychange", () => { if (document.hidden && progTimer) flushProgress(); });
function saveItem(item) {
  item.upd = Date.now();
  const i = S.items.findIndex(x => x.id === item.id);
  if (i >= 0) S.items[i] = item; else S.items.unshift(item);
  LS.set("items", S.items);
  if (S.db) { const v = clone(item); queue(() => S.db.doc("items/" + item.id).set(v)); }
}
function deleteItem(id) {
  S.items = S.items.filter(x => x.id !== id); LS.set("items", S.items);
  if (!S.progress.deleted.includes(id)) S.progress.deleted.push(id);
  saveProgress();
  if (S.db) queue(() => S.db.doc("items/" + id).delete());
}
const numDay = v => typeof v === "number" ? v : v ? 1 : 0;

async function syncFromDb(db) {
  const opt = p => p.catch(e => { console.warn(e); return null; });
  const [p, itemsSnap, prof, cardsSnap, mineSnap, themesDoc] = await Promise.all([
    opt(db.doc("state/progress").get()), opt(db.collection("items").orderBy("ts", "desc").limit(500).get()),
    opt(db.doc("state/profile").get()), opt(db.collection("cards").limit(1000).get()), opt(db.collection("mine").get()),
    opt(db.doc("state/themes").get()),
  ]);
  if (themesDoc?.exists) { const v = clone(themesDoc.data()); LS.set("themes", v); applyThemeSeeds(v); }
  if (prof?.exists && typeof prof.data().text === "string") { S.profile = prof.data().text; LS.set("profile", S.profile); }

  // Progreso: gana el más reciente, pero se conservan los minutos de días que solo tenga el otro (sesiones sin conexión)
  if (p?.exists) {
    const remote = loadProgress(clone(p.data())), local = S.progress;
    const localNewer = (local.updatedAt || 0) > (remote.updatedAt || 0);
    const newer = localNewer ? local : remote, older = localNewer ? remote : local;
    for (const lang of ["en", "fr"]) {
      const a = newer.stats[lang] ||= { min: 0, readings: 0, sessions: 0, days: {} }; a.days ||= {};
      const b = older.stats?.[lang];
      if (b?.days) for (const [k, v] of Object.entries(b.days)) if (numDay(v) > numDay(a.days[k])) a.days[k] = v;
    }
    newer.deleted = [...new Set([...(newer.deleted || []), ...(older.deleted || [])])];
    S.progress = newer;
    if (localNewer) saveProgress(true);
  } else if (S.progress.updatedAt) saveProgress(true);
  LS.set("progress", S.progress);

  // Lecturas y prácticas guardadas
  const del = new Set(S.progress.deleted);
  if (itemsSnap) {
    const byId = new Map();
    itemsSnap.docs.forEach(d => { const x = clone(d.data()); if (x?.id) byId.set(x.id, x); });
    for (const x of S.items) {
      const r = byId.get(x.id);
      if (del.has(x.id)) continue;
      if (!r || (x.upd || 0) > (r.upd || 0)) { byId.set(x.id, x); const v = clone(x); queue(() => db.doc("items/" + v.id).set(v)); }
    }
    for (const id of del) if (byId.has(id)) { byId.delete(id); queue(() => db.doc("items/" + id).delete()); }
    S.items = [...byId.values()].sort((a, b) => (b.ts || 0) - (a.ts || 0));
    LS.set("items", S.items);
  }

  // Tarjetas de repaso
  if (cardsSnap) {
    const byId = new Map();
    cardsSnap.docs.forEach(d => { const c = clone(d.data()); if (c?.id) byId.set(c.id, c); });
    for (const c of S.cards) {
      const r = byId.get(c.id);
      if (!r || (c.upd || 0) > (r.upd || 0)) { byId.set(c.id, c); const v = clone(c); queue(() => db.doc("cards/" + v.id).set(v)); }
    }
    S.cards = [...byId.values()];
    LS.set("cards", S.cards);
  }

  // Migración: palabras y frases guardadas en la versión anterior pasan a ser tarjetas
  const mine = { en: { words: [], phrases: [] }, fr: { words: [], phrases: [] } };
  const legacy = LS.get("mine", null);
  for (const lang of ["en", "fr"]) {
    const add = src => { if (src) { mine[lang].words.push(...(src.words || [])); mine[lang].phrases.push(...(src.phrases || [])); } };
    add(legacy?.[lang]);
    mineSnap?.docs.forEach(d => { if (d.id === lang) add(clone(d.data())); });
    mine[lang].words.forEach(w => w?.t && addCard({ lang, type: "word", t: w.t, es: w.es || "", pron: w.pron || "", note: w.note || "" }, true));
    mine[lang].phrases.forEach(f => f?.t && addCard({ lang, type: "phrase", t: f.t, es: f.es || "", note: f.note || "" }, true));
  }
}

/* ---------- Minutos, racha y plan del día ---------- */
function logTime(lang, kind, ms) {
  const min = Math.min(30, Math.max(0, ms / 60000));
  if (min < 0.1) return;
  const st = S.progress.stats[lang] ||= { min: 0, readings: 0, sessions: 0, days: {} };
  st.days ||= {}; st.kinds ||= {};
  const k = today();
  st.min = (st.min || 0) + min;
  st.days[k] = numDay(st.days[k]) + min;
  st.kinds[kind] = (st.kinds[kind] || 0) + 1;
  if (kind === "reading") st.readings = (st.readings || 0) + 1; else st.sessions = (st.sessions || 0) + 1;
  saveProgress();
}
const dayMin = (k, lang) => lang ? numDay(S.progress.stats[lang]?.days?.[k]) : dayMin(k, "en") + dayMin(k, "fr");
function streak() {
  const active = k => dayMin(k) > 0;
  const d = new Date(); let n = 0;
  if (!active(dayKey(d))) d.setDate(d.getDate() - 1);
  while (active(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function todayState() {
  let t = S.progress.today;
  if (!t || t.date !== today()) t = S.progress.today = { date: today(), en: {}, fr: {}, newSeen: { en: 0, fr: 0 } };
  t.en ||= {}; t.fr ||= {}; t.newSeen ||= { en: 0, fr: 0 };
  return t;
}
const isDone = (step, lang = S.lang) => !!todayState()[lang][step];
function markDone(step, lang = S.lang) { const t = todayState(); if (!t[lang][step]) { t[lang][step] = true; saveProgress(); } }

/* ---------- Niveles ---------- */
const LEVELS = {
  en: [
    { k: "B1", name: "Intermedio", hint: "Frases claras y vocabulario cotidiano. Para ganar confianza.", p: "B1 — clear everyday vocabulary, medium-length sentences, very few idioms; the target tenses still appear often" },
    { k: "B2", name: "Intermedio alto", hint: "Inglés natural con algo de desafío. Recomendado para ti hoy.", p: "B2 — natural spoken English, common phrasal verbs and collocations, a few idioms, just slightly above the reader's comfort zone" },
    { k: "C1", name: "Avanzado", hint: "Matices, expresiones idiomáticas y estructuras complejas.", p: "C1 — rich, nuanced vocabulary, idioms, mixed conditionals, inversion ('Had I known…'), advanced connectors and hedging" },
    { k: "C2", name: "Experto", hint: "Como un nativo culto: ironía, registro y referencias culturales.", p: "C2 — sophisticated native-like English, irony, register shifts, cultural references and less frequent vocabulary" },
  ],
  fr: [
    { k: "A1", name: "Principiante", hint: "Frases muy cortas, presente y palabras de todos los días.", p: "A1 débutant complet — phrases très courtes (5 à 10 mots), présent surtout, être/avoir/aller/faire/aimer/vouloir, vocabulaire très fréquent, un peu de futur proche, aucune structure complexe" },
    { k: "A1+", name: "Principiante +", hint: "Presente, passé composé y futur proche con frases cortas.", p: "A1+ — phrases courtes, présent, passé composé et futur proche, connecteurs simples (et, mais, parce que, après)" },
    { k: "A2", name: "Básico", hint: "Frases algo más largas, un poco de imparfait y más conectores.", p: "A2 — phrases simples mais variées, présent, passé composé, futur proche, un peu d'imparfait, connecteurs (d'abord, ensuite, quand, donc)" },
    { k: "B1", name: "Intermedio", hint: "Francés de conversación real: imparfait, futuro y condicional con soltura.", p: "B1 — phrases naturelles de longueur moyenne, présent, passé composé, imparfait, futur simple, conditionnel, pronoms (y, en, le, lui), expressions courantes" },
    { k: "B2", name: "Intermedio alto", hint: "Francés natural con matices, subjuntivo y expresiones idiomáticas.", p: "B2 — français naturel et nuancé, subjonctif, plus-que-parfait, connecteurs argumentatifs (cependant, pourtant, en revanche, bien que), expressions idiomatiques" },
  ],
};
function level(lang = S.lang) {
  const k = S.progress.level?.[lang] ?? (lang === "en" ? "B2" : "A1");
  return LEVELS[lang].find(l => l.k === k) || LEVELS[lang][lang === "en" ? 1 : 0];
}
const levelIdx = (lang = S.lang) => LEVELS[lang].indexOf(level(lang));
function levelPicker() {
  const cur = level();
  return `<h3>Nivel</h3><div class="chips">${LEVELS[S.lang].map(l => `<button class="chip" data-act="level" data-arg="${l.k}" aria-pressed="${l.k === cur.k}">${l.k} · ${l.name}</button>`).join("")}</div><p class="hint">${esc(cur.hint)}</p>`;
}
const levelLine = lang => lang === "en"
  ? `Reader level: ${level("en").p}. The reader (a Spanish speaker) must always be able to understand what he is saying.`
  : `Niveau du lecteur (hispanophone) : ${level("fr").p}. Il doit toujours pouvoir comprendre ce qu'il dit.`;

/* ---------- Precisión por estructura y puntos débiles ---------- */
function logAnswer(cat, ok) { const c = S.progress.cats[cat] ||= { ok: 0, ko: 0 }; ok ? c.ok++ : c.ko++; saveProgress(); }
function catAcc(cat) { const c = S.progress.cats[cat]; const n = c ? c.ok + c.ko : 0; return { n, acc: n ? c.ok / n : null }; }
// Ordena categorías de la que más necesita práctica a la que menos (combina ejercicios y correcciones)
function weakOrder(keys, lang) {
  const errs = S.progress.errors[lang] || {};
  return keys.map(k => {
    const { n, acc } = catAcc(lang === "fr" ? "fr:" + k : k);
    const need = (n < 4 ? 0.55 : acc) - Math.min(0.3, (errs[k] || 0) * 0.03);
    return { k, n, acc, err: errs[k] || 0, need };
  }).sort((a, b) => a.need - b.need);
}
function weakLine(lang) {
  const labels = lang === "en" ? CATS : FR_CATS;
  const w = weakOrder(Object.keys(labels), lang).filter(x => x.n >= 4 || x.err > 0).slice(0, 2);
  if (!w.length) return "";
  const names = w.map(x => labels[x.k]).join(" and ");
  return lang === "en"
    ? `\nRight now he makes the most mistakes with: ${names}. Use those structures especially often.`
    : `\nEn ce moment, il se trompe surtout avec : ${names}. Utilise beaucoup ces structures.`;
}

/* ---------- Perfil (vive en la base de datos, no en el código) ---------- */
const profileText = () => String(S.profile ?? "").trim();
function aboutMe() {
  const p = profileText();
  return p ? `\n\nWHO THE SPEAKER IS — write as him, use these facts naturally (only the ones relevant to the subject), never contradict them, invent only small plausible everyday details:\n${p}` : "";
}
const userName = () => (profileText().match(/me llamo\s+([\p{L}]+)/iu) || [])[1] || "";
const who = () => userName() || "the learner";
// Subtemas personales de lectura: viven en la base de datos (state/themes), no en el código
function applyThemeSeeds(obj) {
  const seeds = obj?.seeds || {};
  for (const [label, list] of Object.entries(seeds)) {
    if (!Array.isArray(list)) continue;
    const th = THEMES.find(t => t.label === label);
    if (th) th.seeds = [...new Set([...th.seeds, ...list.map(String)])];
  }
}
function themeHint() { return shuffle(THEMES).slice(0, 4).map(t => t.label === "Mi vida" ? "his own life" : t.topic.replace(/\s*\(.*\)/, "")).join("; "); }

/* ---------- Palabras tocables ---------- */
function glossSet(gloss) {
  const s = new Set();
  (gloss || []).forEach(x => { const toks = String(x.t || "").toLowerCase().replace(/\(.*?\)/g, "").split(/[\s/,]+/).filter(Boolean); toks.forEach(t => { if (toks.length === 1 || t.length > 3) s.add(t); }); });
  return s;
}
const wrapWords = (html, gset) => html.replace(/(<[^>]+>|&[#\w]+;)|([\p{L}\p{M}]+(?:['’-][\p{L}\p{M}]+)*)/gu, (m, tag, w) =>
  tag ? tag : `<span class="w${gset && gset.has(w.toLowerCase()) ? " gl" : ""}">${w}</span>`);

/* ---------- Comparar respuestas ---------- */
const normAns = s => String(s || "").toLowerCase().replace(/[’`´]/g, "'").replace(/\s+/g, " ").replace(/^[¿¡\s]+|[.!?,;:\s]+$/g, "").trim();
const stripAcc = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
function checkAns(input, accepted) {
  const a = normAns(input);
  if (!a) return "empty";
  if (accepted.some(x => normAns(x) === a)) return "ok";
  if (accepted.some(x => stripAcc(normAns(x)) === stripAcc(a))) return "accent";
  return "ko";
}
const ACCENTS = ["é", "è", "ê", "à", "â", "ç", "ô", "î", "û", "ù", "ë", "ï", "œ"];
const accentBar = () => `<div class="accents" aria-label="Acentos">${ACCENTS.map(c => `<button type="button" data-act="accent" data-arg="${c}" data-keep>${c}</button>`).join("")}</div>`;
const ansInput = (id, lang, ph = "Escribe tu respuesta") => `<input type="text" id="${id}" class="ans" lang="${lang}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" data-enter placeholder="${esc(ph)}">`;

/* ---------- Diferencias palabra por palabra (para las correcciones) ---------- */
function diffWords(a, b) {
  const A = String(a).split(/\s+/).filter(Boolean), B = String(b).split(/\s+/).filter(Boolean);
  const n = A.length, m = B.length;
  if (n * m > 120000) return [{ t: "del", s: A.join(" ") }, { t: "ins", s: B.join(" ") }];
  const nk = w => w.toLowerCase().replace(/[.,!?;:"«»“”()]/g, "");
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = nk(A[i]) === nk(B[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out = []; let i = 0, j = 0;
  const push = (t, s) => { const last = out[out.length - 1]; if (last && last.t === t) last.s += " " + s; else out.push({ t, s }); };
  while (i < n && j < m) {
    if (nk(A[i]) === nk(B[j])) { push("eq", B[j]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) push("del", A[i++]);
    else push("ins", B[j++]);
  }
  while (i < n) push("del", A[i++]);
  while (j < m) push("ins", B[j++]);
  return out;
}
const diffHtml = (a, b) => diffWords(a, b).map(p => p.t === "eq" ? esc(p.s) : p.t === "del" ? `<del>${esc(p.s)}</del>` : `<ins>${esc(p.s)}</ins>`).join(" ");

/* ---------- Voz del dispositivo ---------- */
const TTS = {
  ok: typeof window !== "undefined" && "speechSynthesis" in window,
  voices: [],
  init() {
    if (!this.ok) return;
    const load = () => { this.voices = speechSynthesis.getVoices() || []; };
    load();
    try { speechSynthesis.addEventListener("voiceschanged", load); } catch { speechSynthesis.onvoiceschanged = load; }
  },
  list(lang) { const w = lang === "fr" ? "fr" : "en"; return this.voices.filter(v => String(v.lang || "").toLowerCase().replace("_", "-").startsWith(w)); },
  score(v, lang) {
    const n = v.name.toLowerCase(), l = String(v.lang || "").toLowerCase().replace("_", "-");
    let s = 0;
    if (lang === "en" && (l === "en-us" || l === "en-gb")) s += 3;
    if (lang === "fr" && l === "fr-fr") s += 3;
    if (/premium|enhanced|neural|natural|mejorad|siri/.test(n)) s += 4;
    if (lang === "en" && /samantha|daniel|karen|moira|serena|ava|evan|google us english|google uk english/.test(n)) s += 2;
    if (lang === "fr" && /amélie|amelie|thomas|audrey|marie|aurélie|google français/.test(n)) s += 2;
    if (v.localService) s += 1;
    if (/albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley/.test(n)) s -= 8;
    return s;
  },
  voice(lang) {
    const vs = this.list(lang); if (!vs.length) return null;
    const saved = LS.get("voice:" + lang, null);
    if (saved) { const v = vs.find(v => v.voiceURI === saved || v.name === saved); if (v) return v; }
    return vs.slice().sort((a, b) => this.score(b, lang) - this.score(a, lang))[0];
  },
  rate(lang) { return S.progress.rate?.[lang] ?? (lang === "fr" ? 0.85 : 0.95); },
  utter(text, lang) {
    const u = new SpeechSynthesisUtterance(plain(text).replace(/[_]{2,}/g, " "));
    u.lang = lang === "fr" ? "fr-FR" : "en-US";
    const v = this.voice(lang); if (v) { u.voice = v; u.lang = v.lang; }
    u.rate = this.rate(lang);
    return u;
  },
};
let sayTok = 0, sayBtn = null;
function stopSay() {
  sayTok++;
  if (TTS.ok) try { speechSynthesis.cancel(); } catch {}
  if (sayBtn) sayBtn.classList.remove("on");
  sayBtn = null;
  $$(".para.playing").forEach(p => p.classList.remove("playing"));
  if (S.playing) { S.playing = null; const b = $("#playall"); if (b) { b.classList.remove("on"); b.textContent = "▶ Todo"; } }
}
function say(text, lang = S.lang, btn) {
  if (!TTS.ok) return toast("Este navegador no tiene voz para leer en voz alta");
  const same = btn && sayBtn === btn;
  stopSay();
  if (same) return;
  const tok = ++sayTok, u = TTS.utter(text, lang);
  if (btn) { btn.classList.add("on"); sayBtn = btn; }
  u.onend = u.onerror = () => { if (tok !== sayTok) return; btn?.classList.remove("on"); sayBtn = null; };
  speechSynthesis.speak(u);
}
// Lee varios textos seguidos; onIdx(i) avisa cuál suena (-1 al terminar)
function sayQueue(texts, lang, onIdx) {
  stopSay();
  if (!TTS.ok) { toast("Este navegador no tiene voz para leer en voz alta"); return; }
  const tok = ++sayTok; let i = 0;
  const next = () => {
    if (tok !== sayTok) return;
    if (i >= texts.length) { onIdx?.(-1); return; }
    onIdx?.(i);
    const u = TTS.utter(texts[i], lang);
    u.onend = () => { if (tok !== sayTok) return; i++; next(); };
    u.onerror = () => { if (tok === sayTok) onIdx?.(-1); };
    speechSynthesis.speak(u);
  };
  next();
}

/* ---------- Claude ---------- */
const ERR = {
  not_granted: "Necesito tu permiso para usar Claude y crear contenido nuevo. Recarga la página y acepta.",
  rate_limited: "Llegaste al límite de uso por ahora. Intenta de nuevo en unos minutos.",
  session_expired: "Tu sesión expiró. Vuelve a iniciar sesión en Claude.",
  refused: "No se pudo generar con ese tema. Prueba con otro.",
  invalid_json: "La respuesta llegó incompleta. Toca de nuevo para reintentar.",
  cancelled: "Cancelado.",
};
// La versión instalable (pwa/adapter.js) trae sus propios mensajes: cuenta, conexión, servidor
Object.assign(ERR, window.VP_HOST?.errors || {});
const errMsg = e => ERR[e?.code] || "No se pudo completar ahora. Revisa tu conexión y vuelve a intentar.";
const aiOff = () => S.ready && !S.sample;
function canAI() {
  if (S.busy) { toast("Espera un momento: estoy terminando lo anterior"); return false; }
  return needClaude();
}
function needClaude() {
  if (S.sample) return true;
  toast(S.ready ? "Esta función necesita abrir la app dentro de Claude" : "Conectando con Claude… intenta en un momento");
  return false;
}
const aiNote = () => aiOff() ? `<p class="hint">Esta parte necesita abrir la app dentro de Claude. Todo lo demás funciona igual.</p>` : "";
