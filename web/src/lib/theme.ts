/** Apparence : clair par défaut, sombre bleu marine sur demande ou selon le téléphone. */
export type Theme = "light" | "dark" | "system";
export const THEMES: Theme[] = ["light", "dark", "system"];
export const THEME_COOKIE = "mc_theme";
export const isTheme = (v: unknown): v is Theme => v === "light" || v === "dark" || v === "system";
