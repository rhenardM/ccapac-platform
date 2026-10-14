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
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  FileSearch,
  Loader2,
  RefreshCw,
  Search,
  UserRound,
  WalletCards,
} from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
  spaceRequestService,
  type SpaceRequest,
} from "@/services/spaceRequestService";

type JourneyStep = {
  label: string;
  shortLabel: string;
  description: string;
  department: string;
};

const JOURNEY_STEPS: JourneyStep[] = [
  { label: "Membre", shortLabel: "Membre", description: "Création et envoi", department: "MEMBER" },
  { label: "Programme", shortLabel: "Programme", description: "Examen initial", department: "PROGRAMME" },
  { label: "Direction artistique", shortLabel: "Artistique", description: "Avis artistique initial", department: "DIRECTION_ARTISTIQUE" },
  { label: "Programme", shortLabel: "Programme", description: "Contrôle de l’avis", department: "PROGRAMME" },
  { label: "Membre", shortLabel: "Membre", description: "Confirmation", department: "MEMBER" },
  { label: "Programme", shortLabel: "Programme", description: "Reprise du dossier", department: "PROGRAMME" },
  { label: "Direction artistique", shortLabel: "Artistique", description: "Validation finale", department: "DIRECTION_ARTISTIQUE" },
  { label: "Communication / Régisseur", shortLabel: "Comm. / Régie", description: "Contrôles parallèles", department: "COMMUNICATION_REGISSEUR" },
  { label: "Programme", shortLabel: "Programme", description: "Synthèse des contrôles", department: "PROGRAMME" },
  { label: "Juridique", shortLabel: "Juridique", description: "Examen juridique", department: "JURIDIQUE" },
  { label: "Finance", shortLabel: "Finance", description: "Préparation de la cotation", department: "FINANCE" },
  { label: "Direction générale", shortLabel: "DG", description: "Approbation de la cotation", department: "DG" },
  { label: "Programme", shortLabel: "Programme", description: "Transmission de la cotation", department: "PROGRAMME" },
  { label: "Membre", shortLabel: "Membre", description: "Paiement", department: "MEMBER" },
  { label: "Programme", shortLabel: "Programme", description: "Contrôle du paiement", department: "PROGRAMME" },
  { label: "Dossier terminé", shortLabel: "Terminé", description: "Clôture", department: "COMPLETED" },
];

const STATUS_STAGE_INDEX: Record<string, number> = {
  draft: 0,
  submitted: 1,
  program_review: 1,
  artistic_initial_review: 2,
  program_review_after_artistic: 3,
  awaiting_member_confirmation: 4,
  correction_requested: 4,
  program_review_after_confirmation: 5,
  artistic_final_review: 6,
  parallel_communication_regisseur_review: 7,
  program_review_after_parallel: 8,
  program_review_after_regisseur_rejection: 8,
  legal_review: 9,
  finance_cotation: 10,
  finance_cotation_revision: 10,
  dg_cotation_review: 11,
  program_review_after_finance: 12,
  awaiting_payment_proof: 13,
  program_payment_review: 14,
  completed: 15,
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon chez le membre",
  submitted: "Demande envoyée au Programme",
  program_review: "Examen par le Programme",
  artistic_initial_review: "Préparation de l’avis artistique",
  program_review_after_artistic: "Avis artistique retourné au Programme",
  awaiting_member_confirmation: "Confirmation attendue du membre",
  correction_requested: "Correction demandée au membre",
  program_review_after_confirmation: "Reprise par le Programme",
  artistic_final_review: "Validation artistique finale",
  parallel_communication_regisseur_review: "Contrôle Communication et Régisseur",
  program_review_after_parallel: "Synthèse par le Programme",
  program_review_after_regisseur_rejection: "Refus du Régisseur examiné par le Programme",
  legal_review: "Examen par le Juridique",
  finance_cotation: "Cotation en préparation chez Finance",
  finance_cotation_revision: "Cotation en révision chez Finance",
  dg_cotation_review: "Cotation en attente de la DG",
  program_review_after_finance: "Cotation approuvée retournée au Programme",
  awaiting_payment_proof: "Paiement attendu du membre",
  program_payment_review: "Paiement contrôlé par le Programme",
  completed: "Demande terminée",
  rejected: "Demande rejetée",
  expired: "Demande expirée",
  stopped_by_member: "Demande arrêtée par le membre",
};

const DEPARTMENT_LABELS: Record<string, string> = {
  MEMBER: "Membre",
  PROGRAMME: "Programme",
  DIRECTION_ARTISTIQUE: "Direction artistique",
  COMMUNICATION: "Communication",
  REGISSEUR_GENERAL: "Régisseur général",
  COMMUNICATION_REGISSEUR: "Communication et Régisseur général",
  JURIDIQUE: "Juridique",
  FINANCE: "Finance",
  DG: "Direction générale",
  COMPLETED: "Processus terminé",
};

