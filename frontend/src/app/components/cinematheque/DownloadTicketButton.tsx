"use client";

import { Download } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface DownloadTicketButtonProps {
  reference: string;
  token: string;
  className?: string;
}

/** Ouvre le PDF du billet dans un nouvel onglet, via la route proxy Next.js. */
export default function DownloadTicketButton({
  reference,
  token,
  className,
}: DownloadTicketButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      onClick={() =>
        window.open(
          `/api/cinematheque/tickets/${encodeURIComponent(reference)}/download?t=${encodeURIComponent(token)}`,
          "_blank"
        )
      }
    >
      <Download className="h-4 w-4" />
      Télécharger mon billet PDF
    </Button>
  );
}
