import Image from "next/image";
import Link from "next/link";
import MainLayout from "@/app/components/layouts/MainLayout";
import CinemathequeCatalog from "@/app/components/cinematheque/CinemathequeCatalog";
import { Button } from "@/app/components/ui/button";
import { FaArrowRight, FaCalendar, FaClock, FaFilm } from "react-icons/fa6";
import { formatEventDateShort } from "@/lib/dateUtils";
import {
  getFeaturedScreening,
  getFilmBySlug,
  getFilmCategories,
  getFilms,
  getPastScreenings,
  getUpcomingScreenings,
} from "@/services/cinemathequeService";

export const metadata = {
  title: "Cinémathèque | Centre Culturel et Artistique pour les Pays d'Afrique Centrale",
  description:
    "Ciné-Dimanche : découvrez les films projetés chaque dimanche au Grand Tambour et consultez le catalogue des projections de la Cinémathèque du Centre Culturel.",
};


export default async function CinemathequePage() {
  const [films, genres, featuredScreening, upcoming, past] = await Promise.all([
    getFilms(),
    getFilmCategories(),
    getFeaturedScreening(),
    getUpcomingScreenings(6),
    getPastScreenings(6),
  ]);
  

  const featuredFilm = featuredScreening
    ? await getFilmBySlug(featuredScreening.filmSlug)
    : undefined;

  const nextScreenings = upcoming.filter((s) => s.id !== featuredScreening?.id);

  return (
    <MainLayout>
      {/* Hero */}
      <section className="relative min-h-[70vh] mt-16 sm:mt-20 lg:mt-24 flex items-center overflow-hidden bg-foreground">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/grand-theatre.jpeg"
            alt="Salle de cinéma du Centre Culturel"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-2xl space-y-6 sm:space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <span className="font-semibold text-xs sm:text-sm text-accent tracking-[0.3em] uppercase block">
                L&apos;Excellence du Septième Art
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.05] drop-shadow-md">
                Cinémathèque <br />
                <span className="text-accent italic">Ciné-Dimanche</span>
              </h1>
              <p className="text-base sm:text-lg text-white/90 max-w-xl leading-relaxed drop-shadow-sm">
                Découvrez les films projetés chaque dimanche et réservez votre
                place en quelques clics au sein de notre institution dédiée à la
                culture.
              </p>
            </div>
            <Link href="#catalogue">
              <Button
                size="lg"
                className="uppercase tracking-widest text-xs sm:text-sm px-6 sm:px-8 py-5 sm:py-6 shadow-xl group"
              >
                Voir les projections
                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Projection en vedette */}
      {featuredScreening && featuredFilm && (
        <section className="py-14 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-background">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-10 sm:gap-12 lg:gap-16 items-center">
            <div className="w-full lg:w-5/12 relative">
              <div className="absolute -inset-3 sm:-inset-4 bg-primary/10 -rotate-2" />
              <div className="relative aspect-[2/3] overflow-hidden shadow-2xl">
                <Image
                  src={featuredFilm.poster || "/placeholder.svg"}
                  alt={featuredFilm.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
                <div className="absolute top-4 sm:top-6 right-4 sm:right-6 bg-primary text-primary-foreground px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold uppercase tracking-wider">
                  À l&apos;affiche
                </div>
              </div>
            </div>

            <div className="w-full lg:w-7/12 space-y-8 sm:space-y-10">
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-3 sm:gap-4 text-primary">
                  <span className="h-px w-10 sm:w-12 bg-primary" />
                  <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest">
                    Projection de cette semaine
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                  {featuredFilm.title}
                </h2>
                <div className="flex flex-wrap gap-4 sm:gap-6 text-muted-foreground text-xs sm:text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <FaCalendar className="text-primary" />
                    Dimanche {formatEventDateShort(featuredScreening.date)}
                  </div>
                  {featuredFilm.duration && (
                    <div className="flex items-center gap-2">
                      <FaClock className="text-primary" />
                      {featuredScreening.startTime} (
                      {Math.floor(featuredFilm.duration / 60)}h
                      {String(featuredFilm.duration % 60).padStart(2, "0")})
                    </div>
                  )}
                  {featuredFilm.categories.length > 0 && (
                    <div className="flex items-center gap-2">
                      <FaFilm className="text-primary" />
                      {featuredFilm.categories.join(", ")}
                    </div>
                  )}
                </div>
                {featuredFilm.synopsis && (
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed border-l-2 border-border pl-6 sm:pl-8 italic">
                    &ldquo;{featuredFilm.synopsis}&rdquo;
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <Link href={`/cinematheque/${featuredFilm.slug}`}>
                  <Button className="uppercase tracking-widest text-xs sm:text-sm px-6 sm:px-8 py-5 sm:py-6">
                    Réserver ma place
                  </Button>
                </Link>
                <Link href={`/cinematheque/${featuredFilm.slug}`}>
                  <Button
                    variant="outline"
                    className="uppercase tracking-widest text-xs sm:text-sm px-6 sm:px-8 py-5 sm:py-6 bg-white"
                  >
                    Voir les détails
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Prochaines / dernières séances */}
      {(nextScreenings.length > 0 || past.length > 0) && (
        <section className="px-4 sm:px-6 lg:px-8 pb-2">
          <div className="max-w-7xl mx-auto grid gap-8 sm:gap-10 lg:grid-cols-2">
            {nextScreenings.length > 0 && (
              <ScreeningListPanel title="Prochaines séances" screenings={nextScreenings} />
            )}
            {past.length > 0 && (
              <ScreeningListPanel title="Séances passées" screenings={past} muted />
            )}
          </div>
        </section>
      )}

      {/* Catalogue */}
      <div id="catalogue">
        <CinemathequeCatalog films={films} genres={genres} />
      </div>
    </MainLayout>
  );
}

function ScreeningListPanel({
  title,
  screenings,
  muted = false,
}: {
  title: string;
  screenings: Awaited<ReturnType<typeof getUpcomingScreenings>>;
  muted?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-border/50 sm:p-8">
      <h2 className="mb-5 text-sm font-bold uppercase tracking-widest text-foreground">
        {title}
      </h2>
      <ul className="space-y-4">
        {screenings.map((screening) => (
          <li key={screening.id}>
            <Link
              href={`/cinematheque/${screening.filmSlug}`}
              className={`group flex items-center gap-4 ${muted ? "opacity-70" : ""}`}
            >
              <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md bg-muted/20">
                <Image
                  src={screening.filmPoster || "/placeholder.svg"}
                  alt={screening.filmTitle}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold text-foreground transition-colors group-hover:text-primary">
                  {screening.filmTitle}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Dimanche {formatEventDateShort(screening.date)} — {screening.startTime}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
