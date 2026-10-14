import { fetchCinemathequeJson } from "@/lib/content-api";
import type { Ticket } from "@/types/ticket";

/**
 * Récupère un billet numérique par sa référence, protégé par le jeton reçu
 * à l'inscription (référence seule insuffisante : numéro séquentiel énumérable).
 * Retourne `null` si le billet est introuvable ou le jeton invalide.
 */
export async function getTicketByReference(
  reference: string,
  token: string
): Promise<Ticket | null> {
  try {
    const body = await fetchCinemathequeJson<{ data: Ticket }>(
      `/tickets/${encodeURIComponent(reference)}?token=${encodeURIComponent(token)}`
    );
    return body?.data ?? null;
  } catch {
    return null;
  }
}
