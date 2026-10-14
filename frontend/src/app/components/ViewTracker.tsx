"use client";

import { useEffect } from "react";

interface ViewTrackerProps {
  /** Clé sessionStorage pour ne compter qu'une fois par visite de page. */
  sessionKey: string;
  /** URL absolue de l'endpoint POST de comptage. */
  url: string;
}

/**
 * Signale une consultation (article, film, projection...) au backend, une
 * fois par visite. Appel direct depuis le navigateur — pas via le serveur
 * Next.js — pour que le backend voie la vraie IP du visiteur et puisse
 * dédupliquer correctement (fenêtre de 30 min côté API).
 * Ne bloque jamais l'affichage : erreurs ignorées, aucun rendu.
 */
export default function ViewTracker({ sessionKey, url }: ViewTrackerProps) {
  useEffect(() => {
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, "1");

    fetch(url, { method: "POST", keepalive: true }).catch(() => {
      // Silencieux : le comptage des vues ne doit jamais impacter l'expérience utilisateur.
    });
  }, [sessionKey, url]);

  return null;
}
