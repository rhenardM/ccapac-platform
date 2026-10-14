
export type MakutaOperatorCode =
  | "DRC_MPESA"
  | "DRC_AIRTEL_MONEY"
  | "DRC_ORANGE_MONEY"
  | "DRC_AFRIMONEY"
  | "DRC_RAKKACASH"
  | "DRC_FIRSTBANK"
  | "DRC_ECOBANKPAY"
  | "DRC_FINCA"
  | "DRC_VISA_CP"
  | "DRC_VISA_CNP";

/** Statut interne normalisé (mapping depuis les codes Makuta TS/TF/TP). */
export type MakutaDonationStatus = "pending" | "succeeded" | "failed";

/** Codes de statut bruts renvoyés par Makuta (guide §8.5). */
export type MakutaRawStatus = "TS" | "TF" | "TP";

export type CreateMakutaTransactionInput = {
  operator: MakutaOperatorCode;
  /** Numéro Mobile Money / compte / téléphone du client. */
  accountNumber: string;
  currency: string;
  amount: number;
  /** Référence unique générée par notre système (idempotence côté Makuta). */
  thirdPartyReference: string;
  /** Description / objet du paiement. */
  reason: string;
  /** Requis uniquement pour DRC_VISA_CNP. */
  email?: string;
  /** Identité du donateur — requise par notre backend (reçu + suivi). */
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  /** Suivi « pour qui » : self | relative | organization. */
  donorType?: "self" | "relative" | "organization";
  /** Bénéficiaire (don au nom d'un proche/organisation). */
  beneficiaryName?: string;
  beneficiaryEmail?: string;
  beneficiaryMessage?: string;
};

export type MakutaTransaction = {
  /** Identifiant Makuta de la transaction. */
  id: string;
  thirdPartyReference: string;
  status: MakutaDonationStatus;
  currency: string;
  amount: number;
  /** URL de redirection sécurisée (Visa CNP — guide §6). */
  redirectUrl: string | null;
  /** Vrai si l'opérateur exige une confirmation OTP (ex. Rakkacash — guide §7). */
  requiresOtp: boolean;
  /** Message lisible renvoyé par la passerelle, le cas échéant. */
  message: string | null;
};

export class MakutaApiError extends Error {
  status: number;
  code: string;

  constructor({
    status,
    code,
    message,
  }: {
    status: number;
    code: string;
    message: string;
  }) {
    super(message);
    this.name = "MakutaApiError";
    this.status = status;
    this.code = code;
  }
}

/** Mode mock : DÉSACTIVÉ par défaut (on utilise le backend réel). Pour simuler
 *  le parcours en local sans backend : `MAKUTA_MOCK=true`. */
export function isMakutaMockEnabled() {
  return process.env.MAKUTA_MOCK === "true";
}

/** Mappe les codes de statut bruts Makuta (TS/TF/TP) vers notre statut interne. */
export function mapMakutaStatus(raw: MakutaRawStatus): MakutaDonationStatus {
  if (raw === "TS") return "succeeded";
  if (raw === "TF") return "failed";
  return "pending";
}

/* -------------------------------------------------------------------------- */
/* Backend de production — le frontend ne parle QU'À notre backend, jamais     */
/* directement à Makuta (l'OAuth2 et la signature RSA sont gérés côté serveur).*/
/* -------------------------------------------------------------------------- */

/** Base de l'API de dons (surchargeable via env). Sans slash final. */
const BACKEND_BASE_URL = (
  process.env.FUNDRAISING_API_BASE_URL ??
  "https://api-fundraising.centreculturel.cd/api/fundraising"
).replace(/\/+$/, "");

const MOBILE_MONEY_OPERATORS = new Set<MakutaOperatorCode>([
  "DRC_MPESA",
  "DRC_AIRTEL_MONEY",
  "DRC_ORANGE_MONEY",
  "DRC_AFRIMONEY",
  "DRC_RAKKACASH",
]);

/** Statut de notre backend (pending|paid|failed|expired) → statut interne UI. */
function mapBackendStatus(status: string): MakutaDonationStatus {
  if (status === "paid") return "succeeded";
  if (status === "failed" || status === "expired") return "failed";
  return "pending";
}

/** Palier de contribution dérivé du montant (bornes alignées sur le backend). */
function deriveTier(amount: number): string {
  if (amount >= 100000) return "partenaire_fondateur";
  if (amount >= 50000) return "grand_mecene";
  if (amount >= 25000) return "mecene";
  if (amount >= 5000) return "parrain";
  if (amount >= 1) return "ami_citoyen";
  return "libre";
}

