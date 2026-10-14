import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { getEvents } from "@/services/eventService";
import { Card, CardContent, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import Link from "next/link";
import {
  FaCalendar,
  FaClock,
  FaMapPin,
  FaCircleCheck,
  FaClockRotateLeft,
  FaCircleXmark,
  FaArrowRight,
} from "react-icons/fa6";
import CancelRegistrationButton from "./CancelRegistrationButton";
import { formatEventDateTime, formatTimePeriod } from "@/lib/dateUtils";

export default async function MemberEventsPage() {
  const user = await getUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (user.role === "ADMIN") {
    redirect("/espace-membre/admin");
  }

  // Récupérer les inscriptions de l'utilisateur
  const registrations = await prisma.eventRegistration.findMany({
    where: {
      userId: user.dbUserId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Récupérer les détails des événements depuis le backend contenu
  const eventDetails = await Promise.all(
    registrations.map(async (registration) => {
      try {
        // Récupérer tous les événements et trouver celui qui correspond
        const events = await getEvents();
        const event = events.find(
          (e) => e.id.toString() === registration.eventId
        );
        return {
          registration,
          event,
        };
      } catch (error) {
        console.error(
          `Erreur lors de la récupération de l'événement ${registration.eventId}:`,
          error
        );
        return {
          registration,
          event: null,
        };
      }
    })
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200">
            <FaCircleCheck className="mr-1.5 h-3 w-3" />
            Confirmé
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-200">
            <FaClockRotateLeft className="mr-1.5 h-3 w-3" />
            En attente
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge
            variant="destructive"
            className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-200"
          >
            <FaCircleXmark className="mr-1.5 h-3 w-3" />
            Annulé
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Mes événements
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Retrouvez ici tous les événements auxquels vous êtes inscrit.
        </p>
      </div>

      {eventDetails.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/30 shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-background mb-4 shadow-sm">
              <FaCalendar className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Aucune inscription
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              Vous n&apos;avez pas encore d&apos;inscription. Découvrez notre
              programmation !
            </p>
            <Link href="/agenda">
              <Button>
                Découvrir les événements
                <FaArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {eventDetails.map(({ registration, event }) => (
            <Card
              key={registration.id}
              className="overflow-hidden border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 bg-card group"
            >
              <div className="flex flex-col md:flex-row">
                {/* Image Section */}
                <div className="w-full md:w-64 h-48 md:h-auto relative shrink-0 bg-muted">
                  {event?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted/50">
                      <FaCalendar className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 md:hidden">
                    {getStatusBadge(registration.status)}
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-primary uppercase tracking-wider">
                            {event?.discipline || "Événement"}
                          </span>
                          <div className="hidden md:block">
                            {getStatusBadge(registration.status)}
                          </div>
                        </div>
                        <CardTitle className="text-xl sm:text-2xl font-bold text-foreground line-clamp-1">
                          {event?.title || `Événement #${registration.eventId}`}
                        </CardTitle>
                      </div>
                    </div>

                    {event && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-2">
                          <FaCalendar className="h-4 w-4 text-primary/70 shrink-0" />
                          <span>
                            {formatEventDateTime(
                              event.startDate,
                              event.endDate
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaClock className="h-4 w-4 text-primary/70 shrink-0" />
                          <span>
                            {formatTimePeriod(event.startTime, event.endTime)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 sm:col-span-2">
                          <FaMapPin className="h-4 w-4 text-primary/70 shrink-0" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-border/50 mt-2">
                    <p className="text-xs text-muted-foreground">
                      Inscrit le{" "}
                      {new Date(registration.createdAt).toLocaleDateString(
                        "fr-FR",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )}
                    </p>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {registration.status === "PENDING" && (
                        <div className="w-full sm:w-auto">
                          <CancelRegistrationButton
                            registrationId={registration.id}
                          />
                        </div>
                      )}

                      {event?.slug && (
                        <Link
                          href={`/evenement/${event.slug}`}
                          className="w-full sm:w-auto"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full cursor-pointer sm:w-auto h-9"
                          >
                            Voir détails
                            <FaArrowRight className="ml-2 h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
