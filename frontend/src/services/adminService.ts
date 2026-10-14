export interface AdminRecentMember {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  emailVerified: boolean;
}

export interface AdminStatsResponse {
  totalMembers: number;
  totalActivities: number;
  newMembersThisWeek: number;
  recentMembers: AdminRecentMember[];
}

export type MembersStatusFilter = "all";

export interface MembersQueryParams {
  search?: string;
  status?: MembersStatusFilter;
}

export interface MemberWithActivities {
  id: string;
  name: string | null;
  email: string;
  role: "MEMBER" | "ADMIN";
  emailVerified: boolean;
  createdAt: string;
  _count: {
    activities: number;
  };
}

export interface MembersResponse {
  members: MemberWithActivities[];
  totalMembers: number;
}

export type SuggestionCategory =
  | "PROGRAMMATION"
  | "ACCUEIL"
  | "ESPACES"
  | "COMMUNICATION"
  | "AUTRE";

export type SuggestionStatus = "NEW" | "READ" | "RESOLVED";

export interface AdminSuggestion {
  id: string;
  category: SuggestionCategory;
  message: string;
  status: SuggestionStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
}

export interface SuggestionsQueryParams {
  status?: SuggestionStatus | "all";
  category?: SuggestionCategory | "all";
}

export interface SuggestionsResponse {
  suggestions: AdminSuggestion[];
  totalSuggestions: number;
}

export type FundraisingDonationStatus =
  | "pending"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "refunded";

export type FundraisingPaymentMethod = "stripe" | "paypal" | "pawapay";

export interface FundraisingQueryParams {
  status?: FundraisingDonationStatus | "all";
  payment_method?: FundraisingPaymentMethod | "all";
  tier_id?: string | "all" | "unassigned";
  page?: number;
  per_page?: number;
}

export interface AdminFundraisingDonation {
  id: string;
  tier_id: string | null;
  tier_name: string;
  tier_range: string | null;
  amount: number;
  currency: string;
  status: FundraisingDonationStatus;
  payment_method: FundraisingPaymentMethod;
  payment_method_label: string;
  donor: {
    name: string;
    email: string;
    phone?: string;
    is_anonymous?: boolean;
  };
  created_at: string;
  updated_at: string;
  succeeded_at: string | null;
  notification_status: FundraisingNotificationStatus;
  notified_at: string | null;
  donor_notification_status: FundraisingNotificationStatus;
  donor_notified_at: string | null;
  donor_is_member: boolean | null;
}

export type FundraisingNotificationStatus =
  | "none"
  | "pending"
  | "sending"
  | "sent"
  | "failed"
  | "skipped";

export interface AdminFundraisingResponse {
  campaign: {
    id: string;
    title: string;
    status: string;
    goal_amount: number;
    currency: string;
  };
  stats: {
    raised_amount: number;
    progress_percent: number;
    succeeded_donations_count: number;
    unique_donors_count: number;
    pending_donations_count: number;
  };
  tiers: Array<{
    id: string;
    name: string;
    min_amount: number;
    max_amount: number | null;
    display_order: number;
    range_label: string;
  }>;
  donations: AdminFundraisingDonation[];
  pagination: {
    page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
  };
  has_more: boolean;
  next_cursor: string | null;
}

async function handleJsonResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      text || `Erreur API admin (${res.status} ${res.statusText})`
    );
  }
  return (await res.json()) as T;
}

export async function getAdminStats(): Promise<AdminStatsResponse> {
  const res = await fetch("/api/admin/stats", {
    method: "GET",
    cache: "no-store",
  });
  return handleJsonResponse<AdminStatsResponse>(res);
}

export async function getMembers(
  params: MembersQueryParams
): Promise<MembersResponse> {
  const searchParams = new URLSearchParams();

  if (params.search) {
    searchParams.set("search", params.search);
  }

  if (params.status && params.status !== "all") {
    searchParams.set("status", params.status);
  }

  const queryString = searchParams.toString();
  const url = queryString
    ? `/api/admin/members?${queryString}`
    : "/api/admin/members";

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  return handleJsonResponse<MembersResponse>(res);
}

export async function getSuggestions(
  params: SuggestionsQueryParams
): Promise<SuggestionsResponse> {
  const searchParams = new URLSearchParams();

  if (params.status && params.status !== "all") {
    searchParams.set("status", params.status);
  }

  if (params.category && params.category !== "all") {
    searchParams.set("category", params.category);
  }

  const queryString = searchParams.toString();
  const url = queryString
    ? `/api/admin/suggestions?${queryString}`
    : "/api/admin/suggestions";

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  return handleJsonResponse<SuggestionsResponse>(res);
}

export async function updateSuggestionStatus(
  suggestionId: string,
  status: SuggestionStatus
): Promise<AdminSuggestion> {
  const res = await fetch("/api/admin/suggestions", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ suggestionId, status }),
  });

  return handleJsonResponse<AdminSuggestion>(res);
}

export async function getFundraisingAdminData(
  params: FundraisingQueryParams
): Promise<AdminFundraisingResponse> {
  const searchParams = new URLSearchParams();

  if (params.status && params.status !== "all") {
    searchParams.set("status", params.status);
  }

  if (params.payment_method && params.payment_method !== "all") {
    searchParams.set("payment_method", params.payment_method);
  }

  if (params.tier_id && params.tier_id !== "all") {
    searchParams.set("tier_id", params.tier_id);
  }

  if (params.page) {
    searchParams.set("page", String(params.page));
  }

  if (params.per_page) {
    searchParams.set("per_page", String(params.per_page));
  }

  const queryString = searchParams.toString();
  const url = queryString
    ? `/api/admin/fundraising?${queryString}`
    : "/api/admin/fundraising";

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  return handleJsonResponse<AdminFundraisingResponse>(res);
}
