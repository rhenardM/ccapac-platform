"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Ticket as TicketIcon } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import TicketCard from "./TicketCard";
import DownloadTicketButton from "./DownloadTicketButton";
import type { Ticket } from "@/types/ticket";
import { formatEventDateShort } from "@/lib/dateUtils";

interface ReservationSuccessCardProps {
  ticket: Ticket;
  reference: string;
  token: string;
}

/**
 * Habillage de la page de confirmation : récapitulatif de la réservation
 * (nom, numéro, film, date/heure/lieu) + les deux actions demandées
 * ("Voir mon billet" / "Télécharger mon billet PDF"), le billet visuel
 * (TicketCard) apparaissant au clic sur "Voir mon billet".
 */
export default function ReservationSuccessCard({
  ticket,
  reference,
  token,
}: ReservationSuccessCardProps) {
  const [showTicket, setShowTicket] = useState(false);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="rounded-lg border border-[#d5b58d]/45 bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-5 flex flex-col items-center gap-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </span>
          <h1 className="text-xl font-bold text-foreground">
            Réservation confirmée
          </h1>
          <p className="text-sm text-muted-foreground">
            Merci {ticket.participantName}, votre place est réservée.
          </p>
        </div>

        <dl className="space-y-2.5 border-t border-border/60 pt-5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Numéro de réservation</dt>
            <dd className="font-semibold text-primary">{ticket.ticketNumber}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Film</dt>
            <dd className="text-right font-semibold text-foreground">
              {ticket.film.title}
            </dd>
          </div>
          {ticket.screening.date && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Date</dt>
              <dd className="font-semibold text-foreground">
                {formatEventDateShort(ticket.screening.date)}
              </dd>
            </div>
          )}
          {ticket.screening.startTime && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Heure</dt>
              <dd className="font-semibold text-foreground">
                {ticket.screening.startTime}
              </dd>
            </div>
          )}
          {ticket.screening.venue && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Lieu</dt>
              <dd className="font-semibold text-foreground">
                {ticket.screening.venue}
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            className="flex-1"
            onClick={() => setShowTicket((v) => !v)}
          >
            <TicketIcon className="h-4 w-4" />
            {showTicket ? "Masquer mon billet" : "Voir mon billet"}
          </Button>
          <DownloadTicketButton
            reference={reference}
            token={token}
            className="flex-1"
          />
        </div>
      </div>

      {showTicket && <TicketCard ticket={ticket} />}

      <p className="text-center text-xs text-muted-foreground">
        Un e-mail de confirmation avec votre billet en pièce jointe vient de
        vous être envoyé.{" "}
        <Link href="/cinematheque" className="text-primary hover:text-secondary">
          Retour à la cinémathèque
        </Link>
      </p>
    </div>
  );
}
