/* ===================== Practicar → Bloques (francés): bloques → escuchar → decirlo tú ===================== */
// Una lección se da por aprendida cuando entiendes y dices al menos 7 de sus 10 frases; si no, se propone repetirla.
const BLK_PASS = 7;
const blkStore = () => (S.progress.blocks ||= {});
const blkLearned = n => { const r = blkStore()[n]; return !!r && r.ear >= BLK_PASS && r.say >= BLK_PASS; };
const blkNext = () => FR_BLOCKS.find(l => !blkLearned(l.n)) || null;
const blkKnown = () => FR_BLOCKS.filter(l => blkLearned(l.n));
const blkItems = l => l.s.map(([fr, es, note]) => ({ fr, es, note: note || "" }));

function startBlocks() { stopSay(); S.sub = { kind: "blocks", tab: S.tab, lang: "fr", stage: "list" }; render(); scrollTo(0, 0); }
function startBlockSession(o) {
  stopSay();
  S.sub = { kind: "blocks", tab: S.tab, lang: "fr", stage: o.stage || "learn", n: o.n || 0, title: o.title, idea: o.idea || "", blocks: o.blocks || [], hunt: o.hunt || [],
    items: o.items, i: 0, shown: false, ear: {}, said: {}, t0: Date.now(), src: o.src || "", fresh: !!o.fresh };
  render(); scrollTo(0, 0);
}
function startBlockLesson(n, src) {
  const l = FR_BLOCKS.find(x => x.n === n); if (!l) return;
  startBlockSession({ n, title: `Lección ${n} · ${l.title}`, idea: l.idea, blocks: l.b, hunt: l.hunt, items: blkItems(l), src });
}
// Repaso acumulado: frases de todas las lecciones aprendidas (o de la primera si aún no hay ninguna)
function startBlockMix(src) {
  const known = blkKnown(), pool = (known.length ? known : FR_BLOCKS.slice(0, 1)).flatMap(blkItems);
  startBlockSession({ stage: "ear", title: "Repaso acumulado", items: shuffle(pool).slice(0, 10), src });
}
function blkWarmup() { const l = blkNext(); return l ? startBlockLesson(l.n, "warmup") : startBlockMix("warmup"); }

function viewBlocks() {
  const d = S.sub;
  if (d.stage === "list") return blkList();
  if (d.stage === "learn") return blkLearn(d);
  return d.i >= d.items.length ? blkDone(d) : blkPhrase(d);
}

function blkList() {
  const nx = blkNext(), known = blkKnown().length, ai = aiOff() ? " · necesita Claude" : "";
  return `<div class="back"><button class="btn quiet small" data-act="back">← Volver</button><span class="tag">${known} de ${FR_BLOCKS.length} aprendidas</span></div>
  <div class="stack"><h1>Francés por bloques</h1>
    <p class="lead">Pocas piezas por lección, ya conjugadas, que se combinan entre sí y se reciclan en cada lección siguiente. Siempre en el mismo orden: <b>escucha los bloques</b>, <b>entiende frases solo de oído</b> y después <b>dilas tú</b>.</p></div>
  <div class="plan">${FR_BLOCKS.map(l => {
    const r = blkStore()[l.n], ok = blkLearned(l.n), isNext = nx && nx.n === l.n;
    const sub = ok ? `Aprendida · entendiste ${r.ear}/10 y dijiste ${r.say}/10` : r ? `Repítela: ${r.ear}/10 de oído y ${r.say}/10 dichas (meta: ${BLK_PASS})` : l.b.slice(0, 3).map(b => b[0].split(" · ")[0]).join(" · ") + " …";
    return `<button class="step${ok ? " done" : ""}${isNext ? " next" : ""}" data-act="blk-open" data-arg="${l.n}"><span class="n">${ok ? "✓" : l.n}</span><span style="min-width:0"><b>${esc(l.title)}</b><small>${esc(sub)}</small></span><span class="min">${isNext ? "Sigue aquí" : ""}</span></button>`;
  }).join("")}</div>
  <div class="menu">
    <button data-act="blk-mix"><span><b>Repaso acumulado</b><small>10 frases al azar de ${known ? "tus lecciones aprendidas" : "la lección 1"} · sin internet</small></span><span class="go">→</span></button>
    <button data-act="blk-ai" ${known ? "" : "disabled"}><span><b>Frases nuevas con tus bloques</b><small>${known ? `10 combinaciones nuevas con lo de ${known === 1 ? "la lección 1" : `las lecciones aprendidas (${known})`}${ai}` : "Se activa al aprender la primera lección"}</small></span><span class="go">→</span></button>
  </div>
  <button class="link" data-act="tip" data-arg="blocks" data-lang="fr">Cómo funciona el método</button>`;
}

