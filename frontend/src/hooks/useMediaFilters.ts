import { useCallback, useState } from "react";

interface UseMediaFiltersReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  /** Slugs des catégories cochées. Tableau vide = « Toutes ». */
  selectedCategories: string[];
  selectedYear: number | null;
  selectedMonth: number | null;
  toggleCategory: (slug: string) => void;
  selectAllCategories: () => void;
  setSelectedYear: (year: number | null) => void;
  setSelectedMonth: (month: number | null) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

/**
 * État des filtres de la médiathèque.
 *
 * Les catégories sont stockées par SLUG (et non par libellé) : c'est ce que
 * l'API attend, et cela survit à un renommage de catégorie depuis le back-office.
 * Un tableau vide signifie « toutes les catégories » — plus de sentinelle
 * "Tous" mélangée aux vraies valeurs.
 */
export const useMediaFilters = (): UseMediaFiltersReturn => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const toggleCategory = useCallback((slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
    );
  }, []);

  const selectAllCategories = useCallback(() => setSelectedCategories([]), []);

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedYear(null);
    setSelectedMonth(null);
  }, []);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCategories.length > 0 ||
    selectedYear !== null ||
    selectedMonth !== null;

  return {
    searchQuery,
    setSearchQuery,
    selectedCategories,
    selectedYear,
    selectedMonth,
    toggleCategory,
    selectAllCategories,
    setSelectedYear,
    setSelectedMonth,
    resetFilters,
    hasActiveFilters,
  };
};
