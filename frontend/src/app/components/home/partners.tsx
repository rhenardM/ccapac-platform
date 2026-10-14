import Image from "next/image";
import Link from "next/link";
import { FaHandshake } from "react-icons/fa";
import { getPartners } from "@/services/partnerService";

export default async function PartnersSection() {
  const partners = await getPartners();

  if (partners.length === 0) {
    return null;
  }

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-background via-muted/5 to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section - Responsive */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl uppercase sm:text-3xl md:text-3xl lg:text-3xl xl:text-4xl font-bold text-foreground leading-tight drop-shadow-sm">
            Ils nous accompagnent
          </h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Des partenariats stratégiques qui enrichissent notre vision
            culturelle
          </p>
        </div>

        {/* Partners - centrés, responsive quel que soit le nombre */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 md:gap-12">
          {partners.map((partner) => {
            const logo = (
              <Image
                src={partner.logo}
                alt={`Logo ${partner.name}`}
                width={200}
                height={200}
                className="object-contain transition-all duration-300 max-h-16 sm:max-h-20 lg:max-h-24 w-full group-hover:scale-110"
              />
            );

            return (
              <div
                key={partner.name}
                className="group flex w-36 items-center justify-center p-4 transition-all duration-300 hover:scale-105 sm:w-44 sm:p-6 md:w-52"
              >
                {partner.url ? (
                  <Link
                    href={partner.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    {logo}
                  </Link>
                ) : (
                  logo
                )}
              </div>
            );
          })}
        </div>
        <div className="text-center mt-8 sm:mt-12">
          <Link
            href="/infos"
            className="inline-flex rounded-xl text-base items-center gap-2 px-8 py-4 bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-black font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <FaHandshake className="w-6 h-6" />
            Devenir partenaire
          </Link>
        </div>
      </div>
    </section>
  );
}
