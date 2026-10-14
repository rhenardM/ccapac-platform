"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import DashboardLayoutClient from "../DashboardLayoutClient";

export default function EspaceMembreLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const usesIndependentLayout =
    pathname.startsWith(
      "/espace-membre/membre"
    ) ||
    pathname.startsWith(
      "/espace-membre/programme"
    ) ||
    pathname.startsWith(
      "/espace-membre/regisseur"
    ) ||
    pathname.startsWith(
      "/espace-membre/direction-artistique"
    ) ||
    pathname.startsWith(
      "/espace-membre/communication"
    ) ||
    pathname.startsWith(
      "/espace-membre/juridique"
    ) ||
    pathname.startsWith(
      "/espace-membre/finance"
    );

  useEffect(() => {
    if (!loading && !user) {
      router.replace(
        `/auth/login?redirectUrl=${encodeURIComponent(
          pathname
        )}`
      );
    }
  }, [loading, user, router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3EEE5]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#D1965B] border-t-transparent" />

          <p className="mt-4 text-sm text-[#5C4033]">
            Chargement de votre session...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  /*
   * Les dossiers membre, programme, finance, etc.
   * possèdent leur propre layout et leur propre sidebar.
   *
   * Il ne faut donc pas les placer dans
   * DashboardLayoutClient une deuxième fois.
   */
  if (usesIndependentLayout) {
    return <>{children}</>;
  }

  return (
    <DashboardLayoutClient user={user}>
      {children}
    </DashboardLayoutClient>
  );
}