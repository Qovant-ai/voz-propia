/* ===== Datos base (bancos de ejercicios, frases, verbos, tips y temas) ===== */
// q: frase con ___ · o: opciones · a: índice correcto · w: por qué · c: categoría
const EN_BANK = [
  { c: "waswere", q: "If I ___ you, I would talk to her today.", o: ["was", "were", "am", "had"], a: 1, w: "Situación hipotética → subjuntivo: 'If I were you'. Con I/he/she en hipótesis se usa 'were'." },
  { c: "waswere", q: "There ___ a lot of people at the meeting yesterday.", o: ["was", "were", "has been", "is"], a: 1, w: "'People' es plural → 'there were'. Truco: mira el sustantivo que viene después de 'there'." },
  { c: "waswere", q: "My team and I ___ working on that project last year.", o: ["was", "were", "have", "been"], a: 1, w: "Sujeto compuesto (my team and I = we) → 'were'." },
  { c: "waswere", q: "Everyone ___ surprised by the results.", o: ["was", "were", "have been", "are"], a: 0, w: "'Everyone', 'nobody', 'someone' son singulares en inglés → 'was'." },
  { c: "hashave", q: "My brother ___ never been to Europe.", o: ["have", "has", "had been", "is"], a: 1, w: "He/she/it → 'has'. 'Has never been' = nunca ha estado (hasta hoy)." },
  { c: "hashave", q: "The people I work with ___ a lot of experience.", o: ["has", "have", "is having", "had been"], a: 1, w: "El sujeto real es 'the people' (plural) → 'have'. Ignora la frase intermedia 'I work with'." },
  { c: "hashave", q: "Neither of the options ___ worked so far.", o: ["have", "has", "had", "were"], a: 1, w: "'Neither of…' toma verbo singular en inglés formal → 'has worked'. 'So far' pide present perfect." },
  { c: "pperf", q: "I ___ this client three times this month.", o: ["met", "have met", "had met", "was meeting"], a: 1, w: "'This month' aún no termina → present perfect: 'have met'." },
  { c: "pperf", q: "I ___ my degree in 2015.", o: ["have finished", "finished", "had finished", "have been finishing"], a: 1, w: "Fecha terminada (in 2015) → past simple SIEMPRE. Nunca 'have finished in 2015'." },
  { c: "pperf", q: "___ you ever ___ in front of a large audience?", o: ["Did / spoke", "Have / spoken", "Had / speak", "Were / spoken"], a: 1, w: "'Ever' = experiencia de vida sin fecha → present perfect: 'Have you ever spoken…?'" },
  { c: "pperf", q: "She ___ here since 2020, and she still loves it.", o: ["lived", "has lived", "had lived", "was living"], a: 1, w: "'Since' + sigue siendo verdad → present perfect: 'has lived'." },
  { c: "hadpp", q: "When I arrived, the meeting ___ already ___.", o: ["has / started", "had / started", "was / start", "have / started"], a: 1, w: "Dos momentos en el pasado: lo que ocurrió ANTES va en past perfect → 'had already started'." },
  { c: "hadpp", q: "I realized I ___ my wallet at home.", o: ["have left", "had left", "was left", "left had"], a: 1, w: "Primero olvidé la billetera, después me di cuenta → 'had left' marca la acción anterior." },
  { c: "hadpp", q: "She told me she ___ never ___ sushi before that night.", o: ["has / tried", "had / tried", "was / trying", "did / tried"], a: 1, w: "Reported speech en pasado + 'before that night' → past perfect: 'had never tried'." },
  { c: "beenc", q: "I ___ learning French for three months now.", o: ["am", "have been", "had been", "was"], a: 1, w: "Empezó en el pasado y continúa hoy ('for… now') → present perfect continuous: 'have been learning'." },
  { c: "beenc", q: "I ___ waiting for an hour when the bus finally came.", o: ["have been", "had been", "was been", "has been"], a: 1, w: "Duración ANTES de otro momento pasado → 'had been waiting'." },
  { c: "beenc", q: "He's tired because he ___ working all night.", o: ["had been", "has been", "was been", "have been"], a: 1, w: "Resultado visible ahora (he's tired) → 'has been working'. He → has." },
  { c: "beenc", q: "They ___ married for ten years when they moved to Canada.", o: ["have been", "had been", "were being", "has been"], a: 1, w: "Estado que duró hasta un punto del pasado (when they moved) → 'had been married'." },
  { c: "cond", q: "If I had known, I ___ you.", o: ["would call", "would have called", "had called", "will call"], a: 1, w: "Tercer condicional: If + had + pp → would have + pp. Hablas de un pasado que no ocurrió." },
  { c: "cond", q: "You ___ told me earlier! Now it's too late.", o: ["should", "should have", "must", "had"], a: 1, w: "Reproche sobre el pasado → 'should have + participio'. Suena /ʃʊdəv/ al hablar." },
  { c: "cond", q: "If she ___ harder, she would have passed.", o: ["studied", "had studied", "has studied", "would study"], a: 1, w: "En la parte del 'if' del tercer condicional va 'had + participio', nunca 'would'." },
  { c: "cond", q: "I wish I ___ more time yesterday.", o: ["have had", "had had", "would have", "has"], a: 1, w: "'Wish' sobre el pasado → past perfect: 'had had' (sí, dos veces: auxiliar + participio de have)." },
];

