import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
  FaEnvelope,
  FaLightbulb,
  FaPhone,
  FaRulerCombined,
  FaSnowflake,
  FaSquareParking,
  FaVolumeHigh,
  FaWheelchair,
  FaWifi,
} from "react-icons/fa6";

import MainLayout from "@/app/components/layouts/MainLayout";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { getSpaceIcon } from "@/lib/iconUtils";
import { formatCapacity } from "@/lib/spaceUtils";
import {
  getSpaceBySlug,
  getSpaces,
} from "@/services/spaceService";
import BackButton from "@/app/components/BackButton";

interface SpacePageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface AmenityFlags {
  hasPmrAccess?: boolean;
  hasAirConditioning?: boolean;
  hasSoundSystem?: boolean;
  hasProfessionalLighting?: boolean;
  hasWifi?: boolean;
  hasParking?: boolean;
}

const AMENITIES: Array<{
  key: keyof AmenityFlags;
  label: string;
  icon: typeof FaWifi;
}> = [
  {
    key: "hasPmrAccess",
    label: "Accessibilité PMR",
    icon: FaWheelchair,
  },
  {
    key: "hasAirConditioning",
    label: "Climatisation",
    icon: FaSnowflake,
  },
  {
    key: "hasSoundSystem",
    label: "Sonorisation",
    icon: FaVolumeHigh,
  },
  {
    key: "hasProfessionalLighting",
    label: "Éclairage professionnel",
    icon: FaLightbulb,
  },
  {
    key: "hasWifi",
    label: "Wi-Fi",
    icon: FaWifi,
  },
  {
    key: "hasParking",
    label: "Parking",
    icon: FaSquareParking,
  },
];

const SPACE_ID_BY_SLUG: Record<string, number> = {
  "grand-theatre": 1,
  "petit-theatre": 2,
  "salle-de-danse": 3,
  hall: 4,
  atrium: 5,
  cafeteria: 6,
  "cafeteriat-mukishi-wa-pwo": 6,
  "salle-de-musique-1": 7,
  "salle-de-musique-2": 8,
  parking: 9,
  "esplanade-principale": 10,
  esplannade: 10,
  "esplanade-secondaire-ina": 11,
  "esplanade-secondaire-parking": 12,
};

export async function generateStaticParams() {
  const spaces = await getSpaces();

  return spaces.map((space) => ({
    slug: space.slug,
  }));
}