function blkLearn(d) {
  return `<div class="back"><button class="btn quiet small" data-act="blk-list">← Lecciones</button><span class="tag">1 de 3 · Bloques</span></div>
  <h1>${esc(d.title)}</h1>
  <p class="why soft">${esc(d.idea)}</p>
  <p class="hint">Toca ▶ en cada bloque y repítelo en voz alta dos veces, imitando la voz.</p>
  <div class="card">${d.blocks.map(([fr, es, pr]) => `<div class="between" style="align-items:flex-start">
      <div style="min-width:0"><p lang="fr"><b>${esc(fr)}</b></p><p class="hint">${esc(es)}${pr ? ` · <i>${esc(pr)}</i>` : ""}</p></div>
      <button class="say" data-act="say" data-say="${esc(fr.replace(/\s*\/\s*/g, ", ").replace(/\s*·\s*/g, ", ").replace(/…/g, ""))}" data-lang="fr" aria-label="Escuchar ${esc(fr)}">▶</button></div>`).join("")}</div>
  <div class="row"><button class="btn quiet" data-act="blk-all">▶ Escuchar todos</button><button class="btn" data-act="blk-stage" data-arg="ear" style="flex:1">Ahora, frases solo de oído →</button></div>`;
}

function blkPhrase(d) {
  const it = d.items[d.i], ear = d.stage === "ear", gs = glossSet(liveCards("fr").filter(c => c.type === "word"));
  const head = `<div class="back"><button class="btn quiet small" data-act="${d.src === "warmup" ? "back" : "blk-list"}">← ${d.src === "warmup" ? "Salir" : "Lecciones"}</button><span class="tag">${ear ? "2 de 3 · Escuchar" : "3 de 3 · Decirlo tú"}</span></div>
    <div class="prog"><i style="width:${(d.i / d.items.length) * 100}%"></i></div>`;
  const reveal = `<p class="t ctx" lang="fr" style="font-family:var(--read);font-size:1.25rem">${wrapWords(md(it.fr), gs)}</p>${ear ? `<p class="es">${esc(it.es)}</p>` : ""}${it.note ? `<p class="note">${md(it.note)}</p>` : ""}`;
  const hunt = ear && d.i === 0 && d.hunt.length ? `<p class="hint">Mientras escuchas, caza estas palabras: ${d.hunt.map(h => `<b lang="fr">${esc(h)}</b>`).join(" · ")}</p>` : "";
  if (ear) return head + `<p class="eyebrow">Frase ${d.i + 1} de ${d.items.length}</p>${hunt}
    <p class="lead">Escucha sin leer. Intenta entenderla entera y tradúcela mentalmente al español.</p>
    <div class="row"><button class="btn" data-act="say" data-say="${esc(it.fr)}" data-lang="fr">▶ Escuchar</button><button class="btn quiet" data-act="blk-slow">▶ Más lento</button></div>
    ${d.shown ? `<div class="card">${reveal}</div>
      <div class="opts" style="grid-template-columns:1fr 1fr"><button class="opt" data-act="blk-ear" data-arg="0">No la entendí</button><button class="opt" data-act="blk-ear" data-arg="1">La entendí</button></div>`
      : `<button class="btn ghost wide" data-act="blk-show">Ver la frase y la traducción</button>`}`;
  return head + `<p class="eyebrow">Frase ${d.i + 1} de ${d.items.length}</p>
    <p class="lead">Dila en voz alta en francés, armándola con los bloques. Después compara.</p>
    <div class="card"><p class="t" style="font-size:1.2rem">${esc(it.es)}</p>${d.shown ? reveal : ""}</div>
    ${d.shown ? `<div class="row"><button class="btn quiet small" data-act="say" data-say="${esc(it.fr)}" data-lang="fr">▶ Escuchar</button><span class="hint">Repítela imitando la voz.</span></div>
      <div class="opts" style="grid-template-columns:1fr 1fr"><button class="opt" data-act="blk-say" data-arg="0">Me costó</button><button class="opt" data-act="blk-say" data-arg="1">Me salió</button></div>`
      : `<button class="btn ghost wide" data-act="blk-show">Así se dice</button>`}`;
}

