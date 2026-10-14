"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck2,
  History,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import RequestStatusBadge from "@/components/space-requests/RequestStatusBadge";
import {
  spaceRequestService,
  type SpaceRequest,
} from "@/services/spaceRequestService";

function formatDate(
  value?: string | null
) {
  if (!value) {
    return "Date non renseignée";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date non renseignée";
  }

  return date.toLocaleDateString(
    "fr-FR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}

function formatDateTime(
  value?: string | null
) {
  if (!value) {
    return "Date inconnue";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MemberHistoryPage() {
  const [requests, setRequests] =
    useState<SpaceRequest[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [query, setQuery] =
    useState("");

  const loadHistory = useCallback(
    async (initial = true) => {
      try {
        if (initial) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const data =
          await spaceRequestService.getMyRequests();

        const completedRequests = (
          Array.isArray(data) ? data : []
        )
          .filter(
            (request) =>
              request.status === "completed"
          )
          .sort((first, second) => {
            const firstDate = new Date(
              first.updatedAt ||
                first.createdAt
            ).getTime();
            const secondDate = new Date(
              second.updatedAt ||
                second.createdAt
            ).getTime();

            return secondDate - firstDate;
          });

        setRequests(completedRequests);
      } catch (error) {
        console.error(
          "Member history error:",
          error
        );
        toast.error(
          "Impossible de charger l’historique."
        );
        setRequests([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const filteredRequests = useMemo(() => {
    const value = query
      .trim()
      .toLowerCase();

    if (!value) {
      return requests;
    }

    return requests.filter((request) =>
      [
        request.reference,
        request.eventName,
        request.title,
        request.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [query, requests]);

  return (
    <div className="space-y-6 text-[#5C4033]">
      <section className="rounded-2xl bg-[#D1965B] p-6 text-white shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-white/15 p-3">
            <History className="h-7 w-7" />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-white/75">
              Espace personnel
            </p>
            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
              Historique des demandes
            </h1>
            <p className="mt-2 max-w-3xl text-white/90">
              Retrouvez toutes vos demandes dont
              le traitement est définitivement
              terminé.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#D1965B]/15 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#5C4033]/60">
                Demandes terminées
              </p>
              <p className="mt-1 text-3xl font-bold">
                {requests.length}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
              <FileCheck2 className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#D1965B]/15 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#5C4033]/60">
                Statut de l’historique
              </p>
              <p className="mt-1 text-xl font-bold text-emerald-700">
                Traitements terminés
              </p>
            </div>
            <div className="rounded-xl bg-[#D1965B]/10 p-3 text-[#D1965B]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#D1965B]/15 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#D1965B]/15 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">
              Demandes archivées
            </h2>
            <p className="mt-1 text-sm text-[#5C4033]/60">
              Seules les demandes avec le statut
              « Traitement terminé » apparaissent ici.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[#5C4033]/40" />
              <input
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Référence ou activité..."
                className="h-10 w-full rounded-lg border border-[#D1965B]/25 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#D1965B] sm:w-64"
              />
            </label>

            <Button
              type="button"
              variant="outline"
              disabled={refreshing}
              onClick={() =>
                void loadHistory(false)
              }
              className="border-[#D1965B]/30"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />
              Actualiser
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#D1965B]" />
              <p className="mt-3 text-sm text-[#5C4033]/60">
                Chargement de l’historique...
              </p>
            </div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <History className="mx-auto h-12 w-12 text-[#D1965B]/35" />
            <h2 className="mt-4 font-bold">
              {query
                ? "Aucun résultat"
                : "Aucune demande terminée"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#5C4033]/60">
              {query
                ? "Aucune demande terminée ne correspond à votre recherche."
                : "Lorsqu’une demande atteindra le statut Traitement terminé, elle apparaîtra automatiquement ici."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#D1965B]/10">
            {filteredRequests.map(
              (request) => (
                <article
                  key={request.id}
                  className="p-5 transition hover:bg-[#F8F5EF]/70 sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#D1965B]">
                          {request.reference}
                        </p>
                        <RequestStatusBadge
                          status={request.status as never}
                        />
                      </div>

                      <h3 className="mt-2 truncate text-lg font-bold">
                        {request.eventName ||
                          request.title ||
                          "Demande d’espace"}
                      </h3>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#5C4033]/65">
                        <span className="flex items-center gap-2">
                          <CalendarCheck2 className="h-4 w-4 text-[#D1965B]" />
                          Date confirmée :{" "}
                          {formatDate(
                            request.desiredDate ||
                              request.date
                          )}
                        </span>

                        <span className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-[#D1965B]" />
                          Terminé le{" "}
                          {formatDateTime(
                            request.updatedAt ||
                              request.createdAt
                          )}
                        </span>
                      </div>
                    </div>

                    <Button
                      asChild
                      variant="outline"
                      className="shrink-0 border-[#D1965B]/30 text-[#5C4033] hover:bg-[#F3EEE5]"
                    >
                      <Link
                        href={`/espace-membre/membre/demandes/${request.id}`}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Voir le dossier
                      </Link>
                    </Button>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}