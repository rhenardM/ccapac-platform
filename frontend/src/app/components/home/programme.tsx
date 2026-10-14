"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getFeaturedProgrammes, type Programme } from "@/lib/programmes-data";
import { FaArrowRight } from "react-icons/fa";

export default function Programmes() {
  const [featuredProgrammes, setFeaturedProgrammes] = useState<Programme[]>([]);

  useEffect(() => {
    getFeaturedProgrammes()
      .then(setFeaturedProgrammes)
      .catch(() => setFeaturedProgrammes([]));
  }, []);

  return (
    <section className="py-20 px-4 md:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground uppercase">
            Vivez la Culture Congolaise
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Découvrez nos programmes culturels qui célèbrent la richesse
            artistique du Congo à travers la musique, le théâtre, le cinéma et
            le patrimoine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          {featuredProgrammes.map((programme, index) => {
            const isLarge = index === 0;
            const gridClass = isLarge
              ? "md:col-span-2 md:row-span-2 min-h-[400px]"
              : "min-h-[250px]";

            return (
              <Link
                key={programme.id}
                href={`/programmes/${programme.categorySlug}/${programme.slug}`}
                className={`group relative overflow-hidden rounded-xl border border-border/40 bg-muted/10 ${gridClass} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
              >
                <Image
                  src={programme.image || "/placeholder.svg"}
                  alt={programme.title}
                  fill
                  quality={90}
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                <div className="absolute inset-0 p-5 md:p-6 flex flex-col justify-end">
                  <div className="mb-auto">
                    <span className="inline-flex px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs md:text-sm font-medium text-white border border-white/10 shadow-sm">
                      {programme.category}
                    </span>
                  </div>

                  <div className="space-y-2 transform transition-transform duration-300 translate-y-2 group-hover:translate-y-0">
                    <h3
                      className={`font-bold text-white uppercase tracking-tight ${
                        isLarge ? "text-2xl md:text-3xl" : "text-lg md:text-xl"
                      }`}
                    >
                      {programme.title}
                    </h3>

                    <p className="text-white/80 text-sm line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                      {programme.slogan}
                    </p>

                    <div className="pt-2 flex items-center text-primary text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                      <span>Découvrir</span>
                      <FaArrowRight className="ml-2 w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-center">
          <Link
            href="/programmes"
            className="inline-flex items-center text-base gap-2 px-8 py-4 bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-black font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            Découvrir tous nos programmes
            <FaArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
