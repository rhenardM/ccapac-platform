import { NextResponse } from "next/server";
import {
  aksessifyErrorResponse,
  getFundraisingCampaign,
} from "@/lib/aksessify";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET() {
  try {
    const data = await getFundraisingCampaign();

    return NextResponse.json({
      campaign: {
        id: data.campaign.id,
        title: data.campaign.title,
        description: data.campaign.description,
        goal_amount: data.campaign.goal_amount,
        currency: data.campaign.currency,
        status: data.campaign.status,
        cover_image_url: data.campaign.cover_image_url,
      },
      tiers: data.tiers.map((tier) => ({
        id: tier.id,
        name: tier.name,
        description: tier.description,
        min_amount: tier.min_amount,
        max_amount: tier.max_amount,
        display_order: tier.display_order,
      })),
      stats: {
        raised_amount: data.stats.raised_amount,
        progress_percent: data.stats.progress_percent,
        succeeded_donations_count: data.stats.succeeded_donations_count,
        unique_donors_count: data.stats.unique_donors_count,
        pending_donations_count: data.stats.pending_donations_count,
      },
    });
  } catch (error) {
    const response = aksessifyErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
