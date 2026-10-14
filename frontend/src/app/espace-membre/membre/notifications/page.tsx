"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  notificationService,
  type MemberNotification,
} from "@/services/notificationService";

const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  submitted: "Demande soumise",
  program_review: "Examen par le Programme",
  general_review: "Examen par la Régie générale",
  artistic_review: "Examen artistique",
  communication_review: "Examen par la Communication",
  awaiting_member_confirmation: "En attente de votre confirmation",
  program_review_after_confirmation: "Réexamen par le Programme",
  legal_review: "Examen juridique",
  program_review_after_legal: "Retour au Programme",
  finance_cotation: "Cotation financière",
  program_review_after_finance: "Validation finale du Programme",
  completed: "Demande terminée",
  rejected: "Demande rejetée",
};

function statusLabel(status?: string | null) {
  if (!status) return "Non renseigné";

  return statusLabels[status.toLowerCase()] || status.replaceAll("_", " ");
}

function formatDateTime(value?: string | null) {
  if (!value) return "Date inconnue";

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

export default function MemberNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<MemberNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async (initial = true) => {
    try {
      if (initial) setLoading(true);
      else setRefreshing(true);

      const result = await notificationService.getMyNotifications();

      setNotifications(result.data);
      setUnreadCount(result.unreadCount);
    } catch (error) {
      console.error("Notifications error:", error);
      toast.error("Impossible de charger les notifications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  async function openNotification(notification: MemberNotification) {
    try {
      if (!notification.isRead) {
        await notificationService.markAsRead(notification.id);
      }

      router.push(
        `/espace-membre/membre/demandes/${notification.requestId}`,
      );
    } catch (error) {
      console.error("Open notification error:", error);
      toast.error("Impossible d’ouvrir cette notification.");
    }
  }

  async function markAllAsRead() {
    try {
      await notificationService.markAllAsRead();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );
      setUnreadCount(0);
      toast.success("Toutes les notifications ont été marquées comme lues.");
    } catch (error) {
      console.error("Mark all notifications error:", error);
      toast.error("Impossible de mettre à jour les notifications.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-[#39251D] p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <div className="relative rounded-2xl bg-[#D1965B] p-3">
              <Bell className="h-7 w-7" />

              {unreadCount > 0 && (
                <span className="absolute -right-2 -top-2 inline-flex min-w-6 items-center justify-center rounded-full bg-red-600 px-1.5 py-1 text-xs font-black text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#E7B57F]">
                Compte
              </p>
              <h1 className="mt-2 text-3xl font-black">Notifications</h1>
              <p className="mt-2 text-sm text-white/70">
                Retrouvez les changements de statut de vos demandes.
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <Button
              type="button"
              onClick={() => void markAllAsRead()}
              className="bg-white text-[#5C4033] hover:bg-[#F3EEE5]"
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Tout marquer comme lu
            </Button>
          )}
        </div>
      </section>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={refreshing}
          onClick={() => void loadNotifications(false)}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Actualiser
        </Button>
      </div>

      {loading ? (
        <div className="flex min-h-72 items-center justify-center rounded-3xl border bg-white">
          <div className="text-center">
            <Loader2 className="mx-auto h-9 w-9 animate-spin text-[#D1965B]" />
            <p className="mt-3 text-sm text-[#5C4033]/60">
              Chargement des notifications...
            </p>
          </div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#D1965B]/30 bg-white p-12 text-center">
          <Bell className="mx-auto h-12 w-12 text-[#D1965B]/35" />
          <h2 className="mt-4 text-lg font-black text-[#5C4033]">
            Aucune notification
          </h2>
          <p className="mt-2 text-sm text-[#5C4033]/60">
            Les changements de statut de vos demandes apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => void openNotification(notification)}
              className={`flex w-full items-start gap-4 rounded-3xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6 ${
                notification.isRead
                  ? "border-[#D1965B]/10 bg-white"
                  : "border-[#D1965B]/35 bg-[#FFF8F0]"
              }`}
            >
              <div
                className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                  notification.isRead
                    ? "bg-[#F3EEE5] text-[#D1965B]"
                    : "bg-[#D1965B] text-white"
                }`}
              >
                <Bell className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-[#D1965B]">
                      {notification.reference || `Demande #${notification.requestId}`}
                    </p>
                    <h2 className="mt-1 font-black text-[#5C4033]">
                      {notification.eventName || notification.title}
                    </h2>
                  </div>

                  <p className="shrink-0 text-xs text-[#5C4033]/45">
                    {formatDateTime(notification.createdAt)}
                  </p>
                </div>

                <p className="mt-3 text-sm leading-6 text-[#5C4033]/70">
                  Statut : {statusLabel(notification.previousStatus)} →{" "}
                  <strong>{statusLabel(notification.newStatus)}</strong>
                </p>

                <p className="mt-3 text-xs font-bold text-[#D1965B]">
                  Cliquer pour consulter la demande
                </p>
              </div>

              {!notification.isRead && (
                <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-red-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
