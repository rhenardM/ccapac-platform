"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  FilePlus2,
  Handshake,
  Loader2,
  MapPin,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { fetchAll } from "@/lib/content-api";
import {
  spaceRequestService,
  type BookedCalendarEvent,
} from "@/services/spaceRequestService";

type ReservationSlot = {
  date: string;
  spaceId: number;
};

type Space = {
  id: number;
  slug: string;
  name: string;
  description: string;
  capacity: string;
  image: string;
};

type AgendaEvent = {
  id?: number | string;
  slug?: string | null;
  title?: string | null;
  name?: string | null;
  category?: string | null;
  location?: string | null;
  coverImage?: string | null;
  image?: string | null;
  startsAt?: string | null;
  startDate?: string | null;
  eventDate?: string | null;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
};

type ProgrammeEvent = {
  id: number;
  title?: string | null;
  slogan?: string | null;
  author?: string | null;
  eventType?: "INTERNE" | "EXTERNE" | null;
  eventDate?: string | null;
  spaceId?: number | string | null;
  imageUrl?: string | null;
  image?:
    | {
        url?: string | null;
      }
    | string
    | null;
};

type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  spaceId: number | null;
  type:
    | "RESERVATION"
    | "AGENDA"
    | "INTERNE"
    | "EXTERNE";
  location?: string | null;
  category?: string | null;
  author?: string | null;
  image?: string | null;
  startTime?: string | null;
  endTime?: string | null;
};

const weekDays = [
  "Lun",
  "Mar",
  "Mer",
  "Jeu",
  "Ven",
  "Sam",
  "Dim",
];

const spaces: Space[] = [
  {
    id: 1,
    slug: "grand-theatre",
    name: "Grand théâtre",
    description:
      "Espace scénique modulable pour spectacles et grandes cérémonies.",
    capacity: "2 000 personnes",
    image: "/images/spaces/grand-theatre.jpg",
  },
  {
    id: 2,
    slug: "petit-theatre",
    name: "Petit théâtre",
    description:
      "Espace intimiste pour pièces de théâtre, projections et rencontres.",
    capacity: "800 personnes",
    image: "/images/spaces/petit-theatre.jpg",
  },
  {
    id: 3,
    slug: "salle-de-danse",
    name: "Salle de danse",
    description:
      "Espace avec miroirs et barres destiné aux répétitions et ateliers.",
    capacity: "50–60 personnes",
    image: "/images/spaces/salle-de-danse.jpg",
  },
  {
    id: 4,
    slug: "hall",
    name: "Hall",
    description:
      "Espace d’accueil polyvalent pour expositions et réceptions.",
    capacity: "1 000 personnes",
    image: "/images/spaces/hall.jpg",
  },
  {
    id: 5,
    slug: "atrium",
    name: "Atrium",
    description:
      "Espace de travail collaboratif et de rencontres professionnelles.",
    capacity: "200 personnes",
    image: "/images/spaces/atrium.jpg",
  },
  {
    id: 6,
    slug: "cafeteria",
    name: "Cafétéria",
    description:
      "Espace de restauration et de détente pour les participants.",
    capacity: "60 personnes",
    image: "/images/spaces/cafeteria.jpg",
  },
  {
    id: 7,
    slug: "salle-de-musique-1",
    name: "Salle de musique 1",
    description:
      "Studio d’enregistrement et de répétition musicale équipé.",
    capacity: "50 personnes",
    image:
      "/images/spaces/salle-de-musique-1.jpg",
  },
  {
    id: 8,
    slug: "salle-de-musique-2",
    name: "Salle de musique 2",
    description:
      "Studio d’enregistrement et de répétition musicale équipé.",
    capacity: "50 personnes",
    image:
      "/images/spaces/salle-de-musique-2.jpg",
  },
  {
    id: 9,
    slug: "parking",
    name: "Parking",
    description:
      "Parking sécurisé pour les visiteurs, artistes et organisateurs.",
    capacity: "3 000 véhicules",
    image: "/images/spaces/parking.jpg",
  },
  {
    id: 10,
    slug: "esplanade-principale",
    name: "Esplanade principale",
    description:
      "Grand espace extérieur destiné aux manifestations et rassemblements.",
    capacity: "3 000 personnes",
    image:
      "/images/spaces/esplanade-principale.jpg",
  },
  {
    id: 11,
    slug: "esplanade-secondaire-ina",
    name: "Esplanade secondaire / côté INA",
    description:
      "Espace extérieur secondaire situé du côté de l’INA.",
    capacity: "2 000 personnes",
    image:
      "/images/spaces/esplanade-cote-ina.jpg",
  },
  {
    id: 12,
    slug: "esplanade-secondaire-parking",
    name: "Esplanade secondaire / côté parking",
    description:
      "Espace extérieur secondaire situé du côté du parking.",
    capacity: "3 000 personnes",
    image:
      "/images/spaces/esplanade-cote-parking.jpg",
  },
];

