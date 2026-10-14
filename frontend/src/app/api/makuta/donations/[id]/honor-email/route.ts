import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTransaction, makutaErrorResponse } from "@/lib/makuta";
import { sendDonationHonorEmail } from "@/services/mailServices";

export const runtime = "nodejs";

const honorEmailSchema = z.object({
  beneficiaryName: z.string().trim().min(1).max(160),
  beneficiaryEmail: z.string().trim().email().max(254),
  beneficiaryMessage: z.string().trim().max(1000).optional().default(""),
  donorName: z.string().trim().min(1).max(160),
  donorType: z.enum(["relative", "organization"]),
  amount: z.number().positive().max(1000000),
  currency: z.string().trim().min(1).max(8),
});

/**
 * Envoie l'e-mail « un don a été réalisé en votre honneur » au bénéficiaire.
 * Le paiement est vérifié auprès de Makuta : l'e-mail n'est envoyé que si la
 * transaction est réellement confirmée (statut « succeeded »).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || id.length > 120) {
    return NextResponse.json(
      {
        error: {
          code: "invalid_transaction_id",
          message: "Cette transaction ne peut pas être retrouvée.",
        },
      },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  const result = honorEmailSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        error: {
          code: "invalid_request",
          message: "Les informations du bénéficiaire sont invalides.",
          details: result.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  try {
    const transaction = await getTransaction(id);

    if (transaction.status !== "succeeded") {
      return NextResponse.json(
        {
          error: {
            code: "payment_not_confirmed",
            message: "Le paiement n'est pas encore confirmé.",
          },
        },
        { status: 409 }
      );
    }

    const data = result.data;

    await sendDonationHonorEmail(data.beneficiaryEmail, {
      beneficiaryName: data.beneficiaryName,
      donorName: data.donorName,
      amount: data.amount,
      currency: data.currency,
      donorType: data.donorType,
      message: data.beneficiaryMessage || undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const response = makutaErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
