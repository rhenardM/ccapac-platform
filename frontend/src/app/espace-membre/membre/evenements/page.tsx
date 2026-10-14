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

  Building2,

  CalendarCheck2,

  ChevronLeft,

  ChevronRight,

  CircleCheck,

  CircleX,

  Clock3,

  Loader2,

  MapPin,

  RefreshCw,

  Users,

} from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { useAuth } from "@/context/AuthContext";

import api from "@/lib/api";

import { fetchAll } from "@/lib/content-api";

import {

  spaceRequestService,

  type BookedCalendarEvent,

} from "@/services/spaceRequestService";

import { CCAPAC_SPACES } from "../../../../constants/spaces";

const weekDays = [

  "Lun",

  "Mar",

  "Mer",

  "Jeu",

  "Ven",

  "Sam",

  "Dim",

];

const spaces = CCAPAC_SPACES;

type CompatibleCalendarEvent =

  BookedCalendarEvent & {

    space_id?: number | string | null;

    space?:

      | number

      | string

      | {

          id?: number | string | null;

        }

      | null;

  };

type ReservationSlot = {
  date: string;
  spaceId: number;
};

interface AgendaEvent {

  slug: string;

  title: string;

  category?: string | null;

  location?: string | null;

  coverImage?: string | null;

  startsAt?: string | null;

  startTime?: string | null;

  endTime?: string | null;

}

interface NodeProgrammeEvent {

  id: number;

  title?: string | null;

  slogan?: string | null;

  author?: string | null;

  eventType?: "INTERNE" | "EXTERNE" | null;

  eventDate?: string | null;

  spaceId?: number | string | null;

  publicationStatus?:

    | "DRAFT"

    | "PUBLISHED"

    | null;

  imageUrl?: string | null;

  image?:

    | {

        url?: string | null;

      }

    | string

    | null;

}

interface CalendarEvent

  extends BookedCalendarEvent {

  source:

    | "reservation"

    | "agenda"

    | "programme";

  slug?: string;

  category?: string | null;

  location?: string | null;

  image?: string | null;

  startTime?: string | null;

  endTime?: string | null;

  author?: string | null;

  eventType?: "INTERNE" | "EXTERNE" | null;

}

function getEventSpaceId(

  event: BookedCalendarEvent

): number | null {

  const compatibleEvent =

    event as CompatibleCalendarEvent;

  const rawSpace =

    compatibleEvent.spaceId ??

    compatibleEvent.space_id ??

    compatibleEvent.space;

  const rawId =

    typeof rawSpace === "object" &&

    rawSpace !== null

      ? rawSpace.id

      : rawSpace;

  if (

    rawId === null ||

    rawId === undefined ||

    rawId === ""

  ) {

    return null;

  }

  const normalizedId = Number(rawId);

  return Number.isInteger(normalizedId) &&

    normalizedId > 0

    ? normalizedId

    : null;

}

function normalizeText(value: string) {

  return value

    .normalize("NFD")

    .replace(/[\u0300-\u036f]/g, "")

    .toLowerCase()

    .replace(/[^a-z0-9]+/g, " ")

    .trim();

}

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

function findSpaceId(

  location?: string | null

): number | null {

  if (!location) {

    return null;

  }

  const normalizedLocation =

    normalizeText(location);

  const matchingSpace = spaces.find(

    (space) => {

      const normalizedName = normalizeText(

        space.name

      );

      return (

        normalizedLocation.includes(

          normalizedName

        ) ||

        normalizedName.includes(

          normalizedLocation

        )

      );

    }

  );

  return matchingSpace?.id ?? null;

}

function getSpaceName(

  spaceId?: number | string | null

) {

  if (

    spaceId === null ||

    spaceId === undefined

  ) {

    return "CCAPAC - Grand Tambour";

  }

  const normalizedId = Number(spaceId);

  return (

    spaces.find(

      (space) =>

        Number(space.id) === normalizedId

    )?.name ||

    "CCAPAC - Grand Tambour"

  );

}

function stableAgendaId(slug: string) {

  let hash = 0;

  for (

    let index = 0;

    index < slug.length;

    index += 1

  ) {

    hash =

      (hash * 31 +

        slug.charCodeAt(index)) |

      0;

  }

  return -(Math.abs(hash) + 1);

}

