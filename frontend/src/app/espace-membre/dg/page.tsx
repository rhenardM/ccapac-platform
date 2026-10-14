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
  BadgeDollarSign,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Route,
} from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  spaceRequestService,
  type SpaceRequest,
} from "@/services/spaceRequestService";

function formatAmount(
  amount?: number | null
): string {
  const numericAmount =
    Number(amount || 0);

  return new Intl.NumberFormat(
    "fr-FR",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  ).format(numericAmount);
}

function formatDate(
  value?: string | null
): string {
  if (!value) {
    return "Date non renseignée";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Date non renseignée";
  }

  return date.toLocaleDateString(
    "fr-FR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function getRequestTitle(
  request: SpaceRequest
): string {
  return (
    request.eventName ||
    request.title ||
    "Demande d’espace"
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  if (
    status ===
    "dg_cotation_review"
  ) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
        <Clock3 className="h-3.5 w-3.5" />

        En attente de la DG
      </span>
    );
  }

  if (
    status ===
    "finance_cotation_revision"
  ) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
        <RotateCcw className="h-3.5 w-3.5" />

        Révision par Finance
      </span>
    );
  }

  if (
    status ===
    "program_review_after_finance"
  ) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
        <CheckCircle2 className="h-3.5 w-3.5" />

        Cotation approuvée
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
      En traitement
    </span>
  );
}

interface StatisticCardProps {
  title: string;
  description: string;
  value: number;
  icon: typeof FileText;
  iconClassName: string;
  iconBackground: string;
  valueClassName?: string;
}

