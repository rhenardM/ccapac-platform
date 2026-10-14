import { Calendar, Clock, MapPin, Languages, Film as FilmIcon } from "lucide-react";
import type { Ticket } from "@/types/ticket";
import { formatEventDateShort } from "@/lib/dateUtils";

interface TicketCardProps {
  ticket: Ticket;
}

const STATUS_STYLES: Record<Ticket["status"], string> = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  used: "bg-white/10 text-white/60 border-white/20",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
};

/**
 * Le billet numérique lui-même, dans l'esprit graphique du modèle fourni par
 * le Centre : talon noir/or (infos de séance) + souche crème (numéro + QR),
 * séparés par une découpe pointillée. Empilé en une colonne pour un rendu
 * mobile-first (contrairement au PDF, en deux panneaux côte à côte).
 */
export default function TicketCard({ ticket }: TicketCardProps) {
  return (
    <div className="overflow-hidden rounded-xl shadow-xl">
      {/* Talon */}
      <div className="relative bg-gradient-to-br from-[#1f1610] to-[#100b07] px-6 py-7 text-white sm:px-8 sm:py-8">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-primary text-[10px] font-bold text-primary">
            CC
          </span>
          <div className="leading-tight">
            <p className="text-[11px] font-bold tracking-wide">CENTRE CULTUREL</p>
            <p className="text-[9px] tracking-wide text-primary">
              ET ARTISTIQUE POUR LES PAYS D&apos;AFRIQUE CENTRALE
            </p>
          </div>
        </div>

        <p className="mb-1 text-xs font-bold tracking-[0.3em] text-primary">
          CINÉ-DIMANCHE
        </p>
        <h2 className="font-serif text-2xl font-bold leading-tight sm:text-3xl">
          Billet de Cinéma
        </h2>
        <p className="mt-1 text-sm italic text-white/60">
          Une rencontre, une histoire, une émotion.
        </p>

        <div className="my-5 h-px w-full max-w-xs bg-white/20" />

        <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm sm:grid-cols-3">
          <InfoItem icon={Calendar} label="Date">
            {ticket.screening.date ? formatEventDateShort(ticket.screening.date) : "—"}
          </InfoItem>
          <InfoItem icon={Clock} label="Heure">
            {ticket.screening.startTime || "—"}
          </InfoItem>
          <InfoItem icon={MapPin} label="Salle">
            {ticket.screening.venue || "—"}
          </InfoItem>
          <InfoItem icon={FilmIcon} label="Film">
            {ticket.film.title || "—"}
          </InfoItem>
          {ticket.film.director && (
            <InfoItem label="Réalisateur">{ticket.film.director}</InfoItem>
          )}
          {ticket.film.language && (
            <InfoItem icon={Languages} label="Langue">
              {ticket.film.language}
            </InfoItem>
          )}
        </div>

        <div className="mt-5 border-t border-dashed border-white/20 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
            Participant
          </p>
          <p className="text-sm font-semibold">{ticket.participantName}</p>
        </div>
      </div>

      {/* Découpe */}
      <div className="relative h-0 border-t border-dashed border-[#d5b58d]/70">
        <span className="absolute -left-2 -top-2 h-4 w-4 rounded-full bg-[#f4efe4]" />
        <span className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-[#f4efe4]" />
      </div>

      {/* Souche */}
      <div className="flex flex-col items-center gap-3 bg-[#fbf7ef] px-6 py-6 text-center sm:px-8">
        <span className="rounded-md bg-primary px-3 py-1.5 text-sm font-bold tracking-wide text-[#2a1a10]">
          N° {ticket.ticketNumber}
        </span>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[ticket.status]}`}
        >
          ● {ticket.statusLabel}
        </span>

        {/* eslint-disable-next-line @next/next/no-img-element -- SVG servi par le backend, hors du pipeline next/image */}
        <img src={ticket.qrCodeUrl} alt="QR Code du billet" className="h-32 w-32" />

        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a7a6a]">
          Scanez pour accéder à votre séance
        </p>
      </div>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  children,
}: {
  icon?: typeof Calendar;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-primary">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p className="text-sm font-semibold text-white">{children}</p>
    </div>
  );
}
