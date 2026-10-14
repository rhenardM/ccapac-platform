"use client";

import { useState } from "react";
import {
  HiCalendar,
  HiUsers,
  HiClock,
  HiLocationMarker,
  HiSearch,
} from "react-icons/hi";
import {
  formatEventDateTime,
  formatTimePeriod,
  formatRegistrationDate,
} from "@/lib/dateUtils";

import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2 } from "lucide-react";
import { useEventsWithRegistrationsQuery } from "@/hooks/useEventsQuery";

export function EventsPageClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const {
    data: events = [],
    isLoading: loading,
    isError,
  } = useEventsWithRegistrationsQuery();

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.discipline.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRegistrations = events.reduce(
    (acc, curr) => acc + curr.registrationsCount,
    0
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Chargement...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <p className="text-destructive font-medium">
          Une erreur est survenue lors du chargement.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm underline text-muted-foreground hover:text-foreground"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Stats */}
      <div className="border-b border-border pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Événements
            </h1>
            <p className="text-muted-foreground text-sm">
              Gestion des événements et des inscriptions
            </p>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-right">
              <div className="text-2xl font-bold">{events.length}</div>
              <div className="text-xs text-muted-foreground uppercase font-medium">
                Événements
              </div>
            </div>
            <div className="w-px h-10 bg-border"></div>
            <div className="text-right">
              <div className="text-2xl font-bold">{totalRegistrations}</div>
              <div className="text-xs text-muted-foreground uppercase font-medium">
                Inscrits
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <input
          type="text"
          placeholder="Rechercher..."
          className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-input bg-background focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/70"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* List */}
      {filteredEvents.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm border border-dashed border-border rounded-lg bg-muted/5">
          Aucun événement trouvé.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <Card
              key={event.id}
              className="border border-border/60 shadow-none hover:border-border transition-colors rounded-lg overflow-hidden"
            >
              <CardHeader className="p-0">
                <div className="flex flex-col md:flex-row md:items-stretch">
                  {/* Left Highlight Strip */}
                  <div className="w-full md:w-1.5 h-1 md:h-auto bg-primary/20"></div>

                  <div className="flex-1 p-5 md:p-6 space-y-4">
                    {/* Top Row: Title & Badges */}
                    <div className="flex flex-col md:flex-row md:justify-between items-start gap-3">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-foreground leading-none">
                          {event.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-foreground/80">
                          <Badge
                            variant="secondary"
                            className="rounded-sm text-white font-medium text-xs px-1.5 py-0 h-5"
                          >
                            {event.discipline}
                          </Badge>
                          <span className="text-muted-foreground mx-1">•</span>
                          <span className="flex items-center gap-1.5">
                            <HiLocationMarker className="h-3.5 w-3.5 text-muted-foreground" />
                            {event.location}
                          </span>
                        </div>
                      </div>

                      {/* Date Block */}
                      <div className="flex items-center gap-3 text-sm bg-muted/30 px-3 py-1.5 rounded-md border border-border/50">
                        <div className="flex items-center gap-2">
                          <HiCalendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {formatEventDateTime(
                              event.startDate,
                              event.endDate
                            )}
                          </span>
                        </div>
                        <div className="w-px h-3 bg-border"></div>
                        <div className="flex items-center gap-2">
                          <HiClock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {formatTimePeriod(event.startTime, event.endTime)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content Row: Description & Participants */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
                      <p className="col-span-1 md:col-span-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {event.description}
                      </p>

                      <div className="flex items-end justify-start md:justify-end">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <HiUsers className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {event.registrationsCount} Inscrit
                            {event.registrationsCount > 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {/* Accordion for Participants */}
              <CardContent className="p-0 border-t border-border/40 bg-muted/5">
                <Accordion type="single" collapsible>
                  <AccordionItem value="participants" className="border-0">
                    <AccordionTrigger className="px-5 cursor-pointer py-3 text-sm text-muted-foreground hover:no-underline hover:text-foreground hover:bg-muted/10 transition-colors">
                      <span className="font-medium">
                        Gérer les inscriptions
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-5">
                      {event.registrationsCount > 0 ? (
                        <div className="border border-border rounded-md bg-background overflow-hidden">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-muted/20 text-muted-foreground font-medium border-b border-border">
                              <tr>
                                <th className="px-4 py-3 w-12 text-center">
                                  #
                                </th>
                                <th className="px-4 py-3">Participant</th>
                                <th className="px-4 py-3">
                                  Date d&apos;inscription
                                </th>
                                <th className="px-4 py-3 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                              {event.registrations.map((reg, idx) => (
                                <tr
                                  key={reg.id}
                                  className="hover:bg-muted/5 transition-colors"
                                >
                                  <td className="px-4 py-3 text-center text-muted-foreground">
                                    {idx + 1}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="font-medium text-foreground">
                                      {reg.userName}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {reg.userEmail}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-muted-foreground">
                                    {formatRegistrationDate(reg.registeredAt)}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <StatusBadge status={reg.status} />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground italic py-2">
                          Aucune inscription pour le moment.
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    CONFIRMED:
      "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
    CANCELLED:
      "text-red-700 bg-red-50 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    PENDING:
      "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  };

  const labels = {
    CONFIRMED: "Confirmé",
    CANCELLED: "Annulé",
    PENDING: "En attente",
  };

  const key = status as keyof typeof styles;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
        styles[key] || styles.PENDING
      }`}
    >
      {labels[key] || status}
    </span>
  );
}
