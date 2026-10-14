import { fetchJson } from "@/lib/content-api";

/**
 * Programmes de l'action culturelle — désormais servis par NOTRE backend
 * (/api/content/programs & /program-categories), en remplacement des données
 * autrefois codées en dur ici. Les signatures restent async mais gardent les
 * mêmes noms pour ne pas casser les pages consommatrices.
 */

export interface ProgrammeGalleryItem {
  image: string;
  caption?: string;
}

export interface Programme {
  id: string;
  slug: string;
  title: string;
  category: string;
  categorySlug: string;
  slogan: string;
  description: string;
  objectif: string;
  publicVise: string;
  impact: string;
  image: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  discipline: string;
  period?: string;
  scope?: "interne" | "externe";
  organizer?: string;
  externalUrl?: string;
  featured?: boolean;
  /** Gratuit/payant : pilote le bouton d'action (S'inscrire vs Réserver ma place). */
  isFree: boolean;
  spaceName?: string;
  spaceSlug?: string;
  gallery: ProgrammeGalleryItem[];
}

export interface ProgrammeCategory {
  id: string; // = slug (compat avec l'ancien modèle)
  slug: string;
  title: string;
  description: string;
  image: string;
  color: string;
}

interface BackendProgram {
  slug: string;
  title: string;
  category?: string | null;
  categorySlug?: string | null;
  organizer?: string | null;
  externalUrl?: string | null;
  slogan?: string | null;
  description?: string | null;
  objectif?: string | null;
  publicVise?: string | null;
  impact?: string | null;
  image?: string | null;
  discipline?: string | null;
  period?: string | null;
  scope?: string | null;
  location?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  featured?: boolean;
  isFree?: boolean;
  spaceName?: string | null;
  spaceSlug?: string | null;
  gallery?: { image: string; caption?: string | null }[];
}

interface BackendCategory {
  slug: string;
  title: string;
  description?: string | null;
  image?: string | null;
  color?: string | null;
}

/** Heure courte fr-FR (ex. "19h00") à partir d'une date ISO ; "" si absente. */
const formatTime = (iso?: string | null): string => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" })
    .format(date)
    .replace(":", "h");
};

const mapProgramme = (p: BackendProgram): Programme => ({
  id: p.slug,
  slug: p.slug,
  title: p.title,
  category: p.category ?? "",
  categorySlug: p.categorySlug ?? "",
  slogan: p.slogan ?? "",
  description: p.description ?? "",
  objectif: p.objectif ?? "",
  publicVise: p.publicVise ?? "",
  impact: p.impact ?? "",
  image: p.image ?? "",
  startDate: p.startsAt ?? "",
  endDate: p.endsAt ?? "",
  startTime: formatTime(p.startsAt),
  endTime: formatTime(p.endsAt),
  location: p.location ?? "",
  discipline: p.discipline ?? "",
  period: p.period ?? undefined,
  scope: p.scope === "externe" ? "externe" : "interne",
  organizer: p.organizer ?? undefined,
  externalUrl: p.externalUrl ?? undefined,
  featured: p.featured ?? false,
  isFree: p.isFree ?? true,
  spaceName: p.spaceName ?? undefined,
  spaceSlug: p.spaceSlug ?? undefined,
  gallery: (p.gallery ?? [])
    .filter((g) => !!g.image)
    .map((g) => ({ image: g.image, caption: g.caption ?? undefined })),
});

const mapCategory = (c: BackendCategory): ProgrammeCategory => ({
  id: c.slug,
  slug: c.slug,
  title: c.title,
  description: c.description ?? "",
  image: c.image ?? "",
  color: c.color ?? "",
});

/** Rubriques de l'action culturelle (publiées, ordonnées). */
export async function getCategories(): Promise<ProgrammeCategory[]> {
  try {
    const body = await fetchJson<{ data: BackendCategory[] }>(
      "/program-categories"
    );
    return (body?.data ?? []).map(mapCategory);
  } catch {
    return [];
  }
}

/** Tous les programmes publiés (optionnellement filtrés par portée interne/externe). */
export async function getProgrammes(
  scope?: "interne" | "externe"
): Promise<Programme[]> {
  try {
    const qs = scope ? `?scope=${scope}` : "";
    const body = await fetchJson<{ data: BackendProgram[] }>(`/programs${qs}`);
    return (body?.data ?? []).map(mapProgramme);
  } catch {
    return [];
  }
}

/** Programmes internes (produits par le Grand Tambour). */
export async function getInternalProgrammes(): Promise<Programme[]> {
  return getProgrammes("interne");
}

/** Programmes externes (portés par des partenaires). */
export async function getExternalProgrammes(): Promise<Programme[]> {
  return getProgrammes("externe");
}

export async function getProgrammesByCategory(
  categorySlug: string
): Promise<Programme[]> {
  try {
    const body = await fetchJson<{ data: BackendProgram[] }>(
      `/programs?category=${encodeURIComponent(categorySlug)}`
    );
    return (body?.data ?? []).map(mapProgramme);
  } catch {
    return [];
  }
}

/**
 * Un programme externe est « passé » dès que sa date de fin (ou de début, à
 * défaut) est révolue. Sans date, il est traité comme une offre permanente
 * toujours « à venir ». Une fois passé : archive uniquement, plus de
 * réservation ni d'inscription possible.
 */
export function isProgrammePast(programme: Programme): boolean {
  if (!programme.startDate) return false;
  const reference = programme.endDate || programme.startDate;
  return new Date(reference).getTime() < Date.now();
}

export async function getProgrammeBySlug(
  slug: string
): Promise<Programme | undefined> {
  try {
    const body = await fetchJson<{ data: BackendProgram }>(
      `/programs/${encodeURIComponent(slug)}`
    );
    return body?.data ? mapProgramme(body.data) : undefined;
  } catch {
    return undefined;
  }
}

export async function getFeaturedProgrammes(): Promise<Programme[]> {
  try {
    const body = await fetchJson<{ data: BackendProgram[] }>(
      "/programs?featured=1"
    );
    return (body?.data ?? []).map(mapProgramme);
  } catch {
    return [];
  }
}
