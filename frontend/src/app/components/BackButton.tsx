"use client";

import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const INTERNAL_NAV_KEY = "ccapac:internal-nav";

/**
 * Note qu'une navigation interne a eu lieu dans cet onglet. Nécessaire car
 * `document.referrer` ne change pas lors des navigations côté client.
 * À monter une seule fois, dans le layout racine.
 */
export function NavigationTracker() {
  const pathname = usePathname();
  const initialPathname = useRef(pathname);

  useEffect(() => {
    if (pathname === initialPathname.current) return;
    try {
      sessionStorage.setItem(INTERNAL_NAV_KEY, "1");
    } catch {
      // Stockage indisponible (navigation privée) : on retombe sur le referrer.
    }
  }, [pathname]);

  return null;
}

function hasPreviousPageOnSite(): boolean {
  // Onglet ouvert directement sur cette page : rien à quoi revenir.
  if (window.history.length <= 1) return false;

  if (document.referrer.startsWith(window.location.origin)) return true;

  try {
    return sessionStorage.getItem(INTERNAL_NAV_KEY) === "1";
  } catch {
    return false;
  }
}

interface BackButtonProps {
  /** Page de repli si l'utilisateur arrive directement (lien partagé, nouvel onglet). */
  fallbackHref: string;
  className?: string;
  children: ReactNode;
}

/**
 * Revient à la page précédente du site. Si la page a été ouverte depuis
 * l'extérieur, navigue vers `fallbackHref` (le lien reste un vrai lien,
 * utilisable sans JavaScript).
 */
export default function BackButton({
  fallbackHref,
  className,
  children,
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Laisser le comportement natif pour ctrl/cmd+clic (nouvel onglet).
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
      return;
    }

    if (hasPreviousPageOnSite()) {
      event.preventDefault();
      router.back();
    }
  };

  return (
    <Link href={fallbackHref} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
