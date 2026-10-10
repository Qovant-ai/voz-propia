/* ===================== Practicar → Canciones (inglés y francés) ===================== */
// Las letras no se copian: se escuchan y se leen en Spotify o YouTube. Si un verso no se entiende,
// Claude explica solo el fragmento que pegues, sin reproducir el resto de la letra.
const SONGS = { en: SONGS_EN, fr: SONGS_FR };
const LVL_SONG = ["", "se entiende fácil", "dificultad media", "difícil de entender"];
const songList = L => SONGS[L].flatMap(g => g.songs.map(s => ({ ...s, a: g.a, L, id: L + "-" + hash(g.a + "|" + s.t) })));
const songById = id => [...songList("en"), ...songList("fr")].find(s => s.id === id);
const songStore = () => (S.progress.songs ||= {});
const songLinks = s => { const q = encodeURIComponent(`${s.a} ${s.t}`); return { sp: `https://open.spotify.com/search/${q}`, yt: `https://www.youtube.com/results?search_query=${q}` }; };
const songArtists = L => SONGS[L].map(g => g.a).join(", ");

function startSongs(L = S.lang) { stopSay(); S.sub = { kind: "songs", tab: S.tab, lang: L, id: null }; render(); scrollTo(0, 0); }
function openSong(id) { const d = S.sub; d.id = id; d.ans = null; d.q = ""; d.t0 = Date.now(); stopSay(); render(); scrollTo(0, 0); }
function viewSongs() { const d = S.sub, s = d.id && songById(d.id); return s ? songCard(d, s) : songsIndex(d); }

function songsIndex(d) {
  const L = d.lang, all = songList(L), done = songStore(), n = all.filter(s => done[s.id]).length;
  return `<div class="back"><button class="btn quiet small" data-act="back">← Volver</button><span class="tag">${n} de ${all.length} escuchadas</span></div>
  <div class="stack"><h1>Aprende con canciones</h1>
    <p class="lead">Las 5 canciones más escuchadas de cada artista: el título bien traducido, de qué trata, lo que enseña y cómo escucharla. La letra la ves en Spotify o YouTube; aquí entiendes qué dice y por qué.</p></div>
  ${SONGS[L].map(g => `<div class="stack" style="gap:8px"><h3>${esc(g.a)}</h3><div class="menu">${all.filter(s => s.a === g.a).map(s =>
    `<button data-act="song-open" data-arg="${s.id}"><span><b lang="${L}">${done[s.id] ? "✓ " : ""}${esc(s.t)}</b><small>«${esc(s.tr)}» · ${LVL_SONG[s.lvl]}</small></span><span class="go">→</span></button>`).join("")}</div></div>`).join("")}
  <button class="link" data-act="tip" data-arg="songs" data-lang="${L}">Cómo aprender con canciones</button>`;
}

