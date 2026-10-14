import api from "@/lib/api";

export type UserRole =
  | "MEMBER"
  | "ADMIN"
  | "SUPERVISEUR"
  | "DG"
  | "PROGRAMME_SUPERVISEUR"
  | "PROGRAMME_ASSISTANT"
  | "REGISSEUR_GENERAL"
  | "DIRECTION_ARTISTIQUE_SUPERVISEUR"
  | "DIRECTION_ARTISTIQUE_ASSISTANT"
  | "COMMUNICATION"
  | "JURIDIQUE_SUPERVISEUR"
  | "JURIDIQUE_ASSISTANT"
  | "FINANCE";

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  role: UserRole | string;
  email_verified: number | boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  emailSent?: boolean;
  pendingApproval?: boolean;
}

export interface MessageResponse {
  success: boolean;
  message: string;
}

export interface VerifyEmailResponse
  extends MessageResponse {
  user?: User;
}

const INTERNAL_DOMAIN = "centreculturel.cd";
const INTERNAL_AUTH_PATH =
  "/auth/internal/ccapac-validation-7d2f9a4c81";

const normalizeEmail = (value: string) =>
  String(value || "").trim().toLowerCase();

export function isInternalEmail(
  value: string
): boolean {
  const normalized = normalizeEmail(value);
  const separatorIndex = normalized.lastIndexOf("@");

  return (
    separatorIndex > 0 &&
    normalized.slice(separatorIndex + 1) ===
      INTERNAL_DOMAIN
  );
}

// Connexion publique existante : inchangée.
export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>(
    "/auth/login",
    {
      email: normalizeEmail(email),
      password,
    }
  );

  if (!data.success || !data.token || !data.user) {
    throw new Error(
      data.message || "Réponse de connexion invalide"
    );
  }

  return data;
}

export async function loginWithGoogle(
  credential: string
): Promise<LoginResponse> {
  const normalizedCredential = String(
    credential || ""
  ).trim();

  if (!normalizedCredential) {
    throw new Error("Jeton Google manquant.");
  }

  const { data } = await api.post<LoginResponse>(
    "/auth/google",
    {
      credential: normalizedCredential,
    }
  );

  if (!data.success || !data.token || !data.user) {
    throw new Error(
      data.message ||
        "Réponse de connexion Google invalide"
    );
  }

  return data;
}

// Inscription publique existante : inchangée.
export async function register(
  values: RegisterData
): Promise<RegisterResponse> {
  const { data } =
    await api.post<RegisterResponse>(
      "/auth/register",
      {
        ...values,
        email: normalizeEmail(values.email),
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        phone: values.phone?.trim() || null,
      }
    );

  if (!data.success) {
    throw new Error(data.message);
  }

  return data;
}

export async function internalLogin(
  email: string,
  password: string
): Promise<LoginResponse> {
  const normalizedEmail = normalizeEmail(email);

  if (!isInternalEmail(normalizedEmail)) {
    throw new Error(
      "Utilisez une adresse @centreculturel.cd."
    );
  }

  const { data } = await api.post<LoginResponse>(
    `${INTERNAL_AUTH_PATH}/login`,
    {
      email: normalizedEmail,
      password,
    }
  );

  if (!data.success || !data.token || !data.user) {
    throw new Error(
      data.message || "Réponse de connexion invalide"
    );
  }

  return data;
}

export async function internalRegister(
  values: RegisterData
): Promise<RegisterResponse> {
  const normalizedEmail = normalizeEmail(values.email);

  if (!isInternalEmail(normalizedEmail)) {
    throw new Error(
      "Utilisez une adresse @centreculturel.cd."
    );
  }

  const { data } =
    await api.post<RegisterResponse>(
      `${INTERNAL_AUTH_PATH}/register`,
      {
        ...values,
        email: normalizedEmail,
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        phone: values.phone?.trim() || null,
      }
    );

  if (!data.success) {
    throw new Error(data.message);
  }

  return data;
}

export async function getProfile(): Promise<User> {
  const { data } = await api.get<{
    user?: User;
    data?: User;
  }>("/auth/profile");

  const user = data.user ?? data.data;

  if (!user) {
    throw new Error("Profil absent");
  }

  return user;
}

export async function forgotPassword(
  value: string
): Promise<MessageResponse> {
  const { data } =
    await api.post<MessageResponse>(
      "/auth/forgot-password",
      { email: normalizeEmail(value) }
    );

  if (!data.success) {
    throw new Error(data.message);
  }

  return data;
}

export async function resetPassword(
  token: string,
  password: string
): Promise<MessageResponse> {
  const { data } =
    await api.post<MessageResponse>(
      "/auth/reset-password",
      {
        token: token.trim(),
        new_password: password,
      }
    );

  if (!data.success) {
    throw new Error(data.message);
  }

  return data;
}

export async function verifyEmail(
  token: string
): Promise<VerifyEmailResponse> {
  const { data } =
    await api.get<VerifyEmailResponse>(
      "/auth/verify-email",
      {
        params: { token: token.trim() },
      }
    );

  if (!data.success) {
    throw new Error(data.message);
  }

  return data;
}

export async function resendVerification(
  value: string
): Promise<MessageResponse> {
  const { data } =
    await api.post<MessageResponse>(
      "/auth/resend-verification",
      { email: normalizeEmail(value) }
    );

  if (!data.success) {
    throw new Error(data.message);
  }

  return data;
}

export async function updateProfile(
  values: Partial<User>
): Promise<User> {
  const { data } = await api.put<{
    user?: User;
    data?: User;
  }>("/auth/profile", values);

  const user = data.user ?? data.data;

  if (!user) {
    throw new Error("Profil mis à jour absent");
  }

  return user;
}
