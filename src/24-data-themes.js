/* ===================== Temas de lectura agregados (ideas políticas, líderes, literatura francesa, conflictos) ===================== */
// rules = indicaciones extra que se suman a las reglas de contenido cuando se genera un texto de ese tema
THEMES.push(
  { label: "Ideas políticas", topic: "political ideas and their thinkers: anarchism, socialism, communism, capitalism and liberalism (explain each idea accurately and fairly, with real works, dates and context)", learn: true,
    rules: "Explain each school of thought accurately and fairly, including its main criticisms, so the listener truly understands it; the speaker's own opinions follow his left-wing, democratic values.",
    seeds: [
      "Pierre-Joseph Proudhon and 'What is property?' (1840): the birth of anarchism", "Mikhail Bakunin against Karl Marx in the First International", "Peter Kropotkin and 'Mutual Aid': cooperation in evolution",
      "Emma Goldman: anarchism, freedom and feminism", "the anarchists of Barcelona during the Spanish Civil War", "Adam Smith and 'The Wealth of Nations' (1776): what the invisible hand really means",
      "John Maynard Keynes, the Great Depression and the welfare state", "Friedrich Hayek, Milton Friedman and the rise of neoliberalism", "the Chicago Boys: how the dictatorship turned Chile into a neoliberal laboratory",
      "Karl Marx and Friedrich Engels: 'The Communist Manifesto' (1848)", "'Das Kapital' explained simply: labour, value and exploitation", "Rosa Luxemburg: socialism and democracy",
      "Antonio Gramsci and the idea of cultural hegemony", "José Carlos Mariátegui and a Marxism for Latin America", "the Soviet Union: from the revolution of 1917 to its collapse in 1991",
      "utopian socialism: Robert Owen, Charles Fourier and the first cooperatives", "social democracy in Scandinavia: how the Nordic welfare model was built", "John Locke and natural rights: the roots of liberalism",
      "Montesquieu and the separation of powers", "John Stuart Mill and 'On Liberty'", "John Rawls and 'A Theory of Justice': the veil of ignorance",
      "Thomas Piketty and inequality in the 21st century", "the difference between socialism, communism and social democracy", "capitalism and climate change: can growth be green?",
    ] },
  { label: "Líderes latinoamericanos", topic: "the life, ideas and legacy of Latin American leaders (accurate biography: dates, key decisions and historical context)", learn: true,
    rules: "Be precise with dates and facts. The speaker admires these leaders, but he can mention honest debates about their decisions.",
    seeds: [
      "Salvador Allende: from young doctor to president of Chile", "Salvador Allende and the 'Chilean road to socialism' (1970-1973)", "Salvador Allende's last day and his final speech on 11 September 1973",
      "Emiliano Zapata, the Plan de Ayala and 'Tierra y Libertad'", "Zapata's Morelos: land, peasants and the Mexican Revolution", "Zapata's legacy: from Chinameca in 1919 to the Zapatistas of 1994",
      "Pepe Mujica: from guerrilla and prisoner to president of Uruguay", "Pepe Mujica's philosophy: a sober life, freedom and consumption", "Lula da Silva: from metalworker and union leader to president of Brazil",
      "Lula, Bolsa Família and the fight against hunger in Brazil", "Lula's imprisonment, his release and his return to power", "Pedro Aguirre Cerda: 'gobernar es educar' and the Popular Front",
      "Pedro Aguirre Cerda, CORFO and the industrialisation of Chile", "Pedro Aguirre Cerda, Neruda and the Winnipeg: refuge for Spanish republicans", "Lázaro Cárdenas and Mexico's oil expropriation of 1938",
    ] },
  { label: "Literatura francesa", topic: "French literature: authors, their lives and their works (accurate facts; explain why they still matter)", learn: true,
    seeds: [
      "Victor Hugo and 'Les Misérables'", "Albert Camus, 'L'Étranger' and the absurd", "Albert Camus and 'La Peste'", "Simone de Beauvoir and 'Le Deuxième Sexe'",
      "Jean-Paul Sartre and existentialism", "Voltaire and 'Candide'", "Jean-Jacques Rousseau and 'The Social Contract'", "Molière and French comedy",
      "Émile Zola, 'Germinal' and the miners", "Émile Zola and 'J'accuse…!' in the Dreyfus affair", "Antoine de Saint-Exupéry: a pilot in Argentina and 'Le Petit Prince'",
      "Alexandre Dumas and 'The Three Musketeers'", "Jules Verne and the dream of travel", "Gustave Flaubert and 'Madame Bovary'", "Marcel Proust and the madeleine",
      "Charles Baudelaire and 'Les Fleurs du mal'", "Arthur Rimbaud, the teenage poet", "Annie Ernaux, Nobel Prize in Literature 2022", "Michel de Montaigne and the invention of the essay",
      "Marguerite Duras and 'L'Amant'",
    ] },
  { label: "Conflictos actuales", topic: "current wars and conflicts explained clearly: history, causes, international law and human cost (accurate, verifiable facts)", learn: true,
    rules: "Perspective: the speaker stands firmly with the Palestinian people: their human rights, their self-determination, the end of the occupation and accountability under international law. He is against war: he condemns every attack on civilians, whoever commits it, never dehumanises Israelis or Jewish people, distinguishes governments from peoples and avoids antisemitic stereotypes. On Russia and Ukraine, explain the facts through international law and human rights. Use only verifiable facts and figures; if a recent figure or event is uncertain, stay general.",
    seeds: [
      "Russia's full-scale invasion of Ukraine in February 2022", "Crimea and the Donbas: what happened in 2014", "Ukraine and Russia: a shared and painful history",
      "civilians, refugees and children in the war in Ukraine", "international law: why invading a sovereign country is illegal", "how the war in Ukraine changed Europe",
      "the Nakba of 1948 and the Palestinian refugees", "the occupation of the West Bank, Gaza and East Jerusalem since 1967", "the Israeli settlements and why international law considers them illegal",
      "Gaza: the blockade and the humanitarian catastrophe", "the Palestinian right to self-determination and the debate about one or two states", "the International Court of Justice and Palestine",
      "Chile's Palestinian community and Club Deportivo Palestino", "Mahmoud Darwish, the poet of Palestine", "Palestinians and Israelis who work together for peace and justice",
      "what a just peace would mean for Palestine",
    ] },
);

