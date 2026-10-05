/* ===================== Biblioteca: guardado · tarjetas · progreso · guía · ajustes ===================== */
function viewBiblioteca() {
  const segs = [["guardado", "Guardado"], ["tarjetas", "Tarjetas"], ["progreso", "Progreso"], ["guia", "Guía"], ["ajustes", "Ajustes"]];
  const body = { guardado: libGuardado, tarjetas: libTarjetas, progreso: libProgreso, guia: libGuia, ajustes: libAjustes }[S.libSeg] || libGuardado;
  return `<div class="chips" role="group" aria-label="Secciones de la biblioteca">${segs.map(([k, t]) => `<button class="chip" data-act="lib-seg" data-arg="${k}" aria-pressed="${S.libSeg === k}">${t}</button>`).join("")}</div>${body()}`;
}
const delRow = (id, label) => `<div class="mrow"><span style="min-width:0"><b>¿Eliminar «${esc(label)}»?</b><small>No se puede deshacer.</small></span><span class="confirm"><button class="btn quiet small" data-act="del-no">No</button><button class="btn bad small" data-act="del-yes" data-arg="${esc(id)}">Eliminar</button></span></div>`;

function libGuardado() {
  const L = S.lang, list = S.items.filter(x => x.lang === L), K = { reading: "Lectura", drill: "Ejercicios", cards: "Frases" };
  const nRead = list.filter(x => x.kind === "reading").length;
  const row = x => S.delAsk === x.id ? delRow(x.id, x.title) : `<div class="mrow">
    <button data-act="open-item" data-arg="${esc(x.id)}" style="flex:1;min-width:0;display:flex;justify-content:space-between;align-items:center;gap:10px;text-align:left">
      <span style="min-width:0"><b>${esc(x.title)}</b><small>${K[x.kind] || ""}${x.min ? " · " + x.min + " min" : ""}${x.kind === "reading" ? (x.reads ? ` · leída ${x.reads} ${x.reads === 1 ? "vez" : "veces"}` : " · sin leer") : ""} · ${esc(x.date || "")}</small></span><span class="go">→</span></button>
    <button class="del" data-act="del-ask" data-arg="${esc(x.id)}" aria-label="Eliminar ${esc(x.title)}">×</button></div>`;
  return `<div class="stack"><h1>Tu material guardado</h1><p class="lead">Todo lo que terminas queda aquí${S.db ? " y se sincroniza entre tu teléfono y tu tablet" : ""}. Releer es de lo más efectivo que puedes hacer.</p></div>
  ${list.length ? `<div class="menu">${list.map(row).join("")}</div>` : `<p class="empty">Aún no hay nada guardado en ${LANG_NAME[L]}.<br>Termina una lectura o una práctica y aparecerá aquí.</p>`}
  <div class="panel"><h3>Para leer sin conexión</h3>
    <p class="hint">Con la app abierta, tus textos guardados funcionan sin internet. Para un viaje largo, descarga un archivo con todas tus lecturas en ${LANG_NAME[L]}: se abre en el teléfono aunque no tengas señal, con el español de cada párrafo, el vocabulario y «Así se dice».</p>
    ${S.downloads ? `<button class="btn ghost wide" data-act="dl-offline" ${nRead ? "" : "disabled"}>Descargar lecturas en ${LANG_NAME[L]} (${nRead})</button>` : `<p class="hint">La descarga funciona al abrir la app dentro de Claude.</p>`}</div>`;
}

