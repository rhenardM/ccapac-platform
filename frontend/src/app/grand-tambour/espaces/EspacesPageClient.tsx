import { FaArrowLeft } from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";
import type { Space } from "@/types/space";
import type { SpacesHeroSettings } from "@/types/space";
import EspaceSlider from "@/app/components/grand-tambour/EspaceSlider";
import EspaceCard from "@/app/components/grand-tambour/EspaceCard";

interface EspacesPageClientProps {
  espaces: Space[];
  hero: SpacesHeroSettings;
}

export default function EspacesPageClient({ espaces, hero }: EspacesPageClientProps) {
  return (
    <>
      <section className="relative border-b border-muted/20 mt-20 overflow-hidden sm:mt-24 py-12 sm:py-16">
        {hero.heroBackgroundImage ? (
          <div className="absolute inset-0 z-0">
            <Image
              src={hero.heroBackgroundImage}
              alt=""
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-black/55" />
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-muted/5 via-background to-muted/10" />
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-12">
          <Link
            href="/grand-tambour/presentation"
            className={`inline-flex items-center gap-2 mb-8 sm:mb-14 transition-all duration-300 text-sm sm:text-base px-4 py-2 rounded-full backdrop-blur-sm ${
              hero.heroBackgroundImage
                ? "bg-white/15 text-white hover:bg-white/25"
                : "bg-white/50 text-muted-foreground hover:bg-white/80 hover:text-primary"
            }`}
          >
            <FaArrowLeft className="w-4 h-4" />
            Retour à la présentation
          </Link>

          <div className="max-w-4xl">
            {hero.heroKicker && (
              <span
                className={`mb-3 block text-xs sm:text-sm font-bold uppercase tracking-[0.3em] ${
                  hero.heroBackgroundImage ? "text-accent" : "text-primary"
                }`}
              >
                {hero.heroKicker}
              </span>
            )}
            <h1
              className={`uppercase text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight drop-shadow-sm ${
                hero.heroBackgroundImage ? "text-white" : "text-foreground"
              }`}
            >
              {hero.heroTitle}
            </h1>
            {hero.introText && (
              <p
                className={`text-lg sm:text-xl lg:text-2xl leading-relaxed ${
                  hero.heroBackgroundImage ? "text-white/90" : "text-muted-foreground"
                }`}
              >
                {hero.introText}
              </p>
            )}
          </div>
        </div>
      </section>

      {espaces.length > 0 && (
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <EspaceSlider espaces={espaces} />
          </div>
        </section>
      )}

      {/* Section Découvrez nos espaces */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-muted/5 via-background to-muted/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="uppercase text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 sm:mb-6">
                Découvrez nos espaces
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
                Chaque espace du Grand Tambour a été conçu pour répondre aux
                besoins spécifiques de la création artistique et culturelle
              </p>
            </div>

            {espaces.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {espaces.map((espace) => (
                  <EspaceCard key={espace.slug} espace={espace} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                Aucun espace n&apos;est publié pour le moment.
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
