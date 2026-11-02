/**
 * Chemin de vie : somme des chiffres de la date de naissance, réduite à un
 * chiffre, sauf les nombres maîtres 11, 22 et 33.
 */
export function lifePath(birthdate: string | null): number | null {
  if (!birthdate || !/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) return null;
  let n = birthdate.replace(/\D/g, "").split("").reduce((s, d) => s + Number(d), 0);
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split("").reduce((s, d) => s + Number(d), 0);
  }
  return n;
}
