/* ===================== Practicar ===================== */
const catLabel = c => String(c).startsWith("fr:") ? (FR_CATS[c.slice(3)] || (c === "fr:num" ? "números" : c === "fr:time" ? "la hora" : c.slice(3))) : (CATS[c] || EN_ERR_CATS[c] || c);
const conjCfg = LS.get("conjCfg", { size: 10, tenses: null });

function viewPracticar() {
  if (S.sub) {
    const k = S.sub.kind;
    if (k === "drill") return viewDrill();
    if (k === "cards") return viewCards();
    if (k === "nums") return viewNums();
    if (k === "time") return viewTime();
    if (k === "conjtable") return viewConjTable();
    if (k === "verbs") return viewVerbs();
    if (k === "review") return viewReview();
    if (k === "blocks") return viewBlocks();
    if (k === "songs") return viewSongs();
  }
  const ai = aiOff() ? " · necesita Claude" : "";
  const meters = (keys, lang) => `<div class="mlist">${weakOrder(keys, lang).map(x => `<button class="meter mbtn" data-act="go" data-arg="${lang === "fr" ? "tense:" : "cat:"}${x.k}" aria-label="Practicar ${esc(lang === "fr" ? FR_CATS[x.k] : CATS[x.k])}"><span>${esc(lang === "fr" ? FR_CATS[x.k] : CATS[x.k])}</span><span class="prog"><i style="width:${x.n ? Math.round(x.acc * 100) : 0}%"></i></span><span>${x.n ? Math.round(x.acc * 100) + "%" : "—"}</span></button>`).join("")}</div>`;
  if (S.lang === "en") return `
    <div class="stack"><h1>Tiempos verbales en automático</h1><p class="lead">Sesiones cortas centradas en tus puntos débiles. Escribir la respuesta cuesta más que elegirla, y por eso se fija mejor.</p></div>
    <div class="panel">${levelPicker()}</div>
    <div class="menu">
      <button data-act="go" data-arg="quick"><span><b>Ejercicio express</b><small>8 frases sobre tus puntos débiles · elegir y escribir · sin internet</small></span><span class="go">→</span></button>
      <button data-act="go" data-arg="errors"><span><b>Encuentra el error</b><small>Frases con los errores típicos de hispanohablantes · sin internet</small></span><span class="go">→</span></button>
      <button data-act="go" data-arg="irreg"><span><b>Verbos irregulares</b><small>go → went → gone: escribe pasado y participio · sin internet</small></span><span class="go">→</span></button>
      <button data-act="go" data-arg="phrases"><span><b>Frases avanzadas</b><small>Patrones que usan los nativos, para decir en voz alta</small></span><span class="go">→</span></button>
      <button data-act="go" data-arg="songs"><span><b>Aprende con canciones</b><small>${esc(songArtists("en"))} · títulos traducidos y explicados</small></span><span class="go">→</span></button>
      <button data-act="go" data-arg="ai-drill"><span><b>Ejercicios nuevos con IA</b><small>12 frases creadas según tus errores${ai}</small></span><span class="go">→</span></button>
      <button data-act="go" data-arg="ai-phrases"><span><b>Frases nuevas con IA</b><small>8 frases un paso sobre tu nivel (${level("en").k})${ai}</small></span><span class="go">→</span></button>
    </div>
    <div class="panel"><h3>Tu precisión por estructura</h3><p class="hint">De la que más necesitas a la que menos. Toca una para practicarla.</p>${meters(Object.keys(CATS), "en")}</div>`;
  const tenses = conjCfg.tenses || FR_TENSES_BY_LEVEL[level("fr").k], idx = S.progress.frVerbIdx || 0;
  return `
    <div class="stack"><h1>Lo básico, bien dicho</h1><p class="lead">Conjugación, números, la hora y fechas, siempre dentro de frases reales. Escribe, escucha y repite en voz alta.</p></div>
    <div class="panel">${levelPicker()}</div>
    <div class="menu"><button data-act="go" data-arg="blocks"><span><b>Francés por bloques</b><small>${blkNext() ? `Sigue con la lección ${blkPos(blkNext())}: ${esc(blkNext().title)}` : "Las 10 lecciones aprendidas · repaso acumulado"} · escuchar, entender y decir · sin internet</small></span><span class="go">→</span></button>
      <button data-act="go" data-arg="songs"><span><b>Aprende con canciones</b><small>${esc(songArtists("fr"))} · títulos traducidos y explicados</small></span><span class="go">→</span></button></div>
    <div class="panel"><h3>Conjugación</h3>
      <div class="chips">${[[10, "10 esenciales"], [25, "Top 25"], [50, "Top 50"], [100, "Los 100"]].map(([n, t]) => `<button class="chip" data-act="conj-size" data-arg="${n}" aria-pressed="${conjCfg.size === n}">${t}</button>`).join("")}</div>
      <div class="chips">${Object.keys(FR_CATS).map(t => `<button class="chip" data-act="conj-tense" data-arg="${t}" aria-pressed="${tenses.includes(t)}">${FR_CATS[t]}</button>`).join("")}</div>
      <button class="btn" data-act="go" data-arg="conj">Practicar conjugación · 10 formas</button>
      <button class="btn quiet" data-act="go" data-arg="verbs">Ver la tabla de tus 100 verbos</button></div>
    <div class="menu">
      <button data-act="go" data-arg="nums"><span><b>Números en frases</b><small>Decir y escuchar · de 0 a 1000</small></span><span class="go">→</span></button>
      <button data-act="go" data-arg="time"><span><b>La hora y la fecha</b><small>Il est quinze heures vingt… · c'est le premier octobre</small></span><span class="go">→</span></button>
      <button data-act="go" data-arg="days"><span><b>Días de la semana</b><small>7 frases con pronunciación</small></span><span class="go">→</span></button>
      <button data-act="go" data-arg="months"><span><b>Meses del año</b><small>12 frases con fechas</small></span><span class="go">→</span></button>
      <button data-act="go" data-arg="ai-verbs"><span><b>Frases con tus verbos</b><small>10 verbos por sesión · vas en el ${Math.min(idx + 1, 100)} de 100${ai}</small></span><span class="go">→</span></button>
    </div>
    <div class="panel"><h3>Tu precisión por tiempo verbal</h3><p class="hint">Toca uno para practicarlo.</p>${meters(Object.keys(FR_CATS), "fr")}</div>`;
}

