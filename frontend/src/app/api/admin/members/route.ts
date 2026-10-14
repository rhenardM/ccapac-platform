import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUser } from "@/lib/auth-server";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const user = await getUser();

  if (!user || user.role !== "ADMIN") {
    return new NextResponse("Non autorisé", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const searchTerm = searchParams.get("search") ?? "";

  const whereClause: Prisma.UserWhereInput = {
    role: "MEMBER",
  };

  if (searchTerm) {
    whereClause.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { email: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  const members = await prisma.user.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      _count: {
        select: {
          activities: true,
        },
      },
    },
  });

  const totalMembers = await prisma.user.count({
    where: { role: "MEMBER" },
  });

  return NextResponse.json({
    members: members.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    })),
    totalMembers,
  });
}
