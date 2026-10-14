"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Eye,
  FileText,
  FolderKanban,
  Loader2,
  MessageSquareText,
  Plus,
  RefreshCw,
  Send,
  UserRoundCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import api from "@/lib/api";

type ProposalStatus =
  | "SUBMITTED"
  | "ASSIGNED"
  | "ASSISTANT_REVIEW"
  | "SUPERVISOR_REVIEW"
  | "CORRECTION_REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | string;

type ProposalFilter =
  | "ALL"
  | "IN_PROGRESS"
  | "ACTION_REQUIRED"
  | "COMPLETED";

type RawProjectProposal = {
  id: number | string;
  reference?: string | null;
  title?: string | null;
  category?: string | null;
  status?: string | null;

  current_step?: string | null;
  currentStep?: string | null;

  review_comment?: string | null;
  reviewComment?: string | null;

  start_date?: string | null;
  startDate?: string | null;

  end_date?: string | null;
  endDate?: string | null;

  created_at?: string | null;
  createdAt?: string | null;

  updated_at?: string | null;
  updatedAt?: string | null;

  reviewed_at?: string | null;
  reviewedAt?: string | null;

  documentCount?: number | string | null;
  document_count?: number | string | null;
};

type ProjectProposal = {
  id: number;
  reference: string;
  title: string;
  category: string;
  status: ProposalStatus;
  currentStep: string;
  reviewComment: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  reviewedAt: string | null;
  documentCount: number;
};

type ProposalsResponse = {
  success: boolean;
  message?: string;
  data?: RawProjectProposal[];
};

type StatusDefinition = {
  label: string;
  description: string;
  progress: number;
  icon: LucideIcon;
  badgeClass: string;
  iconClass: string;
  progressClass: string;
};

const STATUS_DEFINITIONS: Record<
  string,
  StatusDefinition
> = {
  SUBMITTED: {
    label: "Envoyée",
    description:
      "Votre proposition a bien été reçue.",
    progress: 20,
    icon: Send,
    badgeClass:
      "border-blue-200 bg-blue-50 text-blue-700",
    iconClass:
      "bg-blue-50 text-blue-600",
    progressClass: "bg-blue-500",
  },

  ASSIGNED: {
    label: "Attribuée",
    description:
      "La proposition a été attribuée à un membre de la Direction artistique.",
    progress: 40,
    icon: UserRoundCheck,
    badgeClass:
      "border-violet-200 bg-violet-50 text-violet-700",
    iconClass:
      "bg-violet-50 text-violet-600",
    progressClass: "bg-violet-500",
  },

  ASSISTANT_REVIEW: {
    label: "En analyse",
    description:
      "La Direction artistique analyse actuellement votre proposition.",
    progress: 55,
    icon: Eye,
    badgeClass:
      "border-indigo-200 bg-indigo-50 text-indigo-700",
    iconClass:
      "bg-indigo-50 text-indigo-600",
    progressClass: "bg-indigo-500",
  },

  SUPERVISOR_REVIEW: {
    label: "Décision en cours",
    description:
      "L’analyse est terminée et la proposition attend une décision finale.",
    progress: 80,
    icon: Clock3,
    badgeClass:
      "border-cyan-200 bg-cyan-50 text-cyan-700",
    iconClass:
      "bg-cyan-50 text-cyan-600",
    progressClass: "bg-cyan-500",
  },

  CORRECTION_REQUESTED: {
    label: "Corrections demandées",
    description:
      "La Direction artistique attend des modifications de votre proposition.",
    progress: 65,
    icon: CircleAlert,
    badgeClass:
      "border-amber-200 bg-amber-50 text-amber-700",
    iconClass:
      "bg-amber-50 text-amber-600",
    progressClass: "bg-amber-500",
  },

  APPROVED: {
    label: "Approuvée",
    description:
      "Votre proposition a été approuvée par la Direction artistique.",
    progress: 100,
    icon: BadgeCheck,
    badgeClass:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    iconClass:
      "bg-emerald-50 text-emerald-600",
    progressClass: "bg-emerald-500",
  },

  REJECTED: {
    label: "Non retenue",
    description:
      "Votre proposition n’a pas été retenue.",
    progress: 100,
    icon: XCircle,
    badgeClass:
      "border-red-200 bg-red-50 text-red-700",
    iconClass:
      "bg-red-50 text-red-600",
    progressClass: "bg-red-500",
  },
};

