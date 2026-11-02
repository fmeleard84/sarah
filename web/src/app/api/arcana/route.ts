import { NextResponse } from "next/server";
import { listArcana } from "@/lib/decks";

/** Noms des arcanes dans la langue demandée (référentiel public). */
export async function GET(req: Request) {
  const locale = new URL(req.url).searchParams.get("locale") === "en" ? "en" : "fr";
  const list = await listArcana();
  return NextResponse.json(
    list.map((a) => ({ number: a.number, numeral: a.numeral, name: locale === "en" ? a.name_en : a.name_fr })),
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
