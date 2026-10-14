"use server";

import { CONTENT_API_BASE_URL } from "@/lib/content-api";

/**
 * Envoie une inscription anonyme (sans compte) à un événement d'agenda
 * (/api/content/events/{slug}/register) : simple enregistrement visible au
 * back-office, sans billet ni compte membre requis.
 */
export async function registerForEvent(
  slug: string,
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    message?: string;
  }
) {
  const res = await fetch(`${CONTENT_API_BASE_URL}/events/${slug}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(data),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || "L'inscription n'a pas pu être envoyée.");
  }
}
