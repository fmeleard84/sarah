/**
 * Textes de l'interface, FR et EN.
 *
 * Règles de casse Morning Cards (verrouillées le 7 juillet) :
 * - Titres : Instrument Serif romain, sans majuscule, avec point.
 * - Titres émotionnels, discours direct : Instrument Serif, sans majuscule, sans point.
 * - Corps de marque : Instrument Sans, tout en minuscules, avec point.
 * - Corps fonctionnel : Instrument Sans, casse normale, avec point.
 * - Boutons en casse de phrase ; les petites capitales restent aux légendes.
 * Jamais de tiret cadratin. Pas d'emoji. Le FR et l'EN sont des expressions
 * distinctes, pas des traductions mot à mot.
 */

export type Locale = "fr" | "en";
export const LOCALES: Locale[] = ["fr", "en"];
export const isLocale = (v: unknown): v is Locale => v === "fr" || v === "en";

const fr = {
  brand: "morning cards",
  signature: "une carte. une conversation. un insight.",
  nav: { draw: "Tirer", decks: "Decks", journal: "Journal", me: "Moi" },

  welcome: {
    title: "tu sais déjà. on t'aide à voir",
    body: "une carte. une conversation. un insight.",
    pick: "choisis ton deck.",
    pickHelp: "Chaque deck a son univers. Choisis celui qui t'attire, tu pourras en changer.",
    cta: "Tirer avec ce deck",
    login: "J'ai déjà un compte",
  },

  home: {
    myDeck: "Mon deck",
    hello: (name: string | null) => (name ? `bonjour, ${name.toLowerCase()}` : "bonjour"),
    rhythm: { 1: "un moment. une carte.", 3: "trois cartes. un fil.", 5: "cinq cartes. une traversée." } as Record<number, string>,
    spread: (n: number) => (n === 1 ? "1 carte" : `${n} cartes`),
    hold: "Pose ton doigt sur la carte.",
    reveal: "révèle son message",
    next: "carte suivante",
    deck: (name: string) => `Tu tires avec ${name}.`,
    exploration: (d: number) => `Offre Exploration · ${d} jour${d > 1 ? "s" : ""} restant${d > 1 ? "s" : ""}`,
    early: (d: number) => `Early adopter · accès illimité, ${d} jour${d > 1 ? "s" : ""} restant${d > 1 ? "s" : ""}`,
    lockedSpread: "Ce tirage est disponible avec Ritual et Clarity.",
    transition: "un geste. un insight.",
  },

  conv: {
    cardLabel: "La carte",
    youLabel: "Toi",
    placeholder: "Écris ce qui te traverse…",
    drawCard: "Tirer une carte",
    pickCard: "choisis ta carte",
    pickHelp: "Laisse ta main décider.",
    thinking: "",
    error: "la conversation s'est interrompue.",
    errorBody: "Le message n'a pas pu être envoyé. Réessaie dans un instant.",
    retry: "Réessayer",
    newDraw: "Nouveau tirage",
    history: "Voir mon journal",
    limit: "Cette conversation a atteint sa longueur maximale.",
    back: "Retour",
    notSaved: "Cet échange n'est pas encore gardé.",
    keepIt: "Le garder",
  },

  wall: {
    title: "crée ton compte pour continuer.",
    body: "Sans compte, cet échange sera perdu quand tu partiras. Crée un compte pour le garder.",
    firstName: "Prénom",
    email: "Email",
    password: "Mot de passe",
    birthdate: "Date de naissance",
    birthdateHelp: "Pour calculer ton chemin de vie.",
    consent: "J'accepte les conditions d'utilisation et la politique de confidentialité de Morning Cards.",
    cta: "Continuer",
    reassure: "Pas de carte bancaire · Désinscription à tout moment.",
    already: "Déjà un compte ? Se connecter",
    keepTitle: "garde cet échange.",
    keepBody: "Sans compte, il disparaît quand tu pars. Avec un compte, tu le retrouves dans ton journal, avec ta carte.",
    offerTitle: "ton offre exploration est activée",
    offerBody: "une carte par jour pendant 5 jours. gratuit.",
    earlyTitle: "tu fais partie des cent premières",
    earlyBody: "7 jours d'accès illimité : tous les decks, ton deck perso, autant de cartes que tu veux. gratuit.",
    offerCta: "Reprendre ma conversation",
  },

  auth: {
    loginTitle: "on t'attendait.",
    loginSub: "Tes cartes sont là.",
    login: "Se connecter",
    forgot: "Mot de passe oublié ?",
    noAccount: "Pas encore inscrite ? Commencer",
    signupTitle: "crée ton compte.",
    signupSub: "Une minute. Et c'est parti.",
    resetTitle: "nouveau mot de passe.",
    resetSub: "Entre ton email, on t'envoie un lien.",
    resetSent: "Si un compte existe pour cet email, un lien vient de partir.",
    send: "Envoyer le lien",
    newPassword: "Nouveau mot de passe",
    save: "Enregistrer",
    showPassword: "Afficher",
    hidePassword: "Masquer",
    invalid: "Email ou mot de passe incorrect.",
    exists: "Un compte existe déjà avec cet email.",
    weak: "Le mot de passe doit faire au moins 8 caractères.",
    generic: "Une erreur est survenue. Réessaie.",
    logout: "Se déconnecter",
  },

  decks: {
    myDeck: "mon deck.",
    myDeckLink: (n: number, total: number) => `Mon deck · ${n}/${total}`,
    myDeckCount: (n: number, total: number) => `${n} carte${n > 1 ? "s" : ""} sur ${total}`,
    myDeckHelp: "Compose ton deck : choisis une version de chaque arcane, dans tous les decks.",
    pickVersion: "Choisis la version qui te parle.",
    addToMine: "Ajouter à mon deck",
    removeFromMine: "Retirer de mon deck",
    toastAdded: "Ajoutée à ton deck.",
    toastRemoved: "Retirée de ton deck.",
    drawWithMine: "Tirer avec mon deck",
    toastMine: "Tu tires avec ton deck à partir de maintenant.",
    mineLocked: "Le tirage avec ton deck est disponible avec Ritual et Clarity.",
    incomplete: (n: number) => `Complète ton deck pour tirer avec lui : il manque ${n} carte${n > 1 ? "s" : ""}.`,
    columns: (n: number) => `Afficher sur ${n} colonnes`,
    title: "decks.",
    all: "Tous",
    favorites: "Favoris",
    cards: (n: number) => `${n} cartes`,
    drawWith: "Tirer avec ce deck",
    active: "Deck actif",
    toastActive: (name: string) => `Tu tires avec ${name} à partir de maintenant.`,
    locked: "Ce deck n'est pas disponible avec ton offre actuelle.",
    seePlans: "Voir les offres",
    otherCards: "les autres cartes du deck.",
    otherDecks: "cette carte dans les autres decks.",
    inspired: (a: string) => `inspiré de ${a}`,
  },

  journal: {
    title: "journal.",
    empty: "Ton journal est vide.",
    emptyBody: "Chaque tirage y laisse une trace.",
    week: "Cette semaine",
    month: "Ce mois",
    all: "Tout",
    favorites: "Favoris",
    untitled: "Conversation",
  },

  me: {
    tabs: { drawings: "Tirages", you: "Toi", settings: "Réglages" },
    ranges: { month: "Ce mois", year: "Cette année", all: "Tout" },
    noDraw: "Rien sur cette période.",
    seeMore: "Voir plus",
    worldTitle: "ton monde.",
    worldHelp: "Ce que tu écris ici aide l'IA à mieux te comprendre. Rien n'est obligatoire.",
    world: { love: "Amour", work: "Travail", family: "Famille", health: "Santé", money: "Argent", growth: "Évolution personnelle" },
    theme: "Apparence",
    themes: { light: "Clair", dark: "Sombre", system: "Auto" },
    password: "Changer mon mot de passe",
    manageBilling: "Gérer mon abonnement",
    support: "Aide",
    contact: "Nous écrire",
    title: "toi.",
    stats: (cards: number, convs: number) => `${cards} carte${cards > 1 ? "s" : ""} tirée${cards > 1 ? "s" : ""} · ${convs} conversation${convs > 1 ? "s" : ""}`,
    mostDrawn: "tes cartes les plus tirées.",
    you: "toi",
    lifePath: "chemin de vie",
    lifePathHelp: "Calculé à partir de ta date de naissance.",
    account: "Compte",
    plan: "Offre",
    language: "Langue",
    notifications: "Recevoir mes éclairages quotidiens par email",
    save: "Enregistrer",
    saved: "Enregistré.",
    changePlan: "Voir les offres",
  },

  plans: {
    paid: "Merci, ton paiement est bien reçu.",
    title: "va plus loin.",
    sub: "Tu as atteint ta limite. Mais il y a plus à explorer.",
    current: "Ton offre",
    perMonth: "/mois",
    once: "une fois",
    choose: "Choisir",
    soon: "Le paiement ouvre très bientôt.",
    failed: "Le paiement n'a pas pu s'ouvrir. Réessaie dans un instant.",
    continue: "Continuer sans",
    names: { exploration: "Exploration", early: "Early adopter", intention: "Intention", ritual: "Ritual", clarity: "Clarity" },
    features: {
      exploration: ["Une conversation par jour", "Une carte par tirage", "5 jours"],
      early: ["Conversations illimitées", "Jusqu'à 5 cartes par tirage", "Tous les decks", "Ton deck personnalisé", "7 jours"],
      intention: ["Un tirage par semaine", "Une carte par tirage", "Sans limite de durée"],
      ritual: ["Une conversation par jour", "Jusqu'à 3 cartes par tirage", "Tous les decks", "Ton deck personnalisé"],
      clarity: ["Conversations illimitées", "Jusqu'à 5 cartes par tirage", "Tous les decks", "Ton deck personnalisé"],
    },
    pack3: "3 cartes",
    single: "1 carte",
    packHelp: "À utiliser quand tu veux.",
    quotaReached: "Ton tirage du jour est fait.",
    quotaReachedWeek: "Ton tirage de la semaine est fait.",
    quotaBody: "Reviens demain, ou va plus loin avec Ritual ou Clarity.",
  },

  // Landing de pré-lancement (brief de Sarah, maquettes du 6 novembre). Casse
  // propre à la landing : titres en capitales Cormorant, mise en forme par CSS.
  landing: {
    metaTitle: "Morning Cards · Tu sais déjà. On t'aide à voir.",
    metaDescription: "Une carte. Une conversation. Un insight. Le tarot post-mystique, pour y voir clair sur ce que tu ressens déjà.",
    wordmark: "Morning Cards",
    navJoin: "Rejoindre les early adopters",
    navJoinShort: "Rejoindre",
    navLogin: "Connexion",
    heroTitle: "Tu sais déjà. On t'aide à voir.",
    heroTitleLines: ["Tu sais", "déjà.", "On t'aide", "à voir."],
    heroSub: "Une carte. Une conversation. Un insight.",
    cta: "Je suis une early adopter.",
    heroMicro: "Accès illimité gratuit · 7 jours au lancement",
    ruptureTitle: "Le tarot. Pas comme tu l'imagines.",
    ruptureSub: "Post-mystique. D'aujourd'hui.",
    moments: [
      "Il est bien. Alors pourquoi tu ne vibres pas ?",
      "Quelque chose doit changer. Tu ne sais pas encore quoi.",
      "Tout le monde est là. Et toi tu es ailleurs.",
    ],
    momentsAlt: ["Une femme blottie contre son compagnon, le regard ailleurs", "Une femme seule sous un ciel bleu, les yeux presque fermés", "Une femme en soirée, le regard perdu"],
    transition: "Quand tout est flou, un tirage suffit.",
    now: "Maintenant.",
    momentsNext: "Moment suivant",
    earlyBand: "Les 100 premières inscrites reçoivent 7 jours d'accès illimité au lancement.",
    earlyBandMicro: "Ta première carte tout de suite, sans compte.",
    howTitle: "Comment ça marche.",
    steps: [
      { title: "La carte", body: "Une arcane apparaît. Elle pose un cadre. Une ambiance, une direction, parfois juste une sensation. De là, quelque chose commence." },
      { title: "La conversation", body: "Tu partages ce que tu as en tête, ou sur le cœur. Et tu approfondis." },
      { title: "L'insight", body: "Tu repars avec quelque chose de net. Une décision, une direction, un angle. Quelque chose qui t'appartient." },
    ],
    demoDrawn: "tu as tiré",
    demoCard: "Les Amoureux",
    demoMeta: "Les Amoureux · VI · deck",
    demoReveal: "Découvrir ta carte",
    demoTime: "tiré 9:41 · deck",
    demoLabel: "Morning Cards",
    demoQuote: "« Un choix n'est pas une perte. C'est une direction que tu reconnais. »",
    demoReply: "Tu n'hésites pas par manque d'amour. Tu hésites parce qu'une partie de toi sait déjà, et attend que tu l'écoutes.",
    demoAsk: "et si je me trompe ?",
    clarity: "Ce n'est pas de la voyance. C'est de la clarté.",
    decksTitle: "Les decks.",
    decksSub: "Choisis l'esthétique qui te parle. Change quand tu veux. Construis ton deck perso.",
    decksExclusive: "Decks exclusifs. Éditions limitées.",
    proofTitle: "Elles l'utilisent.",
    proofSub: "Elles ont testé en avant-première.",
    quotes: [
      { text: "J'avais tourné en rond pendant trois jours. En dix minutes, j'avais mon angle.", who: "Clara, 28 ans" },
      { text: "Je savais déjà la réponse. La carte m'a aidée à la voir.", who: "Emma, 32 ans" },
      { text: "Beaucoup plus concret que ce que j'attendais.", who: "Léa, 30 ans" },
    ],
    artTitle: "L'art du tirage.",
    artBody: "Chaque deck est une œuvre. Des univers visuels pensés pour créer une résonance. L'image fait un travail que les mots ne font pas encore. De là, la conversation peut commencer.",
    artCta: "Être parmi les premières",
    ritualLabel: "Le rituel du matin",
    ritualTitle: "Et toi, comment tu commences ta journée ?",
    ritualBody: "Une carte chaque matin. Un fil conducteur sur ta semaine. Jour après jour, tu te connais mieux. Et tu avances plus clairement.",
    ritualRhythm: "une carte. une conversation. un insight",
    ritualAlt: "Une femme au réveil, une serviette nouée sur la tête",
    joinTitle: "Les cent premières.",
    joinSub: "Les 100 premières inscrites reçoivent 7 jours d'accès illimité au lancement.",
    joinBenefits: ["7 jours gratuits, sans carte bancaire.", "Accès illimité dès le lancement.", "Tous les decks premium débloqués. Et ton deck perso."],
    joinMicro: "Tire ta première carte. Ton compte se crée ensuite, en un instant.",
    spotsLeft: (n: number) => (n > 1 ? `Encore ${n} places sur 100.` : n === 1 ? "Encore une place sur 100." : "Les cent places sont prises. Tu peux tirer quand même."),
    faqTitle: "Les vraies questions.",
    faq: [
      {
        q: "Je ne crois pas au tarot, ou je n'y connais rien. C'est pour moi ?",
        a: "Morning Cards ne demande ni croyance ni expertise. Pas besoin de connaître les arcanes. Tu arrives avec ce que tu as en tête, ou sur le cœur. La carte ouvre. La conversation fait le reste. Ce qui compte, c'est ce que tu en fais.",
      },
      {
        q: "C'est quoi, concrètement, un tirage ?",
        a: "Tu tires une carte, et tu échanges avec Morning Cards sur ce qu'elle ouvre pour toi. Tu peux en tirer d'autres pour aller plus loin. Quelques minutes suffisent, le matin ou quand tu en as besoin.",
      },
      { q: "Différence avec un horoscope ?", a: "L'horoscope parle de ton signe. Ici, c'est ta situation, ta question, ton moment." },
      {
        q: "C'est gratuit ?",
        a: "Un tirage par semaine, gratuitement. Pour aller plus loin, des formules premium sont disponibles. Les 100 premières inscrites reçoivent 7 jours d'accès illimité au lancement.",
      },
    ],
    moreTitle: "En voir et en lire davantage.",
    magazine: "Magazine",
    instagram: "Instagram",
    backToTop: "Retour en haut",
    contact: "Contact",
  },

  magazine: {
    title: "Magazine",
    metaDescription: "Le Magazine de Morning Cards : les decks et leurs artistes, les matins, les coulisses.",
    back: "Magazine",
    backLong: "Retour au Magazine",
    updated: (d: string) => `Mis à jour le ${d}`,
    news: "Actualité & événements",
    deckLabel: "Le Deck",
    deckCta: (name: string) => `Découvrir le deck ${name}`,
    draw: "Tirer une carte",
    empty: "Les premiers articles arrivent bientôt.",
    draft: "Brouillon, visible par l'administration seulement.",
  },

  errors: {
    notFound: "cette page n'existe pas.",
    home: "Revenir à l'accueil",
  },
};

