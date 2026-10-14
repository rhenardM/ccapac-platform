"use server";

import { CONTENT_API_BASE_URL } from "@/lib/content-api";

/**
 * Envoie une inscription à un événement externe gratuit
 * (/api/content/programs/{slug}/register) : enregistrée côté backend et
 * notifiée par e-mail au centre.
 */
export async function registerForProgram(
  slug: string,
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    numberOfSeats?: number;
    message?: string;
  }
) {
  const res = await fetch(
    `${CONTENT_API_BASE_URL}/programs/${encodeURIComponent(slug)}/register`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("L'inscription n'a pas pu être envoyée.");
  }
}
