"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, Star } from "lucide-react";

const TABS = [
  { id: "a-la-une", label: "À la une", icon: Star },
  { id: "a-venir", label: "À venir", icon: Calendar },
  { id: "passes", label: "Passés", icon: Clock },
] as const;

/**
 * Barre d'onglets collée sous l'en-tête : elle fait défiler jusqu'à la section
 * choisie et met en avant celle qui occupe l'écran pendant la lecture.
 */
export default function ExternalEventsTabs() {
  const [activeId, setActiveId] = useState<string>(TABS[0].id);

  useEffect(() => {
    const sections = TABS.map((tab) => document.getElementById(tab.id)).filter(
      (element): element is HTMLElement => element !== null
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (mostVisible) setActiveId(mostVisible.target.id);
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: [0, 0.2, 0.5, 1] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="sticky top-16 z-30 border-b border-muted/40 bg-white/95 backdrop-blur-md sm:top-[4.5rem] lg:top-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-6 sm:gap-16">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeId === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveId(tab.id);
                  document
                    .getElementById(tab.id)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                aria-current={isActive ? "true" : undefined}
                className={`relative flex cursor-pointer items-center gap-2 px-2 py-4 text-sm transition-colors sm:text-base ${
                  isActive
                    ? "font-semibold text-foreground"
                    : "font-medium text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon
                  className={`h-4 w-4 sm:h-5 sm:w-5 ${
                    isActive ? "text-primary" : "text-muted-foreground/70"
                  }`}
                />
                <span>{tab.label}</span>

                {isActive && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-t-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
