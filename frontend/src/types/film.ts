/**
 * Cinémathèque — module indépendant du CMS, servi par NOTRE backend
 * (/api/cinematheque/*). Un film peut avoir plusieurs projections (séances).
 */

export type ScreeningStatus = "upcoming" | "ongoing" | "finished" | "cancelled";

export const SCREENING_STATUS_LABELS: Record<ScreeningStatus, string> = {
  upcoming: "À venir",
  ongoing: "En cours",
  finished: "Terminée",
  cancelled: "Annulée",
};

export interface FilmGalleryImage {
  image: string;
  caption: string | null;
}

export interface Film {
  slug: string;
  title: string;
  director: string | null;
  country: string | null;
  year: number | null;
  duration: number | null;
  language: string | null;
  ageRating: string | null;
  categories: string[];
  poster: string | null;
  viewCount: number;
  /** Présents seulement sur la liste (aperçu carte). */
  nextScreeningDate?: string | null;
  nextScreeningTime?: string | null;
  /** Présents seulement sur le détail. */
  synopsis?: string | null;
  cast?: string[];
  trailerUrl?: string | null;
  backdrop?: string | null;
  gallery?: FilmGalleryImage[];
  screenings?: Screening[];
}

export interface Screening {
  id: number;
  filmSlug: string;
  filmTitle: string;
  filmPoster: string | null;
  date: string;
  startTime: string;
  endTime: string | null;
  venue: string;
  description: string | null;
  status: ScreeningStatus;
  featured: boolean;
  capacityTotal: number | null;
  capacityTaken: number | null;
  /** Gratuit => bouton "S'inscrire" ; payant => "Réserver ma place" (tarif = price). */
  isFree: boolean;
  price: number | null;
  viewCount: number;
  bookingUrl: string | null;
}
