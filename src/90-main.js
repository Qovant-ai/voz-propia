/* ===================== Navegación, acciones y arranque ===================== */
const VIEWS = { hoy: () => viewHoy(), leer: () => viewLeer(), hablar: () => viewHablar(), practicar: () => viewPracticar(), biblioteca: () => viewBiblioteca() };
const SUBS = { review: () => viewReview(), drill: () => viewDrill(), cards: () => viewCards(), nums: () => viewNums(), time: () => viewTime(), conjtable: () => viewConjTable(), verbs: () => viewVerbs(), blocks: () => viewBlocks(), songs: () => viewSongs() };
function render(keep) {
  document.body.dataset.lang = S.lang;
  $("#lang-en")?.setAttribute("aria-pressed", String(S.lang === "en"));
  $("#lang-fr")?.setAttribute("aria-pressed", String(S.lang === "fr"));
  $$('.tabs [data-act="tab"]').forEach(b => b.dataset.arg === S.tab ? b.setAttribute("aria-current", "page") : b.removeAttribute("aria-current"));
  closeSheet();
  const y = scrollY;
  let html;
  try { html = S.sub && S.sub.tab === S.tab && SUBS[S.sub.kind] ? SUBS[S.sub.kind]() : VIEWS[S.tab](); }
  catch (e) { console.error(e); S.sub = null; html = `<p class="why soft">Algo falló al mostrar esta pantalla. Vuelve a intentarlo.</p>` + VIEWS[S.tab](); }
  $("#view").innerHTML = html;
  document.documentElement.style.setProperty("--rs", LS.get("rs", 1.18) + "rem");
  updateBadge();
  if (keep) scrollTo(0, y);
}
function setLang(l) {
  if (l !== "en" && l !== "fr" || l === S.lang) return;
  stopSay(); clearInterval(S.timerInt);
  if (S.timer?.running) S.timer = null;
  S.lang = l; LS.set("lang", l);
  if (S.sub && S.sub.lang !== l) S.sub = null;
  render();
}
function leaveSub() {
  const s = S.sub; stopSay();
  if (!s) return render();
  if (s.kind === "drill" && !s.logged && s.i > 0) logTime(s.lang, "practice", Date.now() - s.t0);
  if (s.kind === "review" && !s.logged && s.done) { logTime(s.lang, "review", Date.now() - s.t0); updateBadge(); }
  if ((s.kind === "nums" || s.kind === "time") && s.count) logTime(s.lang, "practice", Date.now() - s.t0);
  if (s.kind === "blocks" && s.stage !== "list" && s.i > 0 && !s.logged) logTime("fr", "practice", Date.now() - s.t0);
  if (s.kind === "conjtable" && s.from === "verbs") S.sub = { kind: "verbs", tab: s.tab, lang: "fr", q: "" };
  else S.sub = null;
  if (s.src === "warmup" && s.logged) S.tab = "hoy";
  render(); scrollTo(0, 0);
}
const RATES = { en: [0.8, 0.95, 1.05], fr: [0.7, 0.85, 1] };
const fsLabel = v => "A" + (v > 1.2 ? "+" : v < 1.1 ? "−" : "");

