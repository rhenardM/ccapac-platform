import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getUser } from "@/lib/auth-server";
import {
  suggestionCategories,
  suggestionStatuses,
  type SuggestionCategoryValue,
  type SuggestionStatusValue,
} from "@/lib/suggestions";

function isSuggestionStatus(value: string): value is SuggestionStatusValue {
  return suggestionStatuses.includes(value as SuggestionStatusValue);
}

function isSuggestionCategory(value: string): value is SuggestionCategoryValue {
  return suggestionCategories.includes(value as SuggestionCategoryValue);
}

async function requireAdmin() {
  const user = await getUser();
  return user?.role === "ADMIN";
}

export async function GET(req: NextRequest) {
  const isAdmin = await requireAdmin();

  if (!isAdmin) {
    return new NextResponse("Non autorisé", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  const where: Prisma.MemberSuggestionWhereInput = {};

  if (status && isSuggestionStatus(status)) {
    where.status = status;
  }

  if (category && isSuggestionCategory(category)) {
    where.category = category;
  }

  const [suggestions, totalSuggestions] = await Promise.all([
    prisma.memberSuggestion.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    }),
    prisma.memberSuggestion.count({ where }),
  ]);

  return NextResponse.json({
    suggestions: suggestions.map((suggestion) => ({
      ...suggestion,
      createdAt: suggestion.createdAt.toISOString(),
      updatedAt: suggestion.updatedAt.toISOString(),
      resolvedAt: suggestion.resolvedAt?.toISOString() ?? null,
    })),
    totalSuggestions,
  });
}

export async function PATCH(req: NextRequest) {
  const isAdmin = await requireAdmin();

  if (!isAdmin) {
    return new NextResponse("Non autorisé", { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const suggestionId = body?.suggestionId;
  const status = body?.status;

  if (typeof suggestionId !== "string" || !suggestionId) {
    return new NextResponse("ID de suggestion requis", { status: 400 });
  }

  if (typeof status !== "string" || !isSuggestionStatus(status)) {
    return new NextResponse("Statut invalide", { status: 400 });
  }

  const suggestion = await prisma.memberSuggestion.update({
    where: { id: suggestionId },
    data: {
      status,
      resolvedAt: status === "RESOLVED" ? new Date() : null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  return NextResponse.json({
    ...suggestion,
    createdAt: suggestion.createdAt.toISOString(),
    updatedAt: suggestion.updatedAt.toISOString(),
    resolvedAt: suggestion.resolvedAt?.toISOString() ?? null,
  });
}
