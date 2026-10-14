import type { MakutaOperatorCode } from "@/lib/makuta";

export type Step =
  | "identity"
  | "audience"
  | "beneficiary"
  | "amount"
  | "payment";

/** Pour qui le don est effectué — sert à personnaliser le parcours et le reçu. */
export type DonorType = "self" | "relative" | "organization";

/** Catégorie de moyen de paiement (regroupe les opérateurs Makuta). */
export type PaymentCategory = "mobile_money" | "card";

/** Statut interne du don (aligné sur le mapping serveur TS/TF/TP). */
export type DonationStatus = "pending" | "succeeded" | "failed";

export type DonorInfo = {
  name: string;
  email: string;
  phone: string;
};

/** Bénéficiaire (proche ou organisation) au nom duquel le don est offert. */
export type BeneficiaryInfo = {
  name: string;
  email: string;
  message: string;
};

/**
 * Données conservées côté client entre le paiement et la page de remerciement,
 * pour envoyer l'e-mail « don en votre honneur » une fois le paiement confirmé.
 */
export type HonorDonationPayload = {
  beneficiaryName: string;
  beneficiaryEmail: string;
  beneficiaryMessage: string;
  donorName: string;
  donorType: Exclude<DonorType, "self">;
  amount: number;
  currency: string;
};

export type DonationTier = {
  id: string;
  name: string;
  description: string | null;
  minAmount: number;
  maxAmount: number | null;
  /** Met en avant ce palier (badge « Recommandé », affiché en premier). */
  recommended?: boolean;
};

export type CampaignStats = {
  raisedAmount: number;
  progressPercent: number;
  succeededDonationsCount: number;
  uniqueDonorsCount: number;
};

export type CampaignConfig = {
  title: string;
  description: string;
  goalAmount: number;
  currency: string;
  coverImage: string;
  coverImageAlt: string;
  tiers: DonationTier[];
  /** Optionnel : affiché uniquement si fourni (Makuta ne fournit pas de stats). */
  stats?: CampaignStats;
};

export type FundraisingErrors = Record<string, string>;

/** Réponse de création de don renvoyée par /api/makuta/donations. */
export type CreatedDonation = {
  transactionId: string;
  status: DonationStatus;
  redirectUrl: string | null;
  requiresOtp: boolean;
};

export type DonationStatusResult = {
  transactionId: string;
  status: DonationStatus;
  message: string | null;
};

export type CreateDonationInput = {
  amount: number;
  operator: MakutaOperatorCode;
  accountNumber: string;
  donor: DonorInfo;
  /** Pour qui le don est fait (suivi côté backend). */
  donorType?: DonorType;
  /** Bénéficiaire (proche/organisation) si le don est offert au nom d'autrui. */
  beneficiary?: BeneficiaryInfo;
};
