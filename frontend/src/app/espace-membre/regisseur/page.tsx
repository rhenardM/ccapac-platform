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
  ClipboardCheck,
  Clock,
  Eye,
  FileText,
  RefreshCw,
  User,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "../../components/ui/card";
import RequestStatusBadge from "@/components/space-requests/RequestStatusBadge";
import {
  spaceRequestService,
  type SpaceRequest,
} from "@/services/spaceRequestService";

function formatDate(
  value?: string | null
): string {
  if (!value) {
    return "Date inconnue";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function RegisseurDashboardPage() {
  const [requests, setRequests] = useState<
    SpaceRequest[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const loadRequests = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const data =
          await spaceRequestService.getDepartmentRequests();

        setRequests(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        console.error(
          "Regisseur requests error:",
          error
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Impossible de charger les demandes"
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

  const statistics = useMemo(
    () => ({
      total: requests.length,

      pending: requests.filter(
        (request) =>
          request.status ===
          "general_review"
      ).length,

      processed: requests.filter(
        (request) =>
          request.currentDepartment !==
          "REGISSEUR_GENERAL"
      ).length,
    }),
    [requests]
  );

  return (
    <div className="space-y-7">
      {/* En-tête */}
      <section className="rounded-2xl bg-primary p-6 text-primary-foreground shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <Wrench className="mt-1 h-8 w-8" />

          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-primary-foreground/80">
              Régisseur général
            </p>

            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
              Tableau de bord
            </h1>

            <p className="mt-2 max-w-2xl text-primary-foreground/90">
              Étudiez la faisabilité technique des
              demandes transmises par le Service des
              Programmes.
            </p>
          </div>
        </div>
      </section>

      {/* Statistiques */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total assigné
                </p>

                <p className="mt-1 text-3xl font-bold">
                  {statistics.total}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  En attente
                </p>

                <p className="mt-1 text-3xl font-bold">
                  {statistics.pending}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Traitées
                </p>

                <p className="mt-1 text-3xl font-bold">
                  {statistics.processed}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <ClipboardCheck className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Titre du tableau */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">
            Demandes à examiner
          </h2>

          <p className="text-sm text-muted-foreground">
            Tous les comptes Régisseur général voient
            cette même liste.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={refreshing}
          onClick={() =>
            void loadRequests(false)
          }
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${
              refreshing ? "animate-spin" : ""
            }`}
          />

          Actualiser
        </Button>
      </div>

      {/* Tableau */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-primary border-t-transparent" />

              <p className="mt-4 text-muted-foreground">
                Chargement des demandes...
              </p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center">
              <Wrench className="mx-auto h-12 w-12 text-primary/40" />

              <h2 className="mt-4 font-semibold">
                Aucune demande à examiner
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Les demandes validées par le Programme
                apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-muted/70">
                  <tr className="border-b">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase">
                      Demande
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase">
                      Demandeur
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase">
                      Date
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase">
                      Statut
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {requests.map((request) => {
                    return (
                      <tr
                        key={request.id}
                        className="border-b transition-colors last:border-0 hover:bg-muted/40"
                      >
                        <td className="px-5 py-4">
                          <p className="text-xs font-semibold text-primary">
                            {request.reference ||
                              `#${request.id}`}
                          </p>

                          <p className="mt-1 max-w-[240px] font-semibold">
                            {request.eventName}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />

                            <div>
                              <p className="text-sm font-medium">
                                {request.user
                                  ?.username ||
                                  "Membre"}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {request.user?.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />

                            {formatDate(
                              request.submittedAt ||
                                request.createdAt
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <RequestStatusBadge
                            status={request.status}
                          />
                        </td>

                        <td className="px-5 py-4 text-right">
                          <Button asChild size="sm">
                            <Link
                              href={`/espace-membre/regisseur/demandes/${request.id}`}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Voir
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}