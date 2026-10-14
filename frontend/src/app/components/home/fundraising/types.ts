export type Step = "amount" | "identity" | "payment";

export type PaymentMethod = "card" | "paypal" | "mobile_money";

export type DonationStatus =
  | "pending"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "refunded";

export type CreatedDonation = {
  donation_id: string;
  status: DonationStatus;
  provider_instructions: string | null;
  pawapay: {
    country?: string;
    provider?: string;
    provider_amount?: number;
    provider_currency?: string;
    last_provider_status?: string;
  } | null;
};

export type CampaignResponse = {
  campaign: {
    id: string;
    title: string;
    description: string | null;
    goal_amount: number;
    currency: string;
    status: "draft" | "active" | "paused" | "completed" | "archived";
    cover_image_url: string | null;
  };
  tiers: Array<{
    id: string;
    name: string;
    description: string | null;
    min_amount: number;
    max_amount: number | null;
    display_order: number;
  }>;
  stats: {
    raised_amount: number;
    progress_percent: number;
    succeeded_donations_count: number;
    unique_donors_count: number;
    pending_donations_count: number;
  };
};

export type FundraisingErrors = Record<string, string>;
