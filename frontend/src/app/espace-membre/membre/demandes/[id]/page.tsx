"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  FileSignature,
  FileText,
  Loader2,
  ReceiptText,
  RefreshCcw,
  Send,
  Upload,
  User,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RequestDocuments from "@/components/space-requests/RequestDocuments";
import RequestStatusBadge from "@/components/space-requests/RequestStatusBadge";
import {
  type ReservationSlot,
  spaceRequestService,
  type SpaceRequest,
  type SpaceRequestDocument,
  type ValidationHistory,
} from "@/services/spaceRequestService";
const spaces = [
  { id: 1, name: "Grand théâtre" },
  { id: 2, name: "Petit théâtre" },
  { id: 3, name: "Salle de danse" },
  { id: 4, name: "Hall" },
  { id: 5, name: "Atrium" },
  { id: 6, name: "Cafétéria" },
  { id: 7, name: "Salle de musique 1" },
  { id: 8, name: "Salle de musique 2" },
  { id: 9, name: "Parking" },
  { id: 10, name: "Esplanade principale" },
  { id: 11, name: "Esplanade secondaire / côté INA" },
  { id: 12, name: "Esplanade secondaire / côté parking" },
];
type ApiErrorResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};
function formatDate(value?: string | null) {
  if (!value) {
    return "Non renseignée";
  }
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
function formatDateTime(value?: string | null) {
  if (!value) {
    return "Non renseignée";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Non renseignée";
  }
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function formatAmount(value?: number | null) {
  if (value === null || value === undefined) {
    return "Montant indiqué dans la cotation";
  }
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}
function getErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<ApiErrorResponse>(error)) {
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
export default function MemberRequestDetailPage() {
  const params = useParams<{
    id: string;
  }>();
  const router = useRouter();
  const requestId = Number(params.id);
  const [request, setRequest] = useState<SpaceRequest | null>(null);
  const [documents, setDocuments] = useState<SpaceRequestDocument[]>([]);
  const [history, setHistory] = useState<ValidationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signature, setSignature] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [refusing, setRefusing] = useState(false);
  const [decisionComment, setDecisionComment] = useState("");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentSignature, setPaymentSignature] = useState("");
  const [uploadingPayment, setUploadingPayment] = useState(false);
  const [paymentOption, setPaymentOption] = useState<
    "online" | "receipt" | null
  >(null);
  const [correctionEventName, setCorrectionEventName] = useState("");
  const [correctionDescription, setCorrectionDescription] = useState("");
  const [correctionSlots, setCorrectionSlots] = useState<ReservationSlot[]>([]);
  const [correctionSignature, setCorrectionSignature] = useState("");
  const [correctionComment, setCorrectionComment] = useState("");
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const loadRequest = useCallback(async () => {
    if (!Number.isInteger(requestId) || requestId <= 0) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [requestData, documentData, historyData] = await Promise.all([
        spaceRequestService.getOne(requestId),
        spaceRequestService.getDocuments(requestId).catch(() => []),
        spaceRequestService.getHistory(requestId).catch(() => []),
      ]);
      setRequest(requestData);
      setCorrectionEventName(requestData.eventName || requestData.title || "");
      setCorrectionDescription(requestData.description || "");
      setCorrectionSlots(
        requestData.slots?.length
          ? requestData.slots.map((slot) => ({
              id: slot.id,
              date: String(slot.date).slice(0, 10),
              spaceId: Number(slot.spaceId),
            }))
          : requestData.desiredDate || requestData.date
            ? [
                {
                  date: String(
                    requestData.desiredDate || requestData.date,
                  ).slice(0, 10),
                  spaceId: Number(requestData.spaceId || 1),
                },
              ]
            : [],
      );
      setDocuments(Array.isArray(documentData) ? documentData : []);
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (error) {
      console.error(
        "Erreur de chargement :",
        isAxiosError(error) ? error.response?.data : error,
      );
      toast.error(getErrorMessage(error, "Impossible de charger la demande."));
    } finally {
      setLoading(false);
    }
  }, [requestId]);
  useEffect(() => {
    void loadRequest();
  }, [loadRequest]);
  useEffect(() => {
    if (!signatureModalOpen) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [signatureModalOpen]);
  const closeSignatureModal = () => {
    if (submitting) {
      return;
    }
    setSignatureModalOpen(false);
    setRefusing(false);
    setDecisionComment("");
    setConfirmed(false);
  };
  const handleSubmitRequest = async () => {
    if (!request) {
      return;
    }
    const cleanSignature = signature.trim();
    if (cleanSignature.length < 3) {
      toast.error("Veuillez saisir votre nom complet comme signature.");
      return;
    }
    if (!refusing && !confirmed) {
      toast.error(
        "Vous devez accepter les termes et conditions avant de signer.",
      );
      return;
    }
    try {
      setSubmitting(true);
      let updatedRequest: SpaceRequest;
      if (refusing) {
        if (decisionComment.trim().length < 5) {
          toast.error("Veuillez expliquer le motif du refus.");
          return;
        }
        updatedRequest = await spaceRequestService.memberDecision(
          request.id,
          "REFUSED",
          cleanSignature,
          decisionComment.trim(),
        );
      } else if (request.status === "awaiting_member_confirmation") {
        updatedRequest = await spaceRequestService.memberDecision(
          request.id,
          "ACCEPTED",
          cleanSignature,
          decisionComment.trim() ||
            "Les deux documents ont été lus et confirmés.",
        );
      } else {
        updatedRequest = await spaceRequestService.submit(
          request.id,
          cleanSignature,
        );
      }
      setRequest(updatedRequest);
      setSignatureModalOpen(false);
      toast.success(
        refusing
          ? "Demande refusée"
          : request.status === "awaiting_member_confirmation"
            ? "Avis accepté et retourné au Programme"
            : "Demande signée et transmise au Programme",
      );
      await loadRequest();
      router.refresh();
    } catch (error) {
      console.error(
        "Erreur d’envoi :",
        isAxiosError(error) ? error.response?.data : error,
      );
      toast.error(getErrorMessage(error, "Impossible d’envoyer la demande."));
    } finally {
      setSubmitting(false);
    }
  };
  const handlePaymentProofUpload = async () => {
    if (!request || !paymentProof || uploadingPayment) {
      return;
    }
    try {
      setUploadingPayment(true);
      const updatedRequest = await spaceRequestService.uploadPaymentProof(
        request.id,
        paymentProof,
        paymentSignature.trim(),
      );
      setRequest(updatedRequest);
      setPaymentProof(null);
      setPaymentSignature("");
      toast.success("Preuve de paiement envoyée", {
        description:
          "Le Service des Programmes va vérifier le paiement et confirmer votre date.",
      });
      await loadRequest();
      router.refresh();
    } catch (error) {
      console.error(
        "Erreur d’envoi de la preuve de paiement :",
        isAxiosError(error) ? error.response?.data : error,
      );
      toast.error(
        getErrorMessage(error, "Impossible d’envoyer la preuve de paiement."),
      );
    } finally {
      setUploadingPayment(false);
    }
  };
  const updateCorrectionSlot = (
    index: number,
    field: "date" | "spaceId",
    value: string,
  ) => {
    setCorrectionSlots((current) =>
      current.map((slot, slotIndex) =>
        slotIndex === index
          ? {
              ...slot,
              [field]: field === "spaceId" ? Number(value) : value,
            }
          : slot,
      ),
    );
  };
  const addCorrectionSlot = () => {
    setCorrectionSlots((current) => [
      ...current,
      {
        date: "",
        spaceId: 1,
      },
    ]);
  };
  const removeCorrectionSlot = (index: number) => {
    setCorrectionSlots((current) =>
      current.filter((_, slotIndex) => slotIndex !== index),
    );
  };
  const handleCorrectionResubmit = async () => {
    if (!request || request.status !== "correction_requested") {
      return;
    }
    if (!correctionEventName.trim()) {
      toast.error("L’intitulé de l’activité est obligatoire.");
      return;
    }
    if (correctionSlots.length === 0) {
      toast.error("Ajoutez au moins une date et un espace.");
      return;
    }
    if (
      correctionSlots.some(
        (slot) =>
          !slot.date ||
          !Number.isInteger(Number(slot.spaceId)) ||
          Number(slot.spaceId) < 1 ||
          Number(slot.spaceId) > 12,
      )
    ) {
      toast.error("Vérifiez toutes les dates et tous les espaces.");
      return;
    }
    if (correctionSignature.trim().length < 3) {
      toast.error("Votre signature électronique est obligatoire.");
      return;
    }
    try {
      setSubmittingCorrection(true);
      const updatedRequest = await spaceRequestService.resubmitCorrection(
        request.id,
        {
          eventName: correctionEventName,
          description: correctionDescription,
          slots: correctionSlots,
          electronicSignature: correctionSignature,
          comment: correctionComment,
        },
      );
      setRequest(updatedRequest);
      setCorrectionSignature("");
      setCorrectionComment("");
      toast.success("La demande corrigée a été renvoyée au Programme.");
      await loadRequest();
      router.refresh();
    } catch (error) {
      console.error(
        "Erreur de correction :",
        isAxiosError(error) ? error.response?.data : error,
      );
      toast.error(
        getErrorMessage(error, "Impossible de renvoyer la demande corrigée."),
      );
    } finally {
      setSubmittingCorrection(false);
    }
  };
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#D1965B]" />
          <p className="mt-4 text-sm text-[#5C4033]/70">
            Chargement de la demande...
          </p>
        </div>
      </div>
    );
  }
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return (
      <Card className="border-[#D1965B]/20 bg-white">
        <CardContent className="p-10 text-center">
          <h1 className="text-xl font-bold text-[#5C4033]">
            Identifiant invalide
          </h1>
          <Button
            asChild
            className="mt-6 bg-[#D1965B] text-white hover:bg-[#B97D47]"
          >
            <Link href="/espace-membre/membre/demandes">
              Retour aux demandes
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  if (!request) {
    return (
      <Card className="border-[#D1965B]/20 bg-white">
        <CardContent className="p-10 text-center">
          <FileText className="mx-auto h-12 w-12 text-[#D1965B]" />
          <h1 className="mt-4 text-xl font-bold text-[#5C4033]">
            Demande introuvable
          </h1>
          <p className="mt-2 text-sm text-[#5C4033]/70">
            Cette demande n&apos;existe pas ou vous n&apos;êtes pas autorisé à
            la consulter.
          </p>
          <Button
            asChild
            className="mt-6 bg-[#D1965B] text-white hover:bg-[#B97D47]"
          >
            <Link href="/espace-membre/membre/demandes">
              Retour aux demandes
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  const canSubmit = request.status === "draft";
  const canConfirm = request.status === "awaiting_member_confirmation";
  const canCorrect = request.status === "correction_requested";
  const canUploadPayment = request.status === "awaiting_payment_proof";
  const paymentUnderReview = request.status === "program_payment_review";
  const processCompleted = request.status === "completed";
  const requestRejected = ["rejected", "stopped_by_member", "expired"].includes(
    request.status,
  );
  /*
   * Une demande en correction reste modifiable avec la même
   * référence. Seuls un rejet définitif ou une expiration
   * imposent désormais de créer une nouvelle demande.
   */
  const mustRestartRequest = requestRejected;
  const rejectionHistory = [...history]
    .sort(
      (first, second) =>
        new Date(second.performedAt).getTime() -
        new Date(first.performedAt).getTime(),
    )
    .find(
      (item) =>
        String(item.action || "")
          .toUpperCase()
          .includes("REFUS") ||
        String(item.action || "")
          .toUpperCase()
          .includes("REJECT"),
    );
  const rejectionReason =
    request.rejectionComment?.trim() ||
    rejectionHistory?.comment?.trim() ||
    "Aucun motif n'a été renseigné.";
  const hasFinanceQuote =
    request.paymentAmount !== null && request.paymentAmount !== undefined
      ? true
      : documents.some((document) => {
          const compatibleDocument = document as SpaceRequestDocument & {
            documentType?: string;
            document_type?: string;
          };
          const documentType = String(
            compatibleDocument.type ||
              compatibleDocument.documentType ||
              compatibleDocument.document_type ||
              "",
          );
          return documentType === "FINANCE_QUOTE";
        });
  const canChoosePayment =
    canUploadPayment ||
    (hasFinanceQuote &&
      (request.currentDepartment === "MEMBER" ||
        request.assignedDepartment === "MEMBER") &&
      request.status !== "rejected" &&
      !canCorrect &&
      !paymentUnderReview &&
      !processCompleted);
  const communicationMessage = [...history]
    .sort(
      (first, second) =>
        new Date(second.performedAt).getTime() -
        new Date(first.performedAt).getTime(),
    )
    .find(
      (item) =>
        item.fromDepartment === "COMMUNICATION" &&
        item.toDepartment === "MEMBER" &&
        Boolean(item.comment?.trim()),
    );
  const canAct = canSubmit || canConfirm;
  const alreadySubmitted = !canAct && !canCorrect && !mustRestartRequest;
  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/espace-membre/membre/demandes"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#D1965B] hover:text-[#B97D47]"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux demandes
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-[#5C4033] sm:text-3xl">
                {request.eventName || request.title || "Demande d’espace"}
              </h1>
              {request.status === "awaiting_payment_proof" ? (
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                  En attente de la preuve de paiement
                </span>
              ) : request.status === "program_payment_review" ? (
                <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  Paiement en cours de vérification par le Service des
                  Programmes
                </span>
              ) : request.status ===
                "communication_review_after_confirmation" ? (
                <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700">
                  Vérification par la Communication après confirmation
                </span>
              ) : (
                <RequestStatusBadge status={request.status as never} />
              )}
            </div>
            <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-[#D1965B]">
              {request.reference}
            </p>
          </div>
          {canAct && (
            <div className="flex flex-col gap-2 sm:flex-row">
              {canConfirm && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRefusing(true);
                    setSignatureModalOpen(true);
                  }}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Refuser
                </Button>
              )}
              <Button
                type="button"
                onClick={() => {
                  setRefusing(false);
                  setSignatureModalOpen(true);
                }}
                className="bg-[#D1965B] text-white hover:bg-[#B97D47]"
              >
                <FileSignature className="mr-2 h-4 w-4" />
                {canConfirm
                  ? "Accepter les termes et conditions et signer"
                  : "Signer et envoyer"}
              </Button>
            </div>
          )}
          {mustRestartRequest && (
            <Button
              asChild
              className="bg-[#D1965B] text-white hover:bg-[#B97D47]"
            >
              <Link href="/espace-membre/membre/nouvelle-demande">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Recommencer la demande
              </Link>
            </Button>
          )}
        </div>
        {canSubmit && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <p className="font-semibold text-amber-900">
                  Demande non envoyée
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  Votre demande est enregistrée comme brouillon. Vous devez la
                  signer électroniquement pour la transmettre au Service des
                  Programmes.
                </p>
              </div>
            </div>
          </div>
        )}
        {alreadySubmitted && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
              <div>
                <p className="font-semibold text-green-900">
                  Demande transmise
                </p>
                <p className="mt-1 text-sm text-green-800">
                  Votre demande a été signée et transmise. Vous pouvez suivre
                  son évolution depuis la page Mes demandes.
                </p>
              </div>
            </div>
          </div>
        )}
        {canCorrect && (
          <Card className="overflow-hidden border-amber-300 bg-white shadow-sm">
            <div className="border-b border-amber-200 bg-amber-50 px-6 py-5 sm:px-8">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" />
                <div>
                  <h2 className="text-lg font-bold text-amber-950">
                    Corriger cette demande
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    Modifiez uniquement les informations concernées par le
                    motif. La référence, les documents et l’historique de cette
                    demande seront conservés.
                  </p>
                </div>
              </div>
            </div>
            <CardContent className="space-y-6 p-6 sm:p-8">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="text-sm font-bold text-red-800">
                  Motif de la correction
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-red-900">
                  {rejectionReason}
                </p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="correctionEventName">
                    Intitulé de l’activité
                  </Label>
                  <Input
                    id="correctionEventName"
                    value={correctionEventName}
                    onChange={(event) =>
                      setCorrectionEventName(event.target.value)
                    }
                    disabled={submittingCorrection}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="correctionDescription">
                    Description corrigée
                  </Label>
                  <textarea
                    id="correctionDescription"
                    value={correctionDescription}
                    onChange={(event) =>
                      setCorrectionDescription(event.target.value)
                    }
                    disabled={submittingCorrection}
                    rows={7}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-bold text-[#5C4033]">
                      Dates et espaces
                    </h3>
                    <p className="mt-1 text-sm text-[#5C4033]/60">
                      Conservez les créneaux corrects et modifiez seulement ceux
                      signalés.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addCorrectionSlot}
                    disabled={
                      submittingCorrection || correctionSlots.length >= 30
                    }
                  >
                    Ajouter un créneau
                  </Button>
                </div>
                {correctionSlots.map((slot, index) => (
                  <div
                    key={`${slot.id || "new"}-${index}`}
                    className="grid gap-3 rounded-2xl border border-[#D1965B]/20 bg-[#F8F5EF] p-4 md:grid-cols-[1fr_1.5fr_auto] md:items-end"
                  >
                    <div className="space-y-2">
                      <Label htmlFor={`correctionDate-${index}`}>Date</Label>
                      <Input
                        id={`correctionDate-${index}`}
                        type="date"
                        value={slot.date}
                        min={new Date().toISOString().slice(0, 10)}
                        onChange={(event) =>
                          updateCorrectionSlot(
                            index,
                            "date",
                            event.target.value,
                          )
                        }
                        disabled={submittingCorrection}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`correctionSpace-${index}`}>Espace</Label>
                      <select
                        id={`correctionSpace-${index}`}
                        value={slot.spaceId}
                        onChange={(event) =>
                          updateCorrectionSlot(
                            index,
                            "spaceId",
                            event.target.value,
                          )
                        }
                        disabled={submittingCorrection}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {spaces.map((space) => (
                          <option key={space.id} value={space.id}>
                            {space.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeCorrectionSlot(index)}
                      disabled={
                        submittingCorrection || correctionSlots.length === 1
                      }
                      className="border-red-200 text-red-700 hover:bg-red-50"
                    >
                      Supprimer
                    </Button>
                  </div>
                ))}
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="correctionComment">
                    Résumé des modifications
                  </Label>
                  <textarea
                    id="correctionComment"
                    value={correctionComment}
                    onChange={(event) =>
                      setCorrectionComment(event.target.value)
                    }
                    disabled={submittingCorrection}
                    rows={4}
                    placeholder="Expliquez brièvement ce que vous avez corrigé."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="correctionSignature">
                    Signature électronique
                  </Label>
                  <Input
                    id="correctionSignature"
                    value={correctionSignature}
                    onChange={(event) =>
                      setCorrectionSignature(event.target.value)
                    }
                    disabled={submittingCorrection}
                    placeholder="Votre nom complet"
                  />
                  <p className="text-xs leading-5 text-[#5C4033]/55">
                    Votre signature confirme que les corrections correspondent
                    au motif reçu.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => void handleCorrectionResubmit()}
                disabled={
                  submittingCorrection ||
                  !correctionEventName.trim() ||
                  correctionSlots.length === 0 ||
                  correctionSignature.trim().length < 3
                }
                className="w-full bg-[#D1965B] text-white hover:bg-[#B97D47]"
              >
                {submittingCorrection ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {submittingCorrection
                  ? "Envoi des corrections..."
                  : "Signer et renvoyer la demande corrigée"}
              </Button>
            </CardContent>
          </Card>
        )}
        {mustRestartRequest && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
              <div className="min-w-0">
                <p className="font-bold text-red-900">Demande rejetée</p>
                <p className="mt-1 text-sm leading-6 text-red-800">
                  Cette demande est définitivement fermée. Consultez le motif
                  ci-dessous avant de créer une nouvelle demande.
                </p>
                <Button
                  asChild
                  className="mt-4 bg-red-700 text-white hover:bg-red-800"
                >
                  <Link href="/espace-membre/membre/nouvelle-demande">
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Recommencer la demande à neuf
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
        {communicationMessage?.comment && (
          <section className="overflow-hidden rounded-2xl border border-amber-300 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-amber-200 bg-amber-50 px-5 py-4 sm:px-6">
              <div className="rounded-xl bg-amber-100 p-2.5">
                <AlertTriangle className="h-6 w-6 text-amber-700" />
              </div>
              <div>
                <p className="font-bold text-amber-950">
                  Avertissement de Communication &amp; Marketing
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  Veuillez lire attentivement ce message avant de confirmer ou
                  de refuser le dossier.
                </p>
              </div>
            </div>
            <div className="px-5 py-5 sm:px-6">
              <p className="whitespace-pre-line text-sm leading-7 text-[#5C4033] sm:text-base">
                {communicationMessage.comment}
              </p>
              <p className="mt-4 border-t border-[#D1965B]/15 pt-3 text-xs text-[#5C4033]/55">
                Transmis par Communication &amp; Marketing le{" "}
                {formatDateTime(communicationMessage.performedAt)}
              </p>
            </div>
          </section>
        )}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-[#D1965B]/20 bg-white lg:col-span-2">
            <CardContent className="space-y-7 p-6">
              <div>
                <h2 className="text-lg font-bold text-[#5C4033]">
                  Informations de la demande
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-[#F3EEE5]/70 p-4">
                    <div className="flex items-center gap-2 text-sm text-[#5C4033]/60">
                      <FileText className="h-4 w-4" />
                      Activité
                    </div>
                    <p className="mt-2 font-semibold text-[#5C4033]">
                      {request.eventName || request.title}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#F3EEE5]/70 p-4">
                    <div className="flex items-center gap-2 text-sm text-[#5C4033]/60">
                      <Calendar className="h-4 w-4" />
                      Date souhaitée
                    </div>
                    <p className="mt-2 font-semibold text-[#5C4033]">
                      {formatDate(request.date || request.desiredDate)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#F3EEE5]/70 p-4">
                    <div className="flex items-center gap-2 text-sm text-[#5C4033]/60">
                      <Clock className="h-4 w-4" />
                      Date de création
                    </div>
                    <p className="mt-2 font-semibold text-[#5C4033]">
                      {formatDateTime(request.createdAt)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#F3EEE5]/70 p-4">
                    <div className="flex items-center gap-2 text-sm text-[#5C4033]/60">
                      <User className="h-4 w-4" />
                      Service actuel
                    </div>
                    <p className="mt-2 font-semibold text-[#5C4033]">
                      {request.currentDepartment ||
                        request.assignedDepartment ||
                        "MEMBRE"}
                    </p>
                  </div>
                  {mustRestartRequest && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 sm:col-span-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
                        <AlertTriangle className="h-4 w-4" />
                        Motif du rejet
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-red-900">
                        {rejectionReason}
                      </p>
                      {rejectionHistory?.performedAt && (
                        <p className="mt-3 text-xs text-red-700/70">
                          Décision enregistrée le{" "}
                          {formatDateTime(rejectionHistory.performedAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#5C4033]">
                  Description
                </h2>
                <div className="mt-3 whitespace-pre-wrap rounded-xl border border-[#D1965B]/20 bg-[#F3EEE5]/40 p-4 text-sm leading-7 text-[#5C4033]/80">
                  {request.description || "Aucune description renseignée."}
                </div>
              </div>
              {request.electronicSignature && !mustRestartRequest && (
                <div>
                  <h2 className="text-lg font-bold text-[#5C4033]">
                    Signature électronique
                  </h2>
                  <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-4">
                    <p className="font-serif text-xl italic text-green-900">
                      {request.electronicSignature}
                    </p>
                    <p className="mt-2 text-xs text-green-700">
                      Demande signée électroniquement
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <div className="space-y-6">
            <Card className="border-[#D1965B]/20 bg-white">
              <CardContent className="p-6">
                <h2 className="font-bold text-[#5C4033]">Étape actuelle</h2>
                <p className="mt-3 text-sm leading-6 text-[#5C4033]/70">
                  {request.currentStep ||
                    (canAct
                      ? "En attente de votre signature électronique"
                      : mustRestartRequest
                        ? "Nouvelle demande requise"
                        : "Demande en cours de traitement")}
                </p>
                {request.submittedAt && (
                  <p className="mt-3 text-xs text-[#5C4033]/60">
                    Envoyée le {formatDateTime(request.submittedAt)}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        <RequestDocuments
          documents={documents}
          title="Documents de la demande"
          emptyMessage="Aucun document n'est disponible."
        />
        {canChoosePayment && (
          <Card className="overflow-hidden border-[#D1965B]/20 bg-white shadow-sm">
            <div className="border-b border-[#D1965B]/15 bg-[#F8F5EF] px-6 py-5 sm:px-8">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#D1965B]/10 p-3">
                  <ReceiptText className="h-6 w-6 text-[#D1965B]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#5C4033]">
                    Régler la cotation
                  </h2>
                  <p className="mt-1 text-sm text-[#5C4033]/65">
                    Choisissez votre méthode de paiement.
                  </p>
                </div>
              </div>
            </div>
            <CardContent className="space-y-6 p-6 sm:p-8">
              <div className="rounded-2xl border border-[#D1965B]/20 bg-[#D1965B]/5 p-5 text-center">
                <p className="text-sm font-medium text-[#5C4033]/60">
                  Montant à payer
                </p>
                <p className="mt-1 text-3xl font-bold text-[#5C4033]">
                  {formatAmount(request.paymentAmount)}
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPaymentOption("online")}
                  className={`rounded-2xl border p-5 text-left transition ${
                    paymentOption === "online"
                      ? "border-[#D1965B] bg-[#D1965B]/10 ring-2 ring-[#D1965B]/15"
                      : "border-[#D1965B]/20 bg-white hover:border-[#D1965B]/50"
                  }`}
                >
                  <CreditCard className="h-7 w-7 text-[#D1965B]" />
                  <p className="mt-3 font-bold text-[#5C4033]">
                    Payer sur la plateforme
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#5C4033]/60">
                    Payer en ligne avec une carte bancaire Visa.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentOption("receipt")}
                  className={`rounded-2xl border p-5 text-left transition ${
                    paymentOption === "receipt"
                      ? "border-[#D1965B] bg-[#D1965B]/10 ring-2 ring-[#D1965B]/15"
                      : "border-[#D1965B]/20 bg-white hover:border-[#D1965B]/50"
                  }`}
                >
                  <Banknote className="h-7 w-7 text-[#D1965B]" />
                  <p className="mt-3 font-bold text-[#5C4033]">
                    J&apos;ai payé autrement
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#5C4033]/60">
                    Payer hors plateforme, puis déposer le reçu de paiement.
                  </p>
                </button>
              </div>
              {paymentOption === "online" && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                  <div className="flex items-start gap-3">
                    <CreditCard className="mt-0.5 h-6 w-6 shrink-0 text-blue-700" />
                    <div>
                      <p className="font-bold text-blue-950">
                        Paiement par carte Visa
                      </p>
                      <p className="mt-1 text-sm leading-6 text-blue-800">
                        Cette interface est prête pour la future intégration du
                        paiement bancaire.
                      </p>
                      <Button
                        type="button"
                        onClick={() =>
                          toast.info("Paiement en ligne bientôt disponible")
                        }
                        className="mt-4 bg-[#D1965B] text-white hover:bg-[#B97D47]"
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Continuer vers le paiement
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {paymentOption === "receipt" && (
                <div className="mx-auto w-full max-w-xl space-y-4 rounded-2xl border border-[#D1965B]/20 bg-[#F8F5EF] p-5">
                  <div>
                    <h3 className="font-bold text-[#5C4033]">
                      Déposer le reçu de paiement
                    </h3>
                    <p className="mt-1 text-sm text-[#5C4033]/60">
                      Sélectionnez le reçu obtenu après votre paiement.
                    </p>
                  </div>
                  <Label htmlFor="paymentProof" className="text-[#5C4033]">
                    Preuve de paiement (PDF, DOC ou DOCX) *
                  </Label>
                  <Input
                    id="paymentProof"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    disabled={uploadingPayment}
                    onChange={(event) =>
                      setPaymentProof(event.target.files?.[0] || null)
                    }
                    className="border-[#D1965B]/30 file:mr-3 file:border-0 file:bg-transparent file:font-medium file:text-[#D1965B]"
                  />
                  {paymentProof && (
                    <p className="truncate text-xs text-[#5C4033]/60">
                      Fichier sélectionné : {paymentProof.name}
                    </p>
                  )}
                  <div className="space-y-2">
                    <Label
                      htmlFor="paymentSignature"
                      className="text-[#5C4033]"
                    >
                      Signature électronique *
                    </Label>
                    <Input
                      id="paymentSignature"
                      value={paymentSignature}
                      onChange={(event) =>
                        setPaymentSignature(event.target.value)
                      }
                      placeholder="Votre nom complet"
                      disabled={uploadingPayment}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => void handlePaymentProofUpload()}
                    disabled={
                      !paymentProof ||
                      paymentSignature.trim().length < 3 ||
                      uploadingPayment
                    }
                    className="w-full bg-[#D1965B] text-white hover:bg-[#B97D47]"
                  >
                    {uploadingPayment ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    {uploadingPayment
                      ? "Envoi en cours..."
                      : "Envoyer la preuve au Programme"}
                  </Button>
                </div>
              )}
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                Le Service des Programmes vérifiera le paiement avant de
                confirmer définitivement la date souhaitée.
              </p>
            </CardContent>
          </Card>
        )}
        {paymentUnderReview && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-900">
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-bold">Paiement en cours de vérification</p>
                <p className="mt-1 text-sm leading-6">
                  Votre preuve de paiement a été transmise au Service des
                  Programmes. Vous recevrez la confirmation définitive de votre
                  date ici.
                </p>
              </div>
            </div>
          </div>
        )}
        {processCompleted && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-green-900 shadow-sm">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="mt-0.5 h-7 w-7 shrink-0 text-green-600" />
              <div>
                <h2 className="text-lg font-bold">
                  Paiement et date confirmés
                </h2>
                <p className="mt-2 leading-7">
                  Votre paiement a été vérifié. Votre occupation est
                  définitivement confirmée pour le{" "}
                  {formatDate(request.desiredDate || request.date)}.
                </p>
                <p className="mt-2 text-sm font-medium">
                  Le processus de traitement de cette demande est terminé.
                </p>
              </div>
            </div>
          </div>
        )}
        {canAct && (
          <Card className="border-[#D1965B]/20 bg-[#D1965B] text-white">
            <CardContent className="flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold">
                  {canConfirm
                    ? "Confirmer les documents reçus ?"
                    : "Prêt à envoyer votre demande ?"}
                </h2>
                <p className="mt-1 text-sm text-white/80">
                  {canConfirm
                    ? "Lisez le formulaire initial et l'avis artistique, puis donnez votre décision."
                    : "Vérifiez les informations, puis signez électroniquement votre dossier."}
                </p>
              </div>
              <Button
                type="button"
                onClick={() => {
                  setRefusing(false);
                  setSignatureModalOpen(true);
                }}
                className="bg-white text-[#5C4033] hover:bg-[#F3EEE5]"
              >
                <FileSignature className="mr-2 h-4 w-4" />
                {canConfirm
                  ? "Accepter les termes et conditions et signer"
                  : "Signer et envoyer"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      {signatureModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="signature-title"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={closeSignatureModal}
            aria-label="Fermer la fenêtre"
          />
          <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#D1965B]/20 bg-[#F3EEE5] p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-[#D1965B]/15 p-3">
                  <FileSignature className="h-6 w-6 text-[#D1965B]" />
                </div>
                <div>
                  <h2
                    id="signature-title"
                    className="text-xl font-bold text-[#5C4033]"
                  >
                    {refusing
                      ? "Refuser les documents"
                      : "Signature électronique"}
                  </h2>
                  <p className="mt-1 text-sm text-[#5C4033]/70">
                    {refusing
                      ? "Expliquez votre refus et signez votre décision."
                      : canConfirm
                        ? "Confirmez les documents avant leur retour au Service Communication."
                        : "Signez la demande avant sa transmission au Service des Programmes."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeSignatureModal}
                disabled={submitting}
                className="rounded-lg p-2 text-[#5C4033] transition hover:bg-white disabled:opacity-50"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-5 p-5 sm:p-6">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                En signant cette demande, vous certifiez sur l&apos;honneur que
                les informations et le document transmis sont exacts. Cette
                signature constitue votre engagement électronique.
              </div>
              {canConfirm && (
                <div className="space-y-2">
                  <Label
                    htmlFor="memberDecisionComment"
                    className="text-[#5C4033]"
                  >
                    {refusing ? "Motif du refus *" : "Commentaire"}
                  </Label>
                  <textarea
                    id="memberDecisionComment"
                    value={decisionComment}
                    onChange={(event) => setDecisionComment(event.target.value)}
                    rows={4}
                    disabled={submitting}
                    placeholder={
                      refusing
                        ? "Expliquez pourquoi vous refusez les documents..."
                        : "Ajoutez une observation si nécessaire..."
                    }
                    className="w-full resize-none rounded-xl border border-[#D1965B]/30 bg-white px-3 py-3 text-sm text-[#5C4033] outline-none focus:border-[#D1965B] focus:ring-2 focus:ring-[#D1965B]/10"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="electronicSignature" className="text-[#5C4033]">
                  Votre nom complet *
                </Label>
                <Input
                  id="electronicSignature"
                  value={signature}
                  onChange={(event) => setSignature(event.target.value)}
                  placeholder="Saisissez votre nom complet"
                  disabled={submitting}
                  autoComplete="name"
                  className="border-[#D1965B]/30 focus-visible:ring-[#D1965B]"
                />
                <div className="min-h-20 rounded-xl border border-dashed border-[#D1965B]/40 bg-[#F3EEE5]/50 p-4">
                  <p className="font-serif text-2xl italic text-[#5C4033]">
                    {signature.trim() || "Votre signature apparaîtra ici"}
                  </p>
                </div>
              </div>
              {!refusing && (
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#D1965B]/20 p-4">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(event) => setConfirmed(event.target.checked)}
                    disabled={submitting}
                    className="mt-1 h-4 w-4 accent-[#D1965B]"
                  />
                  <span className="text-sm leading-6 text-[#5C4033]/80">
                    J&apos;ai vérifié toutes les informations, j&apos;accepte
                    les termes et conditions et j&apos;autorise
                    l&apos;utilisation de mon nom comme signature électronique.
                  </span>
                </label>
              )}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeSignatureModal}
                  disabled={submitting}
                  className="border-[#D1965B]/40 text-[#5C4033]"
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleSubmitRequest()}
                  disabled={
                    submitting ||
                    signature.trim().length < 3 ||
                    (!refusing && !confirmed) ||
                    (refusing && decisionComment.trim().length < 5)
                  }
                  className={
                    refusing
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-[#D1965B] text-white hover:bg-[#B97D47]"
                  }
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      {refusing ? (
                        <XCircle className="mr-2 h-4 w-4" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      {refusing
                        ? "Signer et refuser"
                        : canConfirm
                          ? "Accepter les termes et conditions et signer"
                          : "Signer et envoyer"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
