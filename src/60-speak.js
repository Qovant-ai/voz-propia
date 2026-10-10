/* ===================== Hablar: quiero decir · corrígeme · 1 minuto ===================== */
S.wantQ = {}; S.decir = {}; S.fixQ = {}; S.fixCtx = {}; S.fixRes = {}; S.speakOff = {}; S.customPrompt = {}; S.model = {}; S.timer = null;
const MIC = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>`;
const dictateHint = lang => `<p class="dictate">${MIC}<span>Puedes dictar en vez de escribir: toca el micrófono de tu teclado. Para que te entienda, cambia el teclado a ${LANG_NAME[lang]} (en iPhone, con el globo del teclado).</span></p>`;
function speakLog() { const t0 = S.hablarT0 || Date.now(); logTime(S.lang, "speak", Math.min(Date.now() - t0, 5 * 60000)); S.hablarT0 = Date.now(); }

function viewHablar() {
  const m = S.speakMode;
  const lead = {
    decir: "Escribe en español lo que quieres decir, como te salga. Te muestro cómo lo diría alguien nativo a tu nivel, para que lo digas en voz alta y lo guardes.",
    corregir: `Escribe o dicta en ${LANG_NAME[S.lang]} lo que quieras decir. Te corrijo con foco en tus errores típicos y te muestro una versión más natural.`,
    minuto: "Habla sin parar un minuto sobre el tema. Después dicta lo que dijiste y te corrijo. La fluidez se gana produciendo, no solo leyendo.",
  }[m];
  const seg = `<div class="seg wide" role="group" aria-label="Modo">${[["decir", "Quiero decir"], ["corregir", "Corrígeme"], ["minuto", "1 minuto"]].map(([k, t]) => `<button data-act="smode" data-arg="${k}" aria-pressed="${m === k}">${t}</button>`).join("")}</div>`;
  return `${seg}<div class="stack"><h1>${{ decir: "Quiero decir…", corregir: "Corrígeme", minuto: "Habla 1 minuto" }[m]}</h1><p class="lead">${lead}</p></div>
  ${m === "decir" ? viewDecir() : m === "corregir" ? viewCorregir() : viewMinuto()}`;
}

/* ---------- Quiero decir ---------- */
function viewDecir() {
  const L = S.lang, res = S.decir[L], phrases = liveCards(L).filter(c => c.type === "phrase");
  return `<div class="panel">
    <textarea id="want" lang="es" placeholder="${L === "en" ? "Ej: Si hubiera sabido que iba a llover, habría traído paraguas." : "Ej: Me gustaría reservar una mesa para dos el sábado."}">${esc(S.wantQ[L] || "")}</textarea>
    <button class="btn" data-act="want" ${aiOff() ? "disabled" : ""}>Así se dice</button>${aiNote()}
    <div id="wantOut">${res ? renderWant(res, L) : ""}</div></div>
  <div class="stack"><div class="between"><h3>Mis frases (${phrases.length})</h3>${phrases.length ? `<button class="link" data-act="my-phrases">Practicar</button>` : ""}</div>
  ${phrases.length ? `<div class="menu">${phrases.slice(-6).reverse().map(p => `<div class="mrow" style="flex-direction:column;align-items:flex-start;gap:2px"><small>${esc(p.es)}</small><span class="ctx" lang="${L}" style="font-family:var(--read);font-size:1.05rem">${wrapWords(md(p.t))}</span></div>`).join("")}</div>`
    : `<p class="hint">Las frases que guardes aquí, desde las lecturas o desde las correcciones, vuelven en tu repaso diario hasta que te salgan solas.</p>`}</div>`;
}
function renderWant(res, L) {
  return `<div class="card">
    <p class="hint">${esc(res.es)}</p>
    <p class="t ctx" lang="${L}">${wrapWords(md("**" + res.t + "**"))}</p>${res.pron ? `<p class="hint"><i>${esc(res.pron)}</i></p>` : ""}
    <div class="row"><button class="btn quiet small" data-act="say" data-say="${esc(res.t)}" data-lang="${L}">▶ Escuchar</button><button class="btn ghost small" data-act="want-save">Guardar para repasar</button></div>
    ${res.why ? `<p class="note">${md(res.why)}</p>` : ""}
    ${res.alts?.length ? `<h3>Otras formas de decirlo</h3>${res.alts.map(a => `<p class="rp" style="font-size:1.05rem"><span class="ctx" lang="${L}">${wrapWords(md("**" + a.t + "**"))} <span class="hint">— ${esc(a.when)}</span></span><button class="say" data-act="say" data-say="${esc(a.t)}" data-lang="${L}" aria-label="Escuchar">▶</button></p>`).join("")}` : ""}
    ${res.words?.length ? `<h3>Palabras clave</h3><div class="vocab" style="grid-template-columns:minmax(0,1fr) minmax(0,1.3fr)">${res.words.map(w => `<b>${esc(w.t)}</b><span>${esc(w.es)}</span>`).join("")}</div>` : ""}
  </div>`;
}
async function genWant() {
  const L = S.lang, q = ($("#want")?.value || "").trim();
  if (!q) return toast("Escribe primero lo que quieres decir");
  if (!canAI()) return;
  S.wantQ[L] = q; S.busy = true;
  const btn = $('[data-act="want"]'); if (btn) btn.disabled = true;
  $("#wantOut").innerHTML = `<p class="thinking"><span class="dot"></span>Buscando la forma más natural…</p>`;
  try {
    const r = await S.sample.json(`${who()} is a Spanish speaker learning ${L === "en" ? "English" : "French"}. ${levelLine(L)}
