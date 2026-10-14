"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarCheck2,
  CheckCheck,
  FileText,
  FolderKanban,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  notificationService,
  type ArtisticNotification,
  type ArtisticNotificationSource,
  type ArtisticUnreadCount,
} from "@/services/notificationService";

type Filter = "ALL" | ArtisticNotificationSource;

const emptyCount: ArtisticUnreadCount = {
  total: 0,
  reservations: 0,
  projects: 0,
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ArtisticNotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [notifications, setNotifications] = useState<
    ArtisticNotification[]
  >([]);
  const [unread, setUnread] = useState<ArtisticUnreadCount>(emptyCount);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(
    async (initial = false) => {
      try {
        if (initial) setLoading(true);
        else setRefreshing(true);

        const result =
          await notificationService.getArtisticNotifications(filter);
        setNotifications(result.data);
        setUnread(result.unreadCount);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Impossible de charger les notifications."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filter]
  );

  useEffect(() => {
    void loadNotifications(true);
  }, [loadNotifications]);

  const displayedUnread = useMemo(() => {
    if (filter === "RESERVATION") return unread.reservations;
    if (filter === "PROJECT_PROPOSAL") return unread.projects;
    return unread.total;
  }, [filter, unread]);

  async function openNotification(notification: ArtisticNotification) {
    try {
      if (!notification.isRead) {
        await notificationService.markArtisticAsRead(notification.id);
      }
    } catch (error) {
      console.error("Mark artistic notification error:", error);
    } finally {
      router.push(notification.actionUrl);
    }
  }

  async function markAll() {
    try {
      setMarkingAll(true);
      await notificationService.markAllArtisticAsRead(filter);
      await loadNotifications(false);
      toast.success("Notifications marquées comme lues.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de mettre à jour les notifications."
      );
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <section className="rounded-[2rem] bg-[#4B3429] p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 text-[#E7B57F]">
              <Bell className="h-5 w-5" />
              <span className="text-xs font-black uppercase tracking-[0.16em]">
                Direction artistique
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-black">
              Notifications et documents
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-white/70">
              Identifiez immédiatement si le document concerne une
              réservation d’espace ou une proposition de projet.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadNotifications(false)}
              disabled={refreshing}
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              Actualiser
            </Button>

            <Button
              type="button"
              onClick={() => void markAll()}
              disabled={markingAll || displayedUnread === 0}
              className="bg-[#D1965B] text-white hover:bg-[#B97D47]"
            >
              {markingAll ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="mr-2 h-4 w-4" />
              )}
              Tout marquer comme lu
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <FilterButton
          active={filter === "ALL"}
          onClick={() => setFilter("ALL")}
          icon={Bell}
          label="Toutes"
          count={unread.total}
          color="brown"
        />
        <FilterButton
          active={filter === "RESERVATION"}
          onClick={() => setFilter("RESERVATION")}
          icon={CalendarCheck2}
          label="Réservations"
          count={unread.reservations}
          color="orange"
        />
        <FilterButton
          active={filter === "PROJECT_PROPOSAL"}
          onClick={() => setFilter("PROJECT_PROPOSAL")}
          icon={FolderKanban}
          label="Propositions"
          count={unread.projects}
          color="violet"
        />
      </section>

      <section className="rounded-[2rem] border bg-white p-5 shadow-sm sm:p-7">
        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#D1965B]" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-14 text-center">
            <CheckCheck className="mx-auto h-12 w-12 text-emerald-400" />
            <h2 className="mt-4 font-bold text-[#4B3429]">
              Aucune notification dans cette catégorie
            </h2>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const isReservation =
                notification.sourceType === "RESERVATION";

              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => void openNotification(notification)}
                  className={`flex w-full flex-col gap-4 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center ${
                    notification.isRead
                      ? "border-[#EAE3DD] bg-white"
                      : "border-[#D1965B]/30 bg-[#FFF9F4]"
                  }`}
                >
                  <div
                    className={`rounded-xl p-3 ${
                      isReservation
                        ? "bg-[#F8EADF] text-[#A66435]"
                        : "bg-violet-100 text-violet-700"
                    }`}
                  >
                    {isReservation ? (
                      <FileText className="h-5 w-5" />
                    ) : (
                      <FolderKanban className="h-5 w-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                          isReservation
                            ? "bg-[#F8EADF] text-[#9B5A2D]"
                            : "bg-violet-100 text-violet-700"
                        }`}
                      >
                        {isReservation
                          ? "Document de réservation"
                          : "Document de projet"}
                      </span>

                      {!notification.isRead && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                          Nouveau
                        </span>
                      )}
                    </div>

                    <h2 className="mt-2 font-bold text-[#4B3429]">
                      {notification.title}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-[#5C4033]/65">
                      {notification.message}
                    </p>
                  </div>

                  <p className="shrink-0 text-xs text-[#5C4033]/45">
                    {formatDateTime(notification.createdAt)}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
  color,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Bell;
  label: string;
  count: number;
  color: "brown" | "orange" | "violet";
}) {
  const colors = {
    brown: "bg-[#4B3429] text-white",
    orange: "bg-[#D1965B] text-white",
    violet: "bg-violet-600 text-white",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${
        active
          ? colors[color]
          : "border-[#E8E0DA] bg-white text-[#4B3429] hover:bg-[#FCFAF8]"
      }`}
    >
      <span className="flex items-center gap-3 font-bold">
        <Icon className="h-5 w-5" />
        {label}
      </span>
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-black ${
          active ? "bg-white/20" : "bg-red-100 text-red-700"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
