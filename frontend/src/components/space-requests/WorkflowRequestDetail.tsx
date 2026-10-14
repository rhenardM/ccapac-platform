"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileSignature,
  FileText,
  History,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Send,
  Upload,
  User,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "../../components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCcapacSpace } from "@/constants/spaces";
import RequestDocuments from "@/components/space-requests/RequestDocuments";
import {
  spaceRequestService,
  type SpaceRequest,
  type SpaceRequestDocument,
  type SpaceRequestDocumentType,
  type ValidationHistory,
} from "@/services/spaceRequestService";
export type WorkflowRole =
  | "MEMBER"
  | "PROGRAMME"
  | "REGISSEUR_GENERAL"
  | "DIRECTION_ARTISTIQUE"
  | "COMMUNICATION"
  | "JURIDIQUE"
  | "FINANCE";
type WorkflowRequestDetailProps = {
  role: WorkflowRole;
  title: string;
  subtitle: string;
  backHref: string;
};
type ApiErrorResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  missingDocuments?: string[];
};
const MAX_FILE_SIZE =
  10 * 1024 * 1024;
const allowedExtensions = [
  ".pdf",
  ".doc",
  ".docx",
];
const departmentLabels: Record<
  string,
  string
> = {
  MEMBER: "Demandeur",
  PROGRAMME: "Service des Programmes",
  REGISSEUR_GENERAL:
    "Régisseur général",
  DIRECTION_ARTISTIQUE:
    "Direction artistique",
  COMMUNICATION:
    "Service Communication",
  JURIDIQUE: "Service juridique",
  FINANCE: "Service des Finances",
  ADMIN: "Administration",
};
const statusLabels: Record<
  string,
  string
> = {
  draft: "Brouillon",
  program_review:
    "Examen par les Programmes",
  artistic_initial_review:
    "Préparation de l’avis artistique",
  program_review_after_artistic:
    "Avis artistique retourné au Programme",
  artistic_final_review:
    "Validation artistique finale",
  parallel_communication_regisseur_review:
    "Validation Communication et Régisseur",
  program_review_after_parallel:
    "Retour au Programme après les validations",
  program_review_after_regisseur_rejection:
    "Refus du Régisseur retourné au Programme",
  general_review:
    "Examen par le Régisseur général",
  artistic_review:
    "Examen artistique",
  communication_review:
    "Examen Communication",
  awaiting_member_confirmation:
    "Confirmation du demandeur",
  program_review_after_confirmation:
    "Retour aux Programmes",
  legal_review:
    "Examen juridique",
  program_review_after_legal:
    "Retour du Juridique",
  finance_cotation:
    "Cotation financière",
  program_review_after_finance:
    "Retour des Finances",
  awaiting_payment_proof:
    "En attente de la preuve de paiement",
  program_payment_review:
    "Vérification du paiement",
  correction_requested:
    "Correction requise sous 5 jours",
  expired: "Délai de correction expiré",
  stopped_by_member:
    "Processus arrêté par le membre",
  completed: "Terminée",
  rejected: "Rejetée",
};
const expectedStatuses: Record<
  WorkflowRole,
  string[]
> = {
  MEMBER: [
    "draft",
    "awaiting_member_confirmation",
  ],
  PROGRAMME: [
    /*
     * submitted est conservé pour les
     * anciennes demandes.
     */
    "submitted",
    "program_review",
    "program_review_after_artistic",
    "program_review_after_confirmation",
    "program_review_after_parallel",
    "program_review_after_regisseur_rejection",
    "program_review_after_legal",
    "program_review_after_finance",
    "program_payment_review",
  ],
  REGISSEUR_GENERAL: [
    "general_review",
    "parallel_communication_regisseur_review",
  ],
  DIRECTION_ARTISTIQUE: [
    "artistic_review",
    "artistic_initial_review",
    "artistic_final_review",
  ],
  COMMUNICATION: [
    "communication_review",
    "parallel_communication_regisseur_review",
  ],
  JURIDIQUE: [
    "legal_review",
  ],
  FINANCE: [
    "finance_cotation",
  ],
};
const requiredUpload: Partial<
  Record<
    WorkflowRole,
    {
      type: Exclude<
        SpaceRequestDocumentType,
        "INITIAL_REQUEST"
      >;
      label: string;
      description: string;
    }
  >
