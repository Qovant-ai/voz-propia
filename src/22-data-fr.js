/* ===================== Datos: francés ===================== */
const FR_CATS = { pres: "présent", fp: "futur proche", pc: "passé composé", imp: "imparfait", fut: "futur simple" };
const FR_ERR_CATS = { conj: "conjugación", aux: "être / avoir", accord: "concordancia (género y número)", genre: "género (le / la)", temps: "tiempo verbal", neg: "negación", prep: "preposiciones", article: "artículos (du, de la, des)", order: "orden de palabras", pron: "pronombres", vocab: "vocabulario", other: "otros" };
const FR_TENSES_BY_LEVEL = { "A1": ["pres", "fp"], "A1+": ["pres", "fp", "pc"], "A2": ["pres", "fp", "pc", "imp"], "B1": ["pres", "fp", "pc", "imp", "fut"], "B2": ["pres", "fp", "pc", "imp", "fut"] };
const FR_TENSE_ES = { pres: "presente", fp: "futuro próximo (aller + infinitivo)", pc: "pasado compuesto", imp: "pretérito imperfecto", fut: "futuro simple" };
const FR_PERS = ["je", "tu", "il / elle", "nous", "vous", "ils / elles"];
const FR_PERS_SAY = ["je", "tu", "il", "nous", "vous", "ils"];