/** Forme du don renvoyé par le backend dans `{ data: ... }`. */
type BackendDonation = {
  reference: string;
  status: string;
  amount: string | number;
  currency: string;
  redirectUrl: string | null;
  requiresOtp: boolean;
  message: string | null;
};

/** Normalise un don backend vers la forme MakutaTransaction attendue par l'UI. */
function toMakutaTransaction(d: BackendDonation): MakutaTransaction {
  return {
    id: d.reference,
    thirdPartyReference: d.reference,
    status: mapBackendStatus(d.status),
    currency: d.currency ?? "USD",
    amount: typeof d.amount === "string" ? Number(d.amount) : d.amount,
    redirectUrl: d.redirectUrl ?? null,
    requiresOtp: Boolean(d.requiresOtp),
    message: d.message ?? null,
  };
}

/** Appel HTTP vers notre backend, avec gestion d'erreur normalisée. */
async function backendFetch(
  path: string,
  init?: RequestInit
): Promise<BackendDonation> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch {
    throw new MakutaApiError({
      status: 502,
      code: "network_error",
      message: "Le service de paiement est momentanément injoignable.",
    });
  }

  const json = (await res.json().catch(() => null)) as {
    data?: BackendDonation;
    error?: string;
    code?: string;
  } | null;

  if (!res.ok || !json?.data) {
    throw new MakutaApiError({
      status: res.status || 502,
      code: json?.code ?? "payment_error",
      message: json?.error ?? "Le paiement n'a pas pu être traité.",
    });
  }

  return json.data;
}

/**
 * OAuth2 client_credentials → access_token (guide §3).
 * Le token expire après 300 s : prévoir un cache/renouvellement à l'intégration.
 */
export async function getAccessToken(): Promise<string> {
  // L'authentification OAuth2 Makuta est entièrement gérée par notre backend
  // (les secrets ne vivent jamais côté frontend). Conservé pour compatibilité
  // de signature ; non utilisé avec le backend de production.
  return "backend-managed";
}

/**
 * Signature RSA SHA-256 / PKCS#1 v1.5, encodée Base64 → en-tête X-Signature (guide §4).
 * - POST : signer le corps JSON compact (sans espaces ni retours ligne).
 * - GET  : signer le chemin de la requête.
 */
export function signRequest(payload: string): string {
  // La signature RSA SHA-256 est entièrement gérée par notre backend (la clé
  // privée ne vit jamais côté frontend). Conservé pour compatibilité de
  // signature ; non utilisé avec le backend de production.
  void payload;
  return "";
}

/**
 * Création d'une transaction C2B (guide §5).
 * Renvoie une transaction normalisée incluant `redirectUrl` (Visa CNP) et
 * `requiresOtp` (Rakkacash) afin que l'UI sache quelle branche suivre.
 */
export async function createTransaction(
  input: CreateMakutaTransactionInput
): Promise<MakutaTransaction> {
  if (isMakutaMockEnabled()) {
    return mockCreateTransaction(input);
  }

  if (!input.donorName || !input.donorEmail) {
    throw new MakutaApiError({
      status: 400,
      code: "invalid_request",
      message: "Le nom et l'e-mail du donateur sont requis.",
    });
  }

  const isCard = input.operator === "DRC_VISA_CNP";
  const isMobileMoney = MOBILE_MONEY_OPERATORS.has(input.operator);

  // Notre backend crée le donateur + le don, s'authentifie auprès de Makuta et
  // signe la requête. Il renvoie { data: { reference, status, redirectUrl, ... } }.
  const data = await backendFetch("/donations", {
    method: "POST",
    body: JSON.stringify({
      donorName: input.donorName,
      donorEmail: input.donorEmail,
      donorPhone: input.donorPhone || undefined,
      amount: input.amount,
      tier: deriveTier(input.amount),
      operator: input.operator,
      payNumber: isMobileMoney ? input.accountNumber : undefined,
      email: isCard ? input.email ?? input.donorEmail : undefined,
      // Suivi « pour qui » + bénéficiaire.
      donorType: input.donorType ?? "self",
      beneficiaryName: input.beneficiaryName,
      beneficiaryEmail: input.beneficiaryEmail,
      beneficiaryMessage: input.beneficiaryMessage,
    }),
  });

  return toMakutaTransaction(data);
}

