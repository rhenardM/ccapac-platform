"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
// import { FaBuilding } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import { Event } from "@/types/events";
// import { formatEventDateShort } from "@/lib/dateUtils";

interface DynamicHeroSliderProps {
  events: Event[];
  isVisible: boolean;
}

export default function DynamicHeroSlider({
  events,
  isVisible,
}: DynamicHeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Auto-play du slider
  useEffect(() => {
    if (!isAutoPlaying || events.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % events.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, events.length]);

  // Navigation du slider
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % events.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + events.length) % events.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Gestion du swipe tactile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  if (events.length === 0) {
    return null;
  }

  return (
    <section
      className={`relative w-full h-[70vh] min-h-[500px] sm:h-[80vh] sm:min-h-[600px] lg:h-screen lg:min-h-[700px] overflow-hidden bg-muted transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides */}
      <div className="relative h-full">
        {events.map((event, index) => (
          <div
            key={event.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <div className="relative w-full h-full">
                <Image
                  src={event.image}
                  alt={event.title}
                  className="object-cover object-center sm:object-[60%_center]"
                  fill
                  priority={index === 0}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                  quality={90}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30 sm:from-black/80 sm:via-black/50 sm:to-black/20 lg:from-black/70 lg:via-black/40 lg:to-transparent" />
              </div>
            </div>

            {/* Content */}
            <div className="relative h-full flex items-center justify-start z-30 pt-20 sm:pt-24 lg:pt-24 mt-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-xl sm:max-w-2xl text-white">
                  {/* <div className="inline-block bg-secondary text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">
                    {event.category || event.discipline}
                  </div> */}

                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
                    {event.title}
                  </h1>

                  {event.slogan && (
                    <p className="text-lg sm:text-xl md:text-2xl mb-4 sm:mb-6 leading-relaxed text-accent italic">
                      {event.slogan}
                    </p>
                  )}

                  {/* <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="flex items-center gap-2 text-gray-200">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="text-sm sm:text-base">
                        {formatEventDateShort(event.startDate, event.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-200">
                      <FaBuilding className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="text-sm sm:text-base">
                        {event.location}
                      </span>
                    </div>
                  </div> */}

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    {event.featured ? (
                      <Link
                        href="/grand-tambour/presentation"
                        className="bg-accent cursor-pointer text-black px-6 py-3 sm:px-8 sm:py-3 font-bold hover:bg-accent/90 transition-colors text-sm sm:text-base text-center"
                      >
                        En savoir plus
                      </Link>
                    ) : (
                      <Link
                        href={`/evenement/${event.slug}`}
                        className="bg-accent cursor-pointer text-black px-6 py-3 sm:px-8 sm:py-3 font-bold hover:bg-accent/90 transition-colors text-sm sm:text-base text-center"
                      >
                        En savoir plus
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {events.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white p-2 sm:p-3 rounded-full transition-colors backdrop-blur-sm z-40 touch-manipulation"
            aria-label="Événement précédent"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white p-2 sm:p-3 rounded-full transition-colors backdrop-blur-sm z-40 touch-manipulation"
            aria-label="Événement suivant"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3 px-4">
            {events.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 touch-manipulation ${
                  index === currentSlide
                    ? "bg-accent scale-125"
                    : "bg-white/50 hover:bg-white/70 active:bg-white/80"
                }`}
                aria-label={`Aller à l'événement ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