/* ---------- Motor de ejercicios ---------- */
const singleBlank = it => it.q.split("___").length === 2 && !String(it.o[it.a]).includes("/");
const asMC = it => ({ type: "mc", c: it.c, q: it.q, o: it.o, a: it.a, w: it.w });
const asType = it => ({ type: "type", c: it.c, q: it.q, ok: [it.o[it.a]], w: it.w });
function enItems(cat, n) { return shuffle(EN_BANK.filter(x => x.c === cat)).slice(0, n).map((it, i) => i % 2 === 1 && singleBlank(it) ? asType(it) : asMC(it)); }
function judgeItems(cats, n) { return shuffle(EN_ERRORS.filter(x => !cats || cats.includes(x.c))).slice(0, n).map(x => ({ type: "judge", c: x.c, s: x.s, isOk: x.ok, fix: x.fix, w: x.w })); }
function buildWarmupEN() {
  const [a, b] = weakOrder(Object.keys(CATS), "en").map(x => x.k);
  let items = [...enItems(a, 3), ...enItems(b, 3), ...judgeItems([a, b], 2)];
  if (items.length < 8) items = items.concat(judgeItems(null, 8 - items.length));
  return shuffle(items).slice(0, 8);
}
function buildIrreg(n = 10) {
  const miss = S.progress.irregMiss || {};
  const pool = EN_IRREG.slice().sort((a, b) => (miss[b[0]] || 0) - (miss[a[0]] || 0) || Math.random() - 0.5);
  return shuffle(pool.slice(0, 28)).slice(0, n).map(([base, past, pp, es]) => ({ type: "irreg", c: "irreg", base, es, past: past.split("/"), pp: pp.split("/") }));
}
const frPool = size => FR_VERBS.slice(0, size).map(v => v.fr);
function buildConj({ verbs, tenses, n = 10 }) {
  const items = [], weak = weakOrder(tenses, "fr").map(x => x.k);
  for (let k = 0; k < n * 6 && items.length < n; k++) {
    const inf = pick(verbs), tense = Math.random() < 0.45 ? weak[0] : pick(tenses);
    const forms = frConj(inf, tense), idxs = forms.map((x, i) => x ? i : -1).filter(i => i >= 0), i = pick(idxs), key = inf + tense + i;
    if (items.some(x => x.key === key)) continue;
    items.push({ type: "conj", c: "fr:" + tense, key, inf, tense, i, f: forms[i].f, ok: forms[i].ok });
  }
  return items;
}
function buildWarmupFR() {
  const size = Math.min(100, Math.max(10, (S.progress.frVerbIdx || 0) + 10));
  return buildConj({ verbs: frPool(size), tenses: FR_TENSES_BY_LEVEL[level("fr").k], n: 8 });
}
function startWarmup(lang) {
  const items = lang === "en" ? buildWarmupEN() : buildWarmupFR();
  startDrill(items, { title: "Calentamiento", lang, src: "warmup" });
}
function startDrill(items, o = {}) {
  stopSay();
  items = items.map(it => it.type ? it : asMC(it));
  S.sub = { kind: "drill", tab: S.tab, lang: o.lang || S.lang, title: o.title || "Ejercicios", items, i: 0, ok: 0, wrong: [], ans: null, t0: Date.now(), src: o.src || "", fresh: !!o.fresh };
  render(); scrollTo(0, 0); focusAns();
}
const focusAns = () => setTimeout(() => { const i = $("#ans1") || $("#ans"); if (i && matchMedia("(pointer:fine)").matches) i.focus(); }, 60);
function fillBlanks(q, v) { let k = 0; const parts = String(v).split("/").map(s => s.trim()); return q.replace(/___/g, () => parts[Math.min(k++, parts.length - 1)]); }
const fullSentence = it => fillBlanks(it.q, it.o[it.a]);
function rightAnswer(it) {
  if (it.type === "mc") return fullSentence(it);
  if (it.type === "type") return it.q.replace("___", it.ok[0]);
  if (it.type === "judge") return it.fix;
  if (it.type === "conj") return withSubj(it.i, it.f, frVerb(it.inf).impersonal);
  if (it.type === "irreg") return `${it.base} → ${it.past.join(" / ")} → ${it.pp.join(" / ")}`;
  return "";
}
function viewDrill() {
  const d = S.sub, L = d.lang;
  if (d.i >= d.items.length) return drillSummary(d);
  const it = d.items[d.i], a = d.ans;
  const head = `<div class="back"><button class="btn quiet small" data-act="back">← Salir</button><span class="tag">${esc(catLabel(it.c))}</span></div>
    <div class="prog"><i style="width:${(d.i / d.items.length) * 100}%"></i></div>`;
  let body = "";
  if (it.type === "mc") {
    body = `<p class="q ctx" lang="${L}">${wrapWords(esc(it.q).split("___").join("<u>&nbsp;&nbsp;&nbsp;</u>"))}</p>
      <div class="opts">${it.o.map((o, k) => `<button class="opt ${!a ? "" : k === it.a ? "ok" : k === a.picked ? "ko" : ""}" data-act="opt" data-arg="${k}" ${a ? "disabled" : ""}>${esc(o)}</button>`).join("")}</div>`;
  } else if (it.type === "type") {
    body = `<p class="hint">Escribe la palabra que falta.</p><p class="q ctx" lang="${L}">${wrapWords(esc(it.q).split("___").join("<u>&nbsp;&nbsp;&nbsp;</u>"))}</p>
      ${a ? `<p class="ans" style="color:${a.res === "ko" ? "var(--bad)" : "var(--good)"}">${esc(a.val)}</p>` : `${ansInput("ans", L)}<button class="btn" data-act="check">Comprobar</button>`}`;
  } else if (it.type === "judge") {
    body = `<p class="hint">¿Esta frase está bien dicha?</p><p class="q ctx" lang="${L}">${wrapWords(esc(it.s))}</p>
      <div class="opts" style="grid-template-columns:1fr 1fr">${[["1", "Está bien"], ["0", "Tiene un error"]].map(([v, t]) => `<button class="opt ${!a ? "" : (v === "1") === it.isOk ? "ok" : a.picked === v ? "ko" : ""}" data-act="judge" data-arg="${v}" ${a ? "disabled" : ""}>${t}</button>`).join("")}</div>`;
  } else if (it.type === "conj") {
    const v = frVerb(it.inf);
    body = `<p class="hint">${esc(FR_CATS[it.tense])} · ${esc(FR_TENSE_ES[it.tense])}</p>
      <p class="q"><b lang="fr">${esc(v.impersonal ? "il" : FR_PERS[it.i])}</b> · <span lang="fr">${esc(it.inf)}</span> <span class="hint">(${esc(v.es)})</span></p>
      ${a ? `<p class="ans" lang="fr" style="color:${a.res === "ko" ? "var(--bad)" : "var(--good)"}">${esc(a.val || "—")}</p>` : `${ansInput("ans", "fr", "Escribe solo el verbo (sin el sujeto)")}${accentBar()}<button class="btn" data-act="check">Comprobar</button>`}`;
  } else if (it.type === "irreg") {
    body = `<p class="q"><b lang="en">${esc(it.base)}</b> <span class="hint">(${esc(it.es)})</span></p>
      ${a ? `<p class="ans"><span style="color:${a.r1 === "ko" ? "var(--bad)" : "var(--good)"}">${esc(a.val[0])}</span> · <span style="color:${a.r2 === "ko" ? "var(--bad)" : "var(--good)"}">${esc(a.val[1])}</span></p>`
        : `<label class="hint" for="ans1">Pasado</label>${ansInput("ans1", "en", "Ej: went")}<label class="hint" for="ans2">Participio</label>${ansInput("ans2", "en", "Ej: gone")}<button class="btn" data-act="check">Comprobar</button>`}`;
  }
  let fb = "";
  if (a) {
    const good = a.res !== "ko", tip = tipFor(L, String(it.c).replace(/^fr:/, ""));
    const right = rightAnswer(it);
    let extra = "";
    if (it.type === "judge" && !it.isOk) extra = `<p class="diff" lang="${L}">${diffHtml(it.s, it.fix)}</p>`;
    if (it.type === "conj") {
      const v = frVerb(it.inf), rows = frConj(it.inf, it.tense);
      extra = `<table class="conj" lang="fr">${rows.map((x, i) => x ? `<tr class="${i === it.i ? "hl" : ""}"><td>${esc(withSubj(i, x.f, v.impersonal))}</td><td><button class="say" data-act="say" data-say="${esc(sayForm(i, x.f))}" data-lang="fr" aria-label="Escuchar">▶</button></td></tr>` : "").join("")}</table>
        ${v.regularEr && it.tense === "pres" && [0, 1, 2, 5].includes(it.i) ? `<p class="hint">Ojo: en los verbos en -er, las terminaciones -e, -es y -ent no suenan: je parle, tu parles, ils parlent se pronuncian igual.</p>` : ""}`;
    }
    const sayTxt = it.type === "conj" ? sayForm(it.i, it.f) : it.type === "irreg" ? `${it.base}, ${it.past[0]}, ${it.pp[0]}` : right;
    fb = `<div class="why soft"><b class="${good ? "good-t" : "bad-t"}">${a.res === "accent" ? "Bien, pero ojo con los acentos." : good ? "¡Correcto!" : "Casi."}</b>
      ${!good || a.res === "accent" || it.type === "judge" ? ` <span lang="${L}">${esc(right)}</span>` : ""}${it.w ? `<br>${esc(it.w)}` : ""}</div>${extra}
      <div class="row"><button class="btn quiet small" data-act="say" data-say="${esc(sayTxt)}" data-lang="${L}">▶ Escuchar</button>${tip && !good ? `<button class="link" data-act="tip" data-arg="${esc(String(it.c).replace(/^fr:/, ""))}" data-lang="${L}">Ver la regla</button>` : ""}
      <button class="btn" data-act="next" style="flex:1">${d.i + 1 < d.items.length ? "Siguiente" : "Ver resultado"}</button></div>
      <p class="hint">Di la frase completa en voz alta antes de seguir.</p>`;
  }
  return head + body + fb;
}
function recordAns(it, ok) {
  const d = S.sub;
  if (ok) d.ok++; else d.wrong.push({ it, val: d.ans?.val });
  logAnswer(it.c, ok);
  if (it.type === "irreg" && !ok) { const m = S.progress.irregMiss ||= {}; m[it.base] = (m[it.base] || 0) + 1; }
}
function pickOpt(k) { const d = S.sub, it = d.items[d.i]; if (d.ans) return; d.ans = { picked: k, res: k === it.a ? "ok" : "ko", val: it.o[k] }; recordAns(it, k === it.a); render(); }
function pickJudge(v) { const d = S.sub, it = d.items[d.i]; if (d.ans) return; const ok = (v === "1") === it.isOk; d.ans = { picked: v, res: ok ? "ok" : "ko" }; recordAns(it, ok); render(); }
function checkTyped() {
  const d = S.sub, it = d.items[d.i]; if (d.ans) return;
  if (it.type === "irreg") {
    const a = $("#ans1")?.value || "", b = $("#ans2")?.value || "", r1 = checkAns(a, it.past), r2 = checkAns(b, it.pp);
    if (r1 === "empty" || r2 === "empty") return toast("Completa las dos formas");
    const ok = r1 !== "ko" && r2 !== "ko";
    d.ans = { val: [a.trim(), b.trim()], r1, r2, res: ok ? (r1 === "accent" || r2 === "accent" ? "accent" : "ok") : "ko" };
    recordAns(it, ok);
  } else {
    let v = $("#ans")?.value || "";
    if (it.type === "conj") v = stripSubj(v);
    const r = checkAns(v, it.ok);
    if (r === "empty") return toast("Escribe tu respuesta");
    d.ans = { val: v.trim(), res: r };
    recordAns(it, r !== "ko");
  }
  render();
}
function nextItem() { const d = S.sub; d.i++; d.ans = null; stopSay(); render(); focusAns(); }
function drillSummary(d) {
  if (!d.logged) {
    d.logged = true;
    logTime(d.lang, "practice", Date.now() - d.t0);
    if (d.src === "warmup") markDone("warm", d.lang);
    if (d.fresh) saveItem({ id: uid(), kind: "drill", lang: d.lang, title: `${d.title} · ${d.ok}/${d.items.length}`, items: d.items, ts: Date.now(), date: today() });
  }
  const pct = d.ok / d.items.length;
  return `<div class="stack"><p class="eyebrow">${esc(d.title)}</p><h1>${d.ok} de ${d.items.length} correctas</h1>
    <p class="lead">${pct >= 0.85 ? "Excelente. Estas estructuras ya te salen solas." : pct >= 0.6 ? "Bien. Repite las falladas ahora mismo: corregir en caliente es lo que más fija." : "Vas aprendiendo. Repite las falladas y revisa la regla: mañana saldrán mejor."}</p></div>
    ${d.wrong.length ? `<div class="panel"><h3>Para repasar</h3>${d.wrong.map(w => `<div class="fix"><p class="ft" lang="${d.lang}"><b>${esc(rightAnswer(w.it))}</b></p>${w.it.w ? `<p class="hint">${esc(w.it.w)}</p>` : ""}</div>`).join("")}</div>
      <div class="row"><button class="btn" data-act="retry-wrong">Repetir las ${d.wrong.length} falladas</button><button class="btn ghost" data-act="save-wrong">Guardar para repasar</button></div>` : ""}
    <button class="btn ${d.wrong.length ? "quiet" : ""} wide" data-act="back">${d.src === "warmup" ? "Volver a Hoy" : "Volver"}</button>`;
}
function retryWrong() { const d = S.sub; startDrill(shuffle(d.wrong.map(w => w.it)), { title: d.title + " · falladas", lang: d.lang, src: d.src }); }
function saveWrong() {
  const d = S.sub; let n = 0;
  for (const { it, val } of d.wrong) {
    let ok = false;
    if (it.type === "mc" || it.type === "type") {
      const wrongS = val ? fillBlanks(it.q, val) : "";
      ok = wrongS && wrongS !== rightAnswer(it) ? addCard({ lang: d.lang, type: "fix", bad: wrongS, t: rightAnswer(it), note: it.w }, true) : addCard({ lang: d.lang, type: "phrase", es: it.q.replace(/___/g, "…") + " (completa)", t: rightAnswer(it), note: it.w }, true);
    } else if (it.type === "judge") ok = addCard({ lang: d.lang, type: "fix", bad: it.isOk ? it.s + " (¿error?)" : it.s, t: it.fix, note: it.w }, true);
    else if (it.type === "conj") ok = addCard({ lang: "fr", type: "phrase", es: `${it.inf} · ${FR_CATS[it.tense]} · ${it.i === 2 && frVerb(it.inf).impersonal ? "il" : FR_PERS[it.i]}`, t: withSubj(it.i, it.f, frVerb(it.inf).impersonal), note: FR_TENSE_ES[it.tense] }, true);
    else if (it.type === "irreg") ok = addCard({ lang: "en", type: "phrase", es: `${it.base} (${it.es}): pasado y participio`, t: rightAnswer(it) }, true);
    if (ok) n++;
  }
  toast(n ? `${n} guardadas para tu repaso diario` : "Ya estaban en tus tarjetas"); updateBadge();
}

