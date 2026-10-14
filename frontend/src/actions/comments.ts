"use server";

import { CONTENT_API_BASE_URL } from "@/lib/content-api";
import { getUser } from "@/lib/auth-server";
import type { ArticleComment } from "@/types/comment";

/**
 * Poste un commentaire de premier niveau (visiteur anonyme) sur un article.
 * Relayé vers NOTRE backend (/api/content/articles/{slug}/comments).
 */
export async function postComment(
  slug: string,
  data: { authorName: string; authorEmail: string; content: string }
): Promise<ArticleComment> {
  const res = await fetch(
    `${CONTENT_API_BASE_URL}/articles/${encodeURIComponent(slug)}/comments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Le commentaire n'a pas pu être publié.");
  }

  const body = await res.json();
  return body.data as ArticleComment;
}

/**
 * Répond à un commentaire pour le compte du membre actuellement connecté.
 * L'identité (nom, e-mail, rôle) est résolue côté serveur à partir de la
 * session — jamais depuis des valeurs fournies par le client — puis relayée
 * au backend Symfony via la clé interne partagée (INTERNAL_API_KEY).
 */
export async function postReply(
  commentId: number,
  content: string
): Promise<ArticleComment> {
  const user = await getUser();
  if (!user) {
    throw new Error("Vous devez être connecté pour répondre à un commentaire.");
  }

  const internalApiKey = process.env.INTERNAL_API_KEY;
  if (!internalApiKey) {
    throw new Error("Configuration serveur manquante (INTERNAL_API_KEY).");
  }

  const res = await fetch(`${CONTENT_API_BASE_URL}/comments/${commentId}/replies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Internal-Api-Key": internalApiKey,
    },
    body: JSON.stringify({
      authorName: user.name,
      authorEmail: user.email,
      authorRole: user.role === "ADMIN" ? "admin" : "member",
      content,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "La réponse n'a pas pu être publiée.");
  }

  const body = await res.json();
  return body.data as ArticleComment;
}
