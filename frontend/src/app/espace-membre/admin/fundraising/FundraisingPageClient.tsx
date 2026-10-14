"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  Bell,
  CheckCircle2,
  Clock3,
  CreditCard,
  HandCoins,
  Layers3,
  Loader2,
  RefreshCw,
  Users,
  XCircle,
} from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { useAdminFundraisingQuery } from "@/hooks/useAdminDashboardQuery";
import type {
  AdminFundraisingDonation,
  FundraisingDonationStatus,
  FundraisingPaymentMethod,
} from "@/services/adminService";

const DONATIONS_PER_PAGE = 10;

const statusLabels: Record<FundraisingDonationStatus, string> = {
  pending: "En attente",
  succeeded: "Confirmé",
  failed: "Échoué",
  cancelled: "Annulé",
  refunded: "Remboursé",
};

const statusClasses: Record<FundraisingDonationStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  succeeded: "bg-green-50 text-green-700 border-green-100",
  failed: "bg-red-50 text-red-700 border-red-100",
  cancelled: "bg-slate-50 text-slate-700 border-slate-100",
  refunded: "bg-blue-50 text-blue-700 border-blue-100",
};

const notificationLabels: Record<
  AdminFundraisingDonation["notification_status"],
  string
> = {
  none: "Non configuré",
  pending: "En attente",
  sending: "En cours",
  sent: "Envoyé",
  failed: "Échec",
  skipped: "Non configuré",
};