/* ---------- Tarjetas de frases (frases avanzadas, días, meses, verbos con IA) ---------- */
function startCards(items, title, lang, fresh, mode = "entender") {
  stopSay();
  S.sub = { kind: "cards", tab: S.tab, title, items, lang, open: {}, t0: Date.now(), fresh, mode };
  render(); scrollTo(0, 0);
}
function viewCards() {
  const d = S.sub, L = d.lang, gs = glossSet(liveCards(L).filter(c => c.type === "word"));
  return `<div class="back"><button class="btn quiet small" data-act="back">← Volver</button><span class="tag">${d.items.length} frases</span></div>
  <h1>${esc(d.title)}</h1>
  <div class="seg" role="group" aria-label="Modo" style="align-self:flex-start"><button data-act="card-mode" data-arg="entender" aria-pressed="${d.mode !== "decir"}">Entender</button><button data-act="card-mode" data-arg="decir" aria-pressed="${d.mode === "decir"}">Quiero decir…</button></div>
  <p class="lead">${d.mode === "decir" ? "Lee la idea en español, dila en voz alta a tu manera y luego revela cómo se dice." : "Escucha ▶, repite en voz alta y solo entonces revela la traducción. Toca una palabra para ver su significado."}</p>
  ${d.items.map((c, i) => {
    const tgt = `<p class="t ctx" lang="${L}">${wrapWords(md(c.t), gs)}</p>`, extra = c.note ? `<p class="note">${md(c.note)}</p>` : "";
    return `<div class="card">${c.tag ? `<span class="tag" style="align-self:flex-start">${esc(c.tag)}</span>` : ""}
      ${d.mode === "decir" ? `<p class="t" style="color:var(--muted)">${esc(c.es)}</p>${d.open[i] ? tgt + extra : ""}` : tgt + (d.open[i] ? `<p class="es">${esc(c.es)}</p>${extra}` : "")}
      <div class="row">${d.mode === "decir" && !d.open[i] ? "" : `<button class="btn quiet small" data-act="say" data-say="${esc(c.t)}" data-lang="${L}">▶ Escuchar</button>`}
      ${d.open[i] ? `<button class="btn quiet small" data-act="card-save" data-arg="${i}">Guardar para repasar</button>` : `<button class="btn ghost small" data-act="card-open" data-arg="${i}">${d.mode === "decir" ? "Así se dice" : "Ver traducción y nota"}</button>`}</div></div>`;
  }).join("")}
  <button class="btn wide" data-act="cards-done">${d.fresh ? "Terminé · guardar" : "Terminé"}</button>`;
}
function cardsDone() {
  const d = S.sub;
  logTime(d.lang, "practice", Date.now() - d.t0);
  if (d.fresh) saveItem({ id: uid(), kind: "cards", lang: d.lang, title: d.title, items: d.items, ts: Date.now(), date: today() });
  if (d.advance) { S.progress.frVerbIdx = d.advance; saveProgress(); }
  S.sub = null; stopSay(); render(); scrollTo(0, 0); toast("Sesión guardada");
}

