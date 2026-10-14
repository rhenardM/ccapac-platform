"use server";

import { CONTENT_API_BASE_URL } from "@/lib/content-api";

/**
 * Envoie le message de contact à NOTRE backend (/api/content/contact) :
 * il l'enregistre (visible au dashboard) et notifie l'e-mail du centre.
 */
export async function sendContactEmail(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}) {
  const res = await fetch(`${CONTENT_API_BASE_URL}/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(data),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Le message n'a pas pu être envoyé.");
  }
}
