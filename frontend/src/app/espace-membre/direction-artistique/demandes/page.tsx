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

  CheckCircle2,

  Clock,

  Eye,

  FileText,

  History,

  Loader2,

  Palette,

  RefreshCw,

  Search,

  User,

} from "lucide-react";

import { isAxiosError } from "axios";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import {

  Card,

  CardContent,

} from "../../../components/ui/card";

import { Input } from "@/components/ui/input";

import RequestStatusBadge from "@/components/space-requests/RequestStatusBadge";

import { useAuth } from "@/context/AuthContext";

import {

  spaceRequestService,

  type SpaceRequest,

} from "@/services/spaceRequestService";

type ApiErrorResponse = {

  success?: boolean;

  message?: string;

  error?: string;

};

type FilterValue =

  | "all"

  | "pending"

  | "processed";

const statusLabels: Record<

  string,

  string

> = {

  draft: "Brouillon",

  submitted: "Envoyée",

  program_review:

    "Examen par les Programmes",

  general_review:

    "Examen par le Régisseur général",

  artistic_review:

    "À traiter par la Direction artistique",

  communication_review:

    "Transmise à la Communication",

  awaiting_member_confirmation:

    "Confirmation du demandeur",

  program_review_after_confirmation:

    "Retour aux Programmes",

  legal_review:

    "Examen juridique",

  program_review_after_legal:

    "Retour juridique aux Programmes",

  finance_cotation:

    "Cotation des Finances",

  program_review_after_finance:

    "Retour des Finances",

  completed: "Terminée",

  rejected: "Rejetée",

};

function getErrorMessage(

  error: unknown,

  fallback: string

) {

  if (

    isAxiosError<ApiErrorResponse>(

      error

    )

  ) {

    return (

      error.response?.data?.message ||

      error.response?.data?.error ||

      (error.code === "ERR_NETWORK"

        ? "Impossible de contacter le serveur."

        : fallback)

    );

  }

  if (error instanceof Error) {

    return error.message;

  }

  return fallback;

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

    return "Non renseignée";

  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {

    return "Non renseignée";

  }

  return date.toLocaleString("fr-FR", {

    day: "2-digit",

    month: "short",

    year: "numeric",

    hour: "2-digit",

    minute: "2-digit",

  });

}

