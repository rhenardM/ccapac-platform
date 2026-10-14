"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FileText,
  Gavel,
  Loader2,
  Send,
  Upload,
  User,
  XCircle,
} from "lucide-react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardContent,
} from "../../../../components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCcapacSpace } from "@/constants/spaces";
import RequestDocuments from "@/components/space-requests/RequestDocuments";
import {
  spaceRequestService,
  type SpaceRequest,
  type SpaceRequestDocument,
  type SpaceRequestDocumentType,
  type ValidationHistory,
} from "@/services/spaceRequestService";

type CompatibleSpaceRequestDocument =
  SpaceRequestDocument & {
    documentType?: SpaceRequestDocumentType;
    document_type?: SpaceRequestDocumentType;
  };

function getWorkflowDocumentType(
  document: CompatibleSpaceRequestDocument
): SpaceRequestDocumentType | undefined {
  return (
    document.type ||
    document.documentType ||
    document.document_type
  );
}

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

  return date.toLocaleString("fr-FR");
}

function getDescriptionWithSpace(
  request: SpaceRequest
) {
  const description = String(
    request.description || ""
  ).trim();

  const alreadyContainsSpace =
    /^(espace demandé|espace souhaité|espace sollicité|espace réservé)\s*:/im.test(
      description
    );

  if (alreadyContainsSpace) {
    return description;
  }

  const requestedSpace =
    request.spaceId != null
      ? getCcapacSpace(
          Number(request.spaceId)
        )
      : undefined;

  const spaceLabel = requestedSpace
    ? requestedSpace.name
    : "Non renseigné";

  return [
    description ||
      "Aucune description.",
    `Espace demandé : ${spaceLabel}`,
  ].join("\n");
}

