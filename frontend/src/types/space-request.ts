export type UserRole =
  | "MEMBER"
  | "ADMIN"
  | "PROGRAMME"
  | "REGISSEUR_GENERAL"
  | "DIRECTION_ARTISTIQUE"
  | "COMMUNICATION"
  | "JURIDIQUE"
  | "FINANCE";

export type SpaceRequestStatus =
  | "brouillon"
  | "en_attente_programme"
  | "en_attente_regisseur"
  | "en_attente_direction_artistique"
  | "en_attente_communication"
  | "en_attente_confirmation_membre"
  | "en_attente_juridique"
  | "en_attente_finance"
  | "en_attente_programme_cotation"
  | "cotation_transmise"
  | "programme_refuse"
  | "regisseur_general_refuse"
  | "direction_artistique_refuse"
  | "communication_refuse"
  | "juridique_refuse"
  | "finance_refuse";

export interface Space {
  id: number;
  name: string;
  capacity?: number | null;
  active?: boolean;
}

export interface RequestUser {
  id: number;
  username: string;
  email: string;
}

export interface ValidationHistory {
  id: number;
  action: "SUBMIT" | "VALIDATE" | "REJECT";
  fromDepartment: string | null;
  toDepartment: string | null;
  comment: string | null;
  performedBy: {
    username: string;
  };
  performedAt: string;
}

export type SpaceRequest = import("@/services/spaceRequestService").SpaceRequest;

export interface CreateSpaceRequestData {
  eventName: string;
  space: number;
  date: string;
  startTime: string;
  endTime: string;
  participants: number;
  description?: string;
}

export interface ValidateSpaceRequestData {
  comment?: string;
  paymentAmount?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}