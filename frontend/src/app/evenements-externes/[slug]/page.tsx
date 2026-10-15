import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import MainLayout from "@/app/components/layouts/MainLayout";
import EventRegistrationForm from "@/app/components/evenements-externes/EventRegistrationForm";
import { Button } from "@/app/components/ui/button";
import {
  Home,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Archive,
} from "lucide-react";
import { formatEventDateShort } from "@/lib/dateUtils";
import {
  getProgrammeBySlug,
  isProgrammePast,
} from "@/lib/programmes-data";

// Contenu toujours frais (fetch `no-store`) : rendu à chaque requête. Une page
// pré-générée au build passerait en erreur 500 (« static to dynamic ») dès
// qu'un contenu est ajouté après le build ou que l'API est injoignable au build.
export const dynamic = "force-dynamic";

interface ExternalEventPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ExternalEventPage({
  params,
}: ExternalEventPageProps) {
  const { slug } = await params;
  const event = await getProgrammeBySlug(slug);

  if (!event || event.scope !== "externe") {
    notFound();
  }

  const isPast = isProgrammePast(event);

  return (
    <MainLayout>
      <div className="mt-16 sm:mt-20 lg:mt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Fil d'Ariane */}
        <nav
          aria-label="Fil d'Ariane"
          className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground mb-5 sm:mb-6"
        >
          <Link href="/" className="flex items-center gap-1 hover:text-primary transition-colors">
            <Home className="h-3.5 w-3.5" />
            Accueil
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/evenements-externes" className="hover:text-primary transition-colors">
            Événements externes
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium truncate max-w-[160px] sm:max-w-none">
            {event.title}
          </span>
        </nav>

        {/* Hero + action */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 lg:gap-8 items-start">
          <div className="relative rounded-2xl overflow-hidden bg-black min-h-[420px] sm:min-h-[460px] lg:min-h-[520px]">
            <Image
              src={event.image || "/motif-luba.png"}
              alt={event.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 65vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />

            <div className="relative z-10 h-full flex flex-col justify-end p-5 sm:p-8 gap-4 sm:gap-5">
              <div className="flex flex-wrap items-center gap-2">
                {event.category && (
                  <span className="inline-block w-fit rounded-full border border-accent/50 bg-accent/10 px-4 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-accent">
                    {event.category}
                  </span>
                )}
                <span
                  className={`inline-block w-fit rounded-full px-4 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white ${
                    isPast
                      ? "bg-white/15"
                      : event.isFree
                        ? "bg-emerald-600"
                        : "bg-[#c85a32]"
                  }`}
                >
                  {event.isFree ? "Gratuit" : "Payant"}
                </span>
                {isPast && (
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                    <Archive className="h-3 w-3" />
                    Terminé
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-[1.05] text-white max-w-xl">
                {event.title}
              </h1>

              {event.slogan && (
                <p className="text-sm sm:text-base text-white/80 max-w-lg leading-relaxed">
                  {event.slogan}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-white/90 text-xs sm:text-sm font-medium">
                {event.startDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="text-accent h-3.5 w-3.5" />
                    {formatEventDateShort(event.startDate, event.endDate)}
                  </div>
                )}
                {event.startTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="text-accent h-3.5 w-3.5" />
                    {event.startTime}
                    {event.endTime && ` - ${event.endTime}`}
                  </div>
                )}
                {(event.spaceName || event.location) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="text-accent h-3.5 w-3.5" />
                    {event.spaceName || event.location}
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-28">
            <div className="rounded-2xl border border-border/60 bg-white p-5 sm:p-6 space-y-5">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                {isPast ? "Événement terminé" : event.isFree ? "Inscription" : "Billetterie"}
              </h3>

              {isPast ? (
                <div className="rounded-xl border border-dashed border-muted/50 bg-muted/10 p-4 space-y-3">
                  <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Archive className="h-4 w-4 shrink-0 text-muted-foreground" />
                    Cet événement est passé : réservation et inscription ne
                    sont plus disponibles.
                  </p>
                  <Link
                    href="/evenements-externes#a-venir"
                    className="group inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-secondary transition-colors"
                  >
                    Voir les événements à venir
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              ) : event.isFree ? (
                <EventRegistrationForm
                  programSlug={event.slug}
                  programTitle={event.title}
                  triggerClassName="w-full py-5 sm:py-6 uppercase tracking-[0.1em] text-xs sm:text-sm"
                />
              ) : (
                <Link
                  href={event.externalUrl || "#"}
                  target={event.externalUrl ? "_blank" : undefined}
                  className="block"
                >
                  <Button
                    disabled={!event.externalUrl}
                    className="w-full py-5 sm:py-6 uppercase tracking-[0.1em] text-xs sm:text-sm group"
                  >
                    Réserver ma place
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              )}

              {event.spaceName && (
                <div className="pt-4 border-t border-border/60 space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Espace
                  </span>
                  <Link
                    href={`/grand-tambour/espaces/${event.spaceSlug}`}
                    className="block text-sm font-bold text-foreground hover:text-primary transition-colors"
                  >
                    {event.spaceName}
                  </Link>
                </div>
              )}

              {event.organizer && (
                <div className="pt-4 border-t border-border/60 space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Organisé par
                  </span>
                  <p className="text-sm font-bold text-foreground">{event.organizer}</p>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Description */}
        {event.description && (
          <div className="mt-10 sm:mt-12 rounded-2xl border border-border/60 bg-white p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-5">
              À propos de l&apos;événement
            </h2>
            <div
              className="prose prose-sm sm:prose-base max-w-none text-muted-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: event.description }}
            />
          </div>
        )}

        {/* Galerie */}
        {event.gallery.length > 0 && (
          <div className="mt-10 sm:mt-12">
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-5">
              Galerie
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {event.gallery.map((item, index) => (
                <div
                  key={`${item.image}-${index}`}
                  className="relative aspect-[4/3] overflow-hidden bg-muted/30 rounded-lg"
                >
                  <Image
                    src={item.image}
                    alt={item.caption || event.title}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
