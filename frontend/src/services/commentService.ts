import { fetchJson } from "@/lib/content-api";
import type { ArticleComment } from "@/types/comment";

/** Commentaires visibles d'un article (avec leurs réponses), plus anciens d'abord. */
export async function getArticleComments(slug: string): Promise<ArticleComment[]> {
  try {
    const body = await fetchJson<{ data: ArticleComment[] }>(
      `/articles/${encodeURIComponent(slug)}/comments`
    );
    return body?.data ?? [];
  } catch {
    return [];
  }
}
