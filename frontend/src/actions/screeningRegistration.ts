"use server";

import { CINEMATHEQUE_API_BASE_URL } from "@/lib/content-api";

export interface ScreeningRegistrationResult {
  status: string;
  ticketReference: string | null;
  ticketToken: string | null;
  ticketViewUrl: string | null;
}

/**
 * Envoie une inscription à une séance de cinémathèque gratuite
 * (/api/cinematheque/screenings/{id}/register) : enregistrée côté backend,
 * qui génère aussitôt un billet numérique (QR Code + PDF) et l'envoie par
 * e-mail au participant, en plus de la notification interne au staff.
 */
export async function registerForScreening(
  screeningId: number,
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    numberOfSeats?: number;
    message?: string;
    gender?: string;
    ageRange?: string;
  }
): Promise<ScreeningRegistrationResult> {
  const res = await fetch(
    `${CINEMATHEQUE_API_BASE_URL}/screenings/${screeningId}/register`,
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

  const body = await res.json();
  return body.data as ScreeningRegistrationResult;
}
