import { useState } from "react";
import { DEFAULT_FILTER_VALUE } from "@/data/events";
import { useFilteredEventsQuery } from "./useEventsQuery";

export interface FilterState {
  month: string;
  discipline: string;
  publicTarget: string;
}

/**
 * Hook pour filtrer les événements avec cache
 *
 * @returns {Object} État des filtres, événements filtrés, loading, erreur et fonctions de gestion
 */
export const useEventFilters = () => {
  const [filters, setFilters] = useState<FilterState>({
    month: DEFAULT_FILTER_VALUE,
    discipline: DEFAULT_FILTER_VALUE,
    publicTarget: DEFAULT_FILTER_VALUE,
  });

  // Chargement des événements filtrés
  const {
    data: filteredEvents = [],
    isLoading,
    isError,
    error,
  } = useFilteredEventsQuery(filters);

  /**
   * Met à jour un filtre spécifique
   */
  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  /**
   * Remet tous les filtres à leur valeur par défaut
   */
  const clearFilters = () => {
    setFilters({
      month: DEFAULT_FILTER_VALUE,
      discipline: DEFAULT_FILTER_VALUE,
      publicTarget: DEFAULT_FILTER_VALUE,
    });
  };

  /**
   * Vérifie si des filtres sont actifs (différents de la valeur par défaut)
   */
  const hasActiveFilters =
    filters.month !== DEFAULT_FILTER_VALUE ||
    filters.discipline !== DEFAULT_FILTER_VALUE ||
    filters.publicTarget !== DEFAULT_FILTER_VALUE;

  return {
    // État
    filters,
    filteredEvents,
    loading: isLoading,
    error: isError ? (error as Error | null)?.message ?? null : null,

    // Actions
    updateFilter,
    clearFilters,

    // Computed
    hasActiveFilters,

    eventCount: filteredEvents.length,
  };
};
