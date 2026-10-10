/* ===================== Hoy: plan del día, meta y semana ===================== */
function greet() {
  const h = new Date().getHours(), n = userName();
  return (h < 12 ? "Buenos días" : h < 20 ? "Buenas tardes" : "Buenas noches") + (n ? ", " + esc(n) : "");
}
function ring(mins, goal) {
  const r = 38, C = 2 * Math.PI * r, f = Math.min(1, mins / goal), done = mins >= goal;
  return `<div class="ring" role="img" aria-label="${fmtMin(mins)} de ${goal} minutos hoy">
    <svg viewBox="0 0 92 92"><circle cx="46" cy="46" r="${r}" fill="none" stroke="color-mix(in srgb,var(--accent) 16%,var(--surface))" stroke-width="9"/>
    ${f > 0 ? `<circle cx="46" cy="46" r="${r}" fill="none" stroke="${done ? "var(--good)" : "var(--accent)"}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${(C * f).toFixed(1)} ${C.toFixed(1)}"/>` : ""}</svg>
    <div class="rv"><div><b>${fmtMin(mins)}</b><span>de ${goal} min</span></div></div></div>`;
}
const dayNum = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / DAY);
function speakBank(lang) { return lang === "en" ? EN_SPEAK : FR_SPEAK[levelIdx("fr") >= 3 ? "B" : "A"]; }
function todayPrompt(lang) {
  const bank = speakBank(lang), off = (S.speakOff?.[lang] || 0);
  if (S.customPrompt?.[lang]) return S.customPrompt[lang];
  return bank[(dayNum() + off) % bank.length];
}
// Lectura sugerida: una guardada sin leer, luego una para releer, luego una nueva
function readSuggestion(lang) {
  const draft = LS.get("draft:" + lang, null);
  if (draft?.text) return { kind: "draft", title: "Continúa tu lectura", sub: titleOf(draft.text), min: draft.min || 5 };
  const rs = S.items.filter(x => x.kind === "reading" && x.lang === lang);
  const unread = rs.filter(x => !x.reads).sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];
  if (unread) return { kind: "item", id: unread.id, title: "Lee un texto guardado", sub: unread.title, min: unread.min || 5 };
  const reread = rs.filter(x => x.reads === 1 && (Date.now() - (x.lastRead || x.ts || 0)) < 21 * DAY && (Date.now() - (x.lastRead || x.ts || 0)) > 0.5 * DAY).sort((a, b) => (a.lastRead || a.ts || 0) - (b.lastRead || b.ts || 0))[0];
  if (reread) return { kind: "item", id: reread.id, title: "Relee un texto (2.ª vez)", sub: reread.title + " · releer da fluidez", min: reread.min || 5 };
  return { kind: "new", title: `Lectura nueva de ${pickSt.min} min`, sub: "Tema: " + (pickSt.topic || SURPRISE), min: pickSt.min };
}
// En francés inicial (A1, A1+) el calentamiento es la lección de bloques que toca; si ya están todas, el repaso acumulado
const blkPlan = L => L === "fr" && levelIdx("fr") <= 1 ? { l: blkNext() } : null;
function planSteps(L) {
  const nDue = dueCount(L), has = liveCards(L).length > 0;
  const w = L === "en" ? CATS[weakOrder(Object.keys(CATS), "en")[0].k] : FR_TENSES_BY_LEVEL[level("fr").k].map(t => FR_CATS[t]).join(", ");
  const rd = readSuggestion(L), pr = todayPrompt(L), nb = blkPlan(L);
  return [
    { id: "review", title: "Repaso de tarjetas", sub: nDue ? `${nDue} ${nDue === 1 ? "tarjeta" : "tarjetas"} para hoy` : has ? "Al día: no hay tarjetas pendientes" : "Toca palabras al leer y guárdalas para empezar", min: Math.max(1, Math.round(nDue * 0.3)), done: has && !nDue, off: !has },
    nb ? { id: "warm", title: "Calentamiento: francés por bloques", sub: nb.l ? `Lección ${nb.l.n}: ${nb.l.title}` : "Repaso acumulado de tus bloques", min: 5, done: isDone("warm", L) }
      : { id: "warm", title: L === "en" ? "Calentamiento: tiempos verbales" : "Calentamiento: conjugación", sub: (L === "en" ? "Foco de hoy: " : "Tiempos: ") + w, min: 3, done: isDone("warm", L) },
    { id: "read", title: rd.title, sub: rd.sub, min: rd.min, done: isDone("read", L) },
    { id: "speak", title: "Habla 1 minuto", sub: pr.p, min: 3, done: isDone("speak", L) },
  ];
}
function viewHoy() {
  const L = S.lang, goal = S.progress.goal || 15, mins = dayMin(today()), st = streak();
  let week = 0; for (let i = 0; i < 7; i++) week += dayMin(dayKey(dateN(i)));
  const steps = planSteps(L), next = steps.findIndex(s => !s.done && !s.off);
  const total = steps.filter(s => !s.done && !s.off).reduce((a, s) => a + s.min, 0);
  const allDone = next === -1;
  return `
  <div class="hoy-head"><div class="stack" style="gap:4px;min-width:0">
      <p class="eyebrow">${esc(cap(fmtDay(new Date())))}</p><h1>${greet()}</h1>
      <p class="hint">${st ? `Racha de ${st} ${st === 1 ? "día" : "días"}` : "Hoy empieza tu racha"} · ${fmtMin(week)} min esta semana</p></div>
    ${ring(mins, goal)}</div>
  <div class="stack">
    <div class="between"><h3>Tu plan de hoy · ${LANG_NAME[L]}</h3><span class="hint">${allDone ? "¡Completo!" : `~${total} min`}</span></div>
    <div class="plan">${steps.map((s, i) => `<button class="step${s.done ? " done" : ""}${i === next ? " next" : ""}" data-act="plan" data-arg="${s.id}">
      <span class="n">${s.done ? "✓" : i + 1}</span><span style="min-width:0"><b>${esc(s.title)}</b><small>${esc(s.sub)}</small></span><span class="min">${s.done || s.off ? "" : s.min + " min"}</span></button>`).join("")}</div>
    ${allDone ? `<p class="why soft">Terminaste el plan de hoy en ${LANG_NAME[L]}. Si te queda tiempo, cambia de idioma arriba o relee algo en voz alta: repetir es lo que más fluidez da.</p>` : ""}
  </div>
  <div class="panel"><div class="between"><h3>Últimos 7 días</h3>${chartLegend()}</div>${weekChart(7)}</div>`;
}
function onPlan(id) {
  const L = S.lang;
  if (id === "review") return startReview(L);
  if (id === "warm") return blkPlan(L) ? blkWarmup() : startWarmup(L);
  if (id === "speak") { S.tab = "hablar"; S.speakMode = "minuto"; render(); return scrollTo(0, 0); }
  if (id === "read") {
    const rd = readSuggestion(L);
    S.tab = "leer";
    if (rd.kind === "draft") return resumeDraft();
    if (rd.kind === "item") return openItem(rd.id);
    render(); scrollTo(0, 0);
  }
}

