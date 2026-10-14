import type { LucideIcon } from "lucide-react";
import { CreditCard, Smartphone } from "lucide-react";
import type { MakutaOperatorCode } from "@/lib/makuta";
import type { PaymentCategory } from "./types";

export type PaymentOperator = {
  code: MakutaOperatorCode;
  /** Nom commercial affiché (ex. « M-Pesa »). */
  label: string;
  /** Exige une confirmation par code OTP (guide Makuta §7). */
  requiresOtp: boolean;
  /** Le paiement se finalise par une redirection (Visa CNP — guide §6). */
  redirect: boolean;
};

export type PaymentCategoryDef = {
  id: PaymentCategory;
  title: string;
  detail: string;
  icon: LucideIcon;
  /** Libellé + placeholder du champ « compte payeur » propre à la catégorie. */
  accountLabel: string;
  accountPlaceholder: string;
  /** Aide affichée sous le champ. */
  accountHint: string;
  operators: PaymentOperator[];
};

/**
 * Catalogue des moyens de paiement Makuta (guide §1.1).
 * Pour le web, la carte utilise DRC_VISA_CNP (« Card Not Present ») — le code
 * DRC_VISA_CP est réservé aux terminaux physiques (POS) et n'est pas exposé ici.
 */
export const paymentCategories: PaymentCategoryDef[] = [
  {
    id: "mobile_money",
    title: "Mobile Money",
    detail: "Paiement mobile (M-Pesa, Airtel, Orange…)",
    icon: Smartphone,
    accountLabel: "Numéro Mobile Money",
    accountPlaceholder: "+243 812 345 678",
    accountHint:
      "Numéro qui recevra la demande de paiement, au format international (+243).",
    operators: [
      { code: "DRC_MPESA", label: "M-Pesa", requiresOtp: false, redirect: false },
      {
        code: "DRC_AIRTEL_MONEY",
        label: "Airtel Money",
        requiresOtp: false,
        redirect: false,
      },
      {
        code: "DRC_ORANGE_MONEY",
        label: "Orange Money",
        requiresOtp: false,
        redirect: false,
      },
      {
        code: "DRC_AFRIMONEY",
        label: "Afrimoney",
        requiresOtp: false,
        redirect: false,
      },
      {
        code: "DRC_RAKKACASH",
        label: "Rakkacash",
        requiresOtp: true,
        redirect: false,
      },
    ],
  },
  {
    id: "card",
    title: "Carte bancaire",
    detail: "Paiement sécurisé par carte Visa",
    icon: CreditCard,
    accountLabel: "Téléphone du payeur",
    accountPlaceholder: "+243 812 345 678",
    accountHint:
      "Les coordonnées de votre carte seront saisies sur la page sécurisée de paiement.",
    operators: [
      {
        code: "DRC_VISA_CNP",
        label: "Visa",
        requiresOtp: false,
        redirect: true,
      },
    ],
  },
];

export function getCategory(id: PaymentCategory): PaymentCategoryDef {
  return (
    paymentCategories.find((category) => category.id === id) ??
    paymentCategories[0]
  );
}

export function findOperator(
  code: MakutaOperatorCode | null
): PaymentOperator | undefined {
  if (!code) return undefined;

  for (const category of paymentCategories) {
    const operator = category.operators.find((item) => item.code === code);
    if (operator) return operator;
  }

  return undefined;
}