// Temas para hablar un minuto sobre estos asuntos
EN_SPEAK.push(
  { p: "Which political thinker has influenced you the most, and why?", es: "¿Qué pensador político te ha influido más y por qué?", s: ["has influenced me", "when I first read"] },
  { p: "Explain the difference between socialism, communism and social democracy.", es: "Explica la diferencia entre socialismo, comunismo y socialdemocracia.", s: ["whereas", "the main difference is"] },
  { p: "What would Salvador Allende think of Chile today?", es: "¿Qué pensaría Salvador Allende del Chile de hoy?", s: ["he would think", "if he were alive"] },
  { p: "What can the world learn from Pepe Mujica?", es: "¿Qué puede aprender el mundo de Pepe Mujica?", s: ["he has shown", "we should have"] },
  { p: "Why do you stand with the Palestinian people?", es: "¿Por qué estás del lado del pueblo palestino?", s: ["have been living", "international law says"] },
  { p: "How has the war in Ukraine changed the world?", es: "¿Cómo ha cambiado el mundo la guerra en Ucrania?", s: ["has changed", "since 2022"] },
  { p: "Which French writer would you recommend, and why?", es: "¿Qué escritor francés recomendarías y por qué?", s: ["I would recommend", "I've read"] },
);
FR_SPEAK.A.push(
  { p: "Qui est Salvador Allende ? Présente-le simplement.", es: "¿Quién es Salvador Allende? Preséntalo de forma simple.", s: ["il est né", "il a été président"] },
  { p: "Quel livre français est-ce que tu veux lire ?", es: "¿Qué libro francés quieres leer?", s: ["je veux lire", "c'est un livre de"] },
);
FR_SPEAK.B.push(
  { p: "Pourquoi la cause palestinienne est-elle importante pour toi ?", es: "¿Por qué la causa palestina es importante para ti?", s: ["je pense que", "il faut que", "depuis"] },
  { p: "Quel penseur politique t'a le plus marqué ?", es: "¿Qué pensador político te ha marcado más?", s: ["m'a marqué", "parce que"] },
);
