import sharp from "sharp";

/**
 * Couleur d'arche suggérée pour une carte (specs de Sarah du 9 novembre).
 *
 * Ce n'est pas la couleur dominante mais un accent qui met la carte en valeur :
 * image réduite à 80 × 120, couleurs regroupées en 8 groupes (k-means), on écarte
 * les quasi-blancs (et les papiers crème), quasi-noirs et gris (saturation < 0,15), puis on garde le
 * groupe le plus saturé qui couvre au moins 3 % de l'image.
 *
 * Sans import par alias : le script scripts/arch-colors.mjs l'importe aussi.
 */

type RGB = [number, number, number];

function hsl([r, g, b]: RGB) {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { s, l, chroma: d };
}

const hex = (c: RGB) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();

/**
 * Couleurs candidates de la carte, la suggestion en tête : groupes qui couvrent
 * au moins 3 % de l'image, hors quasi-blancs, quasi-noirs et gris, du plus
 * saturé au moins saturé. Proposées dans l'admin à côté de la pipette.
 */
export async function archPalette(input: Buffer): Promise<string[]> {
  const { data } = await sharp(input).rotate().resize(80, 120, { fit: "cover" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const px: RGB[] = [];
  for (let i = 0; i + 2 < data.length; i += 3) px.push([data[i], data[i + 1], data[i + 2]]);

  // Départ déterministe : 8 pixels répartis dans l'image triée par luminosité,
  // pour que la même image donne toujours la même suggestion.
  const K = 8;
  const sorted = [...px].sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
  let centers: RGB[] = Array.from({ length: K }, (_, k) => [...sorted[Math.floor(((k + 0.5) * sorted.length) / K)]] as RGB);
  const assign = new Int32Array(px.length);

  for (let iter = 0; iter < 20; iter++) {
    let moved = false;
    for (let i = 0; i < px.length; i++) {
      let best = 0;
      let bestD = Infinity;
      for (let k = 0; k < K; k++) {
        const dr = px[i][0] - centers[k][0];
        const dg = px[i][1] - centers[k][1];
        const db = px[i][2] - centers[k][2];
        const d = dr * dr + dg * dg + db * db;
        if (d < bestD) {
          bestD = d;
          best = k;
        }
      }
      if (assign[i] !== best) moved = true;
      assign[i] = best;
    }
    const sums = Array.from({ length: K }, () => [0, 0, 0, 0]);
    for (let i = 0; i < px.length; i++) {
      const s = sums[assign[i]];
      s[0] += px[i][0];
      s[1] += px[i][1];
      s[2] += px[i][2];
      s[3]++;
    }
    centers = centers.map((c, k) => (sums[k][3] ? [sums[k][0] / sums[k][3], sums[k][1] / sums[k][3], sums[k][2] / sums[k][3]] : c));
    if (!moved && iter > 0) break;
  }

  const counts = new Array(K).fill(0);
  for (let i = 0; i < px.length; i++) counts[assign[i]]++;

  // « Le plus saturé » se mesure en chroma : la saturation HSL surévalue les
  // tons très clairs (le papier crème d'un deck passait devant ses couleurs).
  const kept: { c: RGB; chroma: number }[] = [];
  for (let k = 0; k < K; k++) {
    if (counts[k] / px.length < 0.03) continue;
    const { s, l, chroma } = hsl(centers[k]);
    if (l > 0.88 || l < 0.08 || s < 0.15) continue;
    kept.push({ c: centers[k], chroma });
  }
  return [...new Set(kept.sort((a, b) => b.chroma - a.chroma).map((k) => hex(k.c)))];
}

export async function suggestArchColor(input: Buffer): Promise<string | null> {
  return (await archPalette(input))[0] ?? null;
}
