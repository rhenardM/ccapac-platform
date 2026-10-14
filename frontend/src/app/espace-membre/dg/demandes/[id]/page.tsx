"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  AlertCircle,
  ArrowLeft,
  BadgeDollarSign,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  History,
  Loader2,
  Mail,
  MapPin,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  Signature,
  UserRound,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  spaceRequestService,
  type SpaceRequest,
  type SpaceRequestDocument,
  type ValidationHistory,
} from "@/services/spaceRequestService";

type DecisionType =
  | "approve"
  | "revision";

const statusLabels: Record<
  string,
  string
> = {
  draft: "Brouillon",

  submitted:
    "Demande envoyée",

  program_review:
    "Examen par le Programme",

  artistic_initial_review:
    "Préparation de l’avis artistique",

  program_review_after_artistic:
    "Avis artistique retourné au Programme",

  awaiting_member_confirmation:
    "En attente de la confirmation du membre",

  program_review_after_confirmation:
    "Confirmation reçue par le Programme",

  artistic_final_review:
    "Validation artistique finale",

  parallel_communication_regisseur_review:
    "Validation Communication et Régisseur",

  program_review_after_parallel:
    "Validations retournées au Programme",

  legal_review:
    "Examen par le Service juridique",

  finance_cotation:
    "Préparation de la cotation Finance",

  dg_cotation_review:
    "Cotation en attente de la Direction générale",

  finance_cotation_revision:
    "Révision de la cotation par Finance",

  program_review_after_finance:
    "Cotation approuvée et retournée au Programme",

  awaiting_payment_proof:
    "En attente de la preuve de paiement",

  program_payment_review:
    "Vérification du paiement par le Programme",

  completed:
    "Demande terminée",

  rejected:
    "Demande rejetée",

  correction_requested:
    "Correction demandée au membre",

  stopped_by_member:
    "Demande arrêtée par le membre",

  expired:
    "Délai de correction expiré",
};

const documentLabels: Record<
  string,
  string
> = {
  INITIAL_REQUEST:
    "Formulaire de la demande",

  REQUEST_LETTER:
    "Lettre de demande",

  ARTISTIC_OPINION:
    "Avis artistique",

  LEGAL_DOCUMENT:
    "Document juridique",

  FINANCE_QUOTE:
    "Cotation financière",

  PAYMENT_PROOF:
    "Preuve de paiement",
};

const SPACE_NAMES: Record<number, string> = {
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
  11: "Esplanade secondaire / côté INA",
  12: "Esplanade secondaire / côté parking",
};

function getRequestedSpace(
  request: SpaceRequest
): string {
  const spaceId =
    request.spaceId !== null &&
    request.spaceId !== undefined
      ? Number(request.spaceId)
      : null;

  if (spaceId && SPACE_NAMES[spaceId]) {
    return SPACE_NAMES[spaceId];
  }

  const description = String(
    request.description || ""
  );

  const patterns = [
    /Espace\s+demandé\s*:\s*([^\n\r]+)/i,
    /Espace\s+souhaité\s*:\s*([^\n\r]+)/i,
    /Salle\s+demandée\s*:\s*([^\n\r]+)/i,
    /Salle\s+souhaitée\s*:\s*([^\n\r]+)/i,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);

    if (match?.[1]?.trim()) {
      return match[1].trim();
    }
  }

  return "Espace non renseigné";
}

const historyActionLabels: Record<
  string,
  string
> = {
  CREATE:
    "Création de la demande",

  SUBMIT:
    "Envoi de la demande",

  DG_APPROVE_QUOTATION:
    "Approbation de la cotation par la DG",

  DG_REQUEST_QUOTATION_REVISION:
    "Révision demandée par la DG",

  FINANCE_SEND_QUOTE_TO_DG:
    "Cotation envoyée à la DG",

  FINANCE_RESUBMIT_QUOTE_TO_DG:
    "Cotation corrigée renvoyée à la DG",

  FINANCE_QUOTE_VALIDATION:
    "Validation de la cotation Finance",

  PROGRAMME_SEND_QUOTE:
    "Cotation envoyée au membre",

  PROGRAMME_INITIAL_VALIDATION:
    "Validation initiale du Programme",

  ARTISTIC_INITIAL_VALIDATION:
    "Validation artistique initiale",

  ARTISTIC_FINAL_VALIDATION:
    "Validation artistique finale",

  LEGAL_VALIDATION:
    "Validation juridique",

  REJECT:
    "Rejet de la demande",
};