const DEFAULT_STATUS: StatusDefinition = {
  label: "En traitement",
  description:
    "Votre proposition est en cours de traitement.",
  progress: 30,
  icon: Clock3,
  badgeClass:
    "border-slate-200 bg-slate-50 text-slate-700",
  iconClass:
    "bg-slate-50 text-slate-600",
  progressClass: "bg-slate-500",
};

const FILTERS: Array<{
  value: ProposalFilter;
  label: string;
}> = [
  {
    value: "ALL",
    label: "Toutes",
  },
  {
    value: "IN_PROGRESS",
    label: "En cours",
  },
  {
    value: "ACTION_REQUIRED",
    label: "Action requise",
  },
  {
    value: "COMPLETED",
    label: "Terminées",
  },
];

function cleanString(
  value: unknown,
  fallback = ""
) {
  const result = String(value ?? "").trim();
  return result || fallback;
}

function normalizeProposal(
  proposal: RawProjectProposal
): ProjectProposal {
  return {
    id: Number(proposal.id),
    reference: cleanString(
      proposal.reference,
      `PROJET-${proposal.id}`
    ),
    title: cleanString(
      proposal.title,
      "Proposition sans titre"
    ),
    category: cleanString(
      proposal.category,
      "Domaine non renseigné"
    ),
    status: cleanString(
      proposal.status,
      "SUBMITTED"
    ).toUpperCase(),
    currentStep: cleanString(
      proposal.current_step ??
        proposal.currentStep
    ),
    reviewComment:
      cleanString(
        proposal.review_comment ??
          proposal.reviewComment
      ) || null,
    startDate:
      cleanString(
        proposal.start_date ??
          proposal.startDate
      ) || null,
    endDate:
      cleanString(
        proposal.end_date ??
          proposal.endDate
      ) || null,
    createdAt:
      cleanString(
        proposal.created_at ??
          proposal.createdAt
      ) || null,
    updatedAt:
      cleanString(
        proposal.updated_at ??
          proposal.updatedAt
      ) || null,
    reviewedAt:
      cleanString(
        proposal.reviewed_at ??
          proposal.reviewedAt
      ) || null,
    documentCount: Number(
      proposal.documentCount ??
        proposal.document_count ??
        0
    ),
  };
}

function parseDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const dateOnlyMatch = value.match(
    /^(\d{4})-(\d{2})-(\d{2})/
  );

  if (dateOnlyMatch) {
    const [, year, month, day] =
      dateOnlyMatch;

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );
  }

  const date = new Date(
    value.replace(" ", "T")
  );

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function formatDate(
  value?: string | null,
  withTime = false
) {
  const date = parseDate(value);

  if (!date) {
    return "Date non renseignée";
  }

  return date.toLocaleDateString(
    "fr-FR",
    withTime
      ? {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      : {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }
  );
}

function formatPeriod(
  startDate: string | null,
  endDate: string | null
) {
  if (!startDate && !endDate) {
    return "Période non renseignée";
  }

  if (
    startDate &&
    endDate &&
    startDate.slice(0, 10) ===
      endDate.slice(0, 10)
  ) {
    return formatDate(startDate);
  }

  if (startDate && endDate) {
    return `Du ${formatDate(
      startDate
    )} au ${formatDate(endDate)}`;
  }

  return formatDate(
    startDate || endDate
  );
}

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
    ).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return error instanceof Error
    ? error.message
    : "Impossible de charger vos propositions.";
}

function isCompleted(status: string) {
  return (
    status === "APPROVED" ||
    status === "REJECTED"
  );
}

