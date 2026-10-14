"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

const PROGRAMME_ROLES = [
  "PROGRAMME",
  "PROGRAMME_SUPERVISEUR",
  "PROGRAMME_ASSISTANT",
  "ADMIN",
];

const destinations: Record<string, string> = {
  MEMBER: "/espace-membre/membre",

  PROGRAMME:
    "/espace-membre/programme",

  PROGRAMME_SUPERVISEUR:
    "/espace-membre/programme",

  PROGRAMME_ASSISTANT:
    "/espace-membre/programme",

  REGISSEUR_GENERAL:
    "/espace-membre/regisseur",

  DIRECTION_ARTISTIQUE:
    "/espace-membre/direction-artistique",

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

export default function ProgrammeLayout({
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
        "/auth/login?redirectUrl=/espace-membre/programme"
      );

      return;
    }

    if (
      !PROGRAMME_ROLES.includes(
        user.role
      )
    ) {
      router.replace(
        destinations[user.role] ||
          "/espace-membre"
      );
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-[#F3EEE5]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#D1965B] border-t-transparent" />

          <p className="mt-4 text-sm text-[#5C4033]/70">
            Chargement de l&apos;espace Programme...
          </p>
        </div>
      </div>
    );
  }

  if (
    !user ||
    !PROGRAMME_ROLES.includes(
      user.role
    )
  ) {
    return null;
  }

  return <>{children}</>;
}