import type { CampaignConfig } from "./types";

/**
 * Configuration statique de la campagne de don.
 *
 * Makuta Cash est une passerelle de paiement : elle ne fournit aucune donnée de
 * campagne (titre, objectif, paliers, statistiques). Ces informations sont donc
 * définies ici. Pour les rendre dynamiques plus tard, remplacer cette constante
 * par un appel à un service/endpoint dédié.
 */
export const campaignConfig: CampaignConfig = {
  title: "Soutenez la Biblio-Librairie du Grand Tambour",
  description:
    "Aidez à faire vivre un espace de lecture, de transmission et de rencontre au service de la jeunesse d'Afrique centrale.",
  goalAmount: 517251,
  currency: "USD",
  coverImage: "/images/espace4.jpg",
  coverImageAlt: "Espace de lecture du Grand Tambour",
  tiers: [
    {
      id: "partenaire-fondateur",
      name: "Partenaire Fondateur",
      description: "Bâtisseur de la Biblio-Librairie à nos côtés.",
      minAmount: 100000,
      maxAmount: null,
    },
    {
      id: "grand-mecene",
      name: "Grand Mécène",
      description: "Un soutien majeur à l'ensemble du projet.",
      minAmount: 50000,
      maxAmount: 99999,
    },
    {
      id: "mecene-biblio-librairie",
      name: "Mécène Biblio Librairie",
      description: "Vous financez ateliers et médiation culturelle.",
      minAmount: 25000,
      maxAmount: 49999,
    },
    {
      id: "parrain-rayon-collection",
      name: "Parrain de Rayon / Collection",
      description: "Vous parrainez un rayon ou une collection.",
      minAmount: 5000,
      maxAmount: 24999,
    },
    {
      id: "ami-citoyen",
      name: "Ami & Citoyen",
      description: "Chaque geste compte pour faire vivre la lecture.",
      minAmount: 1,
      maxAmount: 4999,
      recommended: true,
    },
  ],
  // Statistiques optionnelles : laisser absent tant qu'aucune source réelle
  // n'est branchée (la barre de progression sera alors masquée proprement).
  // stats: {
  //   raisedAmount: 0,
  //   progressPercent: 0,
  //   succeededDonationsCount: 0,
  //   uniqueDonorsCount: 0,
  // },
};

/** Ce que le don finance (affiché dans la colonne campagne). */
export const impactItems = [
  "561 m² entièrement aménagés pour la lecture et la médiation.",
  "5 000 ouvrages initiaux, dont 3 000 pour la Bibliothèque.",
  "Outils numériques de recherche et de formation.",
  "Ateliers, clubs de lecture et rencontres littéraires.",
];

export const contactInfo = {
  email: "info@centreculturel.cd",
  phone: "+243 890 809 745",
};

/**
 * Active la soumission réelle du paiement.
 * Activé par défaut ; interrupteur d'arrêt via `NEXT_PUBLIC_PAYMENT_ENABLED=false`
 * (qui réaffiche le message « bientôt disponible »). Aucune variable à définir
 * sur Vercel pour l'activer.
 */
export const PAYMENT_ENABLED =
  process.env.NEXT_PUBLIC_PAYMENT_ENABLED !== "false";

/** Intervalle de vérification du statut (mobile money / attente). */
export const STATUS_POLL_INTERVAL_MS = 5000;
/** Délai au-delà duquel une tentative en attente est considérée expirée. */
export const PAYMENT_REVIEW_DELAY_MS = 45000;