function formatMoney(value: number, currency: string) {
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
  }).format(value)} ${currency}`;
}

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function donationStatusIcon(status: FundraisingDonationStatus) {
  if (status === "succeeded") return CheckCircle2;
  if (status === "pending") return Clock3;
  return XCircle;
}

function paginationItems(currentPage: number, totalPages: number) {
  const pages = new Set([1, totalPages]);

  for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
    if (page >= 1 && page <= totalPages) {
      pages.add(page);
    }
  }

  const sortedPages = Array.from(pages).sort((a, b) => a - b);
  const items: Array<number | "ellipsis"> = [];

  sortedPages.forEach((page, index) => {
    const previousPage = sortedPages[index - 1];

    if (previousPage && page - previousPage > 1) {
      items.push("ellipsis");
    }

    items.push(page);
  });

  return items;
}

function notificationClassName(
  status: AdminFundraisingDonation["notification_status"]
) {
  if (status === "sent") return "bg-green-50 text-green-700 border-green-100";
  if (status === "failed") return "bg-red-50 text-red-700 border-red-100";
  return "bg-slate-50 text-slate-700 border-slate-100";
}

export function FundraisingPageClient() {
  const [status, setStatus] = useState<FundraisingDonationStatus | "all">("all");
  const [paymentMethod, setPaymentMethod] = useState<
    FundraisingPaymentMethod | "all"
  >("all");
  const [tierId, setTierId] = useState<string | "all" | "unassigned">("all");
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch, isFetching } =
    useAdminFundraisingQuery({
      status,
      payment_method: paymentMethod,
      tier_id: tierId,
      page,
      per_page: DONATIONS_PER_PAGE,
    });

  const donations = data?.donations ?? [];
  const currency = data?.campaign.currency || "USD";
  const progress = Math.min(Math.max(data?.stats.progress_percent || 0, 0), 100);
  const pagination = data?.pagination;

  useEffect(() => {
    setPage(1);
  }, [status, paymentMethod, tierId]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Suivi des dons
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Suivez la collecte, les paiements confirmés et les notifications
            envoyées.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-white px-4 py-2 text-sm font-bold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Actualiser
        </button>
      </div>

      {isError && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5" />
          <p className="text-sm">
            Impossible de charger les dons.
            {error && (
              <span className="mt-1 block text-xs opacity-80">
                {error.message}
              </span>
            )}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Collecté"
          value={
            isLoading
              ? "..."
              : formatMoney(data?.stats.raised_amount || 0, currency)
          }
          icon={Banknote}
        />
        <MetricCard
          label="Objectif"
          value={
            isLoading
              ? "..."
              : formatMoney(data?.campaign.goal_amount || 0, currency)
          }
          icon={HandCoins}
        />
        <MetricCard
          label="Dons confirmés"
          value={isLoading ? "..." : String(data?.stats.succeeded_donations_count || 0)}
          icon={CheckCircle2}
        />
        <MetricCard
          label="Donateurs"
          value={isLoading ? "..." : String(data?.stats.unique_donors_count || 0)}
          icon={Users}
        />
      </div>

      <Card className="border-none bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="mb-3 flex items-center justify-between text-sm font-semibold text-muted-foreground">
            <span>Progression de la collecte</span>
            <span>{isLoading ? "..." : `${progress.toFixed(1)}%`}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.max(progress, data ? 2 : 0)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-none bg-white shadow-sm">
        <CardHeader className="border-b border-gray-50 bg-gray-50/50 px-6 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-base font-semibold">
              Donations récentes
            </CardTitle>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(value as FundraisingDonationStatus | "all")
                }
              >
                <SelectTrigger className="w-full bg-white sm:w-44">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={paymentMethod}
                onValueChange={(value) =>
                  setPaymentMethod(value as FundraisingPaymentMethod | "all")
                }
              >
                <SelectTrigger className="w-full bg-white sm:w-48">
                  <SelectValue placeholder="Moyen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les moyens</SelectItem>
                  <SelectItem value="stripe">Carte bancaire</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="pawapay">Mobile Money</SelectItem>
                </SelectContent>
              </Select>

              <Select value={tierId} onValueChange={setTierId}>
                <SelectTrigger className="w-full bg-white sm:w-56">
                  <SelectValue placeholder="Palier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les paliers</SelectItem>
                  {(data?.tiers ?? []).map((tier) => (
                    <SelectItem key={tier.id} value={tier.id}>
                      {tier.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="unassigned">Sans palier</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Chargement des dons...
              </p>
            </div>
          ) : donations.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
                <HandCoins className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium text-foreground">
                Aucun don trouvé
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Les dons correspondant aux filtres apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {donations.map((donation) => (
                <DonationRow key={donation.id} donation={donation} />
              ))}
            </div>
          )}
        </CardContent>

        {pagination && pagination.total_count > 0 && (
          <div className="flex flex-col gap-4 border-t border-gray-100 bg-gray-50/60 px-6 py-4 text-sm xl:flex-row xl:items-center xl:justify-between">
            <p className="font-medium text-muted-foreground">
              Page {pagination.page} sur {pagination.total_pages} ·{" "}
              {pagination.total_count} don
              {pagination.total_count > 1 ? "s" : ""}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-wrap items-center gap-1.5">
                {paginationItems(
                  pagination.page,
                  pagination.total_pages
                ).map((item, index) =>
                  item === "ellipsis" ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-2 text-xs font-bold text-muted-foreground"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      disabled={item === pagination.page || isFetching}
                      onClick={() => setPage(item)}
                      aria-current={
                        item === pagination.page ? "page" : undefined
                      }
                      className={`grid h-9 min-w-9 place-items-center rounded-md border px-3 text-xs font-bold transition ${
                        item === pagination.page
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-white text-foreground hover:bg-muted"
                      } disabled:cursor-not-allowed disabled:opacity-70`}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex">
              <button
                type="button"
                disabled={!pagination.has_previous_page || isFetching}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Précédent
              </button>
              <button
                type="button"
                disabled={!pagination.has_next_page || isFetching}
                onClick={() => setPage((current) => current + 1)}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Suivant
                <ArrowRight className="h-4 w-4" />
              </button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-none bg-white shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <div className="mt-1 text-2xl font-bold">{value}</div>
          </div>
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DonationRow({ donation }: { donation: AdminFundraisingDonation }) {
  const StatusIcon = donationStatusIcon(donation.status);

  return (
    <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={statusClasses[donation.status]}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {statusLabels[donation.status]}
          </Badge>
          <Badge variant="outline" className="bg-white">
            <CreditCard className="mr-1 h-3 w-3" />
            {donation.payment_method_label}
          </Badge>
          <Badge variant="outline" className="bg-secondary/5 text-primary">
            <Layers3 className="mr-1 h-3 w-3" />
            {donation.tier_name}
          </Badge>
        </div>
        <p className="mt-3 truncate text-sm font-bold text-foreground">
          {donation.donor.name || "Donateur"}
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {donation.donor.email}
          {donation.donor.phone ? ` · ${donation.donor.phone}` : ""}
        </p>
        {donation.donor_is_member !== null && (
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {donation.donor_is_member ? "Membre" : "Invité"}
          </p>
        )}
        {donation.tier_range && (
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            Palier: {donation.tier_range}
          </p>
        )}
      </div>

      <div>
        <p className="text-lg font-bold text-foreground">
          {formatMoney(donation.amount, donation.currency)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Créé le {formatDate(donation.created_at)}
        </p>
        {donation.succeeded_at && (
          <p className="mt-1 text-xs text-green-700">
            Confirmé le {formatDate(donation.succeeded_at)}
          </p>
        )}
      </div>

      <div className="space-y-3 lg:text-right">
        <NotificationStatus
          label="Email admin"
          status={donation.notification_status}
          notifiedAt={donation.notified_at}
        />
        <NotificationStatus
          label="Email donateur"
          status={donation.donor_notification_status}
          notifiedAt={donation.donor_notified_at}
        />
      </div>
    </div>
  );
}

function NotificationStatus({
  label,
  status,
  notifiedAt,
}: {
  label: string;
  status: AdminFundraisingDonation["notification_status"];
  notifiedAt: string | null;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      <Badge variant="outline" className={notificationClassName(status)}>
        <Bell className="mr-1 h-3 w-3" />
        {notificationLabels[status]}
      </Badge>
      {notifiedAt && (
        <p className="mt-1 text-xs text-muted-foreground">
          {formatDate(notifiedAt)}
        </p>
      )}
    </div>
  );
}
