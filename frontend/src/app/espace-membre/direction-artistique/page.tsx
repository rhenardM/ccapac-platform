"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarCheck2,
  CheckCircle2,
  FileText,
  FolderKanban,
  Loader2,
  Palette,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  notificationService,
  type ArtisticNotification,
  type ArtisticUnreadCount,
} from "@/services/notificationService";
import {
  projectProposalService,
  type ProjectProposal,
} from "@/services/projectProposalService";
import {
  spaceRequestService,
  type SpaceRequest,
} from "@/services/spaceRequestService";

const emptyUnreadCount: ArtisticUnreadCount = {
  total: 0,
  reservations: 0,
  projects: 0,
};

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ArtisticDashboardPage() {
  const { user } = useAuth();

  const [requests, setRequests] = useState<SpaceRequest[]>([]);
  const [proposals, setProposals] = useState<ProjectProposal[]>([]);
  const [notifications, setNotifications] = useState<
    ArtisticNotification[]
  >([]);
  const [unread, setUnread] = useState<ArtisticUnreadCount>(
    emptyUnreadCount
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async (initial = false) => {
    try {
      if (initial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const [requestData, proposalData, notificationData] =
        await Promise.all([
          spaceRequestService.getDepartmentRequests(),
          projectProposalService.getArtisticProposals(),
          notificationService.getArtisticNotifications(),
        ]);

      setRequests(Array.isArray(requestData) ? requestData : []);
      setProposals(Array.isArray(proposalData) ? proposalData : []);
      setNotifications(notificationData.data.slice(0, 5));
      setUnread(notificationData.unreadCount);
    } catch (error) {
      console.error("Artistic dashboard error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de charger le tableau de bord."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard(true);
  }, [loadDashboard]);

  const reservationStats = useMemo(() => {
    const unassigned = requests.filter(
      (request) => !request.artisticAssignedToUserId
    ).length;

    return {
      total: requests.length,
      unassigned,
      assigned: requests.length - unassigned,
    };
  }, [requests]);

  const projectStats = useMemo(() => {
    const active = proposals.filter(
      (proposal) =>
        !["APPROVED", "REJECTED"].includes(proposal.status)
    );

    return {
      total: active.length,
      unassigned: active.filter(
        (proposal) => proposal.status === "SUBMITTED"
      ).length,
      supervisorReview: active.filter(
        (proposal) => proposal.status === "SUPERVISOR_REVIEW"
      ).length,
    };
  }, [proposals]);

  const firstName =
    user?.first_name?.trim() || "Direction artistique";

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#D1965B]" />
          <p className="mt-3 text-sm text-[#5C4033]/60">
            Organisation de votre espace de travail...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-10">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#4B3429] px-6 py-8 text-white shadow-xl sm:px-9 sm:py-10">
        <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[#D1965B]/35 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#F0C79F]">
              <Palette className="h-4 w-4" />
              Direction artistique
            </div>

            <h1 className="mt-5 text-3xl font-black sm:text-4xl">
              Bonjour {firstName},
              <span className="block text-[#E7B57F]">
                deux missions, un seul espace organisé.
              </span>
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/75 sm:text-base">
              Traitez séparément les validations liées aux
              réservations d’espace et l’évaluation des propositions
              de projet, avec des notifications clairement identifiées.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => void loadDashboard(false)}
            disabled={refreshing}
            className="bg-white text-[#4B3429] hover:bg-[#F4ECE5]"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            Actualiser
          </Button>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="group overflow-hidden rounded-[2rem] border border-[#D1965B]/20 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
          <div className="border-b border-[#D1965B]/10 bg-[#FFF8F2] p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-[#D1965B] p-3 text-white shadow-sm">
                  <CalendarCheck2 className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#B66F38]">
                    Réservations d’espace
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-[#4B3429]">
                    Validation artistique
                  </h2>
                </div>
              </div>

              {unread.reservations > 0 && (
                <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-black text-white">
                  {unread.reservations}
                </span>
              )}
            </div>

            <p className="mt-4 text-sm leading-6 text-[#5C4033]/65">
              Examinez les demandes de réservation et les documents
              transmis dans le processus de validation artistique.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-px bg-[#D1965B]/10">
            <Stat value={reservationStats.total} label="À traiter" />
            <Stat
              value={reservationStats.unassigned}
              label="Non affectées"
              valueClassName="text-amber-600"
            />
            <Stat
              value={reservationStats.assigned}
              label="Affectées"
              valueClassName="text-emerald-600"
            />
          </div>

          <div className="p-5 sm:p-6">
            <Button
              asChild
              className="w-full bg-[#4B3429] text-white hover:bg-[#34231C]"
            >
              <Link href="/espace-membre/direction-artistique/demandes">
                Ouvrir les réservations
                <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </article>

        <article className="group overflow-hidden rounded-[2rem] border border-violet-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
          <div className="border-b border-violet-100 bg-violet-50/70 p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-violet-600 p-3 text-white shadow-sm">
                  <FolderKanban className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-700">
                    Propositions de projet
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-[#4B3429]">
                    Évaluation culturelle
                  </h2>
                </div>
              </div>

              {unread.projects > 0 && (
                <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-black text-white">
                  {unread.projects}
                </span>
              )}
            </div>

            <p className="mt-4 text-sm leading-6 text-[#5C4033]/65">
              Étudiez les projets culturels, leurs dossiers et les
              recommandations préparées par les assistants.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-px bg-violet-100">
            <Stat value={projectStats.total} label="À étudier" />
            <Stat
              value={projectStats.unassigned}
              label="Nouvelles"
              valueClassName="text-amber-600"
            />
            <Stat
              value={projectStats.supervisorReview}
              label="À décider"
              valueClassName="text-violet-600"
            />
          </div>

          <div className="p-5 sm:p-6">
            <Button
              asChild
              className="w-full bg-violet-600 text-white hover:bg-violet-700"
            >
              <Link href="/espace-membre/direction-artistique/projets">
                Ouvrir les propositions
                <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </article>
      </section>

      <section className="rounded-[2rem] border border-[#D1965B]/15 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-[#D1965B]">
              <Bell className="h-5 w-5" />
              <span className="text-xs font-black uppercase tracking-[0.16em]">
                Centre de notifications
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-black text-[#4B3429]">
              Documents récemment reçus
            </h2>
          </div>

          <Button asChild variant="outline">
            <Link href="/espace-membre/direction-artistique/notifications">
              Voir toutes les notifications
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-6 space-y-3">
          {notifications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D1965B]/25 bg-[#FCFAF8] p-10 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
              <p className="mt-3 font-semibold text-[#4B3429]">
                Aucun nouveau document à examiner
              </p>
            </div>
          ) : (
            notifications.map((notification) => {
              const isReservation =
                notification.sourceType === "RESERVATION";

              return (
                <Link
                  key={notification.id}
                  href={notification.actionUrl}
                  className="group flex flex-col gap-3 rounded-2xl border border-[#EAE1DA] p-4 transition hover:border-[#D1965B]/45 hover:bg-[#FCFAF8] sm:flex-row sm:items-center"
                >
                  <div
                    className={`rounded-xl p-2.5 ${
                      isReservation
                        ? "bg-[#F8EADF] text-[#B66F38]"
                        : "bg-violet-100 text-violet-700"
                    }`}
                  >
                    {isReservation ? (
                      <FileText className="h-5 w-5" />
                    ) : (
                      <Sparkles className="h-5 w-5" />
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
                          ? "Réservation"
                          : "Proposition de projet"}
                      </span>
                      {!notification.isRead && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                          Nouveau
                        </span>
                      )}
                    </div>
                    <p className="mt-2 truncate font-bold text-[#4B3429]">
                      {notification.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-[#5C4033]/60">
                      {notification.message}
                    </p>
                  </div>

                  <p className="shrink-0 text-xs text-[#5C4033]/45">
                    {formatDateTime(notification.createdAt)}
                  </p>
                </Link>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({
  value,
  label,
  valueClassName = "text-[#4B3429]",
}: {
  value: number;
  label: string;
  valueClassName?: string;
}) {
  return (
    <div className="bg-white p-5 text-center">
      <p className={`text-3xl font-black ${valueClassName}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-[#5C4033]/55">
        {label}
      </p>
    </div>
  );
}