const EN_PHRASES = [
  { t: "I **would have gone**, but something **came up** at the last minute.", es: "Habría ido, pero surgió algo a último momento.", note: "Patrón para excusarte con naturalidad. 'Would have' suena /wʊdəv/." },
  { t: "It **had been** a long day, so I **decided** to call it a night.", es: "Había sido un día largo, así que decidí dar la noche por terminada.", note: "'Had been' = lo anterior; 'decided' = lo que pasó después." },
  { t: "I**'ve been meaning** to tell you something.", es: "Hace tiempo que quiero decirte algo.", note: "'I've been meaning to…' es muy nativo para introducir un tema pendiente." },
  { t: "By the time I **got** there, everyone **had** already **left**.", es: "Para cuando llegué, todos ya se habían ido.", note: "'By the time' + past simple → past perfect en la otra mitad." },
  { t: "If it **weren't** for my team, I **wouldn't be** where I am today.", es: "Si no fuera por mi equipo, no estaría donde estoy hoy.", note: "'If it weren't for…' — hipótesis presente, siempre 'were'." },
  { t: "I **should have seen** it coming, to be honest.", es: "Debí haberlo visto venir, la verdad.", note: "Should have + participio: reflexión sobre el pasado." },
  { t: "We **were** supposed to meet at six, but he **was** running late.", es: "Se suponía que nos veríamos a las seis, pero él venía atrasado.", note: "We → were · he → was. 'Be supposed to' es clave para planes." },
  { t: "It's the best decision I**'ve** ever **made**.", es: "Es la mejor decisión que he tomado.", note: "Superlativo + 'ever' → present perfect." },
];

// Los 100 verbos franceses más usados (orden aproximado de frecuencia)
const FR_VERBS = "être:ser/estar|avoir:tener|faire:hacer|dire:decir|pouvoir:poder|aller:ir|voir:ver|vouloir:querer|venir:venir|devoir:deber|prendre:tomar|trouver:encontrar|donner:dar|falloir:hacer falta|parler:hablar|mettre:poner|savoir:saber|passer:pasar|regarder:mirar|aimer:amar/gustar|croire:creer|demander:pedir/preguntar|rester:quedarse|répondre:responder|entendre:oír|penser:pensar|arriver:llegar|connaître:conocer|devenir:volverse|sentir:sentir|sembler:parecer|tenir:sostener|comprendre:comprender|rendre:devolver|attendre:esperar|sortir:salir|vivre:vivir|entrer:entrar|porter:llevar|chercher:buscar|revenir:volver|appeler:llamar|mourir:morir|partir:irse|jeter:tirar|suivre:seguir|écrire:escribir|montrer:mostrar|tomber:caer|ouvrir:abrir|arrêter:parar|perdre:perder|commencer:empezar|paraître:parecer|marcher:caminar|lever:levantar|permettre:permitir|asseoir:sentar|écouter:escuchar|monter:subir|apercevoir:percibir|recevoir:recibir|servir:servir|finir:terminar|rire:reír|crier:gritar|jouer:jugar|tourner:girar|garder:guardar|reconnaître:reconocer|quitter:dejar|manger:comer|courir:correr|continuer:continuar|oublier:olvidar|descendre:bajar|cacher:esconder|poser:colocar|tirer:tirar de|présenter:presentar|ajouter:añadir|agir:actuar|retrouver:reencontrar|offrir:ofrecer|apprendre:aprender|tuer:matar|retourner:regresar|rencontrer:conocer a alguien|envoyer:enviar|dormir:dormir|pousser:empujar|rappeler:recordar|lire:leer|changer:cambiar|compter:contar|occuper:ocupar|travailler:trabajar|expliquer:explicar|acheter:comprar|boire:beber"
  .split("|").map(s => { const [fr, es] = s.split(":"); return { fr, es }; });