function cardRows(L) {
  const q = stripAcc((S.cardQ || "").toLowerCase()), now = Date.now();
  const list = liveCards(L).filter(c => !q || stripAcc(`${c.t} ${c.es} ${c.bad}`.toLowerCase()).includes(q)).sort((a, b) => (b.created || 0) - (a.created || 0)).slice(0, 120);
  if (!list.length) return `<p class="empty">${S.cardQ ? "Sin resultados" : "Aún no tienes tarjetas en " + LANG_NAME[L]}</p>`;
  return `<div class="menu">${list.map(c => {
    const id = "card:" + c.id, when = isNewCard(c) ? "nueva" : c.due <= now ? "para hoy" : "vuelve en " + ivlLabel((c.due - now) / DAY);
    const kind = { word: "palabra", phrase: "frase", fix: "corrección" }[c.type];
    return S.delAsk === id ? delRow(id, c.t) : `<div class="mrow"><span style="min-width:0"><b lang="${L}">${esc(c.t)}</b><small>${esc(c.type === "fix" ? "en vez de: " + c.bad : c.es)} · ${kind} · ${when}</small></span><button class="del" data-act="del-ask" data-arg="${esc(id)}" aria-label="Eliminar tarjeta">×</button></div>`;
  }).join("")}</div>`;
}
function libTarjetas() {
  const L = S.lang, st = cardStats(L), due = dueCount(L);
  return `<div class="stack"><h1>Tus tarjetas de repaso</h1><p class="lead">Palabras, frases y correcciones que guardaste. Vuelven en tu repaso justo antes de que las olvides: así pasan a la memoria de largo plazo.</p></div>
  <div class="stats"><div class="stat"><b>${st.nuevas}</b><span>nuevas</span></div><div class="stat"><b>${st.aprendiendo}</b><span>aprendiendo</span></div><div class="stat"><b>${st.dominadas}</b><span>dominadas (3+ semanas)</span></div></div>
  <button class="btn wide" data-act="review" ${due ? "" : "disabled"}>${due ? `Repasar ahora (${due})` : "Sin tarjetas pendientes hoy"}</button>
  ${st.total ? `<input type="search" id="card-q" placeholder="Buscar en tus tarjetas" value="${esc(S.cardQ || "")}">` : ""}
  <div id="card-list">${cardRows(L)}</div>
  <p class="hint">Para agregar: toca una palabra en cualquier texto y elige «Guardar para repasar», o guarda frases de «Así se dice», de «Quiero decir» y de tus correcciones.</p>`;
}

