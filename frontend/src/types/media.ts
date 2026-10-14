export interface Media {
  id: number;
  title: string;
  description?: string;
  image: string;
  eventDate: string;
  /** Libellé de la catégorie ("Concert"), tel qu'affiché à l'écran. */
  category: string;
  /** Slug de la catégorie ("concert"), utilisé pour filtrer côté API. */
  categorySlug?: string;
  eventType?: string;
  location?: string;
  photographer?: string;
  tags?: string[];
  featured: boolean;
  gallery?: string;
  year?: number;
  month?: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

/** Catégorie de la médiathèque, telle qu'exposée par /api/content/media-categories. */
export interface MediaCategory {
  slug: string;
  name: string;
  /** Nombre d'images publiées dans cette catégorie. */
  total: number;
}

/** Une page de résultats de la médiathèque (pagination gérée par le backend). */
export interface MediaGalleryPage {
  items: Media[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}

/**
 * Filtres envoyés à /api/content/media.
 * Volontairement aligné sur ce que le backend sait traiter : tout filtre listé
 * ici est appliqué côté serveur, il n'y a plus de filtrage client silencieux.
 */
export interface MediaFilters {
  search?: string;
  /** Slugs de catégories, combinés en OU. Vide ou absent = toutes. */
  categories?: string[];
  year?: number | null;
  month?: number | null;
  page?: number;
  perPage?: number;
}
