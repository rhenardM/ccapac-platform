"use client";

import MediaFilters from "../components/media/MediaFilters";
import MediaGrid from "../components/media/MediaGrid";
import Pagination from "../components/Pagination";
import MediaPopup from "../components/media/MediaPopup";
import { useMediaFilters } from "@/hooks/useMediaFilters";
import { useMediaGallery } from "@/hooks/useMediaGallery";
import { useMediaCategoriesQuery } from "@/hooks/useMediaGalleryQuery";
import { useMediaPopup } from "@/hooks/useMediaPopup";
import { ITEMS_PER_PAGE } from "@/lib/mediaUtils";
import Image from "next/image";

export default function MediaPageClient() {
  // Hooks pour la gestion des filtres
  const {
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
  } = useMediaFilters();

  // Catégories et années disponibles, définies depuis le back-office
  const { data: filterOptions, isLoading: categoriesLoading } =
    useMediaCategoriesQuery();

  // Hook pour la gestion des médias (filtrage + pagination côté serveur)
  const {
    items,
    loading,
    refreshing,
    error,
    totalResults,
    totalPages,
    currentPage,
    setCurrentPage,
  } = useMediaGallery({
    searchQuery,
    selectedCategories,
    selectedYear,
    selectedMonth,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  // Hook pour la gestion de la popup
  const {
    isPopupOpen,
    currentImageIndex,
    openPopup,
    closePopup,
    nextImage,
    prevImage,
    goToImage,
  } = useMediaPopup();

  // La visionneuse parcourt les images de la page affichée : c'est exactement
  // ce que le visiteur voit, et cela évite de charger la galerie entière.
  const handleItemClick = (index: number) => {
    openPopup(index, items, items);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="pb-12 sm:pb-16 md:pb-20">
        {/* Hero Section */}
        <section className="relative h-[35vh] min-h-[280px] sm:h-[40vh] sm:min-h-[350px] lg:h-[45vh] lg:min-h-[400px] mt-16 sm:mt-20 lg:mt-24 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-black/60 z-10" />
          <Image
            src="/motif-luba.png"
            alt="Médiathèque CCAPAC"
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
          />
          <div className="relative z-20 text-center px-4 sm:px-6 w-full">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 md:mb-6 text-white tracking-tight uppercase drop-shadow-2xl">
              Médiathèque
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 font-light leading-relaxed max-w-2xl mx-auto drop-shadow-md px-2">
              Explorez les moments forts de nos événements culturels. Une
              fenêtre ouverte sur la créativité et l&apos;expression artistique.
            </p>
          </div>
        </section>

        {/* Filter and Gallery Section */}
        <section className="py-8 sm:py-10 md:py-12 lg:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-12 xl:gap-16">
              <MediaFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                categories={filterOptions?.categories ?? []}
                categoriesLoading={categoriesLoading}
                selectedCategories={selectedCategories}
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
                years={filterOptions?.years ?? []}
                toggleCategory={toggleCategory}
                selectAllCategories={selectAllCategories}
                setSelectedYear={setSelectedYear}
                setSelectedMonth={setSelectedMonth}
                resetFilters={resetFilters}
                hasActiveFilters={hasActiveFilters}
                resultsCount={totalResults}
              />

              {/* Gallery Grid */}
              <div className="flex-1 w-full min-w-0">
                {error ? (
                  <div className="py-12 sm:py-16 md:py-20 text-center border border-dashed border-destructive/40 rounded-lg sm:rounded-xl">
                    <p className="text-sm sm:text-base text-muted-foreground">
                      La médiathèque est momentanément indisponible.
                    </p>
                  </div>
                ) : (
                  <div
                    className={
                      refreshing ? "opacity-60 transition-opacity" : undefined
                    }
                  >
                    <MediaGrid
                      items={items}
                      loading={loading}
                      onItemClick={handleItemClick}
                    />
                  </div>
                )}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Popup / Lightbox */}
      <MediaPopup
        isOpen={isPopupOpen}
        mediaItems={items}
        currentIndex={currentImageIndex}
        onClose={closePopup}
        onNext={() => nextImage(items.length)}
        onPrev={() => prevImage(items.length)}
        onGoToImage={goToImage}
      />
    </div>
  );
}