/* ---------- Gráfico de barras apiladas (minutos por día y por idioma) ---------- */
const chartLegend = () => `<div class="legend" aria-hidden="true"><span><i style="background:var(--chart-en)"></i>English</span><span><i style="background:var(--chart-fr)"></i>Français</span></div>`;
function niceMax(v) { const steps = [10, 20, 30, 40, 60, 80, 120, 160, 240]; return steps.find(s => s >= v) || Math.ceil(v / 60) * 60; }
function weekChart(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) { const d = dateN(i), k = dayKey(d); days.push({ d, k, en: dayMin(k, "en"), fr: dayMin(k, "fr") }); }
  const goal = S.progress.goal || 15;
  const max = niceMax(Math.max(goal, ...days.map(x => x.en + x.fr)));
  const W = Math.round(clamp(Math.min(760, document.documentElement.clientWidth || 360) - 66, 280, 700)), H = 150, L = 30, R = 6, T = 12, B = 24, pw = W - L - R, ph = H - T - B, band = pw / n, bw = Math.min(24, band * 0.56);
  const y = v => T + ph - (v / max) * ph;
  const topRound = (x, yy, w, h, r) => { r = Math.min(r, h, w / 2); return `M${x},${yy + h}V${yy + r}Q${x},${yy} ${x + r},${yy}H${x + w - r}Q${x + w},${yy} ${x + w},${yy + r}V${yy + h}Z`; };
  const sq = (x, yy, w, h) => `M${x},${yy}h${w}v${h}h${-w}Z`;
  const wd = d => { try { return new Intl.DateTimeFormat("es-CL", { weekday: "narrow" }).format(d).toUpperCase(); } catch { return ""; } };
  let marks = "", hits = "", labels = "";
  days.forEach((x, i) => {
    const cx = L + band * (i + 0.5), x0 = cx - bw / 2, base = T + ph;
    const hEn = (x.en / max) * ph, hFr = (x.fr / max) * ph, gap = hEn > 0 && hFr > 0 ? 2 : 0;
    if (hEn > 0) marks += `<path d="${hFr > 0 ? sq(x0, base - hEn, bw, hEn) : topRound(x0, base - hEn, bw, hEn, 4)}" fill="var(--chart-en)"/>`;
    if (hFr > 0) marks += `<path d="${topRound(x0, base - hEn - gap - hFr, bw, hFr, 4)}" fill="var(--chart-fr)"/>`;
    const last = i === n - 1;
    labels += `<text class="ax" x="${cx}" y="${H - 6}" text-anchor="middle"${last ? ' style="font-weight:700;fill:var(--ink)"' : ""}>${last ? "Hoy" : wd(x.d)}</text>`;
    if (last && x.en + x.fr > 0) labels += `<text class="ax" x="${cx}" y="${base - hEn - gap - hFr - 5}" text-anchor="middle" style="fill:var(--ink);font-weight:700">${fmtMin(x.en + x.fr)}</text>`;
    hits += `<rect class="hit" x="${L + band * i}" y="${T}" width="${band}" height="${ph}" tabindex="0" data-tip="${esc(cap(fmtDay(x.d, { weekday: "long", day: "numeric", month: "short" })))}|${fmtMin(x.en)}|${fmtMin(x.fr)}" aria-label="${esc(fmtDay(x.d))}: ${fmtMin(x.en)} min inglés, ${fmtMin(x.fr)} min francés"/>`;
  });
  const grid = [0, max / 2, max].map(v => `<line class="gl" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${Math.round(v)}</text>`).join("");
  const goalLine = `<line x1="${L}" x2="${W - R}" y1="${y(goal)}" y2="${y(goal)}" stroke="var(--muted)" stroke-width="1" opacity=".55"/><text class="ax" x="${W - R}" y="${y(goal) - 4}" text-anchor="end">meta ${goal}</text>`;
  const table = `<details class="table"><summary>Ver como tabla</summary><table><tr><th>Día</th><th>English</th><th>Français</th></tr>${days.map(x => `<tr><td>${esc(fmtDay(x.d, { weekday: "short", day: "numeric" }))}</td><td>${fmtMin(x.en)}</td><td>${fmtMin(x.fr)}</td></tr>`).join("")}</table></details>`;
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Minutos de práctica por día">${grid}${goalLine}${marks}${labels}${hits}</svg><div class="tip" hidden></div></div><p class="hint">Minutos por día</p>${table}`;
}
function chartTip(el, show) {
  const box = el.closest(".chart"), tip = box?.querySelector(".tip");
  if (!tip) return;
  if (!show) { tip.hidden = true; return; }
  const [d, en, fr] = el.dataset.tip.split("|");
  tip.innerHTML = `<div>${esc(d)}</div><div><span class="k" style="background:var(--chart-en)"></span><b>${en}</b> min English</div><div><span class="k" style="background:var(--chart-fr)"></span><b>${fr}</b> min Français</div>`;
  const r = el.getBoundingClientRect(), br = box.getBoundingClientRect();
  tip.style.left = clamp(r.left - br.left + r.width / 2, 70, br.width - 70) + "px";
  tip.style.top = (r.top - br.top + 8) + "px";
  tip.hidden = false;
}
