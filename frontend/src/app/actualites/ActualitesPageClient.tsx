"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  FileText,
  Newspaper,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Actualite, ActualiteMois, ActualiteType } from "@/types/actualite";
import Pagination from "@/app/components/Pagination";

/** 3 lignes de la grille (3 colonnes sur desktop) avant de basculer en pagination. */
const PAGE_SIZE = 9;

const PDFPreview = dynamic(
  () => import("../components/newsletter/PDFPreview"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 w-full animate-pulse items-center justify-center rounded-2xl bg-muted/10">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Chargement de la liseuse...
        </p>
      </div>
    ),
  }
);

const typeLabels: Record<ActualiteType, string> = {
  NEWSLETTER: "Newsletter",
  COMMUNIQUE: "Communiqué",
  POINT_PRESSE: "Point de presse",
};

const typeOptions: Array<{ value: ActualiteType | "TOUS"; label: string }> = [
  { value: "TOUS", label: "Tous" },
  { value: "NEWSLETTER", label: "Newsletters" },
  { value: "COMMUNIQUE", label: "Communiqués" },
  { value: "POINT_PRESSE", label: "Points de presse" },
];

const moisOptions: ActualiteMois[] = [
  "Janvier",
  "Fevrier",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Aout",
  "Septembre",
  "Octobre",
  "Novembre",
  "Decembre",
];

interface ActualitesPageClientProps {
  actualites: Actualite[];
  isAuthenticated: boolean;
}