const FR_DAYS = [
  ["lundi", "lunes", "Le **lundi**, je commence à neuf heures.", "Los lunes empiezo a las nueve.", "luhn-DI · 'un' nasal, no pronuncies la n"],
  ["mardi", "martes", "**Mardi**, j'ai mon cours de français.", "El martes tengo mi clase de francés.", "mar-DI · r suave de garganta"],
  ["mercredi", "miércoles", "On se voit **mercredi** soir ?", "¿Nos vemos el miércoles por la noche?", "mer-cre-DI"],
  ["jeudi", "jueves", "**Jeudi** prochain, je vais chez le médecin.", "El próximo jueves voy al médico.", "zheu-DI · 'eu' con labios redondos"],
  ["vendredi", "viernes", "Le **vendredi**, je finis tôt.", "Los viernes termino temprano.", "van-dre-DI · 'en' nasal"],
  ["samedi", "sábado", "**Samedi**, je fais les courses.", "El sábado hago las compras.", "sam-DI · la 'e' casi desaparece"],
  ["dimanche", "domingo", "Le **dimanche**, je me repose en famille.", "Los domingos descanso en familia.", "di-MANSH · 'an' nasal + sh final"],
].map(([w, wes, t, es, note]) => ({ tag: w + " · " + wes, t, es, note }));
const FR_MONTHS = [
  ["janvier", "enero", "Mon anniversaire est en **janvier**.", "Mi cumpleaños es en enero.", "zhan-VIÉ · r final muda"],
  ["février", "febrero", "En **février**, il fait très froid à Paris.", "En febrero hace mucho frío en París.", "fé-vri-É"],
  ["mars", "marzo", "Je commence un nouveau travail en **mars**.", "Empiezo un nuevo trabajo en marzo.", "MARS · aquí la s SÍ suena"],
  ["avril", "abril", "Nous partons en vacances le dix **avril**.", "Nos vamos de vacaciones el diez de abril.", "a-VRIL"],
  ["mai", "mayo", "Le premier **mai** est un jour férié.", "El primero de mayo es feriado.", "MÈ · suena como 'mé' abierta"],
  ["juin", "junio", "L'été commence en **juin**.", "El verano empieza en junio.", "ZHÜ-èn · una sola sílaba nasal"],
  ["juillet", "julio", "Le quatorze **juillet**, c'est la fête nationale.", "El catorce de julio es la fiesta nacional.", "zhüi-YÈ · t muda"],
  ["août", "agosto", "En **août**, beaucoup de Français sont en vacances.", "En agosto muchos franceses están de vacaciones.", "UT (o solo 'u') · la a no suena"],
  ["septembre", "septiembre", "Les cours reprennent en **septembre**.", "Las clases se retoman en septiembre.", "sep-TAMBR · la p sí suena"],
  ["octobre", "octubre", "Je suis né le trois **octobre**.", "Nací el tres de octubre.", "ok-TOBR"],
  ["novembre", "noviembre", "Il pleut souvent en **novembre**.", "Llueve a menudo en noviembre.", "no-VAMBR"],
  ["décembre", "diciembre", "En **décembre**, on fête Noël.", "En diciembre celebramos Navidad.", "dé-SAMBR"],
].map(([w, wes, t, es, note]) => ({ tag: w + " · " + wes, t, es, note }));

