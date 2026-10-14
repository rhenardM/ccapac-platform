/*"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function logoutAction() {
  try {
    const headersList = await headers();

    await auth.api.signOut({
      headers: headersList,
    });

    return {
      success: true,
      message: "Déconnexion réussie",
    };
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error);
    return {
      success: false,
      error: "Erreur lors de la déconnexion. Veuillez réessayer.",
    };
  }
}
*/