import Image from "next/image";

export default function DirectorMessage() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-primary via-primary/95 to-primary/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          <div className="space-y-6 sm:space-y-8 order-2 lg:order-1 mb-20">
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-2xl uppercase sm:text-2xl md:text-4xl lg:text-4xl xl:text-4xl font-bold text-white leading-tight mb-10 drop-shadow-lg">
                Une vision partagée de notre héritage culturel
              </h2>
            </div>

            <blockquote className="text-base sm:text-lg md:text-xl leading-relaxed text-white italic border-l-4 border-secondary pl-4 sm:pl-6 my-6 sm:my-8 bg-white/10 backdrop-blur-sm rounded-r-xl p-4 sm:p-6 shadow-lg">
              &quot;Le CCAPAC incarne notre vision commune de célébrer et
              préserver l&apos;extraordinaire diversité culturelle de
              l&apos;Afrique Centrale. Ensemble, nous bâtissons un pont entre
              nos traditions ancestrales et les expressions artistiques
              contemporaines.&quot;
            </blockquote>

            <div className="flex items-center space-x-3 sm:space-x-4 pt-2">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border border-white/20">
                <Image
                  src="/images/members/balufu.jpg"
                  alt="Balufu Bakupa-Kanyinda, Directeur Général"
                  width={64}
                  height={64}
                  className="rounded-full w-10 h-10 sm:w-14 sm:h-14 object-cover"
                />
              </div>
              <div>
                <p className="font-semibold text-white text-base sm:text-lg drop-shadow-md">
                  Balufu Bakupa-Kanyinda
                </p>
                <p className="text-xs sm:text-sm text-white uppercase tracking-wide drop-shadow-sm">
                  Directeur Général
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end order-1 lg:order-2 lg:mb-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl blur-xl"></div>
              <Image
                src="/images/mukishi.png"
                alt="Masque traditionnel africain Mukishi"
                width={400}
                height={500}
                className="relative w-48 h-60 sm:w-64 sm:h-80 md:w-80 md:h-96 lg:w-96 lg:h-auto max-w-full object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
