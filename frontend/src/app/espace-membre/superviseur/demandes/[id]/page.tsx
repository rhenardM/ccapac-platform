"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  Circle,
  Clock3,
  Download,
  FileText,
  History,
  Mail,
  MapPin,
  Phone,
  Route,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import RequestStatusBadge from "@/components/space-requests/RequestStatusBadge";
import type {
  SpaceRequest,
  SpaceRequestDocument,
  ValidationHistory,
} from "@/services/spaceRequestService";
import {
  getDocumentDownloadUrl,
  supervisorService,
} from "../../supervisorService";

const spaces: Record<number, string> = {
  1: "Grand théâtre",
  2: "Petit théâtre",
  3: "Salle de danse",
  4: "Hall",
  5: "Atrium",
  6: "Cafétéria",
  7: "Salle de musique 1",
  8: "Salle de musique 2",
  9: "Parking",
  10: "Esplanade principale",
  11: "Esplanade secondaire 1",
  12: "Esplanade secondaire 2",
};

const documentLabels: Record<string, string> = {
  INITIAL_REQUEST: "Formulaire initial",
  ARTISTIC_OPINION: "Charte institutionnelle",
  LEGAL_DOCUMENT: "Protocole d’accord",
  FINANCE_QUOTE: "Cotation financière",
  PAYMENT_PROOF: "Preuve de paiement",
};

const departmentLabels: Record<string, string> = {
  MEMBER: "Membre",
  PROGRAMME: "Service des Programmes",
  REGISSEUR_GENERAL: "Régisseur général",
  DIRECTION_ARTISTIQUE: "Direction artistique",
  COMMUNICATION: "Communication",
  COMMUNICATION_REGISSEUR:
    "Communication et Régisseur général",
  JURIDIQUE: "Service juridique",
  FINANCE: "Service des Finances",
  DG: "Direction générale",
  DIRECTION_GENERALE: "Direction générale",
  COMPLETED: "Dossier terminé",
};

type JourneyStep = {
  title: string;
  description: string;
  department: string;
};

const journeySteps: JourneyStep[] = [
  { title: "Membre", description: "Création et envoi", department: "MEMBER" },
  { title: "Programme", description: "Examen initial", department: "PROGRAMME" },
  { title: "Direction artistique", description: "Avis artistique initial", department: "DIRECTION_ARTISTIQUE" },
  { title: "Programme", description: "Contrôle de l’avis", department: "PROGRAMME" },
  { title: "Membre", description: "Confirmation", department: "MEMBER" },
  { title: "Programme", description: "Reprise du dossier", department: "PROGRAMME" },
  { title: "Direction artistique", description: "Validation finale", department: "DIRECTION_ARTISTIQUE" },
  { title: "Communication / Régisseur", description: "Contrôles parallèles", department: "COMMUNICATION_REGISSEUR" },
  { title: "Programme", description: "Synthèse", department: "PROGRAMME" },
  { title: "Juridique", description: "Examen juridique", department: "JURIDIQUE" },
  { title: "Finance", description: "Préparation de la cotation", department: "FINANCE" },
  { title: "Direction générale", description: "Approbation de la cotation", department: "DG" },
  { title: "Programme", description: "Transmission de la cotation", department: "PROGRAMME" },
  { title: "Membre", description: "Paiement", department: "MEMBER" },
  { title: "Programme", description: "Contrôle du paiement", department: "PROGRAMME" },
  { title: "Terminé", description: "Clôture du dossier", department: "COMPLETED" },
];