function normalize(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function formatDate(value?: string | null) {
  if (!value) return "Date non renseignée";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date non renseignée";
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(value?: number | null) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function requestTitle(request: SpaceRequest) {
  return request.eventName || request.title || "Demande d’espace";
}

function getCurrentIndex(request: SpaceRequest) {
  const status = normalize(request.status);
  if (STATUS_STAGE_INDEX[status] !== undefined) {
    return STATUS_STAGE_INDEX[status];
  }

  const department = String(
    request.assignedDepartment || request.currentDepartment || ""
  ).toUpperCase();

  const reverseIndex = [...JOURNEY_STEPS]
    .reverse()
    .findIndex((step) => step.department === department);

  return reverseIndex >= 0
    ? JOURNEY_STEPS.length - 1 - reverseIndex
    : 0;
}

function getCurrentDepartment(request: SpaceRequest) {
  const index = getCurrentIndex(request);
  const raw = String(
    request.assignedDepartment ||
      request.currentDepartment ||
      JOURNEY_STEPS[index]?.department ||
      ""
  ).toUpperCase();

  return DEPARTMENT_LABELS[raw] || JOURNEY_STEPS[index]?.label || "Non renseigné";
}

function TrackingLine({ request }: { request: SpaceRequest }) {
  const currentIndex = getCurrentIndex(request);
  const normalizedStatus = normalize(request.status);
  const isClosedWithProblem = ["rejected", "expired", "stopped_by_member"].includes(normalizedStatus);

  return (
    <div className="overflow-x-auto pb-4">
      <div className="min-w-[2450px] px-3 py-5">
        <div className="flex items-start">
          {JOURNEY_STEPS.map((step, index) => {
            const completed = !isClosedWithProblem && index < currentIndex;
            const active = index === currentIndex;
            const pending = index > currentIndex;

            return (
              <div key={`${step.department}-${index}`} className="relative flex w-[150px] shrink-0 flex-col items-center text-center">
                {index < JOURNEY_STEPS.length - 1 && (
                  <div
                    className={`absolute left-1/2 top-5 h-1 w-full ${
                      completed ? "bg-green-500" : active ? "bg-[#D1965B]/50" : "bg-slate-200"
                    }`}
                  />
                )}

                <div
                  className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-full border-4 border-white shadow-sm ${
                    completed
                      ? "bg-green-600 text-white"
                      : active && isClosedWithProblem
                        ? "bg-red-600 text-white ring-4 ring-red-100"
                        : active
                          ? "bg-[#D1965B] text-white ring-4 ring-[#D1965B]/20"
                          : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {completed ? (
                    <Check className="h-5 w-5" />
                  ) : active ? (
                    isClosedWithProblem ? <AlertCircle className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </div>

                <p className={`mt-3 text-sm font-bold ${active ? "text-[#5C4033]" : completed ? "text-green-700" : "text-slate-400"}`}>
                  {step.shortLabel}
                </p>
                <p className="mt-1 max-w-[135px] text-xs leading-4 text-muted-foreground">
                  {step.description}
                </p>
                <span
                  className={`mt-2 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    completed
                      ? "bg-green-50 text-green-700"
                      : active && isClosedWithProblem
                        ? "bg-red-50 text-red-700"
                        : active
                          ? "bg-[#D1965B]/10 text-[#9B6438]"
                          : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {completed ? "Terminé" : active ? (isClosedWithProblem ? "Arrêté" : "Étape actuelle") : pending ? "En attente" : "En attente"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function DGTrackingPage() {
  const [requests, setRequests] = useState<SpaceRequest[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (notify = false) => {
    try {
      setError(null);
      const data = await spaceRequestService.getDGRequests();
      const safe = Array.isArray(data) ? data : [];
      setRequests(safe);
      setSelectedId((current) => current ?? safe[0]?.id ?? null);
      if (notify) toast.success("Suivi actualisé");
    } catch (err: unknown) {
      console.error("DG tracking error:", err);
      const message = err instanceof Error ? err.message : "Impossible de charger le suivi des demandes.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return requests;
    return requests.filter((request) =>
      [request.reference, requestTitle(request), request.user?.username, request.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [requests, search]);

  const selected = useMemo(
    () => requests.find((request) => request.id === selectedId) || null,
    [requests, selectedId]
  );

  if (loading) {
    return (
      <div className="flex min-h-[520px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#D1965B]" />
          <p className="mt-4 font-semibold text-[#5C4033]">Chargement du suivi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <Button asChild variant="ghost" className="mb-2 -ml-3 text-[#8B5E3C]">
            <Link href="/espace-membre/dg">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au tableau de bord
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-[#5C4033]">Suivi du parcours des demandes</h1>
          <p className="mt-2 text-muted-foreground">
            Visualisez en temps réel le déplacement de chaque dossier entre les départements.
          </p>
        </div>

        <Button
          variant="outline"
          disabled={refreshing}
          onClick={() => {
            setRefreshing(true);
            void load(true);
          }}
          className="w-fit border-[#D1965B]/30 text-[#8B5E3C]"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="h-fit border-[#D1965B]/20 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#5C4033]">Choisir une demande</CardTitle>
            <div className="relative pt-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-[15%] text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Référence ou événement..."
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="max-h-[620px] space-y-2 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Aucune demande trouvée.</p>
            ) : (
              filtered.map((request) => {
                const active = request.id === selectedId;
                return (
                  <button
                    type="button"
                    key={request.id}
                    onClick={() => setSelectedId(request.id)}
                    className={`w-full rounded-xl border p-3 text-left transition-all ${
                      active
                        ? "border-[#D1965B] bg-[#D1965B]/10 shadow-sm"
                        : "border-slate-200 hover:border-[#D1965B]/40 hover:bg-[#FFFDFC]"
                    }`}
                  >
                    <p className="text-xs font-bold uppercase tracking-wide text-[#D1965B]">
                      {request.reference || `Demande #${request.id}`}
                    </p>
                    <p className="mt-1 line-clamp-1 font-semibold text-[#5C4033]">
                      {requestTitle(request)}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Position : {getCurrentDepartment(request)}
                    </p>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        {!selected ? (
          <Card className="border-dashed">
            <CardContent className="py-20 text-center">
              <FileSearch className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 font-semibold text-[#5C4033]">Sélectionnez une demande</p>
            </CardContent>
          </Card>
        ) : (
          <div className="min-w-0 space-y-5">
            <Card className="overflow-hidden border-[#D1965B]/20 shadow-sm">
              <div className="bg-gradient-to-r from-[#D1965B] to-[#9B6438] p-6 text-white">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-white/70">
                      {selected.reference || `Demande #${selected.id}`}
                    </p>
                    <h2 className="mt-2 text-2xl font-bold">{requestTitle(selected)}</h2>
                    <p className="mt-2 text-sm text-white/80">
                      Mise à jour : {formatDate(selected.updatedAt || selected.createdAt)}
                    </p>
                  </div>
                  <Button asChild className="w-fit bg-white text-[#8B5E3C] hover:bg-white/90">
                    <Link href={`/espace-membre/dg/demandes/${selected.id}`}>
                      Ouvrir le dossier
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <CardContent className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl bg-[#FFF8F1] p-4">
                  <Building2 className="h-5 w-5 text-[#D1965B]" />
                  <p className="mt-2 text-xs uppercase text-muted-foreground">Position actuelle</p>
                  <p className="mt-1 font-bold text-[#5C4033]">{getCurrentDepartment(selected)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <Clock3 className="h-5 w-5 text-blue-600" />
                  <p className="mt-2 text-xs uppercase text-muted-foreground">Statut</p>
                  <p className="mt-1 font-bold text-[#5C4033]">
                    {STATUS_LABELS[normalize(selected.status)] || selected.status}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <UserRound className="h-5 w-5 text-violet-600" />
                  <p className="mt-2 text-xs uppercase text-muted-foreground">Demandeur</p>
                  <p className="mt-1 font-bold text-[#5C4033]">
                    {selected.user?.username || "Non renseigné"}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <WalletCards className="h-5 w-5 text-green-600" />
                  <p className="mt-2 text-xs uppercase text-muted-foreground">Cotation</p>
                  <p className="mt-1 font-bold text-[#5C4033]">
                    {formatAmount(selected.paymentAmount)} USD
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-[#D1965B]/20 bg-white shadow-sm">
              <CardHeader className="border-b border-[#D1965B]/10">
                <CardTitle className="flex items-center gap-2 text-xl text-[#5C4033]">
                  <CheckCircle2 className="h-5 w-5 text-[#D1965B]" />
                  Trajet de la demande
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Faites défiler horizontalement pour consulter toutes les étapes.
                </p>
              </CardHeader>
              <CardContent className="p-3 sm:p-5">
                <TrackingLine request={selected} />
              </CardContent>
            </Card>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-xl border bg-white p-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white">
                  <Check className="h-4 w-4" />
                </span>
                <div><p className="font-semibold text-green-700">Terminé</p><p className="text-xs text-muted-foreground">Étape déjà validée</p></div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border bg-white p-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D1965B] text-white">
                  <Clock3 className="h-4 w-4" />
                </span>
                <div><p className="font-semibold text-[#9B6438]">Étape actuelle</p><p className="text-xs text-muted-foreground">Département responsable</p></div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border bg-white p-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Circle className="h-4 w-4" />
                </span>
                <div><p className="font-semibold text-slate-500">En attente</p><p className="text-xs text-muted-foreground">Étape à venir</p></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}