"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import { useAuth } from "@/context/AuthContext";

const LEGAL_ROLES = [
  "JURIDIQUE",
  "JURIDIQUE_SUPERVISEUR",
  "JURIDIQUE_ASSISTANT",
  "ADMIN",
];

const destinations: Record<
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

  DIRECTION_ARTISTIQUE_SUPERVISEUR:
    "/espace-membre/direction-artistique",

  DIRECTION_ARTISTIQUE_ASSISTANT:
    "/espace-membre/direction-artistique",

  COMMUNICATION:
    "/espace-membre/communication",

  JURIDIQUE:
    "/espace-membre/juridique",

  JURIDIQUE_SUPERVISEUR:
    "/espace-membre/juridique",

  JURIDIQUE_ASSISTANT:
    "/espace-membre/juridique",

  FINANCE:
    "/espace-membre/finance",

  SUPERVISEUR:
    "/espace-membre/superviseur",

  ADMIN:
    "/espace-membre/admin",
};

export default function LegalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const normalizedRole = String(
    user?.role || ""
  )
    .trim()
    .toUpperCase();

  const isAllowed =
    LEGAL_ROLES.includes(
      normalizedRole
    );

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace(
        `/auth/login?redirectUrl=${encodeURIComponent(
          pathname
        )}`
      );

      return;
    }

    if (!isAllowed) {
      router.replace(
        destinations[normalizedRole] ||
          "/espace-membre"
      );
    }
  }, [
    loading,
    user,
    isAllowed,
    normalizedRole,
    pathname,
    router,
  ]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-[#F3EEE5]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#D1965B] border-t-transparent" />

          <p className="mt-4 text-sm text-[#5C4033]">
            Chargement de l&apos;espace
            Juridique...
          </p>
        </div>
      </div>
    );
  }

  if (!user || !isAllowed) {
    return null;
  }

  return <>{children}</>;
}