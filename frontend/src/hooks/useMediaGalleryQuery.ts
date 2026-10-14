"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { MediaFilters, MediaGalleryPage } from "@/types/media";
import { getMediaCategories, getMediaPage } from "@/services/mediaService";

/**
 * Une page de la médiathèque, filtrée côté serveur.
 * `keepPreviousData` évite que la grille ne clignote en passant par un état
 * vide à chaque changement de filtre ou de page.
 */
export const useMediaGalleryQuery = (filters: MediaFilters) =>
  useQuery<MediaGalleryPage, Error>({
    queryKey: ["media", filters],
    queryFn: () => getMediaPage(filters),
    placeholderData: keepPreviousData,
  });

/**
 * Catégories et années disponibles pour les filtres.
 * Stables dans le temps : on les garde en cache plus longtemps que la galerie.
 */
export const useMediaCategoriesQuery = () =>
  useQuery({
    queryKey: ["media-categories"],
    queryFn: getMediaCategories,
    staleTime: 5 * 60 * 1000,
  });
