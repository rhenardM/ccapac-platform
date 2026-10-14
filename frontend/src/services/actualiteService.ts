import { fetchAll, fetchJson, slugToId } from "@/lib/content-api";
import { getArticles } from "@/data/articles";
import type { Article } from "@/types/article";
import {
  Actualite,
  ActualiteForDownload,
  ActualiteMois,
  ActualiteType,
} from "@/types/actualite";


/** Noms de mois alignés sur les options du filtre (voir ActualitesPageClient). */
const MONTHS_FR: ActualiteMois[] = [
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

interface ActualiteFilters {
  type?: ActualiteType;
  annee?: number;
  mois?: ActualiteMois;
  search?: string;
}

/** Forme brute d'une actualité renvoyée par NOTRE backend (/api/content/actualites). */
interface BackendActualite {
  slug: string;
  title: string;
  type: string;
  summary?: string | null;
  coverImage?: string | null;
  pdf?: string | null;
  mois?: string | null;
  annee?: number | null;
  isFeatured?: boolean;
  publishedAt?: string | null;
  content?: string | null;
}

/** Extrait un nom de fichier lisible depuis une URL de PDF. */
const pdfNameFromUrl = (url: string): string => {
  try {
    const name = new URL(url).pathname.split("/").pop();
    return name ? decodeURIComponent(name) : "document.pdf";
  } catch {
    return "document.pdf";
  }
};

/** Convertit une actualité backend vers le type `Actualite` attendu par le site. */
const mapActualite = (a: BackendActualite): Actualite => ({
  id: slugToId(a.slug),
  documentId: a.slug,
  title: a.title,
  slug: a.slug,
  // Backend : ARTICLE | NEWSLETTER. Côté site, un « article » d'actualité = communiqué.
  type: (a.type === "ARTICLE" ? "COMMUNIQUE" : a.type) as ActualiteType,
  summary: a.summary ?? undefined,
  blocks: undefined,
  pdf: a.pdf ? { name: pdfNameFromUrl(a.pdf), ext: ".pdf" } : undefined,
  coverImage: a.coverImage ?? undefined,
  mois: (a.mois as ActualiteMois | undefined) ?? undefined,
  annee: a.annee ?? undefined,
  pageCount: undefined,
  isFeatured: a.isFeatured ?? false,
  datePublication: a.publishedAt ?? undefined,
  createdAt: a.publishedAt ?? "",
  publishedAt: a.publishedAt ?? undefined,
});

/** Filtrage et tri côté client (le backend renvoie l'ensemble publié). */
const applyFilters = (
  items: Actualite[],
  filters: ActualiteFilters
): Actualite[] => {
  let result = [...items];

  if (filters.type) {
    result = result.filter((a) => a.type === filters.type);
  }
  if (filters.annee) {
    result = result.filter((a) => a.annee === filters.annee);
  }
  if (filters.mois) {
    result = result.filter((a) => a.mois === filters.mois);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.summary ?? "").toLowerCase().includes(q)
    );
  }

  // Tri : année décroissante puis date de publication décroissante.
  result.sort((a, b) => {
    const byYear = (b.annee ?? 0) - (a.annee ?? 0);
    if (byYear !== 0) return byYear;
    return (b.datePublication ?? "").localeCompare(a.datePublication ?? "");
  });

  return result;
};

export const getActualites = async (
  filters: ActualiteFilters = {}
): Promise<Actualite[]> => {
  try {
    const raw = await fetchAll<BackendActualite>("/actualites");
    return applyFilters(raw.map(mapActualite), filters);
  } catch (error) {
    console.error(
      "[Actualite Service] Backend contenu indisponible, retour liste vide:",
      error
    );
    return [];
  }
};

export const getActualiteBySlug = async (
  slug: string
): Promise<Actualite | null> => {
  try {
    const body = await fetchJson<{ data: BackendActualite }>(
      `/actualites/${slug}`
    );
    return body?.data ? mapActualite(body.data) : null;
  } catch (error) {
    console.error("[Actualite Service] Error fetching actualite by slug:", error);
    return null;
  }
};

/**
 * Récupère une actualité (par id numérique dérivé du slug) pour téléchargement.
 * Conserve l'URL absolue du PDF renvoyée par le backend.
 */
export const getActualiteForDownload = async (
  id: number
): Promise<ActualiteForDownload | null> => {
  try {
    const raw = await fetchAll<BackendActualite>("/actualites");
    const match = raw.find((a) => slugToId(a.slug) === id);

    if (!match?.pdf) {
      return null;
    }

    return {
      ...mapActualite(match),
      pdfUrl: match.pdf,
      pdfName: pdfNameFromUrl(match.pdf),
    };
  } catch (error) {
    console.error("[Actualite Service] Error fetching actualite for download:", error);
    return null;
  }
};

/**
 * Convertit un article de PRESSE (« Presse du Grand Tambour ») en Actualité de
 * type POINT_PRESSE, pour l'afficher dans la page /actualites (onglet « Points
 * de presse »). La carte pointera vers /articles/{slug} (géré côté UI).
 */
const articleToActualite = (article: Article): Actualite => {
  const d = article.date ? new Date(article.date) : null;
  const valid = d && !Number.isNaN(d.getTime());
  return {
    id: slugToId(article.slug),
    documentId: article.slug,
    title: article.title,
    slug: article.slug,
    type: "POINT_PRESSE",
    summary: article.excerpt || undefined,
    coverImage: article.coverImage ?? article.image ?? undefined,
    mois: valid ? MONTHS_FR[d.getMonth()] : undefined,
    annee: valid ? d.getFullYear() : undefined,
    isFeatured: article.featured ?? false,
    datePublication: article.date || undefined,
    createdAt: article.date || "",
    publishedAt: article.date || undefined,
  };
};

/**
 * Actualités du centre + presse fusionnées (pour /actualites) :
 * - Newsletters / communiqués (entité Actualite)
 * - Points de presse (entité Article, « Presse du Grand Tambour »)
 * Triées par date décroissante.
 */
export const getActualitesWithPress = async (): Promise<Actualite[]> => {
  const [actualites, articles] = await Promise.all([
    getActualites(),
    getArticles().catch(() => []),
  ]);

  const press = articles.map(articleToActualite);
  const all = [...actualites, ...press];

  return all.sort((a, b) => {
    const da = a.publishedAt || a.datePublication || "";
    const db = b.publishedAt || b.datePublication || "";
    return db.localeCompare(da);
  });
};
