/* ===================== Leer ===================== */
const pickSt = LS.get("pick", { min: 5, topic: SURPRISE });
if (pickSt.topic !== SURPRISE && !THEMES.some(t => t.label === pickSt.topic)) pickSt.topic = SURPRISE;
const titleOf = text => (String(text || "").match(/^#\s+(.+)$/m) || [, "Lectura"])[1].trim();

// Elige tema y subtema sin repetir los usados recientemente
function pickSeed(lang, label) {
  const th = label === SURPRISE ? pick(THEMES) : THEMES.find(t => t.label === label) || pick(THEMES);
  const used = LS.get("seeds:" + lang, []);
  const fresh = th.seeds.filter(s => !used.includes(s));
  const seed = pick(fresh.length ? fresh : th.seeds);
  LS.set("seeds:" + lang, [seed, ...used].slice(0, 80));
  return { th, seed };
}

function readingPrompt(lang, min, topicLabel) {
  const words = wordsFor(lang, min), { th, seed } = pickSeed(lang, topicLabel);
  const topic = `${th.topic}. Specific subject: ${seed}`;
  const prev = S.items.filter(x => x.kind === "reading" && x.lang === lang).slice(0, 25).map(x => x.title).join(" | ");
  const avoid = (prev ? `\nDo NOT repeat the themes of these previous texts: ${prev}` : "") + `
Content rules: facts about history, places, people and technology must be accurate — if unsure of a detail (a recent date, a figure, a quote), stay general instead of inventing it. ${th.learn ? "The text must teach the listener real, interesting knowledge, told as the speaker explaining what he knows or has been reading, linking it to his own life when natural. " : ""}Opinions are the speaker's own and follow the values in his profile. Never invent quotes by real public figures.${th.rules ? " " + th.rules : ""}`;
  const lv = level(lang).k, nVocab = lang === "fr" ? (lv.startsWith("A") ? "25-35" : "15-20") : lv === "B1" || lv === "B2" ? "15-20" : "12-15";
  if (lang === "en") return `You write read-aloud practice texts for ${who()}, a Spanish speaker learning English. His goal: connect "what I want to say" with "this is how it's said", then practise it by reading aloud with confidence.
${levelLine("en")}
Write a FIRST-PERSON spoken monologue: ${who()} is the "I", talking naturally to a friend, colleague or interviewer, sometimes quoting short bits of dialogue ("So I said…", "She asked me whether…"). Theme: ${topic}. Length: about ${words} words.
Style: natural modern spoken English, contractions, connectors (actually, to be fair, as it turned out), useful phrasal verbs and collocations — all adapted to the level above.
Target grammar — use these MANY times, naturally, and wrap each verb phrase in **double asterisks**: was/were (including "if I were"), has/have, present perfect vs past simple, had + participle, have been / had been (+ -ing), would/should/could have + participle, for/since/ago.${weakLine("en")}${aboutMe()}${avoid}
STRICT FORMAT, nothing else:
# Title
Paragraphs of 3-5 sentences separated by blank lines.
## Comprueba
1. <comprehension question in English>
a) <option>
b) <option>
c) <option>
(3 questions; put " *" at the end of the correct option; vary its position)
## Así se dice
- <what he wants to say, in natural Spanish> => **<the exact English wording used in the text>** — <nota breve en español: cuándo usarla o cómo suena> (8 bullets: the most useful expressions of the text)
## Vocabulario
- <word or expression exactly as it appears in the text> | <significado en español en este contexto> | <pronunciación aproximada para hispanohablantes> (${nVocab} items: the ones most likely to be new at this level, including phrasal verbs and idioms)
## Gramática en este texto
- 4-5 bullets IN SPANISH, each quoting a sentence from the text and explaining why that tense/auxiliary is used
## Pronunciación
- 3-4 bullets IN SPANISH about words or links in this text (weak forms, -ed endings, contractions, stress)
## Cuéntalo tú
- ONE instruction IN SPANISH asking him to retell or react to the text out loud in 4-6 sentences, naming 2 specific structures from the text he must use`;
  const qLang = levelIdx("fr") >= 3 ? "en français" : "EN ESPAGNOL";
  return `Tu écris des textes de lecture à voix haute pour ${who()}, un hispanophone qui apprend le français. Son but : associer « ce que je veux dire » et « comment on le dit », puis le pratiquer en lisant à voix haute.
${levelLine("fr")}
Écris un monologue à la PREMIÈRE PERSONNE : ${who()} est le « je », il parle simplement, avec parfois une petite réplique de dialogue (par exemple avec un ami, un collègue ou sa partenaire). Thème (écris le texte en français même si le thème est en anglais) : ${topic}. Si le thème est complexe (histoire, politique, technologie), simplifie-le au niveau indiqué, tout en gardant des faits exacts. Longueur : environ ${words} mots de français.
${lv.startsWith("A") ? "Verbes parmi les 100 plus courants. " : ""}${levelIdx("fr") <= 1 ? "Construis presque toutes les phrases avec des « blocs » de base et recycle-les souvent : c'est / ce n'est pas, il y a, j'ai, je veux / je peux / je dois / je vais + infinitif (pronom avant l'infinitif : je veux le voir, je vais lui dire), je viens de + infinitif, j'ai besoin de, parce que, quelque chose de + adjectif. " : ""}Inclure naturellement des nombres écrits en lettres, des jours de la semaine, des mois et des heures. Mets chaque verbe conjugué entre **doubles astérisques**.${weakLine("fr")}${aboutMe()}${avoid}
FORMAT STRICT, rien d'autre :
# Titre en français
Paragraphes de 2-4 phrases. Après CHAQUE paragraphe, une ligne qui commence par "ES: " avec la traduction en espagnol.
## Comprueba
1. <question de compréhension ${qLang}>
a) <option>
b) <option>
c) <option>
(3 questions ; mets " *" à la fin de la bonne option ; varie sa position)
## Así se dice
- <lo que quiere decir, en español natural> => **<la phrase française exacte du texte>** — <nota en español con pronunciación figurada> (8 bullets)
## Vocabulario
- <mot ou expression exactement comme dans le texte> | <significado en español> | <pronunciación figurada para hispanohablantes> (${nVocab} items : ${lv.startsWith("A") ? "tous les mots qui ne sont pas évidents pour un débutant, y compris les verbes conjugués" : "les mots et expressions probablement nouveaux à ce niveau"})
## Gramática en este texto
- 4 bullets EN ESPAGNOL: cada uno cita una frase del texto y explica la conjugación o el tiempo (infinitivo, persona, por qué)
## Pronunciación
- 4 bullets EN ESPAGNOL sobre palabras de este texto: letras mudas, liaisons, nasales, con pronunciación figurada
## Cuéntalo tú
- UNE consigne EN ESPAGNOL qui lui demande de raconter le texte à voix haute en 3-5 phrases très simples, avec 2 structures précises du texte`;
}

/* Convierte el texto generado en partes: párrafos, preguntas, "así se dice", vocabulario, notas y tarea final */
function parseDoc(text) {
  const d = { title: "", paras: [], say: [], gloss: [], notes: [], quiz: [], retell: "" };
  let sec = null;
  for (const raw of String(text || "").split("\n")) {
    const l = raw.trim(); if (!l) continue;
    if (l.startsWith("## ")) {
      const h = l.slice(3).trim(), hl = h.toLowerCase();
      sec = /as[ií] se dice|frases clave/.test(hl) ? "say" : /vocabul/.test(hl) ? "gloss" : /comprueba|pregunta|comprens/.test(hl) ? "quiz" : /cu[eé]ntalo/.test(hl) ? "retell" : "notes";
      if (sec === "notes") d.notes.push({ h, items: [] });
      continue;
    }
    if (l.startsWith("# ")) { d.title = l.slice(2).trim(); continue; }
    const item = l.replace(/^[-•*]\s+/, "");
    if (sec === "say") {
      const [es, rest] = item.includes("=>") ? item.split("=>").map(s => s.trim()) : ["", item];
      const m = rest.match(/^(.*?)\s+[—–-]\s+(.*)$/);
      const t = (m ? m[1] : rest).replace(/\*\*/g, "").trim(), note = m ? m[2].trim() : "";
      if (t) d.say.push(es ? { es, t, note } : { es: note || t, t, note: "" });
    } else if (sec === "gloss") {
      const parts = item.split("|").map(s => s.trim());
      if (parts.length >= 2 && parts[0]) d.gloss.push({ t: parts[0].replace(/\*\*/g, ""), es: parts[1], pron: parts[2] || "" });
    } else if (sec === "quiz") {
      const qm = item.match(/^\d+[.)]\s*(.+)$/), om = item.match(/^[a-dA-D][.)]\s*(.+)$/);
      if (qm) d.quiz.push({ q: qm[1], opts: [], a: -1 });
      else if (om && d.quiz.length) { const q = d.quiz[d.quiz.length - 1]; let o = om[1].trim(); if (/\*\s*$/.test(o)) { o = o.replace(/\s*\*\s*$/, ""); q.a = q.opts.length; } q.opts.push(o); }
    } else if (sec === "retell") d.retell += (d.retell ? " " : "") + item;
    else if (sec === "notes") d.notes[d.notes.length - 1].items.push(item);
    else if (/^ES:/i.test(l)) { if (d.paras.length) d.paras[d.paras.length - 1].es = l.slice(3).trim(); }
    else d.paras.push({ t: l, es: "" });
  }
  d.quiz = d.quiz.filter(q => q.opts.length >= 2 && q.a >= 0);
  return d;
}