// Verbos irregulares o con cambios: p = presente (je|tu|il|nous|vous|ils) · pp = participio · aux "e" = être
// f = raíz del futuro (si es irregular) · i = raíz del imparfait (si es irregular) · refl = reflexivo · imp = impersonal
const FR_IRR = {
  "être": { p: "suis|es|est|sommes|êtes|sont", pp: "été", f: "ser", i: "ét" },
  "avoir": { p: "ai|as|a|avons|avez|ont", pp: "eu", f: "aur" },
  "faire": { p: "fais|fais|fait|faisons|faites|font", pp: "fait", f: "fer" },
  "dire": { p: "dis|dis|dit|disons|dites|disent", pp: "dit" },
  "pouvoir": { p: "peux|peux|peut|pouvons|pouvez|peuvent", pp: "pu", f: "pourr" },
  "aller": { p: "vais|vas|va|allons|allez|vont", pp: "allé", aux: "e", f: "ir" },
  "voir": { p: "vois|vois|voit|voyons|voyez|voient", pp: "vu", f: "verr" },
  "vouloir": { p: "veux|veux|veut|voulons|voulez|veulent", pp: "voulu", f: "voudr" },
  "venir": { p: "viens|viens|vient|venons|venez|viennent", pp: "venu", aux: "e", f: "viendr" },
  "devoir": { p: "dois|dois|doit|devons|devez|doivent", pp: "dû", f: "devr" },
  "prendre": { p: "prends|prends|prend|prenons|prenez|prennent", pp: "pris" },
  "falloir": { p: "-|-|faut|-|-|-", pp: "fallu", f: "faudr", i: "fall", imp: true },
  "mettre": { p: "mets|mets|met|mettons|mettez|mettent", pp: "mis" },
  "savoir": { p: "sais|sais|sait|savons|savez|savent", pp: "su", f: "saur" },
  "croire": { p: "crois|crois|croit|croyons|croyez|croient", pp: "cru" },
  "connaître": { p: "connais|connais|connaît|connaissons|connaissez|connaissent", pp: "connu" },
  "devenir": { p: "deviens|deviens|devient|devenons|devenez|deviennent", pp: "devenu", aux: "e", f: "deviendr" },
  "sentir": { p: "sens|sens|sent|sentons|sentez|sentent", pp: "senti" },
  "tenir": { p: "tiens|tiens|tient|tenons|tenez|tiennent", pp: "tenu", f: "tiendr" },
  "comprendre": { p: "comprends|comprends|comprend|comprenons|comprenez|comprennent", pp: "compris" },
  "sortir": { p: "sors|sors|sort|sortons|sortez|sortent", pp: "sorti", aux: "e" },
  "vivre": { p: "vis|vis|vit|vivons|vivez|vivent", pp: "vécu" },
  "revenir": { p: "reviens|reviens|revient|revenons|revenez|reviennent", pp: "revenu", aux: "e", f: "reviendr" },
  "appeler": { p: "appelle|appelles|appelle|appelons|appelez|appellent", pp: "appelé", f: "appeller" },
  "mourir": { p: "meurs|meurs|meurt|mourons|mourez|meurent", pp: "mort", aux: "e", f: "mourr" },
  "partir": { p: "pars|pars|part|partons|partez|partent", pp: "parti", aux: "e" },
  "jeter": { p: "jette|jettes|jette|jetons|jetez|jettent", pp: "jeté", f: "jetter" },
  "suivre": { p: "suis|suis|suit|suivons|suivez|suivent", pp: "suivi" },
  "écrire": { p: "écris|écris|écrit|écrivons|écrivez|écrivent", pp: "écrit" },
  "ouvrir": { p: "ouvre|ouvres|ouvre|ouvrons|ouvrez|ouvrent", pp: "ouvert" },
  "commencer": { p: "commence|commences|commence|commençons|commencez|commencent", pp: "commencé" },
  "paraître": { p: "parais|parais|paraît|paraissons|paraissez|paraissent", pp: "paru" },
  "lever": { p: "lève|lèves|lève|levons|levez|lèvent", pp: "levé", f: "lèver" },
  "permettre": { p: "permets|permets|permet|permettons|permettez|permettent", pp: "permis" },
  "asseoir": { p: "assieds|assieds|assied|asseyons|asseyez|asseyent", pp: "assis", aux: "e", f: "assiér", i: "assey", refl: true },
  "apercevoir": { p: "aperçois|aperçois|aperçoit|apercevons|apercevez|aperçoivent", pp: "aperçu", f: "apercevr" },
  "recevoir": { p: "reçois|reçois|reçoit|recevons|recevez|reçoivent", pp: "reçu", f: "recevr" },
  "servir": { p: "sers|sers|sert|servons|servez|servent", pp: "servi" },
  "rire": { p: "ris|ris|rit|rions|riez|rient", pp: "ri" },
  "reconnaître": { p: "reconnais|reconnais|reconnaît|reconnaissons|reconnaissez|reconnaissent", pp: "reconnu" },
  "manger": { p: "mange|manges|mange|mangeons|mangez|mangent", pp: "mangé" },
  "courir": { p: "cours|cours|court|courons|courez|courent", pp: "couru", f: "courr" },
  "offrir": { p: "offre|offres|offre|offrons|offrez|offrent", pp: "offert" },
  "apprendre": { p: "apprends|apprends|apprend|apprenons|apprenez|apprennent", pp: "appris" },
  "envoyer": { p: "envoie|envoies|envoie|envoyons|envoyez|envoient", pp: "envoyé", f: "enverr" },
  "dormir": { p: "dors|dors|dort|dormons|dormez|dorment", pp: "dormi" },
  "rappeler": { p: "rappelle|rappelles|rappelle|rappelons|rappelez|rappellent", pp: "rappelé", f: "rappeller" },
  "lire": { p: "lis|lis|lit|lisons|lisez|lisent", pp: "lu" },
  "changer": { p: "change|changes|change|changeons|changez|changent", pp: "changé" },
  "acheter": { p: "achète|achètes|achète|achetons|achetez|achètent", pp: "acheté", f: "achèter" },
  "boire": { p: "bois|bois|boit|buvons|buvez|boivent", pp: "bu" },
};
const FR_ETRE = new Set(["rester", "arriver", "entrer", "tomber", "monter", "descendre", "retourner", "passer"]);
const FR_IR = new Set(["finir", "agir"]);
const FR_RE = new Set(["répondre", "entendre", "rendre", "attendre", "perdre", "descendre"]);
const FR_VERB_ES = Object.fromEntries(FR_VERBS.map(v => [v.fr, v.es]));
const AUX_AVOIR = ["ai", "as", "a", "avons", "avez", "ont"], AUX_ETRE = ["suis", "es", "est", "sommes", "êtes", "sont"];
const ALLER_P = ["vais", "vas", "va", "allons", "allez", "vont"];
const END_FUT = ["ai", "as", "a", "ons", "ez", "ont"], END_IMP = ["ais", "ais", "ait", "ions", "iez", "aient"];
const REFL = ["me", "te", "se", "nous", "vous", "se"];
const VOWEL = /^[aeiouyéèêëàâîïôûœh]/i;
const joinRefl = (p, w) => /^(me|te|se)$/.test(p) && VOWEL.test(w) ? p[0] + "'" + w : p + " " + w;