> = {
  DIRECTION_ARTISTIQUE: {
    type: "ARTISTIC_OPINION",
    label:
      "Avis de la Direction artistique",
    description:
      "Ajoutez votre avis artistique avant de transmettre le dossier à la Communication.",
  },
  JURIDIQUE: {
    type: "LEGAL_DOCUMENT",
    label: "Document juridique",
    description:
      "Ajoutez le document juridique avant de retourner le dossier au Programme.",
  },
  FINANCE: {
    type: "FINANCE_QUOTE",
    label: "Cotation financière",
    description:
      "Ajoutez la cotation avant de retourner le dossier au Programme.",
  },
};
function getErrorMessage(
  error: unknown,
  fallback: string
) {
  if (
    isAxiosError<ApiErrorResponse>(
      error
    )
  ) {
    const missing =
      error.response?.data
        ?.missingDocuments;
    if (
      Array.isArray(missing) &&
      missing.length > 0
    ) {
      return `Documents manquants : ${missing.join(
        ", "
      )}`;
    }
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
function formatDate(
  value?: string | null
) {
  if (!value) {
    return "Non renseignée";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Non renseignée";
  }
  return date.toLocaleDateString(
    "fr-FR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}
function formatDateTime(
  value?: string | null
) {
  if (!value) {
    return "Non renseignée";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Non renseignée";
  }
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function getDescriptionWithSpace(
  request: SpaceRequest
) {
  const description = String(
    request.description || ""
  ).trim();
  const alreadyContainsSpace =
    /^(espace demandé|espace souhaité|espace sollicité)\s*:/im.test(
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
function getNextDestination(
  status: string
) {
  switch (status) {
    case "draft":
      return "Service des Programmes";
    case "program_review":
      return "Direction artistique";
    case "artistic_initial_review":
      return "Service des Programmes";
    case "program_review_after_artistic":
      return "Membre";
    case "awaiting_member_confirmation":
      return "Service des Programmes";
    case "program_review_after_confirmation":
      return "Direction artistique";
    case "artistic_final_review":
      return "Communication et Régisseur général";
    case "parallel_communication_regisseur_review":
      return "Service des Programmes";
    case "program_review_after_parallel":
      return "Service juridique";
    case "legal_review":
      return "Service des Finances";
    case "finance_cotation":
      return "Service des Programmes";
    case "program_review_after_finance":
      return "Demandeur";
    case "program_payment_review":
      return "Confirmation définitive au membre";
    default:
      return "étape suivante";
  }
}
function getDefaultComment(
  status: string
) {
  switch (status) {
    case "artistic_review":
    case "artistic_initial_review":
    case "artistic_final_review":
      return "Avis artistique favorable";
    case "communication_review":
    case "parallel_communication_regisseur_review":
      return "Éléments de communication vérifiés";
    case "legal_review":
      return "Examen juridique effectué";
    case "finance_cotation":
      return "Cotation financière établie";
    case "awaiting_member_confirmation":
      return "Documents lus et confirmés par le demandeur";
    default:
      return "Dossier examiné et validé";
  }
}
function StatusPill({
  status,
}: {
  status: string;
}) {
  const style =
    status === "rejected"
      ? "border-red-200 bg-red-50 text-red-700"
      : status === "completed"
        ? "border-green-200 bg-green-50 text-green-700"
        : "border-amber-200 bg-amber-50 text-amber-800";
  return (
    <span
      className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${style}`}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      {statusLabels[status] || status}
    </span>
  );
}
export default function WorkflowRequestDetail({
  role,
  title,
  subtitle,
  backHref,
}: WorkflowRequestDetailProps) {
  const params = useParams<{
    id: string;
  }>();
  const router = useRouter();
  const requestId = Number(params.id);
  const [request, setRequest] =
    useState<SpaceRequest | null>(null);
  const [documents, setDocuments] =
    useState<
      SpaceRequestDocument[]
    >([]);
  const [history, setHistory] =
    useState<ValidationHistory[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [processing, setProcessing] =
    useState(false);
  const [uploading, setUploading] =
    useState(false);
  const [documentFile, setDocumentFile] =
    useState<File | null>(null);
  const [comment, setComment] =
    useState("");
  const [signature, setSignature] =
    useState("");
  const [
    rejectionMode,
    setRejectionMode,
  ] = useState(false);
  const [paymentAmount, setPaymentAmount] =
    useState("");
  const loadData =
    useCallback(async () => {
      if (
        !Number.isInteger(requestId) ||
        requestId <= 0
      ) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [
          requestData,
          documentData,
          historyData,
        ] = await Promise.all([
          spaceRequestService.getOne(
            requestId
          ),
          spaceRequestService
            .getDocuments(requestId)
            .catch(() => []),
          spaceRequestService
            .getHistory(requestId)
            .catch(() => []),
        ]);
        setRequest(requestData);
        setDocuments(documentData);
        setHistory(historyData);
      } catch (error) {
        console.error(
          "Workflow request error:",
          isAxiosError(error)
            ? error.response?.data
            : error
        );
        toast.error(
          getErrorMessage(
            error,
            "Impossible de charger le dossier."
          )
        );
      } finally {
        setLoading(false);
      }
    }, [requestId]);
  useEffect(() => {
    void loadData();
  }, [loadData]);
  const normalizedStatus =
    request?.status
      ?.trim()
      .toLowerCase() || "";
  const normalizedDepartment = (
    request?.assignedDepartment ||
    request?.currentDepartment ||
    ""
  )
    .trim()
    .toUpperCase();
  const canProcess = useMemo(() => {
    if (!request) {
      return false;
    }
    const parallelReviewIsOpen = ![
      "program_review_after_regisseur_rejection",
      "correction_requested",
      "stopped_by_member",
      "expired",
    ].includes(normalizedStatus);
    const hasPendingRegisseurReview =
      role === "REGISSEUR_GENERAL" &&
      request.regisseurValidationState === "pending" &&
      request.communicationValidationState != null &&
      parallelReviewIsOpen;
    if (hasPendingRegisseurReview) {
      return true;
    }
    const statusAllowed =
      expectedStatuses[role].includes(
        normalizedStatus
      );
    if (!statusAllowed) {
      return false;
    }
    if (role === "MEMBER") {
      return true;
    }
    if (
      normalizedStatus ===
        "parallel_communication_regisseur_review" &&
      [
        "COMMUNICATION",
        "REGISSEUR_GENERAL",
      ].includes(role)
    ) {
      return true;
    }
    return normalizedDepartment === role;
  }, [
    request,
    role,
    normalizedStatus,
    normalizedDepartment,
  ]);
  const canReject =
    role === "MEMBER" ||
    role === "PROGRAMME" ||
    role === "REGISSEUR_GENERAL";
  const uploadConfiguration =
    requiredUpload[role];
  const uploadedDocument =
    uploadConfiguration
      ? documents.find(
          (document) =>
            document.type ===
            uploadConfiguration.type
        )
      : null;
  const fullName =
    request?.user?.username ||
    [
      request?.user?.firstName,
      request?.user?.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    "Demandeur";
  const requestedSpace =
    request?.spaceId != null
      ? getCcapacSpace(
          Number(request.spaceId)
        )
      : undefined;
  const requestedSpaceName =
    requestedSpace?.name ||
    "Non renseigné";
  const requesterPhone =
    request?.user?.phone ||
    "Non renseigné";
  const requesterEmail =
    request?.user?.email ||
    "Non renseigné";
  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];
    if (!file) {
      setDocumentFile(null);
      return;
    }
    const fileName =
      file.name.toLowerCase();
    const validExtension =
      allowedExtensions.some(
        (extension) =>
          fileName.endsWith(extension)
      );
    if (!validExtension) {
      event.target.value = "";
      setDocumentFile(null);
      toast.error(
        "Seuls les fichiers PDF, DOC et DOCX sont autorisés."
      );
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      event.target.value = "";
      setDocumentFile(null);
      toast.error(
        "Le fichier ne doit pas dépasser 10 Mo."
      );
      return;
    }
    setDocumentFile(file);
  };
  const handleUpload = async () => {
    if (
      !request ||
      !uploadConfiguration ||
      !documentFile ||
      uploading
    ) {
      return;
    }
    try {
      setUploading(true);
      await spaceRequestService.uploadDocument(
        request.id,
        uploadConfiguration.type,
        documentFile
      );
      setDocumentFile(null);
      toast.success(
        "Document ajouté avec succès."
      );
      await loadData();
    } catch (error) {
      console.error(
        "Workflow upload error:",
        isAxiosError(error)
          ? error.response?.data
          : error
      );
      toast.error(
        getErrorMessage(
          error,
          "Impossible d’ajouter le document."
        )
      );
    } finally {
      setUploading(false);
    }
  };
  const handleDecision = async () => {
    if (
      !request ||
      !canProcess ||
      processing
    ) {
      return;
    }
    const cleanSignature =
      signature.trim();
    const cleanComment =
      comment.trim();
    if (cleanSignature.length < 3) {
      toast.error(
        "La signature électronique est obligatoire."
      );
      return;
    }
    if (
      rejectionMode &&
      !canReject
    ) {
      toast.error(
        "Ce service ne peut pas refuser une demande."
      );
      return;
    }
    if (
      rejectionMode &&
      cleanComment.length < 5
    ) {
      toast.error(
        "Le motif du rejet doit contenir au moins 5 caractères."
      );
      return;
    }
    if (
      !rejectionMode &&
      uploadConfiguration &&
      !uploadedDocument
    ) {
      toast.error(
        `${uploadConfiguration.label} obligatoire avant la transmission.`
      );
      return;
    }
    try {
      setProcessing(true);
      if (rejectionMode) {
        await spaceRequestService.reject(
          request.id,
          cleanComment,
          cleanSignature
        );
        toast.success(
          "Demande signée et rejetée."
        );
      } else if (
        role === "MEMBER" &&
        normalizedStatus === "draft"
      ) {
        await spaceRequestService.submit(
          request.id,
          cleanSignature
        );
        toast.success(
          "Demande transmise au Programme."
        );
      } else if (
        role === "MEMBER" &&
        normalizedStatus ===
          "awaiting_member_confirmation"
      ) {
        await spaceRequestService.confirmMember(
          request.id,
          cleanSignature,
          cleanComment ||
            getDefaultComment(
              request.status
            )
        );
        toast.success(
          "Documents confirmés et transmis au Programme."
        );
      } else if (
        role === "FINANCE"
      ) {
        const amount = Number(
          paymentAmount
        );
        if (
          !Number.isFinite(amount) ||
          amount < 0
        ) {
          toast.error(
            "Le montant de la cotation est invalide."
          );
          return;
        }
        await spaceRequestService.validateFinance(
          request.id,
          amount,
          cleanComment ||
            getDefaultComment(
              request.status
            ),
          cleanSignature
        );
        toast.success(
          "Cotation transmise au Programme."
        );
      } else {
        await spaceRequestService.validate(
          request.id,
          cleanComment ||
            getDefaultComment(
              request.status
            ),
          cleanSignature
        );
        toast.success(
          `Dossier transmis à ${getNextDestination(
            request.status
          )}.`
        );
      }
      setComment("");
      setSignature("");
      setPaymentAmount("");
      setRejectionMode(false);
      await loadData();
      router.refresh();
    } catch (error) {
      console.error(
        "Workflow decision error:",
        isAxiosError(error)
          ? error.response?.data
          : error
      );
      toast.error(
        getErrorMessage(
          error,
          "Impossible de traiter la demande."
        )
      );
    } finally {
      setProcessing(false);
    }
  };
  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#D1965B]" />
          <p className="mt-4 text-sm text-[#5C4033]/60">
            Chargement du dossier...
          </p>
        </div>
      </div>
    );
  }
  if (!request) {
    return (
      <Card className="mx-auto mt-16 max-w-xl border-[#D1965B]/15 bg-white">
        <CardContent className="p-10 text-center">
          <FileText className="mx-auto h-12 w-12 text-[#D1965B]" />
          <h1 className="mt-4 text-xl font-bold text-[#5C4033]">
            Demande introuvable
          </h1>
          <Button
            asChild
            className="mt-6 bg-[#D1965B] text-white hover:bg-[#B97D47]"
          >
            <Link href={backHref}>
              Retour aux demandes
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm font-medium text-[#D1965B] hover:text-[#B97D47]"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux demandes
      </Link>
      <section className="rounded-2xl bg-[#D1965B] px-6 py-7 text-white shadow-sm sm:px-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">
              {request.reference}
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
              {request.eventName ||
                request.title}
            </h1>
            <p className="mt-2 text-sm text-white/80">
              {subtitle}
            </p>
          </div>
          <StatusPill
            status={request.status}
          />
        </div>
      </section>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)\_390px]">
        <div className="space-y-6">
          {role ===
          "REGISSEUR_GENERAL" ? (
            <Card className="border-[#D1965B]/15 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#D1965B]" />
                  <div>
                    <h2 className="font-bold text-[#5C4033]">
                      Informations de la
                      demande
                    </h2>
                    <p className="mt-1 text-sm text-[#5C4033]/55">
                      Informations extraites
                      automatiquement du
                      formulaire envoyé par
                      le demandeur.
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-[#D1965B]/10 bg-[#F8F5EF] p-4">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#5C4033]/50">
                      <User className="h-4 w-4 text-[#D1965B]" />
                      Nom du demandeur
                    </p>
                    <p className="mt-2 font-semibold text-[#5C4033]">
                      {fullName}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#D1965B]/10 bg-[#F8F5EF] p-4">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#5C4033]/50">
                      <Phone className="h-4 w-4 text-[#D1965B]" />
                      Numéro de téléphone
                    </p>
                    <p className="mt-2 font-semibold text-[#5C4033]">
                      {requesterPhone}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#D1965B]/10 bg-[#F8F5EF] p-4">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#5C4033]/50">
                      <Mail className="h-4 w-4 text-[#D1965B]" />
                      Adresse email
                    </p>
                    <p className="mt-2 break-all font-semibold text-[#5C4033]">
                      {requesterEmail}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#D1965B]/10 bg-[#F8F5EF] p-4">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#5C4033]/50">
                      <FileSignature className="h-4 w-4 text-[#D1965B]" />
                      Titre de l’événement
                    </p>
                    <p className="mt-2 font-semibold text-[#5C4033]">
                      {request.eventName ||
                        request.title ||
                        "Non renseigné"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#D1965B]/10 bg-[#F8F5EF] p-4">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#5C4033]/50">
                      <MapPin className="h-4 w-4 text-[#D1965B]" />
                      Espace demandé
                    </p>
                    <p className="mt-2 font-semibold text-[#5C4033]">
                      {requestedSpaceName}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#D1965B]/10 bg-[#F8F5EF] p-4">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#5C4033]/50">
                      <CalendarDays className="h-4 w-4 text-[#D1965B]" />
                      Date souhaitée
                    </p>
                    <p className="mt-2 font-semibold text-[#5C4033]">
                      {formatDate(
                        request.date ||
                          request.desiredDate
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <RequestDocuments
              documents={documents}
            />
          )}
          <Card className="border-[#D1965B]/15 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-[#D1965B]" />
                <h2 className="font-bold text-[#5C4033]">
                  Historique
                </h2>
              </div>
              {history.length === 0 ? (
                <p className="mt-5 text-sm text-[#5C4033]/60">
                  Aucun historique disponible.
                </p>
              ) : (
                <div className="mt-5 space-y-4">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl bg-[#F8F5EF] p-4"
                    >
                      <div className="flex flex-col justify-between gap-1 sm:flex-row">
                        <p className="font-semibold text-[#5C4033]">
                          {item.action}
                        </p>
                        <p className="text-xs text-[#5C4033]/45">
                          {formatDateTime(
                            item.performedAt
                          )}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-[#5C4033]/60">
                        {departmentLabels[
                          item.fromDepartment ||
                            ""
                        ] ||
                          item.fromDepartment}{" "}
                        →{" "}
                        {departmentLabels[
                          item.toDepartment ||
                            ""
                        ] ||
                          item.toDepartment}
                      </p>
                      {item.comment && (
                        <p className="mt-3 text-sm text-[#5C4033]/75">
                          {item.comment}
                        </p>
                      )}
                      {item.electronicSignature && (
                        <p className="mt-3 border-t border-[#D1965B]/10 pt-3 font-serif text-xl italic text-[#5C4033]">
                          {
                            item.electronicSignature
                          }
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <aside className="space-y-5 xl:sticky xl:top-6">
          {canProcess &&
            uploadConfiguration && (
              <Card className="border-[#D1965B]/15 bg-white shadow-sm">
                <CardContent className="p-5">
                  <h2 className="font-bold text-[#5C4033]">
                    {
                      uploadConfiguration.label
                    }
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#5C4033]/60">
                    {
                      uploadConfiguration.description
                    }
                  </p>
                  {uploadedDocument ? (
                    <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
                      <p className="flex items-center gap-2 text-sm font-semibold text-green-800">
                        <CheckCircle2 className="h-4 w-4" />
                        Document ajouté
                      </p>
                      <p className="mt-2 truncate text-xs text-green-700">
                        {
                          uploadedDocument.name
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <label
                        htmlFor="workflowDocument"
                        className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-[#D1965B]/30 bg-[#F8F5EF] p-6 text-center"
                      >
                        <Upload className="h-7 w-7 text-[#D1965B]" />
                        <p className="mt-3 text-sm font-medium text-[#5C4033]">
                          {documentFile
                            ? documentFile.name
                            : "Choisir un document"}
                        </p>
                        <p className="mt-1 text-xs text-[#5C4033]/50">
                          PDF, DOC ou DOCX
                        </p>
                        <input
                          id="workflowDocument"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={
                            handleFileChange
                          }
                          disabled={
                            uploading
                          }
                          className="sr-only"
                        />
                      </label>
                      <Button
                        type="button"
                        disabled={
                          !documentFile ||
                          uploading
                        }
                        onClick={() =>
                          void handleUpload()
                        }
                        className="w-full bg-[#D1965B] text-white hover:bg-[#B97D47]"
                      >
                        {uploading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        Ajouter le document
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          <Card className="border-[#D1965B]/15 bg-white shadow-sm">
            <CardContent className="p-5">
              <h2 className="font-bold text-[#5C4033]">
                Décision
              </h2>
              {!canProcess ? (
                <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm font-semibold text-blue-900">
                    Aucune action disponible
                  </p>
                  <p className="mt-1 text-sm text-blue-800">
                    Le dossier est assigné à{" "}
                    {departmentLabels[
                      request.assignedDepartment ||
                        request.currentDepartment
                    ] ||
                      request.assignedDepartment ||
                      request.currentDepartment}
                    .
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {role === "FINANCE" &&
                    !rejectionMode && (
                      <div className="space-y-2">
                        <Label
                          htmlFor="paymentAmount"
                          className="text-[#5C4033]"
                        >
                          Montant de la cotation *
                        </Label>
                        <Input
                          id="paymentAmount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            paymentAmount
                          }
                          onChange={(event) =>
                            setPaymentAmount(
                              event.target.value
                            )
                          }
                          placeholder="0.00"
                          disabled={
                            processing
                          }
                        />
                      </div>
                    )}
                  <div className="space-y-2">
                    <Label
                      htmlFor="decisionComment"
                      className="text-[#5C4033]"
                    >
                      {rejectionMode
                        ? "Motif du rejet *"
                        : "Commentaire"}
                    </Label>
                    <textarea
                      id="decisionComment"
                      value={comment}
                      onChange={(event) =>
                        setComment(
                          event.target.value
                        )
                      }
                      rows={4}
                      disabled={processing}
                      placeholder={
                        rejectionMode
                          ? "Expliquez le motif du rejet..."
                          : "Ajoutez une observation..."
                      }
                      className="w-full resize-none rounded-xl border border-[#D1965B]/25 p-3 text-sm outline-none focus:border-[#D1965B] focus:ring-2 focus:ring-[#D1965B]/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="decisionSignature"
                      className="text-[#5C4033]"
                    >
                      Signature électronique *
                    </Label>
                    <Input
                      id="decisionSignature"
                      value={signature}
                      onChange={(event) =>
                        setSignature(
                          event.target.value
                        )
                      }
                      placeholder="Votre nom complet"
                      disabled={processing}
                    />
                    <div className="min-h-16 rounded-xl border border-dashed border-[#D1965B]/30 bg-[#F8F5EF] p-3">
                      <p className="font-serif text-lg italic text-[#5C4033]">
                        {signature.trim() ||
                          "Votre signature apparaîtra ici"}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    disabled={
                      processing ||
                      signature.trim().length <
                        3 ||
                      (rejectionMode &&
                        comment.trim().length <
                          5) ||
                      Boolean(
                        !rejectionMode &&
                        uploadConfiguration &&
                          !uploadedDocument
                      )
                    }
                    onClick={() =>
                      void handleDecision()
                    }
                    className={
                      rejectionMode
                        ? "w-full bg-red-600 text-white hover:bg-red-700"
                        : "w-full bg-[#D1965B] text-white hover:bg-[#B97D47]"
                    }
                  >
                    {processing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : rejectionMode ? (
                      <XCircle className="mr-2 h-4 w-4" />
                    ) : (
                      <FileSignature className="mr-2 h-4 w-4" />
                    )}
                    {processing
                      ? "Traitement..."
                      : rejectionMode
                        ? "Signer et rejeter"
                        : role === "REGISSEUR_GENERAL"
                          ? "Signer et envoyer"
                          : `Signer et transmettre à ${getNextDestination(
                              request.status
                            )}`}
                  </Button>
                  {canReject &&
                    role !== "MEMBER" && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={processing}
                      onClick={() => {
                        setRejectionMode(
                          (previous) =>
                            !previous
                        );
                        setComment("");
                        setSignature("");
                      }}
                      className={
                        rejectionMode
                          ? "w-full border-[#D1965B]/30 text-[#5C4033]"
                          : "w-full border-red-200 text-red-700 hover:bg-red-50"
                      }
                    >
                      {rejectionMode ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Revenir à la validation
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-2 h-4 w-4" />
                          Rejeter la demande
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}