function renderDoc(r) {
  const d = parseDoc(r.text), gset = glossSet(d.gloss.concat(liveCards(r.lang).filter(c => c.type === "word"))), open = r.open || {}, tr = r.tr || {}, qa = r.quiz || {};
  const paras = d.paras.map((p, i) => {
    const es = p.es || tr[i] || "", show = open[i] || (r.showTr && es);
    return `<div class="para${S.playing?.i === i ? " playing" : ""}" data-p="${i}"><p class="rp"><span class="ctx">${wrapWords(md(p.t), gset)}</span>
      <span class="pbtns"><button class="say" data-act="say" data-say="${esc(p.t)}" data-lang="${r.lang}" aria-label="Escuchar párrafo">▶</button><button class="esb${show ? " on" : ""}" data-act="es" data-arg="${i}" aria-label="Ver en español">ES</button></span></p>
      <p class="tr" lang="es" data-tr="${i}" ${show ? "" : "hidden"}>${esc(es)}</p></div>`;
  }).join("");
  if (r.generating) return `<h2 class="rt">${esc(d.title)}</h2>${paras}<p class="thinking"><span class="dot"></span>Escribiendo…</p>`;
  const quiz = d.quiz.length ? `<div class="notes"><h3>Comprueba que entendiste</h3>${d.quiz.map((q, qi) => {
    const ch = qa[qi];
    return `<div class="quiz-q"><p>${qi + 1}. ${md(q.q)}</p>${q.opts.map((o, oi) => `<button class="qopt${ch === undefined ? "" : oi === q.a ? " ok" : oi === ch ? " ko" : ""}" data-act="quiz" data-q="${qi}" data-o="${oi}" ${ch !== undefined ? "disabled" : ""}>${md(o)}</button>`).join("")}</div>`;
  }).join("")}</div>` : "";
  const say = d.say.length ? `<div class="notes"><h3>Quiero decir… así se dice</h3>
    <p class="hint">Lee la idea en español, dila en voz alta y después revela cómo se dice.</p>
    ${d.say.map((s, i) => `<details class="sayit"><summary>${esc(s.es)}</summary><div class="said">
      <p class="t ctx" lang="${r.lang}">${wrapWords(md("**" + s.t + "**"), gset)}</p>${s.note ? `<p class="hint">${md(s.note)}</p>` : ""}
      <div class="row"><button class="btn quiet small" data-act="say" data-say="${esc(s.t)}" data-lang="${r.lang}">▶ Escuchar</button><button class="btn quiet small" data-act="save-say" data-arg="${i}">Guardar para repasar</button></div>
    </div></details>`).join("")}
    <button class="btn ghost wide" data-act="practice-say">Practicar estas frases: español → ${LANG_NAME[r.lang]}</button></div>` : "";
  const saved = new Set(liveCards(r.lang).filter(c => c.type === "word").map(c => c.t.toLowerCase()));
  const vocab = d.gloss.length ? `<details class="tipx"><summary>Vocabulario de este texto (${d.gloss.length})</summary><div class="body" style="max-width:none">
    <p class="hint">Las palabras subrayadas en el texto están aquí. Toca + para repasarlas después, o toca cualquier otra palabra del texto para ver qué significa.</p>
    <div class="vocab">${d.gloss.map((g, i) => `<b>${esc(g.t)}</b><span>${esc(g.es)}${g.pron ? ` · <i>${esc(g.pron)}</i>` : ""}</span><button class="plus" data-act="save-vocab" data-arg="${i}" aria-label="Guardar ${esc(g.t)}" ${saved.has(g.t.toLowerCase()) ? "disabled" : ""}>${saved.has(g.t.toLowerCase()) ? "✓" : "+"}</button>`).join("")}</div></div></details>` : "";
  const notes = d.notes.map(n => `<h3>${esc(n.h)}</h3><ul>${n.items.map(x => `<li>${md(x)}</li>`).join("")}</ul>`).join("");
  const retell = `<div class="notes"><h3>Cuéntalo tú</h3><p>${d.retell ? md(d.retell) : r.lang === "en" ? "Cuenta en voz alta, en 4 a 6 frases, de qué trataba el texto y qué opinas. Usa al menos un present perfect y un past simple." : "Cuenta en voz alta, en 3 a 5 frases muy simples, de qué trataba el texto."}</p>
    <button class="btn ghost" data-act="retell">Decirlo y que me corrijan</button></div>`;
  return `<h2 class="rt">${esc(d.title)}</h2>${paras}${quiz}${say}${vocab}${notes ? `<div class="notes">${notes}</div>` : ""}${retell}`;
}

