"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
} from "lucide-react";
import { formatEventDateShort } from "@/lib/dateUtils";
import type { Programme } from "@/lib/programmes-data";

interface FeaturedExternalEventProps {
  events: Programme[];
}

/**
 * Événement mis en avant : visuel à gauche, informations et réservation à
 * droite, avec navigation entre les événements phares.
 */
export default function FeaturedExternalEvent({
  events,
}: FeaturedExternalEventProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (events.length === 0) return null;

  const event = events[currentIndex];

  const goTo = (direction: 1 | -1) =>
    setCurrentIndex(
      (previous) => (previous + direction + events.length) % events.length
    );

  return (
    <section
      id="a-la-une"
      className="scroll-mt-32 border-b border-muted/30 bg-white py-12 sm:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {events.length > 1 && (
          <div className="mb-4 flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {currentIndex + 1} / {events.length} à la une
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goTo(-1)}
                aria-label="Événement à la une précédent"
                className="cursor-pointer rounded-full border border-muted/50 p-2 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/20 hover:text-foreground sm:p-2.5"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => goTo(1)}
                aria-label="Événement à la une suivant"
                className="cursor-pointer rounded-full border border-muted/50 p-2 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/20 hover:text-foreground sm:p-2.5"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 items-center gap-8 rounded-2xl border border-muted/30 bg-muted/10 p-4 shadow-sm sm:p-6 lg:grid-cols-12 lg:p-8">
          {/* Visuel */}
          <Link
            href={`/evenements-externes/${event.slug}`}
            className="group relative block overflow-hidden rounded-xl shadow-md lg:col-span-6"
          >
            <div className="relative h-72 w-full sm:h-96 lg:h-[420px]">
              <Image
                src={event.image || "/motif-luba.png"}
                alt={event.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <span className="absolute left-4 top-4 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm">
              À la une
            </span>
          </Link>

          {/* Informations */}
          <div className="flex flex-col justify-between gap-6 py-2 lg:col-span-6">
            <div>
              {event.category && (
                <span className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:text-sm">
                  {event.category}
                </span>
              )}

              <h2 className="mb-4 text-2xl font-semibold leading-tight text-foreground sm:text-4xl">
                <Link
                  href={`/evenements-externes/${event.slug}`}
                  className="transition-colors hover:text-primary"
                >
                  {event.title}
                </Link>
              </h2>

              <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-foreground/80 sm:text-sm">
                {event.startDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary" />
                    {formatEventDateShort(event.startDate, event.endDate)}
                  </span>
                )}
                {event.startTime && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-primary" />
                    {event.startTime}
                  </span>
                )}
                {(event.spaceName || event.location) && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    {event.spaceName || event.location}
                  </span>
                )}
              </div>

              <p className="text-sm font-light leading-relaxed text-muted-foreground sm:text-base">
                {event.slogan || event.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 border-t border-muted/40 pt-4">
              <span
                className={`rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white ${
                  event.isFree ? "bg-emerald-600" : "bg-[#c85a32]"
                }`}
              >
                {event.isFree ? "GRATUIT" : "PAYANT"}
              </span>

              <Link
                href={`/evenements-externes/${event.slug}`}
                className="ml-auto inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-secondary active:scale-95"
              >
                <span>{event.isFree ? "S’inscrire" : "Réserver ma place"}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {events.length > 1 && (
          <div className="mt-5 flex items-center justify-center gap-2">
            {events.map((item, index) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => setCurrentIndex(index)}
                aria-label={`Aller à l'événement à la une : ${item.title}`}
                aria-current={index === currentIndex ? "true" : undefined}
                className={`h-2 cursor-pointer rounded-full transition-all ${
                  index === currentIndex
                    ? "w-6 bg-primary"
                    : "w-2 bg-muted/60 hover:bg-muted"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
