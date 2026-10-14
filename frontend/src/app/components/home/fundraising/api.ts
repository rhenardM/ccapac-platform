import type {
  CampaignResponse,
  CreatedDonation,
  DonationStatus,
  PaymentMethod,
} from "./types";

const CAMPAIGN_UNAVAILABLE_MESSAGE =
  "La collecte ne peut pas être affichée pour le moment.";

const CHECKOUT_UNAVAILABLE_MESSAGE =
  "Le paiement ne peut pas être démarré pour le moment.";

const DONATION_VERIFY_UNAVAILABLE_MESSAGE =
  "Nous ne pouvons pas confirmer le paiement pour le moment.";

type CreateDonationInput = {
  amount: number;
  paymentMethod: PaymentMethod;
  donor: {
    name: string;
    email: string;
    phone?: string;
  };
};

type CreatedDonationResponse = CreatedDonation & {
  checkout_url?: string;
  stripe?: {
    publishable_key: string;
    client_secret: string;
  };
};

type DonationVerificationResponse = {
  status: DonationStatus;
  provider_instructions: string | null;
  pawapay: CreatedDonation["pawapay"];
};

export async function fetchFundraisingCampaign(): Promise<CampaignResponse> {
  const response = await fetch("/api/fundraising/campaign", {
    cache: "no-store",
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || CAMPAIGN_UNAVAILABLE_MESSAGE);
  }

  return data;
}

export async function createFundraisingDonation({
  amount,
  paymentMethod,
  donor,
}: CreateDonationInput): Promise<CreatedDonationResponse> {
  const response = await fetch("/api/fundraising/donations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      payment_method: paymentMethod,
      client_request_id: crypto.randomUUID(),
      donor,
    }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || CHECKOUT_UNAVAILABLE_MESSAGE);
  }

  return data;
}

export async function verifyFundraisingDonation(
  donationId: string
): Promise<DonationVerificationResponse> {
  const response = await fetch(
    `/api/fundraising/donations/${donationId}/verify`,
    { method: "POST" }
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message || DONATION_VERIFY_UNAVAILABLE_MESSAGE
    );
  }

  return data;
}
