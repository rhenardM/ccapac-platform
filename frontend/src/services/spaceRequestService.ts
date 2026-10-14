import api from "@/lib/api";
export type SpaceRequestDocumentType =
  | "INITIAL_REQUEST"
  | "REQUEST_LETTER"
  | "ARTISTIC_OPINION"
  | "LEGAL_DOCUMENT"
  | "FINANCE_QUOTE"
  | "PAYMENT_PROOF";
export interface ReservationSlot {
  id?: number;
  date: string;
  spaceId: number;
}
export interface CorrectionPayload {
  eventName: string;
  description?: string;
  slots?: ReservationSlot[];
  electronicSignature: string;
  comment?: string;
}
export interface CreateSpaceRequestData {
  fullName: string;
  email: string;
  phone?: string;
  eventName: string;
  space: number;
  date?: string;
  startTime?: string;
  endTime?: string;
  participants?: number;
  description?: string;
  slots?: ReservationSlot[];
}
export interface GenerateWordPayload {
  values: Record<string, string>;
  space: number;
  selectedSpace: string;
  selectedObjectives: string[];
  selectedDisciplines: string[];
  selectedOperationalRoles: string[];
  authorizedRepresentative: boolean;
  acceptedDeclarations: boolean;
  electronicSignature?: string;
  slots?: ReservationSlot[];
}
export interface SpaceRequestDocument {
  id?: number;
  requestId?: number;
  type?: SpaceRequestDocumentType;
  name: string;
  url: string;
  mimeType?: string;
  size: number;
  uploadedAt?: string;
  uploadedBy?: {
    id: number;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
}
export interface SpaceRequestUser {
  id: number;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  phone?: string | null;
}
export interface DepartmentAssistant {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  role: string;
  activeRequests: number;
}
export interface BookedCalendarEvent {
  id: number;
  reference: string;
  title: string;
  date: string;
  spaceId?: number | null;
}
export interface HistoryPerformedBy {
  id?: number;
  username?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  role?: string | null;
}
export interface ValidationHistory {
  id: number;
  action: string;
  previousStatus?: string | null;
  newStatus: string;
  fromDepartment?: string | null;
  toDepartment?: string | null;
  comment?: string | null;
  electronicSignature?: string | null;
  performedAt: string;
  performedBy?: HistoryPerformedBy | null;
}
export interface SpaceRequest {
  id: number;
  reference: string;
  spaceId?: number | null;
  eventName: string;
  title?: string;
  description?: string;
  date?: string | null;
  desiredDate?: string | null;
  slots?: ReservationSlot[];
  status: string;
  currentDepartment: string;
  assignedDepartment?: string;
  assignedToUserId?: number | null;
  assignedTo?: {
    id: number;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  } | null;
  programmeReviewState?:
    | "unassigned"
    | "assigned"
    | "assistant_validated"
    | "assistant_rejected"
    | null;
  assistantComment?: string | null;
  assistantSignature?: string | null;
  assistantReviewedAt?: string | null;
  artisticAssignedToUserId?: number | null;
  artisticAssignedTo?: {
    id: number;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  } | null;
  artisticReviewState?:
    | "unassigned"
    | "assigned"
    | "assistant_validated"
    | "assistant_rejected"
    | null;
  artisticAssistantComment?: string | null;
  artisticAssistantSignature?: string | null;
  artisticAssistantReviewedAt?: string | null;
  legalAssignedToUserId?: number | null;
  legalAssignedTo?: {
    id: number;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  } | null;
  legalReviewState?:
    | "unassigned"
    | "assigned"
    | "assistant_validated"
    | "assistant_rejected"
    | null;
  legalAssistantComment?: string | null;
  legalAssistantSignature?: string | null;
  legalAssistantReviewedAt?: string | null;
  communicationValidationState?: "pending" | "validated" | null;
  communicationComment?: string | null;
  communicationSignature?: string | null;
  communicationValidatedBy?: number | null;
  communicationValidatedAt?: string | null;
  regisseurValidationState?: "pending" | "validated" | "refused" | null;
  regisseurComment?: string | null;
  regisseurSignature?: string | null;
  regisseurValidatedBy?: number | null;
  regisseurValidatedAt?: string | null;
  currentStep?: string | null;
  electronicSignature?: string | null;
  rejectionComment?: string | null;
  paymentAmount?: number | null;
  dgReviewState?: "pending" | "approved" | "revision_requested" | null;
  dgSuggestedAmount?: number | null;
  dgComment?: string | null;
  dgSignature?: string | null;
  dgReviewedBy?: number | null;
  dgReviewedAt?: string | null;
  financeRevisionCount?: number;
  submittedAt?: string | null;
  /*
   * Ancien document conservé pour
   * compatibilité avec les anciennes pages.
   */
  document?: SpaceRequestDocument | null;
  /*
   * Nouvelle collection de documents.
   */
  documents?: SpaceRequestDocument[];
  user?: SpaceRequestUser | null;
  createdAt: string;
  updatedAt?: string;
}
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  error?: string;
  data: T;
}
function validateRequestId(id: number) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Identifiant de demande invalide.");
  }
}
function requireSignature(electronicSignature: string) {
  const signature = electronicSignature.trim();
  if (signature.length < 3) {
    throw new Error("La signature électronique est obligatoire.");
  }
  return signature;
}
function requireDocument(document: File) {
  if (!document) {
    throw new Error("Le document est obligatoire.");
  }
  const maximumSize = 10 * 1024 * 1024;
  if (document.size > maximumSize) {
    throw new Error("Le document ne doit pas dépasser 10 Mo.");
  }
  const allowedExtensions = [".pdf", ".doc", ".docx"];
  const fileName = document.name.toLowerCase();
  const validExtension = allowedExtensions.some((extension) =>
    fileName.endsWith(extension),
  );
  if (!validExtension) {
    throw new Error("Seuls les fichiers PDF, DOC et DOCX sont autorisés.");
  }
}
const documentEndpoints: Record<
  Exclude<SpaceRequestDocumentType, "INITIAL_REQUEST">,
  string
