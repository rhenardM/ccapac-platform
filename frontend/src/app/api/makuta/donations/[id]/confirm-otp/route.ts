import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { confirmOtp, makutaErrorResponse } from "@/lib/makuta";

export const runtime = "nodejs";

const otpSchema = z.object({
  otp_code: z.string().trim().regex(/^\d{4,8}$/),
});

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
  const result = otpSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        error: {
          code: "invalid_otp",
          message: "Le code de confirmation est invalide.",
        },
      },
      { status: 400 }
    );
  }

  try {
    const transaction = await confirmOtp(id, result.data.otp_code);

    return NextResponse.json({
      transaction_id: transaction.id,
      status: transaction.status,
      message: transaction.message,
    });
  } catch (error) {
    const response = makutaErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
