import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  aksessifyErrorResponse,
  createFundraisingDonation,
  getAppBaseUrl,
} from "@/lib/aksessify";

export const runtime = "nodejs";

const donorNamePattern = /^[\p{L}\p{N} .,'&-]{2,160}$/u;
const phonePattern = /^\+243\d{9}$/;
const maxDonationAmount = 1000000;

const createDonationSchema = z.object({
  amount: z.number().positive().max(maxDonationAmount),
  payment_method: z.enum(["card", "paypal", "mobile_money"]),
  client_request_id: z.string().uuid(),
  donor: z.object({
    name: z.string().trim().min(2).max(160).regex(donorNamePattern),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().max(40).optional(),
  }),
});

const paymentMethodMap = {
  card: "stripe",
  paypal: "paypal",
  mobile_money: "pawapay",
} as const;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const result = createDonationSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        error: {
          code: "invalid_request",
          message: "Les informations du don sont invalides.",
          details: result.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  const normalizedPhone = result.data.donor.phone?.replace(/[\s-]/g, "");

  if (normalizedPhone && !phonePattern.test(normalizedPhone)) {
    return NextResponse.json(
      {
        error: {
          code: "invalid_phone",
          message:
            "Veuillez entrer un numero valide au format +243 suivi de 9 chiffres.",
          param: "donor.phone",
        },
      },
      { status: 400 }
    );
  }

  if (
    result.data.payment_method === "mobile_money" &&
    !normalizedPhone
  ) {
    return NextResponse.json(
      {
        error: {
          code: "missing_phone",
          message:
            "Pour Mobile Money, veuillez entrer votre numero en commencant par l'indicatif pays +243.",
          param: "donor.phone",
        },
      },
      { status: 400 }
    );
  }

  const appBaseUrl = getAppBaseUrl();
  const idempotencyKey = `ccapac-donation-${result.data.client_request_id}`;
  const isMobileMoney = result.data.payment_method === "mobile_money";
  const isCard = result.data.payment_method === "card";
  const isPaypal = result.data.payment_method === "paypal";

  try {
    const donation = await createFundraisingDonation(
      {
        amount: result.data.amount,
        payment_method: paymentMethodMap[result.data.payment_method],
        donor: {
          name: result.data.donor.name,
          email: result.data.donor.email.toLowerCase(),
          phone: normalizedPhone || undefined,
          is_anonymous: false,
        },
        return_url: isCard
          ? `${appBaseUrl}/don-merci?donation_id={DONATION_ID}&session_id={CHECKOUT_SESSION_ID}`
          : undefined,
        success_url: isPaypal ? `${appBaseUrl}/don-merci` : undefined,
        cancel_url: isPaypal
          ? `${appBaseUrl}/?don=cancelled#fundraising`
          : undefined,
        pawapay: isMobileMoney ? {} : undefined,
        metadata: {
          source: "ccapac_homepage",
          client_request_id: result.data.client_request_id,
        },
      },
      idempotencyKey
    );

    const stripe = donation.stripe;

    if (isCard && !stripe?.publishable_key) {
      return NextResponse.json(
        {
          error: {
            code: "missing_stripe_configuration",
            message: "Le paiement ne peut pas etre demarre pour le moment.",
          },
        },
        { status: 502 }
      );
    }

    if (isCard && !stripe?.client_secret) {
      return NextResponse.json(
        {
          error: {
            code: "missing_stripe_client_secret",
            message: "Le paiement ne peut pas etre demarre pour le moment.",
          },
        },
        { status: 502 }
      );
    }

    if (!isCard && !isMobileMoney && !donation.checkout_url) {
      return NextResponse.json(
        {
          error: {
            code: "missing_checkout_url",
            message: "Le paiement ne peut pas etre demarre pour le moment.",
          },
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      donation_id: donation.id,
      checkout_url: donation.checkout_url,
      status: donation.status,
      stripe: isCard ? stripe : null,
      provider_instructions: donation.provider_instructions || null,
      pawapay: donation.pawapay || null,
    });
  } catch (error) {
    const response = aksessifyErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
