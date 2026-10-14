"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Programme } from "@/lib/programmes-data";
import EventsCarousel, { CAROUSEL_ITEM_CLASS } from "./EventsCarousel";

interface PastExternalEventsProps {
  events: Programme[];
}

/** Découpe une date ISO en jour / mois abrégé / année pour la pastille. */
function splitDate(isoDate: string) {
  const date = new Date(isoDate);
  return {
    day: String(date.getDate()).padStart(2, "0"),
    month: date
      .toLocaleDateString("fr-FR", { month: "short" })
      .replace(".", "")
      .toUpperCase(),
    year: String(date.getFullYear()),
  };
}

export default function PastExternalEvents({
  events,
}: PastExternalEventsProps) {
  if (events.length === 0) return null;

  return (
    <section
      id="passes"
      className="scroll-mt-32 border-b border-muted/30 bg-muted/15 py-12 sm:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
            Événements passés
          </h2>
        </div>

        <EventsCarousel label="Événements passés">
          {events.map((event) => (
            <article key={event.slug} className={CAROUSEL_ITEM_CLASS}>
              <PastEventCard event={event} />
            </article>
          ))}
        </EventsCarousel>
      </div>
    </section>
  );
}

function PastEventCard({ event }: { event: Programme }) {
  const dateInfo = event.startDate ? splitDate(event.startDate) : null;

  return (
    <Link
      href={`/evenements-externes/${event.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-[#12100e] text-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative h-40 overflow-hidden">
        <Image
          src={event.image || "/motif-luba.png"}
          alt={event.title}
          fill
          sizes="(max-width: 640px) 60vw, 20vw"
          className="object-cover opacity-80 grayscale-[30%] transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-[#12100e] via-[#12100e]/25 to-transparent" />

        <span className="absolute right-3 top-3 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/80 bg-white/10">
          Terminé
        </span>

        {dateInfo && (
          <span className="absolute left-4 top-3 flex flex-col leading-none">
            <span className="text-2xl font-bold tracking-tight text-white">
              {dateInfo.day}
            </span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/80">
              {dateInfo.month}
            </span>
            <span className="text-[10px] font-light text-white/60">
              {dateInfo.year}
            </span>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {event.category && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
            {event.category}
          </span>
        )}

        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-white transition-colors group-hover:text-primary">
          {event.title}
        </h3>

        <p className="line-clamp-2 text-xs font-light leading-relaxed text-white/60">
          {event.slogan || event.description}
        </p>

        {(event.spaceName || event.location) && (
          <span className="mt-auto flex items-center gap-1.5 pt-1 text-xs text-white/60">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate">{event.spaceName || event.location}</span>
          </span>
        )}
      </div>
    </Link>
  );
}
