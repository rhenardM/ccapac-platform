import { NextRequest, NextResponse } from "next/server";
import { CINEMATHEQUE_API_BASE_URL } from "@/lib/content-api";

const jsonError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

/**
 * Relaie le téléchargement du PDF d'un billet depuis le backend Symfony.
 * Pas d'authentification ici (parcours anonyme, contrairement aux
 * téléchargements newsletter) : l'accès est protégé par le jeton en query,
 * vérifié côté backend (même logique que la lecture du billet).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  const { reference } = await params;
  const token = request.nextUrl.searchParams.get("t") ?? "";

  if (!/^[A-Za-z0-9-]+$/.test(reference) || !token) {
    return jsonError("Requête invalide.", 400);
  }

  const backendUrl = `${CINEMATHEQUE_API_BASE_URL}/tickets/${encodeURIComponent(reference)}/download?token=${encodeURIComponent(token)}`;

  let pdfResponse: Response;
  try {
    pdfResponse = await fetch(backendUrl, { cache: "no-store" });
  } catch {
    return jsonError("Téléchargement indisponible.", 502);
  }

  if (!pdfResponse.ok || !pdfResponse.body) {
    return jsonError("Billet introuvable.", 404);
  }

  const headers = new Headers({
    "Content-Type": pdfResponse.headers.get("content-type") || "application/pdf",
    "Content-Disposition":
      pdfResponse.headers.get("content-disposition") ||
      `attachment; filename="${reference}.pdf"`,
    "Cache-Control": "private, no-store",
  });

  return new NextResponse(pdfResponse.body, { status: 200, headers });
}