export default function LegalRequestPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const requestId = Number(params.id);

  const [request, setRequest] =
    useState<SpaceRequest | null>(null);

  const [history, setHistory] = useState<
    ValidationHistory[]
  >([]);

  const [documents, setDocuments] = useState<
    SpaceRequestDocument[]
  >([]);

  const [legalFile, setLegalFile] =
    useState<File | null>(null);

  const [uploadingLegalFile, setUploadingLegalFile] =
    useState(false);

  const [comment, setComment] = useState("");
  const [signature, setSignature] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [processing, setProcessing] =
    useState<"validate" | "reject" | null>(
      null
    );

  const loadRequest = useCallback(async () => {
    try {
      setLoading(true);

      const [requestData, historyData, documentData] =
        await Promise.all([
          spaceRequestService.getOne(
            requestId
          ),

          spaceRequestService.getHistory(
            requestId
          ),

          spaceRequestService
            .getDocuments(requestId)
            .catch(() => []),
        ]);

      setRequest(requestData);
      setHistory(historyData);
      setDocuments(
        Array.isArray(documentData) ? documentData : []
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de charger la demande"
      );
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    if (
      Number.isInteger(requestId) &&
      requestId > 0
    ) {
      void loadRequest();
    }
  }, [requestId, loadRequest]);

  const handleValidate = async () => {
    if (!request) {
      return;
    }

    if (!legalDocument) {
      toast.error(
        "Ajoutez le document juridique avant de signer et retourner le dossier au Programme."
      );
      return;
    }

    if (!signature.trim()) {
      toast.error(
        "La signature électronique est obligatoire"
      );

      return;
    }

    try {
      setProcessing("validate");

      if (
        user?.role ===
        "JURIDIQUE_ASSISTANT"
      ) {
        await spaceRequestService
          .legalAssistantReview(
            request.id,
            "VALIDATED",
            comment.trim() ||
              "Avis juridique favorable et document vérifié.",
            signature.trim()
          );
      } else {
        await spaceRequestService.validate(
          request.id,
          comment.trim() ||
            "Avis juridique favorable",
          signature.trim()
        );
      }

      toast.success(
        user?.role ===
          "JURIDIQUE_ASSISTANT"
          ? "Avis transmis au superviseur juridique"
          : "Demande retournée au Programme"
      );

      router.replace(
        "/espace-membre/juridique"
      );

      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Validation impossible"
      );
    } finally {
      setProcessing(null);
    }
  };

  const handleLegalFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      setLegalFile(null);
      return;
    }

    const valid = [".pdf", ".doc", ".docx"].some(
      (extension) => file.name.toLowerCase().endsWith(extension)
    );

    if (!valid) {
      event.target.value = "";
      setLegalFile(null);
      toast.error("Seuls les fichiers PDF, DOC et DOCX sont autorisés.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      event.target.value = "";
      setLegalFile(null);
      toast.error("Le document ne doit pas dépasser 10 Mo.");
      return;
    }

    setLegalFile(file);
  };

  const handleUploadLegalDocument = async () => {
    if (!request || !legalFile || uploadingLegalFile) {
      return;
    }

    try {
      setUploadingLegalFile(true);

      await spaceRequestService.uploadDocument(
        request.id,
        "LEGAL_DOCUMENT",
        legalFile
      );

      setLegalFile(null);
      toast.success("Document juridique ajouté avec succès.");
      await loadRequest();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible d'ajouter le document juridique."
      );
    } finally {
      setUploadingLegalFile(false);
    }
  };

  const handleReject = async () => {
    if (!request) {
      return;
    }

    if (comment.trim().length < 5) {
      toast.error(
        "Le motif du refus doit contenir au moins 5 caractères"
      );

      return;
    }

    if (!signature.trim()) {
      toast.error(
        "La signature électronique est obligatoire"
      );

      return;
    }

    try {
      setProcessing("reject");

      if (
        user?.role ===
        "JURIDIQUE_ASSISTANT"
      ) {
        await spaceRequestService
          .legalAssistantReview(
            request.id,
            "REJECTED",
            comment.trim(),
            signature.trim()
          );
      } else {
        await spaceRequestService.reject(
          request.id,
          comment.trim(),
          signature.trim()
        );
      }

      toast.success(
        user?.role ===
          "JURIDIQUE_ASSISTANT"
          ? "Rejet recommandé au superviseur juridique"
          : "Demande refusée"
      );

      router.replace(
        "/espace-membre/juridique"
      );

      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Refus impossible"
      );
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!request) {
    return (
      <Card>
        <CardContent className="p-10 text-center">
          Demande introuvable
        </CardContent>
      </Card>
    );
  }

  const isLegalAssistant =
    user?.role ===
    "JURIDIQUE_ASSISTANT";

  const isLegalSupervisor = [
    "ADMIN",
    "JURIDIQUE",
    "JURIDIQUE_SUPERVISEUR",
  ].includes(user?.role || "");

  const canProcess =
    request.status === "legal_review" &&
    (request.currentDepartment === "JURIDIQUE" ||
      request.assignedDepartment === "JURIDIQUE") &&
    (isLegalSupervisor ||
      (isLegalAssistant &&
        Number(
          request.legalAssignedToUserId
        ) === Number(user?.id)));

  const legalDocument = documents.find(
    (document) =>
      getWorkflowDocumentType(
        document as CompatibleSpaceRequestDocument
      ) === "LEGAL_DOCUMENT"
  );

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link href="/espace-membre/juridique">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Link>
      </Button>

      <section className="overflow-hidden rounded-2xl bg-[#D1965B] p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex items-start gap-4">
            <Gavel className="mt-1 h-8 w-8" />

            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-white/75">
                {request.reference}
              </p>

              <h1 className="mt-1 text-3xl font-bold">
                {request.eventName}
              </h1>

              <p className="mt-2 text-white/85">
                Examen de la conformité juridique.
              </p>
            </div>
          </div>

          <LegalStatusPill status={request.status} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden rounded-2xl border border-[#D1965B]/15 bg-white shadow-[0_8px_28px_rgba(92,64,51,0.08)]">
            <div className="border-b border-[#D1965B]/10 px-6 py-6 sm:px-7">
              <h2 className="text-lg font-bold text-[#5C4033]">
                Informations du dossier
              </h2>
              <p className="mt-1.5 text-sm text-[#5C4033]/55">
                Coordonnées et informations de la demande.
              </p>
            </div>

            <CardContent className="space-y-6 p-6 sm:p-7">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="min-h-[120px] rounded-2xl border border-[#D1965B]/10 bg-[#F8F5EF] p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#5C4033]/55">
                    Demandeur
                  </p>

                  <p className="mt-2 flex items-center gap-2 font-semibold text-[#5C4033]">
                    <User className="h-4 w-4 shrink-0 text-[#D1965B]" />
                    {request.user?.username}
                  </p>

                  <p className="mt-1 break-all pl-6 text-sm leading-6 text-[#5C4033]/65">
                    {request.user?.email}
                  </p>
                </div>

                <div className="min-h-[120px] rounded-2xl border border-[#D1965B]/10 bg-[#F8F5EF] p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#5C4033]/55">
                    Transmission
                  </p>

                  <p className="mt-2 flex items-center gap-2 font-semibold text-[#5C4033]">
                    <Calendar className="h-4 w-4 shrink-0 text-[#D1965B]" />

                    {formatDate(
                      request.submittedAt ||
                        request.createdAt
                    )}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#D1965B]/10 bg-[#F8F5EF] p-5 sm:p-6">
                <p className="whitespace-pre-wrap text-sm leading-7 text-[#5C4033]/75">
                  {getDescriptionWithSpace(
                    request
                  )}
                </p>
              </div>

            </CardContent>
          </Card>

          <RequestDocuments
            documents={documents}
            title="Documents transmis par le Programme"
            emptyMessage="Les documents transmis par le Programme sont absents."
          />

          <Card className="overflow-hidden border-[#D1965B]/15 bg-white shadow-sm">
            <div className="border-b border-[#D1965B]/12 px-6 py-5">
              <h2 className="text-lg font-bold text-[#5C4033]">
                Historique du traitement
              </h2>
              <p className="mt-1 text-sm text-[#5C4033]/55">
                Décisions et transmissions du dossier.
              </p>
            </div>

            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun historique disponible.
                </p>
              ) : (
                <div className="space-y-4">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="border-l-2 border-primary pl-4"
                    >
                      <p className="font-medium">
                        {entry.fromDepartment ||
                          "Membre"}{" "}
                        →{" "}
                        {entry.toDepartment ||
                          "Terminé"}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {entry.comment ||
                          entry.action}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(
                          entry.performedAt
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit overflow-hidden border-[#D1965B]/15 bg-white shadow-sm lg:sticky lg:top-6">
          <div className="border-b border-[#D1965B]/12 bg-[#F8F5EF] px-6 py-5">
            <h2 className="text-lg font-bold text-[#5C4033]">
              Avis juridique
            </h2>
            <p className="mt-1 text-sm text-[#5C4033]/55">
              Document, commentaire et signature obligatoires.
            </p>
          </div>

          <CardContent className="space-y-5">
            {!canProcess ? (
              <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                Cette demande n&apos;est plus assignée
                au Juridique.
              </div>
            ) : (
              <>
                {isLegalSupervisor &&
                  [
                    "assistant_validated",
                    "assistant_rejected",
                  ].includes(
                    request.legalReviewState ||
                      ""
                  ) && (
                    <div
                      className={`rounded-xl border p-4 ${
                        request.legalReviewState ===
                        "assistant_validated"
                          ? "border-green-200 bg-green-50 text-green-900"
                          : "border-red-200 bg-red-50 text-red-900"
                      }`}
                    >
                      <p className="font-semibold">
                        {request.legalReviewState ===
                        "assistant_validated"
                          ? "Avis favorable reçu de l’assistant"
                          : "Rejet recommandé par l’assistant"}
                      </p>

                      {request.legalAssistantComment && (
                        <p className="mt-2 text-sm leading-6">
                          {
                            request.legalAssistantComment
                          }
                        </p>
                      )}

                      {request.legalAssistantSignature && (
                        <p className="mt-3 border-t border-current/15 pt-3 font-serif text-lg italic">
                          {
                            request.legalAssistantSignature
                          }
                        </p>
                      )}
                    </div>
                  )}

                <div className="space-y-3 rounded-xl border border-[#D1965B]/20 bg-[#F8F5EF] p-4">
                  <div>
                    <p className="font-semibold text-[#5C4033]">
                      Document juridique *
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#5C4033]/60">
                      Ajoutez votre document avant de signer et retourner le dossier au Programme.
                    </p>
                  </div>

                  {legalDocument ? (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                      <p className="flex items-center gap-2 text-sm font-semibold text-green-800">
                        <CheckCircle2 className="h-4 w-4" />
                        Document juridique ajouté
                      </p>

                      <p className="mt-1 break-words text-xs text-green-700">
                        {legalDocument.name}
                      </p>
                    </div>
                  ) : (
                    <>
                      <label
                        htmlFor="legalDocumentFile"
                        className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-[#D1965B]/30 bg-white p-5 text-center hover:border-[#D1965B]"
                      >
                        <Upload className="h-6 w-6 text-[#D1965B]" />

                        <p className="mt-2 break-all text-sm font-medium text-[#5C4033]">
                          {legalFile
                            ? legalFile.name
                            : "Choisir le document juridique"}
                        </p>

                        <p className="mt-1 text-xs text-[#5C4033]/50">
                          PDF, DOC ou DOCX — maximum 10 Mo
                        </p>

                        <input
                          id="legalDocumentFile"
                          type="file"
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={handleLegalFileChange}
                          disabled={uploadingLegalFile}
                          className="sr-only"
                        />
                      </label>

                      <Button
                        type="button"
                        onClick={() => void handleUploadLegalDocument()}
                        disabled={!legalFile || uploadingLegalFile}
                        className="w-full bg-[#D1965B] text-white hover:bg-[#B97D47]"
                      >
                        {uploadingLegalFile ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}

                        {uploadingLegalFile
                          ? "Ajout en cours..."
                          : "Ajouter le document"}
                      </Button>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comment">
                    Commentaire juridique
                  </Label>

                  <Textarea
                    id="comment"
                    rows={6}
                    value={comment}
                    onChange={(event) =>
                      setComment(
                        event.target.value
                      )
                    }
                    placeholder="Conformité, conditions, réserves..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signature">
                    Signature électronique *
                  </Label>

                  <Textarea
                    id="signature"
                    rows={3}
                    value={signature}
                    onChange={(event) =>
                      setSignature(
                        event.target.value
                      )
                    }
                    placeholder="Votre nom complet"
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleValidate}
                  disabled={processing !== null}
                  className="w-full"
                >
                  {processing === "validate" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}

                  {isLegalAssistant
                    ? "Signer et transmettre au superviseur"
                    : "Valider et retourner au Programme"}
                  <Send className="ml-2 h-4 w-4" />
                </Button>

              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LegalStatusPill({ status }: { status: string }) {
  const label =
    status === "legal_review"
      ? "En attente du Service juridique"
      : status === "rejected"
        ? "Demande rejetée"
        : status === "program_review_after_legal"
          ? "Retournée au Programme"
          : status;

  const colors =
    status === "rejected"
      ? "border-red-200 bg-red-50 text-red-700"
      : status === "program_review_after_legal"
        ? "border-green-200 bg-green-50 text-green-700"
        : "border-white/30 bg-white/15 text-white";

  return (
    <span className={`inline-flex h-fit w-fit shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${colors}`}>
      <span className="h-2 w-2 rounded-full bg-current" />
      {label}
    </span>
  );
}