function viewLeer() {
  if (S.reading && S.reading.lang === S.lang) return viewReader();
  const L = S.lang, st = S.progress.stats[L] || {};
  const draft = LS.get("draft:" + L, null);
  const rs = S.items.filter(x => x.kind === "reading" && x.lang === L);
  const unread = rs.filter(x => !x.reads).slice(0, 5), reread = rs.filter(x => x.reads === 1).slice(0, 3);
  const w = S.progress.wpm[L] || [], wpm = w.length ? Math.round(w.slice(-5).reduce((a, x) => a + x.wpm, 0) / Math.min(5, w.length)) : 0;
  const row = x => `<button data-act="open-item" data-arg="${x.id}"><span style="min-width:0"><b>${esc(x.title)}</b><small>${x.min ? x.min + " min" : ""}${x.level ? " · " + esc(x.level) : ""}${x.topic ? " · " + esc(x.topic) : ""}${x.reads ? " · leída " + x.reads + (x.reads === 1 ? " vez" : " veces") : " · sin leer"}</small></span><span class="go">→</span></button>`;
  return `
  <div class="stack"><h1>${L === "en" ? "Lee como si fueras tú quien habla" : "Lis à voix haute, paso a paso"}</h1>
  <p class="lead">${L === "en" ? "Textos nuevos en primera persona con los tiempos verbales que más te cuestan. Léelos en voz alta; toca cualquier palabra para ver qué significa." : "Textos en primera persona con traducción, para interiorizar verbos, números, días y meses. Toca cualquier palabra para ver qué significa."}</p></div>
  <div class="stats">
    <div class="stat"><b>${st.readings || 0}</b><span>lecturas terminadas</span></div>
    <div class="stat"><b>${wpm || "—"}</b><span>palabras por minuto (promedio)</span></div>
    <div class="stat"><b>${fmtMin(st.min || 0)}</b><span>minutos en ${LANG_NAME[L]}</span></div>
  </div>
  ${draft?.text ? `<button class="btn ghost wide" data-act="resume">Continuar: ${esc(titleOf(draft.text))}</button>` : ""}
  <div class="panel">
    <h3>¿Cuánto tiempo tienes?</h3>
    <div class="durs">${[5, 10, 15].map(m => `<button class="dur" data-act="dur" data-arg="${m}" aria-pressed="${pickSt.min === m}"><b>${m}</b><span>min · ~${wordsFor(L, m)} palabras</span></button>`).join("")}</div>
    ${levelPicker()}
    <h3>Tema</h3>
    <div class="chips">${[SURPRISE, ...THEMES.map(t => t.label)].map(t => `<button class="chip" data-act="topic" data-arg="${esc(t)}" aria-pressed="${pickSt.topic === t}">${esc(t)}</button>`).join("")}</div>
    <button class="btn wide" data-act="gen" ${aiOff() ? "disabled" : ""}>Crear lectura nueva</button>
    ${aiOff() ? `<p class="hint">Para crear textos nuevos, abre la app dentro de Claude. Tus textos guardados funcionan igual, incluso sin internet.</p>` : ""}
  </div>
  ${unread.length ? `<div class="stack"><h3>Textos guardados sin leer</h3><div class="menu">${unread.map(row).join("")}</div></div>` : ""}
  ${reread.length ? `<div class="stack"><h3>Para releer</h3><p class="hint">Releer el mismo texto 2 o 3 veces es de lo que más fluidez da: la segunda vez ya no traduces, solo hablas.</p><div class="menu">${reread.map(row).join("")}</div></div>` : ""}`;
}

