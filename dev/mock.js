// Claude simulado para probar la app localmente (node build.js --test → dev/test.html). No se publica.
(function () {
  const delay = ms => new Promise(r => setTimeout(r, ms));
  const cp = v => JSON.parse(JSON.stringify(v));
  const store = new Map();
  const EN_TEXT = `# A Morning in Valparaíso

I **have been** to Valparaíso many times, but last summer I **went** with a friend who **had never seen** the sea. We **were** tired, but the view **was** amazing.

By the time we **reached** the top of the hill, the fog **had** already **lifted**. If I **were** a painter, I **would paint** that moment.

## Comprueba
1. Who went with the speaker?
a) His brother
b) A friend who had never seen the sea *
c) A group of tourists
2. What had happened by the time they reached the top?
a) The fog had lifted *
b) It had started to rain
c) The funicular had closed
## Así se dice
- He ido muchas veces a Valparaíso => **I have been to Valparaíso many times** — experiencia sin fecha.
- Para cuando llegamos arriba => **By the time we reached the top** — by the time + pasado.
## Vocabulario
- fog | neblina | fog
- reached | llegamos a | richt
- lifted | se levantó | líftid
## Gramática en este texto
- "I **had never seen**": past perfect, experiencia anterior a otro momento pasado.
## Pronunciación
- "reached" termina en /t/: richt.
## Cuéntalo tú
- Cuenta en voz alta tu última visita a la costa usando "I have been" y "by the time".`;
  const FR_TEXT = `# Le marché du samedi

Le samedi, je **vais** au marché avec un ami. Il y **a** des fruits et du fromage.
ES: Los sábados voy al mercado con un amigo. Hay frutas y queso.

J'**achète** deux cents grammes de comté. Ça **fait** six euros.
ES: Compro doscientos gramos de comté. Son seis euros.

## Comprueba
1. ¿Con quién va al mercado?
a) Con su hermano
b) Con un amigo *
c) Solo
## Así se dice
- Voy al mercado => **je vais au marché** — aller + au.
## Vocabulario
- le marché | el mercado | le mar-SHÉ
- je vais | voy | zhe VÉ
## Gramática en este texto
- "**je vais**": verbo aller en presente.
## Pronunciación
- "marché": la ch suena sh.
## Cuéntalo tú
- Cuenta qué compras en el mercado con "j'achète" y "il y a".`;
  const now = Date.now();
  store.set("state/profile", { text: "Me llamo Alex y vivo viajando. (Perfil de prueba)" });
  store.set("items/test-en-1", { id: "test-en-1", kind: "reading", lang: "en", min: 5, level: "B2", topic: "Historia de Chile", title: "A Morning in Valparaíso", text: EN_TEXT, tr: { 0: "He ido a Valparaíso muchas veces… (traducción de prueba)" }, ts: now - 2000, date: "2026-10-01" });
  store.set("items/test-fr-1", { id: "test-fr-1", kind: "reading", lang: "fr", min: 5, level: "A1", topic: "Viajes", title: "Le marché du samedi", text: FR_TEXT, tr: {}, ts: now - 3000, date: "2026-10-01" });

  function docRef(path) {
    return {
      id: path.split("/").pop(), path,
      async get() { const v = store.get(path); return { id: path.split("/").pop(), exists: !!v, data: () => v && cp(v), metadata: {} }; },
      async set(d) { window.__writes.push(["set", path]); store.set(path, cp(d)); },
      async update(d) { if (!store.has(path)) throw { code: "invalid_argument" }; store.set(path, Object.assign(store.get(path), cp(d))); },
      async delete() { window.__writes.push(["delete", path]); store.delete(path); },
      collection(p) { return colRef(path + "/" + p); },
    };
  }
  function colRef(path, o = {}) {
    const q = {
      path,
      doc: id => docRef(path + "/" + (id || Math.random().toString(36).slice(2))),
      orderBy: (f, dir) => colRef(path, { ...o, f, dir }),
      limit: n => colRef(path, { ...o, n }),
      where: () => colRef(path, o),
      async get() {
        const depth = path.split("/").length + 1;
        let docs = [...store.entries()].filter(([k]) => k.startsWith(path + "/") && k.split("/").length === depth)
          .map(([k, v]) => ({ id: k.split("/").pop(), exists: true, data: () => cp(v), metadata: {} }));
        if (o.f) docs.sort((a, b) => ((a.data()[o.f] ?? 0) - (b.data()[o.f] ?? 0)) * (o.dir === "desc" ? -1 : 1));
        if (o.n) docs = docs.slice(0, o.n);
        return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: {} };
      },
      async add(d) { const r = q.doc(); await r.set(d); return r; },
    };
    return q;
  }
  const db = { doc: docRef, collection: p => colRef(p) };

  function textAnswer(p) {
    if (/STRICT FORMAT/.test(p)) return EN_TEXT.replace("A Morning in Valparaíso", "A New Morning (" + Math.random().toString(36).slice(2, 6) + ")");
    if (/FORMAT STRICT/.test(p)) return FR_TEXT.replace("Le marché du samedi", "Un nouveau samedi (" + Math.random().toString(36).slice(2, 6) + ")");
    if (/Translate this/.test(p)) return "Traducción de prueba del párrafo.";
    if (/Answer this speaking prompt/.test(p)) return "I **have been** working on a new project lately. Before that, I **had been** travelling for months. It **was** hard, but I **have learned** a lot.\n---\nHe estado trabajando en un proyecto nuevo. Antes de eso, había estado viajando por meses.";
    if (/Eres un profesor experto/.test(p)) return "La regla: usa **have been** cuando algo sigue hasta hoy. Ejemplo: I have been here for two years (llevo dos años aquí).";
    return "Respuesta de prueba.";
  }
  function jsonAnswer(p) {
    let m;
    if ((m = p.match(/tapped the word "([^"]+)"/))) return { t: m[1], base: "", es: "significado de prueba de «" + m[1] + "»", pron: "pron-" + m[1], note: "Nota de prueba sobre el uso." };
    if (/He wants to say this/.test(p)) return /learning French/.test(p)
      ? { t: "Je voudrais réserver une table pour deux samedi.", pron: "zhe vu-DRÈ re-ser-VÉ ün TABL pur DÖ sam-DI", why: "**Je voudrais** es la forma cortés de pedir algo.", alts: [{ t: "Une table pour deux, s'il vous plaît.", when: "más directo" }], words: [{ t: "voudrais", es: "me gustaría" }] }
      : { t: "If I had known it was going to rain, I would have brought an umbrella.", pron: "would have: wúdav", why: "Tercer condicional: **if + had + participio**, luego **would have + participio**.", alts: [{ t: "Had I known it would rain, I'd have brought an umbrella.", when: "más formal" }], words: [{ t: "umbrella", es: "paraguas" }] };
    if (/Correct it\./.test(p)) return /French teacher/.test(p)
      ? { corrected: "Hier, je suis allé au marché. Il y avait beaucoup de gens.", natural: "Hier, je suis allé au marché et il y avait beaucoup de monde.", fixes: [{ from: "il y a", to: "il y avait", why: "Para describir el pasado se usa el imparfait.", cat: "temps" }], good: "Usaste bien «je suis allé».", tip: "Pasado + descripción → imparfait." }
      : { corrected: "Yesterday I went to the market and there were many people.", natural: "Yesterday I went to the market, and it was packed.", fixes: [{ from: "have went", to: "went", why: "Con 'yesterday' va past simple, y 'went' nunca lleva auxiliar.", cat: "pperf" }, { from: "was many people", to: "were many people", why: "'People' es plural → were.", cat: "waswere" }], good: "Buena estructura de la frase.", tip: "Antes de hablar del pasado, piensa: ¿digo cuándo? → past simple." };
    if (/Create 12 fill-in-the-blank/.test(p)) return [
      { c: "waswere", q: "They ___ at home when I called.", o: ["was", "were", "has", "are"], a: 1, w: "They → were." },
      { c: "hadpp", q: "When we arrived, the train ___ already ___.", o: ["has / left", "had / left", "was / leave", "did / left"], a: 1, w: "Lo anterior a otro pasado → had left." },
      { c: "pperf", q: "I ___ my keys. I can't find them.", o: ["lost", "have lost", "had lost", "was losing"], a: 1, w: "Resultado presente → have lost." },
    ];
    if (/Write 8 natural/.test(p)) return [
      { t: "I **had been meaning** to call you for weeks.", es: "Hacía semanas que quería llamarte.", note: "had been meaning to = tenía pendiente." },
      { t: "If I **had known**, I **would have come** earlier.", es: "Si hubiera sabido, habría venido antes.", note: "Tercer condicional." },
    ];
    if (/Pour un hispanophone/.test(p)) return [
      { tag: "être · présent", t: "Je **suis** chilien.", es: "Soy chileno.", note: "je suis = yo soy." },
      { tag: "avoir · présent", t: "J'**ai** trente-quatre ans.", es: "Tengo treinta y cuatro años.", note: "La edad va con avoir." },
      { tag: "aller · futur proche", t: "Je **vais aller** au Chili.", es: "Voy a ir a Chile.", note: "aller + infinitivo." },
    ];
    if (/pasted this short excerpt/.test(p)) return { tr: "Traducción de prueba del verso.", why: "Explicación de prueba: **expresión** y por qué se dice así.", words: [{ t: "palabra", es: "significado" }], pron: "pista de prueba" };
    if (/Create ONE speaking prompt/.test(p)) return /French/.test(p) ? { p: "Qu'est-ce que tu as mangé hier ?", es: "¿Qué comiste ayer?", s: ["j'ai mangé", "c'était"] } : { p: "What have you been reading lately?", es: "¿Qué has estado leyendo últimamente?", s: ["I've been reading", "it was"] };
    return {};
  }
  window.__log = []; window.__writes = [];
  async function sample(input, o = {}) {
    const p = typeof input === "string" ? input : input.map(m => m.content).join("\n");
    window.__log.push({ kind: "text", p, o: { modelTier: o.modelTier, cache: o.cache } });
    const text = textAnswer(p);
    await delay(250);
    if (o.onText) {
      let acc = "";
      for (const chunk of text.match(/[\s\S]{1,140}/g)) {
        if (o.signal?.aborted) throw { code: "cancelled", text: acc };
        acc += chunk; o.onText({ text: acc, delta: chunk }); await delay(30);
      }
    }
    return { text, truncated: false, modelTierApplied: o.modelTier || "default" };
  }
  sample.json = async (input, o = {}) => { const p = typeof input === "string" ? input : ""; window.__log.push({ kind: "json", p, o: { modelTier: o.modelTier, cache: o.cache } }); await delay(200); return jsonAnswer(p); };
  sample.limits = async () => ({ maxPromptBytes: 65536 });
  const downloads = { save: async ({ filename, data }) => { window.__lastDownload = { filename, size: String(data).length, data }; return { status: "saved" }; } };
  window.__store = store;
  window.claude = { use: async name => name === "db" ? db : name === "sample" ? sample : name === "downloads" ? downloads : null };
})();
