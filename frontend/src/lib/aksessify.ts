export type AksessifyCampaign = {
  id: string;
  object: "campaign";
  slug: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  goal_amount: number;
  currency: string;
  status: "draft" | "active" | "paused" | "completed" | "archived";
  starts_at: string | null;
  ends_at: string | null;
  success_url: string | null;
  cancel_url: string | null;
  return_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

export type AksessifyTier = {
  id: string;
  object?: "tier";
  campaign_id: string;
  name: string;
  description: string | null;
  min_amount: number;
  max_amount: number | null;
  display_order: number;
  metadata: Record<string, unknown>;
};

export type AksessifyCampaignStats = {
  object: "campaign_stats";
  campaign_id: string;
  title: string;
  status: string;
  currency: string;
  goal_amount: number;
  raised_amount: number;
  progress_percent: number;
  succeeded_donations_count: number;
  unique_donors_count: number;
  pending_donations_count: number;
  tiers: Array<{
    tier_id: string;
    name: string;
    min_amount: number;
    max_amount: number | null;
    donations_count: number;
    raised_amount: number;
  }>;
  in_kind: {
    pledged_count: number;
    accepted_count: number;
    received_count: number;
  };
};

export type CreateAksessifyDonationInput = {
  amount: number;
  currency?: string;
  payment_method: "stripe" | "paypal" | "pawapay";
  donor: {
    name: string;
    email: string;
    phone?: string;
    is_anonymous?: boolean;
  };
  success_url?: string;
  cancel_url?: string;
  return_url?: string;
  pawapay?: {
    country?: string;
    provider?: string;
    provider_currency?: string;
  };
  metadata?: Record<string, unknown>;
};

export type AksessifyDonation = {
  id: string;
  object: "donation";
  campaign_id: string;
  tier_id: string | null;
  amount: number;
  currency: string;
  payment_method: "stripe" | "paypal" | "pawapay";
  status: "pending" | "succeeded" | "failed" | "cancelled" | "refunded";
  donor: {
    name: string;
    email: string;
    phone?: string;
    is_anonymous?: boolean;
  };
  provider_session_id: string | null;
  checkout_url: string | null;
  stripe?: {
    publishable_key: string;
    client_secret: string;
  } | null;
  provider_instructions?: string | null;
  pawapay?: {
    country?: string;
    provider?: string;
    provider_amount?: number;
    provider_currency?: string;
    exchange_rate?: number;
    exchange_rate_timestamp?: string;
    last_provider_status?: string;
    last_checked_at?: string;
  } | null;
  metadata: Record<string, unknown>;
  succeeded_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type AksessifyList<T> = {
  object?: "list";
  data: T[];
  has_more?: boolean;
  next_cursor?: string | null;
};

type AksessifyRequestInit = RequestInit & {
  next?: {
    revalidate?: number;
  };
};

type AksessifyErrorBody = {
  error?: {
    type?: string;
    code?: string;
    message?: string;
    param?: string;
  };
};

export class AksessifyApiError extends Error {
  status: number;
  code: string;
  type: string;
  param?: string;
  retryAfter?: string | null;

  constructor({
    status,
    code,
    type,
    message,
    param,
    retryAfter,
  }: {
    status: number;
    code: string;
    type: string;
    message: string;
    param?: string;
    retryAfter?: string | null;
  }) {
    super(message);
    this.name = "AksessifyApiError";
    this.status = status;
    this.code = code;
    this.type = type;
    this.param = param;
    this.retryAfter = retryAfter;
  }
}

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new AksessifyApiError({
      status: 500,
      code: "missing_configuration",
      type: "configuration_error",
      message: `Configuration serveur manquante: ${name}.`,
    });
  }

  return value;
}

function getAksessifyConfig() {
  return {
    apiBaseUrl: getRequiredEnv("AKSESSIFY_API_BASE_URL").replace(/\/$/, ""),
    apiKey: getRequiredEnv("AKSESSIFY_API_KEY"),
    campaignId: getRequiredEnv("AKSESSIFY_CAMPAIGN_ID"),
  };
}

