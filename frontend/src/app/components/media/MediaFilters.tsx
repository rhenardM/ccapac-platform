import { Search } from "lucide-react";
import { MONTHS } from "@/lib/mediaUtils";
import type { MediaCategory } from "@/types/media";
import { cn } from "@/lib/utils";

interface MediaFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  /** Catégories proposées, issues du back-office. */
  categories: MediaCategory[];
  categoriesLoading: boolean;
  /** Slugs cochés. Tableau vide = « Toutes ». */
  selectedCategories: string[];
  selectedYear: number | null;
  selectedMonth: number | null;
  /** Années réellement présentes dans la médiathèque. */
  years: number[];
  toggleCategory: (slug: string) => void;
  selectAllCategories: () => void;
  setSelectedYear: (year: number | null) => void;
  setSelectedMonth: (month: number | null) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
  resultsCount: number;
}

/** Case à cocher stylée, partagée par « Toutes » et chaque catégorie. */
function FilterCheckbox({
  label,
  count,
  checked,
  onToggle,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex items-center gap-2 sm:gap-3 cursor-pointer group py-0.5 sm:py-1">
      <div
        className={cn(
          "w-3.5 h-3.5 sm:w-4 sm:h-4 border border-muted-foreground/40 rounded flex items-center justify-center transition-all duration-200 flex-shrink-0",
          checked ? "bg-primary border-primary" : "group-hover:border-primary"
        )}
      >
        {checked && (
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary-foreground rounded-sm" />
        )}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="hidden"
      />
      <span
        className={cn(
          "text-xs sm:text-sm transition-colors flex-1 min-w-0",
          checked
            ? "text-foreground font-medium"
            : "text-muted-foreground group-hover:text-foreground"
        )}
      >
        {label}
      </span>
      {count !== undefined && (
        <span className="text-[10px] sm:text-xs text-muted-foreground/60 tabular-nums flex-shrink-0">
          {count}
        </span>
      )}
    </label>
  );
}

export default function MediaFilters({
  searchQuery,
  setSearchQuery,
  categories,
  categoriesLoading,
  selectedCategories,
  selectedYear,
  selectedMonth,
  years,
  toggleCategory,
  selectAllCategories,
  setSelectedYear,
  setSelectedMonth,
  resetFilters,
  hasActiveFilters,
  resultsCount,
}: MediaFiltersProps) {
  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <div className="lg:sticky lg:top-24 xl:top-32 space-y-6 sm:space-y-7 md:space-y-8">
        {/* Search Bar */}
        <div>
          <div className="relative group">
            <Search
              className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5"
              size={18}
            />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-b border-border py-1.5 sm:py-2 pl-5 sm:pl-6 pr-0 focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50 text-xs sm:text-sm md:text-base"
            />
          </div>
        </div>

        {/* Category Filters — alimentés par le back-office */}
        <div>
          <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 sm:mb-4">
            Catégories
          </h3>

          {categoriesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-4 bg-muted/30 animate-pulse rounded"
                />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <p className="text-xs text-muted-foreground/70 leading-relaxed">
              Aucune catégorie disponible pour le moment.
            </p>
          ) : (
            <div className="space-y-1.5 sm:space-y-2">
              <FilterCheckbox
                label="Toutes"
                checked={selectedCategories.length === 0}
                onToggle={selectAllCategories}
              />
              {categories.map((category) => (
                <FilterCheckbox
                  key={category.slug}
                  label={category.name}
                  count={category.total}
                  checked={selectedCategories.includes(category.slug)}
                  onToggle={() => toggleCategory(category.slug)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Date Filter — les années proposées sont celles qui donnent des résultats */}
        {years.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 sm:mb-2">
                Année
              </h3>
              <select
                value={selectedYear ?? ""}
                onChange={(e) =>
                  setSelectedYear(
                    e.target.value ? parseInt(e.target.value, 10) : null
                  )
                }
                className="w-full bg-transparent border-b border-border py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:border-primary transition-colors cursor-pointer"
              >
                <option value="">Toutes</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 sm:mb-2">
                Mois
              </h3>
              <select
                value={selectedMonth ?? ""}
                onChange={(e) =>
                  setSelectedMonth(
                    e.target.value ? parseInt(e.target.value, 10) : null
                  )
                }
                className="w-full bg-transparent border-b border-border py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:border-primary transition-colors cursor-pointer"
              >
                <option value="">Tous</option>
                {MONTHS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="pt-4 sm:pt-5 md:pt-6 border-t border-border flex items-center justify-between gap-3">
          <p className="text-xs sm:text-sm font-medium text-foreground">
            {resultsCount} {resultsCount === 1 ? "résultat" : "résultats"}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-[10px] sm:text-xs text-muted-foreground hover:text-primary underline underline-offset-2 transition-colors"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
