import MainLayout from "@/app/components/layouts/MainLayout";
import AgendaContainer from "@/app/components/agenda/agendaContainer";
import Image from "next/image";

export default function AgendaPage() {
  return (


    <MainLayout>
      {/* Page Header */}
      <section className="relative h-[35vh] min-h-[280px] sm:h-[40vh] sm:min-h-[350px] lg:h-[45vh] lg:min-h-[400px] mt-16 sm:mt-20 lg:mt-24 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <Image
          src="/motif-luba.png"
          alt="Agenda CCAPAC"
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
        />
        <div className="relative z-20 text-center px-4 sm:px-6 w-full">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 md:mb-6 text-white tracking-tight uppercase drop-shadow-2xl">
            Agenda
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 font-light leading-relaxed max-w-2xl mx-auto drop-shadow-md px-2">
            Découvrez nos événements culturels et artistiques. Filtrez par mois,
            discipline ou public pour trouver les activités qui vous
            intéressent.
          </p>
        </div>
      </section>

      {/* Agenda avec filtres intégrés */}
      <AgendaContainer />
    </MainLayout>

    
  );
}
