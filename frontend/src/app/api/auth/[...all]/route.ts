import { NextResponse } from "next/server";

const removed = () =>
  NextResponse.json(
    {
      success: false,
      message:
        "Cette ancienne route Better Auth est désactivée. Utilisez le backend Node /api/auth.",
    },
    { status: 410 }
  );

export const GET = removed;
export const POST = removed;
export const PUT = removed;
export const DELETE = removed;
