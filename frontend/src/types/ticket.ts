/**
 * Billet numérique de cinémathèque — servi par NOTRE backend
 * (/api/cinematheque/tickets/{reference}), voir services/ticketService.ts.
 */

export type TicketStatus = "active" | "used" | "cancelled";

export interface Ticket {
  ticketNumber: string;
  status: TicketStatus;
  statusLabel: string;
  generatedAt: string;
  participantName: string | null;
  registrationDate: string | null;
  film: {
    title: string | null;
    poster: string | null;
    language: string | null;
    director: string | null;
  };
  screening: {
    date: string | null;
    startTime: string | null;
    venue: string | null;
  };
  qrCodeUrl: string;
}
