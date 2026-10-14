import Image from "next/image";
import Link from "next/link";
import { FaChevronRight } from "react-icons/fa6";

interface ExternalEventsHeroProps {
  /** Visuel d'ambiance (l'affiche de l'événement à la une par défaut). */
  backgroundImage?: string;
}

/**
 * Bandeau d'ouverture de la page : fil d'Ariane, titre et accroche sur un fond
 * sombre traversé par un visuel de scène en filigrane.
 */
export default function ExternalEventsHero({
  backgroundImage,
}: ExternalEventsHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#12100e] text-white">
      <div className="absolute inset-0 z-0">
        <Image
          src={backgroundImage || "/motif-luba.png"}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-45 saturate-150"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#12100e] via-[#12100e]/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#12100e] via-transparent to-[#12100e]/60" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <nav
          aria-label="Fil d'Ariane"
          className="mb-6 flex items-center gap-2 text-xs font-light text-white/75 sm:text-sm"
        >
          <Link href="/" className="transition-colors hover:text-white">
            Accueil
          </Link>
          <FaChevronRight className="h-2.5 w-2.5 text-white/40" />
          <span className="text-white/55">Événements externes</span>
        </nav>

        <h1 className="mb-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          Événements externes
        </h1>

        <p className="max-w-2xl text-sm font-light leading-relaxed text-white/75 sm:text-base lg:text-lg">
          Découvrez les événements culturels, artistiques et scientifiques
          organisés par nos partenaires au Centre Culturel.
        </p>
      </div>
    </section>
  );
}
