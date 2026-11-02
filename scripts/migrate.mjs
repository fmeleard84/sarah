/**
 * Applique les migrations SQL dans l'ordre, une fois chacune.
 *
 * La CLI Supabase n'est pas installée sur cette machine et la pile est
 * auto-hébergée : on parle directement à Postgres via le conteneur. Chaque
 * migration passe dans une transaction — une migration à moitié appliquée est
 * bien pire qu'une migration qui échoue.
 *
 *   node scripts/migrate.mjs          applique ce qui manque
 *   node scripts/migrate.mjs --status montre l'état sans rien appliquer
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, "supabase", "migrations");
const CONTAINER = "morningcards-db-1";

const psql = (sql, { file = false } = {}) =>
  execFileSync(
    "docker",
    file
      ? ["exec", "-i", CONTAINER, "psql", "-U", "postgres", "-v", "ON_ERROR_STOP=1", "-q", "-f", "-"]
      : ["exec", "-i", CONTAINER, "psql", "-U", "postgres", "-v", "ON_ERROR_STOP=1", "-tAq", "-c", sql],
    { input: file ? sql : undefined, encoding: "utf8" },
  );

psql(`
  create table if not exists schema_migrations (
    name        text primary key,
    checksum    text not null,
    applied_at  timestamptz not null default now()
  );
`);

const applied = new Map(
  psql("select name, checksum from schema_migrations order by name")
    .split("\n")
    .filter(Boolean)
    .map((l) => l.split("|")),
);

const files = readdirSync(DIR).filter((f) => f.endsWith(".sql")).sort();
const statusOnly = process.argv.includes("--status");
let ran = 0;

for (const file of files) {
  const sql = readFileSync(join(DIR, file), "utf8");
  const checksum = createHash("sha256").update(sql).digest("hex").slice(0, 16);
  const previous = applied.get(file);

  if (previous === checksum) {
    console.log(`  ✓ ${file} — déjà appliquée`);
    continue;
  }

  // Une migration déjà jouée qui a changé sur le disque est une erreur : on ne
  // peut pas la rejouer, et la base ne correspond plus au fichier.
  if (previous) {
    console.error(
      `\n  ✗ ${file} a été modifiée après avoir été appliquée.\n` +
        `    Écrire une nouvelle migration plutôt que de corriger celle-ci.`,
    );
    process.exit(1);
  }

  if (statusOnly) {
    console.log(`  · ${file} — à appliquer`);
    continue;
  }

  process.stdout.write(`  → ${file} … `);
  try {
    psql(`begin;\n${sql}\ncommit;`, { file: true });
    psql(
      `insert into schema_migrations (name, checksum) values ('${file}', '${checksum}')`,
    );
    console.log("appliquée");
    ran++;
  } catch (e) {
    console.log("ÉCHEC");
    console.error(String(e.stderr || e.message).trim());
    process.exit(1);
  }
}

if (!statusOnly) console.log(ran ? `\n${ran} migration(s) appliquée(s).` : "\nRien à appliquer.");