const API_BASE = String(
  process.env
    .NEXT_PUBLIC_API_URL ||
    "http://localhost:5000/api"
).replace(/\/+$/, "");

const BACKEND_BASE =
  API_BASE.endsWith("/api")
    ? API_BASE.slice(0, -4)
    : API_BASE;

function getDocumentUrl(
  documentUrl: string
): string {
  if (
    /^https?:\/\//i.test(
      documentUrl
    )
  ) {
    return documentUrl;
  }

  return `${BACKEND_BASE}/${documentUrl.replace(
    /^\/+/,
    ""
  )}`;
}

function normalizeStatus(
  status?: string | null
): string {
  return String(status || "")
    .trim()
    .toLowerCase();
}

function formatAmount(
  amount?: number | null
): string {
  return new Intl.NumberFormat(
    "fr-FR",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  ).format(Number(amount || 0));
}

function formatDate(
  value?: string | null,
  includeTime = false
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
      month: "long",
      year: "numeric",

      ...(includeTime
        ? {
            hour: "2-digit",
            minute: "2-digit",
          }
        : {}),
    }
  );
}

function getDocumentType(
  document: SpaceRequestDocument
): string {
  return (
    document.type ||
    "DOCUMENT"
  );
}

function getHistoryUser(
  history: ValidationHistory
): string {
  const user =
    history.performedBy;

  if (!user) {
    return "Utilisateur non renseigné";
  }

  return (
    user.username ||
    [
      user.firstName,
      user.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    user.email ||
    "Utilisateur non renseigné"
  );
}

function RequestStatusBadge({
  status,
}: {
  status: string;
}) {
  const normalizedStatus =
    normalizeStatus(status);

  if (
    normalizedStatus ===
    "dg_cotation_review"
  ) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
        <Clock3 className="h-3.5 w-3.5" />

        En attente de la DG
      </span>
    );
  }

  if (
    normalizedStatus ===
    "finance_cotation_revision"
  ) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
        <RotateCcw className="h-3.5 w-3.5" />

        Révision par Finance
      </span>
    );
  }

  if (
    normalizedStatus ===
    "program_review_after_finance"
  ) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
        <CheckCircle2 className="h-3.5 w-3.5" />

        Cotation approuvée
      </span>
    );
  }

  if (
    normalizedStatus ===
    "rejected"
  ) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
        <AlertCircle className="h-3.5 w-3.5" />

        Demande rejetée
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
      {statusLabels[
        normalizedStatus
      ] || status}
    </span>
  );
}

interface InformationItemProps {
  label: string;
  value: React.ReactNode;
  icon: typeof UserRound;
}