He wants to say this: "${q.slice(0, 1500)}"
Give him the way a native speaker would naturally say it, adapted to his level (for a beginner keep it short and simple; if the idea is long, split it into short sentences).${L === "fr" && levelIdx("fr") <= 1 ? " He learns French with 'building blocks': prefer the simplest version built from them (je veux / je peux / je dois / je vais + infinitive with the pronoun before the infinitive, c'est / ce n'est pas, il y a, j'ai besoin de, je viens de + infinitive, on = nous), and in \"why\" name the blocks you used." : ""}${L === "fr" && levelIdx("fr") <= 2 ? blkKnownLine() : ""} Keep his meaning exactly. If he wrote it in ${L === "en" ? "English" : "French"} already, give the corrected natural version and explain the correction.
Reply with ONLY JSON: {"t": the ${L === "en" ? "English" : "French"} sentence(s), "pron": ${L === "fr" ? "full pronunciation written for a Spanish speaker (pronunciación figurada, syllables separated)" : "pronunciation hints only for the tricky words, written for a Spanish speaker"}, "why": IN SPANISH, 2-3 short sentences on the key structure or tense used and any trap for Spanish speakers (false friends, word order), "alts": up to 2 objects {"t": another natural way to say it, "when": IN SPANISH when to use it (más formal, más coloquial…)}, "words": up to 5 objects {"t": key word from the answer, "es": its Spanish meaning}}`, { modelTier: "quick", cache: false });
    if (!r || typeof r.t !== "string") throw { code: "invalid_json" };
    S.decir[L] = { es: q, t: r.t, pron: String(r.pron || ""), why: String(r.why || ""),
      alts: Array.isArray(r.alts) ? r.alts.filter(a => a && a.t).map(a => ({ t: String(a.t), when: String(a.when || "") })) : [],
      words: Array.isArray(r.words) ? r.words.filter(w => w && w.t).map(w => ({ t: String(w.t), es: String(w.es || "") })) : [] };
    speakLog();
    if (S.tab === "hablar" && S.speakMode === "decir" && S.lang === L) $("#wantOut").innerHTML = renderWant(S.decir[L], L);
  } catch (e) { const o = $("#wantOut"); if (o) o.innerHTML = `<p class="why soft">${esc(errMsg(e))}</p>`; }
  S.busy = false; if (btn) btn.disabled = false;
}

/* ---------- Corrígeme ---------- */
function viewCorregir() {
  const L = S.lang, ctx = S.fixCtx[L], res = S.fixRes[L];
  return `<div class="panel">
    ${ctx ? `<div class="why soft"><b>Tema:</b> <span lang="${L}">${md(ctx)}</span></div>` : ""}
    <textarea id="fix-in" lang="${L}" autocapitalize="sentences" placeholder="${L === "en" ? "Ej: Yesterday I have went to the market and there was many people…" : "Ex : Hier, je suis allé au marché. Il y a beaucoup de gens…"}">${esc(S.fixQ[L] || "")}</textarea>
    ${dictateHint(L)}
    <div class="row"><button class="btn" data-act="fix" ${aiOff() ? "disabled" : ""}>Corregir</button>${ctx ? `<button class="btn quiet small" data-act="fix-clear">Quitar tema</button>` : ""}</div>${aiNote()}
    <div id="fixOut">${res ? renderFix(res, L) : ""}</div></div>
  ${errorSummary(L)}`;
}
function errLabel(L, k) { return (L === "en" ? EN_ERR_CATS : FR_ERR_CATS)[k] || k; }
function errorSummary(L) {
  const e = Object.entries(S.progress.errors[L] || {}).sort((a, b) => b[1] - a[1]).slice(0, 4);
  if (!e.length) return "";
  return `<div class="panel"><h3>Tus errores más frecuentes</h3>${e.map(([k, n]) => `<div class="between"><span>${esc(errLabel(L, k))}</span><span class="row" style="gap:8px"><span class="hint">${n}×</span>${tipFor(L, k) ? `<button class="link" data-act="tip" data-arg="${k}">Ver la regla</button>` : ""}</span></div>`).join("")}
    <p class="hint">Estos temas aparecen más en tus calentamientos y en las lecturas nuevas.</p></div>`;
}
function renderFix(res, L) {
  const has = res.fixes.length > 0;
  const cats = [...new Set(res.fixes.map(f => f.cat))].filter(k => tipFor(L, k));
  return `<div class="stack" style="margin-top:6px">
    ${has ? `<h3>Tu texto con correcciones</h3><p class="diff" lang="${L}">${diffHtml(res.orig, res.corrected)}</p>
      <div>${res.fixes.map(f => `<div class="fix"><p class="ft" lang="${L}"><s>${esc(f.from)}</s> → <b>${esc(f.to)}</b></p><p class="hint">${esc(f.why)}</p><span><span class="tag muted">${esc(errLabel(L, f.cat))}</span></span></div>`).join("")}</div>`
      : `<p class="why soft"><b class="good-t">¡Sin errores!</b> ${esc(res.good || "")}</p>`}
    <h3>Cómo lo diría alguien nativo</h3>
    <p class="ctx" lang="${L}" style="font-family:var(--read);font-size:1.12rem;line-height:1.6">${wrapWords(md(res.natural))}</p>
    <div class="row"><button class="btn quiet small" data-act="say" data-say="${esc(res.natural)}" data-lang="${L}">▶ Escuchar</button>
      ${has ? `<button class="btn ghost small" data-act="fix-save">Guardar correcciones para repasar</button>` : ""}
      <button class="btn quiet small" data-act="fix-again">Intentar de nuevo</button></div>
    ${has && res.good ? `<p class="hint"><b>Lo que hiciste bien:</b> ${esc(res.good)}</p>` : ""}
    ${res.tip ? `<p class="why soft"><b>Consejo:</b> ${esc(res.tip)}</p>` : ""}
    ${cats.length ? `<div class="row">${cats.map(k => `<button class="link" data-act="tip" data-arg="${k}">Ver la regla: ${esc(errLabel(L, k))}</button>`).join("")}</div>` : ""}
  </div>`;
}
async function genFix() {
  const L = S.lang, text = ($("#fix-in")?.value || "").trim();
  if (text.length < 3) return toast(`Escribe o dicta algo en ${LANG_NAME[L]} primero`);
  if (!canAI()) return;
  S.fixQ[L] = text; S.busy = true;
  const btn = $('[data-act="fix"]'); if (btn) btn.disabled = true;
  $("#fixOut").innerHTML = `<p class="thinking"><span class="dot"></span>Revisando tu ${L === "en" ? "inglés" : "francés"}…</p>`;
  const cats = Object.keys(L === "en" ? EN_ERR_CATS : FR_ERR_CATS).join(", ");
  const ctx = S.fixCtx[L];
  const focus = L === "en"
    ? "Focus especially on his known weak points: was/were, has/have/had, have been/had been, present perfect vs past simple, irregular participles, for/since/ago."
    : "Concentre-toi surtout sur : conjugaison, être/avoir au passé composé, accords, genre des noms, articles, négation.";
  try {
    const r = await S.sample.json(`You are a warm, precise ${L === "en" ? "English" : "French"} teacher for ${who()}, a Spanish speaker. ${levelLine(L)}
