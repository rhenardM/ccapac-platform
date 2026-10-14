import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, phone } = body as {
      email?: string;
      phone?: string;
    };

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Vérifier si le profil est déjà initialisé (phone existe)
    if (user.phone) {
      return NextResponse.json({ ok: true, created: false });
    }

    // Mettre à jour l'utilisateur avec les informations du profil
    await prisma.user.update({
      where: { id: user.id },
      data: {
        phone: phone ?? null,
      },
    });

    return NextResponse.json({ ok: true, created: true });
  } catch (error) {
    console.error("Une erreur est survenue: ", error);
    return NextResponse.json(
      { error: "Une erreur est survenue: " + error },
      { status: 500 }
    );
  }
}