const A = {
  lang: el => setLang(el.dataset.arg),
  tab: el => { stopSay(); S.tab = el.dataset.arg; if (S.tab === "hablar") S.hablarT0 = Date.now(); render(); scrollTo(0, 0); },
  back: () => leaveSub(),
  level: el => { (S.progress.level ||= {})[S.lang] = el.dataset.arg; saveProgress(); render(true); },
  plan: el => onPlan(el.dataset.arg),
  say: el => say(el.dataset.say, el.dataset.lang || S.lang, el),
  review: () => startReview(S.lang),
  "review-more": () => startReview(S.sub?.lang || S.lang),
  "show-card": () => { S.sub.shown = true; render(); },
  grade: el => gradeCard(+el.dataset.arg),
  // Leer
  dur: el => { pickSt.min = +el.dataset.arg; LS.set("pick", pickSt); render(true); },
  topic: el => { pickSt.topic = el.dataset.arg; LS.set("pick", pickSt); render(true); },
  gen: () => generateReading(),
  resume: () => resumeDraft(),
  "open-item": el => openItem(el.dataset.arg),
  "done-read": () => finishReading(),
  "close-read": () => { stopSay(); if (S.reading && !S.reading.saved) persistReading(); S.reading = null; render(); scrollTo(0, 0); },
  discard: () => { stopSay(); if (S.reading) LS.set("draft:" + S.reading.lang, null); S.reading = null; render(); toast("Lectura descartada"); },
  "stop-gen": () => S.ctl?.abort(),
  es: el => toggleEs(+el.dataset.arg, el),
  "es-all": el => { const r = S.reading; r.showTr = !r.showTr; if (!r.showTr) r.open = {}; const y = scrollY; $("#doc").innerHTML = renderDoc(r); scrollTo(0, y); el.classList.toggle("on", r.showTr); },
  "play-all": () => playAll(),
  rate: el => { const L = S.reading?.lang || S.lang, opts = RATES[L], cur = TTS.rate(L), i = opts.findIndex(x => Math.abs(x - cur) < 0.01), nx = opts[(i + 1) % opts.length]; S.progress.rate[L] = nx; saveProgress(); el.textContent = nx.toFixed(2).replace(/0$/, "") + "×"; toast(`Velocidad de la voz: ${nx}×`); },
  fsize: el => { const s = [1.05, 1.18, 1.32], cur = LS.get("rs", 1.18), i = s.findIndex(x => Math.abs(x - cur) < 0.01), nx = s[(i + 1) % s.length]; LS.set("rs", nx); document.documentElement.style.setProperty("--rs", nx + "rem"); el.textContent = fsLabel(nx); },
  quiz: el => { const r = S.reading, qi = +el.dataset.q, oi = +el.dataset.o; (r.quiz ||= {})[qi] = oi; const q = parseDoc(r.text).quiz[qi]; if (q) logAnswer("read:" + r.lang, oi === q.a); const y = scrollY; $("#doc").innerHTML = renderDoc(r); scrollTo(0, y); },
  "save-say": el => { const r = S.reading, s = parseDoc(r.text).say[+el.dataset.arg]; if (s && addCard({ lang: r.lang, type: "phrase", es: s.es, t: s.t, note: s.note, src: titleOf(r.text) })) { el.textContent = "Guardada"; el.disabled = true; } },
  "save-vocab": el => { const r = S.reading, d = parseDoc(r.text), g = d.gloss[+el.dataset.arg]; if (!g) return; const para = d.paras.map(p => plain(p.t)).find(t => t.toLowerCase().includes(g.t.toLowerCase())) || ""; if (addCard({ lang: r.lang, type: "word", t: g.t, es: g.es, pron: g.pron, ctx: para ? sentenceOf(para, g.t) : "", src: d.title })) { el.textContent = "✓"; el.disabled = true; } },
  "practice-say": () => { const r = S.reading, d = parseDoc(r.text); stopSay(); S.tab = "practicar"; startCards(d.say.map(s => ({ t: s.t, es: s.es, note: s.note })), "Así se dice · " + d.title, r.lang, false, "decir"); },
  retell: () => { const r = S.reading, d = parseDoc(r.text); stopSay(); S.fixCtx[r.lang] = (d.retell || "Cuenta el texto con tus palabras") + " (" + d.title + ")"; S.fixRes[r.lang] = null; S.speakMode = "corregir"; S.tab = "hablar"; S.hablarT0 = Date.now(); render(); scrollTo(0, 0); },
  // Hoja de significado y reglas
  "sheet-close": () => closeSheet(),
  "sheet-say": el => say(S.sheet.t, S.sheet.lang, el),
  "sheet-save": el => { const s = S.sheet; if (addCard({ lang: s.lang, type: "word", t: s.t, es: s.es, pron: s.pron || "", note: s.note || "", ctx: s.ctx || "", src: S.reading ? titleOf(S.reading.text) : "" })) { el.textContent = "Guardada para repasar"; el.disabled = true; $(".w.sel")?.classList.add("gl"); } },
  tip: el => showTip(el.dataset.lang || S.lang, el.dataset.arg),
  // Hablar
  smode: el => { S.speakMode = el.dataset.arg; render(); },
  want: () => genWant(),
  "want-save": el => { const L = S.lang, x = S.decir[L]; if (x && addCard({ lang: L, type: "phrase", es: x.es, t: x.t, note: x.why })) { el.textContent = "Guardada"; el.disabled = true; } },
  "my-phrases": () => { const L = S.lang, ph = liveCards(L).filter(c => c.type === "phrase"); stopSay(); S.tab = "practicar"; startCards(ph.map(c => ({ t: c.t, es: c.es, note: c.note })), "Mis frases", L, false, "decir"); },
  fix: () => genFix(),
  "fix-save": () => saveFixes(),
  "fix-again": () => { S.fixRes[S.lang] = null; render(); setTimeout(() => $("#fix-in")?.focus(), 60); },
  "fix-clear": () => { S.fixCtx[S.lang] = null; render(); },
  "min-start": () => startTimer(),
  "min-stop": () => finishTimer(false),
  "min-next": () => { const L = S.lang; S.speakOff[L] = (S.speakOff[L] || 0) + 1; S.customPrompt[L] = null; S.timer = null; render(); },
  "min-ai": () => genPromptAI(),
  "min-model": () => genModel(),
  "min-correct": () => { const L = S.lang; S.fixCtx[L] = todayPrompt(L).p; S.fixRes[L] = null; S.speakMode = "corregir"; render(); scrollTo(0, 0); setTimeout(() => $("#fix-in")?.focus(), 80); },
  shadow: () => shadowModel(),
  // Practicar
  go: el => goPractice(el.dataset.arg),
  "blk-open": el => startBlockLesson(+el.dataset.arg),
  "blk-list": () => { if (S.sub?.stage !== "list" && S.sub?.i > 0 && !S.sub.logged) logTime("fr", "practice", Date.now() - S.sub.t0); startBlocks(); },
  "blk-stage": el => blkStage(el.dataset.arg),
  "blk-show": () => { S.sub.shown = true; render(); },
  "blk-ear": el => blkGrade("ear", el.dataset.arg === "1"),
  "blk-say": el => blkGrade("said", el.dataset.arg === "1"),
  "blk-slow": el => { const it = S.sub.items[S.sub.i]; if (it) say(it.fr, "fr", el, 0.6); },
  "blk-all": () => sayQueue(S.sub.blocks.map(b => b[0].replace(/\s*[\/·]\s*/g, ", ").replace(/…/g, "")), "fr"),
  "blk-mix": () => startBlockMix(),
  "blk-ai": () => genBlocksAI(),
  "blk-save": el => blkSaveHard(el),
  // Canciones
  "song-open": el => openSong(el.dataset.arg),
  "song-list": () => { stopSay(); S.sub.id = null; render(); scrollTo(0, 0); },
  "song-explain": () => explainLine(),
  "song-save-ex": el => { const s = songById(S.sub.id), x = s?.ex[+el.dataset.arg]; songSave(el, x && { lang: s.L, type: "phrase", t: x[0], es: x[1], note: s.k, src: s.t }); },
  "song-save-w": el => { const s = songById(S.sub.id), w = s?.w[+el.dataset.arg]; songSave(el, w && { lang: s.L, type: "word", t: w[0], es: w[1], pron: w[2] || "", src: `${s.t} · ${s.a}` }); },
  "song-save-ans": el => { const s = songById(S.sub.id), a = S.sub.ans; songSave(el, a && { lang: s.L, type: "phrase", t: a.q, es: a.tr, note: a.why, src: s.t }); },
  "song-tell": () => songTell(),
  "song-done": () => songDone(),
  opt: el => pickOpt(+el.dataset.arg),
  judge: el => pickJudge(el.dataset.arg),
  check: () => checkTyped(),
  next: () => nextItem(),
  "retry-wrong": () => retryWrong(),
  "save-wrong": () => saveWrong(),
  "card-mode": el => { S.sub.mode = el.dataset.arg; S.sub.open = {}; render(); },
  "card-open": el => { S.sub.open[el.dataset.arg] = true; render(true); },
  "card-save": el => { const d = S.sub, c = d.items[+el.dataset.arg]; if (c && addCard({ lang: d.lang, type: "phrase", es: c.es, t: c.t, note: c.note || "" })) { el.textContent = "Guardada"; el.disabled = true; } },
  "cards-done": () => cardsDone(),
  "num-mode": el => { S.sub.mode = el.dataset.arg; newNum(); render(); },
  "num-range": el => { S.sub.range = el.dataset.arg; newNum(); render(); },
  "num-open": () => { S.sub.open = true; render(); say(numSentence(S.sub), "fr"); },
  "num-know": el => { numDone(el.dataset.arg === "1"); newNum(); render(); },
  "num-play": el => say(numSentence(S.sub), "fr", el),
  "num-check": () => { const d = S.sub; if (d.ans) return; const v = ($("#ans")?.value || "").replace(/\D/g, ""); if (!v) return toast("Escribe el número que escuchaste"); const ok = +v === d.n; d.ans = { ok, val: v }; numDone(ok); render(); },
  "num-next": () => { newNum(); render(); setTimeout(() => say(numSentence(S.sub), "fr", $('[data-act="num-play"]')), 80); },
  "time-what": el => { S.sub.what = el.dataset.arg; if (S.sub.what === "date") S.sub.mode = "say"; newTime(); render(); },
  "time-mode": el => { S.sub.mode = el.dataset.arg; newTime(); render(); },
  "time-open": () => { S.sub.open = true; render(); },
  "time-know": el => { const d = S.sub, ok = el.dataset.arg === "1"; d.count++; if (ok) d.ok++; logAnswer("fr:time", ok); newTime(); render(); },
  "time-play": el => { const d = S.sub; d.said ||= Math.random() < 0.5 ? d.tm.formal : d.tm.informal; say(d.said, "fr", el); },
  "time-check": () => { if (!S.sub.ans) checkTime(); },
  "time-next": () => { newTime(); S.sub.said = null; render(); },
  "conj-size": el => { conjCfg.size = +el.dataset.arg; LS.set("conjCfg", conjCfg); render(true); },
  "conj-tense": el => { const t = el.dataset.arg, cur = (conjCfg.tenses?.length ? conjCfg.tenses : FR_TENSES_BY_LEVEL[level("fr").k]).slice(), i = cur.indexOf(t); if (i >= 0) { if (cur.length > 1) cur.splice(i, 1); } else cur.push(t); conjCfg.tenses = Object.keys(FR_CATS).filter(k => cur.includes(k)); LS.set("conjCfg", conjCfg); render(true); },
  "verb-open": el => openVerb(el.dataset.arg),
  "verb-step": el => { const i = FR_VERBS.findIndex(v => v.fr === S.sub.inf) + +el.dataset.arg; if (FR_VERBS[i]) { S.sub.inf = FR_VERBS[i].fr; render(); scrollTo(0, 0); } },
  "conj-verb": () => { const inf = S.sub.inf; startDrill(buildConj({ verbs: [inf], tenses: FR_TENSES_BY_LEVEL[level("fr").k], n: 8 }), { title: inf, lang: "fr" }); },
  accent: el => { const a = document.activeElement, inp = a?.classList?.contains("ans") ? a : $("#ans"); if (!inp) return; const s = inp.selectionStart ?? inp.value.length, e = inp.selectionEnd ?? s; inp.value = inp.value.slice(0, s) + el.dataset.arg + inp.value.slice(e); inp.focus(); try { inp.setSelectionRange(s + 1, s + 1); } catch {} },
  // Biblioteca
  "lib-seg": el => { S.libSeg = el.dataset.arg; S.delAsk = null; render(); },
  "del-ask": el => { S.delAsk = el.dataset.arg; render(true); },
  "del-no": () => { S.delAsk = null; render(true); },
  "del-yes": el => { const id = el.dataset.arg; if (id.startsWith("card:")) removeCard(id.slice(5)); else deleteItem(id); S.delAsk = null; render(true); toast("Eliminado"); },
  "dl-offline": () => downloadOffline(),
  goal: el => { S.progress.goal = +el.dataset.arg; saveProgress(); render(true); },
  newpd: el => { S.progress.newPerDay = +el.dataset.arg; saveProgress(); render(true); },
  "test-voice": el => say(el.dataset.arg === "fr" ? "Bonjour ! J'apprends le français et je fais des progrès chaque jour." : "Hi! I've been learning English for a while, and I'm getting better every day.", el.dataset.arg, el),
  "ask-tutor": () => askTutor(),
};

