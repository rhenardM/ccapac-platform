import { useEffect, useState } from "react";
import { Media, MediaFilters } from "@/types/media";
import { useMediaGalleryQuery } from "./useMediaGalleryQuery";

interface UseMediaGalleryReturn {
  /** Les images de la page courante (déjà filtrées par le serveur). */
  items: Media[];
  loading: boolean;
  /** Vrai pendant le rechargement d'une page déjà affichée (filtre/page). */
  refreshing: boolean;
  error: string | null;
  /** Nombre total de résultats, toutes pages confondues. */
  totalResults: number;
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

interface UseMediaGalleryProps {
  searchQuery: string;
  selectedCategories: string[];
  selectedYear: number | null;
  selectedMonth: number | null;
  itemsPerPage?: number;
}

/** Débounce simple pour ne pas requêter à chaque frappe dans la recherche. */
const useDebounced = <T,>(value: T, delay = 300): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

/**
 * Galerie de la médiathèque : filtrage ET pagination sont délégués au backend.
 * On ne charge donc que la page affichée, et le compteur de résultats reflète
 * l'ensemble des correspondances, pas seulement ce qui a été téléchargé.
 */
export const useMediaGallery = ({
  searchQuery,
  selectedCategories,
  selectedYear,
  selectedMonth,
  itemsPerPage = 12,
}: UseMediaGalleryProps): UseMediaGalleryReturn => {
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearch = useDebounced(searchQuery);

  // Revenir en page 1 dès qu'un critère change : rester en page 7 d'un jeu de
  // résultats qui n'en compte plus que 2 afficherait une grille vide.
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategories, selectedYear, selectedMonth]);

  const filters: MediaFilters = {
    search: debouncedSearch || undefined,
    categories: selectedCategories,
    year: selectedYear,
    month: selectedMonth,
    page: currentPage,
    perPage: itemsPerPage,
  };

  const { data, isLoading, isFetching, isError, error } =
    useMediaGalleryQuery(filters);

  return {
    items: data?.items ?? [],
    loading: isLoading,
    refreshing: isFetching && !isLoading,
    error: isError ? error?.message ?? "Erreur inconnue" : null,
    totalResults: data?.total ?? 0,
    totalPages: data?.pages ?? 0,
    currentPage,
    setCurrentPage,
  };
};
