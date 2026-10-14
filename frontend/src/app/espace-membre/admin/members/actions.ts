"use server";

import { getUser } from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteMemberAction(memberId: string) {
  try {
    // Vérifier que l'utilisateur est admin
    const admin = await getUser();
    if (!admin || admin.role !== "ADMIN") {
      return { success: false, error: "Non autorisé" };
    }

    if (!memberId) {
      return { success: false, error: "ID du membre requis" };
    }

    // Récupérer le membre à supprimer
    const member = await prisma.user.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return { success: false, error: "Membre introuvable" };
    }

    // Empêcher la suppression d'un admin
    if (member.role === "ADMIN") {
      return {
        success: false,
        error: "Impossible de supprimer un administrateur",
      };
    }

    // Supprimer le membre (cascade supprimera aussi profile, activities, etc.)
    await prisma.user.delete({
      where: { id: memberId },
    });

    // Revalider la page pour afficher les données mises à jour
    revalidatePath("/espace-membre/admin/members");

    return {
      success: true,
      message: `Le membre ${member.name} a été supprimé avec succès`,
    };
  } catch (error) {
    console.error("Erreur lors de la suppression du membre:", error);
    return {
      success: false,
      error: "Erreur lors de la suppression. Veuillez réessayer.",
    };
  }
}
