import api from "@/lib/api";
import type {
  SpaceRequest,
} from "@/services/spaceRequestService";

export interface ProgrammeAssistant {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  role: "PROGRAMME_ASSISTANT";
  activeRequests: number;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const programmeTeamService = {
  async getAssistants(): Promise<ProgrammeAssistant[]> {
    const response = await api.get<
      ApiResponse<ProgrammeAssistant[]>
    >("/space-requests/programme/assistants");

    return Array.isArray(response.data.data)
      ? response.data.data
      : [];
  },

  async assignRequest(
    requestId: number,
    assistantId: number,
    comment = ""
  ): Promise<SpaceRequest> {
    const response = await api.post<
      ApiResponse<SpaceRequest>
    >(
      `/space-requests/${requestId}/assign-programme-assistant`,
      {
        assistantId,
        comment: comment.trim(),
      }
    );

    return response.data.data;
  },

  async unassignRequest(
    requestId: number,
    comment = ""
  ): Promise<SpaceRequest> {
    const response = await api.post<
      ApiResponse<SpaceRequest>
    >(
      `/space-requests/${requestId}/unassign-programme-assistant`,
      {
        comment: comment.trim(),
      }
    );

    return response.data.data;
  },
};