export default async function SpacePage({
  params,
}: SpacePageProps) {
  const { slug } = await params;
  const space = await getSpaceBySlug(slug);

  if (!space) {
    notFound();
  }

  const IconComponent = getSpaceIcon(
    space.categoryIcon,
  );

  const selectedSpaceId =
    SPACE_ID_BY_SLUG[space.slug];

  // Seules les caractéristiques renseignées dans le back-office sont affichées.
  const technicalSpecs: Array<{
    label: string;
    value: string;
    icon?: typeof FaRulerCombined;
  }> = [];

  if (space.surfaceM2 != null) {
    technicalSpecs.push({
      icon: FaRulerCombined,
      label: "Surface",
      value: `${space.surfaceM2} m²`,
    });
  }

  if (space.seatedCapacity != null) {
    technicalSpecs.push({
      label: "Places assises",
      value: String(space.seatedCapacity),
    });
  }

  if (space.standingCapacity != null) {
    technicalSpecs.push({
      label: "Places debout",
      value: String(space.standingCapacity),
    });
  }

  // Capacité globale, si le détail assis / debout n'est pas renseigné.
  if (
    space.capacity != null &&
    space.seatedCapacity == null &&
    space.standingCapacity == null
  ) {
    technicalSpecs.push({
      label: "Capacité",
      value: formatCapacity(space.capacity),
    });
  }

  // Un équipement non coché est le plus souvent une donnée non saisie :
  // on n'affiche que ceux qui sont disponibles plutôt qu'une liste de croix.
  const availableAmenities = AMENITIES.filter(
    ({ key }) => Boolean(space[key]),
  );

  const reservationParams =
    new URLSearchParams({
      space: space.slug,
      ...(selectedSpaceId
        ? {
            spaceId: String(selectedSpaceId),
          }
        : {}),
    });

  const reservationPath =
    `/espace-membre/membre/nouvelle-demande?${reservationParams.toString()}`;

  const loginUrl =
    `/auth/login?redirect=${encodeURIComponent(
      reservationPath,
    )}`;

  const signupUrl =
    `/auth/signup?redirect=${encodeURIComponent(
      reservationPath,
    )}`;

  return (
    <MainLayout>
      {/* Hero */}
      <section className="relative mt-16 min-h-[55vh] w-full overflow-hidden bg-foreground sm:mt-20 lg:mt-24">
        <div className="absolute inset-0">
          <Image
            src={
              space.coverImage ||
              "/images/grand-tambour.jpg"
            }
            alt={space.name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/50 to-foreground/20" />
        </div>

        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-10 pt-24 sm:px-6 sm:pb-14 lg:px-8">
          <BackButton
            fallbackHref="/grand-tambour/espaces"
            className="mb-4 inline-flex w-fit items-center gap-2 text-xs font-medium uppercase tracking-widest text-white/80 transition-colors hover:text-white sm:mb-6 sm:text-sm"
          >
            <FaArrowLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            Retour
          </BackButton>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="rounded-xl bg-primary p-2.5 text-primary-foreground shadow-lg">
              <IconComponent className="h-5 w-5" />
            </div>

            {space.category && (
              <Badge className="border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] uppercase tracking-widest text-white sm:text-xs">
                {space.category}
              </Badge>
            )}

            {space.capacity && (
              <Badge className="border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] uppercase tracking-widest text-white sm:text-xs">
                {formatCapacity(
                  space.capacity,
                )}
              </Badge>
            )}
          </div>

          <h1 className="text-3xl font-bold uppercase leading-[0.95] text-white drop-shadow-lg sm:text-4xl md:text-5xl lg:text-6xl">
            {space.name}
          </h1>
        </div>
      </section>

      {/* Contenu principal */}
      <section className="mx-auto mt-14 grid max-w-7xl grid-cols-1 gap-10 px-4 sm:mt-16 sm:gap-12 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
        {/* Colonne gauche */}
        <div className="space-y-10 sm:space-y-12 lg:col-span-7">
          {space.fullDescription && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground sm:gap-4 sm:text-sm">
                <span className="h-px w-6 bg-border sm:w-8" />
                Description
              </h2>

              <p className="whitespace-pre-line text-base leading-relaxed text-muted-foreground sm:text-lg">
                {space.fullDescription}
              </p>
            </div>
          )}

          {/* Fiche technique */}
          <div className="space-y-4 border-t border-border/60 pt-4 sm:space-y-6 sm:pt-6">
            <h2 className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground sm:gap-4 sm:text-sm">
              <span className="h-px w-6 bg-border sm:w-8" />
              Fiche technique
            </h2>

            {technicalSpecs.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3">
                {technicalSpecs.map((spec) => (
                  <SpecItem
                    key={spec.label}
                    icon={spec.icon}
                    label={spec.label}
                    value={spec.value}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                La fiche technique détaillée de cet espace est disponible sur
                demande auprès de nos équipes.
              </p>
            )}
          </div>

          {/* Équipements */}
          {availableAmenities.length > 0 && (
            <div className="space-y-4 border-t border-border/60 pt-4 sm:space-y-6 sm:pt-6">
              <h2 className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground sm:gap-4 sm:text-sm">
                <span className="h-px w-6 bg-border sm:w-8" />
                Équipements disponibles
              </h2>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {availableAmenities.map(
                  ({
                    key,
                    label,
                    icon: AmenityIcon,
                  }) => (
                    <div
                      key={key}
                      className="flex items-center gap-3 rounded-xl bg-primary/5 p-4 text-foreground"
                    >
                      <AmenityIcon className="text-primary" />

                      <span className="flex-1 text-sm font-medium">
                        {label}
                      </span>

                      <FaCheck
                        className="text-primary"
                        size={14}
                      />
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {space.usageConditions && (
            <div className="space-y-4 border-t border-border/60 pt-4 sm:space-y-6 sm:pt-6">
              <h2 className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground sm:gap-4 sm:text-sm">
                <span className="h-px w-6 bg-border sm:w-8" />
                Conditions d&apos;utilisation
              </h2>

              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">
                {space.usageConditions}
              </p>
            </div>
          )}
        </div>

        {/* Colonne droite : réservation */}
        <div className="lg:col-span-5">
          <div className="space-y-5 rounded-xl border border-border/60 bg-muted/20 p-6 shadow-xl sm:space-y-6 sm:p-8 lg:sticky lg:top-28">
            <div>
              <h3 className="text-lg font-bold uppercase tracking-tight text-foreground">
                Réserver cet espace
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Connectez-vous pour choisir
                vos dates et envoyer une
                demande de réservation pour{" "}
                <strong className="text-foreground">
                  {space.name}
                </strong>
                .
              </p>
            </div>

            <div className="space-y-3">
              <Button
                asChild
                className="group w-full py-5 text-xs uppercase tracking-[0.15em] sm:py-6 sm:text-sm"
              >
                <Link href={loginUrl}>
                  Réserver
                  <FaArrowRight className="transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full bg-white py-5 text-xs uppercase tracking-[0.15em] sm:py-6 sm:text-sm"
              >
                <Link href={signupUrl}>
                  Créer un compte
                </Link>
              </Button>

              {space.quoteRequestUrl && (
                <Button
                  asChild
                  variant="ghost"
                  className="w-full py-5 text-xs uppercase tracking-[0.15em] sm:py-6 sm:text-sm"
                >
                  <Link
                    href={
                      space.quoteRequestUrl
                    }
                  >
                    Demander un devis
                  </Link>
                </Button>
              )}
            </div>

            <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
              <p className="text-xs leading-5 text-muted-foreground">
                Vous n’avez pas encore de
                compte ? Créez-en un,
                vérifiez votre adresse
                e-mail, puis connectez-vous.
                L’espace choisi sera
                conservé.
              </p>
            </div>

            {(space.contactName ||
              space.contactEmail ||
              space.contactPhone) && (
              <div className="space-y-2 border-t border-border/60 pt-4">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Contact
                </span>

                {space.contactName && (
                  <p className="text-sm font-bold text-foreground">
                    {space.contactName}
                  </p>
                )}

                {space.contactEmail && (
                  <a
                    href={`mailto:${space.contactEmail}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                  >
                    <FaEnvelope
                      size={13}
                    />
                    {space.contactEmail}
                  </a>
                )}

                {space.contactPhone && (
                  <a
                    href={`tel:${space.contactPhone}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                  >
                    <FaPhone size={13} />
                    {space.contactPhone}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Galerie */}
      {space.gallery &&
        space.gallery.length > 0 && (
          <section className="mt-16 bg-muted/10 py-16 sm:mt-20 sm:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-8 space-y-2 sm:mb-10 sm:space-y-3">
                <span className="text-xs font-semibold uppercase tracking-[0.4em] text-primary sm:text-sm">
                  Visuels
                </span>

                <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                  Galerie
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3">
                {space.gallery.map(
                  (item, index) => (
                    <div
                      key={`${item.image}-${index}`}
                      className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted/30"
                    >
                      <Image
                        src={item.image}
                        alt={
                          item.caption ||
                          space.name
                        }
                        fill
                        className="object-cover transition-transform duration-700 hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  ),
                )}
              </div>
            </div>
          </section>
        )}
    </MainLayout>
  );
}

function SpecItem({
  icon: Icon,
  label,
  value,
}: {
  icon?: typeof FaRulerCombined;
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1.5">
      <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:text-xs">
        {Icon && <Icon size={12} />}
        {label}
      </span>

      <p className="text-lg font-bold text-foreground sm:text-xl">
        {value}
      </p>
    </div>
  );
}