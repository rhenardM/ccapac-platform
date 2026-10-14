import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Sonde de santé pour Docker et la CI/CD : ne touche ni la base ni l'API. */
export function GET() {
  return NextResponse.json({ status: "ok" });
}