function frVerb(inf) {
  const irr = FR_IRR[inf];
  let pres, pp, group;
  if (irr) { pres = irr.p.split("|"); pp = irr.pp; group = "irregular"; }
  else if (FR_IR.has(inf)) { const st = inf.slice(0, -2); pres = [st + "is", st + "is", st + "it", st + "issons", st + "issez", st + "issent"]; pp = st + "i"; group = "-ir (como finir)"; }
  else if (FR_RE.has(inf)) { const st = inf.slice(0, -2); pres = [st + "s", st + "s", st, st + "ons", st + "ez", st + "ent"]; pp = st + "u"; group = "-re (como rendre)"; }
  else { const st = inf.slice(0, -2); pres = [st + "e", st + "es", st + "e", st + "ons", st + "ez", st + "ent"]; pp = st + "é"; group = "-er (regular)"; }
  if (irr && inf.endsWith("er") && inf !== "aller") group = "-er con cambios";
  const aux = irr?.aux === "e" || FR_ETRE.has(inf) ? "être" : "avoir";
  const fut = irr?.f || (inf.endsWith("re") ? inf.slice(0, -1) : inf);
  const impStem = irr?.i || (pres[3] && pres[3] !== "-" ? pres[3].replace(/ons$/, "") : "");
  return { inf, es: FR_VERB_ES[inf] || "", group, pres, pp, aux, fut, impStem, refl: !!irr?.refl, impersonal: !!irr?.imp, regularEr: !irr && group === "-er (regular)" };
}

