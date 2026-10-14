"use client";

import {
  useEffect,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Globe2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { ProfilePhotoUploader } from "./ProfilePhotoUploader";

type CompatibleUser = {
  id?: number | string;
  email?: string;
  role?: string;

  name?: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;

  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  image?: string | null;

  emailVerified?: boolean;
  email_verified?: boolean;

  createdAt?: string;
  created_at?: string;
};

const roleLabels: Record<string, string> = {
  MEMBER: "Membre",
  ADMIN: "Administrateur",
  SUPERVISEUR: "Superviseur",
  DG: "Direction générale",
  PROGRAMME_SUPERVISEUR:
    "Superviseur des Programmes",
  PROGRAMME_ASSISTANT:
    "Assistant des Programmes",
  REGISSEUR_GENERAL:
    "Régisseur général",
  DIRECTION_ARTISTIQUE_SUPERVISEUR:
    "Superviseur artistique",
  DIRECTION_ARTISTIQUE_ASSISTANT:
    "Assistant artistique",
  COMMUNICATION:
    "Service Communication",
  JURIDIQUE_SUPERVISEUR:
    "Superviseur juridique",
  JURIDIQUE_ASSISTANT:
    "Assistant juridique",
  FINANCE: "Service des Finances",
};

function formatMemberSince(
  value?: string | null,
) {
  if (!value) {
    return "Date non renseignée";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date non renseignée";
  }

  return date.toLocaleDateString(
    "fr-FR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  );
}

export default function ProfilePage() {
  const router = useRouter();

  const {
    user: authenticatedUser,
    loading,
  } = useAuth();

  const user =
    authenticatedUser as CompatibleUser | null;

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace(
        "/auth/login?redirect=/espace-membre/profile",
      );

      return;
    }

    if (user.role === "ADMIN") {
      router.replace(
        "/espace-membre/admin",
      );
    }
  }, [loading, router, user]);

  const fullName = useMemo(() => {
    if (!user) {
      return "Utilisateur";
    }

    const composedName = [
      user.first_name ||
        user.firstName,
      user.last_name ||
        user.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return (
      user.name ||
      composedName ||
      user.email ||
      "Utilisateur"
    );
  }, [user]);

  const initials = useMemo(() => {
    if (!fullName) {
      return "U";
    }

    const parts = fullName
      .split(" ")
      .filter(Boolean);

    if (parts.length === 1) {
      return parts[0]
        .slice(0, 2)
        .toUpperCase();
    }

    return `${parts[0][0]}${
      parts[parts.length - 1][0]
    }`.toUpperCase();
  }, [fullName]);

  if (loading) {
    return (
      <div className="flex min-h-[520px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D1965B]/10">
            <Loader2 className="h-8 w-8 animate-spin text-[#D1965B]" />
          </div>

          <p className="mt-4 text-sm font-medium text-[#5C4033]/60">
            Chargement de votre profil...
          </p>
        </div>
      </div>
    );
  }

  if (!user || user.role === "ADMIN") {
    return (
      <div className="flex min-h-[520px] items-center justify-center">
        <Loader2 className="h-9 w-9 animate-spin text-[#D1965B]" />
      </div>
    );
  }

  const emailVerified =
    user.emailVerified ??
    user.email_verified ??
    false;

  const createdAt =
    user.createdAt ||
    user.created_at ||
    null;

  const memberSince =
    formatMemberSince(createdAt);

  const roleLabel =
    roleLabels[user.role || ""] ||
    user.role ||
    "Membre";

  const hasLocation =
    Boolean(user.address) ||
    Boolean(user.city) ||
    Boolean(user.country);

  return (
    <div className="mx-auto max-w-6xl space-y-7 pb-10">
      {/* En-tête */}
      <section className="relative overflow-hidden rounded-[2rem] bg-[#39251D] p-6 text-white shadow-xl sm:p-8 lg:p-10">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#D1965B]/35 blur-3xl" />

        <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-[#E7B57F]/15 blur-3xl" />

        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center">
          <div className="relative shrink-0">
            <div className="rounded-[1.75rem] border border-white/15 bg-white/10 p-2 shadow-lg backdrop-blur">
              <ProfilePhotoUploader
                initialImageUrl={
                  user.image || null
                }
                userName={fullName}
              />
            </div>

            <div className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border-4 border-[#39251D] bg-emerald-500 shadow-lg">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#F4D7B7]">
              <Sparkles className="h-3.5 w-3.5" />
              Espace personnel
            </div>

            <h1 className="mt-4 break-words text-3xl font-black tracking-tight sm:text-4xl">
              {fullName}
            </h1>

            <p className="mt-2 text-sm text-white/60">
              Gérez vos informations
              personnelles et consultez
              l’état de votre compte.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Badge className="border-0 bg-[#D1965B] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#D1965B]">
                {roleLabel}
              </Badge>

              <Badge
                className={cn(
                  "border px-3 py-1.5 text-xs font-bold",
                  emailVerified
                    ? "border-emerald-300/20 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/15"
                    : "border-amber-300/20 bg-amber-500/15 text-amber-200 hover:bg-amber-500/15",
                )}
              >
                {emailVerified ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Compte vérifié
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" />
                    Vérification en attente
                  </span>
                )}
              </Badge>
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[340px]">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <CalendarDays className="h-5 w-5 text-[#E7B57F]" />

              <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-white/45">
                Membre depuis
              </p>

              <p className="mt-1 text-sm font-bold capitalize text-white">
                {memberSince}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <ShieldCheck className="h-5 w-5 text-[#E7B57F]" />

              <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-white/45">
                Statut
              </p>

              <p className="mt-1 text-sm font-bold text-white">
                {emailVerified
                  ? "Actif"
                  : "À vérifier"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-7 lg:grid-cols-[1.45fr_0.75fr]">
        {/* Informations personnelles */}
        <Card className="overflow-hidden rounded-[2rem] border border-[#D1965B]/15 bg-white py-0 shadow-sm">
          <CardHeader className="border-b border-[#D1965B]/10 bg-[#FBF8F3] p-6 sm:p-7">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D1965B]/10 text-[#D1965B]">
                <UserRound className="h-6 w-6" />
              </div>

              <div>
                <CardTitle className="text-xl font-black text-[#39251D]">
                  Informations personnelles
                </CardTitle>

                <p className="mt-1 text-sm text-[#5C4033]/55">
                  Les informations associées
                  à votre compte.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 sm:p-7">
            <div className="grid gap-4 sm:grid-cols-2">
              <ProfileField
                icon={UserRound}
                label="Nom complet"
                value={fullName}
              />

              <ProfileField
                icon={Mail}
                label="Adresse e-mail"
                value={
                  user.email ||
                  "Non renseignée"
                }
                verified={emailVerified}
              />

              <ProfileField
                icon={Phone}
                label="Téléphone"
                value={
                  user.phone ||
                  "Non renseigné"
                }
              />

              <ProfileField
                icon={ShieldCheck}
                label="Fonction"
                value={roleLabel}
              />
            </div>
          </CardContent>
        </Card>

        {/* État du compte */}
        <Card className="overflow-hidden rounded-[2rem] border border-[#D1965B]/15 bg-[#F3EEE5] py-0 shadow-sm">
          <CardHeader className="p-6 pb-3 sm:p-7 sm:pb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#D1965B] shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <CardTitle className="mt-5 text-xl font-black text-[#39251D]">
              État du compte
            </CardTitle>

            <p className="text-sm leading-6 text-[#5C4033]/55">
              Vérifiez le statut général
              de votre accès membre.
            </p>
          </CardHeader>

          <CardContent className="space-y-3 p-6 pt-3 sm:p-7 sm:pt-3">
            <AccountStatusRow
              label="Compte"
              value={
                emailVerified
                  ? "Actif"
                  : "En attente"
              }
              status={
                emailVerified
                  ? "success"
                  : "warning"
              }
            />

            <AccountStatusRow
              label="Adresse e-mail"
              value={
                emailVerified
                  ? "Vérifiée"
                  : "Non vérifiée"
              }
              status={
                emailVerified
                  ? "success"
                  : "warning"
              }
            />

            <AccountStatusRow
              label="Rôle"
              value={roleLabel}
              status="neutral"
            />

            <div className="mt-5 rounded-2xl border border-[#D1965B]/15 bg-white/70 p-4">
              <p className="text-xs leading-5 text-[#5C4033]/60">
                Vos informations sont
                utilisées pour le suivi de
                vos demandes et les
                communications relatives à
                vos réservations.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Localisation */}
      {hasLocation && (
        <Card className="overflow-hidden rounded-[2rem] border border-[#D1965B]/15 bg-white py-0 shadow-sm">
          <CardHeader className="border-b border-[#D1965B]/10 p-6 sm:p-7">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D1965B]/10 text-[#D1965B]">
                <Globe2 className="h-6 w-6" />
              </div>

              <div>
                <CardTitle className="text-xl font-black text-[#39251D]">
                  Localisation
                </CardTitle>

                <p className="mt-1 text-sm text-[#5C4033]/55">
                  Votre adresse et votre
                  zone géographique.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 sm:p-7">
            <div className="grid gap-4 sm:grid-cols-3">
              <ProfileField
                icon={MapPin}
                label="Adresse"
                value={
                  user.address ||
                  "Non renseignée"
                }
              />

              <ProfileField
                icon={Globe2}
                label="Ville"
                value={
                  user.city ||
                  "Non renseignée"
                }
              />

              <ProfileField
                icon={Globe2}
                label="Pays"
                value={
                  user.country ||
                  "Non renseigné"
                }
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

type ProfileIcon =
  typeof UserRound;

function ProfileField({
  icon: Icon,
  label,
  value,
  verified = false,
}: {
  icon: ProfileIcon;
  label: string;
  value: string;
  verified?: boolean;
}) {
  return (
    <div className="group rounded-2xl border border-[#D1965B]/10 bg-[#FBF8F3] p-4 transition hover:border-[#D1965B]/25 hover:bg-[#F8F1E8] sm:p-5">
      <div className="flex items-center gap-2 text-[#D1965B]">
        <Icon className="h-4 w-4" />

        <p className="text-[10px] font-black uppercase tracking-[0.14em]">
          {label}
        </p>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <p className="min-w-0 break-words text-sm font-bold text-[#39251D] sm:text-base">
          {value}
        </p>

        {verified && (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
        )}
      </div>
    </div>
  );
}

function AccountStatusRow({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status:
    | "success"
    | "warning"
    | "neutral";
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#D1965B]/10 bg-white p-4">
      <span className="text-sm font-medium text-[#5C4033]/60">
        {label}
      </span>

      <span
        className={cn(
          "inline-flex max-w-[60%] items-center gap-1.5 text-right text-xs font-black",
          status === "success" &&
            "text-emerald-600",
          status === "warning" &&
            "text-amber-600",
          status === "neutral" &&
            "text-[#5C4033]",
        )}
      >
        {status === "success" && (
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        )}

        {status === "warning" && (
          <Clock3 className="h-3.5 w-3.5 shrink-0" />
        )}

        {value}
      </span>
    </div>
  );
}