/* ---------- Números ---------- */
const RANGES = { "0–20": [0, 20], "21–69": [21, 69], "70–99": [70, 99], "100–1000": [100, 1000] };
function newNum() { const d = S.sub, [a, b] = RANGES[d.range], n = a + Math.floor(Math.random() * (b - a + 1)), [fr, es] = pick(FR_NUM_CTX)(n); Object.assign(d, { n, fr, es, open: false, ans: null }); }
const numSentence = d => d.fr.replace(String(d.n), frNum(d.n));
function viewNums() {
  const d = S.sub, words = frNum(d.n);
  const tip = d.n >= 80 && d.n < 100 ? FR_NUM_TIPS[80] : d.n >= 70 && d.n < 80 ? FR_NUM_TIPS[70] : d.n % 10 === 1 && d.n > 20 && d.n < 70 ? FR_NUM_TIPS[21] : [5, 6, 8, 10].includes(d.n) ? FR_NUM_TIPS[6] : "";
  const listen = d.mode === "listen";
  return `<div class="back"><button class="btn quiet small" data-act="back">← Volver</button><span class="tag">${d.count} vistos · ${d.ok} bien</span></div>
  <div class="seg" role="group" aria-label="Modo" style="align-self:flex-start"><button data-act="num-mode" data-arg="say" aria-pressed="${!listen}">Leer y decir</button><button data-act="num-mode" data-arg="listen" aria-pressed="${listen}">Escuchar y escribir</button></div>
  <div class="chips">${Object.keys(RANGES).map(r => `<button class="chip" data-act="num-range" data-arg="${r}" aria-pressed="${d.range === r}">${r}</button>`).join("")}</div>
  <div class="card" style="align-items:center;text-align:center">
    ${listen ? `<button class="btn ghost" data-act="num-play">▶ Escuchar la frase</button>
        ${d.ans ? `<div class="big">${d.n}</div><p class="t" lang="fr">${esc(numSentence(d))}</p><p class="es">${esc(d.es)}</p>
          <p class="why soft" style="width:100%"><b class="${d.ans.ok ? "good-t" : "bad-t"}">${d.ans.ok ? "¡Correcto!" : `Escribiste ${esc(d.ans.val)}.`}</b> ${esc(words)}</p>${tip ? `<p class="note">${esc(tip)}</p>` : ""}
          <button class="btn wide" data-act="num-next">Siguiente</button>`
        : `<input type="text" id="ans" class="ans" inputmode="numeric" autocomplete="off" enterkeyhint="done" data-enter placeholder="¿Qué número escuchaste?" style="text-align:center">
          <button class="btn wide" data-act="num-check">Comprobar</button>`}`
    : `<div class="big">${d.n}</div><p class="t" lang="fr">${esc(d.fr)}</p><p class="hint">Di la frase completa en voz alta y luego comprueba.</p>
      ${d.open ? `<p class="t" lang="fr"><strong>${esc(words)}</strong></p><p class="es">${esc(d.es)}</p>${tip ? `<p class="note">${esc(tip)}</p>` : ""}
        <div class="row" style="width:100%"><button class="btn quiet small" data-act="say" data-say="${esc(numSentence(d))}" data-lang="fr">▶</button><button class="btn ghost" data-act="num-know" data-arg="0" style="flex:1">No me salió</button><button class="btn" data-act="num-know" data-arg="1" style="flex:1">Me salió</button></div>`
        : `<button class="btn wide" data-act="num-open">Comprobar</button>`}`}
  </div>`;
}
function numDone(ok) { const d = S.sub; d.count++; if (ok) d.ok++; logAnswer("fr:num", ok); if (d.count % 10 === 0) { logTime("fr", "practice", Date.now() - d.t0); d.t0 = Date.now(); } }

