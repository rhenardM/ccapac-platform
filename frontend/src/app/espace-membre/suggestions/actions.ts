"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { suggestionCategoryLabels, suggestionSchema } from "@/lib/suggestions";
import { sendMemberSuggestionEmail } from "@/services/mailServices";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "danmuamba81@gmail.com";

export async function createSuggestionAction(data: unknown) {
  const user = await getUser();

  if (!user || user.role !== "MEMBER") {
    return { success: false, error: "Non autorisé" };
  }

  const parsed = suggestionSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Données invalides",
    };
  }

  const suggestion = await prisma.memberSuggestion.create({
    data: {
      userId: user.dbUserId,
      category: parsed.data.category,
      message: parsed.data.message,
    },
  });

  await prisma.memberActivity.create({
    data: {
      userId: user.dbUserId,
      type: "SUGGESTION_SUBMIT",
      metadata: {
        suggestionId: suggestion.id,
        category: suggestion.category,
      },
    },
  });

  try {
    await sendMemberSuggestionEmail(ADMIN_EMAIL, {
      memberName: user.name,
      memberEmail: user.email,
      category: suggestionCategoryLabels[parsed.data.category],
      message: suggestion.message,
      submittedAt: suggestion.createdAt,
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de suggestion:", error);
  }

  revalidatePath("/espace-membre/suggestions");
  revalidatePath("/espace-membre");
  revalidatePath("/espace-membre/admin/suggestions");

  return {
    success: true,
    message: "Suggestion envoyée avec succès",
  };
}