// Devuelve 6 formas { f: texto que se muestra (sin sujeto), ok: respuestas aceptadas } o null (impersonales)
function frConj(inf, tense) {
  const v = frVerb(inf), out = [];
  for (let i = 0; i < 6; i++) {
    if (v.impersonal && i !== 2) { out.push(null); continue; }
    const r = w => v.refl ? joinRefl(REFL[i], w) : w;
    let f, ok;
    if (tense === "pres") { f = r(v.pres[i]); ok = [f]; }
    else if (tense === "imp") {
      let st = v.impStem; const e = END_IMP[i];
      if (e[0] === "i") { if (st.endsWith("ç")) st = st.slice(0, -1) + "c"; else if (st.endsWith("ge")) st = st.slice(0, -1); }
      f = r(st + e); ok = [f];
    }
    else if (tense === "fut") { f = r(v.fut + END_FUT[i]); ok = [f]; }
    else if (tense === "fp") { f = ALLER_P[i] + " " + (v.refl ? joinRefl(REFL[i], v.inf) : v.inf); ok = [f]; }
    else {
      const etre = v.aux === "être" || v.refl;
      const aux = r((etre ? AUX_ETRE : AUX_AVOIR)[i]);
      if (!etre) { f = aux + " " + v.pp; ok = [f]; }
      else {
        const pl = v.pp.endsWith("s") ? v.pp : v.pp + "s", fem = v.pp + "e", fempl = v.pp + "es";
        const plS = v.pp.endsWith("s") ? v.pp + "(es)" : v.pp + "(e)s";
        const shown = [v.pp + "(e)", v.pp + "(e)", v.pp + "(e)", plS, v.pp + "(e)(s)", plS][i];
        const forms = [[v.pp, fem], [v.pp, fem], [v.pp, fem], [pl, fempl], [v.pp, fem, pl, fempl], [pl, fempl]][i];
        f = aux + " " + shown; ok = forms.map(x => aux + " " + x);
      }
    }
    out.push({ f, ok: [...new Set(ok)] });
  }
  return out;
}
const withSubj = (i, f, impersonal) => impersonal ? "il " + f : i === 0 && VOWEL.test(f) && !/^h/i.test(f) ? "j'" + f : FR_PERS[i] + " " + f;
const sayForm = (i, f) => (i === 0 && VOWEL.test(f) && !/^h/i.test(f) ? "j'" : FR_PERS_SAY[i] + " ") + f.replace(/\(e\)|\(s\)|\(es\)/g, "");
// Quita el sujeto si la persona lo escribió ("nous allons" → "allons")
const stripSubj = s => String(s || "").trim().replace(/^(je\s+|j'|j’|tu\s+|il\s+|elle\s+|on\s+|nous\s+(?=\S)|vous\s+(?=\S)|ils\s+|elles\s+)/i, "");

/* ---------- Números, la hora y las fechas ---------- */
function frNum(n) {
  const u = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const t = { 20: "vingt", 30: "trente", 40: "quarante", 50: "cinquante", 60: "soixante" };
  if (n < 20) return u[n];
  if (n < 70) { const d = Math.floor(n / 10) * 10, r = n % 10; return r === 0 ? t[d] : r === 1 ? t[d] + " et un" : t[d] + "-" + u[r]; }
  if (n < 80) return n === 71 ? "soixante et onze" : "soixante-" + u[n - 60];
  if (n < 100) return n === 80 ? "quatre-vingts" : "quatre-vingt-" + u[n - 80];
  if (n < 1000) { const h = Math.floor(n / 100), r = n % 100, c = h === 1 ? "cent" : u[h] + " cent"; return r === 0 ? (h > 1 ? c + "s" : c) : c + " " + frNum(r); }
  if (n < 1000000) { const k = Math.floor(n / 1000), r = n % 1000, head = k === 1 ? "mille" : frNum(k).replace(/s$/, "") + " mille"; return r ? head + " " + frNum(r) : head; }
  return String(n);
}
const frNumF = n => frNum(n).replace(/\bun$/, "une");
const FR_WD = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const FR_MO = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const hourWord = h => h === 0 ? "minuit" : h === 12 ? "midi" : frNumF(h) + (h === 1 ? " heure" : " heures");
function frTime(h, m) {
  const formal = `Il est ${hourWord(h)}${m ? " " + frNum(m) : ""}.`;
  let hh = h, mm = m, minus = false;
  if (m > 30) { hh = (h + 1) % 24; mm = 60 - m; minus = true; }
  const h12 = hh === 0 || hh === 12 ? hh : hh % 12;
  const name = hourWord(h12);
  const part = mm === 0 ? "" : minus ? (mm === 15 ? " moins le quart" : " moins " + frNum(mm)) : mm === 15 ? " et quart" : mm === 30 ? (h12 === 0 || h12 === 12 ? " et demi" : " et demie") : " " + frNum(mm);
  const period = hh === 0 || hh === 12 ? "" : hh < 12 ? " du matin" : hh < 18 ? " de l'après-midi" : " du soir";
  return { digits: `${pad2(h)}:${pad2(m)}`, formal, informal: `Il est ${name}${part}${period}.` };
}
function frDate(d) {
  const day = d.getDate(), w = FR_WD[d.getDay()], mo = FR_MO[d.getMonth()], y = d.getFullYear();
  return { digits: `${w} ${day === 1 ? "1er" : day} ${mo} ${y}`, words: `C'est ${w} ${day === 1 ? "premier" : frNum(day)} ${mo} ${frNum(y)}.`, es: fmtDay(d, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) };
}

// Temas para hablar un minuto, por nivel (A = principiante/básico, B = intermedio)
const FR_SPEAK = {
  A: [
    { p: "Présente-toi : ton nom, ton âge, ta ville et ton travail.", es: "Preséntate: tu nombre, tu edad, tu ciudad y tu trabajo.", s: ["je m'appelle", "j'ai … ans", "j'habite à", "je travaille"] },
    { p: "Décris ta journée typique.", es: "Describe tu día típico.", s: ["le matin, je…", "l'après-midi", "le soir"] },
    { p: "Qu'est-ce que tu aimes manger et boire ?", es: "¿Qué te gusta comer y beber?", s: ["j'aime", "je n'aime pas", "je préfère"] },
    { p: "Qu'est-ce que tu as fait hier ?", es: "¿Qué hiciste ayer?", s: ["j'ai + participe", "je suis allé(e)"] },
    { p: "Qu'est-ce que tu vas faire ce week-end ?", es: "¿Qué vas a hacer este fin de semana?", s: ["je vais + infinitif", "samedi / dimanche"] },
    { p: "Décris le lieu où tu es maintenant.", es: "Describe el lugar donde estás ahora.", s: ["c'est", "il y a", "il fait"] },
    { p: "Parle de ta famille.", es: "Habla de tu familia.", s: ["mon / ma / mes", "il s'appelle", "elle a … ans"] },
    { p: "Quel temps fait-il aujourd'hui ? Et quelle heure est-il ?", es: "¿Qué tiempo hace hoy? ¿Y qué hora es?", s: ["il fait", "il est … heures"] },
    { p: "Tu es au restaurant. Commande à manger et à boire.", es: "Estás en un restaurante. Pide comida y bebida.", s: ["je voudrais", "s'il vous plaît", "l'addition"] },
    { p: "Parle de ton sport préféré.", es: "Habla de tu deporte favorito.", s: ["j'adore", "je joue / je fais", "le dimanche"] },
    { p: "Où est-ce que tu es allé en vacances ? Raconte.", es: "¿Adónde fuiste de vacaciones? Cuenta.", s: ["je suis allé(e)", "nous avons visité", "c'était"] },
    { p: "Pourquoi est-ce que tu apprends le français ?", es: "¿Por qué aprendes francés?", s: ["j'apprends", "parce que", "je veux"] },
  ],
  B: [
    { p: "Raconte un souvenir d'enfance.", es: "Cuenta un recuerdo de infancia.", s: ["quand j'étais petit", "imparfait + passé composé"] },
    { p: "Compare la vie au Chili et en France.", es: "Compara la vida en Chile y en Francia.", s: ["plus … que", "moins … que", "alors que"] },
    { p: "Qu'est-ce que tu feras l'année prochaine ?", es: "¿Qué harás el próximo año?", s: ["futur simple", "si + présent"] },
    { p: "Si tu pouvais vivre n'importe où, où vivrais-tu ?", es: "Si pudieras vivir en cualquier lugar, ¿dónde vivirías?", s: ["si + imparfait", "conditionnel"] },
    { p: "Parle d'un moment difficile dans ton travail et de ce que tu as appris.", es: "Habla de un momento difícil en tu trabajo y de lo que aprendiste.", s: ["j'ai appris", "c'était", "il fallait"] },
    { p: "Explique ce qu'est un agent d'intelligence artificielle.", es: "Explica qué es un agente de inteligencia artificial.", s: ["ça permet de", "par exemple"] },
    { p: "Quel est ton plus beau voyage ? Pourquoi ?", es: "¿Cuál es tu viaje más bonito? ¿Por qué?", s: ["le plus beau", "nous avons", "c'était"] },
    { p: "Qu'est-ce que la démocratie représente pour toi ?", es: "¿Qué representa la democracia para ti?", s: ["pour moi", "il faut que", "je pense que"] },
  ],
};