/* ---------- La hora y la fecha ---------- */
function newTime() {
  const d = S.sub;
  if (d.what === "date") { const dt = new Date(); dt.setDate(dt.getDate() + Math.floor(Math.random() * 400) - 200); d.dt = frDate(dt); }
  else { const h = pick([7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]), m = pick([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]); d.tm = frTime(h, m); d.h = h; d.m = m; }
  d.open = false; d.ans = null;
}
function viewTime() {
  const d = S.sub, listen = d.mode === "listen" && d.what === "time";
  const reveal = d.what === "time" ? `<p class="t" lang="fr">${esc(d.tm.formal)}</p><p class="hint">Formal (24 h), para horarios y trenes</p><p class="t" lang="fr">${esc(d.tm.informal)}</p><p class="hint">Cotidiano</p>
      <div class="row"><button class="btn quiet small" data-act="say" data-say="${esc(d.tm.formal)}" data-lang="fr">▶ Formal</button><button class="btn quiet small" data-act="say" data-say="${esc(d.tm.informal)}" data-lang="fr">▶ Cotidiano</button></div>`
    : `<p class="t" lang="fr">${esc(d.dt.words)}</p><p class="es">${esc(d.dt.es)}</p><button class="btn quiet small" data-act="say" data-say="${esc(d.dt.words)}" data-lang="fr">▶ Escuchar</button><p class="note">Los días y meses van en minúscula. Solo el día 1 es ordinal: le premier.</p>`;
  return `<div class="back"><button class="btn quiet small" data-act="back">← Volver</button><span class="tag">${d.count} vistos · ${d.ok} bien</span></div>
  <div class="seg" role="group" aria-label="Qué practicar" style="align-self:flex-start"><button data-act="time-what" data-arg="time" aria-pressed="${d.what === "time"}">La hora</button><button data-act="time-what" data-arg="date" aria-pressed="${d.what === "date"}">La fecha</button></div>
  ${d.what === "time" ? `<div class="seg" role="group" aria-label="Modo" style="align-self:flex-start"><button data-act="time-mode" data-arg="say" aria-pressed="${!listen}">Ver y decir</button><button data-act="time-mode" data-arg="listen" aria-pressed="${listen}">Escuchar y escribir</button></div>` : ""}
  <div class="card" style="align-items:center;text-align:center">
    ${listen ? `<button class="btn ghost" data-act="time-play">▶ Escuchar la hora</button>
        ${d.ans ? `<div class="big">${d.tm.digits}</div><p class="why soft" style="width:100%"><b class="${d.ans.ok ? "good-t" : "bad-t"}">${d.ans.ok ? "¡Correcto!" : `Escribiste ${esc(d.ans.val)}.`}</b></p>${reveal}<button class="btn wide" data-act="time-next">Siguiente</button>`
          : `<input type="text" id="ans" class="ans" inputmode="numeric" autocomplete="off" enterkeyhint="done" data-enter placeholder="Ej: 15:20" style="text-align:center"><button class="btn wide" data-act="time-check">Comprobar</button>`}`
    : `<div class="big" style="font-size:${d.what === "date" ? "1.7rem" : "3.6rem"}">${esc(d.what === "time" ? d.tm.digits : d.dt.digits)}</div>
      <p class="hint">${d.what === "time" ? "Di la hora en voz alta: «Il est…»" : "Di la fecha en voz alta: «C'est…»"}</p>
      ${d.open ? `${reveal}<div class="row" style="width:100%"><button class="btn ghost" data-act="time-know" data-arg="0" style="flex:1">No me salió</button><button class="btn" data-act="time-know" data-arg="1" style="flex:1">Me salió</button></div>`
        : `<button class="btn wide" data-act="time-open">Comprobar</button>`}`}
  </div>`;
}
function checkTime() {
  const d = S.sub, v = ($("#ans")?.value || "").trim(), nums = v.match(/\d+/g);
  if (!nums) return toast("Escribe la hora, por ejemplo 15:20");
  let h, m;
  if (nums.length === 1 && nums[0].length >= 3) { h = +nums[0].slice(0, -2); m = +nums[0].slice(-2); } else { h = +nums[0]; m = +(nums[1] || 0); }
  const ok = m === d.m && (h === d.h || h === d.h % 12 || (d.h === 12 && h === 0));
  d.ans = { ok, val: v }; d.count++; if (ok) d.ok++; logAnswer("fr:time", ok); render();
}

