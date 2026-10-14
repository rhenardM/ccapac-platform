import api from "@/lib/api";
import type {
  SpaceRequest,
  SpaceRequestDocument,
  ValidationHistory,
} from "@/services/spaceRequestService";

export const ASSIGNABLE_ROLES = [
  "MEMBER",
  "PROGRAMME_SUPERVISEUR",
  "PROGRAMME_ASSISTANT",
  "REGISSEUR_GENERAL",
  "DIRECTION_ARTISTIQUE_SUPERVISEUR",
  "DIRECTION_ARTISTIQUE_ASSISTANT",
  "COMMUNICATION",
  "JURIDIQUE_SUPERVISEUR",
  "JURIDIQUE_ASSISTANT",
  "FINANCE",
  "DG",
  "SUPERVISEUR",
] as const;

export type AssignableRole =
  (typeof ASSIGNABLE_ROLES)[number];

export interface SupervisedUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  role: string;
  email_verified: number | boolean;
  created_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

function validateId(id: number) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Identifiant invalide.");
  }
}

export function getDocumentDownloadUrl(
  documentUrl: string
) {
  if (/^https?:\/\//i.test(documentUrl)) {
    return documentUrl;
  }

  const apiBase = String(
    api.defaults.baseURL || ""
  ).replace(/\/+$/, "");

  const backendBase = apiBase.endsWith("/api")
    ? apiBase.slice(0, -4)
    : apiBase;

  return `${backendBase}/${documentUrl.replace(
    /^\/+/, ""
  )}`;
}

export const supervisorService = {
  async getOverview(): Promise<SpaceRequest[]> {
    const response = await api.get<
      ApiResponse<SpaceRequest[]>
    >("/space-requests/supervisor");

    return Array.isArray(response.data.data)
      ? response.data.data
      : [];
  },

  async getRequest(id: number): Promise<SpaceRequest> {
    validateId(id);

    const response = await api.get<
      ApiResponse<SpaceRequest>
    >(`/space-requests/${id}`);

    return response.data.data;
  },

  async getRequestDocuments(
    id: number
  ): Promise<SpaceRequestDocument[]> {
    validateId(id);

    const response = await api.get<
      ApiResponse<SpaceRequestDocument[]>
    >(`/space-requests/${id}/documents`);

    return Array.isArray(response.data.data)
      ? response.data.data
      : [];
  },

  async getRequestHistory(
    id: number
  ): Promise<ValidationHistory[]> {
    validateId(id);

    const response = await api.get<
      ApiResponse<ValidationHistory[]>
    >(`/space-requests/${id}/histories`);

    return Array.isArray(response.data.data)
      ? response.data.data
      : [];
  },

  async deleteRequest(id: number): Promise<void> {
    validateId(id);
    await api.delete(`/space-requests/${id}`);
  },

  async getUsers(): Promise<SupervisedUser[]> {
    const response = await api.get<
      ApiResponse<SupervisedUser[]>
    >("/auth/supervisor/users");

    return Array.isArray(response.data.data)
      ? response.data.data
      : [];
  },

  async assignRole(
    id: number,
    role: AssignableRole
  ): Promise<SupervisedUser> {
    validateId(id);

    const response = await api.put<
      ApiResponse<SupervisedUser>
    >(`/auth/supervisor/users/${id}/role`, {
      role,
    });

    return response.data.data;
  },

  async resetPassword(
    id: number,
    newPassword: string
  ): Promise<void> {
    validateId(id);

    await api.put(
      `/auth/supervisor/users/${id}/reset-password`,
      {
        new_password: newPassword,
      }
    );
  },

  async deleteUser(id: number): Promise<void> {
    validateId(id);
    await api.delete(`/auth/supervisor/users/${id}`);
  },
};