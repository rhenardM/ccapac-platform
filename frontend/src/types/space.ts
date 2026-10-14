/**
 * Espaces du Grand Tambour — module indépendant du CMS, servi par NOTRE
 * backend (/api/espaces/*).
 */

export interface SpaceGalleryImage {
  image: string;
  caption: string | null;
}

export interface Space {
  slug: string;
  name: string;
  shortDescription: string | null;
  category: string | null;
  categoryIcon: string | null;
  coverImage: string | null;
  capacity: number | null;
  /** Présents uniquement sur le détail. */
  fullDescription?: string | null;
  surfaceM2?: number | null;
  seatedCapacity?: number | null;
  standingCapacity?: number | null;
  hasPmrAccess?: boolean;
  hasAirConditioning?: boolean;
  hasSoundSystem?: boolean;
  hasProfessionalLighting?: boolean;
  hasWifi?: boolean;
  hasParking?: boolean;
  usageConditions?: string | null;
  isBookable?: boolean;
  bookingUrl?: string | null;
  quoteRequestUrl?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  gallery?: SpaceGalleryImage[];
}

export interface SpacesHeroSettings {
  heroKicker: string | null;
  heroTitle: string | null;
  introText: string | null;
  heroBackgroundImage: string | null;
}
