"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import { useAuth } from "@/context/AuthContext";

export default function SupervisorLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(
        `/auth/login?redirectUrl=${encodeURIComponent(
          pathname
        )}`
      );

      return;
    }

    if (
      !loading &&
      user &&
      !["SUPERVISEUR", "ADMIN"].includes(
        user.role
      )
    ) {
      router.replace("/espace-membre");
    }
  }, [
    loading,
    user,
    pathname,
    router,
  ]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#D1965B] border-t-transparent" />

          <p className="mt-4 text-sm text-[#5C4033]/70">
            Chargement de l&apos;espace
            superviseur...
          </p>
        </div>
      </div>
    );
  }

  if (
    !user ||
    !["SUPERVISEUR", "ADMIN"].includes(
      user.role
    )
  ) {
    return null;
  }

  return <>{children}</>;
}