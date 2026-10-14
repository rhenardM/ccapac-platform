import { fetchJson } from "@/lib/content-api";
import type { Article } from "@/types/article";

/**
 * Presse du Grand Tambour — servie par NOTRE backend (/api/content/articles),
 * en remplacement des données statiques. Mêmes noms de fonctions qu'avant, mais
 * async. Le `dateLabel` français est calculé à partir de `publishedAt`.
 */

interface BackendArticle {
  slug: string;
  title: string;
  excerpt?: string | null;
  category?: string | null;
  categorySlug?: string | null;
  author?: string | null;
  image?: string | null;
  coverImage?: string | null;
  readingTime?: number;
  featured?: boolean;
  publishedAt?: string | null;
  content?: string | null;
  viewCount?: number;
}

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const formatDateLabel = (iso?: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : DATE_FMT.format(d);
};

const mapArticle = (a: BackendArticle): Article => ({
  slug: a.slug,
  title: a.title,
  excerpt: a.excerpt ?? "",
  category: a.category ?? "",
  author: a.author ?? "",
  date: a.publishedAt ?? "",
  dateLabel: formatDateLabel(a.publishedAt),
  image: a.image ?? "",
  coverImage: a.coverImage ?? undefined,
  readingTime: a.readingTime ?? 3,
  featured: a.featured ?? false,
  content: a.content ?? "",
  viewCount: a.viewCount ?? 0,
});

/** Tous les articles publiés (triés côté backend, plus récents d'abord). */
export async function getArticles(): Promise<Article[]> {
  try {
    const body = await fetchJson<{ data: BackendArticle[] }>("/articles");
    return (body?.data ?? []).map(mapArticle);
  } catch {
    return [];
  }
}

export async function getArticleBySlug(
  slug: string
): Promise<Article | undefined> {
  try {
    const body = await fetchJson<{ data: BackendArticle }>(
      `/articles/${encodeURIComponent(slug)}`
    );
    return body?.data ? mapArticle(body.data) : undefined;
  } catch {
    return undefined;
  }
}

/** Article à la une (le premier marqué featured, sinon le plus récent). */
export async function getFeaturedArticle(): Promise<Article | undefined> {
  const all = await getArticles();
  return all.find((a) => a.featured) ?? all[0];
}

/** Articles les plus consultés, du plus vu au moins vu (preuve sociale). */
export async function getMostViewedArticles(limit = 5): Promise<Article[]> {
  const all = await getArticles();
  return [...all]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, limit);
}

/** Rubriques présentes, pour construire les filtres. */
export async function getArticleCategories(): Promise<string[]> {
  try {
    const body = await fetchJson<{ data: Array<{ name: string }> }>(
      "/article-categories"
    );
    return (body?.data ?? []).map((c) => c.name);
  } catch {
    return [];
  }
}
