"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Composant pour gérer les messages de statut après l'inscription à un événement
 * Affiche des toasts basés sur les query params de l'URL
 */
export default function EventRegistrationStatus() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const registered = searchParams.get("registered");
    const error = searchParams.get("error");

    if (registered === "true") {
      toast.success(
        "Inscription réussie ! Vous êtes maintenant inscrit à cet événement."
      );
      // Nettoyer l'URL en supprimant le paramètre
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete("registered");
      const newUrl = newSearchParams.toString()
        ? `${window.location.pathname}?${newSearchParams.toString()}`
        : window.location.pathname;
      router.replace(newUrl);
    } else if (error) {
      const errorMessage = decodeURIComponent(error);
      toast.error(
        errorMessage || "Une erreur est survenue lors de l'inscription."
      );
      // Nettoyer l'URL en supprimant le paramètre
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete("error");
      const newUrl = newSearchParams.toString()
        ? `${window.location.pathname}?${newSearchParams.toString()}`
        : window.location.pathname;
      router.replace(newUrl);
    }
  }, [searchParams, router]);

  return null;
}