const statusStageIndex: Record<string, number> = {
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

const statusLabels: Record<string, string> = {
  draft: "Brouillon chez le membre",
  submitted: "Demande envoyée au Programme",
  program_review: "Examen par le Programme",
  artistic_initial_review: "Examen par la Direction artistique",
  program_review_after_artistic: "Retour au Programme",
  awaiting_member_confirmation: "Confirmation attendue du membre",
  correction_requested: "Correction demandée au membre",
  program_review_after_confirmation: "Reprise par le Programme",
  artistic_final_review: "Validation artistique finale",
  parallel_communication_regisseur_review: "Contrôle Communication et Régisseur",
  program_review_after_parallel: "Synthèse par le Programme",
  program_review_after_regisseur_rejection: "Réexamen par le Programme",
  legal_review: "Examen par le Service juridique",
  finance_cotation: "Cotation en préparation chez Finance",
  finance_cotation_revision: "Cotation en révision chez Finance",
  dg_cotation_review: "Cotation en attente de la Direction générale",
  program_review_after_finance: "Cotation retournée au Programme",
  awaiting_payment_proof: "Paiement attendu du membre",
  program_payment_review: "Paiement contrôlé par le Programme",
  completed: "Demande terminée",
  rejected: "Demande rejetée",
  expired: "Demande expirée",
  stopped_by_member: "Demande arrêtée par le membre",
};

function normalizeStatus(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function getCurrentStage(status?: string | null) {
  return statusStageIndex[normalizeStatus(status)] ?? 0;
}

function requestIsStopped(status?: string | null) {
  const value = normalizeStatus(status);
  return value.includes("rejected") || value === "expired" || value === "stopped_by_member";
}

function RequestJourney({ request }: { request: SpaceRequest }) {
  const currentStage = getCurrentStage(request.status);
  const stopped = requestIsStopped(request.status);

  return (
    <section className="overflow-hidden rounded-2xl border border-[#D1965B]/15 bg-white shadow-sm">
      <div className="border-b border-[#D1965B]/10 px-6 py-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Route className="h-5 w-5 text-[#D1965B]" />
              <h2 className="text-xl font-bold text-[#5C4033]">Parcours de la demande</h2>
            </div>
            <p className="mt-1 text-sm text-[#5C4033]/60">
              Suivi du dossier depuis sa création jusqu’à sa clôture.
            </p>
          </div>

          <div className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
            stopped
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-[#D1965B]/25 bg-[#FFF8F1] text-[#8B5E3C]"
          }`}>
            {stopped ? <XCircle className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
            {statusLabels[normalizeStatus(request.status)] || request.status}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto px-5 py-7">
        <div className="flex min-w-max items-start">
          {journeySteps.map((step, index) => {
            const done = !stopped && index < currentStage;
            const active = index === currentStage;
            const failed = stopped && active;

            const circleClass = failed
              ? "border-red-600 bg-red-600 text-white"
              : active
                ? "border-[#D1965B] bg-[#D1965B] text-white shadow-md shadow-[#D1965B]/25"
                : done
                  ? "border-green-600 bg-green-600 text-white"
                  : "border-slate-200 bg-white text-slate-300";

            const lineClass = index < currentStage && !stopped ? "bg-green-600" : "bg-slate-200";

            return (
              <div key={`${step.department}-${index}`} className="flex items-start">
                <div className="w-36 text-center sm:w-40">
                  <div className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full border-2 ${circleClass}`}>
                    {failed ? (
                      <XCircle className="h-5 w-5" />
                    ) : done ? (
                      <Check className="h-5 w-5" />
                    ) : active ? (
                      <Clock3 className="h-5 w-5" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </div>
                  <p className={`mt-3 text-sm font-bold ${active ? "text-[#8B5E3C]" : done ? "text-green-700" : "text-slate-500"}`}>
                    {step.title}
                  </p>
                  <p className="mx-auto mt-1 max-w-[135px] text-xs leading-4 text-muted-foreground">
                    {step.description}
                  </p>
                  {active && (
                    <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${failed ? "bg-red-50 text-red-700" : "bg-[#FFF1E3] text-[#9B6438]"}`}>
                      {failed ? "Arrêté ici" : "Étape actuelle"}
                    </span>
                  )}
                </div>

                {index < journeySteps.length - 1 && (
                  <div className={`mt-5 h-1 w-10 rounded-full sm:w-16 ${lineClass}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 border-t border-[#D1965B]/10 bg-[#FFFDFB] p-5 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl bg-white p-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white"><Check className="h-4 w-4" /></span>
          <div><p className="text-sm font-semibold text-green-700">Terminé</p><p className="text-xs text-muted-foreground">Étape validée</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-white p-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D1965B] text-white"><Clock3 className="h-4 w-4" /></span>
          <div><p className="text-sm font-semibold text-[#9B6438]">Étape actuelle</p><p className="text-xs text-muted-foreground">Département responsable</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-white p-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Circle className="h-4 w-4" /></span>
          <div><p className="text-sm font-semibold text-slate-500">En attente</p><p className="text-xs text-muted-foreground">Étape suivante</p></div>
        </div>
      </div>
    </section>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "Non renseignée";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Non renseignée";
  }

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour:
      value.includes("T") || value.includes(" ")
        ? "2-digit"
        : undefined,
    minute:
      value.includes("T") || value.includes(" ")
        ? "2-digit"
        : undefined,
  });
}

function formatDesiredDate(value?: string | null) {
  if (!value) return "Non renseignée";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Non renseignée";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      "Une erreur est survenue."
    );
  }

  return error instanceof Error
    ? error.message
    : "Une erreur est survenue.";
}

export default function SupervisorRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const requestId = Number(params.id);

  const [request, setRequest] =
    useState<SpaceRequest | null>(null);
  const [documents, setDocuments] = useState<
    SpaceRequestDocument[]
  >([]);
  const [history, setHistory] = useState<
    ValidationHistory[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (
      !Number.isInteger(requestId) ||
      requestId <= 0
    ) {
      toast.error("Identifiant de demande invalide.");
      router.replace("/espace-membre/superviseur");
      return;
    }

    try {
      setLoading(true);

      const [requestData, documentData, historyData] =
        await Promise.all([
          supervisorService.getRequest(requestId),
          supervisorService.getRequestDocuments(
            requestId
          ),
          supervisorService.getRequestHistory(requestId),
        ]);

      setRequest(requestData);
      setDocuments(documentData);
      setHistory(historyData);
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [requestId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const deleteRequest = async () => {
    if (!request || deleting) return;

    const accepted = window.confirm(
      `Supprimer définitivement la demande ${request.reference} ?\n\nCette action supprimera également ses documents et son historique. Elle est irréversible.`
    );

    if (!accepted) return;

    try {
      setDeleting(true);
      await supervisorService.deleteRequest(request.id);
      toast.success("Demande supprimée définitivement.");
      router.replace("/espace-membre/superviseur");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[450px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#D1965B] border-t-transparent" />
          <p className="mt-4 text-sm text-[#5C4033]/60">
            Chargement de la demande...
          </p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center">
        <p className="font-semibold text-[#5C4033]">
          Demande introuvable.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/espace-membre/superviseur">
            Retour au tableau de bord
          </Link>
        </Button>
      </div>
    );
  }

  const department =
    request.assignedDepartment ||
    request.currentDepartment;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <Button
          asChild
          variant="outline"
          className="w-fit border-[#D1965B]/30 text-[#5C4033]"
        >
          <Link href="/espace-membre/superviseur">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux demandes
          </Link>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => void deleteRequest()}
          disabled={deleting}
          className="w-fit border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {deleting
            ? "Suppression..."
            : "Supprimer définitivement"}
        </Button>
      </div>

      <section className="rounded-2xl bg-[#D1965B] p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-white/75">
              {request.reference}
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              {request.eventName || request.title}
            </h1>
            <p className="mt-3 text-white/85">
              {request.currentStep ||
                "Étape actuelle non renseignée"}
            </p>
          </div>
          <RequestStatusBadge status={request.status} />
        </div>
      </section>

      <RequestJourney request={request} />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-[#D1965B]/15 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#5C4033]">
              Informations de la demande
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-[#F8F5EF] p-4">
                <div className="flex items-center gap-2 text-sm text-[#5C4033]/60">
                  <User className="h-4 w-4 text-[#D1965B]" />
                  Demandeur
                </div>
                <p className="mt-2 font-semibold text-[#5C4033]">
                  {request.user?.username || "Non renseigné"}
                </p>
              </div>

              <div className="rounded-xl bg-[#F8F5EF] p-4">
                <div className="flex items-center gap-2 text-sm text-[#5C4033]/60">
                  <CalendarDays className="h-4 w-4 text-[#D1965B]" />
                  Date souhaitée
                </div>
                <p className="mt-2 font-semibold text-[#5C4033]">
                  {formatDesiredDate(
                    request.desiredDate || request.date
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-[#F8F5EF] p-4">
                <div className="flex items-center gap-2 text-sm text-[#5C4033]/60">
                  <MapPin className="h-4 w-4 text-[#D1965B]" />
                  Espace demandé
                </div>
                <p className="mt-2 font-semibold text-[#5C4033]">
                  {request.spaceId
                    ? spaces[request.spaceId] ||
                      `Espace ${request.spaceId}`
                    : "Non renseigné"}
                </p>
              </div>

              <div className="rounded-xl bg-[#F8F5EF] p-4">
                <p className="flex items-center gap-2 text-sm text-[#5C4033]/60">
                  <Building2 className="h-4 w-4 text-[#D1965B]" />
                  Département actuel
                </p>
                <p className="mt-2 font-semibold text-[#5C4033]">
                  {departmentLabels[department] ||
                    department ||
                    "Non renseigné"}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2 rounded-xl border border-[#D1965B]/15 p-4 text-sm text-[#5C4033]/75">
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#D1965B]" />
                {request.user?.email || "Email non renseigné"}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#D1965B]" />
                {request.user?.phone ||
                  "Téléphone non renseigné"}
              </p>
            </div>

          </section>

          <section className="rounded-2xl border border-[#D1965B]/15 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <History className="h-5 w-5 text-[#D1965B]" />
              <h2 className="text-xl font-bold text-[#5C4033]">
                Historique du traitement
              </h2>
            </div>

            {history.length === 0 ? (
              <p className="mt-5 text-sm text-[#5C4033]/60">
                Aucun historique disponible.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {history.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-[#D1965B]/15 p-4"
                  >
                    <div className="flex flex-col justify-between gap-2 sm:flex-row">
                      <p className="font-semibold text-[#5C4033]">
                        {item.action.replaceAll("_", " ")}
                      </p>
                      <time className="text-xs text-[#5C4033]/50">
                        {formatDate(item.performedAt)}
                      </time>
                    </div>
                    <p className="mt-1 text-sm text-[#5C4033]/60">
                      {departmentLabels[
                        item.fromDepartment || ""
                      ] ||
                        item.fromDepartment ||
                        "-"}
                      {" → "}
                      {departmentLabels[
                        item.toDepartment || ""
                      ] ||
                        item.toDepartment ||
                        "-"}
                    </p>
                    {item.comment && (
                      <p className="mt-3 whitespace-pre-wrap text-sm text-[#5C4033]/75">
                        {item.comment}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="h-fit rounded-2xl border border-[#D1965B]/15 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-[#D1965B]" />
            <h2 className="text-xl font-bold text-[#5C4033]">
              Documents du dossier
            </h2>
          </div>

          {documents.length === 0 ? (
            <p className="mt-5 text-sm text-[#5C4033]/60">
              Aucun document disponible.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {documents.map((document, index) => (
                <article
                  key={
                    document.id ||
                    `${document.url}-${index}`
                  }
                  className="rounded-xl border border-[#D1965B]/15 bg-[#F8F5EF] p-4"
                >
                  <p className="text-sm font-semibold text-[#5C4033]">
                    {documentLabels[
                      document.type || ""
                    ] || "Document"}
                  </p>
                  <p className="mt-1 break-all text-xs text-[#5C4033]/60">
                    {document.name}
                  </p>
                  <Button
                    asChild
                    size="sm"
                    className="mt-3 w-full bg-[#D1965B] text-white hover:bg-[#B97D47]"
                  >
                    <a
                      href={getDocumentDownloadUrl(
                        document.url
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Consulter
                    </a>
                  </Button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}