// Fonction pour formater les dates en français
export const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  const months = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
};

// Les catégories des filtres ne sont plus codées en dur : elles proviennent du
// back-office via /api/content/media-categories (voir getMediaCategories()).
// Idem pour les années, déduites des dates d'événement réellement saisies.

export const MONTHS = [
  { value: 1, label: "Janvier" },
  { value: 2, label: "Février" },
  { value: 3, label: "Mars" },
  { value: 4, label: "Avril" },
  { value: 5, label: "Mai" },
  { value: 6, label: "Juin" },
  { value: 7, label: "Juillet" },
  { value: 8, label: "Août" },
  { value: 9, label: "Septembre" },
  { value: 10, label: "Octobre" },
  { value: 11, label: "Novembre" },
  { value: 12, label: "Décembre" },
] as const;

/** Valeur du filtre « toutes les catégories » (sentinelle d'UI, pas un slug). */
export const ALL_CATEGORIES = "Tous";

// Constantes de pagination
export const ITEMS_PER_PAGE = 12;
