"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  FaClock,
  FaLocationDot,
  FaXmark,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa6";

type EventItem = {
  id: number;
  title: string;
  slug: string;
  discipline: string;
  location: string;
  startDate: string;
  startTime: string;
  image?: string;
};

interface MonthlyCalendarProps {
  events: EventItem[];
}

type CalendarCell = {
  date: Date;
  day: number;
  current: boolean;
};

export default function MonthlyCalendar({ events }: MonthlyCalendarProps) {
  const router = useRouter();

  const today = new Date();

  // État pour le mois affiché - commence au mois actuel
  const [displayDate, setDisplayDate] = useState(new Date());

  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<EventItem[]>([]);

  // Utilise displayDate pour le libellé du mois
  const monthLabel = displayDate.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  // Vérifier si on peut aller au mois précédent
  const canGoPrevious = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // On ne peut pas aller avant le mois actuel
    if (year < currentYear) return false;
    if (year === currentYear && month <= currentMonth) return false;
    return true;
  };

  // Vérifier si on peut aller au mois suivant (toujours autorisé)
  const canGoNext = () => true;

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let startWeekDay = new Date(year, month, 1).getDay();
  startWeekDay = startWeekDay === 0 ? 6 : startWeekDay - 1;

  const previousMonthDays = new Date(year, month, 0).getDate();

  const cells: CalendarCell[] = [];

  // previous month
  for (let i = startWeekDay - 1; i >= 0; i--) {
    const day = previousMonthDays - i;
    cells.push({
      day,
      current: false,
      date: new Date(year, month - 1, day),
    });
  }

  // current month
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({
      day: i,
      current: true,
      date: new Date(year, month, i),
    });
  }

  // next month
  let next = 1;
  while (cells.length % 7 !== 0) {
    cells.push({
      day: next,
      current: false,
      date: new Date(year, month + 1, next),
    });
    next++;
  }

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const d = new Date(event.startDate);
      return (
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate()
      );
    });
  };

  const isToday = (date: Date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Vérifie si la date est passée (seulement pour le mois courant)
  const isPastDay = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    const t = new Date();
    t.setHours(0, 0, 0, 0);

    return d < t;
  };

  const openDay = (date: Date) => {
    // Ne pas ouvrir les jours passés (seulement pour le mois courant)
    if (isPastDay(date)) return;

    const list = getEventsForDate(date);
    setSelectedDate(date);
    setSelectedEvents(list);
  };

  return (
    <>
      <div className="w-full rounded-lg overflow-hidden border bg-white shadow-md">
        {/* HEADER avec navigation */}
        <div className="px-4 py-3 bg-[#F8F5EF] border-b flex items-center justify-between">
          <button
            onClick={() => {
              if (canGoPrevious()) {
                setDisplayDate(new Date(year, month - 1, 1));
              }
            }}
            className={`w-8 h-8 rounded-full shadow transition flex items-center justify-center text-sm ${
              canGoPrevious()
                ? "bg-white hover:bg-[#D1965B] hover:text-white cursor-pointer"
                : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
            }`}
          >
            <FaChevronLeft className="text-xs" />
          </button>

          <div className="text-center">
            <h2 className="text-lg font-bold capitalize text-[#2A2A2A]">
              {monthLabel}
            </h2>
            <p className="text-[10px] text-gray-500 mt-0.5 font-medium">
              Cliquez sur une journée
            </p>
          </div>

          <button
            onClick={() => {
              if (canGoNext()) {
                setDisplayDate(new Date(year, month + 1, 1));
              }
            }}
            className="w-8 h-8 rounded-full bg-white shadow hover:bg-[#D1965B] hover:text-white transition flex items-center justify-center cursor-pointer text-sm"
          >
            <FaChevronRight className="text-xs" />
          </button>
        </div>

        {/* DAYS */}
        <div className="grid grid-cols-7 bg-[#111] text-white text-[10px] font-semibold">
          {["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"].map((d) => (
            <div key={d} className="py-2 text-center border-r border-gray-800 last:border-r-0 font-semibold tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* GRID */}
        <div className="grid grid-cols-7">
          {cells.map((cell, index) => {
            const cellEvents = getEventsForDate(cell.date);
            const todayFlag = isToday(cell.date);
            // Seulement les jours du mois courant peuvent être "passés"
            // Les jours des mois précédents/suivants ne sont jamais "passés"
            const past = cell.current && isPastDay(cell.date);

            // Vérifier si le jour est dans un mois antérieur au mois actuel
            const isPreviousMonth = !cell.current && cell.date < new Date(today.getFullYear(), today.getMonth(), 1);
            const isClickable = !past && !isPreviousMonth;

            return (
              <div
                key={index}
                onClick={() => {
                  // Si c'est un jour d'un autre mois, changer de mois
                  if (!cell.current) {
                    setDisplayDate(
                      new Date(
                        cell.date.getFullYear(),
                        cell.date.getMonth(),
                        1
                      )
                    );
                    return;
                  }
                  // Sinon, ouvrir le jour (si pas passé)
                  openDay(cell.date);
                }}
                className={`
                  h-24 border p-1.5 flex flex-col relative transition
                  ${cell.current ? "bg-white" : "bg-[#FCFBF8]"}
                  ${
                    past
                      ? "bg-gray-100 text-gray-300 cursor-not-allowed opacity-60"
                      : isClickable
                      ? "cursor-pointer hover:bg-[#F9F5EF]"
                      : "cursor-not-allowed opacity-40"
                  }
                  ${todayFlag ? "ring-2 ring-[#D1965B]" : ""}
                `}
              >
                {/* TODAY */}
                {todayFlag && (
                  <span className="absolute top-1 right-1 text-[8px] text-[#D1965B] font-bold uppercase tracking-wide">
                    Aujourd&apos;hui
                  </span>
                )}

                {/* DAY */}
                <span
                  className={`
                    text-xl font-bold
                    ${
                      past
                        ? "text-gray-300"
                        : cell.current
                        ? "text-black"
                        : isPreviousMonth
                        ? "text-gray-300"
                        : "text-gray-500"
                    }
                  `}
                >
                  {String(cell.day).padStart(2, "0")}
                </span>

                {/* EVENTS */}
                <div className="mt-0.5 space-y-0.5 overflow-hidden">
                  {isClickable && cellEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className="bg-[#F3EFE8] text-[#B7833D] text-[8px] px-1.5 py-0.5 rounded font-bold uppercase truncate tracking-wide"
                    >
                      {event.discipline}
                    </div>
                  ))}

                  {isClickable && cellEvents.length > 2 && (
                    <div className="text-[8px] text-gray-500 font-medium">
                      +{cellEvents.length - 2}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DRAWER */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="w-full md:w-[400px] bg-white h-full overflow-y-auto">
            {/* HEADER */}
            <div className="sticky top-0 bg-[#D1965B] text-white p-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold capitalize">
                  {selectedDate.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </h2>
                <p className="text-xs opacity-80 font-medium">Programme de la journée</p>
              </div>

              <button
                onClick={() => setSelectedDate(null)}
                className="text-xl hover:opacity-80 transition"
              >
                <FaXmark />
              </button>
            </div>

            {/* CONTENT */}
            <div className="p-4 space-y-4">
              {selectedEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => router.push(`/evenement/${event.slug}`)}
                  className="cursor-pointer border rounded-lg overflow-hidden hover:shadow-lg transition"
                >
                  <div className="relative h-40">
                    <Image
                      src={event.image || "/placeholder.jpg"}
                      alt={event.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="p-4">
                    <span className="text-[10px] bg-[#D1965B]/10 text-[#D1965B] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                      {event.discipline}
                    </span>

                    <h3 className="text-base font-bold mt-2 mb-2">
                      {event.title}
                    </h3>

                    <div className="text-sm text-gray-600 space-y-1.5 font-medium">
                      <div className="flex items-center gap-2">
                        <FaClock className="text-[#D1965B] text-sm" />
                        <span>{event.startTime}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <FaLocationDot className="text-[#D1965B] text-sm" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {selectedEvents.length === 0 && (
                <p className="text-gray-500 text-center py-8 font-medium">
                  Aucun événement pour cette journée
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}