/* ---------- Tabla de conjugación y lista de verbos ---------- */
function viewConjTable() {
  const d = S.sub, v = frVerb(d.inf), lvT = FR_TENSES_BY_LEVEL[level("fr").k], idx = FR_VERBS.findIndex(x => x.fr === d.inf);
  const table = t => `<table class="conj" lang="fr">${frConj(d.inf, t).map((x, i) => x ? `<tr><td>${esc(withSubj(i, x.f, v.impersonal))}</td><td><button class="say" data-act="say" data-say="${esc(sayForm(i, x.f))}" data-lang="fr" aria-label="Escuchar">▶</button></td></tr>` : "").join("")}</table>`;
  const later = Object.keys(FR_CATS).filter(t => !lvT.includes(t));
  return `<div class="back"><button class="btn quiet small" data-act="back">← Volver</button><span class="tag">#${idx + 1} de 100</span></div>
  <div class="stack" style="gap:6px"><h1 lang="fr">${esc(v.refl ? "s'" + d.inf : d.inf)}</h1><p class="lead">${esc(v.es)} · ${esc(v.group)}${v.impersonal ? " · impersonal (solo «il»)" : ""}</p>
    <p class="hint">Participio: <b lang="fr">${esc(v.pp)}</b> · Pasado compuesto con <b>${v.refl ? "être (reflexivo)" : v.aux}</b>${v.aux === "être" && !v.refl ? " — el participio concuerda: elle est allée, ils sont allés" : ""}</p></div>
  <div class="row"><button class="btn quiet small" data-act="say" data-say="${esc(d.inf)}" data-lang="fr">▶ ${esc(d.inf)}</button><button class="btn small" data-act="conj-verb">Practicar este verbo</button></div>
  ${lvT.map(t => `<div class="panel"><h3>${FR_CATS[t]} · ${esc(FR_TENSE_ES[t])}</h3>${table(t)}</div>`).join("")}
  ${later.length ? `<details class="tipx"><summary>Tiempos para más adelante (${later.map(t => FR_CATS[t]).join(", ")})</summary><div class="body" style="max-width:none">${later.map(t => `<h3>${FR_CATS[t]}</h3>${table(t)}`).join("")}</div></details>` : ""}
  <div class="row"><button class="btn quiet" data-act="verb-step" data-arg="-1" ${idx <= 0 ? "disabled" : ""}>← Anterior</button><button class="btn quiet" data-act="verb-step" data-arg="1" ${idx >= 99 ? "disabled" : ""}>Siguiente →</button></div>`;
}
function verbGrid(q) {
  const idx = S.progress.frVerbIdx || 0, nq = stripAcc(String(q || "").toLowerCase());
  const list = FR_VERBS.map((v, i) => ({ ...v, i })).filter(v => !nq || stripAcc((v.fr + " " + v.es).toLowerCase()).includes(nq));
  return list.map(v => `<button data-act="verb-open" data-arg="${esc(v.fr)}" class="${v.i < idx ? "seen" : ""}"><b lang="fr">${esc(v.fr)}</b><small>${v.i + 1}. ${esc(v.es)}</small></button>`).join("") || `<p class="empty">Sin resultados</p>`;
}
function viewVerbs() {
  const q = S.sub.q || "";
  return `<div class="back"><button class="btn quiet small" data-act="back">← Volver</button><span class="tag">100 verbos</span></div>
  <h1>Tus 100 verbos</h1><p class="lead">Ordenados por frecuencia: los primeros 20 cubren buena parte de lo que se dice cada día. Toca uno para ver todas sus formas.</p>
  <input type="search" id="verb-q" placeholder="Buscar en francés o en español" value="${esc(q)}">
  <div class="verbs" id="verb-grid">${verbGrid(q)}</div>`;
}
function openVerb(inf) { stopSay(); S.sub = { kind: "conjtable", tab: S.tab, lang: "fr", inf, from: S.sub?.kind === "verbs" ? "verbs" : "" }; render(); scrollTo(0, 0); }

