import { fetchAll, fetchJson, slugToId } from "@/lib/content-api";
import { getMonthNumber } from "@/lib/utils";
import { Event, EventFilters, EventWithRegistrations } from "@/types/events";

/** Forme brute d'un événement renvoyée par NOTRE backend (/api/content/events). */
interface BackendEvent {
  slug: string;
  title: string;
  category?: string | null;
  location?: string | null;
  organizer?: string | null;
  featured?: boolean;
  isRegistrationOpen?: boolean;
  coverImage?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  description?: string | null;
  publishedAt?: string | null;
}

/**
 * Convertit un événement backend vers le type `Event` attendu par le site.
 * Les champs absents du backend (public, capacity, objectif, tags…) reçoivent
 * des valeurs par défaut sûres pour ne pas casser le rendu existant.
 */
const mapEvent = (e: BackendEvent): Event => {
  const startDate = e.startsAt ?? "";
  const startTime = e.startTime ?? "";
  const discipline = e.category ?? "";

  return {
    id: slugToId(e.slug),
    title: e.title,
    slug: e.slug,
    startDate,
    endDate: e.endsAt ?? undefined,
    startTime,
    endTime: e.endTime ?? undefined,
    location: e.location ?? "",
    discipline,
    public: "",
    description: e.description ?? "",
    image: e.coverImage ?? "",
    capacity: undefined,
    featured: e.featured ?? false,
    category: e.category ?? undefined,
    organizer: e.organizer ?? "",
    tags: [],
    isRegistrationOpen: e.isRegistrationOpen ?? false,
    // Alias de compatibilité
    date: startDate,
    time: startTime,
  };
};

/** Applique les filtres côté client (le backend renvoie l'ensemble publié). */
const applyFilters = (events: Event[], filters: EventFilters): Event[] => {
  let result = [...events];

  if (filters.slug) {
    result = result.filter((e) => e.slug === filters.slug);
  }

  if (filters.featured) {
    result = result.filter((e) => e.featured);
  }

  if (filters.upcoming) {
    const today = new Date().toISOString().split("T")[0];
    result = result.filter((e) => (e.startDate || "").split("T")[0] >= today);
  }

  if (filters.month && filters.month !== "Tous") {
    const monthNumber = getMonthNumber(filters.month);
    if (monthNumber) {
      result = result.filter((e) => {
        const d = e.startDate ? new Date(e.startDate) : null;
        if (!d || Number.isNaN(d.getTime())) return false;
        return String(d.getMonth() + 1).padStart(2, "0") === monthNumber;
      });
    }
  }

  if (filters.discipline && filters.discipline !== "Tous") {
    result = result.filter((e) => e.discipline === filters.discipline);
  }

  if (filters.public && filters.public !== "Tous") {
    result = result.filter((e) => e.public === filters.public);
  }

  // Tri par date de début croissante.
  result.sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));

  if (filters.limit) {
    result = result.slice(0, filters.limit);
  }

  return result;
};

const fetchEvents = async (filters: EventFilters = {}): Promise<Event[]> => {
  try {
    const raw = await fetchAll<BackendEvent>("/events");
    return applyFilters(raw.map(mapEvent), filters);
  } catch {
    // Une API momentanément indisponible ne doit pas faire planter l'accueil.
    return [];
  }
};

/** Récupère tous les événements publiés. */
export const getEvents = async (): Promise<Event[]> => fetchEvents();

/** Récupère les événements mis en avant. */
export const getFeaturedEvents = async (): Promise<Event[]> =>
  fetchEvents({ featured: true });

/** Récupère les prochains événements (futurs uniquement). */
export const getUpcomingEvents = async (limit?: number): Promise<Event[]> =>
  fetchEvents({ upcoming: true, limit });

/** Récupère les événements les plus récents (date décroissante), passés inclus. */
export const getRecentEvents = async (limit = 6): Promise<Event[]> => {
  const all = await fetchEvents(); // trié par date croissante
  return all.reverse().slice(0, limit); // plus récents d'abord
};

/**
 * Prochains événements, avec repli : s'il n'y en a aucun à venir, renvoie les
 * plus récents pour éviter une section « agenda » vide sur l'accueil.
 */
export const getUpcomingOrRecentEvents = async (
  limit = 6
): Promise<Event[]> => {
  const upcoming = await getUpcomingEvents(limit);
  return upcoming.length > 0 ? upcoming : await getRecentEvents(limit);
};

/** Récupère les événements avec filtres personnalisés (agenda). */
export const getFilteredEvents = async (filters: {
  month: string;
  discipline: string;
  publicTarget: string;
}): Promise<Event[]> =>
  fetchEvents({
    month: filters.month,
    discipline: filters.discipline,
    public: filters.publicTarget,
  });

/** Récupère un événement par son slug (avec description via l'endpoint détail). */
export const getEventBySlug = async (slug: string): Promise<Event[] | []> => {
  try {
    const body = await fetchJson<{ data: BackendEvent }>(`/events/${slug}`);
    return body?.data ? [mapEvent(body.data)] : [];
  } catch {
    return [];
  }
};

/** Récupère les événements par discipline. */
export const getEventsByDiscipline = async (
  discipline: string
): Promise<Event[]> => fetchEvents({ discipline });

/** Récupère les événements par catégorie. */
export const getEventsByCategory = async (
  category: string
): Promise<Event[]> => fetchEvents({ discipline: category });

/**
 * Récupère les événements avec inscriptions (administration interne — inchangé).
 * S'appuie sur la route BFF /api/admin/events.
 */
export const getEventsWithRegistrations = async (): Promise<
  EventWithRegistrations[]
> => {
  try {
    const response = await fetch("/api/admin/events", {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        text || `Erreur API admin (${response.status} ${response.statusText})`
      );
    }

    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des événements avec inscriptions:",
      error
    );
    throw new Error(
      `Impossible de récupérer les événements avec inscriptions: ${
        error instanceof Error ? error.message : "Erreur inconnue"
      }`
    );
  }
};
