import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import MainLayout from "@/app/components/layouts/MainLayout";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import ViewTracker from "@/app/components/ViewTracker";
import ViewCount from "@/app/components/ViewCount";
import ScreeningRegistrationForm from "@/app/components/cinematheque/ScreeningRegistrationForm";
import {
  FaArrowLeft,
  FaArrowRight,
  FaLanguage,
  FaCalendar,
  FaLocationDot,
  FaShieldHalved,
  FaTicket,
} from "react-icons/fa6";
import { formatEventDateShort } from "@/lib/dateUtils";
import { CINEMATHEQUE_API_BASE_URL } from "@/lib/content-api";
import {
  getFilmBySlug,
  getFilms,
  getRelatedFilms,
} from "@/services/cinemathequeService";
import { SCREENING_STATUS_LABELS, type Film, type Screening } from "@/types/film";
import BackButton from "@/app/components/BackButton";

export async function generateStaticParams() {
  const films = await getFilms();
  return films.map((film) => ({ slug: film.slug }));
}

interface FilmPageProps {
  params: Promise<{ slug: string }>;
}

/** Convertit une URL YouTube/Vimeo classique en URL d'intégration (iframe). */
function toEmbedUrl(url: string): string | null {
  const youtube = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`;

  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;

  return null;
}

/** Prochaine séance à venir/en cours, sinon la plus récente (terminée/annulée). */
function pickHighlightedScreening(screenings: Screening[]): Screening | undefined {
  const active = screenings
    .filter((s) => s.status === "upcoming" || s.status === "ongoing")
    .sort((a, b) => a.date.localeCompare(b.date));
  if (active[0]) return active[0];

  return [...screenings].sort((a, b) => b.date.localeCompare(a.date))[0];
}

export default async function FilmPage({ params }: FilmPageProps) {
  const { slug } = await params;
  const film = await getFilmBySlug(slug);

  if (!film) {
    notFound();
  }

  const screenings = film.screenings ?? [];
  const highlighted = pickHighlightedScreening(screenings);
  const otherScreenings = screenings.filter((s) => s.id !== highlighted?.id);
  const relatedFilms = await getRelatedFilms(slug, film.categories, 3);

  const remainingSeats =
    highlighted?.capacityTotal != null && highlighted?.capacityTaken != null
      ? highlighted.capacityTotal - highlighted.capacityTaken
      : null;
  const fillRate =
    highlighted?.capacityTotal ? Math.round(((highlighted.capacityTaken ?? 0) / highlighted.capacityTotal) * 100) : null;

  const canBook =
    !!highlighted &&
    (highlighted.status === "upcoming" || highlighted.status === "ongoing") &&
    remainingSeats !== 0;

  const embedUrl = film.trailerUrl ? toEmbedUrl(film.trailerUrl) : null;

  return (
    <MainLayout>
      <ViewTracker
        sessionKey={`film-viewed:${film.slug}`}
        url={`${CINEMATHEQUE_API_BASE_URL}/films/${encodeURIComponent(film.slug)}/view`}
      />
      {highlighted && (
        <ViewTracker
          sessionKey={`screening-viewed:${highlighted.id}`}
          url={`${CINEMATHEQUE_API_BASE_URL}/screenings/${highlighted.id}/view`}
        />
      )}

      {/* Hero immersif */}
      <section className="relative w-full min-h-[70vh] mt-16 sm:mt-20 lg:mt-24 overflow-hidden bg-foreground">
        <div className="absolute inset-0">
          <Image
            src={film.backdrop || film.poster || "/placeholder.svg"}
            alt={film.title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/50 to-foreground/20" />
        </div>

        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-10 sm:pb-14 md:pb-16 pt-24">
          <BackButton
            fallbackHref="/cinematheque"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 sm:mb-6 transition-colors text-xs sm:text-sm uppercase tracking-widest font-medium w-fit"
          >
            <FaArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Retour
          </BackButton>

          <div className="flex flex-col lg:flex-row items-end gap-8 sm:gap-10 lg:gap-12">
            <div className="hidden lg:block w-56 xl:w-64 aspect-[2/3] shadow-2xl relative shrink-0 -mb-24 xl:-mb-28">
              <Image
                src={film.poster || "/placeholder.svg"}
                alt={film.title}
                fill
                className="object-cover"
                sizes="256px"
              />
            </div>

            <div className="flex-1 space-y-4 sm:space-y-6 pb-2">
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {film.categories.length > 0 && (
                  <Badge className="bg-primary/20 text-primary-foreground border border-white/20 text-[10px] sm:text-xs uppercase tracking-widest px-3 py-1.5">
                    {film.categories.join(" / ")}
                  </Badge>
                )}
                {film.duration && (
                  <Badge className="bg-white/10 text-white border border-white/20 text-[10px] sm:text-xs uppercase tracking-widest px-3 py-1.5">
                    {film.duration} Minutes
                  </Badge>
                )}
                {film.ageRating && (
                  <Badge className="bg-white/10 text-white border border-white/20 text-[10px] sm:text-xs uppercase tracking-widest px-3 py-1.5">
                    {film.ageRating}
                  </Badge>
                )}
                {highlighted && (
                  <Badge className="bg-white/10 text-white border border-white/20 text-[10px] sm:text-xs uppercase tracking-widest px-3 py-1.5">
                    {SCREENING_STATUS_LABELS[highlighted.status]}
                  </Badge>
                )}
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl italic uppercase font-bold text-white leading-[0.95] drop-shadow-lg">
                {film.title}
              </h1>

              <div className="flex flex-wrap items-center gap-5 sm:gap-8 text-white/90 text-xs sm:text-sm font-medium uppercase tracking-wider">
                {film.language && (
                  <div className="flex items-center gap-2">
                    <FaLanguage className="text-accent" />
                    {film.language}
                  </div>
                )}
                {highlighted && (
                  <div className="flex items-center gap-2">
                    <FaCalendar className="text-accent" />
                    Dimanche {formatEventDateShort(highlighted.date)} • {highlighted.startTime}
                  </div>
                )}
                {highlighted && (
                  <div className="flex items-center gap-2">
                    <FaLocationDot className="text-accent" />
                    {highlighted.venue}
                  </div>
                )}
                {film.viewCount > 0 && (
                  <ViewCount count={film.viewCount} className="text-white/90" />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contenu principal */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-20 grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 lg:gap-16">
        {/* Colonne gauche : détails */}
        <div className="lg:col-span-7 space-y-10 sm:space-y-12">
          {film.synopsis && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-3 sm:gap-4">
                <span className="w-6 sm:w-8 h-px bg-border" />
                Synopsis
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed first-letter:text-4xl sm:first-letter:text-5xl first-letter:font-bold first-letter:mr-2 sm:first-letter:mr-3 first-letter:float-left first-letter:text-primary">
                {film.synopsis}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-y-8 sm:gap-y-10 gap-x-6 sm:gap-x-8 pt-4 sm:pt-6 border-t border-border/60">
            {film.director && (
              <div className="space-y-1.5 sm:space-y-2">
                <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Réalisateur
                </span>
                <p className="text-lg sm:text-xl font-bold text-foreground">
                  {film.director}
                </p>
              </div>
            )}
            {film.country && (
              <div className="space-y-1.5 sm:space-y-2">
                <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Pays
                </span>
                <p className="text-lg sm:text-xl font-bold text-foreground">
                  {film.country}
                </p>
              </div>
            )}
            {film.cast && film.cast.length > 0 && (
              <div className="space-y-1.5 sm:space-y-2 col-span-2">
                <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Acteurs Principaux
                </span>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {film.cast.join(", ")}
                </p>
              </div>
            )}
            {film.year && (
              <div className="space-y-1.5 sm:space-y-2">
                <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Année
                </span>
                <p className="text-lg sm:text-xl font-bold text-foreground">
                  {film.year}
                </p>
              </div>
            )}
          </div>

          {embedUrl && (
            <div className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 border-t border-border/60">
              <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-3 sm:gap-4">
                <span className="w-6 sm:w-8 h-px bg-border" />
                Bande-annonce
              </h2>
              <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
                <iframe
                  src={embedUrl}
                  title={`Bande-annonce — ${film.title}`}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {otherScreenings.length > 0 && (
            <div className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 border-t border-border/60">
              <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-3 sm:gap-4">
                <span className="w-6 sm:w-8 h-px bg-border" />
                Autres séances
              </h2>
              <ul className="space-y-2">
                {otherScreenings.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between text-sm text-muted-foreground"
                  >
                    <span>
                      Dimanche {formatEventDateShort(s.date)} — {s.startTime} • {s.venue}
                    </span>
                    <Badge variant="outline">{SCREENING_STATUS_LABELS[s.status]}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Colonne droite : réservation */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28 p-6 sm:p-8 md:p-10 bg-muted/20 border border-border/60 shadow-xl space-y-6 sm:space-y-8 rounded-xl">
            <div className="flex justify-between items-end border-b border-border/60 pb-5 sm:pb-6">
              <div className="space-y-1">
                <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase">
                  Tarif
                </span>
                <div className="flex items-baseline gap-1">
                  {highlighted?.isFree ? (
                    <span className="text-2xl sm:text-3xl font-bold text-emerald-600 uppercase">
                      Gratuit
                    </span>
                  ) : (
                    <>
                      <span className="text-3xl sm:text-4xl font-bold text-primary">
                        {highlighted?.price ?? "—"}
                      </span>
                      {highlighted?.price != null && (
                        <span className="text-xs sm:text-sm font-semibold text-primary uppercase">
                          FC
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
              {remainingSeats !== null && highlighted?.capacityTotal != null && (
                <div className="text-right">
                  <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase">
                    Disponibilité
                  </span>
                  <div className="text-lg sm:text-xl font-bold text-foreground">
                    {remainingSeats} / {highlighted.capacityTotal} places
                  </div>
                </div>
              )}
            </div>

            {fillRate !== null && (
              <div className="space-y-2.5 sm:space-y-3">
                <div className="w-full h-1.5 bg-border overflow-hidden rounded-full">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700"
                    style={{ width: `${fillRate}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-tight">
                  <span>
                    {fillRate >= 90 ? "Séance en forte demande" : "Places disponibles"}
                  </span>
                  <span>{fillRate}% rempli</span>
                </div>
              </div>
            )}

            <BookingButton screening={highlighted} canBook={canBook} remainingSeats={remainingSeats} />

            <div className="pt-2 flex items-center justify-center gap-6 sm:gap-8 opacity-60">
              <FaTicket className="text-muted-foreground" />
              <FaShieldHalved className="text-muted-foreground" />
            </div>
          </div>
        </div>
      </section>

      {/* Galerie */}
      {film.gallery && film.gallery.length > 0 && (
        <section className="mt-16 sm:mt-20 bg-muted/10 py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-2 sm:space-y-3 mb-8 sm:mb-10">
              <span className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.4em]">
                Visuels
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Galerie
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {film.gallery.map((item, index) => (
                <div
                  key={`${item.image}-${index}`}
                  className="relative aspect-[4/3] overflow-hidden bg-muted/30 rounded-lg"
                >
                  <Image
                    src={item.image}
                    alt={item.caption || film.title}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Films similaires */}
      {relatedFilms.length > 0 && (
        <section className="py-14 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 border-t border-border/40">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 sm:mb-8 text-center uppercase tracking-tight">
              À voir aussi
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              {relatedFilms.map((related) => (
                <RelatedFilmCard key={related.slug} film={related} />
              ))}
            </div>
          </div>
        </section>
      )}
    </MainLayout>
  );
}

function BookingButton({
  screening,
  canBook,
  remainingSeats,
}: {
  screening: Screening | undefined;
  canBook: boolean;
  remainingSeats: number | null;
}) {
  if (canBook && screening?.isFree) {
    return (
      <ScreeningRegistrationForm
        screeningId={screening.id}
        screeningLabel={`${screening.filmTitle} — ${formatEventDateShort(screening.date)}`}
        triggerClassName="w-full py-5 sm:py-6 uppercase tracking-[0.2em] text-xs sm:text-sm"
      />
    );
  }

  const label = !screening
    ? "Aucune séance programmée"
    : !canBook
      ? remainingSeats === 0
        ? "Complet"
        : SCREENING_STATUS_LABELS[screening.status]
      : "Réserver ma place";

  const href = canBook && screening?.bookingUrl ? screening.bookingUrl : "/infos";

  return (
    <Link href={href} className="block" target={canBook && screening?.bookingUrl ? "_blank" : undefined}>
      <Button
        disabled={!screening || !canBook}
        className="w-full py-5 sm:py-6 uppercase tracking-[0.2em] text-xs sm:text-sm group"
      >
        {label}
        {canBook && <FaArrowRight className="group-hover:translate-x-1 transition-transform" />}
      </Button>
    </Link>
  );
}

function RelatedFilmCard({ film }: { film: Film }) {
  return (
    <Link href={`/cinematheque/${film.slug}`} className="group block">
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-3 sm:mb-4">
        <Image
          src={film.poster || "/placeholder.svg"}
          alt={film.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
      <h3 className="font-bold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors mb-1 line-clamp-2">
        {film.title}
      </h3>
      <p className="text-xs sm:text-sm text-muted-foreground">
        {film.categories.join(", ")}
      </p>
    </Link>
  );
}