const FR_NUM_CTX = [
  n => [`J'ai ${n} ans.`, `Tengo ${n} años.`], n => [`Ça coûte ${n} euros.`, `Cuesta ${n} euros.`],
  n => [`J'habite au numéro ${n}.`, `Vivo en el número ${n}.`], n => [`Il y a ${n} personnes dans la salle.`, `Hay ${n} personas en la sala.`],
  n => [`Ouvrez le livre à la page ${n}.`, `Abran el libro en la página ${n}.`], n => [`Le bus ${n} arrive dans cinq minutes.`, `El bus ${n} llega en cinco minutos.`],
  n => [`Il me reste ${n} kilomètres.`, `Me quedan ${n} kilómetros.`], n => [`Ma chambre est la ${n}.`, `Mi habitación es la ${n}.`],
];
const FR_NUM_TIPS = {
  70: "70–79 = soixante + 10…19 (60+11 = soixante et onze).",
  80: "80–99 = quatre-vingt (4×20) + 1…19. Solo '80' exacto lleva s: quatre-vingts.",
  21: "21, 31, 41, 51, 61 llevan 'et un'; desde 81 ya no: quatre-vingt-un.",
  6: "six/dix: la x suena 's' al final de frase, 'z' ante vocal (dix ans → di-zan) y es muda ante consonante.",
};