He said (dictated) or wrote this${ctx ? ` answering the prompt "${ctx}"` : ""}:
"""${text.slice(0, 3000)}"""
Correct it. ${focus} Keep his meaning and his voice; change only what is wrong or very unnatural. Ignore missing capital letters or punctuation that dictation may cause.
Reply with ONLY JSON:
{"corrected": the full text with only the necessary corrections,
 "natural": how a native speaker would say the same thing naturally at his level,
 "fixes": [{"from": the wrong fragment exactly as he wrote it, "to": the corrected fragment, "why": IN SPANISH one short sentence, "cat": one of: ${cats}}] (empty array if there are no real mistakes),
 "good": IN SPANISH one short sentence about something he did well,
 "tip": IN SPANISH one practical tip for next time}`, { cache: false });
    if (!r || typeof r.corrected !== "string") throw { code: "invalid_json" };
    const valid = new Set(Object.keys(L === "en" ? EN_ERR_CATS : FR_ERR_CATS));
    const fixes = (Array.isArray(r.fixes) ? r.fixes : []).filter(f => f && f.from && f.to && String(f.from).trim() !== String(f.to).trim())
      .map(f => ({ from: String(f.from), to: String(f.to), why: String(f.why || ""), cat: valid.has(f.cat) ? f.cat : "other" }));
    const res = { orig: text, corrected: r.corrected, natural: String(r.natural || r.corrected), fixes, good: String(r.good || ""), tip: String(r.tip || "") };
    S.fixRes[L] = res;
    const errs = S.progress.errors[L] ||= {};
    fixes.forEach(f => errs[f.cat] = (errs[f.cat] || 0) + 1);
    S.progress.fixCount = S.progress.fixCount || {}; S.progress.fixCount[L] = (S.progress.fixCount[L] || 0) + 1;
    markDone("speak", L); speakLog(); saveProgress();
    if (S.tab === "hablar" && S.speakMode === "corregir" && S.lang === L) render();
  } catch (e) { const o = $("#fixOut"); if (o) o.innerHTML = `<p class="why soft">${esc(errMsg(e))}</p>`; }
  S.busy = false; if (btn) btn.disabled = false;
}
function saveFixes() {
  const L = S.lang, res = S.fixRes[L]; if (!res) return;
  let n = 0;
  res.fixes.forEach(f => { if (addCard({ lang: L, type: "fix", bad: f.from, t: f.to, note: f.why }, true)) n++; });
  toast(n ? `${n} ${n === 1 ? "corrección guardada" : "correcciones guardadas"} para repasar` : "Ya estaban en tus tarjetas");
  updateBadge();
}

/* ---------- Habla 1 minuto ---------- */
const fmtClock = s => Math.floor(s / 60) + ":" + pad2(s % 60);
function viewMinuto() {
  const L = S.lang, p = todayPrompt(L), tm = S.timer?.lang === L ? S.timer : null, model = S.model[L];
  const left = tm ? Math.max(0, Math.ceil((tm.end - Date.now()) / 1000)) : 60;
  return `<div class="prompt-card"><span class="kind">${S.customPrompt[L] ? "Tema a tu medida" : "Tema de hoy"}</span><p class="p" lang="${L}">${esc(p.p)}</p><p class="hint">${esc(p.es)}</p>
      <div class="chips">${p.s.map(x => `<span class="tag muted">${esc(x)}</span>`).join("")}</div>
      <div class="row"><button class="btn quiet small" data-act="say" data-say="${esc(p.p)}" data-lang="${L}">▶ Escuchar</button><button class="btn quiet small" data-act="min-next">Otro tema</button><button class="btn quiet small" data-act="min-ai" ${aiOff() ? "disabled" : ""}>Tema con IA</button></div></div>
    <div class="panel" style="align-items:center;text-align:center">
      <div class="clock" id="clock" aria-live="off">${tm?.done ? "¡Listo!" : fmtClock(left)}</div>
      ${tm?.running ? `<button class="btn bad" data-act="min-stop">Terminar</button>` : `<button class="btn" data-act="min-start">${tm?.done ? "Hablar otra vez" : "Empezar a hablar"}</button>`}
      <p class="hint">Habla en voz alta sin detenerte. Si no sabes una palabra, dilo de otra forma: eso también es fluidez.</p>
    </div>
    ${tm?.done ? `<div class="panel soft"><h3>Ahora, ¿qué dijiste?</h3><p class="hint">Dicta o escribe lo que dijiste (aunque no sea exacto) y te corrijo con tus errores típicos.</p><button class="btn" data-act="min-correct">Corregir lo que dije</button></div>` : ""}
    <div class="panel"><h3>Respuesta modelo para imitar</h3><p class="hint">Después de intentarlo tú: escúchala y repítela frase por frase, imitando el ritmo (shadowing).</p>
      <button class="btn ghost" data-act="min-model" ${aiOff() ? "disabled" : ""}>${model && model.p === p.p ? "Otra respuesta modelo" : "Ver respuesta modelo"}</button>
      <div id="modelOut">${model && model.p === p.p ? renderModel(model, L) : ""}</div></div>`;
}
function renderModel(m, L) {
  const [t, es] = String(m.text).split(/\n-{3,}\n?/);
  const sents = (plain(t).match(/[^.!?]+[.!?]*/g) || []).map(s => s.trim()).filter(Boolean);
  return `<div class="stack"><p class="ctx" lang="${L}" style="font-family:var(--read);font-size:1.1rem;line-height:1.7">${wrapWords(md(t.trim()))}</p>
    <div class="row"><button class="btn quiet small" data-act="say" data-say="${esc(plain(t))}" data-lang="${L}">▶ Escuchar todo</button>${sents.length > 1 ? `<button class="btn quiet small" data-act="shadow">Frase por frase</button>` : ""}</div>
    ${es ? `<details class="tipx"><summary>Ver en español</summary><div class="body"><p>${esc(es.trim())}</p></div></details>` : ""}</div>`;
}
function startTimer() {
  const L = S.lang;
  stopSay();
  S.timer = { lang: L, start: Date.now(), end: Date.now() + 60000, running: true, done: false };
  clearInterval(S.timerInt);
  S.timerInt = setInterval(() => {
    const tm = S.timer; if (!tm?.running) return clearInterval(S.timerInt);
    const left = Math.max(0, Math.ceil((tm.end - Date.now()) / 1000));
    const c = $("#clock"); if (c) c.textContent = fmtClock(left);
    if (left <= 0) finishTimer(true);
  }, 250);
  render();
}
function finishTimer(full) {
  const tm = S.timer; if (!tm?.running) return;
  clearInterval(S.timerInt);
  const ms = Date.now() - tm.start;
  tm.running = false;
  if (full || ms > 15000) { tm.done = true; markDone("speak", tm.lang); logTime(tm.lang, "speak", ms); try { navigator.vibrate?.(180); } catch {} }
  else S.timer = null;
  if (S.tab === "hablar") render();
}
async function genPromptAI() {
  const L = S.lang;
  if (!canAI()) return;
  S.busy = true; toast("Creando un tema a tu medida…");
  try {
    const th = pick(THEMES);
    const r = await S.sample.json(`Create ONE speaking prompt (a question) for ${who()}, a Spanish speaker practising ${L === "en" ? "English" : "French"} out loud for one minute. ${levelLine(L)}