function getProgrammeImage(

  programme: NodeProgrammeEvent

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

async function getAgendaCalendarEvents(): Promise<

  CalendarEvent[]

> {

  const agendaEvents =

    await fetchAll<AgendaEvent>("/events");

  return agendaEvents

    .filter(

      (

        event

      ): event is AgendaEvent & {

        startsAt: string;

      } =>

        typeof event.startsAt === "string" &&

        event.startsAt.trim().length > 0

    )

    .map((event) => ({

      id: stableAgendaId(event.slug),

      reference: `AGENDA:${event.slug}`,

      title: event.title,

      date: event.startsAt,

      spaceId: findSpaceId(event.location),

      source: "agenda" as const,

      slug: event.slug,

      category: event.category,

      location: event.location,

      image: event.coverImage,

      startTime: event.startTime,

      endTime: event.endTime,

    }));

}

async function getCreatedProgrammeEvents(): Promise<

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

  const programmes: NodeProgrammeEvent[] =

    Array.isArray(payload)

      ? payload

      : Array.isArray(payload?.data)

        ? payload.data

        : [];

  return programmes

    .filter((programme) => {

      const eventDate = normalizeDate(

        programme.eventDate

      );

      const spaceId = Number(

        programme.spaceId

      );

      return (

        Boolean(eventDate) &&

        Number.isInteger(spaceId) &&

        spaceId > 0

      );

    })

    .map((programme) => {

      const eventDate = normalizeDate(

        programme.eventDate

      ) as string;

      const spaceId = Number(

        programme.spaceId

      );

      const eventType =

        programme.eventType === "EXTERNE"

          ? "EXTERNE"

          : "INTERNE";

      return {

        id:

          1_000_000 +

          Number(programme.id),

        reference: `PROGRAMME:${programme.id}`,

        title:

          programme.title ||

          programme.slogan ||

          "Événement",

        /*

         * La date reste au format YYYY-MM-DD.

         * Cela empêche le décalage d’un jour

         * provoqué par une conversion UTC.

         */

        date: eventDate,

        spaceId,

        source: "programme" as const,

        category:

          eventType === "EXTERNE"

            ? "Événement externe"

            : "Programme interne",

        location:

          getSpaceName(spaceId),

        image:

          getProgrammeImage(programme),

        author:

          programme.author || null,

        eventType,

        startTime: null,

        endTime: null,

      };

    });

}

function mergeCalendarEvents(

  bookedEvents: BookedCalendarEvent[],

  agendaEvents: CalendarEvent[],

  programmeEvents: CalendarEvent[]

): CalendarEvent[] {

  const merged = new Map<

    string,

    CalendarEvent

  >();

  const reservationEvents: CalendarEvent[] =

    bookedEvents.map((event) => ({

      ...event,

      source: "reservation",

    }));

  for (const event of [

    ...agendaEvents,

    ...programmeEvents,

    ...reservationEvents,

  ]) {

    const eventDate = normalizeDate(

      event.date

    );

    if (!eventDate) {

      continue;

    }

    const key = [

      eventDate,

      normalizeText(event.title),

      getEventSpaceId(event) ?? "unknown",

    ].join("|");

    const existing = merged.get(key);

    if (!existing) {

      merged.set(key, event);

      continue;

    }

    /*

     * Évite d’afficher deux fois le même

     * événement lorsqu’une réservation,

     * un programme Node.js et un événement

     * Symfony correspondent.

     */

    merged.set(key, {

      ...existing,

      ...event,

      slug:

        existing.slug ||

        event.slug,

      category:

        existing.category ||

        event.category,

      location:

        existing.location ||

        event.location,

      image:

        existing.image ||

        event.image,

      startTime:

        existing.startTime ||

        event.startTime,

      endTime:

        existing.endTime ||

        event.endTime,

      author:

        existing.author ||

        event.author,

      eventType:

        existing.eventType ||

        event.eventType,

    });

  }

  return [...merged.values()];

}

