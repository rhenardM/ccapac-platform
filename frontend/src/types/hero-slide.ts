/**
 * Diapositive du Hero de la page d'accueil — servie par NOTRE backend
 * (/api/content/home-hero-slides), voir `services/heroSlideService.ts`.
 */
export interface HeroSlide {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  buttonText: string;
  buttonLink: string;
  image: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}
