import MainLayout from "@/app/components/layouts/MainLayout";
import Link from "next/link";
import Image from "next/image";
import { FaGlobe, FaPeopleGroup, FaBookOpen } from "react-icons/fa6";
import { HiLightBulb } from "react-icons/hi";
import { MdFlashOn } from "react-icons/md";

export default function GrandTambourPresentation() {
  return (
    <MainLayout>
      {/* Section Hero */}

      <section className="relative h-[70vh] min-h-[500px] sm:h-[80vh] sm:min-h-[600px] lg:h-screen lg:min-h-[700px] flex items-center justify-center mt-20 sm:mt-24">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/grand-tambour2.jpg"
            alt="Grand Tambour - Vue extérieure"
            fill
            className="object-cover object-center sm:object-[60%_center]"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
            quality={90}
          />
          <div className="absolute inset-0 bg-black/70 sm:bg-black/60 lg:bg-black/50"></div>
        </div>

        <div className="relative z-10 text-center text-white px-1 sm:px-6 lg:px-8 max-w-5xl mx-auto mt-32">
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-5xl font-bold mb-6 sm:mb-8 tracking-tight leading-tight">
            Centre Culturel et Artistique des Pays d&apos;Afrique Centrale -
            Grand Tambour
          </h1>
          <p className="text-sm sm:text-lg lg:text-xl font-light max-w-3xl mx-auto leading-relaxed">
            Inauguré à Kinshasa le 14 décembre 2024 par le Président
            Félix-Antoine Tshisekedi Tshilombo.
          </p>
          <p className="text-sm sm:text-lg lg:text-xl font-light max-w-3xl mx-auto leading-relaxed mt-4">
            Un pôle culturel stratégique de la République Démocratique du Congo
            et de toute l&apos;Afrique centrale.
          </p>
        </div>
      </section>

      {/* Section Missions */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="uppercase text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 sm:mb-6">
                Nos Missions
              </h2>
              <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto">
                Le Grand Tambour a pour mission de promouvoir et préserver la
                richesse culturelle africaine
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <div className="group bg-gradient-to-br from-muted/20 to-muted/40 p-6 sm:p-8 rounded-xl hover:shadow-lg transition-all duration-300 border border-muted/30">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-lg  transition-transform duration-300">
                    1
                  </div>
                  <p className="text-base sm:text-lg text-foreground leading-relaxed">
                    Créer, diffuser et préserver les arts congolais et africains
                  </p>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-muted/20 to-muted/40 p-6 sm:p-8 rounded-xl hover:shadow-lg transition-all duration-300 border border-muted/30">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-lg transition-transform duration-300">
                    2
                  </div>
                  <p className="text-base sm:text-lg text-foreground leading-relaxed">
                    Promouvoir l&apos;innovation artistique et culturelle
                  </p>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-muted/20 to-muted/40 p-6 sm:p-8 rounded-xl hover:shadow-lg transition-all duration-300 border border-muted/30">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-lg transition-transform duration-300">
                    3
                  </div>
                  <p className="text-base sm:text-lg text-foreground leading-relaxed">
                    Encourager la participation citoyenne à la culture
                  </p>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-muted/20 to-muted/40 p-6 sm:p-8 rounded-xl hover:shadow-lg transition-all duration-300  border border-muted/30">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-lg ">
                    4
                  </div>
                  <p className="text-base sm:text-lg text-foreground leading-relaxed">
                    Faciliter le dialogue interculturel et international
                  </p>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-muted/20 to-muted/40 p-6 sm:p-8 rounded-xl hover:shadow-lg transition-all border border-muted/30 md:col-span-2">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-lg transition-transform duration-300">
                    5
                  </div>
                  <p className="text-base sm:text-lg text-foreground leading-relaxed">
                    Être un moteur de développement social, économique et
                    éducatif à travers la culture
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Valeurs */}
      <section className="py-16 sm:py-20 lg:py-24 bg-muted/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="uppercase text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 sm:mb-6">
                Nos Valeurs
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="group text-center p-6 sm:p-8 rounded-xl hover:shadow-lg transition-all duration-300  bg-gradient-to-br from-white to-muted/10 border border-muted/20">
                <div className="relative mb-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center mx-auto transition-transform duration-300">
                    <HiLightBulb className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                  Créativité
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Valorisation des formes d&apos;expressions artistiques locales
                  et panafricaines
                </p>
              </div>

              <div className="group text-center p-6 sm:p-8 rounded-xl hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-muted/10 border border-muted/20">
                <div className="relative mb-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center mx-auto duration-300">
                    <MdFlashOn className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                  Innovation
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Ouverture aux technologies et nouveaux modes de diffusion
                </p>
              </div>

              <div className="group text-center p-6 sm:p-8 rounded-xl hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-muted/10 border border-muted/20">
                <div className="relative mb-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center mx-auto duration-300">
                    <FaBookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                  Transmission
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Pédagogie, archives, mémoire collective
                </p>
              </div>

              <div className="group text-center p-6 sm:p-8 sm:col-span-2 lg:col-span-1 rounded-xl hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-muted/10 border border-muted/20">
                <div className="relative mb-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center mx-auto duration-300">
                    <FaPeopleGroup className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                  Citoyenneté
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Culture comme vecteur de cohésion nationale
                </p>
              </div>

              <div className="group text-center p-6 sm:p-8 sm:col-span-2 lg:col-span-1 rounded-xl hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-muted/10 border border-muted/20">
                <div className="relative mb-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center mx-auto duration-300">
                    <FaGlobe className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                  Dialogue
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Plateforme d&apos;échanges panafricains et internationaux
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Historique */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-white via-muted/5 to-muted/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="uppercase text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 sm:mb-6">
                Historique
              </h2>
            </div>

            <div className="bg-gradient-to-br from-white to-muted/20 rounded-2xl p-8 sm:p-12 shadow-lg border border-muted/20">
              <div className="prose prose-lg max-w-none">
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed text-center">
                  Projet phare initié par le gouvernement congolais dans le
                  cadre d&apos;un plan de relance culturelle nationale, le Grand
                  Tambour est né d&apos;une volonté de doter le pays d&apos;un
                  espace emblématique pour la création et la mémoire vivante des
                  peuples d&apos;Afrique centrale.
                </p>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed text-center mt-6">
                  Ce centre culturel représente un tournant majeur dans le
                  paysage culturel africain, offrant aux artistes et aux
                  citoyens un lieu de rencontre, de création et de célébration
                  de la richesse culturelle du continent.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Symbolique architectural */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-muted/5 via-muted/10 to-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="uppercase text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-6 sm:mb-8">
                Symbolique architectural
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
              <div className="relative order-2 lg:order-1 group">
                <div className="overflow-hidden rounded-2xl shadow-xl">
                  <Image
                    src="/images/grand-tambour3.jpg"
                    alt="Architecture du Grand Tambour"
                    width={600}
                    height={500}
                    className="w-full h-auto object-cover object-center sm:object-[60%_center]  transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                    quality={90}
                  />
                </div>
              </div>

              <div className="space-y-6 sm:space-y-8 order-1 lg:order-2">
                <div className="bg-gradient-to-br from-white to-muted/10 p-6 sm:p-8 rounded-2xl shadow-lg border border-muted/20">
                  <h3 className="text-lg sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">
                    Le Tambour : symbole de la mémoire et de la souveraineté
                    culturelle congolaise
                  </h3>

                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                    Le Grand Tambour est un instrument ancestral et vital pour
                    les peuples de la RDC. Qualifié de «voix collective du
                    peuple», il est un messager, un instrument de rassemblement
                    et un éveilleur de conscience. Sa forme circulaire symbolise
                    l&apos;égalité et incarne la tradition qui doit guider la
                    modernité.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section CTA */}
      <section className="py-16 sm:py-20 lg:py-24 bg-accent text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="uppercase text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-6 sm:mb-8">
              Découvrez le Grand Tambour
            </h2>
            <p className="text-lg sm:text-xl mb-8 sm:mb-12 leading-relaxed text-black max-w-3xl mx-auto opacity-90">
              Venez vivre l&apos;expérience unique du Grand Tambour et plongez
              au cœur de la culture africaine.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
              <Link
                href="/grand-tambour/espaces"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-white text-black hover:bg-gray-100 transition-colors font-bold text-sm sm:text-base rounded"
              >
                Découvrir les espaces
              </Link>
              <Link
                href="/infos"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-white text-black hover:bg-white hover:text-black transition-colors font-bold text-sm sm:text-base rounded"
              >
                Infos pratiques
              </Link>
              <Link
                href="/agenda"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-white text-black hover:bg-white hover:text-black transition-colors font-bold text-sm sm:text-base rounded"
              >
                Voir l&apos;agenda
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
