"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  getCategories,
  getProgrammesByCategory,
  type Programme,
  type ProgrammeCategory,
} from "@/lib/programmes-data";
import { Search } from "lucide-react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { Input } from "../../../components/ui/input";

export default function CategoryPageClient() {
  const params = useParams();
  const categorySlug = params.category as string;

  const [category, setCategory] = useState<ProgrammeCategory | null>(null);
  const [allProgrammes, setAllProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([getCategories(), getProgrammesByCategory(categorySlug)])
      .then(([cats, progs]) => {
        if (!active) return;
        setCategory(cats.find((c) => c.id === categorySlug) ?? null);
        setAllProgrammes(progs);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [categorySlug]);

  const filteredProgrammes = allProgrammes.filter((programme) =>
    programme.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Catégorie introuvable</h1>
          <Link href="/programmes" className="text-primary hover:underline">
            Retour aux programmes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[30vh] min-h-[250px] sm:h-[35vh] sm:min-h-[300px] md:h-[40vh] md:min-h-[350px] flex items-center justify-center overflow-hidden mt-16 sm:mt-20 md:mt-24">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <Image
          src={category.image || "/placeholder.svg"}
          alt={category.title}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
        />
        <div className="relative z-20 text-center px-4 sm:px-6 max-w-4xl mx-auto w-full">
          <Link
            href="/programmes"
            className="inline-flex items-center text-white/70 hover:text-white transition-colors mb-3 sm:mb-4 md:mb-6 text-xs sm:text-sm uppercase tracking-widest font-medium"
          >
            <FaArrowLeft className="mr-2 w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Retour
          </Link>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3 md:mb-4 uppercase tracking-tight drop-shadow-xl leading-tight">
            {category.title}
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-white/90 font-light max-w-2xl mx-auto drop-shadow-md line-clamp-2 sm:line-clamp-3 px-2">
            {category.description}
          </p>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border/50 py-3 sm:py-4 px-4 sm:px-6 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm text-muted-foreground font-mono uppercase tracking-wider w-full sm:w-auto text-center sm:text-left">
            {filteredProgrammes.length} Programme
            {filteredProgrammes.length > 1 ? "s" : ""}
          </p>

          <div className="relative w-full sm:w-72 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 sm:pl-10 h-9 sm:h-10 bg-muted/20 border-transparent focus:border-primary focus:bg-background rounded-full transition-all duration-300 w-full font-light text-sm sm:text-base"
            />
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-12 sm:py-14 md:py-16 px-4 sm:px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          {filteredProgrammes.length === 0 ? (
            <div className="text-center py-12 sm:py-16 md:py-20 text-muted-foreground italic text-sm sm:text-base">
              Aucun programme ne correspond à votre recherche.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-x-8 md:gap-y-12 lg:gap-y-16">
              {filteredProgrammes.map((programme) => (
                <Link
                  key={programme.id}
                  href={`/programmes/${categorySlug}/${programme.slug}`}
                  className="group block"
                >
                  {/* Image Container */}
                  <div className="relative aspect-[3/2] overflow-hidden rounded-lg sm:rounded-xl bg-muted shadow-sm mb-3 sm:mb-4 md:mb-5">
                    <Image
                      src={programme.image || "/placeholder.svg"}
                      alt={programme.title}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />

                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Featured Badge */}
                    {programme.featured && (
                      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-white/90 backdrop-blur text-black text-[9px] sm:text-[10px] font-bold uppercase px-1.5 sm:px-2 py-0.5 sm:py-1 tracking-widest rounded-sm">
                        À la une
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="space-y-2 sm:space-y-3">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 leading-tight line-clamp-2">
                      {programme.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground font-light line-clamp-2 leading-relaxed">
                      {programme.slogan}
                    </p>
                    <div className="pt-0.5 sm:pt-1 flex items-center text-[10px] sm:text-xs font-bold uppercase tracking-widest text-primary opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                      Découvrir{" "}
                      <FaArrowRight className="ml-1.5 sm:ml-2 w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
