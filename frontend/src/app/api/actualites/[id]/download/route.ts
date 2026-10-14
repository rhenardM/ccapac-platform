import { NextRequest, NextResponse } from "next/server";

import { getUser } from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import {
  fetchAll,
  slugToId,
} from "@/lib/content-api";

interface BackendActualite {
  slug: string;
  title?: string;
  type?: string;
  mois?: string | null;
  annee?: number | null;
  pdf?: string | null;
}

const jsonError = (
  message: string,
  status: number
) => {
  return NextResponse.json(
    {
      error: message,
    },
    {
      status,
    }
  );
};

const sanitizeFilename = (
  filename: string
): string => {
  const sanitized = filename
    .replace(/[\\/:*?"<>|\r\n]/g, "-")
    .trim();

  return sanitized || "newsletter.pdf";
};

/**
 * Résout une actualité depuis son identifiant numérique
 * dérivé du slug ou directement depuis son slug.
 */
const findActualite = async (
  id: string
): Promise<BackendActualite | null> => {
  const items =
    await fetchAll<BackendActualite>("/actualites");

  if (/^\d+$/.test(id)) {
    return (
      items.find(
        (actualite) =>
          slugToId(actualite.slug) === Number(id)
      ) ?? null
    );
  }

  return (
    items.find(
      (actualite) => actualite.slug === id
    ) ?? null
  );
};

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const user = await getUser();

  if (!user) {
    return jsonError(
      "Authentification requise",
      401
    );
  }

  const { id } = await context.params;

  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return jsonError(
      "Identifiant invalide",
      400
    );
  }

  let actualite: BackendActualite | null = null;

  try {
    actualite = await findActualite(id);
  } catch (error) {
    console.error(
      "[Actualite Download] Impossible de récupérer l'actualité :",
      error
    );

    return jsonError(
      "Téléchargement indisponible",
      502
    );
  }

  if (!actualite) {
    return jsonError(
      "Actualité introuvable",
      404
    );
  }

  if (actualite.type !== "NEWSLETTER") {
    return jsonError(
      "Téléchargement non autorisé pour ce contenu",
      403
    );
  }

  if (
    !actualite.pdf ||
    !/^https?:\/\//i.test(actualite.pdf)
  ) {
    return jsonError(
      "PDF indisponible pour cette newsletter",
      404
    );
  }

  let pdfResponse: Response;

  try {
    pdfResponse = await fetch(actualite.pdf, {
      headers: {
        Accept: "application/pdf",
      },
      cache: "no-store",
    });
  } catch (error) {
    console.error(
      "[Actualite Download] Impossible de récupérer le PDF :",
      error
    );

    return jsonError(
      "Téléchargement indisponible",
      502
    );
  }

  if (!pdfResponse.ok || !pdfResponse.body) {
    return jsonError(
      "Téléchargement indisponible",
      502
    );
  }

  const pdfName =
    actualite.pdf.split("/").pop() ||
    "newsletter.pdf";

  try {
    await prisma.memberActivity.create({
      data: {
        // Le backend Node renvoie un identifiant numérique,
        // mais Prisma attend ici une chaîne de caractères.
        userId: user.dbUserId,

        type: "NEWSLETTER_DOWNLOAD",

        metadata: {
          actualiteId: slugToId(
            actualite.slug
          ),
          documentId: actualite.slug,
          title: actualite.title ?? null,
          mois: actualite.mois ?? null,
          annee: actualite.annee ?? null,
          pdfName,
        },
      },
    });
  } catch (error) {
    // Une erreur d'historique ne doit pas empêcher
    // l'utilisateur de télécharger le document.
    console.error(
      "[Actualite Download] Impossible d'enregistrer l'activité :",
      error
    );
  }

  const filename = sanitizeFilename(pdfName);

  const headers = new Headers({
    "Content-Type":
      pdfResponse.headers.get("content-type") ||
      "application/pdf",

    "Content-Disposition":
      `attachment; filename="${filename}"`,

    "Cache-Control": "private, no-store",
  });

  const contentLength =
    pdfResponse.headers.get("content-length");

  if (contentLength) {
    headers.set(
      "Content-Length",
      contentLength
    );
  }

  return new NextResponse(
    pdfResponse.body,
    {
      status: 200,
      headers,
    }
  );
}