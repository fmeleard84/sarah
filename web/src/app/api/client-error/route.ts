import { NextResponse } from "next/server";

/**
 * Erreurs survenues dans le navigateur, recopiées dans les logs du conteneur
 * (`docker logs morningcards-morningcards-app-1 | grep client-error`).
 * Sans cela, un plantage côté client ne laisse aucune trace côté serveur.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const pick = (v: unknown, n: number) => String(v ?? "").slice(0, n);
  console.error(
    "[client-error]",
    JSON.stringify({
      message: pick(body.message, 500),
      stack: pick(body.stack, 1500),
      digest: pick(body.digest, 100),
      path: pick(body.path, 200),
      ua: pick(req.headers.get("user-agent"), 300),
    }),
  );
  return NextResponse.json({ ok: true });
}
