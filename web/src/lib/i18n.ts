/**
 * Textes de l'interface, FR et EN.
 *
 * Règles de casse Morning Cards (verrouillées le 7 juillet) :
 * - Titres : Cormorant romain, sans majuscule, avec point.
 * - Titres émotionnels, discours direct : Cormorant italique, sans majuscule, sans point.
 * - Corps de marque : DM Sans, tout en minuscules, avec point.
 * - Corps fonctionnel : DM Sans, casse normale, avec point.
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
    hello: (name: string | null) => (name ? `bonjour, ${name.toLowerCase()}` : "bonjour"),
    rhythm: { 1: "un moment. une carte.", 3: "trois cartes. un fil.", 5: "cinq cartes. une traversée." } as Record<number, string>,
    spread: (n: number) => (n === 1 ? "1 carte" : `${n} cartes`),
    hold: "Pose ton doigt sur la carte.",
    reveal: "révèle son message",
    next: "carte suivante",
    deck: (name: string) => `Tu tires avec ${name}.`,
    exploration: (d: number) => `Offre Exploration · ${d} jour${d > 1 ? "s" : ""} restant${d > 1 ? "s" : ""}`,
    lockedSpread: "Ce tirage est disponible avec Ritual et Clarity.",
    transition: "un geste. un insight.",
  },

  conv: {
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
  },

  wall: {
    title: "crée ton compte pour continuer.",
    body: "Ta conversation et ta carte seront sauvegardées.",
    firstName: "Prénom",
    email: "Email",
    password: "Mot de passe",
    birthdate: "Date de naissance",
    birthdateHelp: "Pour calculer ton chemin de vie.",
    consent: "J'accepte les conditions d'utilisation et la politique de confidentialité de Morning Cards.",
    cta: "Continuer",
    reassure: "Pas de carte bancaire · Désinscription à tout moment.",
    already: "Déjà un compte ? Se connecter",
    offerTitle: "ton offre exploration est activée",
    offerBody: "une carte par jour pendant 5 jours. gratuit.",
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
    title: "va plus loin.",
    sub: "Tu as atteint ta limite. Mais il y a plus à explorer.",
    current: "Ton offre",
    perMonth: "/mois",
    once: "une fois",
    choose: "Choisir",
    soon: "Le paiement ouvre très bientôt.",
    continue: "Continuer sans",
    names: { exploration: "Exploration", intention: "Intention", ritual: "Ritual", clarity: "Clarity" },
    features: {
      exploration: ["Une conversation par jour", "Une carte par tirage", "5 jours"],
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
    hello: (name: string | null) => (name ? `hello, ${name.toLowerCase()}` : "hello"),
    rhythm: { 1: "one moment. one card.", 3: "three cards. one thread.", 5: "five cards. one crossing." },
    spread: (n: number) => (n === 1 ? "1 card" : `${n} cards`),
    hold: "Rest your finger on the card.",
    reveal: "reveal its message",
    next: "next card",
    deck: (name: string) => `You're drawing with ${name}.`,
    exploration: (d: number) => `Exploration offer · ${d} day${d > 1 ? "s" : ""} left`,
    lockedSpread: "This spread comes with Ritual and Clarity.",
    transition: "one gesture. one insight.",
  },

  conv: {
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
  },

  wall: {
    title: "create your account to keep going.",
    body: "Your conversation and your card will be saved.",
    firstName: "First name",
    email: "Email",
    password: "Password",
    birthdate: "Date of birth",
    birthdateHelp: "To calculate your life path.",
    consent: "I agree to the Morning Cards terms of use and privacy policy.",
    cta: "Continue",
    reassure: "No credit card · Unsubscribe anytime.",
    already: "Already have an account? Sign in",
    offerTitle: "your exploration offer is on",
    offerBody: "one card a day for 5 days. free.",
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
    title: "go further.",
    sub: "You've reached your limit. But there's more to explore.",
    current: "Your plan",
    perMonth: "/month",
    once: "one time",
    choose: "Choose",
    soon: "Payments open very soon.",
    continue: "Continue without",
    names: { exploration: "Exploration", intention: "Intention", ritual: "Ritual", clarity: "Clarity" },
    features: {
      exploration: ["One conversation a day", "One card per draw", "5 days"],
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

  errors: {
    notFound: "this page doesn't exist.",
    home: "Back home",
  },
};

export const DICTS: Record<Locale, Dict> = { fr, en };
