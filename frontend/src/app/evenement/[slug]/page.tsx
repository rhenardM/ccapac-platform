import Image from "next/image";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { FaArrowLeft, FaCalendar, FaClock, FaMapPin } from "react-icons/fa6";
import MainLayout from "@/app/components/layouts/MainLayout";
import { getEventBySlug } from "@/services/eventService";
import { Event } from "@/types/events";
import {
  formatEventDateTime,
  formatTimePeriod,
} from "@/lib/dateUtils";
import EventRsvpForm from "@/app/components/events/EventRsvpForm";
import EventRegistrationStatus from "@/app/components/events/EventRegistrationStatus";
import BackButton from "@/app/components/BackButton";

interface EventDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { slug } = await params;
  const events = await getEventBySlug(slug);
  const event: Event | null = events[0] ?? null;

  if (!event) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh] mt-16 sm:mt-20 md:mt-24 px-4">
          <div className="text-center w-full">
            <div className="bg-gradient-to-br from-muted/20 to-muted/10 rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-12 max-w-lg mx-auto border border-muted/20 shadow-lg">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 sm:mb-4">
                Événement non trouvé
              </h1>
              <p className="text-muted-foreground mb-4 sm:mb-6 text-xs sm:text-sm md:text-base leading-relaxed px-2">
                L&apos;événement que vous recherchez n&apos;existe pas ou a été
                supprimé.
              </p>
              <Link href="/agenda" className="inline-block">
                <Button className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary rounded-lg sm:rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 shadow-lg text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-2.5">
                  <FaArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Retour à l&apos;agenda
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  const referenceDate = event.endDate || event.startDate;
  const isUpcoming = Boolean(
    referenceDate && referenceDate.split("T")[0] >= new Date().toISOString().split("T")[0]
  );
  const canRegister = event.isRegistrationOpen && isUpcoming;

  return (
    <MainLayout>
      <EventRegistrationStatus />
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-background">
        <section className="pt-24 sm:pt-28 md:pt-32 lg:pt-48 pb-8 sm:pb-10 md:pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <BackButton fallbackHref="/agenda" className="inline-block mb-5 sm:mb-6">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border-muted/40 cursor-pointer bg-white text-foreground shadow-sm transition-all duration-300 hover:border-primary/50 hover:bg-primary/5 px-3 sm:px-4 py-1.5 sm:py-2"
              >
                <FaArrowLeft className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                <span className="font-semibold text-xs sm:text-sm">Retour</span>
              </Button>
            </BackButton>

            <div className="mb-5 sm:mb-6 flex flex-wrap gap-1.5 sm:gap-2 md:gap-3">
              <Badge className="bg-primary text-primary-foreground px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold rounded-lg shadow-sm">
                {event.discipline}
              </Badge>
              <Badge
                variant="outline"
                className="border-muted/50 text-foreground bg-white px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold rounded-lg shadow-sm"
              >
                {event.public}
              </Badge>
              {event.category && (
                <Badge
                  variant="outline"
                  className="border-muted/50 text-foreground bg-white px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold rounded-lg shadow-sm"
                >
                  {event.category}
                </Badge>
              )}
            </div>

            <div className="max-w-4xl">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 leading-tight text-balance text-foreground">
                  {event.title}
                </h1>

                {event.slogan && (
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground italic text-pretty font-light max-w-4xl leading-relaxed">
                    &ldquo;{event.slogan}&rdquo;
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 sm:mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
              <div className="space-y-8 sm:space-y-10">
                <div className="rounded-xl border border-muted/30 bg-muted/20 p-3 sm:p-4 shadow-sm">
                  <div className="relative aspect-[16/9] max-h-[70vh] overflow-hidden rounded-lg bg-white">
                    <div className="absolute inset-0 bg-[url('/motif-lub.png')] bg-center bg-cover opacity-[0.04]" />
                    <Image
                      src={event.image || "/placeholder.svg"}
                      alt={event.title}
                      fill
                      className="object-cover object-center"
                      priority
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 65vw, 760px"
                      quality={90}
                    />
                  </div>
                </div>

                <section>
                  <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 lg:p-8 xl:p-10 shadow-sm border border-muted/30">
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-primary mb-4 sm:mb-5 md:mb-6 lg:mb-8 flex items-center gap-2 sm:gap-3">
                      <div className="w-1.5 sm:w-2 h-6 sm:h-7 md:h-8 lg:h-10 bg-primary rounded-full flex-shrink-0" />
                      <span>Description</span>
                    </h2>
                    <div
                      className="prose prose-sm sm:prose-base md:prose-lg lg:prose-xl max-w-none text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed text-foreground/90"
                      dangerouslySetInnerHTML={{ __html: event.description }}
                    />
                  </div>
                </section>
              </div>

              <aside className="lg:sticky lg:top-28 space-y-4">
                {canRegister && (
                  <EventRsvpForm
                    eventSlug={event.slug}
                    eventTitle={event.title}
                    triggerClassName="w-full rounded-xl shadow-sm"
                  />
                )}

                <div className="rounded-xl border border-muted/30 bg-white p-4 sm:p-5 shadow-sm">
                  <div className="mb-4 border-b border-muted/20 pb-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Détails pratiques
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-foreground">
                      Informations de l&apos;événement
                    </h2>
                  </div>

                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex gap-3 rounded-lg bg-muted/20 p-3">
                      <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <FaCalendar className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold uppercase text-muted-foreground">
                          {event.endDate ? "Période" : "Date"}
                        </div>
                        <div className="mt-0.5 font-semibold leading-snug text-foreground">
                          {formatEventDateTime(event.startDate, event.endDate)}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 rounded-lg bg-muted/20 p-3">
                      <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <FaClock className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold uppercase text-muted-foreground">
                          {event.endTime ? "Horaires" : "Heure"}
                        </div>
                        <div className="mt-0.5 font-semibold leading-snug text-foreground">
                          {formatTimePeriod(event.startTime, event.endTime)}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 rounded-lg bg-muted/20 p-3">
                      <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <FaMapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold uppercase text-muted-foreground">
                          Lieu
                        </div>
                        <div className="mt-0.5 font-semibold leading-snug text-foreground">
                          {event.location}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg border border-muted/30 px-3 py-2.5 text-sm">
                    <span className="font-semibold text-foreground">
                      Inscription:
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {canRegister ? "ouverte" : "fermée"}
                    </span>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
