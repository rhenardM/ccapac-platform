"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  Calendar,
  Clock3,
  Eye,
  FileText,
  Loader2,
  Plus,
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

const departmentLabels: Record<
  string,
  string
> = {
  MEMBER: "Demandeur",
  PROGRAMME: "Service des Programmes",
  REGISSEUR_GENERAL:
    "Régisseur général",
  DIRECTION_ARTISTIQUE:
    "Direction artistique",
  COMMUNICATION: "Communication",
  JURIDIQUE: "Service juridique",
  FINANCE: "Service des Finances",
};

function normalizeStatus(status?: string | null) {
  return String(status || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

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

export default function MemberRequestsPage() {
  const [requests, setRequests] =
    useState<SpaceRequest[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [query, setQuery] =
    useState("");

  const loadRequests = useCallback(
    async (initial = true) => {
      try {
        if (initial) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const data =
          await spaceRequestService.getMyRequests();

        const activeRequests = (
          Array.isArray(data) ? data : []
        )
          .filter(
            (request) =>
              request.status !== "completed"
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

        setRequests(activeRequests);
      } catch (error) {
        console.error(
          "Member requests error:",
          error
        );
        toast.error(
          "Impossible de charger vos demandes."
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
    void loadRequests();
  }, [loadRequests]);

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
        request.currentStep,
        request.assignedDepartment,
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
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-white/75">
              Espace personnel
            </p>
            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
              Mes demandes
            </h1>
            <p className="mt-2 max-w-2xl text-white/90">
              Suivez toutes les demandes qui sont
              encore en cours de traitement.
            </p>
          </div>

          
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#D1965B]/15 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#D1965B]/15 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">
              Demandes en cours
            </h2>
            <p className="mt-1 text-sm text-[#5C4033]/60">
              Les demandes terminées sont déplacées
              automatiquement vers l’historique.
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
                void loadRequests(false)
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
          <div className="flex min-h-72 items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#D1965B]" />
              <p className="mt-3 text-sm text-[#5C4033]/60">
                Chargement de vos demandes...
              </p>
            </div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FileText className="mx-auto h-12 w-12 text-[#D1965B]/35" />
            <h2 className="mt-4 font-bold">
              {query
                ? "Aucun résultat"
                : "Aucune demande en cours"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#5C4033]/60">
              {query
                ? "Aucune demande en cours ne correspond à votre recherche."
                : "Vous n’avez actuellement aucune demande en attente de traitement."}
            </p>

            {!query && (
              <Button
                asChild
                className="mt-5 bg-[#D1965B] text-white hover:bg-[#B97D47]"
              >
                <Link href="/espace-membre/membre/nouvelle-demande">
                  <Plus className="mr-2 h-4 w-4" />
                  Créer une demande
                </Link>
              </Button>
            )}
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
                        {normalizeStatus(request.status) ===
                        "awaiting_payment_proof" ? (
                          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                            <span className="h-2 w-2 rounded-full bg-current" />
                            En attente de la preuve de paiement
                          </span>
                        ) : normalizeStatus(request.status) ===
                          "program_payment_review" ? (
                          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                            <span className="h-2 w-2 rounded-full bg-current" />
                            Paiement en cours de vérification par le Service des Programmes
                          </span>
                        ) : (
                          <RequestStatusBadge
                            status={request.status as never}
                          />
                        )}
                      </div>

                      <h3 className="mt-2 truncate text-lg font-bold">
                        {request.eventName ||
                          request.title ||
                          "Demande d’espace"}
                      </h3>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#5C4033]/65">
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-[#D1965B]" />
                          Date souhaitée :{" "}
                          {formatDate(
                            request.desiredDate ||
                              request.date
                          )}
                        </span>

                        <span className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-[#D1965B]" />
                          Mis à jour le{" "}
                          {formatDateTime(
                            request.updatedAt ||
                              request.createdAt
                          )}
                        </span>
                      </div>

                      <div className="mt-3 rounded-lg bg-[#F3EEE5]/70 px-3 py-2 text-sm">
                        <span className="font-semibold">
                          Étape actuelle :{" "}
                        </span>
                        {request.currentStep ||
                          departmentLabels[
                            request.assignedDepartment ||
                              request.currentDepartment
                          ] ||
                          "Traitement en cours"}
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
                        Voir la demande
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