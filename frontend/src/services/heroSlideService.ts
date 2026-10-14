import { fetchJson } from "@/lib/content-api";
import { HeroSlide } from "@/types/hero-slide";

/**
 * Diapositives du Hero de la page d'accueil — servies par NOTRE backend
 * (/api/content/home-hero-slides). Ne renvoie que les diapositives publiées,
 * déjà ordonnées par le backend.
 */
export const getHeroSlides = async (): Promise<HeroSlide[]> => {
  try {
    const body = await fetchJson<{ data: HeroSlide[] }>("/home-hero-slides");
    return body?.data ?? [];
  } catch {
    // Le hero statique prend automatiquement le relais si l'API est indisponible.
    return [];
  }
};
