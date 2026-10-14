import MainLayout from "@/app/components/layouts/MainLayout";
import { FaArrowLeft } from "react-icons/fa6";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { departments } from "@/data/departments";
import { missions } from "@/data/missions";
import DepartmentAccordion from "@/app/components/grand-tambour/DepartmentAccordion";
import MissionCard from "@/app/components/grand-tambour/MissionCard";

export default function EquipeGouvernancePage() {
  // Temporairement retire de l'espace public pendant la restructuration de l'organigramme.
  notFound();

  return (
    <MainLayout>
      <main className="pb-12 sm:pb-16 md:pb-20 lg:pb-24">
        {/* Hero Section */}
        <section className="relative h-[35vh] min-h-[280px] sm:h-[40vh] sm:min-h-[350px] lg:h-[45vh] lg:min-h-[400px] mt-16 sm:mt-20 lg:mt-24 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-black/60 z-10" />
          <Image
            src="/motif-luba.png"
            alt="Equipe CCAPAC"
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
          />
          <div className="relative z-20 text-center px-4 sm:px-6 w-full max-w-5xl mx-auto">
            <Link
              href="/grand-tambour/presentation"
              className="inline-flex items-center gap-1.5 sm:gap-2 text-white/80 hover:text-white mb-4 sm:mb-5 md:mb-6 transition-colors duration-300 text-[10px] sm:text-xs md:text-sm uppercase tracking-wider font-medium"
            >
              <FaArrowLeft className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
              <span className="truncate">Retour à la présentation</span>
            </Link>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 md:mb-5 text-white tracking-tight uppercase drop-shadow-2xl px-2">
              L&apos;Équipe & Gouvernance
            </h1>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-white/90 font-light leading-relaxed max-w-2xl mx-auto drop-shadow-md px-2">
              Découvrez les visages et les talents qui donnent vie au Centre
              Culturel et Artistique pour les pays de l&apos;Afrique Centrale -
              Grand Tambour.
            </p>
          </div>
        </section>

        {/* Departments Section */}
        <section className="py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 sm:mb-10 md:mb-12 lg:mb-16 text-center max-w-3xl mx-auto">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold uppercase tracking-tight mb-3 sm:mb-4">
                Notre Organisation
              </h2>
              <div className="h-0.5 sm:h-1 w-12 sm:w-16 md:w-20 bg-primary/20 mx-auto" />
            </div>
            <DepartmentAccordion departments={departments} />
          </div>
        </section>

        {/* Mission Statement */}
        <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-muted/10 border-t border-muted/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-10 md:mb-12 lg:mb-16">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold uppercase tracking-tight mb-4 sm:mb-5 md:mb-6 lg:mb-8 text-foreground">
                Notre Engagement
              </h2>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto px-2">
                L&apos;équipe du CCAPAC s&apos;engage au quotidien à promouvoir
                la culture, soutenir la création artistique et offrir une
                expérience inclusive et enrichissante.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-10 lg:gap-12">
              {missions.map((mission) => (
                <MissionCard
                  key={mission.title}
                  title={mission.title}
                  description={mission.description}
                  imageSrc={mission.imageSrc}
                  imageAlt={mission.imageAlt}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
    </MainLayout>
  );
}