/* ---------- Generadores con IA ---------- */
async function genJSON(prompt, label) {
  if (!canAI()) return null;
  S.busy = true; S.ctl = new AbortController();
  $("#view").innerHTML = `<p class="thinking"><span class="dot"></span>${esc(label)}</p><button class="btn quiet" data-act="stop-gen">Cancelar</button>`;
  try { return await S.sample.json(prompt, { cache: false, signal: S.ctl.signal }); }
  catch (e) { if (e?.code !== "cancelled") toast(errMsg(e)); return null; }
  finally { S.busy = false; }
}
async function genDrillAI() {
  const weak = weakOrder(Object.keys(CATS), "en").slice(0, 3).map(x => CATS[x.k]).join(", ");
  const data = await genJSON(`Create 12 fill-in-the-blank English grammar items for a Spanish-speaking adult. ${levelLine("en")} Natural, varied, adult sentences, first person when possible, about: ${themeHint()}. Categories (field "c") must be one of: ${Object.keys(CATS).join(", ")} meaning: ${JSON.stringify(CATS)}. Give extra weight to: ${weak}. Seed for variety: ${uid()}.${aboutMe()}
Reply with ONLY a JSON array of 12 objects: {"c": category key, "q": sentence with ___ for each blank, "o": array of exactly 4 short options (if two blanks, write each option as "x / y"), "a": index 0-3 of the only correct option (vary its position), "w": explanation IN SPANISH, 1-2 sentences, with the rule and a quick trick}.`, "Creando ejercicios nuevos según tus errores…");
  const ok = Array.isArray(data) ? data.filter(x => x && typeof x.q === "string" && x.q.includes("___") && Array.isArray(x.o) && x.o.length >= 2 && Number.isInteger(x.a) && x.o[x.a] != null) : [];
  if (ok.length) startDrill(ok.map((it, i) => i % 3 === 2 && singleBlank(it) ? asType(it) : asMC(it)), { title: "Ejercicios nuevos", lang: "en", fresh: true });
  else render();
}
async function genPhrasesAI() {
  const data = await genJSON(`Write 8 natural, spoken English sentences in FIRST PERSON, one step above this level: ${level("en").p}, that the speaker would really say (topics: ${themeHint()}), each built around perfect tenses, was/were, had been/have been or modal perfects, plus one idiomatic chunk. Wrap the key verb phrase in **double asterisks**. Seed: ${uid()}.${aboutMe()}
Reply with ONLY a JSON array of 8 objects: {"t": sentence, "es": natural Spanish translation, "note": IN SPANISH: the pattern, when to use it and one pronunciation hint}.`, "Escribiendo frases nuevas…");
  const ok = Array.isArray(data) ? data.filter(x => x && x.t && x.es) : [];
  if (ok.length) startCards(ok, "Frases nuevas", "en", true); else render();
}
async function genVerbsAI() {
  let idx = S.progress.frVerbIdx || 0; if (idx >= 100) idx = 0;
  const batch = FR_VERBS.slice(idx, idx + 10);
  const data = await genJSON(`Pour un hispanophone qui apprend le français. ${levelLine("fr")} Pour CHACUN de ces 10 verbes : ${batch.map(v => v.fr).join(", ")} — écris 3 phrases très utiles à la première personne ou dans un mini-dialogue, une par temps parmi : ${FR_TENSES_BY_LEVEL[level("fr").k].map(t => FR_CATS[t]).join(", ")} (si le niveau n'a que deux temps, fais deux phrases au présent). Utilise parfois des nombres en lettres, jours ou mois. Thèmes possibles : ${themeHint()} (en version simple). Mets le verbe conjugué entre **doubles astérisques**. Graine : ${uid()}.
Réponds UNIQUEMENT avec un tableau JSON de 30 objets : {"tag": "infinitif · temps" (ex: "aller · passé composé"), "t": phrase en français, "es": traducción al español, "note": EN ESPAGNOL: conjugación usada (persona, auxiliar si aplica) + pronunciación figurada de la parte difícil}.`, `Creando frases con: ${batch.map(v => v.fr).join(", ")}…`);
  const ok = Array.isArray(data) ? data.filter(x => x && x.t && x.es) : [];
  if (!ok.length) return render();
  startCards(ok, `Verbos ${idx + 1}–${idx + batch.length}`, "fr", true);
  S.sub.advance = idx + batch.length;
}