const sayRow = (t, L, saveAct, i) => `<div class="row" style="flex:none;gap:6px"><button class="say" data-act="say" data-say="${esc(t)}" data-lang="${L}" aria-label="Escuchar">▶</button><button class="btn quiet small" data-act="${saveAct}" data-arg="${i}">Guardar</button></div>`;
function songCard(d, s) {
  const L = s.L, lk = songLinks(s), done = songStore()[s.id];
  return `<div class="back"><button class="btn quiet small" data-act="song-list">← Canciones</button><span class="tag">${esc(s.a)}${s.y ? " · " + s.y : ""}</span></div>
  <div class="stack" style="gap:4px"><h1 lang="${L}">${esc(s.t)}</h1><p class="hint">${esc(s.al)} · ${LVL_SONG[s.lvl]}</p></div>
  <div class="panel"><h3>Traducción inteligente del título</h3><p style="font-family:var(--read);font-size:1.25rem">«${esc(s.tr)}»</p><p>${esc(s.why)}</p></div>
  <div class="panel"><h3>De qué trata</h3><p>${esc(s.about)}</p>
    <div class="row"><a class="btn" href="${lk.sp}" target="_blank" rel="noopener">Escuchar en Spotify</a><a class="btn quiet" href="${lk.yt}" target="_blank" rel="noopener">YouTube</a></div>
    <p class="hint"><b>Cómo escucharla:</b> ${esc(s.ear)}</p></div>
  <div class="panel"><h3>Lo que te enseña</h3><p><b>${esc(s.k)}.</b> ${esc(s.x)}</p>
    ${s.ex.map(([t, es], i) => `<div class="between" style="align-items:flex-start;border-top:1px solid var(--line);padding-top:10px"><div style="min-width:0"><p lang="${L}"><b>${esc(t)}</b></p><p class="hint">${esc(es)}</p></div>${sayRow(t, L, "song-save-ex", i)}</div>`).join("")}</div>
  <div class="panel"><h3>Palabras para entenderla</h3>
    ${s.w.map(([t, es, pr], i) => `<div class="between" style="align-items:flex-start"><div style="min-width:0"><p lang="${L}"><b>${esc(t)}</b></p><p class="hint">${esc(es)}${pr ? ` · <i>${esc(pr)}</i>` : ""}</p></div>${sayRow(t, L, "song-save-w", i)}</div>`).join("")}</div>
  <div class="panel"><h3>¿Un verso que no entiendes?</h3><p class="hint">Pega solo ese verso, una o dos líneas. Claude te lo traduce y te explica las expresiones.</p>
    <textarea id="song-q" rows="2" maxlength="300" lang="${L}" placeholder="Pega aquí el verso">${esc(d.q || "")}</textarea>
    <button class="btn" data-act="song-explain">Explícamelo</button>${aiNote()}
    <div id="song-out">${d.ans ? songAns(d.ans, L) : ""}</div></div>
  <div class="panel"><h3>Cuéntala tú</h3><p lang="${L}"><b>${esc(s.say[0])}</b></p><p class="hint">${esc(s.say[1])}</p>
    <button class="btn ghost" data-act="song-tell">Responder en Hablar →</button></div>
  <button class="btn ${done ? "quiet" : ""} wide" data-act="song-done">${done ? `Escuchada el ${esc(fmtDay(new Date(done + "T12:00"), { day: "numeric", month: "long" }))} · marcar de nuevo` : "La escuché y la entendí ✓"}</button>`;
}
function songAns(a, L) {
  return `<div class="card"><p lang="${L}" style="color:var(--muted)">${esc(a.q)}</p><p style="font-family:var(--read);font-size:1.15rem"><b>${esc(a.tr)}</b></p>${a.why ? `<p>${md(a.why)}</p>` : ""}
    ${a.words.length ? `<div class="stack" style="gap:4px">${a.words.map(w => `<p><b lang="${L}">${esc(w.t)}</b> <span class="hint">· ${esc(w.es)}</span></p>`).join("")}</div>` : ""}
    ${a.pron ? `<p class="hint">Pronunciación: ${esc(a.pron)}</p>` : ""}
    <div class="row"><button class="btn quiet small" data-act="say" data-say="${esc(a.q)}" data-lang="${L}">▶ Escuchar</button><button class="btn quiet small" data-act="song-save-ans">Guardar para repasar</button></div></div>`;
}

async function explainLine() {
  const d = S.sub, s = songById(d.id), q = String($("#song-q")?.value ?? d.q ?? "").trim().slice(0, 300);
  if (!s) return;
  if (!q) return toast("Pega el verso que no entiendes");
  if (!canAI()) return;
  d.q = q; S.busy = true; S.ctl = new AbortController();
  const out = $("#song-out"); if (out) out.innerHTML = `<p class="thinking"><span class="dot"></span>Entendiendo el verso…</p>`;
  try {
    const r = await S.sample.json(`${who()} is a Spanish speaker from Chile learning ${s.L === "en" ? "English" : "French"}. ${levelLine(s.L)}
He is listening to the song "${s.t}" by ${s.a} and pasted this short excerpt he does not understand: "${q}"
Explain ONLY this excerpt. Do not quote, continue or reconstruct any other part of the song's lyrics. If the excerpt looks misheard, say so briefly without quoting the original.
Reply with ONLY JSON: {"tr": natural Spanish translation of the excerpt, "why": IN SPANISH, 2-4 short sentences on the expressions, slang, grammar or wordplay in it, "words": [{"t": word or expression from the excerpt, "es": its meaning in Spanish}] (at most 4), "pron": IN SPANISH, one pronunciation hint for the hardest part, written for a Spanish speaker}`, { signal: S.ctl.signal });
    if (!r || typeof r.tr !== "string") throw { code: "invalid_json" };
    d.ans = { q, tr: r.tr, why: String(r.why || ""), pron: String(r.pron || ""),
      words: Array.isArray(r.words) ? r.words.filter(w => w && w.t).slice(0, 4).map(w => ({ t: String(w.t), es: String(w.es || "") })) : [] };
  } catch (e) { if (e?.code !== "cancelled") toast(errMsg(e)); }
  finally { S.busy = false; }
  if (S.sub === d) { const o = $("#song-out"); if (o) o.innerHTML = d.ans ? songAns(d.ans, s.L) : ""; }
}
function songSave(el, card) {
  if (card && addCard(card)) { el.textContent = "Guardada"; el.disabled = true; updateBadge(); }
}
function songTell() {
  const s = songById(S.sub.id); if (!s) return;
  stopSay(); S.fixCtx[s.L] = `${s.say[0]} (${s.t} · ${s.a})`; S.fixRes[s.L] = null;
  S.sub = null; S.speakMode = "corregir"; S.tab = "hablar"; S.hablarT0 = Date.now(); render(); scrollTo(0, 0);
}
function songDone() {
  const d = S.sub; songStore()[d.id] = today(); saveProgress();
  if (d.t0) { logTime(d.lang, "practice", Date.now() - d.t0); d.t0 = Date.now(); }
  toast("Marcada como escuchada"); render(true);
}
