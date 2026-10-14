import { fetchJson } from "@/lib/content-api";
import type {
  Media,
  MediaCategory,
  MediaFilters,
  MediaGalleryPage,
} from "@/types/media";

/** Forme brute d'un média renvoyée par NOTRE backend (/api/content/media). */
interface BackendMedia {
  id: number;
  name: string;
  url: string | null;
  alt?: string | null;
  caption?: string | null;
  category?: string | null;
  categorySlug?: string | null;
  eventDate?: string | null;
}

interface BackendListResponse<T> {
  data: T[];
  meta?: { total: number; page: number; perPage: number; pages: number };
}

interface BackendCategoriesResponse {
  data: MediaCategory[];
  meta?: { years: number[] };
}

/**
 * Convertit un média backend vers le type `Media` attendu par le site.
 * Le backend n'expose pas (encore) de lieu, photographe ni tags : ces champs
 * restent vides et la grille les masque automatiquement.
 */
const mapMedia = (m: BackendMedia): Media => ({
  id: m.id,
  // Pas de titre "brut" (nom de fichier) : la galerie reste épurée.
  // Un vrai libellé n'est affiché que si une légende (caption) existe.
  title: m.caption ?? "",
  description: m.caption ?? undefined,
  image: m.url ?? "",
  eventDate: m.eventDate ?? "",
  category: m.category ?? "Non classé",
  categorySlug: m.categorySlug ?? undefined,
  eventType: undefined,
  location: undefined,
  photographer: undefined,
  tags: [],
  featured: false,
  gallery: undefined,
  year: m.eventDate ? Number(m.eventDate.slice(0, 4)) : undefined,
  month: m.eventDate ? Number(m.eventDate.slice(5, 7)) : undefined,
  createdAt: "",
  updatedAt: "",
  publishedAt: null,
});

/** Construit la query string à partir des filtres (omet ce qui est vide). */
const buildQuery = (filters: MediaFilters): string => {
  const params = new URLSearchParams();

  // Répété (category[]=…) : le backend combine les catégories en OU.
  for (const slug of filters.categories ?? []) {
    if (slug) params.append("category[]", slug);
  }
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  if (filters.year) params.set("year", String(filters.year));
  if (filters.month) params.set("month", String(filters.month));
  params.set("page", String(filters.page && filters.page > 0 ? filters.page : 1));
  if (filters.perPage) params.set("perPage", String(filters.perPage));

  return params.toString();
};

/**
 * Récupère UNE page de la médiathèque, filtrée côté serveur.
 * Le filtrage (catégorie, recherche, année, mois) et la pagination sont
 * entièrement délégués au backend : pas de sur-chargement ni de comptage faux.
 */
export const getMediaPage = async (
  filters: MediaFilters = {}
): Promise<MediaGalleryPage> => {
  try {
    const body = await fetchJson<BackendListResponse<BackendMedia>>(
      `/media?${buildQuery(filters)}`
    );

    const items = (body?.data ?? []).map(mapMedia);
    const meta = body?.meta;

    return {
      items,
      total: meta?.total ?? items.length,
      page: meta?.page ?? 1,
      perPage: meta?.perPage ?? items.length,
      pages: meta?.pages ?? 1,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des médias:", error);
    throw new Error(
      `Impossible de récupérer les médias: ${
        error instanceof Error ? error.message : "Erreur inconnue"
      }`
    );
  }
};

/**
 * Catégories proposées dans les filtres, + années pour lesquelles au moins une
 * image est datée. Le backend ne renvoie que les catégories non vides : le site
 * n'affiche donc jamais un filtre qui ne donnerait aucun résultat.
 */
export const getMediaCategories = async (): Promise<{
  categories: MediaCategory[];
  years: number[];
}> => {
  try {
    const body = await fetchJson<BackendCategoriesResponse>("/media-categories");

    return {
      categories: body?.data ?? [],
      years: body?.meta?.years ?? [],
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des catégories média:", error);
    // Les filtres sont un confort : leur indisponibilité ne doit pas casser la
    // galerie, qui reste consultable sans filtrage.
    return { categories: [], years: [] };
  }
};

/** Récupère les médias (première page) — conservé pour les usages simples. */
export const getMedia = async (filters?: MediaFilters): Promise<Media[]> =>
  (await getMediaPage(filters)).items;

/** Récupère les médias d'une catégorie donnée. */
export const getMediaByCategory = async (
  categorySlug: string
): Promise<Media[]> => getMedia({ categories: [categorySlug] });

/** Récupère les médias d'une année donnée. */
export const getMediaByYear = async (year: number): Promise<Media[]> =>
  getMedia({ year });
