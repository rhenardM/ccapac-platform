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
  BadgeDollarSign,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Send,
  Upload,
  UserRound,
  XCircle,
} from "lucide-react";
import {
  useParams,
  useRouter,
} from "next/navigation";
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
import RequestDocuments from "@/components/space-requests/RequestDocuments";
import {
  spaceRequestService,
  type SpaceRequest,
  type SpaceRequestDocument,
  type SpaceRequestDocumentType,
  type ValidationHistory,
} from "@/services/spaceRequestService";

type CompatibleDocument = SpaceRequestDocument & {
  documentType?: SpaceRequestDocumentType;
  document_type?: SpaceRequestDocumentType;
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

function getRequestedSpace(request: SpaceRequest) {
  if (request.spaceId && SPACE_NAMES[request.spaceId]) {
    return SPACE_NAMES[request.spaceId];
  }

  const match = request.description?.match(
    /Espace\s+(?:demandé|souhaité)\s*:\s*([^\n\r]+)/i
  );

  return match?.[1]?.trim() || "Espace non renseigné";
}

function formatRequestDate(value?: string | null) {
  if (!value) return "Date non renseignée";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getDocumentType(
  document: CompatibleDocument
): SpaceRequestDocumentType | undefined {
  return document.type || document.documentType || document.document_type;
}

function FinanceStatusPill({ status }: { status: string }) {
  const label =
    status === "finance_cotation"
      ? "En attente de cotation"
      : status === "finance_cotation_revision"
        ? "Révision demandée par la DG"
      : status === "dg_cotation_review"
        ? "En attente de la DG"
      : status === "rejected"
        ? "Demande rejetée"
        : status === "program_review_after_finance"
          ? "Retournée au Programme"
          : status;

  const colors =
    status === "rejected"
      ? "border-red-200 bg-red-50 text-red-700"
      : status === "program_review_after_finance"
        ? "border-green-200 bg-green-50 text-green-700"
        : "border-white/30 bg-white/15 text-white";

  return (
    <span className={`inline-flex h-fit w-fit shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${colors}`}>
      <span className="h-2 w-2 rounded-full bg-current" />
      {label}
    </span>
  );
}

export default function FinanceRequestPage() {
  const params = useParams();
  const router = useRouter();

  const requestId = Number(params.id);

  const [request, setRequest] =
    useState<SpaceRequest | null>(null);

  const [history, setHistory] = useState<
    ValidationHistory[]
  >([]);

  const [documents, setDocuments] = useState<
    SpaceRequestDocument[]
  >([]);

  const [quoteFile, setQuoteFile] =
    useState<File | null>(null);

  const [uploadingQuote, setUploadingQuote] =
    useState(false);

  const [quoteUploaded, setQuoteUploaded] =
    useState(false);

  const [amount, setAmount] = useState("");
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
      const safeDocuments = Array.isArray(documentData)
        ? documentData
        : [];

      setDocuments(safeDocuments);
      setQuoteUploaded(
        safeDocuments.some(
          (document) =>
            getDocumentType(document as CompatibleDocument) ===
            "FINANCE_QUOTE"
        )
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

  const financeQuote = documents.find(
    (document) =>
      getDocumentType(document as CompatibleDocument) ===
      "FINANCE_QUOTE"
  );

  const handleQuoteFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      setQuoteFile(null);
      return;
    }

    const validExtension = [".pdf", ".doc", ".docx"].some(
      (extension) => file.name.toLowerCase().endsWith(extension)
    );

    if (!validExtension) {
      event.target.value = "";
      setQuoteFile(null);
      toast.error("Seuls les fichiers PDF, DOC et DOCX sont autorisés.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      event.target.value = "";
      setQuoteFile(null);
      toast.error("Le fichier ne doit pas dépasser 10 Mo.");
      return;
    }

    setQuoteFile(file);
  };

  const handleUploadQuote = async () => {
    if (!request || !quoteFile || uploadingQuote) {
      return;
    }

    try {
      setUploadingQuote(true);

      const uploadedDocument =
        await spaceRequestService.uploadDocument(
          request.id,
          "FINANCE_QUOTE",
          quoteFile
        );

      setQuoteFile(null);
      setQuoteUploaded(true);
      setDocuments((currentDocuments) => [
        ...currentDocuments.filter(
          (document) =>
            getDocumentType(document as CompatibleDocument) !==
            "FINANCE_QUOTE"
        ),
        {
          ...uploadedDocument,
          type: "FINANCE_QUOTE",
        },
      ]);

      toast.success("Cotation ajoutée avec succès.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible d'ajouter la cotation."
      );
    } finally {
      setUploadingQuote(false);
    }
  };

  const handleValidate = async () => {
    if (!request) {
      return;
    }

    if (!financeQuote && !quoteUploaded) {
      toast.error(
        "Ajoutez le document de cotation avant de valider."
      );
      return;
    }

    const paymentAmount = Number(amount);

    if (
      !Number.isFinite(paymentAmount) ||
      paymentAmount <= 0
    ) {
      toast.error(
        "Saisissez un montant valide"
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

      await spaceRequestService.validateFinance(
        request.id,
        paymentAmount,
        comment.trim() ||
          "Cotation établie par les Finances",
        signature.trim()
      );

      toast.success(
        "Cotation retournée au Programme"
      );

      router.replace(
        "/espace-membre/finance"
      );

      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Cotation impossible"
      );
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!request) {
      return;
    }

    if (!comment.trim()) {
      toast.error(
        "Le motif du refus est obligatoire"
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

      await spaceRequestService.reject(
        request.id,
        comment.trim(),
        signature.trim()
      );

      toast.success("Demande refusée");

      router.replace(
        "/espace-membre/finance"
      );
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

  const canProcess =
    request.status === "finance_cotation" ||
    request.status === "finance_cotation_revision";

  const requesterName =
    request.user?.username ||
    [
      request.user?.firstName,
      request.user?.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    "Demandeur non renseigné";

  const requestedSpace =
    getRequestedSpace(request);

  const requestedDate =
    request.desiredDate || request.date;

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link href="/espace-membre/finance">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Link>
      </Button>

      <section className="overflow-hidden rounded-2xl bg-[#D1965B] p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide text-white/75">
              {request.reference}
            </p>

            <h1 className="mt-1 break-words text-2xl font-bold sm:text-3xl">
              {request.eventName}
            </h1>
          </div>

          <FinanceStatusPill status={request.status} />
        </div>
      </section>

      {request.status === "finance_cotation_revision" && (
        <Card className="border-amber-300 bg-amber-50">
          <CardHeader><CardTitle>Révision demandée par la Direction générale</CardTitle></CardHeader>
          <CardContent>
            <p>{request.dgComment}</p>
            <p className="mt-2 font-semibold">Montant suggéré : {Number(request.dgSuggestedAmount || 0).toLocaleString("fr-FR")} USD</p>
            <p className="mt-1 text-sm">Modifiez le montant et remplacez la cotation, puis renvoyez-la à la DG.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden border-[#D1965B]/15 bg-white shadow-sm">
            <div className="border-b border-[#D1965B]/12 px-6 py-5">
              <h2 className="text-lg font-bold text-[#5C4033]">
                Dossier à coter
              </h2>
              <p className="mt-1 text-sm text-[#5C4033]/55">
                Consultez le dossier avant d&apos;établir la cotation.
              </p>
            </div>

            <CardContent className="space-y-6 p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="min-w-0 rounded-2xl border border-[#D1965B]/15 bg-[#F8F5EF] p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-white p-2.5 text-[#D1965B] shadow-sm">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#5C4033]/50">
                        Demandeur
                      </p>
                      <p className="mt-1 break-words font-semibold text-[#5C4033]">
                        {requesterName}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="min-w-0 rounded-2xl border border-[#D1965B]/15 bg-[#F8F5EF] p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-white p-2.5 text-[#D1965B] shadow-sm">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#5C4033]/50">
                        Espace demandé
                      </p>
                      <p className="mt-1 break-words font-semibold text-[#5C4033]">
                        {requestedSpace}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="min-w-0 rounded-2xl border border-[#D1965B]/15 bg-[#F8F5EF] p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-white p-2.5 text-[#D1965B] shadow-sm">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#5C4033]/50">
                        Date souhaitée
                      </p>
                      <p className="mt-1 break-words font-semibold text-[#5C4033]">
                        {formatRequestDate(requestedDate)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="min-w-0 rounded-2xl border border-[#D1965B]/15 bg-[#F8F5EF] p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-white p-2.5 text-[#D1965B] shadow-sm">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#5C4033]/50">
                        Coordonnées
                      </p>
                      <p className="mt-1 break-all text-sm font-medium text-[#5C4033]">
                        {request.user?.email || "Email non renseigné"}
                      </p>
                      <p className="mt-2 flex items-center gap-2 break-words text-sm text-[#5C4033]/65">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        {request.user?.phone || "Téléphone non renseigné"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#5C4033]">
                  Description de la demande
                </h3>
                <p className="mt-2 whitespace-pre-wrap break-words rounded-2xl border border-[#D1965B]/10 bg-[#F8F5EF] p-4 text-sm leading-7 text-[#5C4033]/75 sm:p-5">
                  {request.description || "Aucune description fournie."}
                </p>
              </div>
            </CardContent>
          </Card>

          <RequestDocuments
            documents={documents}
            title="Documents transmis aux Finances"
            emptyMessage="Les trois documents attendus sont absents."
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

            <CardContent className="space-y-4 p-5 sm:p-6">
              {history.map((entry) => (
                <div
                  key={entry.id}
                    className="rounded-xl border border-[#D1965B]/10 bg-[#F8F5EF] p-4"
                >
                  <p className="font-semibold text-[#5C4033]">
                    {entry.fromDepartment} →{" "}
                    {entry.toDepartment}
                  </p>

                  <p className="mt-1 text-sm text-[#5C4033]/60">
                    {entry.comment}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit overflow-hidden border-[#D1965B]/15 bg-white shadow-sm lg:sticky lg:top-6">
          <div className="border-b border-[#D1965B]/12 bg-[#F8F5EF] px-6 py-5">
            <h2 className="text-lg font-bold text-[#5C4033]">
              Cotation financière
            </h2>
            <p className="mt-1 text-sm text-[#5C4033]/55">
              Montant, commentaire et signature obligatoires.
            </p>
          </div>

          <CardContent className="space-y-5 p-5 sm:p-6">
            {!canProcess ? (
              <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                Cette demande n&apos;est plus assignée
                aux Finances.
              </p>
            ) : (
              <>
                <div className="space-y-3 rounded-xl border border-[#D1965B]/20 bg-[#F8F5EF] p-4">
                  <div>
                    <p className="font-semibold text-[#5C4033]">
                      Document de cotation *
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#5C4033]/60">
                      Ajoutez la cotation qui deviendra le quatrième document du dossier.
                    </p>
                  </div>

                  {financeQuote || quoteUploaded ? (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                      <p className="flex items-center gap-2 text-sm font-semibold text-green-800">
                        <CheckCircle2 className="h-4 w-4" />
                        Cotation ajoutée
                      </p>
                      <p className="mt-1 break-words text-xs text-green-700">
                        {financeQuote?.name || "Document de cotation enregistré"}
                      </p>
                    </div>
                  ) : (
                    <>
                      <label
                        htmlFor="financeQuoteFile"
                        className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-[#D1965B]/30 bg-white p-5 text-center hover:border-[#D1965B]"
                      >
                        <Upload className="h-6 w-6 text-[#D1965B]" />
                        <p className="mt-2 break-all text-sm font-medium text-[#5C4033]">
                          {quoteFile ? quoteFile.name : "Choisir la cotation"}
                        </p>
                        <p className="mt-1 text-xs text-[#5C4033]/50">
                          PDF, DOC ou DOCX — maximum 10 Mo
                        </p>
                        <input
                          id="financeQuoteFile"
                          type="file"
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={handleQuoteFileChange}
                          disabled={uploadingQuote}
                          className="sr-only"
                        />
                      </label>

                      <Button
                        type="button"
                        onClick={() => void handleUploadQuote()}
                        disabled={!quoteFile || uploadingQuote}
                        className="w-full bg-[#D1965B] text-white hover:bg-[#B97D47]"
                      >
                        {uploadingQuote ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        {uploadingQuote ? "Ajout en cours..." : "Ajouter la cotation"}
                      </Button>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">
                    Montant de la cotation en USD *
                  </Label>

                  <div className="relative">
                    <BadgeDollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="amount"
                      type="number"
                      min="1"
                      step="0.01"
                      value={amount}
                      onChange={(event) =>
                        setAmount(
                          event.target.value
                        )
                      }
                      className="h-11 border-[#D1965B]/25 pl-10 focus-visible:ring-[#D1965B]"
                      placeholder="Exemple : 1500.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comment">
                    Commentaire
                  </Label>

                  <Textarea
                    id="comment"
                    rows={5}
                    value={comment}
                    onChange={(event) =>
                      setComment(
                        event.target.value
                      )
                    }
                    placeholder="Détails de la cotation..."
                    className="border-[#D1965B]/25 focus-visible:ring-[#D1965B]"
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
                    className="border-[#D1965B]/25 focus-visible:ring-[#D1965B]"
                  />
                </div>

                <Button
                  type="button"
                  className="w-full bg-[#D1965B] text-white hover:bg-[#B97D47]"
                  disabled={processing !== null}
                  onClick={handleValidate}
                >
                  {processing === "validate" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}

                  Valider la cotation
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