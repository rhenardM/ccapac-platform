import type {
  CreateDonationInput,
  CreatedDonation,
  DonationStatusResult,
  HonorDonationPayload,
} from "./types";

const CHECKOUT_UNAVAILABLE_MESSAGE =
  "Le paiement ne peut pas être démarré pour le moment.";
const STATUS_UNAVAILABLE_MESSAGE =
  "Nous ne pouvons pas confirmer le paiement pour le moment.";
const OTP_UNAVAILABLE_MESSAGE =
  "Le code de confirmation n'a pas pu être validé.";
const HONOR_EMAIL_UNAVAILABLE_MESSAGE =
  "L'e-mail au bénéficiaire n'a pas pu être envoyé.";

export async function createDonation(
  input: CreateDonationInput
): Promise<CreatedDonation> {
  const response = await fetch("/api/makuta/donations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: input.amount,
      operator: input.operator,
      account_number: input.accountNumber,
      donor: input.donor,
      donor_type: input.donorType ?? "self",
      beneficiary:
        input.donorType && input.donorType !== "self"
          ? input.beneficiary
          : undefined,
    }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || CHECKOUT_UNAVAILABLE_MESSAGE);
  }

  return {
    transactionId: data.transaction_id,
    status: data.status,
    redirectUrl: data.redirect_url ?? null,
    requiresOtp: Boolean(data.requires_otp),
  };
}

export async function getDonationStatus(
  transactionId: string
): Promise<DonationStatusResult> {
  const response = await fetch(
    `/api/makuta/donations/${encodeURIComponent(transactionId)}`,
    { cache: "no-store" }
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || STATUS_UNAVAILABLE_MESSAGE);
  }

  return {
    transactionId: data.transaction_id,
    status: data.status,
    message: data.message ?? null,
  };
}

/**
 * Demande l'envoi de l'e-mail « don en votre honneur » au bénéficiaire.
 * Le serveur revérifie que le paiement est confirmé avant d'envoyer.
 */
export async function sendHonorEmail(
  transactionId: string,
  payload: HonorDonationPayload
): Promise<void> {
  const response = await fetch(
    `/api/makuta/donations/${encodeURIComponent(transactionId)}/honor-email`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error?.message || HONOR_EMAIL_UNAVAILABLE_MESSAGE);
  }
}

export async function confirmDonationOtp(
  transactionId: string,
  otpCode: string
): Promise<DonationStatusResult> {
  const response = await fetch(
    `/api/makuta/donations/${encodeURIComponent(transactionId)}/confirm-otp`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otp_code: otpCode }),
    }
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || OTP_UNAVAILABLE_MESSAGE);
  }

  return {
    transactionId: data.transaction_id,
    status: data.status,
    message: data.message ?? null,
  };
}
