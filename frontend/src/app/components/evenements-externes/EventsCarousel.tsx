"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Largeur d'une carte de carrousel : cinq cartes visibles à partir de `lg`
 * (quatre gouttières de 1.25rem retirées), défilement horizontal en dessous.
 */
export const CAROUSEL_ITEM_CLASS =
  "w-[240px] shrink-0 snap-start sm:w-[262px] lg:w-[calc((100%-5rem)/5)]";

interface EventsCarouselProps {
  children: React.ReactNode;
  /** Décrit la liste défilante pour les lecteurs d'écran. */
  label: string;
}

/**
 * Rangée de cartes défilant horizontalement, avec flèches flottantes qui
 * n'apparaissent que du côté où il reste du contenu à faire défiler.
 */
export default function EventsCarousel({
  children,
  label,
}: EventsCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const syncArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    syncArrows();
    const observer = new ResizeObserver(syncArrows);
    observer.observe(el);
    return () => observer.disconnect();
  }, [syncArrows]);

  const scrollByPage = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction * Math.max(260, el.clientWidth * 0.8),
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        onScroll={syncArrows}
        role="region"
        aria-label={label}
        className="scrollbar-none flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2"
      >
        {children}
      </div>

      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByPage(-1)}
          aria-label={`${label} : voir les précédents`}
          className="absolute -left-3 top-1/2 z-20 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-muted/40 bg-white text-foreground shadow-md transition-colors hover:bg-muted/20 sm:flex"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByPage(1)}
          aria-label={`${label} : voir les suivants`}
          className="absolute -right-3 top-1/2 z-20 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-muted/40 bg-white text-foreground shadow-md transition-colors hover:bg-muted/20 sm:flex"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