function viewReader() {
  const r = S.reading, rate = TTS.rate(r.lang), fs = LS.get("rs", 1.18), pd = parseDoc(r.text).paras;
  const allTr = r.lang === "fr" || (pd.length > 0 && pd.every((p, i) => p.es || r.tr?.[i]));
  return `<div class="reader" id="reader">
    <div class="between"><div class="row" style="gap:6px"><span class="tag">${r.min} min</span><span class="tag">${r.lang === "en" ? "English" : "Français"}${r.level ? " · " + esc(r.level) : ""}</span>${r.reads ? `<span class="tag muted">lectura ${r.reads + 1}</span>` : ""}</div>
      <span class="row" style="gap:4px"><span class="timer" id="timer"></span>${r.generating ? "" : `<button class="btn quiet small" data-act="close-read" aria-label="Cerrar lectura">Cerrar</button>`}</span></div>
    <p class="hint">Toca una palabra para ver su significado · <b>ES</b> muestra el párrafo en español · <b>▶ Todo</b> lee el texto completo para que lo imites.</p>
    <div id="doc" class="stack" style="gap:14px" lang="${r.lang}">${r.text ? renderDoc(r) : `<p class="thinking"><span class="dot"></span>Escribiendo un texto nuevo para ti… (puede tardar hasta un minuto)</p>`}</div>
    ${r.note ? `<p class="why soft">${esc(r.note)}</p>` : ""}
    <div class="bar">
      ${r.generating ? `<button class="btn quiet" data-act="stop-gen">Detener</button>` : `
      <button class="ib play${S.playing ? " on" : ""}" id="playall" data-act="play-all">${S.playing ? "■ Parar" : "▶ Todo"}</button>
      <button class="ib" data-act="rate" aria-label="Velocidad de la voz">${rate.toFixed(2).replace(/0$/, "")}×</button>
      <button class="ib" data-act="fsize" aria-label="Tamaño de letra">A${fs > 1.2 ? "+" : fs < 1.1 ? "−" : ""}</button>
      ${allTr ? `<button class="ib${r.showTr ? " on" : ""}" data-act="es-all" aria-label="Español en todos los párrafos">ES</button>` : ""}
      <button class="btn" data-act="done-read">Terminé</button>`}
    </div>
    ${!r.generating && !r.saved ? `<button class="btn quiet wide" data-act="discard">Descartar sin guardar</button>` : ""}
  </div>`;
}