> = {
  REQUEST_LETTER: "request-letter",
  ARTISTIC_OPINION: "artistic-opinion",
  LEGAL_DOCUMENT: "legal-document",
  FINANCE_QUOTE: "finance-quote",
  PAYMENT_PROOF: "payment-proof",
};
export const spaceRequestService = {
  async generateWord(payload: GenerateWordPayload): Promise<Blob> {
    const response = await api.post<Blob>(
      "/space-requests/generate-word",
      payload,
      { responseType: "blob" },
    );
    return response.data;
  },
  async create(
    data: CreateSpaceRequestData,
    document: File,
  ): Promise<SpaceRequest> {
    requireDocument(document);
    if (!data.fullName.trim()) {
      throw new Error("Le nom complet est obligatoire.");
    }
    if (!data.email.trim()) {
      throw new Error("L’adresse email est obligatoire.");
    }
    if (!data.eventName.trim()) {
      throw new Error("L’intitulé de l’activité est obligatoire.");
    }
    const slots = (data.slots || [])
      .filter(
        (slot) =>
          /^\d{4}-\d{2}-\d{2}$/.test(slot.date) &&
          Number.isInteger(slot.spaceId) &&
          slot.spaceId >= 1 &&
          slot.spaceId <= 12,
      )
      .filter(
        (slot, index, values) =>
          values.findIndex(
            (candidate) =>
              candidate.date === slot.date &&
              candidate.spaceId === slot.spaceId,
          ) === index,
      );
    if (slots.length > 30) {
      throw new Error("Vous pouvez sélectionner au maximum 30 créneaux.");
    }
    const primarySlot =
      slots[0] || (data.date ? { date: data.date, spaceId: data.space } : null);
    if (!primarySlot) {
      throw new Error("La date souhaitée est obligatoire.");
    }
    const formData = new FormData();
    formData.append("document", document, document.name);
    formData.append("fullName", data.fullName.trim());
    formData.append("email", data.email.trim().toLowerCase());
    formData.append("phone", data.phone?.trim() || "");
    formData.append("eventName", data.eventName.trim());
    formData.append("space", String(primarySlot.spaceId));
    formData.append("date", primarySlot.date);
    formData.append(
      "slots",
      JSON.stringify(slots.length > 0 ? slots : [primarySlot]),
    );
    formData.append("startTime", data.startTime || "");
    formData.append("endTime", data.endTime || "");
    formData.append("participants", String(data.participants || 1));
    formData.append("description", data.description?.trim() || "");
    const response = await api.post<ApiResponse<SpaceRequest>>(
      "/space-requests",
      formData,
    );
    return response.data.data;
  },
  async getMyRequests(): Promise<SpaceRequest[]> {
    const response =
      await api.get<ApiResponse<SpaceRequest[]>>("/space-requests/my");
    return response.data.data;
  },
  async getDepartmentRequests(): Promise<SpaceRequest[]> {
    const response = await api.get<ApiResponse<SpaceRequest[]>>(
      "/space-requests/department",
    );
    return response.data.data;
  },
  async getProgrammeAssistants(): Promise<DepartmentAssistant[]> {
    const response = await api.get<ApiResponse<DepartmentAssistant[]>>(
      "/space-requests/programme/assistants",
    );
    return Array.isArray(response.data.data) ? response.data.data : [];
  },
  async assignProgrammeAssistant(
    id: number,
    assistantId: number,
    comment = "",
  ): Promise<SpaceRequest> {
    validateRequestId(id);
    if (!Number.isInteger(assistantId) || assistantId <= 0) {
      throw new Error("Assistant Programme invalide.");
    }
    const response = await api.post<ApiResponse<SpaceRequest>>(
      `/space-requests/${id}/assign-programme-assistant`,
      {
        assistantId,
        comment: comment.trim(),
      },
    );
    return response.data.data;
  },
  async getArtisticAssistants(): Promise<DepartmentAssistant[]> {
    const response = await api.get<ApiResponse<DepartmentAssistant[]>>(
      "/space-requests/artistic/assistants",
    );
    return Array.isArray(response.data.data) ? response.data.data : [];
  },
  async assignArtisticAssistant(
    id: number,
    assistantId: number,
    comment = "",
  ): Promise<SpaceRequest> {
    validateRequestId(id);
    if (!Number.isInteger(assistantId) || assistantId <= 0) {
      throw new Error("Assistant de la Direction artistique invalide.");
    }
    const response = await api.post<ApiResponse<SpaceRequest>>(
      `/space-requests/${id}/assign-artistic-assistant`,
      {
        assistantId,
        comment: comment.trim(),
      },
    );
    return response.data.data;
  },
  async getLegalAssistants(): Promise<DepartmentAssistant[]> {
    const response = await api.get<ApiResponse<DepartmentAssistant[]>>(
      "/space-requests/legal/assistants",
    );
    return Array.isArray(response.data.data) ? response.data.data : [];
  },
  async assignLegalAssistant(
    id: number,
    assistantId: number,
    comment = "",
  ): Promise<SpaceRequest> {
    validateRequestId(id);
    if (!Number.isInteger(assistantId) || assistantId <= 0) {
      throw new Error("Assistant juridique invalide.");
    }
    const response = await api.post<ApiResponse<SpaceRequest>>(
      `/space-requests/${id}/assign-legal-assistant`,
      {
        assistantId,
        comment: comment.trim(),
      },
    );
    return response.data.data;
  },
  async getDepartmentHistory(): Promise<SpaceRequest[]> {
    const response = await api.get<ApiResponse<SpaceRequest[]>>(
      "/space-requests/department/history",
    );
    return response.data.data;
  },
  async getOne(id: number): Promise<SpaceRequest> {
    validateRequestId(id);
    const response = await api.get<ApiResponse<SpaceRequest>>(
      `/space-requests/${id}`,
    );
    return response.data.data;
  },
  async getHistory(id: number): Promise<ValidationHistory[]> {
    validateRequestId(id);
    const response = await api.get<ApiResponse<ValidationHistory[]>>(
      `/space-requests/${id}/histories`,
    );
    return response.data.data;
  },
  /*
   * Charge les documents disponibles
   * pour une demande.
   */
  async getDocuments(id: number): Promise<SpaceRequestDocument[]> {
    validateRequestId(id);
    const response = await api.get<
      ApiResponse<
        Array<
          SpaceRequestDocument & {
            document_type?: SpaceRequestDocumentType;
            documentType?: SpaceRequestDocumentType;
          }
        >
      >
    >(`/space-requests/${id}/documents`);
    return response.data.data.map((document) => ({
      ...document,
      type: document.type || document.documentType || document.document_type,
    }));
  },
  /*
   * Ajoute l’avis artistique,
   * le document juridique ou
   * la cotation financière.
   */
  async uploadDocument(
    id: number,
    type: Exclude<SpaceRequestDocumentType, "INITIAL_REQUEST">,
    document: File,
  ): Promise<SpaceRequestDocument> {
    validateRequestId(id);
    requireDocument(document);
    const endpoint = documentEndpoints[type];
    if (!endpoint) {
      throw new Error("Type de document invalide.");
    }
    const formData = new FormData();
    formData.append("document", document, document.name);
    const response = await api.post<ApiResponse<SpaceRequestDocument>>(
      `/space-requests/${id}/documents/${endpoint}`,
      formData,
    );
    return response.data.data;
  },
  /*
   * Signature initiale du demandeur.
   */
  async submit(id: number, electronicSignature: string): Promise<SpaceRequest> {
    validateRequestId(id);
    const signature = requireSignature(electronicSignature);
    const response = await api.post<ApiResponse<SpaceRequest>>(
      `/space-requests/${id}/submit`,
      {
        electronicSignature: signature,
      },
    );
    return response.data.data;
  },
  /*
   * Décision signée du membre après réception
   * des documents de la Direction artistique.
   */
  async memberDecision(
    id: number,
    decision: "ACCEPTED" | "REFUSED",
    electronicSignature: string,
    comment = "",
  ): Promise<SpaceRequest> {
    validateRequestId(id);
    const signature = requireSignature(electronicSignature);
    const cleanComment = comment.trim();
    if (decision === "REFUSED" && cleanComment.length < 5) {
      throw new Error("Le motif du refus doit contenir au moins 5 caractères.");
    }
    const response = await api.post<ApiResponse<SpaceRequest>>(
      `/space-requests/${id}/member-decision`,
      {
        decision,
        electronicSignature: signature,
        comment: cleanComment,
      },
    );
    return response.data.data;
  },
  /*
   * Renvoi signé d'une demande après correction par le membre.
   * Cette action est utilisée lorsque le dossier a été retourné
   * au demandeur afin qu'il apporte les corrections demandées.
   */
  async resubmitCorrection(
    id: number,
    payload: CorrectionPayload,
  ): Promise<SpaceRequest> {
    validateRequestId(id);
    const signature = requireSignature(payload.electronicSignature);
    const eventName = payload.eventName.trim();
    if (!eventName) {
      throw new Error("L’intitulé de l’activité est obligatoire.");
    }
    const slots = payload.slots?.map((slot) => ({
      date: slot.date,
      spaceId: Number(slot.spaceId),
    }));
    const response = await api.post<ApiResponse<SpaceRequest>>(
      `/space-requests/${id}/resubmit-correction`,
      {
        eventName,
        description: payload.description?.trim() || "",
        slots,
        electronicSignature: signature,
        comment: payload.comment?.trim() || "",
      },
    );
    return response.data.data;
  },
  /*
   * Confirmation des deux documents :
   * formulaire initial + avis artistique.
   *
   * Aucun nouveau fichier n’est créé.
   */
  async confirmMember(
    id: number,
    electronicSignature: string,
    comment = "",
  ): Promise<SpaceRequest> {
    validateRequestId(id);
    const signature = requireSignature(electronicSignature);
    const response = await api.post<ApiResponse<SpaceRequest>>(
      `/space-requests/${id}/confirm`,
      {
        electronicSignature: signature,
        comment: comment.trim(),
      },
    );
    return response.data.data;
  },
  async getBookedCalendarEvents(): Promise<BookedCalendarEvent[]> {
    const response = await api.get<ApiResponse<BookedCalendarEvent[]>>(
      "/space-requests/calendar",
    );
    return Array.isArray(response.data.data) ? response.data.data : [];
  },
  /*
   * Le membre dépose la preuve de paiement de la cotation.
   * Le backend transmet ensuite le dossier au Programme avec
   * le statut program_payment_review.
   */
  async uploadPaymentProof(
    id: number,
    document: File,
    electronicSignature: string,
  ): Promise<SpaceRequest> {
    validateRequestId(id);
    requireDocument(document);
    const signature = electronicSignature.trim();
    if (signature.length < 3) {
      throw new Error("La signature électronique est obligatoire.");
    }
    const formData = new FormData();
    formData.append("document", document, document.name);
    formData.append("electronicSignature", signature);
    const response = await api.post<ApiResponse<SpaceRequest>>(
      `/space-requests/${id}/payment-proof`,
      formData,
    );
    return response.data.data;
  },
  /*
   * Validation signée d’un service.
   */
  async validate(
    id: number,
    comment: string,
    electronicSignature: string,
  ): Promise<SpaceRequest> {
    validateRequestId(id);
    const signature = requireSignature(electronicSignature);
    const response = await api.post<ApiResponse<SpaceRequest>>(
      `/space-requests/${id}/validate`,
      {
        comment: comment.trim(),
        electronicSignature: signature,
      },
    );
    return response.data.data;
  },
  /*
   * Avis signé de l'assistant Programme.
   * Le statut du workflow ne change pas : la demande
   * retourne au superviseur pour la décision finale.
   */
  async assistantReview(
    id: number,
    decision: "VALIDATED" | "REJECTED",
    comment: string,
    electronicSignature: string,
  ): Promise<SpaceRequest> {
    validateRequestId(id);
    const cleanComment = comment.trim();
    if (cleanComment.length < 5) {
      throw new Error("Le commentaire doit contenir au moins 5 caractères.");
    }
    const signature = requireSignature(electronicSignature);
    const response = await api.post<ApiResponse<SpaceRequest>>(
      `/space-requests/${id}/assistant-review`,
      {
        decision,
        comment: cleanComment,
        electronicSignature: signature,
      },
    );
    return response.data.data;
  },
  async artisticAssistantReview(
    id: number,
    decision: "VALIDATED" | "REJECTED",
    comment: string,
    electronicSignature: string,
  ): Promise<SpaceRequest> {
    validateRequestId(id);
    const cleanComment = comment.trim();
    if (cleanComment.length < 5) {
      throw new Error("Le commentaire doit contenir au moins 5 caractères.");
    }
    const signature = requireSignature(electronicSignature);
    const response = await api.post<ApiResponse<SpaceRequest>>(
      `/space-requests/${id}/artistic-assistant-review`,
      {
        decision,
        comment: cleanComment,
        electronicSignature: signature,
      },
    );
    return response.data.data;
  },
  async legalAssistantReview(
    id: number,
    decision: "VALIDATED" | "REJECTED",
    comment: string,
    electronicSignature: string,
  ): Promise<SpaceRequest> {
    validateRequestId(id);
    const cleanComment = comment.trim();
    if (cleanComment.length < 5) {
      throw new Error("Le commentaire doit contenir au moins 5 caractères.");
    }
    const signature = requireSignature(electronicSignature);
    const response = await api.post<ApiResponse<SpaceRequest>>(
      `/space-requests/${id}/legal-assistant-review`,
      {
        decision,
        comment: cleanComment,
        electronicSignature: signature,
      },
    );
    return response.data.data;
  },
  /*
   * Rejet signé d’un service.
   */
  async reject(
    id: number,
    comment: string,
    electronicSignature: string,
  ): Promise<SpaceRequest> {
    validateRequestId(id);
    const cleanComment = comment.trim();
    if (cleanComment.length < 5) {
      throw new Error("Le motif du rejet doit contenir au moins 5 caractères.");
    }
    const signature = requireSignature(electronicSignature);
    const response = await api.post<ApiResponse<SpaceRequest>>(
      `/space-requests/${id}/reject`,
      {
        comment: cleanComment,
        electronicSignature: signature,
      },
    );
    return response.data.data;
  },
  /*
   * Validation financière.
   *
   * Le document FINANCE_QUOTE doit avoir
   * été ajouté avant cet appel.
   */
  async validateFinance(
    id: number,
    paymentAmount: number,
    comment: string,
    electronicSignature: string,
  ): Promise<SpaceRequest> {
    validateRequestId(id);
    if (!Number.isFinite(paymentAmount) || paymentAmount < 0) {
      throw new Error("Le montant de la cotation est invalide.");
    }
    const signature = requireSignature(electronicSignature);
    const response = await api.post<ApiResponse<SpaceRequest>>(
      `/space-requests/${id}/validate`,
      {
        paymentAmount,
        comment: comment.trim(),
        electronicSignature: signature,
      },
    );
    return response.data.data;
  },
  async getDGRequests(): Promise<SpaceRequest[]> {
    const response =
      await api.get<ApiResponse<SpaceRequest[]>>("/space-requests/dg");
    return Array.isArray(response.data.data) ? response.data.data : [];
  },
  async reviewDGCotation(
    id: number,
    decision: "approve" | "revision",
    comment: string,
    electronicSignature: string,
    suggestedAmount?: number,
  ): Promise<SpaceRequest> {
    validateRequestId(id);
    const signature = requireSignature(electronicSignature);
    if (
      decision === "revision" &&
      (!Number.isFinite(suggestedAmount) || Number(suggestedAmount) <= 0)
    ) {
      throw new Error("Le montant suggéré doit être positif.");
    }
    const response = await api.post<ApiResponse<SpaceRequest>>(
      `/space-requests/${id}/dg-cotation-review`,
      {
        decision,
        comment: comment.trim(),
        electronicSignature: signature,
        suggestedAmount,
      },
    );
    return response.data.data;
  },
};