function blkDone(d) {
  const ear = Object.values(d.ear).filter(Boolean).length, said = Object.values(d.said).filter(Boolean).length, n = d.items.length;
  if (!d.logged) {
    d.logged = true;
    logTime("fr", "practice", Date.now() - d.t0);
    if (d.n) { const prev = blkStore()[d.n]; blkStore()[d.n] = { ear: Math.max(ear, prev?.ear || 0), say: Math.max(said, prev?.say || 0), date: today() }; saveProgress(); }
    if (d.src === "warmup") markDone("warm", "fr");
    if (d.fresh) saveItem({ id: uid(), kind: "cards", lang: "fr", title: d.title, items: d.items.map(x => ({ t: x.fr, es: x.es, note: x.note })), ts: Date.now(), date: today() });
  }
  const hard = d.items.filter((_, i) => !d.ear[i] || !d.said[i]), ok = d.n && blkLearned(d.n), nx = blkNext();
  return `<div class="stack"><p class="eyebrow">${esc(d.title)}</p><h1>Entendiste ${ear} de ${n} y dijiste ${said} de ${n}</h1>
    <p class="lead">${!d.n ? "Repasar lo ya aprendido es lo que lo deja en automático." : ok ? "Lección aprendida. Mañana sigue con la próxima: va a reciclar todo lo de hoy." : `Para pasar a la siguiente necesitas ${BLK_PASS} de 10 en cada parte. Repítela mañana: la segunda vez sale mucho mejor.`}</p></div>
    ${hard.length ? `<div class="panel"><h3>Las que te costaron</h3>${hard.map(x => `<div class="fix"><p class="ft" lang="fr"><b>${esc(x.fr)}</b></p><p class="hint">${esc(x.es)}</p></div>`).join("")}</div>
      <button class="btn ghost wide" data-act="blk-save">Guardar ${hard.length === 1 ? "esta frase" : `estas ${hard.length} frases`} para el repaso diario</button>` : ""}
    <div class="row">${d.n ? `<button class="btn quiet" data-act="blk-open" data-arg="${d.n}">Repetir la lección</button>` : ""}
      ${d.src !== "warmup" && ok && nx ? `<button class="btn" data-act="blk-open" data-arg="${nx.n}" style="flex:1">Lección ${nx.n} →</button>` : ""}</div>
    <button class="btn ${hard.length ? "quiet" : ""} wide" data-act="${d.src === "warmup" ? "back" : "blk-list"}">${d.src === "warmup" ? "Volver a Hoy" : "Volver a las lecciones"}</button>`;
}

// Al calificar una frase se avanza y, en la parte de escuchar, la siguiente suena sola
function blkGrade(part, ok) {
  const d = S.sub; d[part][d.i] = ok; d.i++; d.shown = false; stopSay();
  if (part === "ear" && d.i >= d.items.length) { d.stage = "say"; d.i = 0; }
  render(); scrollTo(0, 0);
  if (d.stage === "ear" && d.items[d.i]) say(d.items[d.i].fr, "fr");
}
function blkStage(stage) {
  const d = S.sub; d.stage = stage; d.i = 0; d.shown = false; stopSay(); render(); scrollTo(0, 0);
  if (stage === "ear" && d.items[0]) say(d.items[0].fr, "fr");
}
function blkSaveHard(btn) {
  const d = S.sub; let k = 0;
  for (let i = 0; i < d.items.length; i++) if (!d.ear[i] || !d.said[i]) { const x = d.items[i]; if (addCard({ lang: "fr", type: "phrase", t: x.fr, es: x.es, note: x.note, src: d.title }, true)) k++; }
  toast(k ? `${k} guardadas para tu repaso diario` : "Ya estaban en tus tarjetas"); updateBadge();
  if (btn) { btn.disabled = true; btn.textContent = "Guardadas"; }
}

// Frases nuevas con IA usando solo los bloques que ya aprendiste
async function genBlocksAI() {
  const known = blkKnown(); if (!known.length) return;
  const blocks = known.flatMap(l => l.b.map(b => `${b[0]} (${b[1]})`)).join("; ");
  const data = await genJSON(`Pour un hispanophone débutant qui apprend le français avec la méthode des « blocs ». ${levelLine("fr")}
Voici TOUS les blocs qu'il connaît (leçons 1 à ${known.at(-1).n}) : ${blocks}.
Écris 10 phrases NOUVELLES, courtes et utiles au quotidien, en combinant ces blocs : verbe-clé conjugué + infinitif (je veux / je peux / je dois / je vais + verbe), pronom avant l'infinitif (je veux le voir), ne … pas autour du verbe, questions par simple intonation. Mélange les blocs de plusieurs leçons. N'utilise que ces blocs et des mots très fréquents ou transparents pour un hispanophone. Varie les personnes (je, tu, il, elle, on). Thèmes possibles, en version très simple : ${themeHint()}. Graine : ${uid()}.
Réponds UNIQUEMENT avec un tableau JSON de 10 objets : {"fr": phrase en français, "es": traducción natural al español de Chile, "note": EN ESPAÑOL, una frase corta: qué bloques combina y un truco}.`, "Combinando tus bloques en frases nuevas…");
  const ok = Array.isArray(data) ? data.filter(x => x && typeof x.fr === "string" && typeof x.es === "string").map(x => ({ fr: x.fr, es: x.es, note: String(x.note || "") })) : [];
  if (ok.length) startBlockSession({ stage: "ear", title: "Frases nuevas con tus bloques", items: ok, fresh: true });
  else render();
}