document.addEventListener("pointerdown", e => { if (e.target.closest?.("[data-keep]")) e.preventDefault(); });
document.addEventListener("click", e => {
  const w = e.target.closest(".w");
  if (w && !e.target.closest("button")) return lookup(w);
  if (S.sheet && !e.target.closest("#sheet")) closeSheet();
  const el = e.target.closest("[data-act]");
  if (!el || el.disabled) return;
  const fn = A[el.dataset.act];
  if (fn) { try { fn(el, e); } catch (err) { console.error(err); toast("Algo falló. Intenta de nuevo."); } }
});
document.addEventListener("keydown", e => {
  if (e.key !== "Enter" || !e.target.matches?.("[data-enter]")) return;
  e.preventDefault();
  if (e.target.id === "ans1") return $("#ans2")?.focus();
  const k = S.sub?.kind;
  if (k === "drill") checkTyped(); else if (k === "nums") A["num-check"](); else if (k === "time") A["time-check"]();
});
document.addEventListener("input", e => {
  const t = e.target;
  if (t.id === "verb-q" && S.sub) { S.sub.q = t.value; const g = $("#verb-grid"); if (g) g.innerHTML = verbGrid(t.value); }
  else if (t.id === "card-q") { S.cardQ = t.value; const l = $("#card-list"); if (l) l.innerHTML = cardRows(S.lang); }
  else if (t.id === "want") S.wantQ[S.lang] = t.value;
  else if (t.id === "fix-in") S.fixQ[S.lang] = t.value;
  else if (t.id === "ask") S.askQ = t.value;
  else if (t.id === "song-q" && S.sub?.kind === "songs") S.sub.q = t.value;
  else if (t.id?.startsWith("rate-")) { const L = t.dataset.lang; S.progress.rate[L] = +t.value; const v = $("#rate-v-" + L); if (v) v.textContent = (+t.value).toFixed(2) + "×"; saveProgress(); }
});
document.addEventListener("change", e => { const t = e.target; if (t.id?.startsWith("voice-")) { LS.set("voice:" + t.dataset.lang, t.value); toast("Voz guardada en este dispositivo"); } });
document.addEventListener("pointerover", e => { const h = e.target.closest?.(".hit"); if (h) chartTip(h, true); });
document.addEventListener("pointerout", e => { const h = e.target.closest?.(".hit"); if (h) chartTip(h, false); });
document.addEventListener("focusin", e => { if (e.target.classList?.contains("hit")) chartTip(e.target, true); });
document.addEventListener("focusout", e => { if (e.target.classList?.contains("hit")) chartTip(e.target, false); });