export type Dict = typeof fr;

const en: Dict = {
  brand: "morning cards",
  signature: "one card. one conversation. one insight.",
  nav: { draw: "Draw", decks: "Decks", journal: "Journal", me: "You" },

  welcome: {
    title: "when the noise stops, you know what to do",
    body: "one card. one conversation. one insight.",
    pick: "choose your deck.",
    pickHelp: "Each deck has its own world. Pick the one that pulls you in, you can change it later.",
    cta: "Draw with this deck",
    login: "I already have an account",
  },

  home: {
    myDeck: "My deck",
    hello: (name: string | null) => (name ? `hello, ${name.toLowerCase()}` : "hello"),
    rhythm: { 1: "one moment. one card.", 3: "three cards. one thread.", 5: "five cards. one crossing." },
    spread: (n: number) => (n === 1 ? "1 card" : `${n} cards`),
    hold: "Rest your finger on the card.",
    reveal: "reveal its message",
    next: "next card",
    deck: (name: string) => `You're drawing with ${name}.`,
    exploration: (d: number) => `Exploration offer · ${d} day${d > 1 ? "s" : ""} left`,
    early: (d: number) => `Early adopter · unlimited access, ${d} day${d > 1 ? "s" : ""} left`,
    lockedSpread: "This spread comes with Ritual and Clarity.",
    transition: "one gesture. one insight.",
  },

  conv: {
    cardLabel: "The card",
    youLabel: "You",
    placeholder: "Write what's on your mind…",
    drawCard: "Draw a card",
    pickCard: "choose your card",
    pickHelp: "Let your hand decide.",
    thinking: "",
    error: "the conversation was interrupted.",
    errorBody: "Your message couldn't be sent. Try again in a moment.",
    retry: "Try again",
    newDraw: "New draw",
    history: "See my journal",
    limit: "This conversation has reached its maximum length.",
    back: "Back",
    notSaved: "This conversation isn't saved yet.",
    keepIt: "Keep it",
  },

  wall: {
    title: "create your account to keep going.",
    body: "Without an account, this conversation is lost when you leave. Create one to keep it.",
    firstName: "First name",
    email: "Email",
    password: "Password",
    birthdate: "Date of birth",
    birthdateHelp: "To calculate your life path.",
    consent: "I agree to the Morning Cards terms of use and privacy policy.",
    cta: "Continue",
    reassure: "No credit card · Unsubscribe anytime.",
    already: "Already have an account? Sign in",
    keepTitle: "keep this conversation.",
    keepBody: "Without an account, it's gone when you leave. With one, it waits for you in your journal, card included.",
    offerTitle: "your exploration offer is on",
    offerBody: "one card a day for 5 days. free.",
    earlyTitle: "you're one of the first hundred",
    earlyBody: "7 days of unlimited access: every deck, your own deck, as many cards as you like. free.",
    offerCta: "Back to my conversation",
  },

  auth: {
    loginTitle: "we've been waiting.",
    loginSub: "Your cards are here.",
    login: "Sign in",
    forgot: "Forgot your password?",
    noAccount: "New here? Start",
    signupTitle: "create your account.",
    signupSub: "One minute. That's all.",
    resetTitle: "new password.",
    resetSub: "Enter your email, we'll send you a link.",
    resetSent: "If an account exists for this email, a link is on its way.",
    send: "Send the link",
    newPassword: "New password",
    save: "Save",
    showPassword: "Show",
    hidePassword: "Hide",
    invalid: "Wrong email or password.",
    exists: "An account already exists with this email.",
    weak: "Your password needs at least 8 characters.",
    generic: "Something went wrong. Try again.",
    logout: "Sign out",
  },

  decks: {
    myDeck: "my deck.",
    myDeckLink: (n: number, total: number) => `My deck · ${n}/${total}`,
    myDeckCount: (n: number, total: number) => `${n} card${n > 1 ? "s" : ""} of ${total}`,
    myDeckHelp: "Build your deck: pick one version of each arcana, from every deck.",
    pickVersion: "Pick the version that speaks to you.",
    addToMine: "Add to my deck",
    removeFromMine: "Remove from my deck",
    toastAdded: "Added to your deck.",
    toastRemoved: "Removed from your deck.",
    drawWithMine: "Draw with my deck",
    toastMine: "You're drawing with your deck from now on.",
    mineLocked: "Drawing with your deck comes with Ritual and Clarity.",
    incomplete: (n: number) => `Complete your deck before drawing with it: ${n} card${n > 1 ? "s" : ""} missing.`,
    columns: (n: number) => `Show ${n} columns`,
    title: "decks.",
    all: "All",
    favorites: "Favorites",
    cards: (n: number) => `${n} cards`,
    drawWith: "Draw with this deck",
    active: "Active deck",
    toastActive: (name: string) => `Drawing with ${name} from now on.`,
    locked: "This deck isn't available on your current plan.",
    seePlans: "See plans",
    otherCards: "the other cards in this deck.",
    otherDecks: "this card in other decks.",
    inspired: (a: string) => `inspired by ${a}`,
  },

  journal: {
    title: "journal.",
    empty: "Your journal is empty.",
    emptyBody: "Every draw leaves a trace here.",
    week: "This week",
    month: "This month",
    all: "All",
    favorites: "Favorites",
    untitled: "Conversation",
  },

  me: {
    tabs: { drawings: "Draws", you: "You", settings: "Settings" },
    ranges: { month: "This month", year: "This year", all: "All time" },
    noDraw: "Nothing in this period.",
    seeMore: "See more",
    worldTitle: "your world.",
    worldHelp: "What you write here helps the AI understand you better. None of it is required.",
    world: { love: "Love", work: "Work", family: "Family", health: "Health", money: "Money", growth: "Personal growth" },
    theme: "Appearance",
    themes: { light: "Light", dark: "Dark", system: "Auto" },
    password: "Change my password",
    manageBilling: "Manage my subscription",
    support: "Help",
    contact: "Write to us",
    title: "you.",
    stats: (cards: number, convs: number) => `${cards} card${cards > 1 ? "s" : ""} drawn · ${convs} conversation${convs > 1 ? "s" : ""}`,
    mostDrawn: "your most drawn cards.",
    you: "you",
    lifePath: "life path",
    lifePathHelp: "Calculated from your date of birth.",
    account: "Account",
    plan: "Plan",
    language: "Language",
    notifications: "Get my daily insights by email",
    save: "Save",
    saved: "Saved.",
    changePlan: "See plans",
  },

  plans: {
    paid: "Thank you, your payment went through.",
    title: "go further.",
    sub: "You've reached your limit. But there's more to explore.",
    current: "Your plan",
    perMonth: "/month",
    once: "one time",
    choose: "Choose",
    soon: "Payments open very soon.",
    failed: "Payment couldn't open. Try again in a moment.",
    continue: "Continue without",
    names: { exploration: "Exploration", early: "Early adopter", intention: "Intention", ritual: "Ritual", clarity: "Clarity" },
    features: {
      exploration: ["One conversation a day", "One card per draw", "5 days"],
      early: ["Unlimited conversations", "Up to 5 cards per draw", "All decks", "Your custom deck", "7 days"],
      intention: ["One draw a week", "One card per draw", "No time limit"],
      ritual: ["One conversation a day", "Up to 3 cards per draw", "All decks", "Your custom deck"],
      clarity: ["Unlimited conversations", "Up to 5 cards per draw", "All decks", "Your custom deck"],
    },
    pack3: "3 cards",
    single: "1 card",
    packHelp: "Use them anytime.",
    quotaReached: "Today's draw is done.",
    quotaReachedWeek: "This week's draw is done.",
    quotaBody: "Come back tomorrow, or go further with Ritual or Clarity.",
  },

  landing: {
    metaTitle: "Morning Cards · When the noise stops, you know what to do.",
    metaDescription: "One card. One conversation. One insight. Post-mystic tarot, to see clearly what you already feel.",
    wordmark: "Morning Cards",
    navJoin: "I'm in",
    navJoinShort: "I'm in",
    navLogin: "Log in",
    heroTitle: "When the noise stops, you know what to do.",
    heroTitleLines: ["When the", "noise stops,", "you know", "what to do."],
    heroSub: "One card. One conversation. One insight.",
    cta: "I'm in.",
    heroMicro: "Free unlimited access · 7 days at launch",
    ruptureTitle: "Tarot. Not what you think.",
    ruptureSub: "Post-mystic. Present tense.",
    moments: ["He's great. So why doesn't it feel right?", "Something needs to change. You just don't know what yet.", "Everyone's here. And you're somewhere else."],
    momentsAlt: ["A woman leaning on her partner, her mind elsewhere", "A woman alone under a blue sky, eyes almost closed", "A woman at a party, lost in thought"],
    transition: "One draw. Cut through the noise.",
    now: "Now.",
    momentsNext: "Next moment",
    earlyBand: "The first 100 to sign up get 7 days of unlimited access at launch.",
    earlyBandMicro: "Your first card right now, no account needed.",
    howTitle: "How it works.",
    steps: [
      { title: "The card", body: "A card appears. It sets a frame. A mood, a pull, sometimes just a feeling you can't quite name. That's where it starts." },
      { title: "The conversation", body: "You bring what's weighing on you. And you dig in." },
      { title: "The insight", body: "You walk away with something solid. A decision, a direction, an angle. Yours." },
    ],
    demoDrawn: "you drew",
    demoCard: "The Lovers",
    demoMeta: "The Lovers · VI · deck",
    demoReveal: "Reveal your card",
    demoTime: "drawn 9:41 · deck",
    demoLabel: "Morning Cards",
    demoQuote: "“A choice isn't a loss. It's a direction you recognise.”",
    demoReply: "You're not hesitating for lack of love. You're hesitating because part of you already knows, and is waiting for you to listen.",
    demoAsk: "what if I'm wrong?",
    clarity: "It's not fortune telling. It's clarity.",
    decksTitle: "The decks.",
    decksSub: "Pick the aesthetic that speaks to you. Switch whenever. Build your own.",
    decksExclusive: "Exclusive decks. Limited editions.",
    proofTitle: "They tried it first.",
    proofSub: "Early access. Honest feedback.",
    quotes: [
      { text: "I'd been going round in circles for three days. Ten minutes in, I had my angle.", who: "Clara, 28" },
      { text: "I already knew the answer. The card helped me see it.", who: "Emma, 32" },
      { text: "Way more concrete than I expected.", who: "Léa, 30" },
    ],
    artTitle: "The art of the draw.",
    artBody: "Every deck is a work of art. Visual worlds designed to create resonance. An image does what words haven't found yet. That's where the conversation starts.",
    artCta: "Be one of the first",
    ritualLabel: "The morning ritual",
    ritualTitle: "How do you start your morning?",
    ritualBody: "One card every morning becomes a thread through your week. Day after day, you get clearer and move with more intention.",
    ritualRhythm: "1 card. 1 conversation. 1 insight",
    ritualAlt: "A woman waking up, a towel wrapped around her hair",
    joinTitle: "The first hundred.",
    joinSub: "The first 100 to sign up get 7 days of unlimited access at launch.",
    joinBenefits: ["7 days free, no credit card.", "Unlimited access from day one.", "All premium decks unlocked. Build your own."],
    joinMicro: "Draw your first card. Your account comes after, in a moment.",
    spotsLeft: (n: number) => (n > 1 ? `${n} spots left out of 100.` : n === 1 ? "One spot left out of 100." : "All hundred spots are taken. You can still draw."),
    faqTitle: "The real questions.",
    faq: [
      {
        q: "I don't believe in tarot, or I know nothing about it. Is this for me?",
        a: "Morning Cards doesn't ask you to believe in anything. No tarot knowledge needed. You bring what's on your mind, or on your heart. The card opens something. The conversation does the rest. What matters is what you do with it.",
      },
      {
        q: "What actually happens during a reading?",
        a: "You draw a card, and have a conversation with Morning Cards about what it opens up for you. You can draw more to go deeper. Takes a few minutes, in the morning or whenever you need it.",
      },
      { q: "How is this different from a horoscope?", a: "A horoscope talks about your sign. This is about your situation, your question, your moment." },
      {
        q: "Is it free?",
        a: "One draw per week, for free. Premium plans available for more. The first 100 to sign up get 7 days of unlimited access at launch.",
      },
    ],
    moreTitle: "There's more.",
    magazine: "Magazine",
    instagram: "Instagram",
    backToTop: "Back to top",
    contact: "Contact",
  },

  magazine: {
    title: "Magazine",
    metaDescription: "The Morning Cards Magazine: the decks and their artists, mornings, behind the scenes.",
    back: "Magazine",
    backLong: "Back to the Magazine",
    updated: (d: string) => `Updated ${d}`,
    news: "News & events",
    deckLabel: "The Deck",
    deckCta: (name: string) => `Discover the ${name} deck`,
    draw: "Draw a card",
    empty: "The first stories are on their way.",
    draft: "Draft, visible to admins only.",
  },

  errors: {
    notFound: "this page doesn't exist.",
    home: "Back home",
  },
};