export function getAppBaseUrl() {
  return (
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function functionUrl(functionName: string, path = "") {
  const { apiBaseUrl } = getAksessifyConfig();
  return `${apiBaseUrl}/${functionName}${path}`;
}

async function aksessifyRequest<T>(
  functionName: string,
  {
    path = "",
    init,
    idempotencyKey,
  }: {
    path?: string;
    init?: AksessifyRequestInit;
    idempotencyKey?: string;
  } = {}
) {
  const { apiKey } = getAksessifyConfig();
  const headers = new Headers(init?.headers);

  headers.set("Authorization", `Bearer ${apiKey}`);
  headers.set("Accept", "application/json");

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (idempotencyKey) {
    headers.set("Idempotency-Key", idempotencyKey);
  }

  const response = await fetch(functionUrl(functionName, path), {
    ...init,
    headers,
  });

  const text = await response.text();
  const body = text ? (JSON.parse(text) as T & AksessifyErrorBody) : null;

  if (!response.ok) {
    const error = body?.error;

    throw new AksessifyApiError({
      status: response.status,
      code: error?.code || "aksessify_request_failed",
      type: error?.type || "api_error",
      message:
        error?.message ||
        "La collecte ne peut pas etre affichee pour le moment.",
      param: error?.param,
      retryAfter: response.headers.get("Retry-After"),
    });
  }

  return body as T;
}

export async function getFundraisingCampaign() {
  const { campaignId } = getAksessifyConfig();

  const [campaign, tiers, stats] = await Promise.all([
    aksessifyRequest<AksessifyCampaign>(
      "api-v1-campaigns",
      { path: `/${campaignId}`, init: { next: { revalidate: 60 } } }
    ),
    aksessifyRequest<AksessifyList<AksessifyTier>>("api-v1-tiers", {
      path: `?campaign_id=${encodeURIComponent(campaignId)}`,
      init: { next: { revalidate: 60 } },
    }),
    aksessifyRequest<AksessifyCampaignStats>("api-v1-stats", {
      path: `/${campaignId}`,
      init: { next: { revalidate: 30 } },
    }),
  ]);

  return {
    campaign,
    tiers: [...tiers.data].sort((a, b) => a.display_order - b.display_order),
    stats,
  };
}

export async function createFundraisingDonation(
  input: CreateAksessifyDonationInput,
  idempotencyKey: string
) {
  const { campaignId } = getAksessifyConfig();
  const payload = {
    campaign_id: campaignId,
    amount: input.amount,
    currency: input.currency,
    payment_method: input.payment_method,
    donor: input.donor,
    success_url: input.success_url,
    cancel_url: input.cancel_url,
    return_url: input.return_url,
    metadata: input.metadata || {},
  } as Record<string, unknown>;

  if (input.payment_method === "pawapay") {
    payload.pawapay = input.pawapay || {};
  }

  return aksessifyRequest<AksessifyDonation>("api-v1-donations", {
    idempotencyKey,
    init: {
      method: "POST",
      body: JSON.stringify(payload),
    },
  });
}

export async function verifyFundraisingDonation(donationId: string) {
  return aksessifyRequest<AksessifyDonation>("api-v1-donations", {
    path: `/${encodeURIComponent(donationId)}/verify`,
    init: {
      method: "POST",
    },
  });
}

export async function listFundraisingDonations({
  status,
  limit = 50,
}: {
  status?: AksessifyDonation["status"];
  limit?: number;
} = {}) {
  const { campaignId } = getAksessifyConfig();
  const searchParams = new URLSearchParams({
    campaign_id: campaignId,
    limit: String(Math.min(Math.max(limit, 1), 100)),
  });

  if (status) {
    searchParams.set("status", status);
  }

  return aksessifyRequest<AksessifyList<AksessifyDonation>>(
    "api-v1-donations",
    {
      path: `?${searchParams.toString()}`,
      init: { next: { revalidate: 15 } },
    }
  );
}

export function aksessifyErrorResponse(error: unknown) {
  if (error instanceof AksessifyApiError) {
    return {
      body: {
        error: {
          code: error.code,
          message: error.message,
          type: error.type,
          param: error.param,
        },
      },
      status: error.status,
    };
  }

  console.error("Erreur donation inattendue:", error);

  return {
    body: {
      error: {
        code: "internal_error",
        message: "Le paiement ne peut pas etre traite pour le moment.",
      },
    },
    status: 500,
  };
}