async function boot() {
  TTS.init();
  applyThemeSeeds(LS.get("themes", null));
  render();
  if (!window.claude?.use) { S.ready = true; render(); return; }
  const get = n => Promise.resolve(claude.use(n)).catch(() => null);
  const [db, sample, downloads] = await Promise.all([get("db"), get("sample"), get("downloads")]);
  S.db = db; S.sample = sample; S.downloads = downloads; S.ready = true;
  if (db) { try { await syncFromDb(db); } catch (e) { console.warn(e); } }
  lastSync = Date.now();
  rerender();
}
function rerender() {
  const a = document.activeElement;
  if (S.busy || (a && (a.tagName === "TEXTAREA" || a.tagName === "INPUT"))) updateBadge(); else render(true);
}
// Al volver a la app (o recuperar internet) trae lo hecho en el otro dispositivo, sin interrumpir una lectura o práctica
let lastSync = 0;
async function resync() {
  if (!S.db || S.busy || S.reading || S.sub || document.hidden || Date.now() - lastSync < 60000) return;
  lastSync = Date.now();
  try { await syncFromDb(S.db); } catch (e) { console.warn(e); return; }
  if (!S.reading && !S.sub) rerender();
}
addEventListener("online", resync);
document.addEventListener("visibilitychange", resync);
boot();