function normalizeDate(
  value?: string | null
): string | null {
  if (!value) {
    return null;
  }

  const match = String(value).match(
    /^(\d{4})-(\d{2})-(\d{2})/
  );

  if (!match) {
    return null;
  }

  return `${match[1]}-${match[2]}-${match[3]}`;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function dateKey(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(date.getDate()).padStart(
    2,
    "0"
  );

  return `${year}-${month}-${day}`;
}

function parseLocalDate(value: string) {
  const [year, month, day] = value
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day,
    12,
    0,
    0
  );
}

function formatLongDate(value: string) {
  const date = parseLocalDate(value);

  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }

  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function findSpaceId(
  location?: string | null
): number | null {
  if (!location) {
    return null;
  }

  const normalizedLocation =
    normalizeText(location);

  const aliases: Record<number, string[]> = {
    1: ["grand theatre", "grand théâtre"],
    2: ["petit theatre", "petit théâtre"],
    3: ["salle de danse", "danse"],
    4: ["hall"],
    5: ["atrium"],
    6: ["cafeteria", "cafétéria"],
    7: ["salle de musique 1", "musique 1"],
    8: ["salle de musique 2", "musique 2"],
    9: ["parking"],
    10: ["esplanade principale"],
    11: [
      "esplanade secondaire cote ina",
      "esplanade cote ina",
      "cote ina",
    ],
    12: [
      "esplanade secondaire cote parking",
      "esplanade cote parking",
      "cote parking",
    ],
  };

  for (const space of spaces) {
    const names = [
      space.name,
      ...(aliases[space.id] || []),
    ];

    const matches = names.some((name) => {
      const normalizedName =
        normalizeText(name);

      return (
        normalizedLocation.includes(
          normalizedName
        ) ||
        normalizedName.includes(
          normalizedLocation
        )
      );
    });

    if (matches) {
      return space.id;
    }
  }

  return null;
}

function getSpaceName(
  spaceId: number | null
) {
  return (
    spaces.find(
      (space) => space.id === spaceId
    )?.name || "CCAPAC - Grand Tambour"
  );
}

function getBookedSpaceId(
  event: BookedCalendarEvent
): number | null {
  const compatibleEvent =
    event as BookedCalendarEvent & {
      space_id?: number | string | null;
      space?:
        | number
        | string
        | {
            id?: number | string | null;
          }
        | null;
    };

  const rawSpace =
    compatibleEvent.spaceId ??
    compatibleEvent.space_id ??
    compatibleEvent.space;

  const rawId =
    typeof rawSpace === "object" &&
    rawSpace !== null
      ? rawSpace.id
      : rawSpace;

  const id = Number(rawId);

  return Number.isInteger(id) && id > 0
    ? id
    : null;
}