const normalize = (value?: string | number) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export default function ActualitesPageClient({
  actualites,
  isAuthenticated,
}: ActualitesPageClientProps) {
  const router = useRouter();
  const newsletterPreviewRef = useRef<HTMLElement | null>(null);
  const [type, setType] = useState<ActualiteType | "TOUS">("TOUS");
  const [annee, setAnnee] = useState("TOUS");
  const [mois, setMois] = useState<ActualiteMois | "TOUS">("TOUS");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedNewsletterId, setSelectedNewsletterId] = useState<
    number | null
  >(actualites.find((actualite) => actualite.type === "NEWSLETTER")?.id ?? null);

  const annees = useMemo(
    () =>
      Array.from(
        new Set(actualites.map((actualite) => actualite.annee).filter(Boolean))
      ).sort((a, b) => Number(b) - Number(a)),
    [actualites]
  );

  const filteredActualites = useMemo(() => {
    const searchTerm = normalize(search.trim());

    return actualites.filter((actualite) => {
      const matchesType = type === "TOUS" || actualite.type === type;
      const matchesAnnee =
        annee === "TOUS" || actualite.annee?.toString() === annee;
      const matchesMois = mois === "TOUS" || actualite.mois === mois;
      const matchesSearch =
        !searchTerm ||
        normalize(actualite.title).includes(searchTerm) ||
        normalize(actualite.summary).includes(searchTerm);

      return matchesType && matchesAnnee && matchesMois && matchesSearch;
    });
  }, [actualites, annee, mois, search, type]);

  const pageCount = Math.max(1, Math.ceil(filteredActualites.length / PAGE_SIZE));
  const paginatedActualites = filteredActualites.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  // Revenir à la page 1 dès qu'un filtre change (le jeu de résultats change).
  useEffect(() => {
    setPage(1);
  }, [search, type, annee, mois]);

  // Filet de sécurité si la page courante n'existe plus après un filtrage.
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const featured = filteredActualites.find((actualite) => actualite.isFeatured);
  const newsletterActualites = filteredActualites.filter(
    (actualite) => actualite.type === "NEWSLETTER"
  );
  const selectedNewsletter =
    newsletterActualites.find(
      (actualite) => actualite.id === selectedNewsletterId
    ) ?? newsletterActualites[0];

  const handleNewsletterDownload = (actualite: Actualite) => {
    if (!actualite.pdf) {
      return;
    }

    if (!isAuthenticated) {
      router.push("/auth/login?redirectUrl=/actualites");
      return;
    }

    window.open(`/api/actualites/${actualite.id}/download`, "_blank");
  };

  const handleNewsletterPreview = (id: number) => {
    setSelectedNewsletterId(id);
    window.setTimeout(() => {
      newsletterPreviewRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative mt-16 flex h-[35vh] min-h-[280px] items-center justify-center overflow-hidden sm:mt-20 sm:h-[40vh] sm:min-h-[350px] lg:mt-24 lg:h-[45vh] lg:min-h-[400px]">
        <div className="absolute inset-0 z-10 bg-black/60" />
        <Image
          src="/motif-luba.png"
          alt="Actualités CCAPAC"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="relative z-20 w-full px-4 text-center sm:px-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/90 backdrop-blur-sm">
            <Newspaper size={14} />
            Publications du centre
          </div>
          <h1 className="mb-3 text-2xl font-bold uppercase tracking-tight text-white drop-shadow-2xl sm:mb-4 sm:text-3xl md:mb-6 md:text-4xl lg:text-5xl">
            Actualités
          </h1>
          <p className="mx-auto max-w-2xl px-2 text-sm font-light leading-relaxed text-white/90 drop-shadow-md sm:text-base md:text-lg lg:text-xl">
            Retrouvez les newsletters, communiqués officiels et annonces de
            points de presse du CCAPAC.
          </p>
        </div>
      </section>

      <main className="pb-12 sm:pb-16 md:pb-20">
        <section className="py-8 sm:py-10 md:py-12 lg:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="rounded-2xl border border-muted/20 bg-white p-4 shadow-sm sm:p-5 md:p-6">
                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.6fr_0.6fr]">
                  <label className="relative block">
                    <span className="sr-only">Recherche</span>
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Rechercher par mot clé"
                      className="h-12 w-full rounded-xl border border-muted/20 bg-background pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>

                  <FilterSelect
                    value={annee}
                    onChange={setAnnee}
                    label="Toutes les années"
                    options={annees.map((year) => ({
                      label: String(year),
                      value: String(year),
                    }))}
                  />

                  <FilterSelect
                    value={mois}
                    onChange={(value) =>
                      setMois(value as ActualiteMois | "TOUS")
                    }
                    label="Tous les mois"
                    options={moisOptions.map((month) => ({
                      label: month,
                      value: month,
                    }))}
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {typeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setType(option.value)}
                      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                        type === option.value
                          ? "bg-primary text-white shadow-sm"
                          : "bg-muted/10 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {featured && (
                <FeaturedActualite
                  actualite={featured}
                  onPreview={handleNewsletterPreview}
                />
              )}

              {newsletterActualites.length > 0 && selectedNewsletter && (
                <NewsletterPreview
                  newsletters={newsletterActualites}
                  selectedNewsletter={selectedNewsletter}
                  isAuthenticated={isAuthenticated}
                  onSelect={handleNewsletterPreview}
                  onDownload={handleNewsletterDownload}
                  previewRef={newsletterPreviewRef}
                />
              )}

              <section className="mt-10 sm:mt-12">
                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-primary">
                      Archives
                    </p>
                    <h2 className="mt-2 text-2xl font-bold uppercase tracking-tight text-foreground sm:text-3xl">
                      Toutes les publications
                    </h2>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {filteredActualites.length} résultat
                    {filteredActualites.length > 1 ? "s" : ""}
                  </span>
                </div>

                {filteredActualites.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-muted/30 bg-white p-12 text-center shadow-sm">
                    <FileText className="mx-auto mb-5 h-12 w-12 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Aucune actualité ne correspond aux filtres.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {paginatedActualites.map((actualite) => (
                        <ActualiteCard
                          key={actualite.id}
                          actualite={actualite}
                          onPreview={handleNewsletterPreview}
                        />
                      ))}
                    </div>
                    <Pagination
                      currentPage={page}
                      totalPages={pageCount}
                      onPageChange={setPage}
                    />
                  </>
                )}
              </section>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  label,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-12 rounded-xl border border-muted/20 bg-background px-4 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
    >
      <option value="TOUS">{label}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function FeaturedActualite({
  actualite,
  onPreview,
}: {
  actualite: Actualite;
  onPreview: (id: number) => void;
}) {
  return (
    <section className="mt-8 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-muted/10 lg:grid lg:grid-cols-[0.9fr_1.1fr]">
      <ActualiteImage actualite={actualite} className="min-h-[260px] lg:h-full" />
      <div className="p-6 sm:p-8 lg:p-10">
        <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
          Actuel
        </span>
        <p className="mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <Calendar size={13} />
          {typeLabels[actualite.type]} {formatActualiteDate(actualite)}
        </p>
        <h2 className="mt-4 text-2xl font-bold uppercase leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl">
          {actualite.title}
        </h2>
        {actualite.summary && (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {actualite.summary}
          </p>
        )}
        <ActualiteAction actualite={actualite} onPreview={onPreview} />
      </div>
    </section>
  );
}

