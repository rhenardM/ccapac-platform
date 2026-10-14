import { useState } from "react";
import { Media } from "@/types/media";

interface UseMediaPopupReturn {
  isPopupOpen: boolean;
  currentImageIndex: number;
  openPopup: (
    index: number,
    paginatedItems: Media[],
    allItems: Media[]
  ) => void;
  closePopup: () => void;
  nextImage: (totalItems: number) => void;
  prevImage: (totalItems: number) => void;
  goToImage: (index: number) => void;
}

export const useMediaPopup = (): UseMediaPopupReturn => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openPopup = (
    index: number,
    paginatedItems: Media[],
    allItems: Media[]
  ) => {
    const actualIndex = allItems.findIndex(
      (item) => item.id === paginatedItems[index].id
    );
    setCurrentImageIndex(actualIndex);
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
  };

  const nextImage = (totalItems: number) => {
    setCurrentImageIndex((prev) => (prev + 1) % totalItems);
  };

  const prevImage = (totalItems: number) => {
    setCurrentImageIndex((prev) => (prev - 1 + totalItems) % totalItems);
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  return {
    isPopupOpen,
    currentImageIndex,
    openPopup,
    closePopup,
    nextImage,
    prevImage,
    goToImage,
  };
};







