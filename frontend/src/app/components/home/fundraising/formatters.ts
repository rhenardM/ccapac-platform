import type { DonationStatus } from "./types";

export const formatMoney = (value: number, currency = "USD") =>
  `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(value)} ${currency}`;

export const formatTierRange = (
  minAmount: number,
  maxAmount: number | null,
  currency: string
) => {
  if (maxAmount === null) {
    return `${formatMoney(minAmount, currency)} +`;
  }

  return `${formatMoney(minAmount, currency)} - ${formatMoney(
    maxAmount,
    currency
  )}`;
};

export const formatDonationStatus = (status: DonationStatus) => {
  const labels: Record<DonationStatus, string> = {
    pending: "en attente",
    succeeded: "confirmé",
    failed: "non abouti",
    cancelled: "annulé",
    refunded: "remboursé",
  };

  return labels[status];
};
