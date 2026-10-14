import { NextRequest, NextResponse } from "next/server";
import type { AksessifyDonation } from "@/lib/aksessify";
import {
  aksessifyErrorResponse,
  getFundraisingCampaign,
  listFundraisingDonations,
} from "@/lib/aksessify";
import { getUser } from "@/lib/auth-server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const donationStatuses: AksessifyDonation["status"][] = [
  "pending",
  "succeeded",
  "failed",
  "cancelled",
  "refunded",
];
const DEFAULT_PER_PAGE = 10;
const MAX_PER_PAGE = 50;

function isDonationStatus(
  value: string | null
): value is AksessifyDonation["status"] {
  return donationStatuses.includes(value as AksessifyDonation["status"]);
}

function paymentMethodLabel(method: AksessifyDonation["payment_method"]) {
  const labels: Record<AksessifyDonation["payment_method"], string> = {
    stripe: "Carte bancaire",
    paypal: "PayPal",
    pawapay: "Mobile Money",
  };

  return labels[method];
}

function tierRangeLabel(
  minAmount: number,
  maxAmount: number | null,
  currency: string
) {
  const format = (value: number) =>
    `${new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(value)} ${currency}`;

  return maxAmount === null
    ? `${format(minAmount)} +`
    : `${format(minAmount)} - ${format(maxAmount)}`;
}

export async function GET(req: NextRequest) {
  const user = await getUser();

  if (!user || user.role !== "ADMIN") {
    return new NextResponse("Non autorise", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const paymentMethod = searchParams.get("payment_method");
  const tierId = searchParams.get("tier_id");
  const selectedStatus = isDonationStatus(status) ? status : undefined;
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  const perPage = Math.min(
    Math.max(Number(searchParams.get("per_page")) || DEFAULT_PER_PAGE, 1),
    MAX_PER_PAGE
  );

  try {
    const [campaignData, donationsList] = await Promise.all([
      getFundraisingCampaign(),
      listFundraisingDonations({ status: selectedStatus, limit: 100 }),
    ]);

    const tierById = new Map(
      campaignData.tiers.map((tier) => [
        tier.id,
        {
          id: tier.id,
          name: tier.name,
          range_label: tierRangeLabel(
            tier.min_amount,
            tier.max_amount,
            campaignData.campaign.currency
          ),
        },
      ])
    );

    const filteredDonations = donationsList.data.filter((donation) => {
      if (
        paymentMethod &&
        paymentMethod !== "all" &&
        donation.payment_method !== paymentMethod
      ) {
        return false;
      }

      if (tierId === "unassigned") {
        return !donation.tier_id;
      }

      if (tierId && tierId !== "all" && donation.tier_id !== tierId) {
        return false;
      }

      return true;
    });
    const totalCount = filteredDonations.length;
    const totalPages = Math.max(Math.ceil(totalCount / perPage), 1);
    const currentPage = Math.min(page, totalPages);
    const pageStart = (currentPage - 1) * perPage;
    const paginatedDonations = filteredDonations.slice(
      pageStart,
      pageStart + perPage
    );

    const donationIds = paginatedDonations.map((donation) => donation.id);
    const notifications = donationIds.length
      ? await prisma.fundraisingDonationNotification.findMany({
          where: { donationId: { in: donationIds } },
          select: {
            donationId: true,
            notificationStatus: true,
            notifiedAt: true,
            donorNotificationStatus: true,
            donorNotifiedAt: true,
            donorIsMember: true,
          },
        })
      : [];
    const notificationByDonationId = new Map(
      notifications.map((notification) => [
        notification.donationId,
        notification,
      ])
    );

    return NextResponse.json({
      campaign: {
        id: campaignData.campaign.id,
        title: campaignData.campaign.title,
        status: campaignData.campaign.status,
        goal_amount: campaignData.campaign.goal_amount,
        currency: campaignData.campaign.currency,
      },
      stats: {
        raised_amount: campaignData.stats.raised_amount,
        progress_percent: campaignData.stats.progress_percent,
        succeeded_donations_count:
          campaignData.stats.succeeded_donations_count,
        unique_donors_count: campaignData.stats.unique_donors_count,
        pending_donations_count: campaignData.stats.pending_donations_count,
      },
      tiers: campaignData.tiers.map((tier) => ({
        id: tier.id,
        name: tier.name,
        min_amount: tier.min_amount,
        max_amount: tier.max_amount,
        display_order: tier.display_order,
        range_label: tierRangeLabel(
          tier.min_amount,
          tier.max_amount,
          campaignData.campaign.currency
        ),
      })),
      donations: paginatedDonations.map((donation) => {
        const notification = notificationByDonationId.get(donation.id);
        const tier = donation.tier_id
          ? tierById.get(donation.tier_id)
          : undefined;

        return {
          id: donation.id,
          tier_id: donation.tier_id,
          tier_name: donation.tier_id
            ? tier?.name || "Palier introuvable"
            : "Sans palier",
          tier_range: tier?.range_label || null,
          amount: donation.amount,
          currency: donation.currency,
          status: donation.status,
          payment_method: donation.payment_method,
          payment_method_label: paymentMethodLabel(donation.payment_method),
          donor: donation.donor,
          created_at: donation.created_at,
          updated_at: donation.updated_at,
          succeeded_at: donation.succeeded_at || null,
          notification_status: notification?.notificationStatus || "none",
          notified_at: notification?.notifiedAt?.toISOString() || null,
          donor_notification_status:
            notification?.donorNotificationStatus || "none",
          donor_notified_at:
            notification?.donorNotifiedAt?.toISOString() || null,
          donor_is_member: notification?.donorIsMember ?? null,
        };
      }),
      pagination: {
        page: currentPage,
        per_page: perPage,
        total_count: totalCount,
        total_pages: totalPages,
        has_next_page: currentPage < totalPages,
        has_previous_page: currentPage > 1,
      },
      has_more: currentPage < totalPages,
      next_cursor: donationsList.next_cursor || null,
    });
  } catch (error) {
    const response = aksessifyErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
