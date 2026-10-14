import MainLayout from "../components/layouts/MainLayout";
import ContactForm from "./contact-form";
import { GoogleMapsButton } from "./GoogleMapsButton";
import {
  FaClock,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
} from "react-icons/fa";

export default function InfosPratiquesPage() {
  return (
    <MainLayout>
      {/* Hero Section - Reduced Height */}
      <section className="relative h-[25vh] min-h-[200px] sm:h-[30vh] sm:min-h-[250px] md:h-[35vh] md:min-h-[300px] mt-16 sm:mt-20 md:mt-24 flex items-center justify-center bg-muted/5 border-b border-border/40">
        <div className="text-center px-4 sm:px-6 max-w-4xl mx-auto">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 md:mb-4 tracking-tight text-foreground uppercase">
            Informations Pratiques
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm md:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
            Tout ce que vous devez savoir pour votre visite au CCAPAC.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 lg:gap-16">
          {/* Left Column: Info Cards */}
          <div className="space-y-6 sm:space-y-8 md:space-y-10">
            {/* Horaires */}
            <div className="space-y-4 sm:space-y-5 md:space-y-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <FaClock className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5" />
                </div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                  Horaires d&apos;ouverture
                </h2>
              </div>

              <div className="bg-card border border-border/50 rounded-lg sm:rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 border-b border-border/40 pb-2.5 sm:pb-3 last:border-0 last:pb-0">
                    <span className="font-medium text-sm sm:text-base">
                      Lundi - Vendredi
                    </span>
                    <span className="font-bold text-primary text-sm sm:text-base">
                      8h00 - 16h00
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 border-b border-border/40 pb-2.5 sm:pb-3 last:border-0 last:pb-0">
                    <span className="font-medium text-sm sm:text-base">
                      Samedi
                    </span>
                    <span className="font-bold text-primary text-sm sm:text-base">
                      09h00 - 16h00
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 border-b border-border/40 pb-2.5 sm:pb-3 last:border-0 last:pb-0">
                    <span className="font-medium text-sm sm:text-base">
                      Dimanche
                    </span>
                    <span className="font-bold text-primary text-sm sm:text-base">
                      14h00 - 18h00
                    </span>
                  </div>
                </div>
                <div className="bg-muted/20 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm text-muted-foreground border-t border-border/40">
                  Fermé les jours fériés. Horaires spéciaux vac. scolaires.
                </div>
              </div>
            </div>

            {/* Accès */}
            <div className="space-y-4 sm:space-y-5 md:space-y-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <FaMapMarkerAlt className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5" />
                </div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                  Accès
                </h2>
              </div>

              <div className="bg-card border border-border/50 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 shadow-sm space-y-4 sm:space-y-5 md:space-y-6">
                <div>
                  <h3 className="font-semibold mb-1.5 sm:mb-2 text-sm sm:text-base">
                    Adresse
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm md:text-base">
                    Boulevard Triomphal
                    <br />
                    Kinshasa, République Démocratique du Congo
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-1.5 sm:mb-2 text-sm sm:text-base">
                    Parking
                  </h3>
                  <p className="text-muted-foreground text-xs sm:text-sm md:text-base">
                    Gratuit et surveillé
                  </p>
                </div>

                <GoogleMapsButton />
              </div>
            </div>

            {/* Direct Contacts */}
            <div className="space-y-4 sm:space-y-5 md:space-y-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <FaPhoneAlt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                  Contacts Directs
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-muted/20 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-border/30 hover:border-primary/30 transition-colors">
                  <p className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-wider mb-1.5 sm:mb-2">
                    Accueil Général
                  </p>
                  <p className="font-medium text-sm sm:text-base md:text-lg mb-1 break-all">
                    +243 890 809 746
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Du Lundi au Samedi
                  </p>
                </div>
                <div className="bg-muted/20 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-border/30 hover:border-primary/30 transition-colors">
                  <p className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-wider mb-1.5 sm:mb-2">
                    Infos & Programmation
                  </p>
                  <p className="font-medium text-sm sm:text-base md:text-lg mb-1 break-all">
                    info@centreculturel.cd
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Réponse sous 24h
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:sticky lg:top-24 xl:top-32 h-fit">
            <div className="bg-card rounded-xl sm:rounded-2xl shadow-sm border border-border/50 overflow-hidden">
              <div className="bg-muted/20 border-b border-border/40 p-4 sm:p-5 md:p-6 lg:p-8">
                <div className="flex items-center gap-2 sm:gap-3 text-primary mb-1.5 sm:mb-2">
                  <FaEnvelope className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <h3 className="font-bold uppercase tracking-wider text-xs sm:text-sm">
                    Nous écrire
                  </h3>
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                  Envoyer un message
                </h2>
                <p className="text-muted-foreground mt-1.5 sm:mt-2 text-xs sm:text-sm md:text-base">
                  Une question spécifique ? Remplissez ce formulaire.
                </p>
              </div>
              <div className="p-4 sm:p-5 md:p-6 lg:p-8">
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