/**
 * Confirmation OTP pour les opérateurs qui l'exigent (Rakkacash — guide §7).
 */
export async function confirmOtp(
  transactionId: string,
  otpCode: string
): Promise<MakutaTransaction> {
  if (isMakutaMockEnabled()) {
    return mockConfirmOtp(transactionId, otpCode);
  }

  // transactionId = notre référence (renvoyée par createTransaction).
  const data = await backendFetch(
    `/donations/${encodeURIComponent(transactionId)}/confirm-otp`,
    { method: "POST", body: JSON.stringify({ otpCode }) }
  );

  return toMakutaTransaction(data);
}

/**
 * Récupération du statut d'une transaction (guide §8). Mappe TS/TF/TP.
 */
export async function getTransaction(
  transactionId: string
): Promise<MakutaTransaction> {
  if (isMakutaMockEnabled()) {
    return mockGetTransaction(transactionId);
  }

  // transactionId = notre référence (le backend re-vérifie le statut auprès de Makuta).
  const data = await backendFetch(
    `/donations/status/${encodeURIComponent(transactionId)}`,
    { method: "GET" }
  );

  return toMakutaTransaction(data);
}

/**
 * Réponse d'erreur normalisée pour les routes API (calqué sur aksessifyErrorResponse).
 */
export function makutaErrorResponse(error: unknown) {
  if (error instanceof MakutaApiError) {
    return {
      body: { error: { code: error.code, message: error.message } },
      status: error.status,
    };
  }

  console.error("[Makuta] Erreur inattendue:", error);

  return {
    body: {
      error: {
        code: "internal_error",
        message: "Le paiement ne peut pas être traité pour le moment.",
      },
    },
    status: 500,
  };
}

/* -------------------------------------------------------------------------- */
/* Mock — simule le parcours complet pour permettre la démonstration de l'UI. */
/* À supprimer/désactiver (MAKUTA_MOCK=false) une fois l'intégration réelle    */
/* branchée ci-dessus.                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Le statut mock est dérivé de l'horodatage encodé dans l'id : une transaction
 * passe de `pending` à `succeeded` après MOCK_SETTLE_MS, ce qui permet de tester
 * le polling et les états d'attente sans backend.
 */
const MOCK_SETTLE_MS = 6000;

function mockCreateTransaction(
  input: CreateMakutaTransactionInput
): MakutaTransaction {
  const isVisaCnp = input.operator === "DRC_VISA_CNP";
  const requiresOtp = input.operator === "DRC_RAKKACASH";
  // L'id encode l'instant de création pour calculer un statut différé.
  const id = `mock_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  return {
    id,
    thirdPartyReference: input.thirdPartyReference,
    status: "pending",
    currency: input.currency,
    amount: input.amount,
    // En mock, on redirige vers la page de remerciement (en prod : URL Makuta Visa).
    redirectUrl: isVisaCnp
      ? `/faire-un-don/merci?transaction_id=${encodeURIComponent(id)}`
      : null,
    requiresOtp,
    message: null,
  };
}

function mockConfirmOtp(
  transactionId: string,
  otpCode: string
): MakutaTransaction {
  const settled: MakutaTransaction = {
    id: transactionId,
    thirdPartyReference: transactionId,
    status: "succeeded",
    currency: "USD",
    amount: 0,
    redirectUrl: null,
    requiresOtp: true,
    message: "Paiement confirmé.",
  };

  // En mock, tout code à 6 chiffres est accepté ; le reste échoue.
  if (!/^\d{6}$/.test(otpCode)) {
    throw new MakutaApiError({
      status: 400,
      code: "invalid_otp",
      message: "Code de confirmation invalide ou expiré.",
    });
  }

  return settled;
}

function mockGetTransaction(transactionId: string): MakutaTransaction {
  const createdAt = decodeMockTimestamp(transactionId);
  const settled =
    createdAt !== null && Date.now() - createdAt >= MOCK_SETTLE_MS;

  return {
    id: transactionId,
    thirdPartyReference: transactionId,
    status: settled ? "succeeded" : "pending",
    currency: "USD",
    amount: 0,
    redirectUrl: null,
    requiresOtp: false,
    message: null,
  };
}

function decodeMockTimestamp(id: string): number | null {
  const part = id.split("_")[1];
  if (!part) return null;

  const value = parseInt(part, 36);
  return Number.isNaN(value) ? null : value;
}
