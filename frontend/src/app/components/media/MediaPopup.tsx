import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  Camera,
} from "lucide-react";
import { Media } from "@/types/media";
import { formatDate } from "@/lib/mediaUtils";
import { useEffect } from "react";

interface MediaPopupProps {
  isOpen: boolean;
  mediaItems: Media[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onGoToImage: (index: number) => void;
}

export default function MediaPopup({
  isOpen,
  mediaItems,
  currentIndex,
  onClose,
  onNext,
  onPrev,
}: MediaPopupProps) {
  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onNext, onPrev]);

  if (!isOpen || mediaItems.length === 0) return null;

  const currentItem = mediaItems[currentIndex];

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/95 animate-in fade-in duration-200">
      {/* Search/Controls Header */}
      <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 z-50 flex justify-between items-start">
        <div className="text-white/70 text-xs sm:text-sm font-medium">
          {currentIndex + 1} / {mediaItems.length}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 sm:p-2 text-white/70 hover:text-white transition-colors"
          aria-label="Fermer"
        >
          <X size={20} className="sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center relative w-full h-full overflow-hidden">
        {/* Navigation Buttons (Hidden on mobile interactions sometimes, but kept for clarity) */}
        <button
          onClick={onPrev}
          className="absolute left-2 sm:left-4 z-40 p-2 sm:p-3 text-white/50 hover:text-white transition-colors hidden sm:block"
          aria-label="Précédent"
        >
          <ChevronLeft size={32} className="sm:w-10 sm:h-10" strokeWidth={1} />
        </button>

        <button
          onClick={onNext}
          className="absolute right-2 sm:right-4 z-40 p-2 sm:p-3 text-white/50 hover:text-white transition-colors hidden sm:block"
          aria-label="Suivant"
        >
          <ChevronRight size={32} className="sm:w-10 sm:h-10" strokeWidth={1} />
        </button>

        {/* Image */}
        <div className="relative w-full h-full p-3 sm:p-4 md:p-8 lg:p-12 xl:p-20 flex items-center justify-center">
          <div className="relative w-full h-full max-w-7xl max-h-[75vh] sm:max-h-[80vh] md:max-h-[85vh]">
            <Image
              src={currentItem.image || "/placeholder.svg"}
              alt={currentItem.title || "Photo — Grand Tambour"}
              fill
              className="object-contain"
              priority
              quality={90}
            />
          </div>
        </div>
      </div>

      {/* Footer / Caption Overlay — masqué si aucune métadonnée éditoriale */}
      {(currentItem.title ||
        formatDate(currentItem.eventDate) ||
        currentItem.location ||
        currentItem.photographer) && (
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-8 sm:pt-10 md:pt-12 pb-4 sm:pb-6 md:pb-8 px-3 sm:px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {currentItem.title && (
            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white mb-1.5 sm:mb-2 line-clamp-2">
              {currentItem.title}
            </h2>
          )}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-white/70">
            {formatDate(currentItem.eventDate) && (
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Calendar size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                <span className="truncate">{formatDate(currentItem.eventDate)}</span>
              </div>
            )}
            {currentItem.location && (
              <div className="flex items-center gap-1 sm:gap-1.5">
                <MapPin size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                <span className="truncate">{currentItem.location}</span>
              </div>
            )}
            {currentItem.photographer && (
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Camera size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                <span className="truncate">{currentItem.photographer}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
