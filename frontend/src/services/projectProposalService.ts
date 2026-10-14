import api from "@/lib/api";

export type ProjectProposalStatus =
  | "SUBMITTED"
  | "ASSIGNED"
  | "ASSISTANT_REVIEW"
  | "SUPERVISOR_REVIEW"
  | "CORRECTION_REQUESTED"
  | "APPROVED"
  | "REJECTED";

export type ProjectProposalDocument = {
  id: number;
  documentType: string;
  documentName: string;
  documentPath: string;
  documentMimeType?: string | null;
  documentSize?: number | null;
  createdAt: string;
};

export type ProjectProposalHistory = {
  id: number;
  action: string;
  previousStatus?: string | null;
  newStatus?: string | null;
  comment?: string | null;
  performedAt: string;
  performedByName?: string | null;
  performedByEmail?: string | null;
};

export type ProjectProposal = {
  id: number;
  reference: string;
  user_id: number;
  title: string;
  category: string;
  summary: string;
  intention_note: string;
  objectives: string;
  planned_activities: string;
  target_audience: string;
  expected_impact?: string | null;
  preferred_location?: string | null;
  start_date: string;
  end_date: string;
  estimated_participants?: number | null;
  estimated_budget: number | string;
  technical_needs: string;
  partners?: string | null;
  team: string;
  previous_work?: string | null;
  additional_information?: string | null;
  support_requested?: string[];
  electronic_signature: string;
  status: ProjectProposalStatus;
  current_step: string;
  assigned_to_user_id?: number | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  assignedToName?: string | null;
  assignedToEmail?: string | null;
  review_comment?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
  documentCount?: number;
  documents?: ProjectProposalDocument[];
  histories?: ProjectProposalHistory[];
};

type ListResponse = {
  success: boolean;
  data: ProjectProposal[];
};

type DetailResponse = {
  success: boolean;
  data: ProjectProposal;
};

export const projectProposalService = {
  async getArtisticProposals(params?: {
    status?: string;
    search?: string;
  }): Promise<ProjectProposal[]> {
    const { data } = await api.get<ListResponse>(
      "/project-proposals/artistic",
      { params }
    );

    return Array.isArray(data?.data) ? data.data : [];
  },

  async getOne(id: number): Promise<ProjectProposal> {
    const { data } = await api.get<DetailResponse>(
      `/project-proposals/artistic/${id}`
    );

    return data.data;
  },

  async assignAssistant(
    id: number,
    assistantId: number,
    comment?: string
  ): Promise<void> {
    await api.post(
      `/project-proposals/artistic/${id}/assign`,
      { assistantId, comment }
    );
  },

  async review(
    id: number,
    decision:
      | "APPROVE"
      | "REJECT"
      | "REQUEST_CORRECTION"
      | "RECOMMEND_APPROVAL"
      | "RECOMMEND_REJECTION",
    comment: string
  ): Promise<void> {
    await api.post(
      `/project-proposals/artistic/${id}/review`,
      { decision, comment }
    );
  },
};