export const DICTS: Record<Locale, Dict> = { fr, en };

// ─── Textes modifiés depuis l'admin ─────────────────────────────────────────
//
// Les valeurs ci-dessus sont les textes par défaut. L'admin peut remplacer
// n'importe quel texte fixe (chaîne, ou élément d'une liste) par sa clé
// pointée, par exemple « home.hold » ou « plans.features.ritual.0 ». Les textes
// calculés (fonctions comme home.hello) restent dans le code.

export type TextOverrides = Record<Locale, Record<string, string>>;

export const NO_OVERRIDES: TextOverrides = { fr: {}, en: {} };

/** Les textes fixes d'un dictionnaire, à plat : [clé pointée, valeur]. */
export function flattenTexts(node: unknown, prefix = ""): [string, string][] {
  if (typeof node === "string") return [[prefix, node]];
  if (Array.isArray(node)) return node.flatMap((v, i) => flattenTexts(v, prefix ? `${prefix}.${i}` : String(i)));
  if (node && typeof node === "object") {
    return Object.entries(node).flatMap(([k, v]) => flattenTexts(v, prefix ? `${prefix}.${k}` : k));
  }
  return [];
}

/** Clés modifiables : uniquement celles qui existent et portent un texte fixe. */
export const EDITABLE_KEYS = new Set(flattenTexts(fr).map(([k]) => k));

/** Le dictionnaire avec les textes modifiés appliqués (copie, l'original reste intact). */
export function withOverrides(dict: Dict, overrides: Record<string, string> | undefined): Dict {
  if (!overrides || Object.keys(overrides).length === 0) return dict;
  const apply = (node: unknown, prefix: string): unknown => {
    if (typeof node === "string") return overrides[prefix] ?? node;
    if (Array.isArray(node)) return node.map((v, i) => apply(v, `${prefix}.${i}`));
    if (node && typeof node === "object") {
      return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, apply(v, prefix ? `${prefix}.${k}` : k)]));
    }
    return node;
  };
  return apply(dict, "") as Dict;
}
