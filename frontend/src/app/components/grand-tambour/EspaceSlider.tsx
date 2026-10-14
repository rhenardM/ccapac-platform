"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaChevronLeft, FaChevronRight, FaArrowRight } from "react-icons/fa6";
import type { Space } from "@/types/space";
import { getSpaceIcon } from "@/lib/iconUtils";
import { formatCapacity } from "@/lib/spaceUtils";

const AUTOPLAY_DELAY_MS = 6000;

interface EspaceSliderProps {
  espaces: Space[];
}

export default function EspaceSlider({ espaces }: EspaceSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % espaces.length);
  }, [espaces.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + espaces.length) % espaces.length);
  }, [espaces.length]);

  // Défilement automatique, en pause au survol/interaction tactile.
  useEffect(() => {
    if (espaces.length <= 1 || isPaused) return;

    timerRef.current = setInterval(nextSlide, AUTOPLAY_DELAY_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [espaces.length, isPaused, nextSlide]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    if (distance > 50) nextSlide();
    else if (distance < -50) prevSlide();
  };

  // Navigation au clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevSlide();
      else if (e.key === "ArrowRight") nextSlide();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevSlide, nextSlide]);

  if (espaces.length === 0) return null;

  const currentEspace = espaces[currentIndex];
  const IconComponent = getSpaceIcon(currentEspace.categoryIcon);

  return (
    <div className="relative max-w-6xl mx-auto">
      {/* Image Slider */}
      <div
        className="relative overflow-hidden rounded-2xl shadow-2xl mb-8 sm:mb-12 group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="aspect-[16/9] sm:aspect-[10/5] relative">
          <Image
            src={currentEspace.coverImage || "/images/grand-tambour.jpg"}
            width={1000}
            height={1000}
            alt={currentEspace.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
            priority={currentIndex === 0}
          />

          {/* Overlay avec informations */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-3 sm:p-4 rounded-2xl w-fit shadow-lg">
                    <IconComponent className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <div>
                    {currentEspace.category && (
                      <span className="text-white/70 text-xs sm:text-sm font-bold uppercase tracking-widest">
                        {currentEspace.category}
                      </span>
                    )}
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 drop-shadow-lg">
                      {currentEspace.name}
                    </h2>
                    {currentEspace.capacity && (
                      <p className="text-white/90 text-base sm:text-lg lg:text-xl font-medium">
                        {formatCapacity(currentEspace.capacity)}
                      </p>
                    )}
                  </div>
                </div>

                <Link
                  href={`/grand-tambour/espaces/${currentEspace.slug}`}
                  className="group/btn inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-bold uppercase tracking-wide text-foreground shadow-lg transition hover:bg-primary hover:text-primary-foreground"
                >
                  Découvrir
                  <FaArrowRight className="transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md text-white p-3 sm:p-4 rounded-full hover:bg-white/30 transition-all duration-300 touch-manipulation shadow-lg group-hover:opacity-100 opacity-0 sm:opacity-100"
          aria-label="Espace précédent"
        >
          <FaChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md text-white p-3 sm:p-4 rounded-full hover:bg-white/30 transition-all duration-300 touch-manipulation shadow-lg group-hover:opacity-100 opacity-0 sm:opacity-100"
          aria-label="Espace suivant"
        >
          <FaChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Dots Navigation */}
      {espaces.length > 1 && (
        <div className="flex justify-center gap-3 sm:gap-4 mb-8 sm:mb-12">
          {espaces.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-300 touch-manipulation ${
                index === currentIndex
                  ? "bg-primary scale-125 shadow-lg"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50 hover:scale-110"
              }`}
              aria-label={`Aller à l'espace ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
