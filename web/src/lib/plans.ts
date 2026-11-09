/**
 * Les offres et ce qu'elles ouvrent — source unique côté application.
 *
 * Arbitrages par défaut, à confirmer par Sarah (voir docs/DECISIONS.md) :
 * - Exploration dure 5 jours (landing du 3 juillet), puis bascule en Intention.
 * - Une carte supplémentaire dans une conversation consomme d'abord un crédit
 *   acheté (pack), sinon elle doit tenir dans le quota de l'offre.
 * - Pas de limite de messages : le LLM tourne sur nos serveurs (décision du 5 novembre).
 */

export type PlanId = "exploration" | "intention" | "ritual" | "clarity";

export interface Plan {
  id: PlanId;
  /** Conversations ouvertes par période ; null = illimité. */
  conversations: number | null;
  period: "day" | "week";
  /** Cartes maximum dans une conversation (tirage initial + cartes ajoutées). */
  cardsPerConversation: number;
  /** Taille de tirage proposée sur l'accueil. */
  spreads: (1 | 3 | 5)[];
  allDecks: boolean;
  customDeck: boolean;
  priceEur: number | null;
  durationDays: number | null;
}

export const PLANS: Record<PlanId, Plan> = {
  exploration: {
    id: "exploration", conversations: 1, period: "day", cardsPerConversation: 1,
    spreads: [1], allDecks: false, customDeck: false, priceEur: 0, durationDays: 5,
  },
  intention: {
    id: "intention", conversations: 1, period: "week", cardsPerConversation: 1,
    spreads: [1], allDecks: false, customDeck: false, priceEur: 0, durationDays: null,
  },
  ritual: {
    id: "ritual", conversations: 1, period: "day", cardsPerConversation: 3,
    spreads: [1, 3], allDecks: true, customDeck: true, priceEur: 11, durationDays: null,
  },
  clarity: {
    id: "clarity", conversations: null, period: "day", cardsPerConversation: 5,
    spreads: [1, 3, 5], allDecks: true, customDeck: true, priceEur: 15, durationDays: null,
  },
};

export const PACKS = [
  { id: "pack3", cards: 3, priceEur: 6 },
  { id: "single", cards: 1, priceEur: 3 },
] as const;

/** Un deck personnalisé complet : une version de chacun des 22 arcanes. */
export const MY_DECK_SIZE = 22;

/** Messages accordés à une session anonyme avant le mur d'inscription. */
export const ANONYMOUS_USER_MESSAGES = 2;

export interface ProfileLike {
  plan: PlanId;
  plan_started_at: string;
  extra_cards: number;
}

/** L'offre réellement en vigueur : Exploration expirée redevient Intention. */
export function effectivePlan(p: ProfileLike, now = new Date()): Plan {
  const plan = PLANS[p.plan];
  if (plan.durationDays) {
    const end = new Date(p.plan_started_at).getTime() + plan.durationDays * 86400_000;
    if (now.getTime() > end) return PLANS.intention;
  }
  return plan;
}

/** Jours restants d'Exploration (bandeau de l'accueil), ou null. */
export function explorationDaysLeft(p: ProfileLike, now = new Date()): number | null {
  if (p.plan !== "exploration") return null;
  const end = new Date(p.plan_started_at).getTime() + PLANS.exploration.durationDays! * 86400_000;
  const left = Math.ceil((end - now.getTime()) / 86400_000);
  return left > 0 ? left : null;
}

/** Début de la période de quota en cours (jour ou semaine, heure de Paris). */
export function periodStart(period: "day" | "week", now = new Date()): Date {
  const paris = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  const offset = now.getTime() - paris.getTime();
  paris.setHours(0, 0, 0, 0);
  if (period === "week") {
    const day = (paris.getDay() + 6) % 7; // lundi = 0
    paris.setDate(paris.getDate() - day);
  }
  return new Date(paris.getTime() + offset);
}
