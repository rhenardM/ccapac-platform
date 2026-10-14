"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

const ARTISTIC_ROLES = [
  "DIRECTION_ARTISTIQUE_SUPERVISEUR",
  "DIRECTION_ARTISTIQUE_ASSISTANT",
  "ADMIN",
];

const roleDestinations: Record<
  string,
  string
> = {
  MEMBER:
    "/espace-membre/membre",

  PROGRAMME_SUPERVISEUR:
    "/espace-membre/programme",

  PROGRAMME_ASSISTANT:
    "/espace-membre/programme",

  REGISSEUR_GENERAL:
    "/espace-membre/regisseur",

  COMMUNICATION:
    "/espace-membre/communication",

  JURIDIQUE:
    "/espace-membre/juridique",

  FINANCE:
    "/espace-membre/finance",

  SUPERVISEUR:
    "/espace-membre/superviseur",

  ADMIN:
    "/espace-membre/admin",
};

export default function ArtisticDirectionLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace(
        "/auth/login?redirectUrl=/espace-membre/direction-artistique"
      );

      return;
    }

    const normalizedRole = String(
      user.role || ""
    )
      .trim()
      .toUpperCase();

    if (
      !ARTISTIC_ROLES.includes(
        normalizedRole
      )
    ) {
      router.replace(
        roleDestinations[
          normalizedRole
        ] || "/espace-membre"
      );
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center bg-[#F3EEE5]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#D1965B] border-t-transparent" />

          <p className="mt-4 text-sm text-[#5C4033]/70">
            Chargement de la Direction
            artistique...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const normalizedRole = String(
    user.role || ""
  )
    .trim()
    .toUpperCase();

  if (
    !ARTISTIC_ROLES.includes(
      normalizedRole
    )
  ) {
    return null;
  }

  return <>{children}</>;
}