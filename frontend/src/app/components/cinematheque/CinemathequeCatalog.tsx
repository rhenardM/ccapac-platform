"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { FaChevronLeft, FaChevronRight, FaMagnifyingGlass } from "react-icons/fa6";
import { formatEventDateShort } from "@/lib/dateUtils";
import ViewCount from "@/app/components/ViewCount";
import type { Film } from "@/types/film";

const DEFAULT_VALUE = "Tous";
const PAGE_SIZE = 4;
type SortValue = "date" | "titre";

interface CinemathequeCatalogProps {
  films: Film[];
  genres: string[];
}

export default function CinemathequeCatalog({
  films,
  genres,
}: CinemathequeCatalogProps) {
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState(DEFAULT_VALUE);
  const [sort, setSort] = useState<SortValue>("date");
  const [page, setPage] = useState(1);

  const filteredFilms = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = films.filter((film) => {
      if (query && !film.title.toLowerCase().includes(query)) return false;
      if (genre !== DEFAULT_VALUE && !film.categories.includes(genre))
        return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "titre") return a.title.localeCompare(b.title);
      // Prochaine séance d'abord ; les films sans séance programmée en dernier.
      if (!a.nextScreeningDate && !b.nextScreeningDate) return 0;
      if (!a.nextScreeningDate) return 1;
      if (!b.nextScreeningDate) return -1;
      return a.nextScreeningDate.localeCompare(b.nextScreeningDate);
    });
  }, [films, search, genre, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredFilms.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [search, genre, sort]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const paginatedFilms = filteredFilms.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <section className="py-12 sm:py-14 md:py-16 px-4 sm:px-6 lg:px-8 bg-muted/10">
      <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10">
        {/* En-tête du catalogue & filtres */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8 border-b border-border/60 pb-6 sm:pb-8">
          <div className="space-y-2 sm:space-y-3">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground uppercase tracking-tight">
              Catalogue des Films
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Explorez notre programmation exclusive et à venir.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="relative">
              <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un film..."
                aria-label="Rechercher un film"
                className="pl-10 h-10 sm:h-11 min-w-[220px] sm:min-w-[260px] bg-white"
              />
            </div>

            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger className="h-10 sm:h-11 w-[150px] bg-white">
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DEFAULT_VALUE}>Genre : Tous</SelectItem>
                {genres.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={sort}
              onValueChange={(value) => setSort(value as SortValue)}
            >
              <SelectTrigger className="h-10 sm:h-11 w-[170px] bg-white">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Trier par : Prochaine séance</SelectItem>
                <SelectItem value="titre">Trier par : Titre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Grille des films */}
        {filteredFilms.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <div className="bg-white rounded-xl sm:rounded-2xl p-8 sm:p-12 max-w-lg mx-auto border border-border/50 shadow-sm">
              <FaMagnifyingGlass className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4 sm:mb-6" />
              <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 sm:mb-3">
                Aucun film trouvé
              </h3>
              <p className="text-muted-foreground text-sm">
                Essayez de modifier votre recherche ou le genre sélectionné.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
            {paginatedFilms.map((film) => (
              <Link key={film.slug} href={`/cinematheque/${film.slug}`}>
                <Card className="group cursor-pointer h-full transition-all duration-300 hover:shadow-lg border-border/50 rounded-xl overflow-hidden bg-white py-0 gap-0">
                  <div className="relative aspect-[2/3] overflow-hidden bg-muted/20">
                    {film.nextScreeningDate && (
                      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10">
                        <Badge className="bg-primary text-primary-foreground shadow-sm backdrop-blur-md text-[10px] sm:text-xs uppercase tracking-wider">
                          Prochaine séance
                        </Badge>
                      </div>
                    )}
                    <Image
                      src={film.poster || "/placeholder.svg"}
                      alt={film.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </div>

                  <div className="p-4 sm:p-5">
                    <CardHeader className="p-0 mb-1.5">
                      <CardTitle className="text-base sm:text-lg font-bold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {film.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-1.5">
                      <div className="text-xs sm:text-sm text-muted-foreground uppercase tracking-widest">
                        {film.nextScreeningDate
                          ? `Dimanche ${formatEventDateShort(film.nextScreeningDate)} — ${film.nextScreeningTime}`
                          : "Aucune séance programmée"}
                      </div>
                      <div className="flex flex-wrap gap-x-2 text-xs sm:text-sm text-muted-foreground">
                        <span>{film.categories.join(", ")}</span>
                        {film.duration && (
                          <>
                            <span>•</span>
                            <span>
                              {Math.floor(film.duration / 60)}h{" "}
                              {String(film.duration % 60).padStart(2, "0")}min
                            </span>
                          </>
                        )}
                      </div>
                      {film.viewCount > 0 && (
                        <ViewCount count={film.viewCount} iconSize={12} className="text-muted-foreground" />
                      )}
                    </CardContent>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex items-center justify-center gap-2 sm:gap-3 pt-2">
            <Button
              variant="outline"
              size="icon"
              className="bg-white"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Page précédente"
            >
              <FaChevronLeft className="h-3.5 w-3.5" />
            </Button>

            {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="icon"
                className={p === page ? "" : "bg-white"}
                onClick={() => setPage(p)}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </Button>
            ))}

            <Button
              variant="outline"
              size="icon"
              className="bg-white"
              disabled={page === pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              aria-label="Page suivante"
            >
              <FaChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
