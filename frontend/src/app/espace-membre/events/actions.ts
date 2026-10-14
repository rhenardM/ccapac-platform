"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getUser } from "@/lib/auth-server";
import prisma from "@/lib/prisma";

type CancelEventRegistrationResult = {
  success: boolean;
  error?: string;
};

export async function cancelEventRegistrationAction(
  formData: FormData
): Promise<CancelEventRegistrationResult> {
  const user = await getUser();

  // redirect() doit rester en dehors du try/catch,
  // car Next.js réalise la redirection avec une exception interne.
  if (!user) {
    redirect("/auth/login");
  }

  try {
    const registrationIdValue =
      formData.get("registrationId");

    if (
      typeof registrationIdValue !== "string" ||
      !registrationIdValue.trim()
    ) {
      return {
        success: false,
        error: "ID d'inscription manquant",
      };
    }

    const registrationId =
      registrationIdValue.trim();

    const registration =
      await prisma.eventRegistration.findUnique({
        where: {
          id: registrationId,
        },
      });

    if (!registration) {
      return {
        success: false,
        error: "Inscription non trouvée",
      };
    }

    const authenticatedUserId =
      user.dbUserId;

    if (
      registration.userId !==
      authenticatedUserId
    ) {
      return {
        success: false,
        error:
          "Vous n'êtes pas autorisé à annuler cette inscription",
      };
    }

    if (
      registration.status === "CANCELLED"
    ) {
      return {
        success: false,
        error:
          "Cette inscription est déjà annulée",
      };
    }

    await prisma.$transaction([
      prisma.eventRegistration.update({
        where: {
          id: registrationId,
        },
        data: {
          status: "CANCELLED",
        },
      }),

      prisma.memberActivity.create({
        data: {
          userId: authenticatedUserId,
          type: "EVENT_CANCEL",
          metadata: {
            eventId:
              registration.eventId,
            registrationId:
              registration.id,
          },
        },
      }),
    ]);

    revalidatePath(
      "/espace-membre/events"
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "[cancelEventRegistrationAction] Erreur :",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de l'annulation",
    };
  }
}