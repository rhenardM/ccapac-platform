import { cookies } from "next/headers";
import { jwtVerify, type JWTPayload } from "jose";
import prisma from "@/lib/prisma";

/**
 * Secret partagé avec le backend Node qui signe les jetons. Pas de valeur par
 * défaut : sans JWT_SECRET, aucun jeton n'est accepté (sinon n'importe qui
 * pourrait en forger un avec une clé publique connue).
 */
function getJwtSecret(): Uint8Array | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("[Auth] JWT_SECRET manquant : authentification désactivée.");
    return null;
  }
  return new TextEncoder().encode(secret);
}

/** Vérifie le jeton `accessToken` émis par le backend Node. */
export async function verifyAccessToken(): Promise<JWTPayload | null> {
  const secret = getJwtSecret();
  if (!secret) return null;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Les données de l'espace membre (inscriptions, activités, suggestions) restent
 * dans Prisma et référencent `User.id`. On rattache l'utilisateur Node à sa
 * ligne Prisma par email (les anciens comptes gardent leur historique), et on
 * la crée au premier passage pour les nouveaux comptes.
 */
async function getOrCreateDbUserId(user: {
  email: string;
  name: string;
  emailVerified: boolean;
  image: string | null;
  phone: string | null;
}): Promise<string> {
  const dbUser = await prisma.user.upsert({
    where: { email: user.email },
    update: {},
    create: {
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      image: user.image,
      phone: user.phone,
      isApproved: true,
    },
    select: { id: true },
  });
  return dbUser.id;
}

export interface AuthServerUser {
  /** Identifiant du compte dans le backend Node. */
  id: number;
  /** Identifiant `User.id` Prisma, à utiliser pour toute donnée Prisma. */
  dbUserId: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  name: string;
  phone: string | null;
  image: string | null;
  email_verified: boolean;
  emailVerified: boolean;
  isApproved: boolean;
  newsletterOptIn: boolean;
  address: string | null;
  city: string | null;
  country: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getUser(): Promise<AuthServerUser | null> {
  const payload = await verifyAccessToken();
  if (!payload) return null;

  try {
    const firstName =
      typeof payload.first_name === "string" ? payload.first_name : "";
    const lastName =
      typeof payload.last_name === "string" ? payload.last_name : "";
    const email = typeof payload.email === "string" ? payload.email : "";
    const verifiedValue = payload.email_verified ?? payload.emailVerified ?? true;
    const emailVerified =
      verifiedValue === true || verifiedValue === 1 || verifiedValue === "1";

    if (!email) return null;

    const name = `${firstName} ${lastName}`.trim() || email;
    const phone = typeof payload.phone === "string" ? payload.phone : null;
    const image = typeof payload.image === "string" ? payload.image : null;
    const dbUserId = await getOrCreateDbUserId({
      email,
      name,
      emailVerified,
      image,
      phone,
    });

    const createdAtValue =
      typeof payload.created_at === "string" ? new Date(payload.created_at) : new Date();
    const updatedAtValue =
      typeof payload.updated_at === "string" ? new Date(payload.updated_at) : createdAtValue;

    return {
      id: Number(payload.id),
      dbUserId,
      email,
      role: typeof payload.role === "string" ? payload.role : "MEMBER",
      first_name: firstName,
      last_name: lastName,
      name,
      phone,
      image,
      email_verified: emailVerified,
      emailVerified,
      isApproved: true,
      newsletterOptIn: false,
      address: typeof payload.address === "string" ? payload.address : null,
      city: typeof payload.city === "string" ? payload.city : null,
      country: typeof payload.country === "string" ? payload.country : null,
      createdAt: Number.isNaN(createdAtValue.getTime()) ? new Date() : createdAtValue,
      updatedAt: Number.isNaN(updatedAtValue.getTime()) ? new Date() : updatedAtValue,
    };
  } catch (error) {
    console.error("[Auth] Impossible de charger l'utilisateur :", error);
    return null;
  }
}

export async function isAdmin(): Promise<boolean> {
  const user = await getUser();
  return user?.role === "ADMIN";
}

export async function getSession() {
  const user = await getUser();
  return user ? { user } : null;
}
