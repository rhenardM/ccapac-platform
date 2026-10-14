import { NextRequest, NextResponse } from "next/server";
import { getTransaction, makutaErrorResponse } from "@/lib/makuta";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
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

  try {
    const transaction = await getTransaction(id);

    return NextResponse.json({
      transaction_id: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      message: transaction.message,
    });
  } catch (error) {
    const response = makutaErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
