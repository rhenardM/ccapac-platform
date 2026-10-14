// Configuration des filtres
export const DEFAULT_FILTER_VALUE = "Tous" as const;

export const filterOptions = {
  disciplines: [
    "Tous",
    "Musique",
    "Danse",
    "Théâtre",
    "Arts Visuels",
    "Littérature",
    "Cinéma",
    "Artisanat",
    "Conférence",
  ],
  publics: ["Tous", "Enfants", "Adolescents", "Adultes", "Familles"],
  months: [
    "Tous",
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
  ],
};