export default function MemberProposalsPage() {
  const [proposals, setProposals] =
    useState<ProjectProposal[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState<
    string | null
  >(null);

  const [filter, setFilter] =
    useState<ProposalFilter>("ALL");

  const loadProposals = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const response =
          await api.get<ProposalsResponse>(
            "/project-proposals/my"
          );

        if (!response.data?.success) {
          throw new Error(
            response.data?.message ||
              "Impossible de charger vos propositions."
          );
        }

        const rows = Array.isArray(
          response.data.data
        )
          ? response.data.data
          : [];

        setProposals(
          rows
            .map(normalizeProposal)
            .filter(
              (proposal) =>
                Number.isInteger(
                  proposal.id
                ) &&
                proposal.id > 0
            )
        );

        if (isRefresh) {
          toast.success(
            "Le suivi a été actualisé."
          );
        }
      } catch (loadError) {
        const message =
          getErrorMessage(loadError);

        setError(message);

        if (isRefresh) {
          toast.error(message);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadProposals();
  }, [loadProposals]);

  const statistics = useMemo(() => {
    return {
      total: proposals.length,
      inProgress: proposals.filter(
        (proposal) =>
          !isCompleted(proposal.status) &&
          proposal.status !==
            "CORRECTION_REQUESTED"
      ).length,
      actionRequired: proposals.filter(
        (proposal) =>
          proposal.status ===
          "CORRECTION_REQUESTED"
      ).length,
      approved: proposals.filter(
        (proposal) =>
          proposal.status === "APPROVED"
      ).length,
    };
  }, [proposals]);

  const filteredProposals = useMemo(() => {
    if (filter === "IN_PROGRESS") {
      return proposals.filter(
        (proposal) =>
          !isCompleted(proposal.status) &&
          proposal.status !==
            "CORRECTION_REQUESTED"
      );
    }

    if (filter === "ACTION_REQUIRED") {
      return proposals.filter(
        (proposal) =>
          proposal.status ===
          "CORRECTION_REQUESTED"
      );
    }

    if (filter === "COMPLETED") {
      return proposals.filter(
        (proposal) =>
          isCompleted(proposal.status)
      );
    }

    return proposals;
  }, [filter, proposals]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <Link
          href="/espace-membre/membre/proposer-projet"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#7d624f] transition hover:text-[#d1965b]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l’espace
        </Link>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={refreshing}
            onClick={() => {
              void loadProposals(true);
            }}
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

      <header className="relative overflow-hidden rounded-[30px] bg-[#3f2c22] p-6 text-white shadow-lg sm:p-9">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#d1965b]/25 blur-3xl" />
        <div className="absolute -bottom-24 left-20 h-52 w-52 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#f0c79f]">
            <FolderKanban className="h-4 w-4" />
            Mes projets
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            Suivi de mes propositions
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
            Consultez l’évolution de vos
            propositions culturelles, les
            étapes déjà réalisées et les
            éventuelles observations de la
            Direction artistique.
          </p>
        </div>
      </header>

      {!loading && proposals.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatisticCard
            label="Propositions"
            value={statistics.total}
            icon={FolderKanban}
            colorClass="bg-[#f7efe7] text-[#b97d47]"
          />

          <StatisticCard
            label="En cours"
            value={statistics.inProgress}
            icon={Clock3}
            colorClass="bg-blue-50 text-blue-600"
          />

          <StatisticCard
            label="Action requise"
            value={statistics.actionRequired}
            icon={AlertCircle}
            colorClass="bg-amber-50 text-amber-600"
          />

          <StatisticCard
            label="Approuvées"
            value={statistics.approved}
            icon={CheckCircle2}
            colorClass="bg-emerald-50 text-emerald-600"
          />
        </section>
      )}

      {loading ? (
        <Card className="rounded-[26px] border-[#eadfd6]">
          <CardContent className="flex min-h-72 items-center justify-center p-8">
            <div className="text-center">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#d1965b]" />

              <p className="mt-4 text-sm text-[#75665d]">
                Chargement de vos
                propositions...
              </p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="rounded-[26px] border-red-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />

            <h2 className="mt-4 text-lg font-bold text-[#3f2c22]">
              Chargement impossible
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm text-[#75665d]">
              {error}
            </p>

            <Button
              type="button"
              onClick={() => {
                void loadProposals();
              }}
              className="mt-6 bg-[#3f2c22] text-white hover:bg-[#2f211a]"
            >
              Réessayer
            </Button>
          </CardContent>
        </Card>
      ) : proposals.length === 0 ? (
        <Card className="rounded-[26px] border-[#eadfd6]">
          <CardContent className="p-8 text-center sm:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f7efe7]">
              <FileText className="h-10 w-10 text-[#d1965b]" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-[#3f2c22]">
              Aucune proposition envoyée
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#75665d]">
              Lorsque vous aurez envoyé une
              proposition de projet, son état
              d’avancement apparaîtra ici.
            </p>

            <Button
              asChild
              className="mt-6 bg-[#d1965b] text-white hover:bg-[#b97d47]"
            >
              <Link href="/espace-membre/membre/proposer-projet/formulaire">
                <Plus className="mr-2 h-4 w-4" />
                Proposer un projet
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <nav
            aria-label="Filtres des propositions"
            className="flex gap-2 overflow-x-auto rounded-2xl border border-[#eadfd6] bg-white p-2"
          >
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() =>
                  setFilter(item.value)
                }
                className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  filter === item.value
                    ? "bg-[#3f2c22] text-white shadow-sm"
                    : "text-[#75665d] hover:bg-[#f7f2ed] hover:text-[#3f2c22]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {filteredProposals.length === 0 ? (
            <Card className="rounded-[26px] border-[#eadfd6]">
              <CardContent className="p-10 text-center">
                <FileText className="mx-auto h-10 w-10 text-[#d1965b]/50" />

                <p className="mt-3 text-sm text-[#75665d]">
                  Aucune proposition dans
                  cette catégorie.
                </p>
              </CardContent>
            </Card>
          ) : (
            <section className="space-y-5">
              {filteredProposals.map(
                (proposal) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                  />
                )
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function StatisticCard({
  label,
  value,
  icon: Icon,
  colorClass,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  colorClass: string;
}) {
  return (
    <Card className="rounded-2xl border-[#eadfd6] bg-white shadow-sm">
      <CardContent className="flex items-center gap-4 p-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colorClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <p className="text-2xl font-bold text-[#3f2c22]">
            {value}
          </p>

          <p className="text-xs font-medium text-[#75665d]">
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ProposalCard({
  proposal,
}: {
  proposal: ProjectProposal;
}) {
  const definition =
    STATUS_DEFINITIONS[proposal.status] ??
    DEFAULT_STATUS;

  const StatusIcon = definition.icon;

  return (
    <article className="overflow-hidden rounded-[26px] border border-[#eadfd6] bg-white shadow-sm">
      <div className="p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div className="flex min-w-0 gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${definition.iconClass}`}
            >
              <StatusIcon className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#f7f2ed] px-2.5 py-1 text-xs font-bold text-[#8a6b55]">
                  {proposal.reference}
                </span>

                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-bold ${definition.badgeClass}`}
                >
                  {definition.label}
                </span>
              </div>

              <h2 className="mt-3 break-words text-lg font-bold text-[#3f2c22] sm:text-xl">
                {proposal.title}
              </h2>

              <p className="mt-1 text-sm text-[#75665d]">
                {proposal.category}
              </p>
            </div>
          </div>

          <div className="shrink-0 text-sm text-[#8c7b70]">
            Envoyée le{" "}
            <span className="font-semibold text-[#554139]">
              {formatDate(proposal.createdAt)}
            </span>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-[#faf7f4] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#9a877a]">
                Étape actuelle
              </p>

              <p className="mt-1 font-semibold text-[#3f2c22]">
                {proposal.currentStep ||
                  definition.description}
              </p>
            </div>

            <span className="shrink-0 text-sm font-bold text-[#3f2c22]">
              {definition.progress} %
            </span>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e8dfd8]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${definition.progressClass}`}
              style={{
                width: `${definition.progress}%`,
              }}
            />
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[10px] font-semibold text-[#9a877a] sm:text-xs">
            <span>Envoyée</span>
            <span>Analyse</span>
            <span>Décision</span>
            <span>Résultat</span>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="flex items-start gap-3 rounded-xl border border-[#eee5de] p-3">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#d1965b]" />

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#9a877a]">
                Période
              </p>

              <p className="mt-1 text-sm font-medium text-[#554139]">
                {formatPeriod(
                  proposal.startDate,
                  proposal.endDate
                )}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-[#eee5de] p-3">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#d1965b]" />

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#9a877a]">
                Documents
              </p>

              <p className="mt-1 text-sm font-medium text-[#554139]">
                {proposal.documentCount}{" "}
                document
                {proposal.documentCount > 1
                  ? "s"
                  : ""}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-[#eee5de] p-3">
            <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-[#d1965b]" />

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#9a877a]">
                Mise à jour
              </p>

              <p className="mt-1 text-sm font-medium text-[#554139]">
                {formatDate(
                  proposal.updatedAt,
                  true
                )}
              </p>
            </div>
          </div>
        </div>

        {proposal.reviewComment && (
          <div
            className={`mt-5 rounded-2xl border p-4 ${
              proposal.status ===
              "CORRECTION_REQUESTED"
                ? "border-amber-200 bg-amber-50"
                : proposal.status ===
                    "REJECTED"
                  ? "border-red-200 bg-red-50"
                  : "border-[#e5d9cf] bg-[#faf7f4]"
            }`}
          >
            <div className="flex items-start gap-3">
              <MessageSquareText
                className={`mt-0.5 h-5 w-5 shrink-0 ${
                  proposal.status ===
                  "CORRECTION_REQUESTED"
                    ? "text-amber-600"
                    : proposal.status ===
                        "REJECTED"
                      ? "text-red-600"
                      : "text-[#d1965b]"
                }`}
              />

              <div>
                <p className="text-sm font-bold text-[#3f2c22]">
                  Message de la Direction
                  artistique
                </p>

                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#66554b]">
                  {proposal.reviewComment}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}