/* ---------- Abrir prácticas desde el menú ---------- */
function goPractice(arg) {
  const L = S.lang;
  if (arg === "quick") return startDrill(buildWarmupEN(), { title: "Ejercicio express", lang: "en" });
  if (arg === "errors") return startDrill(judgeItems(null, 10), { title: "Encuentra el error", lang: "en" });
  if (arg === "irreg") return startDrill(buildIrreg(10), { title: "Verbos irregulares", lang: "en" });
  if (arg === "phrases") return startCards(EN_PHRASES, "Frases avanzadas", "en", false);
  if (arg === "ai-drill") return genDrillAI();
  if (arg === "ai-phrases") return genPhrasesAI();
  if (arg.startsWith("cat:")) { const c = arg.slice(4); const items = [...enItems(c, 6), ...judgeItems([c], 2)]; return startDrill(shuffle(items.length ? items : buildWarmupEN()), { title: CATS[c], lang: "en" }); }
  if (arg.startsWith("tense:")) return startDrill(buildConj({ verbs: frPool(Math.max(25, conjCfg.size)), tenses: [arg.slice(6)], n: 10 }), { title: FR_CATS[arg.slice(6)], lang: "fr" });
  if (arg === "conj") { const tenses = conjCfg.tenses?.length ? conjCfg.tenses : FR_TENSES_BY_LEVEL[level("fr").k]; return startDrill(buildConj({ verbs: frPool(conjCfg.size), tenses, n: 10 }), { title: "Conjugación", lang: "fr" }); }
  if (arg === "verbs") { stopSay(); S.sub = { kind: "verbs", tab: S.tab, lang: "fr", q: "" }; render(); return scrollTo(0, 0); }
  if (arg === "nums") { S.sub = { kind: "nums", tab: S.tab, lang: "fr", range: "0–20", mode: "say", count: 0, ok: 0, t0: Date.now() }; newNum(); render(); return scrollTo(0, 0); }
  if (arg === "time") { S.sub = { kind: "time", tab: S.tab, lang: "fr", what: "time", mode: "say", count: 0, ok: 0, t0: Date.now() }; newTime(); render(); return scrollTo(0, 0); }
  if (arg === "days") return startCards(FR_DAYS, "Les jours de la semaine", "fr", false);
  if (arg === "months") return startCards(FR_MONTHS, "Les mois de l'année", "fr", false);
  if (arg === "ai-verbs") return genVerbsAI();
  if (arg === "blocks") return startBlocks();
  if (arg === "songs") return startSongs(L);
  if (L) render();
}
