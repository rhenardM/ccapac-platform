import Link from "next/link";
import Image from "next/image";
import MainLayout from "../components/layouts/MainLayout";
import { getCategories } from "@/lib/programmes-data";
import { FaArrowRight } from "react-icons/fa";

/**
 * Rubriques qui disposent de leur propre page dédiée : leur carte ne pointe pas
 * vers /programmes/[category] mais vers ce module.
 */
const CATEGORY_HREF_OVERRIDES: Record<string, string> = {
  "cinema-audiovisuel": "/cinematheque",
};

export default async function ProgrammesPage() {
  const categories = await getCategories();

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative h-[35vh] min-h-[280px] sm:h-[40vh] sm:min-h-[350px] lg:h-[45vh] lg:min-h-[400px] mt-16 sm:mt-20 lg:mt-24 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <Image
          src="/motif-luba.png"
          alt="Programmes culturels CCAPAC"
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
        />
        <div className="relative z-20 text-center px-4 sm:px-6 w-full">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 md:mb-6 text-white tracking-tight uppercase drop-shadow-2xl">
            Action Culturelle
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 font-light leading-relaxed max-w-2xl mx-auto drop-shadow-md px-2">
            Une fenêtre ouverte sur la richesse du patrimoine africain.
            Découvrez, apprenez et vivez la culture.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                href={
                  CATEGORY_HREF_OVERRIDES[category.slug] ??
                  `/programmes/${category.id}`
                }
                className="group relative h-[300px] sm:h-[350px] md:h-[400px] lg:h-[500px] rounded-xl sm:rounded-2xl overflow-hidden block shadow-lg sm:shadow-xl transition-all duration-500 hover:shadow-2xl"
              >
                <Image
                  src={category.image || "/placeholder.svg"}
                  alt={category.title}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 50vw"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

                <div className="absolute inset-0 p-4 sm:p-6 md:p-8 flex flex-col justify-end">
                  <div className="transform transition-transform duration-500 translate-y-2 sm:translate-y-4 group-hover:translate-y-0">
                    <span className="text-white/60 text-xs sm:text-sm font-mono mb-1 sm:mb-2 block uppercase tracking-widest">
                      0{index + 1}
                    </span>
                    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3 uppercase tracking-tight leading-tight">
                      {category.title}
                    </h2>
                    <p className="text-white/80 text-sm sm:text-base md:text-lg line-clamp-2 sm:line-clamp-3 font-light leading-relaxed mb-3 sm:mb-4 md:mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                      {category.description}
                    </p>

                    <div className="inline-flex items-center text-white font-semibold text-xs sm:text-sm uppercase tracking-wider group-hover:text-accent transition-colors">
                      <span className="mr-2">Explorer</span>
                      <FaArrowRight className="w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 group-hover:translate-x-2" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Programmes externes */}
      <section className="px-4 sm:px-6 md:px-8 pb-12 sm:pb-16 md:pb-20">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/evenements-externes"
            className="group relative flex flex-col gap-6 overflow-hidden rounded-xl sm:rounded-2xl bg-primary p-6 text-white shadow-lg transition-all duration-500 hover:shadow-2xl sm:flex-row sm:items-center sm:justify-between sm:p-8 md:p-10"
          >
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/15 blur-3xl" />
            <div className="relative max-w-2xl">
              <span className="mb-3 inline-block text-xs font-bold uppercase tracking-[0.2em] text-accent">
                Nos partenaires
              </span>
              <h2 className="text-xl font-bold uppercase leading-tight tracking-tight sm:text-2xl md:text-3xl">
                Programmes externes
              </h2>
              <p className="mt-3 text-sm font-light leading-relaxed text-white/85 sm:text-base">
                Découvrez les programmes culturels portés par nos partenaires,
                accueillis ou soutenus par le Grand Tambour.
              </p>
            </div>
            <span className="relative inline-flex flex-none items-center gap-2 rounded-full bg-accent px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors group-hover:bg-white group-hover:text-primary">
              Explorer
              <FaArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-2" />
            </span>
          </Link>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-12 sm:py-14 md:py-16 px-4 sm:px-6 bg-muted/5 border-t border-muted/10">
        <div className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-6">
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-light text-muted-foreground italic px-2">
            &quot;La culture est ce qui reste quand on a tout oublié.&quot;
          </p>
          <div className="w-12 sm:w-16 h-0.5 bg-primary/40 mx-auto"></div>
          <Link
            href="/contact"
            className="inline-block pt-2 sm:pt-4 text-xs sm:text-sm font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
          >
            Rejoindre l&apos;aventure
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}