function getProgrammeImage(
  programme: ProgrammeEvent
): string | null {
  if (programme.imageUrl) {
    return programme.imageUrl;
  }

  if (
    typeof programme.image === "object" &&
    programme.image
  ) {
    return programme.image.url || null;
  }

  if (typeof programme.image === "string") {
    try {
      const parsed = JSON.parse(
        programme.image
      ) as {
        url?: string;
      };

      return parsed.url || programme.image;
    } catch {
      return programme.image;
    }
  }

  return null;
}

function stableAgendaId(value: string) {
  let hash = 0;

  for (
    let index = 0;
    index < value.length;
    index += 1
  ) {
    hash =
      (hash * 31 + value.charCodeAt(index)) |
      0;
  }

  return `agenda-${Math.abs(hash)}`;
}

async function getAgendaEvents(): Promise<
  CalendarEvent[]
> {
  const response =
    await fetchAll<AgendaEvent>("/events");

  return response.flatMap(
    (
      event,
      index
    ): CalendarEvent[] => {
      const rawDate =
        event.startsAt ||
        event.startDate ||
        event.eventDate ||
        event.date;

      const date = normalizeDate(rawDate);

      if (!date) {
        console.warn(
          "Événement Symfony ignoré : date invalide",
          event
        );

        return [];
      }

      const identifier =
        event.slug ||
        String(event.id || index);

      return [
        {
          id: stableAgendaId(identifier),
          title:
            event.title ||
            event.name ||
            "Événement du Grand Tambour",
          date,
          spaceId: findSpaceId(
            event.location
          ),
          type: "AGENDA",
          location:
            event.location ||
            "CCAPAC - Grand Tambour",
          category:
            event.category || "Agenda public",
          image:
            event.coverImage ||
            event.image ||
            null,
          startTime: event.startTime || null,
          endTime: event.endTime || null,
        },
      ];
    }
  );
}

async function getProgrammeEvents(): Promise<
  CalendarEvent[]
> {
  const response = await api.get(
    "/programmes",
    {
      params: {
        published: "true",
      },
    }
  );

  const payload = response.data;

  const programmes: ProgrammeEvent[] =
    Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

  return programmes.flatMap(
    (
      programme
    ): CalendarEvent[] => {
      const date = normalizeDate(
        programme.eventDate
      );

      const spaceId = Number(
        programme.spaceId
      );

      if (
        !date ||
        !Number.isInteger(spaceId) ||
        spaceId <= 0
      ) {
        return [];
      }

      const type:
        | "INTERNE"
        | "EXTERNE" =
        programme.eventType === "EXTERNE"
          ? "EXTERNE"
          : "INTERNE";

      return [
        {
          id: `programme-${programme.id}`,
          title:
            programme.title ||
            programme.slogan ||
            "Programme culturel",
          date,
          spaceId,
          type,
          author: programme.author || null,
          image:
            getProgrammeImage(programme),
          location:
            getSpaceName(spaceId),
          category:
            type === "EXTERNE"
              ? "Événement externe"
              : "Programme interne",
        },
      ];
    }
  );
}

function normalizeReservations(
  reservations: BookedCalendarEvent[]
): CalendarEvent[] {
  return reservations.flatMap(
    (
      reservation
    ): CalendarEvent[] => {
      const date = normalizeDate(
        reservation.date
      );

      if (!date) {
        return [];
      }

      const spaceId =
        getBookedSpaceId(reservation);

      return [
        {
          id: `reservation-${reservation.id}-${date}-${spaceId}`,
          title:
            reservation.title ||
            reservation.reference ||
            "Réservation confirmée",
          date,
          spaceId,
          type: "RESERVATION",
          location:
            getSpaceName(spaceId),
          category:
            "Réservation confirmée",
        },
      ];
    }
  );
}