function InformationItem({
  label,
  value,
  icon: Icon,
}: InformationItemProps) {
  return (
    <div className="rounded-2xl border border-[#D1965B]/15 bg-[#FFFDFC] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D1965B]/10">
          <Icon className="h-5 w-5 text-[#D1965B]" />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#5C4033]/50">
            {label}
          </p>

          <div className="mt-1 break-words font-semibold text-[#5C4033]">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DGRequestDetailPage() {
  const params =
    useParams<{
      id: string;
    }>();

  const router = useRouter();

  const requestId =
    Number(params.id);

  const [
    request,
    setRequest,
  ] =
    useState<SpaceRequest | null>(
      null
    );

  const [
    documents,
    setDocuments,
  ] = useState<
    SpaceRequestDocument[]
  >([]);

  const [
    history,
    setHistory,
  ] = useState<
    ValidationHistory[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    busy,
    setBusy,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );

  const [
    selectedDecision,
    setSelectedDecision,
  ] =
    useState<DecisionType>(
      "approve"
    );

  const [
    comment,
    setComment,
  ] = useState("");

  const [
    signature,
    setSignature,
  ] = useState("");

  const [
    suggestedAmount,
    setSuggestedAmount,
  ] = useState("");

  const loadRequest =
    useCallback(
      async (
        showSuccess = false
      ) => {
        if (
          !Number.isInteger(
            requestId
          ) ||
          requestId <= 0
        ) {
          setError(
            "Identifiant de demande invalide."
          );

          setLoading(false);
          setRefreshing(false);

          return;
        }

        try {
          setError(null);

          const [
            requestData,
            documentData,
            historyData,
          ] = await Promise.all([
            spaceRequestService.getOne(
              requestId
            ),

            spaceRequestService.getDocuments(
              requestId
            ),

            spaceRequestService.getHistory(
              requestId
            ),
          ]);

          setRequest(
            requestData
          );

          setDocuments(
            Array.isArray(
              documentData
            )
              ? documentData
              : []
          );

          setHistory(
            Array.isArray(
              historyData
            )
              ? historyData
              : []
          );

          if (showSuccess) {
            toast.success(
              "Dossier actualisé"
            );
          }
        } catch (err: unknown) {
          console.error(
            "DG request loading error:",
            err
          );

          const message =
            err instanceof Error
              ? err.message
              : "Impossible de charger le dossier.";

          setError(message);

          toast.error(message);
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [requestId]
    );

  useEffect(() => {
    void loadRequest();
  }, [loadRequest]);

  const financeQuote =
    useMemo(
      () =>
        documents.find(
          (document) =>
            getDocumentType(
              document
            ) ===
            "FINANCE_QUOTE"
        ),
      [documents]
    );

  const requesterName =
    request?.user?.username ||
    [
      request?.user?.firstName,
      request?.user?.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    "Demandeur non renseigné";

  const canReview =
    request?.status ===
    "dg_cotation_review";

  const validateForm =
    (): boolean => {
      const cleanSignature =
        signature.trim();

      const cleanComment =
        comment.trim();

      if (
        cleanSignature.length < 3
      ) {
        toast.error(
          "La signature électronique est obligatoire."
        );

        return false;
      }

      if (
        selectedDecision ===
        "revision"
      ) {
        const amount =
          Number(
            suggestedAmount
          );

        if (
          cleanComment.length < 5
        ) {
          toast.error(
            "Expliquez la modification demandée à Finance."
          );

          return false;
        }

        if (
          !Number.isFinite(
            amount
          ) ||
          amount <= 0
        ) {
          toast.error(
            "Le montant suggéré doit être supérieur à zéro."
          );

          return false;
        }
      }

      return true;
    };

  const handleDecision =
    async () => {
      if (
        busy ||
        !request ||
        !validateForm()
      ) {
        return;
      }

      setBusy(true);

      try {
        await spaceRequestService
          .reviewDGCotation(
            requestId,
            selectedDecision,
            comment,
            signature,
            selectedDecision ===
              "revision"
              ? Number(
                  suggestedAmount
                )
              : undefined
          );

        toast.success(
          selectedDecision ===
            "approve"
            ? "Cotation approuvée"
            : "Révision transmise à Finance",
          {
            description:
              selectedDecision ===
              "approve"
                ? "La demande a été transmise au Service des Programmes."
                : "Finance doit modifier la cotation et la renvoyer à la DG.",
          }
        );

        router.push(
          "/espace-membre/dg"
        );
      } catch (err: unknown) {
        console.error(
          "DG decision error:",
          err
        );

        toast.error(
          err instanceof Error
            ? err.message
            : "Impossible d’enregistrer la décision."
        );
      } finally {
        setBusy(false);
      }
    };

  if (loading) {
    return (
      <div className="flex min-h-[520px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D1965B]/10">
            <Loader2 className="h-8 w-8 animate-spin text-[#D1965B]" />
          </div>

          <p className="mt-4 font-semibold text-[#5C4033]">
            Chargement du dossier
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Récupération des documents et de l’historique...
          </p>
        </div>
      </div>
    );
  }

  if (
    error ||
    !request
  ) {
    return (
      <div className="mx-auto max-w-2xl py-16">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-600" />

            <h1 className="mt-4 text-xl font-bold text-red-800">
              Impossible de charger la demande
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error ||
                "Demande introuvable."}
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setLoading(true);
                  void loadRequest();
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />

                Réessayer
              </Button>

              <Button asChild>
                <Link href="/espace-membre/dg/demandes">
                  Retour aux demandes
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-12">
      {/* Navigation */}

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <Button
          asChild
          variant="ghost"
          className="w-fit text-[#8B5E3C] hover:bg-[#D1965B]/10 hover:text-[#8B5E3C]"
        >
          <Link href="/espace-membre/dg/demandes">
            <ArrowLeft className="mr-2 h-4 w-4" />

            Retour aux demandes
          </Link>
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={refreshing}
          onClick={() => {
            setRefreshing(true);
            void loadRequest(
              true
            );
          }}
          className="w-fit border-[#D1965B]/30 text-[#8B5E3C]"
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

      {/* En-tête */}

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#D1965B] via-[#C3844B] to-[#8B572F] px-6 py-8 text-white shadow-lg sm:px-8">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
                <ShieldCheck className="h-4 w-4" />

                Décision de la Direction générale
              </span>

              <RequestStatusBadge
                status={
                  request.status
                }
              />
            </div>

            <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-white/70">
              {request.reference ||
                `Demande #${request.id}`}
            </p>

            <h1 className="mt-2 max-w-3xl break-words text-3xl font-bold sm:text-4xl">
              {request.eventName ||
                request.title ||
                "Demande d’espace"}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80">
              {statusLabels[
                normalizeStatus(
                  request.status
                )
              ] ||
                request.currentStep ||
                "Dossier en cours de traitement"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
              Montant proposé par Finance
            </p>

            <p className="mt-2 text-3xl font-bold">
              {formatAmount(
                request.paymentAmount
              )}{" "}
              USD
            </p>
          </div>
        </div>
      </section>

      {/* Informations */}

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="border-[#D1965B]/20 bg-white shadow-sm xl:col-span-2">
          <CardHeader className="border-b border-[#D1965B]/10">
            <CardTitle className="text-xl text-[#5C4033]">
              Informations du dossier
            </CardTitle>
          </CardHeader>

          <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
            <InformationItem
              label="Demandeur"
              value={
                requesterName
              }
              icon={UserRound}
            />

            <InformationItem
              label="Adresse email"
              value={
                request.user
                  ?.email ||
                "Non renseignée"
              }
              icon={Mail}
            />

            <InformationItem
              label="Espace demandé"
              value={getRequestedSpace(
                request
              )}
              icon={MapPin}
            />

            <InformationItem
              label="Date souhaitée"
              value={formatDate(
                request.desiredDate ||
                  request.date
              )}
              icon={CalendarDays}
            />

            <InformationItem
              label="Étape actuelle"
              value={
                request.currentStep ||
                statusLabels[
                  normalizeStatus(
                    request.status
                  )
                ] ||
                "Non renseignée"
              }
              icon={Clock3}
            />
          </CardContent>
        </Card>

        <Card className="border-[#D1965B]/20 bg-gradient-to-br from-[#FFF9F3] to-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-[#5C4033]">
              <BadgeDollarSign className="h-5 w-5 text-[#D1965B]" />

              Cotation Finance
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-muted-foreground">
              Montant officiel proposé
            </p>

            <p className="mt-2 text-3xl font-bold text-[#5C4033]">
              {formatAmount(
                request.paymentAmount
              )}{" "}
              <span className="text-lg text-[#D1965B]">
                USD
              </span>
            </p>

            <div className="mt-5 rounded-xl border border-[#D1965B]/15 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Nombre de révisions
              </p>

              <p className="mt-1 text-xl font-bold text-[#5C4033]">
                {Number(
                  request.financeRevisionCount ||
                    0
                )}
              </p>
            </div>

            {financeQuote && (
              <Button
                asChild
                className="mt-5 w-full bg-[#D1965B] text-white hover:bg-[#B97D47]"
              >
                <a
                  href={getDocumentUrl(
                    financeQuote.url
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />

                  Consulter la cotation
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Documents */}

      <Card className="overflow-hidden border-[#D1965B]/20 bg-white shadow-sm">
        <CardHeader className="border-b border-[#D1965B]/10">
          <CardTitle className="flex items-center gap-2 text-xl text-[#5C4033]">
            <FileText className="h-5 w-5 text-[#D1965B]" />

            Documents du dossier
          </CardTitle>

          <p className="text-sm text-muted-foreground">
            Consultez les documents avant de prendre votre décision.
          </p>
        </CardHeader>

        <CardContent className="p-6">
          {documents.length ===
          0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center">
              <FileText className="mx-auto h-10 w-10 text-slate-300" />

              <p className="mt-3 font-semibold text-[#5C4033]">
                Aucun document disponible
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {documents.map(
                (
                  document,
                  index
                ) => {
                  const type =
                    getDocumentType(
                      document
                    );

                  return (
                    <a
                      key={
                        document.id ||
                        index
                      }
                      href={getDocumentUrl(
                        document.url
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center justify-between gap-4 rounded-2xl border border-[#D1965B]/15 bg-[#FFFDFC] p-4 transition-all hover:-translate-y-0.5 hover:border-[#D1965B]/40 hover:shadow-sm"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D1965B]/10">
                          <FileText className="h-5 w-5 text-[#D1965B]" />
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold text-[#5C4033]">
                            {documentLabels[
                              type
                            ] ||
                              "Document"}
                          </p>

                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {document.name}
                          </p>
                        </div>
                      </div>

                      <Download className="h-5 w-5 shrink-0 text-[#D1965B] transition-transform group-hover:translate-y-0.5" />
                    </a>
                  );
                }
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Décision */}

      {canReview ? (
        <Card className="overflow-hidden border-[#D1965B]/30 bg-white shadow-md">
          <CardHeader className="bg-[#5C4033] text-white">
            <CardTitle className="flex items-center gap-2 text-xl">
              <ShieldCheck className="h-5 w-5" />

              Décision de la Direction générale
            </CardTitle>

            <p className="text-sm text-white/70">
              Approuvez la cotation ou demandez une modification au Service Finance.
            </p>
          </CardHeader>

          <CardContent className="space-y-6 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  setSelectedDecision(
                    "approve"
                  )
                }
                className={`rounded-2xl border-2 p-5 text-left transition-all ${
                  selectedDecision ===
                  "approve"
                    ? "border-green-500 bg-green-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-green-200"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      selectedDecision ===
                      "approve"
                        ? "bg-green-600 text-white"
                        : "bg-green-50 text-green-600"
                    }`}
                  >
                    <CheckCircle2 className="h-6 w-6" />
                  </div>

                  <div>
                    <p className="font-bold text-[#5C4033]">
                      Approuver la cotation
                    </p>

                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      Le montant est accepté et le dossier sera transmis au Programme.
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  setSelectedDecision(
                    "revision"
                  )
                }
                className={`rounded-2xl border-2 p-5 text-left transition-all ${
                  selectedDecision ===
                  "revision"
                    ? "border-amber-500 bg-amber-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-amber-200"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      selectedDecision ===
                      "revision"
                        ? "bg-amber-500 text-white"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    <RotateCcw className="h-6 w-6" />
                  </div>

                  <div>
                    <p className="font-bold text-[#5C4033]">
                      Demander une révision
                    </p>

                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      Finance devra modifier le montant et renvoyer la cotation à la DG.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dg-comment">
                Commentaire
                {selectedDecision ===
                  "revision" && (
                  <span className="ml-1 text-red-600">
                    *
                  </span>
                )}
              </Label>

              <Textarea
                id="dg-comment"
                value={comment}
                disabled={busy}
                onChange={(event) =>
                  setComment(
                    event.target.value
                  )
                }
                placeholder={
                  selectedDecision ===
                  "approve"
                    ? "Ajoutez éventuellement une observation..."
                    : "Expliquez les modifications que Finance doit apporter..."
                }
                className="min-h-28 resize-y"
              />
            </div>

            {selectedDecision ===
              "revision" && (
              <div className="space-y-2">
                <Label htmlFor="dg-amount">
                  Nouveau montant suggéré
                  <span className="ml-1 text-red-600">
                    *
                  </span>
                </Label>

                <div className="relative">
                  <BadgeDollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#D1965B]" />

                  <Input
                    id="dg-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    disabled={busy}
                    value={
                      suggestedAmount
                    }
                    onChange={(event) =>
                      setSuggestedAmount(
                        event.target
                          .value
                      )
                    }
                    placeholder="Exemple : 15000"
                    className="h-12 pl-11 pr-16"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#5C4033]">
                    USD
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  Ce montant est une suggestion. Finance devra enregistrer le montant officiel.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="dg-signature">
                Signature électronique
                <span className="ml-1 text-red-600">
                  *
                </span>
              </Label>

              <div className="relative">
                <Signature className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#D1965B]" />

                <Input
                  id="dg-signature"
                  value={signature}
                  disabled={busy}
                  onChange={(event) =>
                    setSignature(
                      event.target.value
                    )
                  }
                  placeholder="Saisissez votre nom complet"
                  className="h-12 pl-11"
                />
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold">
                Décision officielle
              </p>

              <p className="mt-1">
                Cette action sera enregistrée dans l’historique avec votre identité et votre signature électronique.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  router.push(
                    "/espace-membre/dg"
                  )
                }
              >
                Annuler
              </Button>

              <Button
                type="button"
                disabled={busy}
                onClick={
                  handleDecision
                }
                className={
                  selectedDecision ===
                  "approve"
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-amber-500 text-white hover:bg-amber-600"
                }
              >
                {busy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />

                    Enregistrement...
                  </>
                ) : selectedDecision ===
                  "approve" ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />

                    Approuver et transmettre
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />

                    Envoyer la demande de révision
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600" />

            <h2 className="mt-4 text-xl font-bold text-green-800">
              Décision déjà traitée
            </h2>

            <p className="mt-2 max-w-xl text-sm text-green-700">
              Cette cotation n’est plus en attente de décision de la Direction générale.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Historique */}

      <Card className="overflow-hidden border-[#D1965B]/20 bg-white shadow-sm">
        <CardHeader className="border-b border-[#D1965B]/10">
          <CardTitle className="flex items-center gap-2 text-xl text-[#5C4033]">
            <History className="h-5 w-5 text-[#D1965B]" />

            Historique complet
          </CardTitle>

          <p className="text-sm text-muted-foreground">
            Toutes les actions effectuées sur cette demande.
          </p>
        </CardHeader>

        <CardContent className="p-6">
          {history.length === 0 ? (
            <div className="py-10 text-center">
              <History className="mx-auto h-10 w-10 text-slate-300" />

              <p className="mt-3 font-semibold text-[#5C4033]">
                Aucun historique disponible
              </p>
            </div>
          ) : (
            <div className="relative space-y-0">
              {history.map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={item.id}
                    className="relative flex gap-4 pb-7 last:pb-0"
                  >
                    {index !==
                      history.length -
                        1 && (
                      <div className="absolute left-[19px] top-10 h-[calc(100%-1rem)] w-px bg-[#D1965B]/25" />
                    )}

                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white bg-[#D1965B]/15">
                      <div className="h-3 w-3 rounded-full bg-[#D1965B]" />
                    </div>

                    <div className="min-w-0 flex-1 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                        <div>
                          <p className="font-bold text-[#5C4033]">
                            {historyActionLabels[
                              item.action
                            ] ||
                              item.action}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            Effectué par{" "}
                            <span className="font-semibold">
                              {getHistoryUser(
                                item
                              )}
                            </span>
                          </p>
                        </div>

                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatDate(
                            item.performedAt,
                            true
                          )}
                        </span>
                      </div>

                      {item.comment && (
                        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                          {item.comment}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.previousStatus && (
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-500">
                            {statusLabels[
                              normalizeStatus(
                                item.previousStatus
                              )
                            ] ||
                              item.previousStatus}
                          </span>
                        )}

                        <span className="text-xs text-[#D1965B]">
                          →
                        </span>

                        <span className="rounded-full bg-[#D1965B]/10 px-2.5 py-1 text-xs font-semibold text-[#8B5E3C]">
                          {statusLabels[
                            normalizeStatus(
                              item.newStatus
                            )
                          ] ||
                            item.newStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}