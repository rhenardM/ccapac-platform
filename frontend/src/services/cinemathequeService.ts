import { fetchCinemathequeJson } from "@/lib/content-api";
import type { Film, Screening } from "@/types/film";

/** Tous les films publiés (le plus récent d'abord côté backend). */
export async function getFilms(): Promise<Film[]> {
  try {
    const body = await fetchCinemathequeJson<{ data: Film[] }>("/films");
    return body?.data ?? [];
  } catch {
    return [];
  }
}

/** Détail d'un film (synopsis, casting, galerie, ses projections). */
export async function getFilmBySlug(slug: string): Promise<Film | undefined> {
  try {
    const body = await fetchCinemathequeJson<{ data: Film }>(
      `/films/${encodeURIComponent(slug)}`
    );
    return body?.data ?? undefined;
  } catch {
    return undefined;
  }
}

/** Films partageant un genre avec `currentSlug`, puis complète avec les autres. */
export async function getRelatedFilms(
  currentSlug: string,
  currentCategories: string[],
  limit = 3
): Promise<Film[]> {
  const all = await getFilms();
  const others = all.filter((f) => f.slug !== currentSlug);
  const sameCategory = others.filter((f) =>
    f.categories.some((c) => currentCategories.includes(c))
  );

  return sameCategory
    .concat(others)
    .filter((film, index, arr) => arr.findIndex((f) => f.slug === film.slug) === index)
    .slice(0, limit);
}

/** Genres/catégories présents, pour construire les filtres du catalogue. */
export async function getFilmCategories(): Promise<string[]> {
  try {
    const body = await fetchCinemathequeJson<{ data: Array<{ name: string }> }>(
      "/categories"
    );
    return (body?.data ?? []).map((c) => c.name);
  } catch {
    return [];
  }
}

/** Prochaines projections, toutes confondues (widget « prochaines séances »). */
export async function getUpcomingScreenings(limit = 10): Promise<Screening[]> {
  try {
    const body = await fetchCinemathequeJson<{ data: Screening[] }>(
      `/screenings?when=upcoming&limit=${limit}`
    );
    return body?.data ?? [];
  } catch {
    return [];
  }
}

/** Projections passées, les plus récentes d'abord. */
export async function getPastScreenings(limit = 10): Promise<Screening[]> {
  try {
    const body = await fetchCinemathequeJson<{ data: Screening[] }>(
      `/screenings?when=past&limit=${limit}`
    );
    return body?.data ?? [];
  } catch {
    return [];
  }
}

/** Projection mise en avant pour la page d'accueil de la Cinémathèque. */
export async function getFeaturedScreening(): Promise<Screening | undefined> {
  try {
    const featured = await fetchCinemathequeJson<{ data: Screening[] }>(
      "/screenings?when=upcoming&featured=1&limit=1"
    );
    if (featured?.data?.[0]) return featured.data[0];
  } catch {
    // on retombe sur la prochaine séance ci-dessous
  }

  const upcoming = await getUpcomingScreenings(1);
  return upcoming[0];
}