Theme: ${th.topic} — for example: ${pick(th.seeds)}.${th.rules ? " " + th.rules : ""}${weakLine(L)}${aboutMe()}
The question must push him to use 2 useful structures for his level. Reply with ONLY JSON: {"p": the question in ${L === "en" ? "English" : "French"}, "es": its Spanish translation, "s": [2 or 3 short structures he should use]}`, { modelTier: "quick", cache: false });
    if (!r?.p) throw { code: "invalid_json" };
    S.customPrompt[L] = { p: String(r.p), es: String(r.es || ""), s: Array.isArray(r.s) ? r.s.map(String).slice(0, 3) : [] };
    S.timer = null;
  } catch (e) { toast(errMsg(e)); }
  S.busy = false;
  if (S.tab === "hablar") render();
}
async function genModel() {
  const L = S.lang, p = todayPrompt(L);
  if (!canAI()) return;
  S.busy = true;
  const out = $("#modelOut"); if (out) out.innerHTML = `<p class="thinking"><span class="dot"></span>Preparando una respuesta para imitar…</p>`;
  const words = L === "en" ? (levelIdx("en") >= 2 ? 150 : 110) : [45, 60, 80, 110, 140][levelIdx("fr")];
  try {
    const r = await S.sample(`Answer this speaking prompt out loud as ${who()} would, in about ${words} words: "${p.p}"