async function generateReading() {
  if (!canAI()) return;
  const lang = S.lang, min = pickSt.min;
  S.busy = true; S.ctl = new AbortController();
  stopSay();
  S.reading = { id: uid(), lang, min, level: level(lang).k, topic: pickSt.topic, text: "", generating: true, showTr: false, open: {}, tr: {}, quiz: {}, startedAt: Date.now() };
  render(); scrollTo(0, 0);
  let last = 0;
  const r = S.reading;
  try {
    const res = await S.sample(readingPrompt(lang, min, pickSt.topic), {
      cache: false, signal: S.ctl.signal,
      onText: ({ text }) => { r.text = text; const now = Date.now(); if (now - last > 450 && S.reading === r) { last = now; const d = $("#doc"); if (d) d.innerHTML = renderDoc(r); } },
    });
    r.text = res.text;
    if (res.truncated) r.note = "El texto se cortó por largo; igual puedes leerlo y guardarlo.";
  } catch (e) {
    if (e?.text) r.text = e.text;
    if (e?.code !== "cancelled") r.note = errMsg(e);
    if (!r.text) { S.busy = false; if (S.reading === r) S.reading = null; render(); if (r.note) toast(r.note); return; }
  }
  S.busy = false; r.generating = false; r.startedAt = Date.now();
  if (S.reading === r) { persistReading(); render(); }
}
function persistReading() {
  const r = S.reading; if (!r || r.generating) return;
  if (r.saved) { const x = S.items.find(i => i.id === r.id); if (x) saveItem({ ...x, tr: r.tr || {} }); }
  else LS.set("draft:" + r.lang, { ...r, startedAt: 0, title: titleOf(r.text) });
}
function resumeDraft() {
  const dr = LS.get("draft:" + S.lang, null);
  if (!dr?.text) return render();
  S.reading = { ...dr, open: dr.open || {}, tr: dr.tr || {}, quiz: {}, startedAt: Date.now(), generating: false };
  S.tab = "leer"; render(); scrollTo(0, 0);
}
async function toggleEs(i, btn) {
  const r = S.reading, p = parseDoc(r.text).paras[i], el = document.querySelector(`[data-tr="${i}"]`);
  if (!p || !el) return;
  r.open ||= {}; r.tr ||= {};
  if (!el.hidden) { r.open[i] = false; el.hidden = true; btn.classList.remove("on"); return; }
  r.open[i] = true; el.hidden = false; btn.classList.add("on");
  const known = p.es || r.tr[i];
  if (known) { el.textContent = known; return; }
  if (!S.sample) { el.textContent = "La traducción de este párrafo necesita abrir la app dentro de Claude."; return; }
  el.textContent = "Traduciendo…";
  try {
    const res = await S.sample(`Translate this ${r.lang === "en" ? "English" : "French"} paragraph into natural, neutral Latin American Spanish. Keep the meaning exact. Reply with only the translation.\n\n${plain(p.t)}`, { modelTier: "quick" });
    r.tr[i] = res.text.trim(); el.textContent = r.tr[i]; persistReading();
  } catch (e) { el.textContent = errMsg(e); }
}
function playAll() {
  const r = S.reading; if (!r) return;
  if (S.playing) return stopSay();
  const paras = parseDoc(r.text).paras;
  S.playing = { i: 0 };
  const b = $("#playall"); if (b) { b.classList.add("on"); b.textContent = "■ Parar"; }
  sayQueue(paras.map(p => p.t), r.lang, i => {
    $$(".para.playing").forEach(p => p.classList.remove("playing"));
    if (i < 0) { S.playing = null; const bb = $("#playall"); if (bb) { bb.classList.remove("on"); bb.textContent = "▶ Todo"; } return; }
    if (S.playing) S.playing.i = i;
    const el = document.querySelector(`.para[data-p="${i}"]`);
    if (el) { el.classList.add("playing"); const rc = el.getBoundingClientRect(); if (rc.top < 80 || rc.bottom > innerHeight - 150) el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" }); }
  });
}
function finishReading() {
  const r = S.reading; if (!r) return;
  const ms = Date.now() - (r.startedAt || Date.now()), minutes = ms / 60000;
  const words = parseDoc(r.text).paras.map(p => plain(p.t)).join(" ").split(/\s+/).filter(Boolean).length;
  const wpm = minutes >= 1 ? Math.round(words / minutes) : 0;
  const prev = S.items.find(x => x.id === r.id);
  const reads = (prev?.reads || 0) + 1;
  saveItem({ ...(prev || {}), id: r.id, kind: "reading", lang: r.lang, min: r.min, level: r.level || prev?.level || "", topic: r.topic || prev?.topic || "", title: titleOf(r.text), text: r.text, tr: r.tr || {}, ts: prev?.ts || Date.now(), date: prev?.date || today(), reads, lastRead: Date.now() });
  logTime(r.lang, "reading", Math.min(ms, r.min * 2 * 60000));
  if (wpm > 30 && wpm < 400) { const a = S.progress.wpm[r.lang] ||= []; a.push({ d: today(), wpm }); if (a.length > 30) a.shift(); saveProgress(); }
  markDone("read", r.lang);
  LS.set("draft:" + r.lang, null);
  stopSay(); S.reading = null; render(); scrollTo(0, 0);
  toast((reads > 1 ? `Lectura n.º ${reads} terminada` : "Lectura guardada") + (wpm > 30 && wpm < 400 ? ` · ~${wpm} palabras por minuto` : ""), 3600);
}

/* ---------- Toca una palabra: significado ---------- */
let lookupSeq = 0;
function currentGloss() {
  const own = liveCards(S.lang).filter(c => c.type === "word");
  if (S.tab === "leer" && S.reading) return parseDoc(S.reading.text).gloss.concat(own);
  return own;
}
function findGloss(word, sentence) {
  const lw = word.toLowerCase(), ls = sentence.toLowerCase(), g = currentGloss();
  const toks = x => String(x.t).toLowerCase().replace(/\(.*?\)/g, "").split(/[\s/,]+/).filter(Boolean);
  return g.find(x => String(x.t).toLowerCase() === lw)
    || g.find(x => toks(x).includes(lw) && toks(x).length > 1 && ls.includes(String(x.t).toLowerCase().replace(/\(.*?\)/g, "").trim()))
    || g.find(x => toks(x).length === 1 && toks(x)[0] === lw);
}
const sentenceOf = (text, word) => { const parts = String(text).match(/[^.!?…]+[.!?…]*/g) || [String(text)]; return (parts.find(s => s.toLowerCase().includes(word.toLowerCase())) || parts[0] || "").trim(); };
function langOf(el) {
  const l = el.closest("#view [lang], #sheet [lang]")?.getAttribute("lang");
  if (l === "en" || l === "fr") return l;
  return S.reading && S.tab === "leer" ? S.reading.lang : S.sub?.lang || S.lang;
}
async function lookup(span) {
  $$(".w.sel").forEach(x => x.classList.remove("sel"));
  span.classList.add("sel");
  const lang = langOf(span);
  const word = span.textContent, full = (span.closest(".ctx")?.textContent || word).replace(/\s+/g, " ").trim(), sentence = sentenceOf(full, word);
  const hit = findGloss(word, full);
  if (hit) return showSheet({ t: hit.t, es: hit.es, pron: hit.pron || "", note: hit.note || "", ctx: sentence }, lang);
  const key = lang + "|" + word.toLowerCase() + "|" + sentence.slice(0, 160);
  S.lk ||= {};
  if (S.lk[key]) return showSheet(S.lk[key], lang);
  if (!S.sample) return showSheet({ t: word, es: "Para ver el significado de cualquier palabra, abre la app dentro de Claude. Las palabras subrayadas sí tienen significado sin conexión." }, lang, true);
  const seq = ++lookupSeq;
  showSheet({ t: word, loading: true }, lang);
  try {
    const res = await S.sample.json(`A Spanish speaker learning ${lang === "en" ? "English" : "French"} tapped the word "${word}" in this sentence:
"${sentence.slice(0, 600)}"
Reply with ONLY JSON: {"t": the word, or the whole expression it belongs to here (phrasal verb, fixed expression), "base": dictionary form if different (infinitive, singular, masculine) or "", "es": meaning in Spanish IN THIS CONTEXT (short), "pron": approximate pronunciation written for a Spanish speaker, "note": one short sentence in Spanish on usage or grammar (for a conjugated verb: tense and person), or ""}`, { modelTier: "quick" });
    if (seq !== lookupSeq) return;
    const e = { t: String(res.t || word), base: String(res.base || ""), es: String(res.es || ""), pron: String(res.pron || ""), note: String(res.note || ""), ctx: sentence };
    S.lk[key] = e; showSheet(e, lang);
  } catch (err) { if (seq === lookupSeq) showSheet({ t: word, es: errMsg(err) }, lang, true); }
}
function showSheet(e, lang, noSave) {
  S.sheet = { ...e, lang };
  const saved = liveCards(lang).some(c => c.type === "word" && c.t.toLowerCase() === String(e.t).toLowerCase());
  $("#sheet-in").innerHTML = `<div class="sheet-head"><div><div class="term" lang="${lang}">${esc(e.t)}</div>
    ${e.base && e.base.toLowerCase() !== String(e.t).toLowerCase() ? `<div class="pron">de: ${esc(e.base)}</div>` : ""}${e.pron ? `<div class="pron">${esc(e.pron)}</div>` : ""}</div>
    <button class="x" data-act="sheet-close" aria-label="Cerrar">×</button></div>
    ${e.loading ? `<p class="thinking"><span class="dot"></span>Buscando el significado…</p>`
      : `<p style="font-size:1.05rem">${esc(e.es)}</p>${e.note ? `<p class="hint">${esc(e.note)}</p>` : ""}
      ${noSave ? "" : `<div class="row"><button class="btn quiet small" data-act="sheet-say">▶ Escuchar</button><button class="btn ghost small" data-act="sheet-save" ${saved ? "disabled" : ""}>${saved ? "Ya está para repasar" : "Guardar para repasar"}</button></div>`}`}`;
  $("#sheet").hidden = false;
}
function closeSheet() { const s = $("#sheet"); if (s) s.hidden = true; S.sheet = null; $$(".w.sel").forEach(x => x.classList.remove("sel")); }
setInterval(() => { const t = $("#timer"), r = S.reading; if (t && r && !r.generating && r.startedAt) { const s = Math.floor((Date.now() - r.startedAt) / 1000); t.textContent = Math.floor(s / 60) + ":" + pad2(s % 60); } }, 1000);