function libProgreso() {
  const L = S.lang, st = S.progress.stats[L] || {}, k = st.kinds || {}, all = (S.progress.stats.en?.min || 0) + (S.progress.stats.fr?.min || 0);
  const w = S.progress.wpm[L] || [], wpm = w.length ? Math.round(w.slice(-5).reduce((a, x) => a + x.wpm, 0) / Math.min(5, w.length)) : 0;
  const keys = L === "en" ? Object.keys(CATS) : Object.keys(FR_CATS);
  const meters = weakOrder(keys, L).map(x => `<div class="meter"><span>${esc(L === "en" ? CATS[x.k] : FR_CATS[x.k])}</span><div class="prog"><i style="width:${x.n ? Math.round(x.acc * 100) : 0}%"></i></div><span>${x.n ? Math.round(x.acc * 100) + "%" : "—"}</span></div>`).join("");
  const errs = Object.entries(S.progress.errors[L] || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const cs = cardStats(L);
  return `<div class="stack"><h1>Tu progreso</h1><p class="lead">Constancia, precisión y fluidez en ${LANG_NAME[L]}.</p></div>
  <div class="stats">
    <div class="stat"><b>${streak()}</b><span>días seguidos</span></div>
    <div class="stat"><b>${fmtMin(all)}</b><span>minutos en total</span></div>
    <div class="stat"><b>${wpm || "—"}</b><span>palabras por minuto leyendo</span></div>
  </div>
  <div class="panel"><div class="between"><h3>Últimos 14 días</h3>${chartLegend()}</div>${weekChart(14)}</div>
  <div class="panel"><h3>Precisión por ${L === "en" ? "estructura" : "tiempo verbal"}</h3>${meters}</div>
  <div class="panel"><h3>Errores frecuentes al hablar</h3>${errs.length ? errs.map(([c, n]) => `<div class="between"><span>${esc(errLabel(L, c))}</span><span class="row" style="gap:8px"><span class="hint">${n}×</span>${tipFor(L, c) ? `<button class="link" data-act="tip" data-arg="${esc(c)}">Ver la regla</button>` : ""}</span></div>`).join("") : `<p class="hint">Aún no hay datos. Usa «Corrígeme» o «Habla 1 minuto» y aquí verás qué errores se repiten.</p>`}</div>
  <div class="panel"><h3>Actividad en ${LANG_NAME[L]}</h3>
    <div class="between"><span>Lecturas terminadas</span><b>${st.readings || 0}</b></div>
    <div class="between"><span>Sesiones de repaso</span><b>${k.review || 0}</b></div>
    <div class="between"><span>Ejercicios</span><b>${k.practice || 0}</b></div>
    <div class="between"><span>Prácticas de habla</span><b>${k.speak || 0}</b></div>
    <div class="between"><span>Tarjetas (nuevas · aprendiendo · dominadas)</span><b>${cs.nuevas} · ${cs.aprendiendo} · ${cs.dominadas}</b></div></div>`;
}

const tipSay = e => e.replace(/\(.*?\)|‿/g, "").replace(/·.*$/, "").replace(/→.*$/, "");
function tipHtml([t, body, exs], lang) {
  return `<details class="tipx"><summary>${esc(t)}</summary><div class="body"><p>${esc(body)}</p>
    ${exs.map(e => `<p class="ex rp" style="font-size:1.05rem"><span lang="${lang}">${md(e)}</span><button class="say" data-act="say" data-say="${esc(tipSay(e))}" data-lang="${lang}" aria-label="Escuchar">▶</button></p>`).join("")}</div></details>`;
}
function libGuia() {
  const L = S.lang;
  return `<div class="stack"><h1>${L === "en" ? "Entiende el porqué" : "Las reglas que más rinden"}</h1><p class="lead">Explicaciones cortas para leer antes o después de practicar. Toca ▶ en los ejemplos para oírlos.</p></div>
  ${Object.entries(TIPS[L]).map(([sec, tips]) => `<div class="stack"><h3>${esc(sec)}</h3>${tips.map(t => tipHtml(t, L)).join("")}</div>`).join("")}
  <div class="panel"><h3>Pregúntale a tu tutor</h3>
    <textarea id="ask" lang="es" placeholder="${L === "en" ? "Ej: ¿Cuál es la diferencia entre «I have been working» e «I have worked»?" : "Ej: ¿Cuándo uso être y cuándo avoir en el passé composé?"}">${esc(S.askQ || "")}</textarea>
    <button class="btn" data-act="ask-tutor" ${aiOff() ? "disabled" : ""}>Preguntar</button>${aiNote()}
    <div class="answer" id="answer">${md(S.askA || "")}</div></div>`;
}
function showTip(lang, cat) {
  const tip = tipFor(lang, cat); if (!tip) return;
  S.sheet = { tip: true, lang };
  $("#sheet-in").innerHTML = `<div class="sheet-head"><div class="term" style="font-size:1.15rem">${esc(tip[0])}</div><button class="x" data-act="sheet-close" aria-label="Cerrar">×</button></div>
    <p>${esc(tip[1])}</p>${tip[2].map(e => `<p class="ex rp"><span lang="${lang}">${md(e)}</span><button class="say" data-act="say" data-say="${esc(tipSay(e))}" data-lang="${lang}" aria-label="Escuchar">▶</button></p>`).join("")}`;
  $("#sheet").hidden = false;
}
async function askTutor() {
  const q = ($("#ask")?.value || "").trim();
  if (!q) return toast("Escribe tu pregunta");
  if (!canAI()) return;
  S.busy = true; S.askQ = q;
  const out = $("#answer"), btn = $('[data-act="ask-tutor"]'); if (btn) btn.disabled = true;
  out.textContent = "Pensando…";
  try {
    const r = await S.sample(`Eres un profesor experto de ${S.lang === "en" ? `inglés. El alumno es hispanohablante. ${levelLine("en")}` : `francés. El alumno es hispanohablante. ${levelLine("fr")}`} Responde EN ESPAÑOL, breve y claro (máximo 150 palabras): la regla en una frase, 3 ejemplos con traducción, un truco para recordarla y una nota de pronunciación si aplica. Sin títulos. Pregunta: ${q}`,
      { onText: ({ text }) => { if (out.isConnected) out.innerHTML = md(text); } });
    S.askA = r.text;
  } catch (e) { out.textContent = errMsg(e); }
  S.busy = false; if (btn) btn.disabled = false;
}

function libAjustes() {
  const goal = S.progress.goal || 15, npd = S.progress.newPerDay || 15;
  const vsel = L => { const vs = TTS.list(L), cur = TTS.voice(L);
    return vs.length ? `<select id="voice-${L}" data-lang="${L}" aria-label="Voz en ${LANG_NAME[L]}">${vs.slice().sort((a, b) => TTS.score(b, L) - TTS.score(a, L)).map(v => `<option value="${esc(v.voiceURI)}" ${cur && v.voiceURI === cur.voiceURI ? "selected" : ""}>${esc(v.name)} · ${esc(v.lang)}</option>`).join("")}</select>`
      : `<p class="hint">No encontré voces en ${LANG_NAME[L]} en este dispositivo.</p>`; };
  return `<div class="stack"><h1>Ajustes</h1><p class="lead">Se guardan para tus dos dispositivos, salvo la voz, que depende de cada uno.</p></div>
  <div class="panel">
    <div class="setrow"><h3>Meta diaria</h3><div class="chips">${[10, 15, 20, 30].map(n => `<button class="chip" data-act="goal" data-arg="${n}" aria-pressed="${goal === n}">${n} min</button>`).join("")}</div><p class="hint">Minutos por día sumando los dos idiomas. Mejor poco todos los días que mucho una vez a la semana.</p></div>
    <div class="setrow"><h3>Tarjetas nuevas por día</h3><div class="chips">${[5, 10, 15, 20, 30].map(n => `<button class="chip" data-act="newpd" data-arg="${n}" aria-pressed="${npd === n}">${n}</button>`).join("")}</div><p class="hint">Más tarjetas nuevas significa más repasos los días siguientes.</p></div>
    ${["en", "fr"].map(L => `<div class="setrow"><h3>Voz en ${LANG_NAME[L]}</h3>${vsel(L)}
      <label class="hint" for="rate-${L}">Velocidad: <b id="rate-v-${L}">${TTS.rate(L).toFixed(2)}×</b></label>
      <input type="range" id="rate-${L}" data-lang="${L}" min="0.6" max="1.2" step="0.05" value="${TTS.rate(L)}">
      <div><button class="btn quiet small" data-act="test-voice" data-arg="${L}">▶ Probar</button></div></div>`).join("")}
    <div class="setrow"><h3>Para que la voz suene más natural</h3><p class="hint">iPhone: Ajustes → Accesibilidad → Contenido leído → Voces. Descarga una voz «mejorada» en inglés y otra en francés (por ejemplo Samantha y Amélie) y elígelas aquí. Android: Ajustes → Texto a voz → instala los datos de voz de inglés y francés.</p></div>
    ${window.vpAccount ? vpAccount.row() : ""}
  </div>`;
}

/* ---------- Abrir algo guardado ---------- */
function openItem(id) {
  const x = S.items.find(i => i.id === id); if (!x) return;
  stopSay();
  if (x.kind === "reading") { S.reading = { ...x, saved: true, showTr: false, open: {}, tr: x.tr || {}, quiz: {}, startedAt: Date.now() }; S.lang = x.lang; LS.set("lang", x.lang); S.tab = "leer"; render(); }
  else if (x.kind === "drill") { S.tab = "practicar"; startDrill(x.items, { title: x.title.replace(/ · \d+\/\d+$/, ""), lang: x.lang }); }
  else { S.tab = "practicar"; startCards(x.items, x.title, x.lang, false); }
  scrollTo(0, 0);
}

/* ---------- Archivo HTML autónomo para leer sin conexión ---------- */
function buildOfflineHtml(lang) {
  const items = S.items.filter(x => x.kind === "reading" && x.lang === lang);
  const name = LANG_NAME[lang];
  const art = items.map((x, n) => {
    const d = parseDoc(x.text), tr = x.tr || {};
    return `<article id="r${n}"><p class="meta">${esc([x.level, x.min ? x.min + " min" : "", x.topic].filter(Boolean).join(" · "))}</p><h2>${esc(d.title || x.title)}</h2>
${d.paras.map((p, i) => `<p class="p">${md(p.t)}</p>${p.es || tr[i] ? `<details class="es"><summary>Ver en español</summary><p>${esc(p.es || tr[i])}</p></details>` : ""}`).join("\n")}
${d.quiz.length ? `<section><h3>Comprueba que entendiste</h3>${d.quiz.map((q, qi) => `<details class="say"><summary>${qi + 1}. ${md(q.q)}</summary>${q.opts.map((o, oi) => `<p class="n">${oi === q.a ? "✓ " : "· "}${md(o)}</p>`).join("")}</details>`).join("")}</section>` : ""}
${d.say.length ? `<section><h3>Quiero decir… así se dice</h3>${d.say.map(s => `<details class="say"><summary>${esc(s.es)}</summary><p class="t">${esc(s.t)}</p>${s.note ? `<p class="n">${md(s.note)}</p>` : ""}</details>`).join("")}</section>` : ""}
${d.gloss.length ? `<section><h3>Vocabulario</h3><dl>${d.gloss.map(g => `<dt>${esc(g.t)}</dt><dd>${esc(g.es)}${g.pron ? ` · <i>${esc(g.pron)}</i>` : ""}</dd>`).join("")}</dl></section>` : ""}
${d.notes.map(nt => `<section><h3>${esc(nt.h)}</h3><ul>${nt.items.map(i => `<li>${md(i)}</li>`).join("")}</ul></section>`).join("")}
${d.retell ? `<section><h3>Cuéntalo tú</h3><p class="n">${md(d.retell)}</p></section>` : ""}
<p class="top"><a href="#indice">↑ Volver al índice</a></p></article>`;
  }).join("\n");
  const ac = lang === "en" ? ["#2D5876", "#86AECB"] : ["#963E34", "#D98A7C"];
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Voz Propia · Lecturas en ${name}</title>
<style>
:root{--bg:#E8E9E5;--s:#F6F6F2;--ink:#1F2933;--mu:#5B6570;--li:#D0D3CD;--ac:${ac[0]}}
@media (prefers-color-scheme:dark){:root{--bg:#151B21;--s:#1D252D;--ink:#E7E5DF;--mu:#9AA3AB;--li:#2E3842;--ac:${ac[1]}}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.7 Georgia,"Times New Roman",serif;padding:16px}
main{max-width:680px;margin:0 auto}h1{font-size:1.6rem;line-height:1.2;margin:.2em 0}h2{font-size:1.45rem;line-height:1.25;margin:.1em 0 .6em}
h3{font:700 .75rem/1.4 system-ui,sans-serif;letter-spacing:.09em;text-transform:uppercase;color:var(--mu);margin:1.6em 0 .6em}
.meta,.sub{font:.85rem system-ui,sans-serif;color:var(--mu);margin:0}.p{margin:.9em 0 .3em;font-size:1.12rem}.p strong{color:var(--ac);font-weight:600}
details{font-family:system-ui,sans-serif}details.es summary{font-size:.8rem;color:var(--ac);cursor:pointer;margin-bottom:.3em}
details.es p{margin:0 0 .6em;padding-left:12px;border-left:3px solid var(--ac);color:var(--mu);font-size:.97rem}
details.say{background:var(--s);border:1px solid var(--li);border-radius:10px;padding:10px 12px;margin:8px 0}
details.say summary{cursor:pointer}details.say .t{font:600 1.08rem/1.5 Georgia,serif;color:var(--ac);margin:.5em 0 .2em}.n{font-size:.92rem;color:var(--mu);margin:.2em 0}
dl{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);gap:6px 14px;font:.95rem/1.45 system-ui,sans-serif;margin:0}dt{font-weight:700;color:var(--ac)}dd{margin:0;color:var(--mu)}
ul{font:.95rem/1.55 system-ui,sans-serif;padding-left:18px}li{margin:.35em 0}li strong{color:var(--ac)}
article{background:var(--s);border:1px solid var(--li);border-radius:14px;padding:18px 16px;margin:18px 0}
nav a,.top a{color:var(--ac)}nav ol{font:1rem/1.9 system-ui,sans-serif;padding-left:22px}.top{font:.9rem system-ui,sans-serif;margin:1.4em 0 0}
.cerro{display:flex;gap:2px;height:6px;margin:6px 0 14px}.cerro i{flex:1}
</style></head><body><main>
<div class="cerro">${"#2D5876,#C4943A,#963E34,#5E8A74,#8B7AA0,#7FA3BA,#C98468".split(",").concat("#2D5876,#C4943A,#963E34,#5E8A74,#8B7AA0,#7FA3BA,#C98468".split(",")).map(c => `<i style="background:${c}"></i>`).join("")}</div>
<header id="indice"><h1>Lecturas en ${name}</h1><p class="sub">${items.length} lecturas · descargado el ${today()} · funciona sin internet. Toca «Ver en español» bajo cada párrafo.</p>
<nav><ol>${items.map((x, n) => `<li><a href="#r${n}">${esc(parseDoc(x.text).title || x.title)}</a></li>`).join("")}</ol></nav></header>
${art}
</main></body></html>`;
}
async function downloadOffline() {
  const lang = S.lang;
  if (!S.items.some(x => x.kind === "reading" && x.lang === lang)) return toast("Aún no hay lecturas guardadas en este idioma");
  try {
    await S.downloads.save({ filename: `voz-propia-lecturas-${lang === "en" ? "ingles" : "frances"}-${today()}.html`, data: buildOfflineHtml(lang) });
    toast("Archivo listo para leer sin conexión");
  } catch (e) {
    if (e?.code === "declined") return;
    toast(e?.code === "rate_limited" ? "Ya hay una descarga pendiente. Revisa la ventana abierta." : "No se pudo descargar el archivo aquí.");
  }
}
