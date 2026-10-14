import { fetchEspacesJson } from "@/lib/content-api";
import type { Space, SpacesHeroSettings } from "@/types/space";
import api from "@/lib/api";
import type {
  ApiResponse
} from "@/types/space-request";

/** Tous les espaces actifs (triés côté backend : ordre manuel puis nom). */
export async function getSpaces(): Promise<Space[]> {
  try {
    const body = await fetchEspacesJson<{ data: Space[] }>("/spaces");
    return body?.data ?? [];
  } catch {
    return [];
  }
}

/** Détail d'un espace (description complète, fiche technique, galerie). */
export async function getSpaceBySlug(slug: string): Promise<Space | undefined> {
  try {
    const body = await fetchEspacesJson<{ data: Space }>(
      `/spaces/${encodeURIComponent(slug)}`
    );
    return body?.data ?? undefined;
  } catch {
    return undefined;
  }
}

/** Types d'espaces, pour d'éventuels filtres. */
export async function getSpaceCategories(): Promise<
  Array<{ slug: string; name: string; icon: string }>
> {
  try {
    const body = await fetchEspacesJson<{
      data: Array<{ slug: string; name: string; icon: string }>;
    }>("/categories");
    return body?.data ?? [];
  } catch {
    return [];
  }
}

/** Contenu administrable du hero de la page Espaces. */
export async function getSpacesHeroSettings(): Promise<SpacesHeroSettings> {
  try {
    const body = await fetchEspacesJson<{ data: SpacesHeroSettings }>("/settings");
    return (
      body?.data ?? {
        heroKicker: null,
        heroTitle: "Les Espaces du Grand Tambour",
        introText: null,
        heroBackgroundImage: null,
      }
    );
  } catch {
    return {
      heroKicker: null,
      heroTitle: "Les Espaces du Grand Tambour",
      introText: null,
      heroBackgroundImage: null,
    };
  }
}

export const spaceService = {
  async getAll(): Promise<Space[]> {
    const response = await api.get<
      ApiResponse<Space[]>
    >("/spaces");

    return response.data.data;
  },
};