function StatisticCard({
  title,
  description,
  value,
  icon: Icon,
  iconClassName,
  iconBackground,
  valueClassName = "text-[#5C4033]",
}: StatisticCardProps) {
  return (
    <Card className="overflow-hidden border-[#D1965B]/20 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#5C4033]/70">
              {title}
            </p>

            <p
              className={`mt-3 text-4xl font-bold ${valueClassName}`}
            >
              {value}
            </p>

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          </div>

          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBackground}`}
          >
            <Icon
              className={`h-6 w-6 ${iconClassName}`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DGDashboard() {
  const [
    requests,
    setRequests,
  ] = useState<SpaceRequest[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );

  const loadRequests =
    useCallback(
      async (
        showSuccess = false
      ) => {
        try {
          setError(null);

          const data =
            await spaceRequestService
              .getDGRequests();

          setRequests(
            Array.isArray(data)
              ? data
              : []
          );

          if (showSuccess) {
            toast.success(
              "Tableau de bord actualisé"
            );
          }
        } catch (err: unknown) {
          console.error(
            "DG dashboard error:",
            err
          );

          const message =
            err instanceof Error
              ? err.message
              : "Impossible de charger les demandes.";

          setError(message);

          toast.error(message);
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

  const handleRefresh =
    async () => {
      if (refreshing) {
        return;
      }

      setRefreshing(true);

      await loadRequests(true);
    };

  const pendingRequests =
    useMemo(
      () =>
        requests.filter(
          (request) =>
            request.status ===
            "dg_cotation_review"
        ),
      [requests]
    );

  const financeRevisions =
    useMemo(
      () =>
        requests.filter(
          (request) =>
            request.status ===
            "finance_cotation_revision"
        ),
      [requests]
    );

  const approvedQuotations =
    useMemo(
      () =>
        requests.filter(
          (request) =>
            request.dgReviewState ===
              "approved" ||
            request.status ===
              "program_review_after_finance"
        ),
      [requests]
    );

  const totalPendingAmount =
    useMemo(
      () =>
        pendingRequests.reduce(
          (
            total,
            request
          ) =>
            total +
            Number(
              request.paymentAmount ||
                0
            ),
          0
        ),
      [pendingRequests]
    );

  const priorityRequests =
    useMemo(
      () =>
        [...pendingRequests]
          .sort(
            (a, b) =>
              new Date(
                a.updatedAt ||
                  a.createdAt
              ).getTime() -
              new Date(
                b.updatedAt ||
                  b.createdAt
              ).getTime()
          )
          .slice(0, 6),
      [pendingRequests]
    );

  const recentRequests =
    useMemo(
      () =>
        [...requests]
          .sort(
            (a, b) =>
              new Date(
                b.updatedAt ||
                  b.createdAt
              ).getTime() -
              new Date(
                a.updatedAt ||
                  a.createdAt
              ).getTime()
          )
          .slice(0, 5),
      [requests]
    );

  if (loading) {
    return (
      <div className="flex min-h-[520px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D1965B]/10">
            <Loader2 className="h-8 w-8 animate-spin text-[#D1965B]" />
          </div>

          <p className="mt-4 font-semibold text-[#5C4033]">
            Chargement du tableau de bord
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Récupération des demandes...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-10">
      {/* En-tête */}

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#D1965B] via-[#C4864E] to-[#9C6236] px-6 py-8 text-white shadow-lg sm:px-8">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10" />

        <div className="absolute -bottom-24 right-32 h-56 w-56 rounded-full bg-black/5" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
              <ShieldCheck className="h-4 w-4" />

              Espace sécurisé de la Direction générale
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Tableau de bord DG
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-white/85 sm:text-base">
              Suivez toutes les demandes
              d’espace et approuvez les
              cotations financières avant leur
              transmission au Service des
              Programmes.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            

            <Button
              type="button"
              variant="secondary"
              disabled={refreshing}
              onClick={
                handleRefresh
              }
              className="bg-white text-[#8B572F] hover:bg-white/90"
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
      </section>

      {/* Message d’erreur */}

      {error && (
        <div
          role="alert"
          className="flex flex-col justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center"
        >
          <div>
            <p className="font-semibold text-red-800">
              Impossible de charger certaines données
            </p>

            <p className="mt-1 text-sm text-red-700">
              {error}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setRefreshing(true);
              void loadRequests();
            }}
            className="border-red-200 text-red-700 hover:bg-red-100"
          >
            Réessayer
          </Button>
        </div>
      )}

      {/* Statistiques */}

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[#5C4033]">
            Vue d’ensemble
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Situation actuelle du circuit de validation.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatisticCard
            title="Total des demandes"
            description="Toutes les demandes enregistrées"
            value={requests.length}
            icon={FileText}
            iconClassName="text-[#D1965B]"
            iconBackground="bg-[#D1965B]/10"
          />

          <StatisticCard
            title="Cotations à approuver"
            description="Décisions DG actuellement requises"
            value={
              pendingRequests.length
            }
            icon={Clock3}
            iconClassName="text-amber-600"
            iconBackground="bg-amber-50"
            valueClassName="text-amber-600"
          />

          <StatisticCard
            title="Révisions Finance"
            description="Cotations retournées pour modification"
            value={
              financeRevisions.length
            }
            icon={RotateCcw}
            iconClassName="text-blue-600"
            iconBackground="bg-blue-50"
            valueClassName="text-blue-600"
          />

          <StatisticCard
            title="Cotations approuvées"
            description="Cotations déjà validées par la DG"
            value={
              approvedQuotations.length
            }
            icon={FileCheck2}
            iconClassName="text-green-600"
            iconBackground="bg-green-50"
            valueClassName="text-green-600"
          />
        </div>
      </section>

      {/* Montant en attente */}

      <section className="grid gap-5 xl:grid-cols-3">
        <Card className="border-[#D1965B]/20 bg-gradient-to-br from-[#FFF9F3] to-white shadow-sm xl:col-span-1">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-[#5C4033]/70">
                  Montant total à examiner
                </p>

                <p className="mt-3 text-3xl font-bold text-[#5C4033]">
                  {formatAmount(
                    totalPendingAmount
                  )}{" "}
                  <span className="text-lg text-[#D1965B]">
                    USD
                  </span>
                </p>

                <p className="mt-2 text-xs text-muted-foreground">
                  Somme des cotations actuellement en attente de décision.
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50">
                <BadgeDollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demandes prioritaires */}

        <Card className="overflow-hidden border-[#D1965B]/20 bg-white shadow-sm xl:col-span-2">
          <CardHeader className="border-b border-[#D1965B]/10 px-6 py-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <CardTitle className="text-xl text-[#5C4033]">
                  Cotations prioritaires
                </CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  Demandes nécessitant une décision de la Direction générale.
                </p>
              </div>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-[#D1965B]/30 text-[#9B6438] hover:bg-[#D1965B]/10"
              >
                <Link href="/espace-membre/dg/demandes">
                  Voir toutes

                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {priorityRequests.length ===
            0 ? (
              <div className="px-6 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
                  <CheckCircle2 className="h-7 w-7 text-green-600" />
                </div>

                <h3 className="mt-4 font-bold text-[#5C4033]">
                  Aucune cotation en attente
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  Toutes les cotations reçues ont été examinées par la Direction générale.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#D1965B]/10">
                {priorityRequests.map(
                  (request) => (
                    <Link
                      key={
                        request.id
                      }
                      href={`/espace-membre/dg/demandes/${request.id}`}
                      className="group block px-6 py-5 transition-colors hover:bg-[#D1965B]/5"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-[#5C4033]">
                              {request.reference ||
                                `Demande #${request.id}`}
                            </p>

                            <StatusBadge
                              status={
                                request.status
                              }
                            />
                          </div>

                          <p className="mt-2 truncate font-medium text-slate-800">
                            {getRequestTitle(
                              request
                            )}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            Mise à jour le{" "}
                            {formatDate(
                              request.updatedAt ||
                                request.createdAt
                            )}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center justify-between gap-5 sm:justify-end">
                          <div className="text-left sm:text-right">
                            <p className="text-xs text-muted-foreground">
                              Montant proposé
                            </p>

                            <p className="mt-1 text-lg font-bold text-[#5C4033]">
                              {formatAmount(
                                request.paymentAmount
                              )}{" "}
                              USD
                            </p>
                          </div>

                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D1965B]/10 text-[#D1965B] transition-all group-hover:bg-[#D1965B] group-hover:text-white">
                            <ArrowRight className="h-5 w-5" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Activités récentes */}

      <Card className="overflow-hidden border-[#D1965B]/20 bg-white shadow-sm">
        <CardHeader className="border-b border-[#D1965B]/10 px-6 py-5">
          <CardTitle className="text-xl text-[#5C4033]">
            Demandes récemment mises à jour
          </CardTitle>

          <p className="text-sm text-muted-foreground">
            Aperçu des derniers dossiers ayant connu une modification.
          </p>
        </CardHeader>

        <CardContent className="p-0">
          {recentRequests.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />

              <p className="mt-4 font-semibold text-[#5C4033]">
                Aucune demande disponible
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentRequests.map(
                (request) => (
                  <Link
                    key={request.id}
                    href={`/espace-membre/dg/demandes/${request.id}`}
                    className="flex flex-col justify-between gap-4 px-6 py-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[#5C4033]">
                        {request.reference ||
                          `Demande #${request.id}`}
                      </p>

                      <p className="mt-1 truncate text-sm text-slate-700">
                        {getRequestTitle(
                          request
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <StatusBadge
                        status={
                          request.status
                        }
                      />

                      <span className="text-xs text-muted-foreground">
                        {formatDate(
                          request.updatedAt ||
                            request.createdAt
                        )}
                      </span>

                      <ArrowRight className="h-4 w-4 text-[#D1965B]" />
                    </div>
                  </Link>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}