function dateKey(date: Date) {

  const year = date.getFullYear();

  const month = String(

    date.getMonth() + 1

  ).padStart(2, "0");

  const day = String(

    date.getDate()

  ).padStart(2, "0");

  return `${year}-${month}-${day}`;

}

function parseDate(value: string) {

  const normalizedValue =

    normalizeDate(value);

  if (!normalizedValue) {

    return new Date(Number.NaN);

  }

  const [year, month, day] =

    normalizedValue

      .split("-")

      .map(Number);

  return new Date(

    year,

    month - 1,

    day

  );

}

function formatDateLong(value: string) {
  return parseDate(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatLongDate(value: string) {

  const date = parseDate(value);

  if (Number.isNaN(date.getTime())) {

    return "Date inconnue";

  }

  return date.toLocaleDateString(

    "fr-FR",

    {

      weekday: "long",

      day: "2-digit",

      month: "long",

      year: "numeric",

    }

  );

}

function formatTimePeriod(

  startTime?: string | null,

  endTime?: string | null

) {

  if (!startTime) {

    return "Horaire à confirmer";

  }

  return endTime

    ? `${startTime} – ${endTime}`

    : startTime;

}

function getEventLabel(

  event: CalendarEvent

) {

  if (event.source === "programme") {

    return event.eventType === "EXTERNE"

      ? "Événement externe"

      : "Programme interne";

  }

  if (event.source === "agenda") {

    return (

      event.category ||

      "Agenda public"

    );

  }

  return "Réservation confirmée";

}

function getEventBadgeClass(

  event: CalendarEvent

) {

  if (event.source === "programme") {

    return event.eventType === "EXTERNE"

      ? "bg-blue-600"

      : "bg-emerald-600";

  }

  if (event.source === "agenda") {

    return "bg-[#D1965B]";

  }

  return "bg-[#5C4033]";

}

export default function MemberEventsCalendarPage() {

  const { user } = useAuth();
  const router = useRouter();

  const today = useMemo(() => {

    const value = new Date();

    value.setHours(0, 0, 0, 0);

    return value;

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

  const [loading, setLoading] =

    useState(true);

  const [refreshing, setRefreshing] =

    useState(false);

  const [reservationSlots, setReservationSlots] = useState<
    ReservationSlot[]
  >([]);

  const loadEvents = useCallback(

    async (showInitialLoader = true) => {

      try {

        if (showInitialLoader) {

          setLoading(true);

        } else {

          setRefreshing(true);

        }

        const [

          bookedResult,

          agendaResult,

          programmeResult,

        ] = await Promise.allSettled([

          spaceRequestService.getBookedCalendarEvents(),

          getAgendaCalendarEvents(),

          getCreatedProgrammeEvents(),

        ]);

        const bookedEvents =

          bookedResult.status === "fulfilled"

            ? bookedResult.value

            : [];

        const agendaEvents =

          agendaResult.status === "fulfilled"

            ? agendaResult.value

            : [];

        const programmeEvents =

          programmeResult.status ===

          "fulfilled"

            ? programmeResult.value

            : [];

        if (

          bookedResult.status === "rejected" &&

          agendaResult.status === "rejected" &&

          programmeResult.status === "rejected"

        ) {

          throw bookedResult.reason;

        }

        if (

          bookedResult.status === "rejected"

        ) {

          console.error(

            "Reservation calendar error:",

            bookedResult.reason

          );

          toast.warning(

            "Les événements sont affichés, mais les réservations confirmées sont momentanément indisponibles."

          );

        }

        if (

          agendaResult.status === "rejected"

        ) {

          console.error(

            "Agenda calendar error:",

            agendaResult.reason

          );

          toast.warning(

            "Les réservations sont affichées, mais l’Agenda public est momentanément indisponible."

          );

        }

        if (

          programmeResult.status ===

          "rejected"

        ) {

          console.error(

            "Node programmes calendar error:",

            programmeResult.reason

          );

          toast.warning(

            "Le calendrier est affiché, mais les programmes du département sont momentanément indisponibles."

          );

        }

        setEvents(

          mergeCalendarEvents(

            bookedEvents,

            agendaEvents,

            programmeEvents

          )

        );

      } catch (error) {

        console.error(

          "Member calendar error:",

          error

        );

        toast.error(

          "Impossible de charger les dates occupées."

        );

        setEvents([]);

      } finally {

        setLoading(false);

        setRefreshing(false);

      }

    },

    []

  );

  useEffect(() => {

    void loadEvents();

  }, [loadEvents]);

  const eventsByDate = useMemo(() => {

    const map = new Map<

      string,

      CalendarEvent[]

    >();

    events.forEach((event) => {

      const key = normalizeDate(

        event.date

      );

      if (!key) {

        return;

      }

      const current =

        map.get(key) || [];

      current.push(event);

      map.set(key, current);

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

    const leadingEmptyCells =

      (new Date(

        year,

        month,

        1

      ).getDay() +

        6) %

      7;

    const cells: Array<Date | null> =

      Array.from(

        {

          length: leadingEmptyCells,

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

  const selectedOccupiedSpaceIds =

    useMemo(

      () =>

        new Set(

          selectedEvents

            .map(getEventSpaceId)

            .filter(

              (

                spaceId

              ): spaceId is number =>

                spaceId !== null

            )

        ),

      [selectedEvents]

    );

  const selectedAvailableSpaces =

    useMemo(

      () =>

        spaces.filter(

          (space) =>

            !selectedOccupiedSpaceIds.has(

              Number(space.id)

            )

        ),

      [selectedOccupiedSpaceIds]

    );

  const selectedDateIsFull =

    selectedOccupiedSpaceIds.size >=

    spaces.length;

  const selectedIsPast = selectedDate

    ? parseDate(selectedDate) < today

    : false;

  const monthTitle =

    displayMonth.toLocaleDateString(

      "fr-FR",

      {

        month: "long",

        year: "numeric",

      }

    );

  const changeMonth = (

    offset: number

  ) => {

    setDisplayMonth(

      (current) =>

        new Date(

          current.getFullYear(),

          current.getMonth() + offset,

          1

        )

    );

    setSelectedDate(null);

  };

  const isSlotSelected = (date: string, spaceId: number) =>
    reservationSlots.some(
      (slot) => slot.date === date && slot.spaceId === spaceId
    );

  const toggleReservationSlot = (date: string, spaceId: number) => {
    setReservationSlots((current) => {
      const alreadySelected = current.some(
        (slot) => slot.date === date && slot.spaceId === spaceId
      );

      if (alreadySelected) {
        return current.filter(
          (slot) => !(slot.date === date && slot.spaceId === spaceId)
        );
      }

      if (current.length >= 30) {
        toast.error("Vous pouvez sélectionner au maximum 30 créneaux.");
        return current;
      }

      return [...current, { date, spaceId }].sort((left, right) =>
        left.date.localeCompare(right.date) || left.spaceId - right.spaceId
      );
    });
  };

  const startReservation = () => {
    if (reservationSlots.length === 0) {
      toast.error("Sélectionnez au moins une date et un espace.");
      return;
    }

    sessionStorage.setItem(
      "ccapac-reservation-slots",
      JSON.stringify(reservationSlots)
    );

    const firstSlot = reservationSlots[0];
    router.push(
      `/espace-membre/membre/nouvelle-demande?multiple=1&date=${firstSlot.date}&space=${firstSlot.spaceId}`
    );
  };

  return (

    <div className="space-y-6 text-[#5C4033]">

      <section className="rounded-2xl bg-[#D1965B] p-6 text-white shadow-sm sm:p-8">

        <div className="flex items-start gap-4">

          <div className="rounded-xl bg-white/15 p-3">

            <CalendarCheck2 className="h-7 w-7" />

          </div>

          <div>

            <p className="text-sm font-semibold uppercase tracking-wider text-white/75">

              Disponibilité des espaces

            </p>

            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">

              Calendrier des événements

            </h1>

            <p className="mt-2 max-w-3xl text-white/90">

              Consultez les dates déjà

              confirmées avant d’introduire

              une nouvelle demande

              d’occupation.

            </p>

          </div>

        </div>

      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">

        <section className="overflow-hidden rounded-2xl border border-[#D1965B]/15 bg-white shadow-sm">

          <div className="flex flex-col gap-4 border-b border-[#D1965B]/15 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">

            <div className="flex items-center gap-2">

              <Button

                type="button"

                variant="outline"

                size="icon"

                onClick={() =>

                  changeMonth(-1)

                }

                className="border-[#D1965B]/30"

                aria-label="Mois précédent"

              >

                <ChevronLeft className="h-4 w-4" />

              </Button>

              <h2 className="min-w-48 text-center text-xl font-bold capitalize">

                {monthTitle}

              </h2>

              <Button

                type="button"

                variant="outline"

                size="icon"

                onClick={() =>

                  changeMonth(1)

                }

                className="border-[#D1965B]/30"

                aria-label="Mois suivant"

              >

                <ChevronRight className="h-4 w-4" />

              </Button>

            </div>

            <div className="flex gap-2">

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

                className="border-[#D1965B]/30"

              >

                Aujourd’hui

              </Button>

              <Button

                type="button"

                variant="outline"

                size="icon"

                disabled={refreshing}

                onClick={() =>

                  void loadEvents(false)

                }

                className="border-[#D1965B]/30"

                aria-label="Actualiser"

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

                <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#D1965B]" />

                <p className="mt-3 text-sm text-[#5C4033]/60">

                  Chargement du

                  calendrier...

                </p>

              </div>

            </div>

          ) : (

            <div className="p-3 sm:p-6">

              <div className="grid grid-cols-7 border-b border-[#D1965B]/15 pb-2">

                {weekDays.map(

                  (day, index) => (

                    <div

                      key={day}

                      className={`py-2 text-center text-xs font-bold uppercase tracking-wide ${

                        index === 6

                          ? "text-red-500"

                          : "text-[#5C4033]/55"

                      }`}

                    >

                      {day}

                    </div>

                  )

                )}

              </div>

              <div className="mt-2 grid grid-cols-7 gap-1.5 sm:gap-2">

                {calendarCells.map(

                  (date, index) => {

                    if (!date) {

                      return (

                        <div

                          key={`empty-${index}`}

                          className="min-h-16 sm:min-h-24"

                        />

                      );

                    }

                    const key =

                      dateKey(date);

                    const dateEvents =

                      eventsByDate.get(

                        key

                      ) || [];

                    const isBooked =

                      dateEvents.length > 0;

                    const occupiedSpaceIds =

                      new Set(

                        dateEvents

                          .map(

                            getEventSpaceId

                          )

                          .filter(

                            (

                              spaceId

                            ): spaceId is number =>

                              spaceId !==

                              null

                          )

                      );

                    const isFull =

                      occupiedSpaceIds.size >=

                      spaces.length;

                    const isPast =

                      date < today;

                    const isToday =

                      key ===

                      dateKey(today);

                    const isSelected =

                      selectedDate === key;

                    return (

                      <button

                        key={key}

                        type="button"

                        disabled={isPast}

                        onClick={() =>

                          setSelectedDate(

                            key

                          )

                        }

                        className={`relative min-h-16 rounded-xl border p-1.5 text-left transition sm:min-h-24 sm:p-3 ${

                          isPast

                            ? "cursor-not-allowed border-transparent bg-gray-100 text-gray-400"

                            : isSelected

                              ? "border-[#5C4033] ring-2 ring-[#D1965B]/25"

                              : isFull

                                ? "border-red-300 bg-red-100 hover:border-red-400"

                                : isBooked

                                  ? "border-orange-300 bg-orange-50 hover:border-orange-400"

                                  : "border-emerald-100 bg-emerald-50/60 hover:border-emerald-300 hover:bg-emerald-50"

                        }`}

                      >

                        <span

                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${

                            isToday

                              ? "bg-[#D1965B] text-white"

                              : ""

                          }`}

                        >

                          {date.getDate()}

                        </span>

                        {!isPast && (

                          <span

                            className={`mt-1 hidden text-[11px] font-semibold sm:block ${

                              isFull

                                ? "text-red-700"

                                : isBooked

                                  ? "text-orange-700"

                                  : "text-emerald-700"

                            }`}

                          >

                            {isFull

                              ? "Complet"

                              : isBooked

                                ? "Partielle"

                                : "Disponible"}

                          </span>

                        )}

                        {isBooked &&

                          !isPast && (

                            <span

                              className={`absolute bottom-2 right-2 h-2.5 w-2.5 rounded-full ${

                                isFull

                                  ? "bg-red-500"

                                  : "bg-orange-500"

                              }`}

                            />

                          )}

                      </button>

                    );

                  }

                )}

              </div>

            </div>

          )}

        </section>

        <aside className="space-y-5">

          <section className="rounded-2xl border border-[#D1965B]/15 bg-white p-5 shadow-sm">

            <h2 className="font-bold">

              Légende

            </h2>

            <div className="mt-4 space-y-3 text-sm">

              <div className="flex items-center gap-3">

                <span className="h-4 w-4 rounded bg-emerald-100 ring-1 ring-emerald-300" />

                Date disponible

              </div>

              <div className="flex items-center gap-3">

                <span className="h-4 w-4 rounded bg-orange-100 ring-1 ring-orange-300" />

                Certains espaces sont occupés

              </div>

              <div className="flex items-center gap-3">

                <span className="h-4 w-4 rounded bg-red-100 ring-1 ring-red-300" />

                Tous les espaces sont occupés

              </div>

              <div className="flex items-center gap-3">

                <span className="h-4 w-4 rounded bg-gray-100 ring-1 ring-gray-200" />

                Date passée

              </div>

            </div>

          </section>

          <section className="rounded-2xl border border-[#D1965B]/15 bg-white p-5 shadow-sm">

            {!selectedDate ? (

              <div className="py-5 text-center">

                <CalendarCheck2 className="mx-auto h-10 w-10 text-[#D1965B]/45" />

                <h2 className="mt-3 font-bold">

                  Sélectionnez une date

                </h2>

                <p className="mt-1 text-sm text-[#5C4033]/60">

                  Cliquez sur une date du

                  calendrier pour vérifier

                  sa disponibilité.

                </p>

              </div>

            ) : selectedIsPast ? (

              <div>

                <CircleX className="h-9 w-9 text-gray-400" />

                <h2 className="mt-3 font-bold">

                  Date passée

                </h2>

              </div>

            ) : (

              <div>

                {selectedDateIsFull ? (

                  <CircleX className="h-9 w-9 text-red-500" />

                ) : (

                  <CircleCheck

                    className={`h-9 w-9 ${

                      selectedEvents.length >

                      0

                        ? "text-orange-500"

                        : "text-emerald-600"

                    }`}

                  />

                )}

                <p

                  className={`mt-3 text-xs font-bold uppercase tracking-wide ${

                    selectedDateIsFull

                      ? "text-red-600"

                      : selectedEvents.length >

                          0

                        ? "text-orange-600"

                        : "text-emerald-700"

                  }`}

                >

                  {selectedDateIsFull

                    ? "Date complète"

                    : selectedEvents.length >

                        0

                      ? "Disponibilité partielle"

                      : "Date disponible"}

                </p>

                <h2 className="mt-1 font-bold capitalize">

                  {formatLongDate(

                    selectedDate

                  )}

                </h2>

                <p className="mt-3 text-sm leading-6 text-[#5C4033]/65">

                  {selectedDateIsFull

                    ? "Tous les espaces sont occupés par des événements confirmés."

                    : selectedEvents.length >

                        0

                      ? `${selectedOccupiedSpaceIds.size} espace(s) occupé(s) et ${selectedAvailableSpaces.length} espace(s) encore disponible(s).`

                      : "Aucune occupation confirmée n’est enregistrée pour cette date."}

                </p>

                {selectedEvents.length >

                  0 && (

                  <div className="mt-5 border-t border-[#D1965B]/15 pt-5">

                    <h3 className="font-bold">

                      Événements programmés

                    </h3>

                    <div className="mt-3 space-y-2">

                      {selectedEvents.map(

                        (event) => {

                          const occupiedSpace =

                            spaces.find(

                              (

                                space

                              ) =>

                                Number(

                                  space.id

                                ) ===

                                getEventSpaceId(

                                  event

                                )

                            );

                          return (

                            <div

                              key={

                                event.id

                              }

                              className="rounded-xl border border-orange-100 bg-orange-50 p-3"

                            >

                              <p className="text-sm font-semibold">

                                {

                                  event.title

                                }

                              </p>

                              <p className="mt-1 text-xs text-[#5C4033]/65">

                                {occupiedSpace?.name ||

                                  event.location ||

                                  "Espace non renseigné"}

                                {" · "}

                                {getEventLabel(

                                  event

                                )}

                              </p>

                            </div>

                          );

                        }

                      )}

                    </div>

                  </div>

                )}

                {!selectedDateIsFull && (

                  <div className="mt-6 border-t border-[#D1965B]/15 pt-5">

                    <div className="flex items-center gap-2">

                      <Building2 className="h-5 w-5 text-[#D1965B]" />

                      <h3 className="font-bold">

                        Espaces disponibles

                      </h3>

                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">

                      {selectedAvailableSpaces.map(

                        (space) => (

                          <article

                            key={

                              space.id

                            }

                            className="flex min-w-0 flex-col rounded-xl border border-[#D1965B]/15 bg-[#FBF9F5] p-3"

                          >

                            <h4 className="truncate text-sm font-bold text-[#5C4033]">

                              {

                                space.name

                              }

                            </h4>

                            <p

                              className="mt-1 line-clamp-2 text-xs leading-5 text-[#5C4033]/65"

                              title={

                                space.description

                              }

                            >

                              {

                                space.description

                              }

                            </p>

                            <div className="mt-3 flex items-center justify-between gap-2">

                              <span className="flex items-center gap-1 text-xs text-[#5C4033]/65">

                                <Users className="h-3.5 w-3.5" />

                                {

                                  space.capacityLabel

                                }

                              </span>

                              {user?.role ===

                              "MEMBER" ? (

                                <button
                                  type="button"
                                  onClick={() =>
                                    selectedDate &&
                                    toggleReservationSlot(
                                      selectedDate,
                                      Number(space.id)
                                    )
                                  }
                                  className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                                    selectedDate &&
                                    isSlotSelected(
                                      selectedDate,
                                      Number(space.id)
                                    )
                                      ? "border-[#D1965B] bg-[#D1965B] text-white"
                                      : "border-[#D1965B]/30 bg-white text-[#D1965B] hover:bg-[#D1965B] hover:text-white"
                                  }`}
                                >
                                  {selectedDate &&
                                  isSlotSelected(
                                    selectedDate,
                                    Number(space.id)
                                  )
                                    ? "Sélectionné"
                                    : "Choisir"}
                                </button>

                              ) : (

                                <span className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700">

                                  Disponible

                                </span>

                              )}

                            </div>

                          </article>

                        )

                      )}

                    </div>

                  </div>

                )}

              </div>

            )}

          </section>

        </aside>

      </div>

      {user?.role === "MEMBER" && reservationSlots.length > 0 && (
        <section className="rounded-3xl border border-[#D1965B]/25 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D1965B]">
                Demande multi-dates
              </p>
              <h2 className="mt-1 text-xl font-black text-[#5C4033]">
                {reservationSlots.length} créneau
                {reservationSlots.length > 1 ? "x" : ""} sélectionné
                {reservationSlots.length > 1 ? "s" : ""}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {reservationSlots.map((slot) => {
                  const selectedSpace = spaces.find(
                    (space) => Number(space.id) === slot.spaceId
                  );

                  return (
                    <button
                      key={`${slot.date}-${slot.spaceId}`}
                      type="button"
                      onClick={() =>
                        toggleReservationSlot(slot.date, slot.spaceId)
                      }
                      className="inline-flex items-center gap-2 rounded-full bg-[#F3EEE5] px-3 py-1.5 text-xs font-semibold text-[#5C4033] transition hover:bg-red-50 hover:text-red-700"
                      title="Retirer ce créneau"
                    >
                      {formatDateLong(slot.date)} · {selectedSpace?.name || `Espace ${slot.spaceId}`}
                      <CircleX className="h-3.5 w-3.5" />
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              type="button"
              onClick={startReservation}
              className="shrink-0 bg-[#D1965B] text-white hover:bg-[#B97D47]"
            >
              Commencer la demande
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>
      )}

      {selectedDate &&

        !selectedIsPast &&

        selectedEvents.length > 0 && (

          <section className="overflow-hidden rounded-3xl border border-[#D1965B]/20 bg-white shadow-sm">

            <div className="border-b border-[#D1965B]/15 bg-[#F8F5EF] px-5 py-5 sm:px-7 sm:py-6">

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#D1965B]">

                    Programme de la date

                    sélectionnée

                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-[#5C4033] sm:text-3xl">

                    Événements programmés

                  </h2>

                </div>

                <p className="w-fit rounded-full border border-[#D1965B]/20 bg-white px-4 py-2 text-sm font-semibold capitalize text-[#5C4033]">

                  {formatLongDate(

                    selectedDate

                  )}

                </p>

              </div>

            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-3">

              {selectedEvents.map(

                (event) => {

                  const occupiedSpace =

                    spaces.find(

                      (space) =>

                        Number(

                          space.id

                        ) ===

                        getEventSpaceId(

                          event

                        )

                    );

                  const location =

                    event.location ||

                    occupiedSpace?.name ||

                    "CCAPAC - Grand Tambour";

                  const card = (

                    <article className="group h-full min-w-0 overflow-hidden rounded-xl border border-[#D1965B]/20 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#D1965B]/50 hover:shadow-lg">

                      <div className="relative aspect-[16/9] overflow-hidden bg-[#F3EEE5]">

                        {event.image ? (

                          <Image

                            src={

                              event.image

                            }

                            alt={

                              event.title

                            }

                            fill

                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"

                            className="object-cover object-center transition duration-500 group-hover:scale-105"

                          />

                        ) : (

                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#F3EEE5] to-[#E8D6C3]">

                            <CalendarCheck2 className="h-14 w-14 text-[#D1965B]/45" />

                          </div>

                        )}

                        <span

                          className={`absolute left-4 top-4 max-w-[80%] truncate rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm ${getEventBadgeClass(

                            event

                          )}`}

                        >

                          {getEventLabel(

                            event

                          )}

                        </span>

                      </div>

                      <div className="p-5">

                        <h3 className="line-clamp-2 text-lg font-bold uppercase leading-tight text-[#5C4033] transition group-hover:text-[#D1965B]">

                          {event.title}

                        </h3>

                        {event.author && (

                          <p className="mt-2 text-sm font-medium text-[#5C4033]/60">

                            Organisé par{" "}

                            {event.author}

                          </p>

                        )}

                        <div className="mt-5 space-y-3 text-sm font-medium text-[#5C4033]/75">

                          <div className="flex items-center gap-3">

                            <span className="rounded-lg bg-[#D1965B]/10 p-2 text-[#D1965B]">

                              <CalendarCheck2 className="h-4 w-4" />

                            </span>

                            <span className="capitalize">

                              {formatLongDate(

                                event.date

                              )}

                            </span>

                          </div>

                          <div className="flex items-center gap-3">

                            <span className="rounded-lg bg-[#D1965B]/10 p-2 text-[#D1965B]">

                              <Clock3 className="h-4 w-4" />

                            </span>

                            <span>

                              {formatTimePeriod(

                                event.startTime,

                                event.endTime

                              )}

                            </span>

                          </div>

                          <div className="flex items-center gap-3">

                            <span className="rounded-lg bg-[#D1965B]/10 p-2 text-[#D1965B]">

                              <MapPin className="h-4 w-4" />

                            </span>

                            <span

                              className="line-clamp-1"

                              title={

                                location

                              }

                            >

                              {location}

                            </span>

                          </div>

                        </div>

                        {event.slug && (

                          <p className="mt-5 inline-flex items-center text-sm font-bold text-[#D1965B]">

                            Voir l’événement

                            <ChevronRight className="ml-1 h-4 w-4 transition group-hover:translate-x-1" />

                          </p>

                        )}

                      </div>

                    </article>

                  );

                  return event.slug ? (

                    <Link

                      key={event.id}

                      href={`/evenement/${event.slug}`}

                      className="block h-full"

                    >

                      {card}

                    </Link>

                  ) : (

                    <div

                      key={event.id}

                      className="h-full"

                    >

                      {card}

                    </div>

                  );

                }

              )}

            </div>

          </section>

        )}

    </div>

  );

}
