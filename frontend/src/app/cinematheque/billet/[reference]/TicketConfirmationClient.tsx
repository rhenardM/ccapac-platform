"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, TicketX } from "lucide-react";
import Link from "next/link";
import { getTicketByReference } from "@/services/ticketService";
import type { Ticket } from "@/types/ticket";
import ReservationSuccessCard from "@/app/components/cinematheque/ReservationSuccessCard";

interface TicketConfirmationClientProps {
  reference: string;
}

type LoadState = "loading" | "success" | "not-found";

export default function TicketConfirmationClient({
  reference,
}: TicketConfirmationClientProps) {
  const searchParams = useSearchParams();
  const token = searchParams.get("t") ?? "";

  const [state, setState] = useState<LoadState>("loading");
  const [ticket, setTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!token) {
      setState("not-found");
      return;
    }

    getTicketByReference(reference, token).then((result) => {
      if (cancelled) return;
      if (result) {
        setTicket(result);
        setState("success");
      } else {
        setState("not-found");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [reference, token]);

  if (state === "loading") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center text-primary">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm text-muted-foreground">Chargement de votre billet…</p>
      </div>
    );
  }

  if (state === "not-found" || !ticket) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border border-border/60 bg-white p-8 text-center shadow-xl">
        <TicketX className="h-10 w-10 text-destructive" />
        <div className="space-y-1.5">
          <h1 className="text-lg font-bold text-foreground">Billet introuvable</h1>
          <p className="text-sm text-muted-foreground">
            Ce lien est invalide ou a expiré. Vérifiez le lien reçu par e-mail,
            ou contactez-nous si le problème persiste.
          </p>
        </div>
        <Link
          href="/cinematheque"
          className="text-sm font-medium text-primary hover:text-secondary"
        >
          Retour à la cinémathèque
        </Link>
      </div>
    );
  }

  return (
    <ReservationSuccessCard ticket={ticket} reference={reference} token={token} />
  );
}
