"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FaArrowRight, FaCalendar } from "react-icons/fa";
import Link from "next/link";
import { getUpcomingOrRecentEvents } from "@/services/eventService";
import { Event } from "@/types/events";
import { formatEventPeriod, formatTimePeriod } from "@/lib/dateUtils";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuickAgenda() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Chargement des prochains événements (limité à 5)
  useEffect(() => {
    const loadUpcomingEvents = async () => {
      try {
        // Prochains événements ; à défaut, les plus récents (évite une section vide).
        const upcomingEvents = await getUpcomingOrRecentEvents(6);
        setEvents(upcomingEvents);
      } catch {
        // Affiche l'état vide prévu par le composant si l'API est indisponible.
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadUpcomingEvents();
  }, []);

  if (loading) {
    return (
      <section className="py-16 sm:py-20 bg-gradient-to-br from-background via-muted/5 to-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-gradient-to-r from-secondary/10 to-secondary/20 px-6 py-3 mb-6 rounded-xl border border-secondary/20">
              <FaCalendar className="w-5 h-5 text-secondary mr-2" />
              <span className="text-secondary font-semibold text-sm uppercase tracking-wide">
                Agenda Culturel
              </span>
            </div>
            <h2 className="text-2xl uppercase lg:text-4xl font-bold text-foreground mb-6 leading-tight drop-shadow-sm">
              Prochains Événements
            </h2>
          </div>
          <QuickAgendaSkeleton />
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return (
      <section className="py-16 sm:py-20 bg-gradient-to-br from-background via-muted/5 to-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-gradient-to-r from-secondary/10 to-secondary/20 px-6 py-3 mb-6 rounded-xl border border-secondary/20">
              <FaCalendar className="w-5 h-5 text-secondary mr-2" />
              <span className="text-secondary font-semibold text-sm uppercase tracking-wide">
                Agenda Culturel
              </span>
            </div>
            <h2 className="text-2xl uppercase md:text-4xl font-bold text-foreground mb-6 leading-tight drop-shadow-sm">
              Prochains Événements
            </h2>
          </div>
          <div className="text-center">
            <div className="bg-gradient-to-br from-muted/20 to-muted/10 rounded-2xl p-12 max-w-lg mx-auto border border-muted/20 shadow-lg">
              <p className="text-lg text-muted-foreground mb-8">
                Aucun événement programmé pour le moment.
              </p>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Revenez bientôt pour découvrir notre programmation !
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const displayedEvents = events.slice(0, 5);
  const hasMoreEvents = events.length > 5;
  const hasSecondaryEvents = displayedEvents.length > 1;
  const secondaryEvents = displayedEvents.slice(1);
  const secondaryCount = secondaryEvents.length;
  const useFourCardLayout = displayedEvents.length === 4;

  const getSecondaryCardClass = (index: number) => {
    if (secondaryCount === 1) return "sm:col-span-2 lg:col-span-6 lg:h-full";
    if (secondaryCount === 2) return "lg:col-span-3";
    if (secondaryCount === 3) {
      return index === 0
        ? "sm:col-span-2 lg:col-span-6 lg:h-52"
        : "lg:col-span-3";
    }

    return index === 0 || index === 3
      ? "sm:col-span-2 lg:col-span-4"
      : "lg:col-span-2";
  };

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-br from-background via-muted/5 to-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-gradient-to-r from-secondary/10 to-secondary/20 px-6 py-3 mb-6 rounded-xl border border-secondary/20">
            <FaCalendar className="w-5 h-5 text-secondary mr-2" />
            <span className="text-secondary font-semibold text-sm uppercase tracking-wide">
              Agenda Culturel
            </span>
          </div>
          <h2 className="text-2xl uppercase md:text-4xl font-bold text-foreground mb-6 leading-tight drop-shadow-sm">
            Prochains Événements
          </h2>
        </div>

        {useFourCardLayout ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 mb-12">
            {displayedEvents.map((event) => (
              <Link
                key={event.id}
                href={`/evenement/${event.slug}`}
                className="group rounded-xl bg-white shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border border-muted/20"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-muted/20">
                  <Image
                    src={event.image || "/placeholder.svg"}
                    alt={event.title}
                    fill
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>

                <div className="p-4 sm:p-5">
                  <div className="text-2xl sm:text-3xl font-bold text-black leading-none mb-2">
                    {
                      formatEventPeriod(event.startDate, event.endDate).dayMonth
                        .day
                    }
                  </div>
                  <div className="text-xs sm:text-sm uppercase tracking-wide text-black/70 mb-2 sm:mb-3">
                    {
                      formatEventPeriod(event.startDate, event.endDate).dayMonth
                        .month
                    }
                  </div>
                  <div className="text-[11px] sm:text-xs uppercase tracking-wide text-primary mb-2">
                    {event.category || event.discipline}
                  </div>
                  <h3 className="text-sm uppercase sm:text-base font-bold text-black mb-2 line-clamp-2">
                    {event.title}
                  </h3>
                  <div className="text-xs sm:text-sm text-black/70 line-clamp-2">
                    {event.location} -{" "}
                    {formatTimePeriod(event.startTime, event.endTime)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div
            className={`flex flex-col gap-8 mb-12 ${
              hasSecondaryEvents
                ? "lg:flex-row"
                : "max-w-4xl mx-auto lg:max-w-5xl"
            }`}
          >
          {/* Featured Event - Left Side */}
          <div
            className={`w-full flex justify-center ${
              hasSecondaryEvents ? "lg:w-1/3 lg:justify-start" : ""
            }`}
          >
            <Link
              href={`/evenement/${displayedEvents[0].slug}`}
              className={`relative rounded-2xl overflow-hidden shadow-xl group cursor-pointer hover:shadow-2xl transition-all duration-300 ${
                hasSecondaryEvents
                  ? "h-80 w-80 sm:h-96 sm:w-96 lg:h-[28rem] lg:w-[28rem]"
                  : "w-full max-w-4xl"
              }`}
            >
              <div
                className={`bg-gradient-to-br from-primary to-primary/80 flex ${
                  hasSecondaryEvents
                    ? "absolute inset-0 flex-col"
                    : "flex-col md:grid md:grid-cols-[0.9fr_1.4fr]"
                }`}
              >
                <div
                  className={`p-4 sm:p-6 lg:p-8 flex flex-col justify-center text-white ${
                    hasSecondaryEvents
                      ? "h-3/5 sm:h-1/2 pt-8 sm:pt-10 lg:pt-12"
                      : "min-h-72"
                  }`}
                >
                  <div>
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-none mb-4 lg:mb-5 drop-shadow-lg">
                      {
                        formatEventPeriod(
                          displayedEvents[0].startDate,
                          displayedEvents[0].endDate
                        ).dayMonth.day
                      }
                    </div>
                    <div className="text-sm lg:text-base uppercase tracking-wide mb-4 lg:mb-5 drop-shadow-md">
                      {
                        formatEventPeriod(
                          displayedEvents[0].startDate,
                          displayedEvents[0].endDate
                        ).dayMonth.month
                      }
                    </div>
                    <div className="text-xs lg:text-sm uppercase tracking-wide opacity-90 mb-2 lg:mb-3">
                      {displayedEvents[0].category ||
                        displayedEvents[0].discipline}
                    </div>
                    <h3 className="text-lg uppercase lg:text-xl font-bold mb-3 lg:mb-4 drop-shadow-md">
                      {displayedEvents[0].title}
                    </h3>
                    <div className="text-xs lg:text-sm opacity-90">
                      {displayedEvents[0].location} -{" "}
                      {formatTimePeriod(
                        displayedEvents[0].startTime,
                        displayedEvents[0].endTime
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className={`relative ${
                    hasSecondaryEvents
                      ? "h-2/5 sm:h-1/2 p-3 lg:p-4"
                      : "aspect-[16/9] md:h-full md:aspect-auto"
                  }`}
                >
                  <div className="relative h-full overflow-hidden rounded-lg">
                    <Image
                      src={displayedEvents[0].image || "/placeholder.svg"}
                      alt={displayedEvents[0].title}
                      fill
                      className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      sizes={
                        hasSecondaryEvents
                          ? "(max-width: 1024px) 20rem, 28rem"
                          : "(max-width: 768px) 100vw, 55vw"
                      }
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Events Grid - Right Side */}
          {hasSecondaryEvents && (
            <div className="w-full lg:w-2/3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 lg:gap-6 lg:h-[28rem]">
                {secondaryEvents.map((event, index) => {
                  const isFiveEventWideCard =
                    secondaryCount === 4 && (index === 0 || index === 3);
                  const isFiveEventTextCard =
                    secondaryCount === 4 && !isFiveEventWideCard;

                  return (
                    <Link
                      key={event.id}
                      href={`/evenement/${event.slug}`}
                      className={`${getSecondaryCardClass(
                        index
                      )} group rounded-xl bg-white shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border border-muted/20 min-h-0`}
                    >
                      <div
                        className={`h-full min-h-0 ${
                          isFiveEventWideCard
                            ? "flex flex-col sm:flex-row"
                            : secondaryCount === 1
                            ? "grid lg:grid-cols-[0.9fr_1.1fr]"
                            : "grid grid-rows-[auto_1fr]"
                        }`}
                      >
                        {!isFiveEventTextCard && (
                          <div
                            className={`relative overflow-hidden bg-muted/20 ${
                              isFiveEventWideCard
                                ? "h-44 sm:h-full sm:w-1/2"
                                : secondaryCount === 1
                                ? "aspect-[16/9] lg:aspect-auto lg:h-full"
                                : "aspect-[16/9]"
                            }`}
                          >
                            <Image
                              src={event.image || "/placeholder.svg"}
                              alt={event.title}
                              fill
                              className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                          </div>
                        )}

                        <div
                          className={`min-h-0 p-4 sm:p-5 ${
                            isFiveEventWideCard ? "sm:w-1/2" : ""
                          }`}
                        >
                          <div className="text-2xl sm:text-3xl font-bold text-black leading-none mb-2">
                            {
                              formatEventPeriod(event.startDate, event.endDate)
                                .dayMonth.day
                            }
                          </div>
                          <div className="text-xs sm:text-sm uppercase tracking-wide text-black/70 mb-2 sm:mb-3">
                            {
                              formatEventPeriod(event.startDate, event.endDate)
                                .dayMonth.month
                            }
                          </div>
                          <div className="text-[11px] sm:text-xs uppercase tracking-wide text-primary mb-2">
                            {event.category || event.discipline}
                          </div>
                          <h3 className="text-sm uppercase sm:text-base font-bold text-black mb-2 line-clamp-2">
                            {event.title}
                          </h3>
                          <div className="text-xs sm:text-sm text-black/70 line-clamp-2">
                            {event.location} -{" "}
                            {formatTimePeriod(event.startTime, event.endTime)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
          </div>
        )}

        {hasMoreEvents && (
          <div className="text-center">
            <Link href="/agenda">
              <button className="bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent rounded-xl text-sm sm:text-base cursor-pointer text-black px-8 py-4 font-bold transition-all duration-300 inline-flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105">
                Voir l&apos;agenda complet
                <FaArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function QuickAgendaSkeleton() {
  return (
    <div className="flex flex-col gap-8 mb-12 lg:flex-row">
      {/* Featured Event Skeleton (Left) */}
      <div className="w-full flex justify-center lg:w-1/3 lg:justify-start">
        <div className="relative rounded-2xl overflow-hidden shadow-lg h-80 w-80 sm:h-96 sm:w-96 lg:h-[28rem] lg:w-[28rem] border border-muted/20 bg-white p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <Skeleton className="h-12 w-16" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="relative h-2/5 sm:h-1/2 rounded-lg overflow-hidden mt-4">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>

      {/* Grid of Secondary Events Skeleton (Right) */}
      <div className="w-full lg:w-2/3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 lg:gap-6 lg:h-[28rem]">
          {[1, 2, 3].map((_, index) => {
            let gridClass = "lg:col-span-3";
            if (index === 0) gridClass = "sm:col-span-2 lg:col-span-6 lg:h-52";
            
            return (
              <div
                key={index}
                className={`${gridClass} rounded-xl bg-white shadow-lg overflow-hidden border border-muted/20 flex flex-col`}
              >
                {index === 0 ? (
                  <div className="h-full flex flex-col sm:flex-row">
                    <div className="relative h-44 sm:h-full sm:w-1/2 bg-muted/20">
                      <Skeleton className="h-full w-full" />
                    </div>
                    <div className="p-4 sm:p-5 sm:w-1/2 flex flex-col justify-center space-y-3">
                      <Skeleton className="h-8 w-12" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-5 w-5/6" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                ) : (
                  <div className="h-full grid grid-rows-[auto_1fr]">
                    <div className="relative aspect-[16/9] bg-muted/20">
                      <Skeleton className="h-full w-full" />
                    </div>
                    <div className="p-4 sm:p-5 space-y-3">
                      <Skeleton className="h-8 w-12" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-5 w-5/6" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