function mergeEvents(
  collections: CalendarEvent[][]
): CalendarEvent[] {
  const merged = new Map<
    string,
    CalendarEvent
  >();

  collections
    .flat()
    .forEach((event) => {
      const key = [
        event.date,
        normalizeText(event.title),
        event.spaceId ??
          normalizeText(
            event.location || ""
          ),
      ].join("|");

      const existing =
        merged.get(key);

      if (!existing) {
        merged.set(key, event);
        return;
      }

      merged.set(key, {
        ...existing,
        ...event,
        title:
          existing.title || event.title,
        location:
          existing.location ||
          event.location,
        image:
          existing.image || event.image,
        author:
          existing.author || event.author,
        category:
          existing.category ||
          event.category,
      });
    });

  return [...merged.values()];
}

function getEventBadge(
  event: CalendarEvent
) {
  if (event.type === "AGENDA") {
    return {
      label: "Agenda public",
      className:
        "bg-orange-100 text-orange-700",
    };
  }

  if (event.type === "INTERNE") {
    return {
      label: "Programme interne",
      className:
        "bg-purple-100 text-purple-700",
    };
  }

  if (event.type === "EXTERNE") {
    return {
      label: "Événement externe",
      className:
        "bg-blue-100 text-blue-700",
    };
  }

  return {
    label: "Réservation confirmée",
    className:
      "bg-emerald-100 text-emerald-700",
  };
}

