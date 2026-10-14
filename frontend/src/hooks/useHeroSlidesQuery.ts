"use client";

import { useQuery } from "@tanstack/react-query";
import type { HeroSlide } from "@/types/hero-slide";
import { getHeroSlides } from "@/services/heroSlideService";

export const useHeroSlidesQuery = () =>
  useQuery<HeroSlide[], Error>({
    queryKey: ["hero-slides"],
    queryFn: () => getHeroSlides(),
    staleTime: 60 * 60 * 1000,
    retry: false,
  });
