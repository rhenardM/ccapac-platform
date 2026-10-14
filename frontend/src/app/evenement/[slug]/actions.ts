"use server";

import prisma from "@/lib/prisma";
import { getUser } from "@/lib/auth-server";

interface RegisterForEventResult {
  success: boolean;
  message?: string;
  error?: string;
  redirectTo?: string;
}

/**
 * Inscription à un événement pour un utilisateur connecté
 */
export async function registerEventAction(
  eventId: string
): Promise<RegisterForEventResult> {
  try {
    const user = await getUser();

    if (!user) {
      return {
        success: false,
        error: "Vous devez être connecté pour vous inscrire",
        redirectTo: `/auth/login?redirectUrl=/evenement/${eventId}`,
      };
    }

    if (!user.emailVerified) {
      return {
        success: false,
        error:
          "Veuillez vérifier votre adresse email avant de vous inscrire. Consultez votre boîte de réception pour le lien de vérification.",
      };
    }

    // Vérifier si l'utilisateur est déjà inscrit
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: {
        userId_eventId: {
          userId: user.dbUserId,
          eventId: eventId,
        },
      },
    });

    if (existingRegistration) {
      return {
        success: false,
        error: "Vous êtes déjà inscrit à cet événement",
      };
    }

    // Créer l'inscription
    await prisma.eventRegistration.create({
      data: {
        userId: user.dbUserId,
        eventId: eventId,
        status: "CONFIRMED",
      },
    });

    // Créer une activité
    await prisma.memberActivity.create({
      data: {
        userId: user.dbUserId,
        type: "EVENT_REGISTER",
        metadata: {
          eventId: eventId,
        },
      },
    });

    return {
      success: true,
      message: "Vous êtes inscrit à cet événement !",
    };
  } catch (error) {
    console.error("Erreur lors de l'inscription à l'événement:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de l'inscription",
    };
  }
}

/**
 * Créer une inscription à un événement pour un utilisateur
 * Utilisé après la création d'un compte via le backend Node.js.
 */
export async function createEventRegistrationAction(
  eventId: string,
  userEmail: string,
  phone?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Récupérer l'utilisateur créé
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return {
        success: false,
        error: "Utilisateur non trouvé",
      };
    }

    // Mettre à jour le téléphone si fourni
    if (phone) {
      await prisma.user.update({
        where: { id: user.id },
        data: { phone: phone },
      });
    }

    // Vérifier si l'utilisateur est déjà inscrit
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: {
        userId_eventId: {
          userId: String(user.id),
          eventId: eventId,
        },
      },
    });

    if (existingRegistration) {
      return {
        success: true, // Déjà inscrit, pas d'erreur
      };
    }

    // Créer l'inscription à l'événement
    await prisma.eventRegistration.create({
      data: {
        userId: String(user.id),
        eventId: eventId,
        status: "CONFIRMED",
      },
    });

    // Créer une activité
    await prisma.memberActivity.create({
      data: {
        userId: String(user.id),
        type: "EVENT_REGISTER",
        metadata: {
          eventId: eventId,
          eventTitle: "Événement",
        },
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erreur lors de la création de l'inscription:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de l'inscription",
    };
  }
}

/**
 * Créer une inscription à un événement après authentification Google
 * Utilisé dans la route callback après l'authentification Google réussie
 */
export async function createEventRegistrationAfterGoogleAuth(
  eventId: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const user = await getUser();

    if (!user) {
      return {
        success: false,
        error: "Utilisateur non authentifié",
      };
    }

    // Vérifier si l'utilisateur est déjà inscrit
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: {
        userId_eventId: {
          userId: user.dbUserId,
          eventId: eventId,
        },
      },
    });

    if (existingRegistration) {
      return {
        success: true,
        message: "Vous êtes déjà inscrit à cet événement",
      };
    }

    // Créer l'inscription à l'événement
    await prisma.eventRegistration.create({
      data: {
        userId: user.dbUserId,
        eventId: eventId,
        status: "CONFIRMED",
      },
    });

    // Créer une activité
    await prisma.memberActivity.create({
      data: {
        userId: user.dbUserId,
        type: "EVENT_REGISTER",
        metadata: {
          eventId: eventId,
          eventTitle: "Événement",
        },
      },
    });

    return {
      success: true,
      message: "Inscription à l'événement créée avec succès",
    };
  } catch (error) {
    console.error(
      "Erreur lors de la création de l'inscription après auth Google:",
      error
    );
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de l'inscription",
    };
  }
}

/**
 * Vérifier si l'utilisateur est déjà inscrit à un événement
 */
export async function checkEventRegistration(
  eventId: string
): Promise<{ isRegistered: boolean; status?: string }> {
  try {
    const user = await getUser();

    if (!user) {
      return { isRegistered: false };
    }

    const registration = await prisma.eventRegistration.findUnique({
      where: {
        userId_eventId: {
          userId: user.dbUserId,
          eventId: eventId,
        },
      },
    });

    return {
      isRegistered: !!registration,
      status: registration?.status,
    };
  } catch (error) {
    console.error("Erreur lors de la vérification de l'inscription:", error);
    return { isRegistered: false };
  }
}
