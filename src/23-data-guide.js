/* ===================== Guía: reglas nuevas y enlaces desde los ejercicios ===================== */
TIPS.en["Gramática"].push(
  ["Participios irregulares: el error 'have went'", "Después de have / has / had siempre va el participio (la 3.ª columna): go → went → gone. 'Went' va solo, sin auxiliar. Practica los más comunes en Practicar → Verbos irregulares.", ["I **went** there yesterday.", "I **have been** there twice.", "She **had seen** it before."]],
  ["for, since y ago", "for + duración (for two years); since + el momento en que empezó (since 2011); ago + past simple para decir cuánto tiempo atrás (two years ago). En español todo es 'hace' o 'desde': pregúntate si dices cuánto dura o cuándo empezó.", ["I've lived here **for** two years.", "I've lived here **since** 2024.", "I moved here two years **ago**."]],
  ["Trampas del español: 'llevo', 'hace', 'es la primera vez'", "Cuando algo llega hasta hoy, el inglés usa present perfect aunque el español use presente. 'Llevo dos años aquí' → I've been here for two years. '¿Hace cuánto esperas?' → How long have you been waiting? 'Es la primera vez que vengo' → It's the first time I've come.", ["I**'ve been** here for two years.", "**How long have you been** waiting?", "It's the first time **I've been** to Paris."]],
);
TIPS.en["Método"].push(
  ["Cómo usar el repaso diario", "Las tarjetas vuelven justo antes de que las olvides. Di la respuesta en voz alta ANTES de mostrarla y califícate con honestidad: 'Otra vez' si no te salió, 'Bien' si te salió con esfuerzo, 'Fácil' si fue inmediato. 5 minutos al día rinden más que una hora a la semana.", []],
  ["Habla aunque te equivoques", "La fluidez sale de producir, no solo de leer. En Hablar → 1 minuto, habla sin parar sobre el tema, después dicta lo que dijiste y deja que te corrija. Tus errores alimentan los ejercicios de los días siguientes.", []],
);
TIPS.fr["Gramática"].push(
  ["Cómo reconocer un verbo regular", "Hay tres familias: -er (parler), que son casi todos y regulares; -ir como finir (nous finissons); -re como rendre (nous rendons). Los más usados (être, avoir, aller, faire, pouvoir, vouloir, venir, prendre) son irregulares: apréndelos con frases. En Practicar → Conjugación tienes la tabla de tus 100 verbos.", ["je **parle** / nous **parlons**", "je **finis** / nous **finissons**", "je **rends** / nous **rendons**"]],
  ["Imparfait: cómo era", "Sirve para describir el pasado y los hábitos (era, había, solía). Toma la forma de 'nous' en presente, quita -ons y agrega -ais, -ais, -ait, -ions, -iez, -aient. Única excepción: être → j'étais. Passé composé = qué pasó; imparfait = cómo era.", ["Quand j'**étais** petit, j'**habitais** dans le nord.", "Il **faisait** chaud et nous **mangions** dehors."]],
  ["Futur simple", "Infinitivo + -ai, -as, -a, -ons, -ez, -ont (je parlerai). Los verbos en -re pierden la e final: je prendrai. Irregulares clave: je serai, j'aurai, j'irai, je ferai, je pourrai, je viendrai.", ["Demain, je **parlerai** avec elle.", "L'année prochaine, nous **irons** au Chili."]],
  ["La hora", "Siempre 'il est' + número + heures: il est trois heures. Los minutos van directo: trois heures dix. En horarios y trenes se usa 24 h (quinze heures vingt). En lo cotidiano: et quart (y cuarto), et demie (y media), moins le quart (menos cuarto), midi, minuit.", ["Il **est** sept heures et demie.", "Le train part **à** quinze heures vingt."]],
  ["c'est o il y a", "c'est = es / esto es (presentar, describir): c'est ma ville. il y a = hay: il y a un marché. il y a + tiempo = hace: il y a deux ans (hace dos años).", ["**C'est** une belle plage.", "**Il y a** beaucoup de touristes.", "Je suis arrivé **il y a** trois jours."]],
);

// Qué regla abrir desde cada categoría de ejercicio o error
const TIP_FOR = {
  en: { waswere: "was / were: la regla de 2 segundos", hashave: "has / have sin pensar", agree: "has / have sin pensar", pperf: "Past simple vs. present perfect", hadpp: "had + participio: el 'pasado del pasado'", beenc: "have been vs. had been", cond: "would have / should have / could have", irreg: "Participios irregulares: el error 'have went'", forsince: "for, since y ago" },
  fr: { pres: "Verbos en -er (el 90%)", pc: "Passé composé: tu pasado principal", aux: "Passé composé: tu pasado principal", fp: "Futur proche: el futuro fácil", imp: "Imparfait: cómo era", fut: "Futur simple", neg: "Negación: ne … pas", article: "Artículos y género", genre: "Artículos y género", conj: "Cómo reconocer un verbo regular" },
};
function findTip(lang, title) {
  for (const list of Object.values(TIPS[lang])) { const t = list.find(x => x[0] === title); if (t) return t; }
  return null;
}
const tipFor = (lang, cat) => TIP_FOR[lang][cat] ? findTip(lang, TIP_FOR[lang][cat]) : null;

/* ---------- Lecturas: temas y largo ---------- */
const SURPRISE = "Sorpréndeme";
const WORDS_EN = { 5: 650, 10: 1300, 15: 1900 };
const FR_WORDS_PER_5 = { "A1": 300, "A1+": 350, "A2": 400, "B1": 550, "B2": 650 };
const wordsFor = (lang, min) => lang === "fr" ? Math.round((FR_WORDS_PER_5[level("fr").k] || 300) * min / 5 / 50) * 50 : WORDS_EN[min];
