"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import type { Programme } from "@/lib/programmes-data";
import EventsCarousel, { CAROUSEL_ITEM_CLASS } from "./EventsCarousel";

const ALL_FILTER = "Tous";

interface UpcomingExternalEventsProps {
  events: Programme[];
}

/** Découpe une date ISO en jour / mois / année pour la pastille des cartes. */
function splitDate(isoDate: string) {
  const date = new Date(isoDate);
  return {
    day: String(date.getDate()).padStart(2, "0"),
    month: date.toLocaleDateString("fr-FR", { month: "long" }).toUpperCase(),
    year: String(date.getFullYear()),
  };
}

export default function UpcomingExternalEvents({
  events,
}: UpcomingExternalEventsProps) {
  const filters = useMemo(() => {
    const categories = Array.from(
      new Set(events.map((event) => event.category).filter(Boolean))
    );
    return [ALL_FILTER, ...categories];
  }, [events]);

  const [filter, setFilter] = useState<string>(ALL_FILTER);

  const visibleEvents =
    filter === ALL_FILTER
      ? events
      : events.filter((event) => event.category === filter);

  return (
    <section
      id="a-venir"
      className="scroll-mt-32 border-b border-muted/30 bg-white py-12 sm:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
            Événements à venir
          </h2>
        </div>

        {/* Filtres par rubrique */}
        {filters.length > 1 && (
          <div className="scrollbar-none -mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1">
            {filters.map((option) => {
              const isActive = filter === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  aria-pressed={isActive}
                  className={`shrink-0 cursor-pointer rounded-md border px-4 py-2 text-xs font-medium transition-colors sm:text-sm ${
                    isActive
                      ? "border-primary bg-primary text-white shadow-sm"
                      : "border-muted/50 bg-white text-foreground/80 hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        )}

        {visibleEvents.length === 0 ? (
          <p className="rounded-xl border border-dashed border-muted/50 bg-muted/10 p-10 text-center text-sm text-muted-foreground">
            Aucun événement à venir dans cette catégorie pour le moment.
          </p>
        ) : (
          <EventsCarousel label="Événements à venir">
            {visibleEvents.map((event) => (
              <article key={event.slug} className={CAROUSEL_ITEM_CLASS}>
                <UpcomingEventCard event={event} />
              </article>
            ))}
          </EventsCarousel>
        )}
      </div>
    </section>
  );
}

function UpcomingEventCard({ event }: { event: Programme }) {
  const href = `/evenements-externes/${event.slug}`;
  const dateInfo = event.startDate ? splitDate(event.startDate) : null;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-muted/40 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <Link href={href} className="relative block h-40 overflow-hidden">
        <Image
          src={event.image || "/motif-luba.png"}
          alt={event.title}
          fill
          sizes="(max-width: 640px) 60vw, 20vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

        <span
          className={`absolute left-3 top-3 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ${
            event.isFree ? "bg-emerald-600" : "bg-[#c85a32]"
          }`}
        >
          {event.isFree ? "GRATUIT" : "PAYANT"}
        </span>

        {dateInfo && (
          <span className="absolute bottom-3 left-3 flex flex-col leading-none text-white">
            <span className="text-2xl font-bold tracking-tight">
              {dateInfo.day}
            </span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/90">
              {dateInfo.month}
            </span>
            <span className="text-[10px] font-light text-white/70">
              {dateInfo.year}
            </span>
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {event.category && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {event.category}
          </span>
        )}

        <h3 className="text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          <Link href={href} className="line-clamp-2">
            {event.title}
          </Link>
        </h3>

        {(event.spaceName || event.location) && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate">{event.spaceName || event.location}</span>
          </span>
        )}

        {event.startTime && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0 text-primary" />
            {event.startTime}
          </span>
        )}

        <p className="line-clamp-2 text-xs font-light leading-relaxed text-muted-foreground">
          {event.slogan || event.description}
        </p>

        <Link
          href={href}
          className={`mt-auto inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2.5 text-xs font-medium transition-all active:scale-95 ${
            event.isFree
              ? "border border-primary/60 bg-white text-primary hover:bg-primary/10"
              : "bg-primary text-white shadow-sm hover:bg-secondary"
          }`}
        >
          {event.isFree ? "S’inscrire" : "Réserver ma place"}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