First person, natural spoken ${L === "en" ? "English" : "French"}. ${levelLine(L)}
Use these structures: ${p.s.join(", ")}. Wrap each key verb phrase in **double asterisks**.${aboutMe()}
Write only the answer, then a line with just "---", then its Spanish translation.`, { cache: false });
    S.model[L] = { p: p.p, text: r.text };
    if (S.tab === "hablar" && S.speakMode === "minuto") { const o = $("#modelOut"); if (o) o.innerHTML = renderModel(S.model[L], L); const b = $('[data-act="min-model"]'); if (b) b.textContent = "Otra respuesta modelo"; }
  } catch (e) { const o = $("#modelOut"); if (o) o.innerHTML = `<p class="why soft">${esc(errMsg(e))}</p>`; }
  S.busy = false;
}
// Lee la respuesta modelo frase por frase, con una pausa para repetir
function shadowModel() {
  const L = S.lang, m = S.model[L]; if (!m) return;
  const t = String(m.text).split(/\n-{3,}\n?/)[0];
  const sents = (plain(t).match(/[^.!?]+[.!?]*/g) || []).map(s => s.trim()).filter(Boolean);
  let i = 0; const tok = ++sayTok;
  const next = () => {
    if (tok !== sayTok || i >= sents.length) return;
    const u = TTS.utter(sents[i], L);
    u.onend = () => { if (tok !== sayTok) return; i++; setTimeout(next, Math.min(6000, 900 + sents[i - 1].length * 55)); };
    speechSynthesis.speak(u);
  };
  if (!TTS.ok) return toast("Este navegador no tiene voz para leer en voz alta");
  speechSynthesis.cancel(); next();
  toast("Repite cada frase en la pausa", 3000);
}
