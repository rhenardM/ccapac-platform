import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createTransaction, makutaErrorResponse } from "@/lib/makuta";

export const runtime = "nodejs";

const operatorCodes = [
  "DRC_MPESA",
  "DRC_AIRTEL_MONEY",
  "DRC_ORANGE_MONEY",
  "DRC_AFRIMONEY",
  "DRC_RAKKACASH",
  "DRC_VISA_CNP",
] as const;

const mobileMoneyOperators = new Set([
  "DRC_MPESA",
  "DRC_AIRTEL_MONEY",
  "DRC_ORANGE_MONEY",
  "DRC_AFRIMONEY",
  "DRC_RAKKACASH",
]);

const donorNamePattern = /^[\p{L}\p{N} .,'&-]{2,160}$/u;
const phonePattern = /^\+243\d{9}$/;
const maxDonationAmount = 1000000;

const createDonationSchema = z.object({
  amount: z.number().positive().max(maxDonationAmount),
  operator: z.enum(operatorCodes),
  // Optionnel : non requis pour Visa CNP (saisie sur la page sécurisée Makuta).
  account_number: z.string().trim().max(40).optional(),
  donor: z.object({
    name: z.string().trim().min(2).max(160).regex(donorNamePattern),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().max(40).optional(),
  }),
  // Pour qui le don est fait (suivi). Bénéficiaire si « proche »/« organisation ».
  donor_type: z.enum(["self", "relative", "organization"]).optional().default("self"),
  beneficiary: z
    .object({
      name: z.string().trim().max(160).optional().default(""),
      email: z.string().trim().email().max(254).optional().or(z.literal("")),
      message: z.string().trim().max(1000).optional().default(""),
    })
    .optional(),
});

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

  const { amount, operator, donor } = result.data;
  const donorType = result.data.donor_type;
  const beneficiary = result.data.beneficiary;
  const accountNumber = (result.data.account_number ?? "").replace(/[\s-]/g, "");

  // Les opérateurs Mobile Money attendent un numéro RDC au format international.
  if (mobileMoneyOperators.has(operator) && !phonePattern.test(accountNumber)) {
    return NextResponse.json(
      {
        error: {
          code: "invalid_account_number",
          message:
            "Veuillez entrer un numéro valide au format +243 suivi de 9 chiffres.",
          param: "account_number",
        },
      },
      { status: 400 }
    );
  }

  try {
    const transaction = await createTransaction({
      operator,
      accountNumber,
      currency: "USD",
      amount,
      // Référence unique générée par notre système (idempotence côté Makuta).
      thirdPartyReference: crypto.randomUUID(),
      reason: "Don — Centre Culturel et Artistique (CCAPAC)",
      email: operator === "DRC_VISA_CNP" ? donor.email.toLowerCase() : undefined,
      // Identité du donateur — requise par notre backend (reçu + suivi).
      donorName: donor.name,
      donorEmail: donor.email.toLowerCase(),
      donorPhone: donor.phone,
      // Suivi « pour qui » + bénéficiaire (don au nom d'un proche/organisation).
      donorType,
      beneficiaryName: beneficiary?.name || undefined,
      beneficiaryEmail: beneficiary?.email || undefined,
      beneficiaryMessage: beneficiary?.message || undefined,
    });

    // NOTE(makuta §9): les notifications e-mail (admin + donateur) à la
    // confirmation du paiement seront déclenchées par le webhook de callback,
    // sur le modèle de `processSucceededDonationNotifications`
    // (src/app/api/fundraising/donations/[id]/verify/route.ts).

    return NextResponse.json({
      transaction_id: transaction.id,
      status: transaction.status,
      redirect_url: transaction.redirectUrl,
      requires_otp: transaction.requiresOtp,
    });
  } catch (error) {
    const response = makutaErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
