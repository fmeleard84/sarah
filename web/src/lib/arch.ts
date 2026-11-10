/** Arche de la home et en-tête du chat : sans dépendance serveur, utilisable côté client. */
export const ARCH_DEFAULT_INTENSITY = 0.3;

/** Couleur affichée : la couleur de la carte mélangée au fond selon l'intensité. */
export function archMix(color: string | null | undefined, intensity: number | null | undefined) {
  if (!color) return "var(--color-arch-idle)";
  const k = Math.round((intensity ?? ARCH_DEFAULT_INTENSITY) * 100);
  return `color-mix(in srgb, ${color} ${k}%, var(--color-canvas))`;
}
