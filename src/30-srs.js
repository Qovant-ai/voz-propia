/* ===================== Repaso espaciado (tarjetas) ===================== */
// Tipos: word (palabra → significado) · phrase (español → cómo se dice) · fix (frase con error → corrección)
const cardId = (lang, type, key) => lang + "-" + type + "-" + hash(String(key).toLowerCase().replace(/\s+/g, " ").trim());
function addCard(c, silent) {
  const t = String(c.t || "").trim();
  if (!t) return false;
  const id = cardId(c.lang, c.type, c.type === "fix" ? (c.bad || t) : t);
  const ex = S.cards.find(x => x.id === id);
  if (ex && !ex.off) { if (!silent) toast("Ya está en tus tarjetas"); return false; }
  const now = Date.now();
  const card = { id, lang: c.lang, type: c.type, t, es: c.es || "", note: c.note || "", pron: c.pron || "", ctx: c.ctx || "", bad: c.bad || "", src: c.src || "", created: now, due: now, ivl: 0, ease: 2.5, reps: 0, lapses: 0, last: 0, off: false };
  if (ex) Object.assign(ex, card); else S.cards.push(card);
  persistCard(ex || card);
  if (!silent) toast(c.type === "word" ? "Palabra guardada para repasar" : "Guardada para repasar");
  updateBadge();
  return true;
}
function persistCard(c) {
  c.upd = Date.now();
  LS.set("cards", S.cards);
  if (S.db) { const v = clone(c); queue(() => S.db.doc("cards/" + c.id).set(v)); }
}
function removeCard(id) { const c = S.cards.find(x => x.id === id); if (!c) return; c.off = true; persistCard(c); updateBadge(); }
const isNewCard = c => !c.last;
const liveCards = lang => S.cards.filter(c => c.lang === lang && !c.off);
function queueFor(lang) {
  const now = Date.now(), t = todayState(), all = liveCards(lang);
  const rev = all.filter(c => !isNewCard(c) && c.due <= now).sort((a, b) => a.due - b.due);
  const left = Math.max(0, (S.progress.newPerDay || 15) - (t.newSeen[lang] || 0));
  const fresh = all.filter(isNewCard).sort((a, b) => a.created - b.created).slice(0, left);
  return { rev, fresh, ids: [...rev, ...fresh].map(c => c.id) };
}
const dueCount = lang => queueFor(lang).ids.length;
function cardStats(lang) {
  const all = liveCards(lang);
  return { total: all.length, nuevas: all.filter(isNewCard).length, aprendiendo: all.filter(c => !isNewCard(c) && c.ivl < 21).length, dominadas: all.filter(c => c.ivl >= 21).length };
}
// Algoritmo simple tipo SM-2: g = 0 otra vez · 1 difícil · 2 bien · 3 fácil
function nextState(c, g) {
  let { ease = 2.5, ivl = 0, reps = 0, lapses = 0 } = c;
  if (g === 0) return { ease: Math.max(1.3, ease - 0.2), ivl: 0, reps: 0, lapses: lapses + (reps > 0 ? 1 : 0), dueIn: 10 / 1440 };
  let n = reps === 0 ? [0, 0.5, 1, 3][g] : g === 1 ? Math.max(1, ivl * 1.2) : g === 2 ? Math.max(ivl + 1, ivl * ease) : Math.max(ivl + 2, ivl * ease * 1.3);
  ease = g === 1 ? Math.max(1.3, ease - 0.15) : g === 3 ? ease + 0.15 : ease;
  n = Math.min(n, 365);
  return { ease, ivl: n, reps: reps + 1, lapses, dueIn: n };
}
function ivlLabel(days) {
  if (days < 1 / 24) return "10 min";
  if (days < 1) return Math.round(days * 24) + " h";
  if (days < 30) return Math.round(days) + " d";
  if (days < 365) return Math.round(days / 30) + " mes";
  return Math.round(days / 365) + " año";
}
function schedule(c, g) {
  const s = nextState(c, g), now = Date.now(), wasNew = isNewCard(c);
  Object.assign(c, { ease: s.ease, ivl: s.ivl, reps: s.reps, lapses: s.lapses, due: now + s.dueIn * DAY, last: now });
  persistCard(c);
  if (wasNew) { const t = todayState(); t.newSeen[c.lang] = (t.newSeen[c.lang] || 0) + 1; saveProgress(); }
}
function updateBadge() {
  const b = $("#badge-hoy"); if (!b) return;
  const n = dueCount(S.lang);
  b.hidden = !n; b.textContent = n > 99 ? "99+" : String(n);
}

