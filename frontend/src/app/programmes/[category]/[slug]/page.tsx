import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import MainLayout from "@/app/components/layouts/MainLayout";
import { getProgrammeBySlug, getProgrammes } from "@/lib/programmes-data";
import { FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import { MdBookmark, MdGroup, MdTrendingUp } from "react-icons/md";
import BackButton from "@/app/components/BackButton";

// Contenu toujours frais (fetch `no-store`) : rendu à chaque requête. Une page
// pré-générée au build passerait en erreur 500 (« static to dynamic ») dès
// qu'un contenu est ajouté après le build ou que l'API est injoignable au build.
export const dynamic = "force-dynamic";

export default async function ProgrammePage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;

  const programme = await getProgrammeBySlug(slug);

  if (!programme || programme.categorySlug !== category) {
    notFound();
  }

  const relatedProgrammes = (await getProgrammes())
    .filter((p) => p.categorySlug === category && p.slug !== slug)
    .slice(0, 3);

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative h-[35vh] min-h-[280px] sm:h-[40vh] sm:min-h-[350px] md:h-[45vh] md:min-h-[400px] lg:h-[50vh] lg:min-h-[450px] flex items-end mt-16 sm:mt-20 md:mt-24">
        <div className="absolute inset-0 z-0">
          <Image
            src={programme.image || "/placeholder.svg"}
            alt={programme.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-6 sm:pb-8 md:pb-12">
          <BackButton
            fallbackHref={`/programmes/${category}`}
            className="inline-flex items-center text-white/80 hover:text-white mb-3 sm:mb-4 md:mb-6 transition-colors text-xs sm:text-sm uppercase tracking-widest font-medium"
          >
            <FaArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-2" />
            Retour
          </BackButton>

          <div className="max-w-4xl">
            <span className="inline-block py-1 px-2 sm:px-3 mb-2 sm:mb-3 md:mb-4 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider">
              {programme.category}
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-2 sm:mb-3 md:mb-4 text-balance drop-shadow-xl leading-tight">
              {programme.title}
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 font-light max-w-2xl text-pretty drop-shadow-md line-clamp-2 sm:line-clamp-3">
              {programme.slogan}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <section className="py-10 sm:py-12 md:py-16 px-4 sm:px-6 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 md:gap-12">
          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-8 sm:space-y-10 md:space-y-12">
            {/* Description */}
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6 uppercase tracking-tight flex items-center gap-2 sm:gap-3">
                <span className="w-6 sm:w-8 h-0.5 sm:h-1 bg-primary rounded-full block"></span>
                À propos du programme
              </h2>
              <div
                className="text-muted-foreground leading-relaxed text-pretty text-base sm:text-lg"
                dangerouslySetInnerHTML={{ __html: programme.description }}
              />
            </div>

            {/* Impact & Objectives */}
            <div className="space-y-6 sm:space-y-8 mt-8 sm:mt-10 md:mt-12">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6 uppercase tracking-tight flex items-center gap-2 sm:gap-3">
                <span className="w-6 sm:w-8 h-0.5 sm:h-1 bg-primary rounded-full block"></span>
                Impact & Objectifs
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Objectif */}
                <div className="bg-muted/30 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-border/50">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 text-primary">
                    <MdBookmark className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                    <h3 className="font-bold text-base sm:text-lg text-foreground">
                      Objectif
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                    {programme.objectif}
                  </p>
                </div>

                {/* Impact */}
                <div className="bg-muted/30 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-border/50">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 text-primary">
                    <MdTrendingUp className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                    <h3 className="font-bold text-base sm:text-lg text-foreground">
                      Impact
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                    {programme.impact}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Key Info Card */}
              <div className="bg-muted/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-border/60 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold text-foreground uppercase tracking-wider mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-border/50">
                  Détails Clés
                </h3>

                <div className="space-y-4 sm:space-y-6">
                  {/* Public Visé */}
                  <div>
                    <div className="flex items-center gap-2 text-primary font-semibold mb-1.5 sm:mb-2 text-sm sm:text-base">
                      <MdGroup className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span>Public Visé</span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {programme.publicVise}
                    </p>
                  </div>

                  {/* Status Indicator */}
                  <div>
                    <div className="flex items-center gap-2 text-primary font-semibold mb-1.5 sm:mb-2 text-sm sm:text-base">
                      <FaCheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>Statut</span>
                    </div>
                    <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Actif
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border/50 space-y-2 sm:space-y-3">
                  <Link
                    href="/contact"
                    className="block w-full text-center bg-primary text-primary-foreground font-bold py-2.5 sm:py-3 px-4 rounded-lg sm:rounded-xl hover:bg-primary/90 transition-all shadow-md active:scale-95 text-sm sm:text-base"
                  >
                    Nous contacter
                  </Link>
                  <p className="text-[10px] sm:text-xs text-center text-muted-foreground px-2 sm:px-4">
                    Pour partenariats ou participation
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Programmes */}
      {relatedProgrammes.length > 0 && (
        <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 bg-muted/5 border-t border-border/40">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 sm:mb-8 text-center uppercase tracking-tight">
              Dans la même catégorie
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              {relatedProgrammes.map((related) => (
                <Link
                  key={related.id}
                  href={`/programmes/${category}/${related.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-[3/2] rounded-lg sm:rounded-xl overflow-hidden mb-3 sm:mb-4">
                    <Image
                      src={related.image || "/placeholder.svg"}
                      alt={related.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <h3 className="font-bold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors mb-1 line-clamp-2">
                    {related.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    {related.slogan}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </MainLayout>
  );
}
