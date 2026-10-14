/**
 * Commentaire sur un article de presse.
 *
 * Servi par NOTRE backend (/api/content/articles/{slug}/comments). Un
 * commentaire de premier niveau peut recevoir des réponses (un seul niveau
 * d'imbrication).
 */
export type CommentAuthorRole = "visitor" | "member" | "admin";

export interface ArticleComment {
  id: number;
  authorName: string;
  authorRole: CommentAuthorRole;
  content: string;
  createdAt: string;
  replies: ArticleComment[];
}