export default function MemberHomePage() {
  const router = useRouter();

  const today = useMemo(() => {
    const current = new Date();

    return new Date(
      current.getFullYear(),
      current.getMonth(),
      current.getDate()
    );
  }, []);

  const [
    displayMonth,
    setDisplayMonth,
  ] = useState(
    () =>
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
  );

  const [events, setEvents] = useState<
    CalendarEvent[]
  >([]);

  const [
    selectedDate,
    setSelectedDate,
  ] = useState<string | null>(null);

  const [
    reservationSlots,
    setReservationSlots,
  ] = useState<ReservationSlot[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const loadCalendar = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const [
          reservationsResult,
          agendaResult,
          programmesResult,
        ] = await Promise.allSettled([
          spaceRequestService.getBookedCalendarEvents(),
          getAgendaEvents(),
          getProgrammeEvents(),
        ]);

        const reservationEvents =
          reservationsResult.status ===
          "fulfilled"
            ? normalizeReservations(
                reservationsResult.value
              )
            : [];

        const agendaEvents =
          agendaResult.status === "fulfilled"
            ? agendaResult.value
            : [];

        const programmeEvents =
          programmesResult.status ===
          "fulfilled"
            ? programmesResult.value
            : [];

        if (
          agendaResult.status ===
          "rejected"
        ) {
          console.error(
            "Erreur API Symfony :",
            agendaResult.reason
          );

          toast.warning(
            "L’agenda public est momentanément indisponible."
          );
        }

        if (
          programmesResult.status ===
          "rejected"
        ) {
          console.error(
            "Erreur programmes Node.js :",
            programmesResult.reason
          );
        }

        if (
          reservationsResult.status ===
          "rejected"
        ) {
          console.error(
            "Erreur réservations :",
            reservationsResult.reason
          );
        }

        setEvents(
          mergeEvents([
            agendaEvents,
            programmeEvents,
            reservationEvents,
          ])
        );

        if (
          reservationsResult.status ===
            "rejected" &&
          agendaResult.status ===
            "rejected" &&
          programmesResult.status ===
            "rejected"
        ) {
          toast.error(
            "Impossible de charger le calendrier."
          );
        }
      } catch (error) {
        console.error(
          "Erreur calendrier :",
          error
        );

        toast.error(
          "Impossible de charger le calendrier."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadCalendar();
  }, [loadCalendar]);

  const eventsByDate = useMemo(() => {
    const map = new Map<
      string,
      CalendarEvent[]
    >();

    events.forEach((event) => {
      const current =
        map.get(event.date) || [];

      current.push(event);
      map.set(event.date, current);
    });

    return map;
  }, [events]);

  const calendarCells = useMemo(() => {
    const year =
      displayMonth.getFullYear();

    const month =
      displayMonth.getMonth();

    const daysInMonth = new Date(
      year,
      month + 1,
      0
    ).getDate();

    const firstDay = new Date(
      year,
      month,
      1
    ).getDay();

    const emptyCells =
      (firstDay + 6) % 7;

    const cells: Array<Date | null> =
      Array.from(
        {
          length: emptyCells,
        },
        () => null
      );

    for (
      let day = 1;
      day <= daysInMonth;
      day += 1
    ) {
      cells.push(
        new Date(year, month, day)
      );
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [displayMonth]);

  const selectedEvents = useMemo(
    () =>
      selectedDate
        ? eventsByDate.get(
            selectedDate
          ) || []
        : [],
    [eventsByDate, selectedDate]
  );

  const occupiedSpaces = useMemo(
    () =>
      new Set(
        selectedEvents
          .map(
            (event) => event.spaceId
          )
          .filter(
            (
              spaceId
            ): spaceId is number =>
              spaceId !== null
          )
      ),
    [selectedEvents]
  );

  const monthTitle =
    displayMonth.toLocaleDateString(
      "fr-FR",
      {
        month: "long",
        year: "numeric",
      }
    );

  function isSlotSelected(
    date: string,
    spaceId: number
  ) {
    return reservationSlots.some(
      (slot) =>
        slot.date === date &&
        slot.spaceId === spaceId
    );
  }

  function toggleSlot(
    date: string,
    spaceId: number
  ) {
    setReservationSlots((current) => {
      const exists = current.some(
        (slot) =>
          slot.date === date &&
          slot.spaceId === spaceId
      );

      if (exists) {
        return current.filter(
          (slot) =>
            !(
              slot.date === date &&
              slot.spaceId === spaceId
            )
        );
      }

      return [
        ...current,
        {
          date,
          spaceId,
        },
      ];
    });
  }

  function continueReservation() {
    if (
      reservationSlots.length === 0
    ) {
      toast.error(
        "Sélectionnez au moins une date et un espace."
      );

      return;
    }

    const slots = encodeURIComponent(
      JSON.stringify(reservationSlots)
    );

    router.push(
      `/espace-membre/membre/nouvelle-demande?slots=${slots}`
    );
  }

  return (
    <div className="space-y-8 pb-28">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#39251D] px-6 py-8 text-white shadow-xl sm:px-9 lg:px-12">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#D1965B]/30 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#F4D7B7]">
              <Sparkles className="h-4 w-4" />
              Studio de réservation
            </div>

            <h1 className="mt-5 text-3xl font-black sm:text-4xl">
              Choisissez vos dates
              <span className="block text-[#E7B57F]">
                et vos espaces.
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
              Consultez le calendrier,
              choisissez une ou plusieurs
              dates, puis sélectionnez les
              espaces adaptés à votre événement
              pour commencer votre demande de
              réservation.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 px-6 py-4">
            <p className="text-2xl font-black">
              {reservationSlots.length}
            </p>

            <p className="text-xs text-white/60">
              Créneaux sélectionnés
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="overflow-hidden rounded-[2rem] border border-[#D1965B]/20 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-[#D1965B]/15 bg-[#FBF8F3] p-5 sm:flex-row sm:items-center sm:px-7">
            <h2 className="capitalize text-2xl font-black text-[#5C4033]">
              {monthTitle}
            </h2>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  setDisplayMonth(
                    (current) =>
                      new Date(
                        current.getFullYear(),
                        current.getMonth() -
                          1,
                        1
                      )
                  )
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDisplayMonth(
                    new Date(
                      today.getFullYear(),
                      today.getMonth(),
                      1
                    )
                  );

                  setSelectedDate(
                    dateKey(today)
                  );
                }}
              >
                Aujourd’hui
              </Button>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  setDisplayMonth(
                    (current) =>
                      new Date(
                        current.getFullYear(),
                        current.getMonth() +
                          1,
                        1
                      )
                  )
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={refreshing}
                onClick={() =>
                  void loadCalendar(false)
                }
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing
                      ? "animate-spin"
                      : ""
                  }`}
                />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[500px] items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#D1965B]" />

                <p className="mt-3 text-sm text-[#5C4033]/60">
                  Chargement du calendrier...
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 sm:p-6">
              <div className="grid grid-cols-7 pb-3">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="py-2 text-center text-xs font-black uppercase text-[#5C4033]/50"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {calendarCells.map(
                  (date, index) => {
                    if (!date) {
                      return (
                        <div
                          key={`empty-${index}`}
                          className="min-h-24 sm:min-h-40"
                        />
                      );
                    }

                    const key =
                      dateKey(date);

                    const dateEvents =
                      eventsByDate.get(
                        key
                      ) || [];

                    const eventToDisplay =
                      dateEvents.find(
                        (event) =>
                          event.type ===
                          "AGENDA"
                      ) ||
                      dateEvents.find(
                        (event) =>
                          event.type ===
                            "INTERNE" ||
                          event.type ===
                            "EXTERNE"
                      ) ||
                      dateEvents[0] ||
                      null;

                    const dateOccupiedSpaces =
                      new Set(
                        dateEvents
                          .map(
                            (event) =>
                              event.spaceId
                          )
                          .filter(
                            (
                              id
                            ): id is number =>
                              id !== null
                          )
                      );

                    const isPast =
                      date < today;

                    const isFull =
                      dateOccupiedSpaces.size >=
                      spaces.length;

                    const isPartial =
                      dateOccupiedSpaces.size >
                        0 && !isFull;

                    const isSelected =
                      selectedDate === key;

                    const selectedCount =
                      reservationSlots.filter(
                        (slot) =>
                          slot.date === key
                      ).length;

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          setSelectedDate(
                            key
                          )
                        }
                        className={`relative min-h-24 overflow-hidden rounded-2xl border p-2 text-left transition sm:min-h-40 sm:p-3 ${
                          isSelected
                            ? "border-[#5C4033] bg-[#FFF8F0] shadow-lg ring-2 ring-[#D1965B]/25"
                            : isPast
                              ? "border-slate-200 bg-slate-100 text-slate-400"
                              : isFull
                                ? "border-red-200 bg-red-50"
                                : isPartial
                                  ? "border-orange-300 bg-orange-50"
                                  : "border-emerald-200 bg-emerald-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${
                              key ===
                              dateKey(
                                today
                              )
                                ? "bg-[#D1965B] text-white"
                                : "text-[#5C4033]"
                            }`}
                          >
                            {date.getDate()}
                          </span>

                          {selectedCount >
                            0 && (
                            <span className="rounded-full bg-[#5C4033] px-2 py-1 text-[9px] font-bold text-white">
                              {
                                selectedCount
                              }
                            </span>
                          )}
                        </div>

                        <p
                          className={`mt-2 text-[10px] font-black sm:text-[11px] ${
                            isFull
                              ? "text-red-700"
                              : isPartial
                                ? "text-orange-700"
                                : "text-emerald-700"
                          }`}
                        >
                          {isFull
                            ? "Complet"
                            : isPartial
                              ? "Partielle"
                              : "Disponible"}
                        </p>

                        {eventToDisplay && (
                          <div className="mt-2 border-t border-[#5C4033]/10 pt-2">
                            <p className="line-clamp-2 text-[9px] font-black leading-4 text-[#5C4033] sm:text-[11px]">
                              {
                                eventToDisplay.title
                              }
                            </p>

                            <p className="mt-1 hidden line-clamp-1 text-[9px] text-[#5C4033]/60 sm:block">
                              {eventToDisplay.location ||
                                getSpaceName(
                                  eventToDisplay.spaceId
                                )}
                            </p>

                            {dateEvents.length >
                              1 && (
                              <p className="mt-1 text-[9px] font-black text-[#D1965B]">
                                +
                                {dateEvents.length -
                                  1}{" "}
                                autre(s)
                              </p>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <section className="rounded-[1.75rem] bg-[#39251D] p-6 text-white shadow-lg">
            {!selectedDate ? (
              <div className="py-8 text-center">
                <CalendarDays className="mx-auto h-12 w-12 text-[#E7B57F]" />

                <h2 className="mt-4 text-xl font-black">
                  Sélectionnez une date
                </h2>

                <p className="mt-2 text-sm text-white/60">
                  Les espaces disponibles
                  apparaîtront ici.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs font-black uppercase tracking-widest text-[#E7B57F]">
                  Date sélectionnée
                </p>

                <h2 className="mt-2 text-xl font-black capitalize">
                  {formatLongDate(
                    selectedDate
                  )}
                </h2>

                <div className="mt-6 max-h-[620px] space-y-3 overflow-y-auto pr-1">
                  {spaces.map((space) => {
                    const occupied =
                      occupiedSpaces.has(
                        space.id
                      );

                    const selected =
                      isSlotSelected(
                        selectedDate,
                        space.id
                      );

                    const selectedDateValue =
                      parseLocalDate(
                        selectedDate
                      );

                    const isPastDate =
                      selectedDateValue <
                      today;

                    return (
                      <button
                        key={space.id}
                        type="button"
                        disabled={
                          occupied ||
                          isPastDate
                        }
                        onClick={() =>
                          toggleSlot(
                            selectedDate,
                            space.id
                          )
                        }
                        className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
                          occupied ||
                          isPastDate
                            ? "cursor-not-allowed border-white/5 bg-white/5 opacity-40"
                            : selected
                              ? "border-[#E7B57F] bg-[#D1965B]"
                              : "border-white/10 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                          <Building2 className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold">
                            {space.name}
                          </p>

                          <p className="mt-1 text-xs text-white/50">
                            {
                              space.capacity
                            }
                          </p>

                          <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-white/45">
                            {
                              space.description
                            }
                          </p>
                        </div>

                        {occupied ||
                        isPastDate ? (
                          <CircleX className="mt-1 h-5 w-5 shrink-0 text-red-300" />
                        ) : selected ? (
                          <Check className="mt-1 h-5 w-5 shrink-0" />
                        ) : (
                          <CircleCheck className="mt-1 h-5 w-5 shrink-0 text-emerald-300" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </aside>
      </section>

      {selectedDate &&
        selectedEvents.length > 0 && (
          <section className="rounded-[2rem] border border-[#D1965B]/20 bg-white p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-widest text-[#D1965B]">
              Événements de la date
            </p>

            <h2 className="mt-2 text-2xl font-black capitalize text-[#5C4033]">
              {formatLongDate(
                selectedDate
              )}
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {selectedEvents.map(
                (event) => {
                  const badge =
                    getEventBadge(event);

                  return (
                    <article
                      key={event.id}
                      className="rounded-2xl border border-[#D1965B]/15 bg-[#FBF8F3] p-5"
                    >
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${badge.className}`}
                      >
                        {badge.label}
                      </span>

                      <h3 className="mt-4 text-lg font-black text-[#5C4033]">
                        {event.title}
                      </h3>

                      {event.author && (
                        <p className="mt-2 text-sm text-[#5C4033]/60">
                          Organisé par{" "}
                          {event.author}
                        </p>
                      )}

                      <div className="mt-4 flex items-start gap-2 text-sm font-semibold text-[#5C4033]/70">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#D1965B]" />

                        <span>
                          {event.location ||
                            getSpaceName(
                              event.spaceId
                            )}
                        </span>
                      </div>

                      {(event.startTime ||
                        event.endTime) && (
                        <p className="mt-3 text-xs text-[#5C4033]/50">
                          {event.startTime ||
                            ""}

                          {event.startTime &&
                          event.endTime
                            ? " – "
                            : ""}

                          {event.endTime ||
                            ""}
                        </p>
                      )}
                    </article>
                  );
                }
              )}
            </div>
          </section>
        )}

      {reservationSlots.length > 0 && (
        <section className="sticky bottom-4 z-30 rounded-[1.75rem] border border-[#D1965B]/25 bg-white/95 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#D1965B]">
                Votre sélection
              </p>

              <div className="mt-2 flex max-h-24 flex-wrap gap-2 overflow-y-auto">
                {reservationSlots.map(
                  (slot) => (
                    <button
                      key={`${slot.date}-${slot.spaceId}`}
                      type="button"
                      onClick={() =>
                        toggleSlot(
                          slot.date,
                          slot.spaceId
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-full bg-[#F3EEE5] px-3 py-2 text-xs font-bold text-[#5C4033]"
                    >
                      {formatLongDate(
                        slot.date
                      )}{" "}
                      ·{" "}
                      {getSpaceName(
                        slot.spaceId
                      )}
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setReservationSlots([])
                }
              >
                Effacer
              </Button>

              <Button
                type="button"
                onClick={
                  continueReservation
                }
                className="bg-[#D1965B] text-white hover:bg-[#B97D47]"
              >
                Continuer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      )}

      <section className="relative overflow-hidden rounded-[2rem] bg-[#D1965B] p-7 text-white sm:p-10">
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase">
            <FilePlus2 className="h-4 w-4" />
            Proposition culturelle
          </div>

          <h2 className="mt-5 text-3xl font-black">
            Vous souhaitez proposer un projet ?
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80">
            Partagez votre projet avec le
            CCAPAC – Grand Tambour, quel que
            soit votre domaine, votre profil
            ou le public auquel il s’adresse.
          </p>

          <Button
            asChild
            className="mt-6 bg-white text-[#5C4033] hover:bg-[#F3EEE5]"
          >
            <Link href="/espace-membre/membre/proposer-projet">
              Proposer un projet
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[2rem] border border-[#D1965B]/20 bg-[#F8F5EE] shadow-sm">
  <div className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-[#D1965B]/10 blur-3xl" />

  <div className="pointer-events-none absolute -bottom-20 right-1/4 h-48 w-48 rounded-full bg-[#FFC400]/10 blur-3xl" />

  <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:p-10">
    <div>
      <div className="inline-flex items-center gap-2 rounded-full bg-[#D1965B]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#B56F36]">
        <Handshake className="h-4 w-4" />
        Nos partenaires
      </div>

      <h2 className="mt-5 text-3xl font-black leading-tight text-[#5C4033] sm:text-4xl">
        Ils nous accompagnent
      </h2>

      <p className="mt-4 max-w-xl text-sm leading-7 text-[#5C4033]/65 sm:text-base">
        Des partenariats stratégiques qui enrichissent notre vision culturelle
        et contribuent au rayonnement de nos projets.
      </p>

      <Button
        asChild
        className="mt-6 h-11 rounded-xl bg-[#FFC400] px-6 font-black text-[#3F2B22] shadow-md shadow-[#D1965B]/10 hover:bg-[#F2BA00]"
      >
        <Link href="">
          <Handshake className="mr-2 h-5 w-5" />
          Devenir partenaire
        </Link>
      </Button>
    </div>

    <div className="grid gap-4 sm:grid-cols-2">
      <article className="flex min-h-44 items-center justify-center rounded-3xl border border-[#D1965B]/10 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div
          className="relative h-24 w-24 shrink-0 bg-[#FF7900]"
          aria-label="Orange"
          role="img"
        >
          <span className="absolute bottom-2 left-2 text-[23px] font-bold leading-none tracking-[-0.06em] text-white">
            orange
            <sup className="ml-0.5 align-top text-[7px] font-medium tracking-normal">
              TM
            </sup>
          </span>
        </div>
      </article>

      <article className="flex min-h-44 items-center justify-center rounded-3xl border border-[#D1965B]/10 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
        <Image
          src="/images/partners/adn.png"
          alt="Agence pour le Développement du Numérique"
          width={2928}
          height={1063}
          className="h-auto w-full max-w-[210px] object-contain"
        />
      </article>
    </div>
  </div>
</section>
    </div>
  );
}