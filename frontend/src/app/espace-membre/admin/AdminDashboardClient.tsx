"use client";

import type { DehydratedState } from "@tanstack/react-query";
import { HydrationBoundary } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Users,
  BarChart3,
  UserPlus,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminStatsQuery } from "@/hooks/useAdminDashboardQuery";
import { useEventsWithRegistrationsQuery } from "@/hooks/useEventsQuery";
import { Badge } from "../../components/ui/badge";

interface AdminDashboardClientProps {
  dehydratedState: DehydratedState;
}

function AdminDashboardContent() {
  const { data, isLoading, isError, error: queryError } = useAdminStatsQuery();
  const {
    data: eventsWithRegistrations = [],
    isLoading: isLoadingEvents,
    isError: isErrorEvents,
    // error: eventsError,
  } = useEventsWithRegistrationsQuery();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="h-8 w-64 bg-muted rounded animate-pulse" />
          <div className="h-4 w-80 bg-muted rounded mt-3 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="border-none shadow-sm bg-white py-4">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
                </div>
                <div className="h-7 w-16 bg-muted rounded animate-pulse mt-2" />
                <div className="h-3 w-24 bg-muted rounded mt-2 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm bg-white py-4">
            <CardHeader>
              <div className="h-6 w-48 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0"
                  >
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="h-3 w-16 bg-muted rounded animate-pulse ml-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white py-4">
            <CardHeader>
              <div className="h-6 w-48 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0"
                  >
                    <div className="space-y-2">
                      <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard Administrateur
        </h1>
        <div className="p-4 rounded-lg bg-red-50 text-red-600 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">
            Impossible de charger les statistiques admin.
            {queryError && (
              <span className="block text-xs opacity-80 mt-1">
                {queryError.message}
              </span>
            )}
          </p>
        </div>
      </div>
    );
  }

  const { totalMembers, totalActivities, newMembersThisWeek, recentMembers } =
    data;

  const stats = [
    {
      title: "Membres Totaux",
      value: totalMembers.toString(),
      icon: Users,
      description: `${newMembersThisWeek} nouveaux cette semaine`,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Événements à Venir",
      value: eventsWithRegistrations.length.toString(),
      icon: Calendar,
      description: "Prochains événements",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Activités",
      value: totalActivities.toString(),
      icon: BarChart3,
      description: "Actions enregistrées",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard Administrateur
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bienvenue dans l&apos;espace de gestion du CCAPAC
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="border-none shadow-sm bg-white hover:shadow-md transition-shadow py-4"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <div
                    className={cn("rounded-full p-2", stat.bgColor, stat.color)}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Members */}
        <Card className="border-none shadow-sm bg-white py-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Derniers Membres
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Aucun membre pour le moment
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentMembers.map((member) => {
                  const now = new Date();
                  const memberDate = new Date(member.createdAt);
                  const diffTime = Math.abs(
                    now.getTime() - memberDate.getTime()
                  );
                  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                  let dateLabel = "";
                  if (diffDays === 0) {
                    dateLabel = "Aujourd'hui";
                  } else if (diffDays === 1) {
                    dateLabel = "Hier";
                  } else if (diffDays < 7) {
                    dateLabel = `Il y a ${diffDays} jours`;
                  } else {
                    dateLabel = memberDate.toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                    });
                  }

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 hover:bg-muted/30 rounded-lg transition-colors group"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium truncate text-foreground group-hover:text-primary transition-colors">
                            {member.name}
                          </p>
                          {member.emailVerified && (
                            <Badge
                              variant="secondary"
                              className="bg-green-50 text-green-700 hover:bg-green-100 border-0 text-[10px] px-1.5 py-0 h-5"
                            >
                              Vérifié
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {dateLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="border-none shadow-sm bg-white py-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Événements à Venir
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingEvents ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0"
                  >
                    <div className="space-y-2">
                      <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            ) : isErrorEvents ? (
              <div className="p-4 rounded-lg bg-red-50 text-red-600 text-sm">
                Impossible de charger les événements
              </div>
            ) : eventsWithRegistrations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Aucun événement à venir
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {eventsWithRegistrations.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 hover:bg-muted/30 rounded-lg transition-colors group"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                        {event.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>
                          {new Date(event.startDate).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs font-normal text-muted-foreground bg-white"
                    >
                      {event.discipline}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminDashboardClient({
  dehydratedState,
}: AdminDashboardClientProps) {
  return (
    <HydrationBoundary state={dehydratedState}>
      <AdminDashboardContent />
    </HydrationBoundary>
  );
}