// Guía: [título, explicación, [ejemplos]]
const TIPS = {
  en: {
    "Gramática": [
      ["was / were: la regla de 2 segundos", "I, he, she, it → was. You, we, they → were. Antes de hablar, identifica el sujeto REAL (no la palabra más cercana). Excepción: hipótesis → siempre 'were' (If I were…, I wish I were…).", ["The results of the test **were** great.", "If I **were** you, I'd wait.", "Everyone **was** there."]],
      ["has / have sin pensar", "Solo he/she/it (y todo lo que puedas reemplazar por esos) usa 'has'. Todo lo demás 'have'. Prueba mental: reemplaza el sujeto por un pronombre.", ["My boss (= he) **has** called.", "My boss and his team (= they) **have** called."]],
      ["Past simple vs. present perfect", "¿Dices CUÁNDO (yesterday, in 2019, last week)? → past simple. ¿No dices cuándo, o el periodo sigue abierto (today, this year, ever, never, yet, since, for… now)? → have/has + participio.", ["I **saw** her yesterday.", "I**'ve seen** her twice this week.", "I**'ve worked** here since 2021."]],
      ["had + participio: el 'pasado del pasado'", "Úsalo solo cuando hay DOS momentos pasados y quieres marcar cuál fue antes. Si cuentas en orden cronológico, past simple basta.", ["When I called, she **had** already **left**.", "I **had** never **seen** snow before that trip."]],
      ["have been vs. had been", "have/has been + -ing: algo que empezó antes y sigue ahora. had been + -ing: algo que venía ocurriendo hasta un punto del pasado. Pregúntate: ¿el punto de referencia es AHORA o ENTONCES?", ["I**'ve been studying** for two hours. (sigo)", "I **had been studying** for two hours when you called. (entonces)"]],
      ["would have / should have / could have", "Modal + have + participio = hablar de pasados que no ocurrieron. 'Have' nunca cambia a 'has' ni 'had' aquí.", ["I **would have helped** you.", "She **could have told** me.", "We **should have left** earlier."]],
    ],
    "Pronunciación": [
      ["Las tres -ed", "Tras sonido t/d → /ɪd/ (wanted, needed). Tras sonido sordo (p, k, f, s, sh, ch) → /t/ (worked, stopped). El resto → /d/ (played, called). Nunca digas 'work-ed' con sílaba extra.", ["worked /wɜːrkt/", "decided /dɪˈsaɪdɪd/", "lived /lɪvd/"]],
      ["Contracciones que dan fluidez", "Los nativos casi nunca dicen 'I have been' completo. Practica: I've /aɪv/, he's, we'd, would've /ˈwʊdəv/, should've, could've. Al leer en voz alta, contrae.", ["I**'ve** been there.", "She**'d** already left.", "I **would've** called."]],
      ["Linking: une las palabras", "Consonante final + vocal inicial se pegan: 'had_a', 'was_in', 'been_on'. Lee frases como una sola palabra larga.", ["I had‿a great time.", "It was‿an‿amazing day."]],
      ["El acento de la frase", "El inglés se mide por palabras acentuadas (sustantivos, verbos principales, adjetivos). Auxiliares como have/has/was/were/been se dicen débiles y rápidos: 'been' → /bɪn/, 'was' → /wəz/.", ["I've **been WORKING** all **DAY**."]],
      ["th, v y la schwa", "'th' sordo (think): lengua entre dientes + aire. 'th' sonoro (this): igual, con vibración. 'v' ≠ 'b': dientes sobre labio inferior. La schwa /ə/ es el sonido más común: relajado, como 'a' muda (about, problem).", ["**Th**ey **th**ought **th**e **v**iew was **v**ery good."]],
    ],
    "Método": [
      ["Cómo leer para ganar fluidez", "1) Lee en silencio y entiende. 2) Lee en voz alta fijándote en las palabras en color (los tiempos verbales). 3) Toca ▶ en un párrafo, escucha e imita el ritmo (shadowing). 4) Cierra y cuenta con tus palabras lo que leíste, en 3 frases. Repetir un texto 2–3 veces vale más que leer 3 textos distintos.", []],
      ["Por qué primera persona", "Al leer 'I've been…', tu cerebro ensaya frases que TÚ dirías. Es práctica de producción disfrazada de lectura: automatiza bloques completos (chunks) en vez de reglas.", []],
    ],
  },
  fr: {
    "Gramática": [
      ["être y avoir: los dos pilares", "être: je suis, tu es, il/elle est, nous sommes, vous êtes, ils/elles sont. avoir: j'ai, tu as, il/elle a, nous avons, vous avez, ils/elles ont. Memorízalos en frases, no en tablas.", ["Je **suis** fatigué.", "J'**ai** faim. (tengo hambre)", "Ils **ont** deux enfants."]],
      ["Verbos en -er (el 90%)", "Quita -er y agrega: -e, -es, -e, -ons, -ez, -ent. ¡Ojo! -e, -es, -ent NO suenan: parle, parles, parlent suenan igual /parl/.", ["Je **parle** français.", "Nous **parlons** un peu.", "Ils **parlent** vite."]],
      ["Passé composé: tu pasado principal", "avoir (o être) en presente + participio. -er → -é. Con être van los verbos de movimiento/cambio (aller, venir, arriver, partir, entrer, sortir, naître, mourir, rester…) y los reflexivos; el participio concuerda.", ["J'**ai mangé** une pizza.", "Je **suis allé(e)** au cinéma.", "Elle **est arrivée** hier."]],
      ["Futur proche: el futuro fácil", "aller en presente + infinitivo. Igual que 'voy a…' en español. Con esto ya puedes hablar del futuro sin aprender otra conjugación.", ["Je **vais travailler** demain.", "On **va manger** ensemble ?"]],
      ["Negación: ne … pas", "El verbo conjugado va en medio. Al hablar, el 'ne' casi siempre desaparece.", ["Je **ne** comprends **pas**.", "Je **n'**ai **pas** mangé.", "(oral) Je sais pas."]],
      ["Artículos y género", "le/la/les (el/la/los), un/une/des (un/una/unos), du/de la (algo de). Aprende cada sustantivo CON su artículo: 'la voiture', no 'voiture'.", ["Je bois **du** café.", "J'ai **une** question."]],
      ["Días, meses y fechas", "Sin mayúscula. 'lundi' = este lunes; 'le lundi' = todos los lunes. Meses con 'en': en mars. Fechas: le + número + mes (le 3 mai); solo el 1 es ordinal: le premier mai.", ["**Le** lundi, je travaille.", "Je pars **le** quinze août."]],
    ],
    "Pronunciación": [
      ["Consonantes finales mudas", "Casi toda consonante final no suena: petit, grand, trop, vous, parlent. Suelen sonar las de 'CaReFuL': c, r, f, l (avec, bonjour, neuf, il).", ["peti(t) · gran(d) · beaucou(p)", "ave**c** · neu**f** · i**l**"]],
      ["La liaison", "Una consonante muda revive ante vocal: vous‿avez (vu-za-vé), les‿amis (lé-za-mi), un‿an. Clave con números: deux‿ans, trois‿heures, dix‿euros (s/x suenan z).", ["Nous‿avons deux‿enfants.", "Il est six‿heures."]],
      ["Vocales nasales", "an/en = /ɑ̃/ (boca abierta), on = /ɔ̃/ (labios redondos), in/ain/un = /ɛ̃/ (sonrisa). El aire sale por la nariz y la n/m NO se pronuncia.", ["enf**an**t · b**on** · v**in** · c**inq**"]],
      ["u ≠ ou", "'ou' = u española (vous, nous). 'u' = pon labios de 'u' y di 'i' (tu, rue, salut). Confundirlas cambia el significado: dessus (encima) / dessous (debajo).", ["t**u** / t**ou**t", "r**ue** / r**oue**"]],
      ["La r, eu y la e muda", "r: se hace en la garganta, suave, como gárgara ligera. 'eu' (deux, peu): labios redondos diciendo 'e'. La 'e' sin tilde al final no suena: table → /tabl/.", ["Je v**eu**x d**eu**x **r**oses **r**ouges."]],
      ["Números traicioneros", "70 = soixante-dix (60+10), 80 = quatre-vingts (4×20), 90 = quatre-vingt-dix (4×20+10). cinq, six, huit, dix pierden su consonante final ante consonante: six livres → 'si livr'.", ["77 = soixante-dix-sept", "92 = quatre-vingt-douze"]],
    ],
    "Método": [
      ["Cómo usar las lecturas", "1) Lee el párrafo en francés intentando entender. 2) Muestra la traducción solo para confirmar. 3) Toca ▶, escucha, y repite en voz alta imitando. 4) Vuelve a leerlo sin ayuda. A nivel básico, repetir el mismo texto varios días es lo más eficiente.", []],
      ["Frases, no palabras sueltas", "Tu cerebro retiene mejor 'J'ai trente ans' que 'trente = 30'. Por eso aquí números, días y verbos siempre aparecen dentro de frases reales que puedes reutilizar.", []],
    ],
  },
};

