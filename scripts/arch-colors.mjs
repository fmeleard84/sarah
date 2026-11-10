/**
 * Suggère la couleur d'arche des cartes qui n'en ont pas (ou de toutes avec --all).
 * Lit les images dans web/public/decks ou, pour celles du bucket, via Kong.
 *
 *   node scripts/arch-colors.mjs [--all] [--dry]
 */
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { suggestArchColor } from "../web/src/lib/archColor.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const all = process.argv.includes("--all");
const dry = process.argv.includes("--dry");
const psql = (sql) => execFileSync("docker", ["exec", "-i", "morningcards-db-1", "psql", "-U", "postgres", "-v", "ON_ERROR_STOP=1", "-tAq", "-F", "\t", "-c", sql], { encoding: "utf8" });

const rows = psql(`select c.id, c.image_path, d.slug, c.arcana from cards c join decks d on d.id = c.deck_id ${all ? "" : "where c.arch_color is null"} order by d.slug, c.arcana`)
  .trim().split("\n").filter(Boolean).map((l) => l.split("\t"));

let done = 0;
for (const [id, path, slug, arcana] of rows) {
  let buf;
  const local = join(ROOT, "web/public", `${path}.webp`);
  if (path.startsWith("/decks/") && existsSync(local)) buf = readFileSync(local);
  else if (path.startsWith("/sb/")) {
    const res = await fetch(`http://127.0.0.1:8114${path.slice(3)}.webp`);
    if (res.ok) buf = Buffer.from(await res.arrayBuffer());
  }
  if (!buf) { console.log(`  ? ${slug} ${arcana} : image introuvable (${path})`); continue; }
  const color = await suggestArchColor(buf);
  console.log(`  ${slug} ${String(arcana).padStart(2)} → ${color ?? "aucune"}`);
  if (color && !dry) { psql(`update cards set arch_color = '${color}' where id = '${id}'`); done++; }
}
console.log(`\n${done} carte(s) mise(s) à jour sur ${rows.length}.`);