export default function ArtisticRequestsPage() {

  const { user } = useAuth();

  const isAssistant =

    user?.role ===

    "DIRECTION_ARTISTIQUE_ASSISTANT";

  const [requests, setRequests] =

    useState<SpaceRequest[]>([]);

  const [loading, setLoading] =

    useState(true);

  const [refreshing, setRefreshing] =

    useState(false);

  const [search, setSearch] =

    useState("");

  const [filter, setFilter] =

    useState<FilterValue>("all");

  const loadRequests = useCallback(

    async (silent = false) => {

      try {

        if (silent) {

          setRefreshing(true);

        } else {

          setLoading(true);

        }

        const data =

          await spaceRequestService.getDepartmentRequests();

        setRequests(

          Array.isArray(data) ? data : []

        );

      } catch (error) {

        console.error(

          "Artistic requests error:",

          isAxiosError(error)

            ? error.response?.data

            : error

        );

        toast.error(

          getErrorMessage(

            error,

            "Impossible de charger les demandes."

          )

        );

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

  const statistics = useMemo(() => {

    const pending = requests.filter(

      (request) =>

        request.status ===

          "artistic_review" &&

        request.assignedDepartment ===

          "DIRECTION_ARTISTIQUE"

    ).length;

    const processed =

      requests.length - pending;

    return {

      total: requests.length,

      pending,

      processed,

    };

  }, [requests]);

  const filteredRequests =

    useMemo(() => {

      const normalizedSearch =

        search.trim().toLowerCase();

      return requests.filter(

        (request) => {

          const isPending =

            request.status ===

              "artistic_review" &&

            request.assignedDepartment ===

              "DIRECTION_ARTISTIQUE";

          if (

            filter === "pending" &&

            !isPending

          ) {

            return false;

          }

          if (

            filter === "processed" &&

            isPending

          ) {

            return false;

          }

          if (!normalizedSearch) {

            return true;

          }

          const searchableText = [

            request.reference,

            request.eventName,

            request.title,

            request.description,

            request.user?.username,

            request.user?.firstName,

            request.user?.lastName,

            request.user?.email,

          ]

            .filter(Boolean)

            .join(" ")

            .toLowerCase();

          return searchableText.includes(

            normalizedSearch

          );

        }

      );

    }, [requests, search, filter]);

  if (loading) {

    return (

      <div className="flex min-h-[60vh] items-center justify-center">

        <div className="text-center">

          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#D1965B]" />

          <p className="mt-4 text-sm text-[#5C4033]/70">

            Chargement des demandes...

          </p>

        </div>

      </div>

    );

  }

  return (

    <div className="space-y-6">

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">

        <div>

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-[#D1965B]/10 p-3">

              <Palette className="h-7 w-7 text-[#D1965B]" />

            </div>

            <div>

              <h1 className="text-2xl font-bold text-[#5C4033] sm:text-3xl">

                {isAssistant

                  ? "Mes réservations à traiter"

                  : "Validation des réservations"}

              </h1>

              <p className="mt-1 text-sm text-[#5C4033]/70">

                Examinez les documents liés aux réservations,

                signez-les et transmettez chaque dossier.

              </p>

            </div>

          </div>

        </div>

        <Button

          type="button"

          variant="outline"

          onClick={() =>

            void loadRequests(true)

          }

          disabled={refreshing}

          className="border-[#D1965B]/40 text-[#5C4033] hover:bg-[#F3EEE5]"

        >

          <RefreshCw

            className={`mr-2 h-4 w-4 ${

              refreshing

                ? "animate-spin"

                : ""

            }`}

          />

          {refreshing

            ? "Actualisation..."

            : "Actualiser"}

        </Button>

      </div>

      <div className="grid gap-4 sm:grid-cols-3">

        <Card className="border-[#D1965B]/20 bg-white">

          <CardContent className="flex items-center justify-between p-5">

            <div>

              <p className="text-sm text-[#5C4033]/60">

                Total

              </p>

              <p className="mt-1 text-3xl font-bold text-[#5C4033]">

                {statistics.total}

              </p>

            </div>

            <div className="rounded-xl bg-[#D1965B]/10 p-3">

              <FileText className="h-6 w-6 text-[#D1965B]" />

            </div>

          </CardContent>

        </Card>

        <Card className="border-amber-200 bg-white">

          <CardContent className="flex items-center justify-between p-5">

            <div>

              <p className="text-sm text-amber-700">

                À traiter

              </p>

              <p className="mt-1 text-3xl font-bold text-amber-800">

                {statistics.pending}

              </p>

            </div>

            <div className="rounded-xl bg-amber-100 p-3">

              <Clock className="h-6 w-6 text-amber-700" />

            </div>

          </CardContent>

        </Card>

        <Card className="border-green-200 bg-white">

          <CardContent className="flex items-center justify-between p-5">

            <div>

              <p className="text-sm text-green-700">

                Traitées

              </p>

              <p className="mt-1 text-3xl font-bold text-green-800">

                {statistics.processed}

              </p>

            </div>

            <div className="rounded-xl bg-green-100 p-3">

              <CheckCircle2 className="h-6 w-6 text-green-700" />

            </div>

          </CardContent>

        </Card>

      </div>

      <Card className="border-[#D1965B]/20 bg-white">

        <CardContent className="p-5">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">

            <div className="relative flex-1">

              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5C4033]/40" />

              <Input

                value={search}

                onChange={(event) =>

                  setSearch(

                    event.target.value

                  )

                }

                placeholder="Rechercher par référence, événement ou demandeur..."

                className="border-[#D1965B]/30 pl-10 focus-visible:ring-[#D1965B]"

              />

            </div>

            <div className="flex flex-wrap gap-2">

              <Button

                type="button"

                size="sm"

                variant={

                  filter === "all"

                    ? "default"

                    : "outline"

                }

                onClick={() =>

                  setFilter("all")

                }

                className={

                  filter === "all"

                    ? "bg-[#D1965B] text-white hover:bg-[#B97D47]"

                    : "border-[#D1965B]/40 text-[#5C4033]"

                }

              >

                Toutes

              </Button>

              <Button

                type="button"

                size="sm"

                variant={

                  filter === "pending"

                    ? "default"

                    : "outline"

                }

                onClick={() =>

                  setFilter("pending")

                }

                className={

                  filter === "pending"

                    ? "bg-[#D1965B] text-white hover:bg-[#B97D47]"

                    : "border-[#D1965B]/40 text-[#5C4033]"

                }

              >

                À traiter

              </Button>

              <Button

                type="button"

                size="sm"

                variant={

                  filter === "processed"

                    ? "default"

                    : "outline"

                }

                onClick={() =>

                  setFilter("processed")

                }

                className={

                  filter === "processed"

                    ? "bg-[#D1965B] text-white hover:bg-[#B97D47]"

                    : "border-[#D1965B]/40 text-[#5C4033]"

                }

              >

                Traitées

              </Button>

            </div>

          </div>

        </CardContent>

      </Card>

      {filteredRequests.length === 0 ? (

        <Card className="border-[#D1965B]/20 bg-white">

          <CardContent className="p-12 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#D1965B]/10">

              <Palette className="h-8 w-8 text-[#D1965B]" />

            </div>

            <h2 className="mt-5 text-xl font-bold text-[#5C4033]">

              Aucune demande trouvée

            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#5C4033]/65">

              {requests.length === 0

                ? "Aucune demande n’est actuellement assignée à la Direction artistique."

                : "Aucune demande ne correspond à votre recherche ou au filtre sélectionné."}

            </p>

            {(search ||

              filter !== "all") && (

              <Button

                type="button"

                variant="outline"

                onClick={() => {

                  setSearch("");

                  setFilter("all");

                }}

                className="mt-5 border-[#D1965B]/40 text-[#5C4033]"

              >

                Réinitialiser les filtres

              </Button>

            )}

          </CardContent>

        </Card>

      ) : (

        <div className="grid gap-4">

          {filteredRequests.map(

            (request) => {

              const pending =

                request.status ===

                  "artistic_review" &&

                request.assignedDepartment ===

                  "DIRECTION_ARTISTIQUE";

              const fullName =

                request.user?.username ||

                [

                  request.user

                    ?.firstName,

                  request.user

                    ?.lastName,

                ]

                  .filter(Boolean)

                  .join(" ") ||

                "Demandeur";

              return (

                <Card

                  key={request.id}

                  className={`overflow-hidden bg-white transition hover:shadow-md ${

                    pending

                      ? "border-amber-300"

                      : "border-[#D1965B]/20"

                  }`}

                >

                  <CardContent className="p-0">

                    <div className="flex flex-col lg:flex-row">

                      <div

                        className={`w-full lg:w-2 ${

                          pending

                            ? "bg-amber-500"

                            : "bg-[#D1965B]"

                        }`}

                      />

                      <div className="flex-1 p-5 sm:p-6">

                        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">

                          <div className="min-w-0 flex-1">

                            <div className="flex flex-wrap items-center gap-3">

                              <p className="text-xs font-bold uppercase tracking-wide text-[#D1965B]">

                                {request.reference}

                              </p>

                              <RequestStatusBadge

                                status={

                                  request.status as never

                                }

                              />

                              {pending && (

                                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">

                                  Action requise

                                </span>

                              )}

                            </div>

                            <h2 className="mt-3 text-xl font-bold text-[#5C4033]">

                              {request.eventName ||

                                request.title ||

                                "Demande d’espace"}

                            </h2>

                            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm text-[#5C4033]/65">

                              <span className="flex items-center gap-2">

                                <User className="h-4 w-4 text-[#D1965B]" />

                                {fullName}

                              </span>

                              <span className="flex items-center gap-2">

                                <Calendar className="h-4 w-4 text-[#D1965B]" />

                                Occupation :{" "}

                                {formatDate(

                                  request.date ||

                                    request.desiredDate

                                )}

                              </span>

                              <span className="flex items-center gap-2">

                                <Clock className="h-4 w-4 text-[#D1965B]" />

                                Reçue :{" "}

                                {formatDateTime(

                                  request.submittedAt ||

                                    request.createdAt

                                )}

                              </span>

                            </div>

                            {request.description && (

                              <p className="mt-4 line-clamp-2 text-sm leading-6 text-[#5C4033]/70">

                                {request.description}

                              </p>

                            )}

                            <p className="mt-3 text-xs font-medium text-[#5C4033]/55">

                              {statusLabels[

                                request.status

                              ] ||

                                request.status}

                            </p>

                          </div>

                          <Button

                            asChild

                            className={

                              pending

                                ? "bg-[#D1965B] text-white hover:bg-[#B97D47]"

                                : "border-[#D1965B]/40 bg-white text-[#5C4033] hover:bg-[#F3EEE5]"

                            }

                            variant={

                              pending

                                ? "default"

                                : "outline"

                            }

                          >

                            <Link

                              href={`/espace-membre/direction-artistique/demandes/${request.id}`}

                            >

                              <Eye className="mr-2 h-4 w-4" />

                              {pending

                                ? "Examiner"

                                : "Consulter"}

                            </Link>

                          </Button>

                        </div>

                      </div>

                    </div>

                  </CardContent>

                </Card>

              );

            }

          )}

        </div>

      )}

      <div className="flex justify-end">

        <Button

          asChild

          variant="outline"

          className="border-[#D1965B]/40 text-[#5C4033] hover:bg-[#F3EEE5]"

        >

          <Link href="/espace-membre/direction-artistique/historique">

            <History className="mr-2 h-4 w-4" />

            Voir tout l&apos;historique

          </Link>

        </Button>

      </div>

    </div>

  );

}
