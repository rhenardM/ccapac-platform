import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/** Base de l'API contenu du backend (surchargeable via env). Sans slash final. */
const CONTENT_API_BASE_URL = (
  process.env.CONTENT_API_BASE_URL ??
  "https://api-fundraising.centreculturel.cd/api/content"
).replace(/\/+$/, "");

/**
 * Relaie l'inscription newsletter vers le backend de production.
 * Évite tout appel cross-origin depuis le navigateur.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : undefined;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Adresse e-mail invalide." },
      { status: 422 }
    );
  }

  try {
    const res = await fetch(`${CONTENT_API_BASE_URL}/newsletter/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, name }),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Le service est momentanément indisponible. Réessayez plus tard." },
      { status: 502 }
    );
  }
}