/* ---------- Sesión de repaso ---------- */
function startReview(lang = S.lang) {
  const q = queueFor(lang);
  if (!q.ids.length) {
    toast(liveCards(lang).length ? "No tienes tarjetas pendientes. ¡Estás al día!" : "Aún no tienes tarjetas: toca palabras al leer y guárdalas");
    if (liveCards(lang).length) { markDone("review", lang); render(); }
    return;
  }
  stopSay();
  S.sub = { kind: "review", tab: S.tab, lang, queue: q.ids.slice(0, 40), i: 0, shown: false, done: 0, again: 0, t0: Date.now() };
  render(); scrollTo(0, 0);
}
function hiCtx(ctx, term) {
  const e = esc(ctx), t = esc(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  try { return e.replace(new RegExp("(" + t + ")", "i"), "<b>$1</b>"); } catch { return e; }
}
function viewReview() {
  const s = S.sub;
  if (s.i >= s.queue.length) {
    if (!s.logged) { s.logged = true; logTime(s.lang, "review", Date.now() - s.t0); markDone("review", s.lang); updateBadge(); }
    const left = dueCount(s.lang);
    return `<div class="stack"><p class="eyebrow">Repaso terminado</p><h1>${s.done} ${s.done === 1 ? "tarjeta repasada" : "tarjetas repasadas"}</h1>
      <p class="lead">${s.again ? (s.again === 1 ? "Una tarjeta te costó y volverá pronto." : `${s.again} tarjetas te costaron y volverán pronto.`) + " Es normal: así se fijan." : "Todo salió bien. Las tarjetas volverán en unos días."}</p>
      ${left ? `<button class="btn ghost" data-act="review-more">Seguir con ${left} más</button>` : ""}
      <button class="btn" data-act="back">Volver</button></div>`;
  }
  const c = S.cards.find(x => x.id === s.queue[s.i]);
  if (!c) { s.i++; return viewReview(); }
  const kind = { word: "Palabra", phrase: "Quiero decir…", fix: "Corrige la frase" }[c.type] || "Tarjeta";
  const front = c.type === "word"
    ? `<div class="front">${esc(c.t)}</div>${c.ctx ? `<p class="ctx">${hiCtx(c.ctx, c.t)}</p>` : ""}<button class="say" data-act="say" data-say="${esc(c.t)}" data-lang="${c.lang}" aria-label="Escuchar">▶</button>`
    : c.type === "phrase" ? `<div class="front">${esc(c.es)}</div><p class="hint">Dilo en voz alta en ${LANG_NAME[c.lang]} antes de mirar.</p>`
    : `<div class="front" lang="${c.lang}">${esc(c.bad)}</div><p class="hint">Di la versión correcta en voz alta.</p>`;
  const back = c.type === "word"
    ? `<p class="meaning">${esc(c.es)}</p>${c.pron ? `<p class="hint"><i>${esc(c.pron)}</i></p>` : ""}${c.note ? `<p class="hint">${esc(c.note)}</p>` : ""}`
    : `<p class="t" style="font-family:var(--read);font-size:1.25rem" lang="${c.lang}">${md(c.t)}</p>
       <button class="btn quiet small" data-act="say" data-say="${esc(c.t)}" data-lang="${c.lang}">▶ Escuchar</button>${c.note ? `<p class="hint">${md(c.note)}</p>` : ""}`;
  const g = [0, 1, 2, 3].map(x => ivlLabel(nextState(c, x).dueIn));
  return `<div class="back"><button class="btn quiet small" data-act="back">← Salir</button><span class="tag">${s.i + 1} de ${s.queue.length}</span></div>
  <div class="prog"><i style="width:${(s.i / s.queue.length) * 100}%"></i></div>
  <div class="card flash"><span class="kind">${kind}</span>${front}
    ${s.shown ? `<div class="backside">${back}</div>` : ""}
  </div>
  ${s.shown
    ? `<div class="grades" role="group" aria-label="¿Qué tal te salió?">
        <button class="g0" data-act="grade" data-arg="0">Otra vez<small>${g[0]}</small></button>
        <button data-act="grade" data-arg="1">Difícil<small>${g[1]}</small></button>
        <button class="g2" data-act="grade" data-arg="2">Bien<small>${g[2]}</small></button>
        <button data-act="grade" data-arg="3">Fácil<small>${g[3]}</small></button></div>`
    : `<button class="btn wide" data-act="show-card">Mostrar respuesta</button>`}`;
}
function gradeCard(g) {
  const s = S.sub, c = S.cards.find(x => x.id === s.queue[s.i]);
  if (!c) return;
  schedule(c, g);
  s.done++;
  if (g === 0) { s.again++; s.queue.splice(Math.min(s.i + 4, s.queue.length), 0, c.id); }
  s.i++; s.shown = false;
  stopSay(); render();
}
