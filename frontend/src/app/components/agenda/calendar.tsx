"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { formatEventDateTime, formatTimePeriod } from "@/lib/dateUtils";
import {
  FaCalendar,
  FaClock,
  FaList,
  FaMapPin,
  FaMagnifyingGlass,
  FaPalette,
  FaUsers,
  FaXmark,
} from "react-icons/fa6";
import Image from "next/image";
import type { Event } from "@/types/events";
import { Skeleton } from "@/components/ui/skeleton";
import MonthlyCalendar from "./MonthlyCalendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { filterOptions, DEFAULT_FILTER_VALUE } from "../../../data/events";


interface CalendarProps {
  events: Event[];
  loading?: boolean;
}

// Fonction utilitaire
const capitalizeFirst = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

export default function Calendar({ events, loading = false }: CalendarProps) {
  const router = useRouter();
  const [visibleEvents, setVisibleEvents] = useState(6);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  
  // États des filtres
  const [selectedMonth, setSelectedMonth] = useState<string>(DEFAULT_FILTER_VALUE);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>(DEFAULT_FILTER_VALUE);
  const [selectedPublic, setSelectedPublic] = useState<string>(DEFAULT_FILTER_VALUE);

  // Filtrer les événements
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Filtre par mois
      if (selectedMonth !== DEFAULT_FILTER_VALUE) {
        const eventDate = new Date(event.startDate);
        // Récupérer le mois en minuscules depuis la date
        const monthNames = filterOptions.months.map(m => m.toLowerCase());
        const eventMonth = monthNames[eventDate.getMonth()];
        if (eventMonth !== selectedMonth.toLowerCase()) return false;
      }

      // Filtre par discipline
      if (selectedDiscipline !== DEFAULT_FILTER_VALUE && event.discipline !== selectedDiscipline) {
        return false;
      }

      // Filtre par public
      if (selectedPublic !== DEFAULT_FILTER_VALUE && event.public !== selectedPublic) {
        return false;
      }

      return true;
    });
  }, [events, selectedMonth, selectedDiscipline, selectedPublic]);

  // Trie les événements du plus récent au plus ancien
  const sortedEvents = [...filteredEvents].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const loadMoreEvents = () => {
    setVisibleEvents((prev) => prev + 6);
  };

  const displayedEvents = sortedEvents.slice(0, visibleEvents);
  const hasMoreEvents = visibleEvents < sortedEvents.length;

  // Réinitialiser le nombre visible quand les filtres changent
  useEffect(() => {
    setVisibleEvents(6);
}, [filteredEvents]);

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = 
    selectedMonth !== DEFAULT_FILTER_VALUE || 
    selectedDiscipline !== DEFAULT_FILTER_VALUE || 
    selectedPublic !== DEFAULT_FILTER_VALUE;

  // Réinitialiser tous les filtres
  const clearFilters = () => {
    setSelectedMonth(DEFAULT_FILTER_VALUE);
    setSelectedDiscipline(DEFAULT_FILTER_VALUE);
    setSelectedPublic(DEFAULT_FILTER_VALUE);
  };

  return (
    <section className="py-8 sm:py-10 md:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background via-muted/5 to-background">
      <div className="max-w-7xl mx-auto">
        {/* Sélecteur de vue - Version colorée */}
        <div className="flex justify-end mb-8">
          <div className="flex bg-[#F3EEE5] rounded-xl p-1 border border-[#D1965B]/30 shadow-lg">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg font-semibold transition-all duration-300 ${
                viewMode === "list"
                  ? "bg-[#D1965B] text-white shadow-md"
                  : "text-[#5C4033] hover:bg-white/60"
              }`}
            >
              <FaList className={viewMode === "list" ? "text-white" : "text-[#D1965B]"} />
              Liste
            </button>

            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg font-semibold transition-all duration-300 ${
                viewMode === "calendar"
                  ? "bg-[#D1965B] text-white shadow-md"
                  : "text-[#5C4033] hover:bg-white/60"
              }`}
            >
              <FaCalendar className={viewMode === "calendar" ? "text-white" : "text-[#D1965B]"} />
              Calendrier
            </button>
          </div>
        </div>

        {/* Filtres - UNIQUEMENT en mode liste */}
        {viewMode === "list" && (
          <div className="mb-8">
            <div className="bg-gradient-to-br from-white to-muted/10 rounded-xl sm:rounded-2xl border border-muted/20 p-4 sm:p-5 md:p-6 lg:p-8 shadow-lg">
              <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                {/* Filters */}
                <div className="flex rounded-lg sm:rounded-xl flex-col sm:flex-row gap-3 sm:gap-4 md:gap-5 lg:gap-6 flex-1">
                  {/* Filtre Mois */}
                  <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
                    <label
                      htmlFor="filter-month"
                      className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base font-semibold text-foreground"
                    >
                      <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/20 flex-shrink-0">
                        <FaCalendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-primary" />
                      </div>
                      <span>Mois</span>
                    </label>
                    <Select
                      value={selectedMonth}
                      onValueChange={(value) => setSelectedMonth(value)}
                    >
                      <SelectTrigger
                        id="filter-month"
                        className="w-full bg-gradient-to-r from-muted/30 to-muted/10 border-muted/30 focus:border-primary focus:ring-primary/20 rounded-lg sm:rounded-xl h-10 sm:h-11 md:h-12 transition-all duration-300 text-xs sm:text-sm md:text-base"
                      >
                        <SelectValue placeholder="Sélectionner un mois" />
                      </SelectTrigger>
                      <SelectContent className="border-muted/30 rounded-xl">
                        {filterOptions.months.map((month) => (
                          <SelectItem
                            key={month}
                            value={month}
                            className="hover:bg-primary/10 focus:bg-primary/10 rounded-lg text-xs sm:text-sm"
                          >
                            {capitalizeFirst(month)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtre Discipline */}
                  <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
                    <label
                      htmlFor="filter-discipline"
                      className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base font-semibold text-foreground"
                    >
                      <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/20 flex-shrink-0">
                        <FaPalette className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-primary" />
                      </div>
                      <span>Discipline</span>
                    </label>
                    <Select
                      value={selectedDiscipline}
                      onValueChange={(value) => setSelectedDiscipline(value)}
                    >
                      <SelectTrigger
                        id="filter-discipline"
                        className="w-full bg-gradient-to-r from-muted/30 to-muted/10 border-muted/30 focus:border-primary focus:ring-primary/20 rounded-lg sm:rounded-xl h-10 sm:h-11 md:h-12 transition-all duration-300 text-xs sm:text-sm md:text-base"
                      >
                        <SelectValue placeholder="Sélectionner une discipline" />
                      </SelectTrigger>
                      <SelectContent className="border-muted/30 rounded-xl">
                        {filterOptions.disciplines.map((discipline) => (
                          <SelectItem
                            key={discipline}
                            value={discipline}
                            className="hover:bg-primary/10 focus:bg-primary/10 rounded-lg text-xs sm:text-sm"
                          >
                            {discipline}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtre Public */}
                  <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
                    <label
                      htmlFor="filter-public"
                      className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base font-semibold text-foreground"
                    >
                      <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/20 flex-shrink-0">
                        <FaUsers className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-primary" />
                      </div>
                      <span>Public</span>
                    </label>
                    <Select
                      value={selectedPublic}
                      onValueChange={(value) => setSelectedPublic(value)}
                    >
                      <SelectTrigger
                        id="filter-public"
                        className="w-full bg-gradient-to-r from-muted/30 to-muted/10 border-muted/30 focus:border-primary focus:ring-primary/20 rounded-lg sm:rounded-xl h-10 sm:h-11 md:h-12 transition-all duration-300 text-xs sm:text-sm md:text-base"
                      >
                        <SelectValue placeholder="Sélectionner un public" />
                      </SelectTrigger>
                      <SelectContent className="border-muted/30 rounded-xl">
                        {filterOptions.publics.map((publicType) => (
                          <SelectItem
                            key={publicType}
                            value={publicType}
                            className="hover:bg-primary/10 focus:bg-primary/10 rounded-lg text-xs sm:text-sm"
                          >
                            {publicType}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Résultats et bouton effacer */}
                <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 lg:items-center lg:min-w-fit">
                  {/* Résultats */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {sortedEvents.length} événement{sortedEvents.length > 1 ? 's' : ''} trouvé{sortedEvents.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Active Filters */}
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center lg:justify-start">
                    {selectedMonth !== DEFAULT_FILTER_VALUE && (
                      <Badge className="bg-gradient-to-r from-primary/10 to-primary/20 text-primary border-primary/30 px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm">
                        <FaCalendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 flex-shrink-0" />
                        <span className="truncate max-w-[100px] sm:max-w-none">
                          {capitalizeFirst(selectedMonth)}
                        </span>
                      </Badge>
                    )}
                    {selectedDiscipline !== DEFAULT_FILTER_VALUE && (
                      <Badge className="bg-gradient-to-r from-primary/10 to-primary/20 text-primary border-primary/30 px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm">
                        <FaPalette className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 flex-shrink-0" />
                        <span className="truncate max-w-[100px] sm:max-w-none">
                          {selectedDiscipline}
                        </span>
                      </Badge>
                    )}
                    {selectedPublic !== DEFAULT_FILTER_VALUE && (
                      <Badge className="bg-gradient-to-r from-primary/10 to-primary/20 text-primary border-primary/30 px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm">
                        <FaUsers className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 flex-shrink-0" />
                        <span className="truncate max-w-[100px] sm:max-w-none">
                          {selectedPublic}
                        </span>
                      </Badge>
                    )}
                  </div>

                  {/* Clear Button */}
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="border-2 border-destructive/30 text-destructive rounded-lg sm:rounded-xl cursor-pointer hover:bg-destructive hover:text-white bg-transparent transition-all duration-300 hover:scale-105 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm flex items-center gap-1.5"
                    >
                      <FaXmark className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                      <span className="truncate">Effacer les filtres</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calendrier mensuel interactif - UNIQUEMENT en mode calendrier */}
        {viewMode === "calendar" && (
          <div className="mb-12">
            <div className="bg-[#D1965B] rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-wider">
                      Calendrier des événements
                    </h2>
                    <p className="text-white/80 text-sm mt-1">
                      Sélectionnez une date pour voir les programmes
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center">
                    <FaCalendar className="text-white text-xl" />
                  </div>
                </div>
                <MonthlyCalendar events={sortedEvents} />
              </div>
            </div>
          </div>
        )}

        {/* Vue liste - UNIQUEMENT en mode liste */}
        {viewMode === "list" && (
          <>
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <EventCardSkeleton key={i} />
                ))}
              </div>
            )}

            {!loading && sortedEvents.length === 0 && (
              <div className="text-center py-12 sm:py-16 md:py-20">
                <div className="bg-gradient-to-br from-muted/20 to-muted/10 rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-12 lg:p-16 max-w-lg mx-auto border border-muted/20 shadow-lg">
                  <FaMagnifyingGlass className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-muted-foreground mx-auto mb-4 sm:mb-5 md:mb-6" />
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-2 sm:mb-3 md:mb-4">
                    Aucun événement trouvé
                  </h3>
                  <p className="text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed px-2">
                    Essayez de modifier vos critères de recherche pour découvrir nos
                    événements
                  </p>
                </div>
              </div>
            )}

            {!loading && sortedEvents.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
                  {displayedEvents.map((event) => (
                    <Card
                      key={event.id}
                      className="group cursor-pointer transition-all duration-300 hover:shadow-lg border-muted/30 rounded-xl hover:border-[#D1965B]/50 overflow-hidden bg-white"
                      onClick={() => router.push(`/evenement/${event.slug}`)}
                    >
                      <div className="relative aspect-[16/9] overflow-hidden bg-muted/20">
                        <Image
                          src={event.image || "/placeholder.svg"}
                          alt={event.title}
                          fill
                          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                          priority={false}
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />

                        <div className="absolute top-2 sm:top-3 md:top-4 left-2 sm:left-3 md:left-4 flex flex-col gap-1.5 sm:gap-2">
                          <Badge className="bg-[#D1965B] text-white shadow-sm text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1">
                            <span className="truncate max-w-[80px] sm:max-w-none">
                              {event.discipline}
                            </span>
                          </Badge>
                          <Badge className="bg-white/90 text-[#5C4033] shadow-sm text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1">
                            <span className="truncate max-w-[80px] sm:max-w-none">
                              {event.public}
                            </span>
                          </Badge>
                        </div>
                      </div>

                      <div className="p-4 sm:p-5 md:p-6">
                        <CardHeader className="p-0 mb-3 sm:mb-4 md:mb-5">
                          <CardTitle className="text-base sm:text-lg md:text-xl font-bold uppercase text-[#5C4033] group-hover:text-[#D1965B] transition-colors line-clamp-2 leading-tight">
                            {event.title}
                          </CardTitle>
                        </CardHeader>

                        <CardContent className="p-0">
                          <div className="space-y-2.5 sm:space-y-3">
                            <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 text-xs sm:text-sm text-muted-foreground">
                              <div className="p-1.5 sm:p-2 rounded-lg bg-[#D1965B]/10 flex-shrink-0">
                                <FaCalendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-[#D1965B]" />
                              </div>
                              <span className="line-clamp-1 font-medium truncate text-[#5C4033]">
                                {formatEventDateTime(event.startDate, event.endDate)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 text-xs sm:text-sm text-muted-foreground">
                              <div className="p-1.5 sm:p-2 rounded-lg bg-[#D1965B]/10 flex-shrink-0">
                                <FaClock className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-[#D1965B]" />
                              </div>
                              <span className="font-medium truncate text-[#5C4033]">
                                {formatTimePeriod(event.startTime, event.endTime)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 text-xs sm:text-sm text-muted-foreground">
                              <div className="p-1.5 sm:p-2 rounded-lg bg-[#D1965B]/10 flex-shrink-0">
                                <FaMapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-[#D1965B]" />
                              </div>
                              <span className="line-clamp-1 font-medium truncate text-[#5C4033]">
                                {event.location}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  ))}
                </div>

                {hasMoreEvents && (
                  <div className="text-center mt-12 sm:mt-14 md:mt-16 lg:mt-20">
                    <button
                      onClick={loadMoreEvents}
                      className="justify-center cursor-pointer space-x-2 bg-gradient-to-r from-[#D1965B] to-[#B8834A] text-white px-4 sm:px-5 md:px-6 lg:px-8 py-2.5 sm:py-3 md:py-4 font-bold text-xs sm:text-sm md:text-base hover:from-[#B8834A] hover:to-[#D1965B] transition-all duration-300 shadow-lg hover:shadow-xl rounded-lg sm:rounded-xl hover:scale-105"
                    >
                      Charger plus d&apos;événements
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function EventCardSkeleton() {
  return (
    <Card className="border-muted/30 rounded-xl overflow-hidden bg-white animate-pulse">
      <div className="relative aspect-[16/9] bg-muted/20 flex items-start p-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
      <div className="p-4 sm:p-5 md:p-6 space-y-4">
        <div className="mb-3 sm:mb-4 md:mb-5">
          <Skeleton className="h-6 w-5/6" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}