// Temas de lectura. `seeds` = subtemas que rotan; los subtemas personales viven en la base de datos (state/themes).
const THEMES = [
  { label: "Tecnología e IA", topic: "technology, AI and software development", learn: true, seeds: ["explaining to a skeptical CEO what an AI agent actually does","Project Cybersyn: Allende's cybernetic dream in 1970s Chile","Alan Turing and the birth of computing","Ada Lovelace, the first programmer","the history of the internet from ARPANET to today","open source versus big tech","AI and the future of work: what unions should demand","privacy, data and democracy","the myths of Silicon Valley","how large language models work, explained simply","automating a process and giving people their time back","the history of the smartphone","working remotely as a developer while travelling"] },
  { label: "Historia universal", topic: "world history (make it genuinely educational: real names, dates, causes, consequences)", learn: true, seeds: ["the French Revolution","the fall of the Roman Republic","the Industrial Revolution and the birth of the labour movement","the Paris Commune of 1871","the Spanish Civil War","the Mexican Revolution","the fall of the Berlin Wall","Athens and the invention of democracy","the Haitian Revolution","decolonisation in Africa","the Cuban Missile Crisis","the Silk Road","the Maya civilisation and Yucatán","King Leopold II and the Congo","May 1968 in France","the Russian Revolution","the Marshall Plan and postwar Europe","the end of apartheid and Nelson Mandela","the Byzantine Empire","the Aztec Empire and Tenochtitlan","the Greek War of Independence","the Weimar Republic","the civil rights movement in the United States","the Ottoman Empire"] },
  { label: "Historia de Chile", topic: "Chilean history (accurate facts, names and dates)", learn: true, seeds: ["the saltpetre era and the Santa María School massacre in Iquique, 1907","Salvador Allende and the Unidad Popular","the nationalisation of copper in 1971","the 1973 coup and the dictatorship","the 1988 plebiscite and the return to democracy","the Mapuche people and the occupation of the Araucanía","Valparaíso's golden age before the Panama Canal","Gabriela Mistral and Pablo Neruda","the 2011 student movement","the 2019 social uprising and the constitutional processes","the great Valdivia earthquake of 1960","the history of the volunteer firefighters of Santiago","Bernardo O'Higgins and independence","Balmaceda and the civil war of 1891","Violeta Parra, Víctor Jara and the Nueva Canción","the Frei Montalva years and agrarian reform","the Vicaría de la Solidaridad and human rights","Rapa Nui and its history"] },
  { label: "Política", topic: "politics and current-affairs analysis for Chile and the world", seeds: ["why democracy needs strong institutions","the legacy of Pepe Mujica","Lula and the resilience of Brazilian democracy","the rise of the far right in Latin America and Europe","memory, human rights and why 'nunca más' matters","the pension debate in Chile","disinformation and politics on social media","lithium, climate and development in Chile","Boric's government: achievements and lessons","feminism and the new left","Milei's economic experiment in Argentina, seen critically","Trumpism and what it means for Latin America","the rule of law and why it protects everyone","the relationship between governments and social movements","burnout in public service","the future of the left after Boric","Europe, migration and the far right"] },
  { label: "Cultura general", topic: "general culture (educational, with real facts)", learn: true, seeds: ["the Latin American Boom: García Márquez, Cortázar, Vargas Llosa","the history of mezcal","how wine arrived in Chile","French cuisine for beginners","Greek mythology in everyday language","Impressionism in Paris","Mexican muralism: Rivera, Orozco, Siqueiros","Frida Kahlo","Camus and the absurd","the history of beer","Van Gogh","the science of burnout and rest","Greek philosophy: Socrates, Plato, Aristotle","the Bauhaus","jazz and its political history","Roberto Bolaño","the Olympic Games from Athens to today","how coffee changed the world"] },
  { label: "Viajes", topic: "travel, places and hotels (real details of the places)", seeds: ["Mazunte, San Agustinillo and Puerto Escondido","Oaxaca's markets and mezcal","Holbox and the Riviera Maya","Valladolid and the cenotes","Guanajuato, Taxco and Tepoztlán","Chiapas and San Cristóbal de las Casas","El Calafate and the Perito Moreno glacier","Ushuaia, the end of the world","Buenos Aires cafés and bookshops","Salta and Mendoza","Río, Ilha Grande and Angra dos Reis","Pipa, Natal and Búzios","Marseille, Lyon and Aix-en-Provence","Athens, the Peloponnese and Thessaloniki","Berlin's history walks","Dortmund on match day","Brussels","Madrid, Barcelona and Mallorca","Valparaíso's hills and funiculars","travelling as a couple: the good and the hard parts","choosing hotels and hostels on a long trip"] },
  { label: "Fútbol", topic: "football: history, culture and analysis", seeds: ["Bill Shankly, Bob Paisley and Liverpool's socialist roots","You'll Never Walk Alone and the fight for Hillsborough justice","the Klopp era at Liverpool","Universidad de Chile: the Ballet Azul","La U and the 2011 Copa Sudamericana","Borussia Dortmund and the Yellow Wall","St. Pauli: football with values","working-class clubs: Livorno, Rayo Vallecano, Celtic","Sócrates and the Corinthians Democracy","Chile's Copa América titles in 2015 and 2016","Marcelo Bielsa's influence","the Estadio Nacional in 1973: football and dictatorship","gegenpressing explained","state-owned clubs and the business of modern football","Istanbul 2005","the Superclásico in Buenos Aires","women's football and its fight for equality"] },
  { label: "Mi vida", topic: "the speaker's own life and experiences (use the profile facts)", seeds: ["a typical day in my life","a person who changed my life","a difficult decision I made","my job and what I like about it","a place where I felt at home","my goals for the next five years","a habit I am proud of","a mistake I learned from","how I spend my weekends","my favourite food and drinks","a moment when I felt really proud","what I miss about my home country"] },
];
