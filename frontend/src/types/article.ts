/**
 * Article de presse du centre (« Presse du Grand Tambour »).
 *
 * Servi dynamiquement par NOTRE backend (/api/content/articles). Le contenu
 * est du HTML riche (produit par l'éditeur WYSIWYG côté admin).
 */
export interface Article {
  /** Identifiant d'URL, unique. Utilisé par /articles/[slug]. */
  slug: string;
  title: string;
  /** Résumé court (chapô) affiché sur les cartes et en tête d'article. */
  excerpt: string;
  /** Rubrique éditoriale (Patrimoine, Partenariats, Entretien…). */
  category: string;
  author: string;
  /** Date ISO (YYYY-MM-DD…) utilisée pour le tri. */
  date: string;
  /** Libellé de date déjà formaté pour l'affichage en français. */
  dateLabel: string;
  /** Image de carte / « à la une » (URL absolue ou chemin /images/…). */
  image: string;
  /** Image de couverture du détail. Retombe sur `image` si absente. */
  coverImage?: string;
  /** Temps de lecture estimé, en minutes. */
  readingTime: number;
  /** Mis en avant dans le bloc « À la une ». */
  featured?: boolean;
  /** Contenu HTML de l'article (rendu en détail). */
  content: string;
  /** Nombre de vues comptabilisées (dédupliquées par visiteur). */
  viewCount: number;
}