function NewsletterPreview({
  newsletters,
  selectedNewsletter,
  isAuthenticated,
  onSelect,
  onDownload,
  previewRef,
}: {
  newsletters: Actualite[];
  selectedNewsletter: Actualite;
  isAuthenticated: boolean;
  onSelect: (id: number) => void;
  onDownload: (actualite: Actualite) => void;
  previewRef: RefObject<HTMLElement | null>;
}) {
  return (
    <section
      ref={previewRef}
      className="scroll-mt-28 mt-10 grid gap-6 lg:grid-cols-[300px_1fr]"
    >
      <aside className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-muted/10">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          Newsletters
        </p>
        <h2 className="mt-2 text-xl font-bold uppercase tracking-tight">
          Aperçu de l’édition
        </h2>
        <div className="mt-5 space-y-3">
          {newsletters.map((newsletter) => (
            <button
              key={newsletter.id}
              type="button"
              onClick={() => onSelect(newsletter.id)}
              className={`w-full rounded-xl p-4 text-left transition ${
                selectedNewsletter.id === newsletter.id
                  ? "bg-primary text-white shadow-sm"
                  : "bg-muted/5 hover:bg-primary/10"
              }`}
            >
              <span className="block text-xs font-semibold uppercase tracking-widest opacity-75">
                {formatActualiteDate(newsletter) || "Édition"}
              </span>
              <span className="mt-2 block text-sm font-bold uppercase leading-tight">
                {newsletter.title}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <div
        className={`overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-muted/10 ${
          selectedNewsletter.pdf
            ? "md:grid md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"
            : ""
        }`}
      >
        {selectedNewsletter.pdf && (
          <NewsletterReader
            newsletter={selectedNewsletter}
            isAuthenticated={isAuthenticated}
            onDownload={onDownload}
          />
        )}
        <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
          <h3 className="mt-4 text-2xl font-bold uppercase tracking-tight text-foreground sm:text-3xl">
            {selectedNewsletter.title}
          </h3>
          {selectedNewsletter.summary && (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {selectedNewsletter.summary}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {formatActualiteDate(selectedNewsletter) && (
              <span className="rounded-full bg-muted/10 px-3 py-1">
                {formatActualiteDate(selectedNewsletter)}
              </span>
            )}
            {selectedNewsletter.pageCount && (
              <span className="rounded-full bg-muted/10 px-3 py-1">
                {selectedNewsletter.pageCount} pages
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function NewsletterReader({
  newsletter,
  isAuthenticated,
  onDownload,
}: {
  newsletter: Actualite;
  isAuthenticated: boolean;
  onDownload: (actualite: Actualite) => void;
}) {
  return (
    <div className="h-[560px] overflow-y-auto bg-muted/10 p-3 sm:h-[640px] sm:p-5 lg:h-[720px]">
      <PDFPreview
        pdfUrl={`/api/actualites/${newsletter.id}/reader`}
        maxPages={2}
        onDownloadClick={() => onDownload(newsletter)}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
}

function ActualiteCard({
  actualite,
  onPreview,
}: {
  actualite: Actualite;
  onPreview: (id: number) => void;
}) {
  return (
    <article className="group flex min-h-[360px] flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-muted/10 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <ActualiteImage actualite={actualite} className="h-48" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
            {typeLabels[actualite.type]}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatActualiteDate(actualite) || "Date à venir"}
          </span>
        </div>
        <h3 className="mt-4 text-lg font-bold uppercase leading-tight tracking-tight text-foreground">
          {actualite.title}
        </h3>
        {actualite.summary && (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {actualite.summary}
          </p>
        )}
        <div className="mt-auto pt-5">
          <ActualiteAction actualite={actualite} onPreview={onPreview} compact />
        </div>
      </div>
    </article>
  );
}

function ActualiteImage({
  actualite,
  className,
}: {
  actualite: Actualite;
  className: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-muted/10 ${className}`}>
      {actualite.coverImage ? (
        <Image
          src={actualite.coverImage}
          alt={actualite.title}
          fill
          className="object-cover transition duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      ) : (
        <div className="flex h-full min-h-[220px] items-center justify-center">
          <FileText className="h-14 w-14 text-muted-foreground/30" />
        </div>
      )}
    </div>
  );
}

function ActualiteAction({
  actualite,
  onPreview,
  compact = false,
}: {
  actualite: Actualite;
  onPreview: (id: number) => void;
  compact?: boolean;
}) {
  const className = `inline-flex items-center gap-2 rounded-full font-bold uppercase tracking-wide transition ${
    compact ? "px-4 py-2 text-xs" : "mt-6 px-5 py-3 text-sm"
  } bg-foreground text-white hover:bg-primary`;

  if (actualite.type === "NEWSLETTER") {
    return (
      <button type="button" onClick={() => onPreview(actualite.id)} className={className}>
        <FileText size={compact ? 14 : 16} />
        Aperçu
      </button>
    );
  }

  // Les « Points de presse » vivent dans la Presse du Grand Tambour (/articles).
  const href =
    actualite.type === "POINT_PRESSE"
      ? `/articles/${actualite.slug}`
      : `/actualites/${actualite.slug}`;

  return (
    <Link href={href} className={className}>
      Lire
      <ArrowRight size={compact ? 14 : 16} />
    </Link>
  );
}

function formatActualiteDate(actualite: Actualite) {
  if (actualite.mois && actualite.annee) {
    return `${actualite.mois} ${actualite.annee}`;
  }

  return actualite.datePublication || "";
}
