"use client";

import { useState, useEffect } from "react";
import { useHeroSlidesQuery } from "@/hooks/useHeroSlidesQuery";
import { HeroSlide } from "@/types/hero-slide";
import StaticHero from "./StaticHero";
import HeroSlider from "./HeroSlider";

export default function HeroSection() {
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const { data, isLoading, isError } = useHeroSlidesQuery();
  const [showSlider, setShowSlider] = useState(false);

  // Chargement des slides du hero
  useEffect(() => {
    if (data && !isError) {
      setHeroSlides(data);
      // Délai pour une transition fluide
      const timeout = setTimeout(() => {
        setShowSlider(true);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [data, isError]);

  // Gestion des cas d'erreur ou absence de contenu
  if (heroSlides.length === 0 && !isLoading) {
    return <StaticHero isLoading={isLoading} />;
  }

  return (
    <div className="relative w-full h-[70vh] min-h-[500px] sm:h-[80vh] sm:min-h-[600px] lg:h-screen lg:min-h-[700px] overflow-hidden bg-black">
      {/* Le Hero statique s'estompe et devient inactif une fois le slider chargé */}
      <div
        className={`w-full h-full transition-opacity duration-1000 ${
          showSlider ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <StaticHero isLoading={isLoading} ariaHidden={showSlider} />
      </div>

      {heroSlides.length > 0 && (
        <div
          className={`absolute inset-0 transition-opacity duration-1000 z-10 ${
            showSlider ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <HeroSlider slides={heroSlides} isVisible={showSlider} />
        </div>
      )}
    </div>
  );
}
