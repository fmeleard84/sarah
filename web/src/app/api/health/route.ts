import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Sonde de Traefik et du healthcheck Docker. */
export function GET() {
  return NextResponse.json({ ok: true, version: process.env.APP_VERSION ?? "dev" });
}
