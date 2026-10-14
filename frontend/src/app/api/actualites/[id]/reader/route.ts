import { NextRequest, NextResponse } from "next/server";
import { fetchAll, slugToId } from "@/lib/content-api";

interface BackendActualite {
  slug: string;
  type?: string;
  pdf?: string | null;
}

const jsonError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

/** Résout l'actualité (par id numérique dérivé du slug) via notre backend. */
const findActualite = async (id: string): Promise<BackendActualite | null> => {
  const items = await fetchAll<BackendActualite>("/actualites");

  if (/^\d+$/.test(id)) {
    return items.find((a) => slugToId(a.slug) === Number(id)) ?? null;
  }
  // Repli : identifiant non numérique traité comme slug.
  return items.find((a) => a.slug === id) ?? null;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return jsonError("Identifiant invalide", 400);
  }

  let actualite: BackendActualite | null = null;

  try {
    actualite = await findActualite(id);
  } catch (error) {
    console.error("[Actualite Reader] Failed to fetch actualite:", error);
    return jsonError("Liseuse indisponible", 502);
  }

  if (!actualite || actualite.type !== "NEWSLETTER") {
    return jsonError("Newsletter introuvable", 404);
  }

  if (!actualite.pdf || !/^https?:\/\//i.test(actualite.pdf)) {
    return jsonError("PDF indisponible pour cette newsletter", 404);
  }

  let pdfResponse: Response;

  try {
    pdfResponse = await fetch(actualite.pdf);
  } catch (error) {
    console.error("[Actualite Reader] Failed to fetch PDF:", error);
    return jsonError("Liseuse indisponible", 502);
  }

  if (!pdfResponse.ok || !pdfResponse.body) {
    return jsonError("Liseuse indisponible", 502);
  }

  const filename = actualite.pdf.split("/").pop() || "newsletter.pdf";

  return new NextResponse(pdfResponse.body, {
    status: 200,
    headers: {
      "Content-Type":
        pdfResponse.headers.get("content-type") || "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
