import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { getUpcomingEvents } from "@/services/eventService";
import type { Event } from "@/types/events";

export const runtime = "nodejs";

// Revalidate every 30 seconds for better caching
export const revalidate = 30;

interface EventWithRegistrations extends Event {
  registrationsCount: number;
  registrations: Array<{
    id: string;
    userName: string;
    userEmail: string;
    status: string;
    registeredAt: string;
  }>;
}

export async function GET() {
  try {
    // Vérifier que l'utilisateur est admin
    const user = await getUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Événements à venir du backend contenu, du plus lointain au plus proche.
    // Le backend n'expose pas `isRegistrationOpen` : on ne filtre donc plus dessus.
    const events = (await getUpcomingEvents()).reverse();

    // Si pas d'événements, retourner directement
    if (events.length === 0) {
      return NextResponse.json({ events: [] });
    }

    // Récupérer TOUTES les inscriptions en UNE SEULE requête
    const eventIds = events.map((e) => e.id.toString());

    const allRegistrations = await prisma.eventRegistration.findMany({
      where: {
        eventId: { in: eventIds },
        status: { not: "CANCELLED" },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Grouper les inscriptions par eventId
    const registrationsByEvent = new Map<string, typeof allRegistrations>();
    for (const reg of allRegistrations) {
      const existing = registrationsByEvent.get(reg.eventId) || [];
      existing.push(reg);
      registrationsByEvent.set(reg.eventId, existing);
    }

    // Mapper les événements avec leurs inscriptions
    const eventsWithRegistrations: EventWithRegistrations[] = events.map(
      (event) => {
        const eventRegs = registrationsByEvent.get(event.id.toString()) || [];
        return {
          ...event,
          registrationsCount: eventRegs.length,
          registrations: eventRegs.map((reg) => ({
            id: reg.id,
            userName: reg.user.name,
            userEmail: reg.user.email,
            status: reg.status,
            registeredAt: reg.createdAt.toISOString(),
          })),
        };
      }
    );

    return NextResponse.json({
      events: eventsWithRegistrations,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des événements:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de la récupération des événements",
      },
      { status: 500 }
    );
  }
}
