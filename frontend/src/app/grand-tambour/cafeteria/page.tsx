import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  Clock,
  Coffee,
  Leaf,
  LogIn,
  MapPin,
  Smartphone,
  Truck,
  Users,
  Wifi,
} from "lucide-react";
import MainLayout from "@/app/components/layouts/MainLayout";
import CafeteriaMap from "./CafeteriaMap";

export const metadata: Metadata = {
  title: "La Cafétéria Mukishi wa Mpo | CCAPAC",
  description:
    "Un espace chaleureux au cœur du Centre Culturel, pour se retrouver, se détendre et partager un moment agréable.",
};

const features = [
  {
    icon: Leaf,
    title: "Cuisine traditionnelle congolaise.",
    detail: "Une cuisine congolaise qui nourrit le corps, comme maman le faisait.",
  },
  {
    icon: Users,
    title: " Cuisine Congo-Fusion.",
    detail: "La cuisine congolaise avec une touche de modernité.",
  },
  {
    icon: Coffee,
    title: "Boissons traditionnelle",
    detail: "Savourez des boissons traditionnelles telles que le vin de palme, le bissap et le tangawisi.",
  },
];

const reasons = [
  {
    icon: Truck,
    title: "Produits locaux",
    detail:
      "Nous soutenons les agriculteurs et producteurs artisanaux de la région.",
  },
  {
    icon: Wifi,
    title: "WiFi gratuit",
    detail:
      "Idéal pour vos rendez-vous d'affaires ou vos sessions de travail créatives.",
  },
  {
    icon: Smartphone,
    title: "Paiement mobile",
    detail:
      "Nous acceptons les méthodes de paiement modernes (M-Pesa, Orange Money, etc.).",
  },
];

export default function CafeteriaNewPage() {
  return (
    <MainLayout>
      <div className="bg-[#faf9f6] text-[#804423]">
        <Hero />
        <Presentation />
        <WhyChooseUs />
        <NousTrouver />
        {/* <QuoteBanner /> */}
      </div>
    </MainLayout>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Hero scindé                                                      */
/* ------------------------------------------------------------------ */
function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-[#f4efe4]">
      {/* Décor desktop : image pleine largeur à droite + courbe crème + palmier */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block">
        {/* Image (moitié droite, pleine hauteur) */}
        <div className="absolute inset-y-0 left-[42%] right-0">
          <Image
            src="/images/cafeteria/hero-section.jpeg"
            alt="La Cafétéria du Grand Tambour — intérieur chaleureux et moderne"
            fill
            priority
            quality={90}
            className="object-cover object-center"
            sizes="58vw"
          />
        </div>
        {/* Courbe crème qui déborde sur l'image */}
        <div className="absolute inset-y-0 left-[42%] w-28 fill-current text-[#f4efe4]">
          <svg
            viewBox="0 0 100 1000"
            preserveAspectRatio="none"
            className="h-full w-full"
          >
            <path d="M0,0 L2,0 C40,140 20,340 50,540 C74,740 30,880 2,1000 L0,1000 Z" />
          </svg>
        </div>
        {/* Feuille de palmier (haut gauche) */}
        <div className="absolute left-0 top-0 h-80 w-80 select-none opacity-[0.05] mix-blend-multiply">
          <svg
            viewBox="0 0 100 100"
            fill="currentColor"
            className="h-full w-full -translate-x-[20%] -translate-y-[20%] rotate-[35deg] text-[#804423]"
          >
            <path d="M50,10 C45,25 30,35 15,40 C30,45 40,60 45,75 C50,60 60,45 75,40 C60,35 55,25 50,10 Z" />
            <path d="M10,20 C15,35 25,40 35,42 C25,45 20,55 18,65 C15,50 10,40 5,35 C10,32 10,25 10,20 Z" />
            <path d="M85,30 C80,45 70,50 60,52 C70,55 75,65 77,75 C80,60 85,50 90,45 C85,42 85,35 85,30 Z" />
          </svg>
        </div>
      </div>

      {/* Contenu — aligné au même conteneur que les autres sections */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-36 pb-0 sm:px-12 sm:pt-40 md:px-16 lg:px-24 lg:pb-28 lg:pt-52">
        <div className="flex max-w-sm flex-col items-start gap-6 lg:min-h-[420px] lg:justify-center lg:gap-8">
          <h1 className="text-4xl font-bold uppercase leading-[1.12] tracking-tight text-[#804423] sm:text-5xl lg:text-[54px]">
            La Cafétéria
            <br />
            <span className="font-semibold">Mukishi wa Mpo</span>
          </h1>

          <div className="h-[2.5px] w-20 rounded-full bg-[#ffcc02]" />

          <p className="text-base leading-relaxed text-[#6b5b4f] sm:text-lg">
        Inspiré du célèbre masque ancestral chokwe, notre espace célèbre la tradition, 
            la grâce et le partage. Mukishi Wa Pwo est le lieu idéal pour nourrir le corps et l&apos;esprit.
            Venez vivre une pause authentique et ressourçante au quotidien.
          </p>

          <Link
            href="/grand-tambour/espaces"
            className="mt-2 flex items-center gap-3 rounded-full bg-[#804423] px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:bg-[#6a3a1e] hover:shadow-xl active:scale-[0.98]"
          >
            <MapPin size={16} className="text-[#ffcc02]" />
            <span>Découvrir nos espaces</span>
          </Link>
        </div>
      </div>

      {/* Image mobile (sous le contenu) */}
      <div className="relative h-[340px] w-full sm:h-[420px] lg:hidden">
        <Image
          src="/images/cafeteria/cafe_hero.jpeg"
          alt="La Cafétéria du Grand Tambour — intérieur chaleureux et moderne"
          fill
          priority
          quality={90}
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Présentation                                                     */
/* ------------------------------------------------------------------ */
function Presentation() {
  return (
    <section
      id="presentation"
      className="w-full px-6 py-20 sm:px-12 md:px-16 lg:px-24 lg:py-28"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 lg:flex-row lg:gap-16 xl:gap-20">
        {/* Image portrait */}
        <div className="flex w-full justify-center lg:w-[42%]">
          <div className="group relative aspect-[3/4] w-full max-w-[440px] overflow-hidden rounded-[32px] border border-[#e7dcc8] shadow-xl">
            <Image
              src="/images/cafeteria/section-2.png"
              alt="Intérieur chaleureux de la cafétéria"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(min-width: 1024px) 42vw, 100vw"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
          </div>
        </div>

        {/* Texte + grille de valeurs */}
        <div className="flex w-full flex-col items-start lg:w-[58%]">
          <div className="flex flex-col items-start gap-2.5">
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
              Notre Cafétéria
            </span>
            <div className="h-[2px] w-12 bg-[#804423]" />
          </div>

          <h2 className="mt-5 text-3xl font-bold uppercase leading-tight tracking-tight text-[#804423] sm:text-4xl lg:text-[42px]">
            Plus qu&apos;un repas,
            <br />
            une expérience.
          </h2>

          <p className="mt-6 max-w-xl text-sm leading-relaxed text-[#6b5b4f] sm:text-base">
            La Cafétéria Mukishi Wa Pwo est un espace ouvert à tous où confort, culture et convivialité se rencontrent. 
            Que ce soit pour une pause, un repas léger ou un moment entre amis, venez nourrir le corps et l&apos;esprit. 
            Vous êtes les bienvenus.
          </p>

          <div className="mt-12 grid w-full grid-cols-1 gap-8 border-t border-[#e7dcc8] pt-8 md:grid-cols-3 md:gap-0">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className={`flex h-full flex-col items-start ${
                    index === 0
                      ? "md:border-r md:pr-6"
                      : index === features.length - 1
                      ? "md:pl-6"
                      : "md:border-r md:px-6"
                  } border-[#e7dcc8]`}
                >
                  <Icon size={32} strokeWidth={1.5} className="text-primary" />
                  <h3 className="mt-4 text-base font-bold uppercase text-[#804423]">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#6b5b4f] sm:text-sm">
                    {feature.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Pourquoi nous choisir                                            */
/* ------------------------------------------------------------------ */
function WhyChooseUs() {
  return (
    <section className="w-full px-6 py-20 sm:px-12 md:px-16 lg:px-24 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
            Notre différence
          </span>
          <h2 className="mt-3 text-3xl font-bold uppercase leading-tight tracking-tight text-[#804423] sm:text-4xl">
            Pourquoi nous choisir ?
          </h2>
          <div className="mx-auto mt-4 h-[2px] w-16 rounded-full bg-[#ffcc02]" />
          <p className="mt-6 text-base leading-relaxed text-[#6b5b4f]">
            Plus qu&apos;un restaurant, une destination culturelle incontournable
            à Kinshasa.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((reason) => {
            const Icon = reason.icon;
            return (
              <div key={reason.title} className="flex items-start gap-5">
                <span className="grid h-14 w-14 flex-none place-items-center rounded-2xl bg-[#f4efe4] text-primary">
                  <Icon size={24} strokeWidth={1.75} />
                </span>
                <div>
                  <h3 className="text-lg font-bold uppercase text-[#804423]">
                    {reason.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#6b5b4f]">
                    {reason.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Nous trouver                                                     */
/* ------------------------------------------------------------------ */
function NousTrouver() {
  return (
    <section className="relative w-full overflow-hidden px-6 py-16 sm:px-12 md:px-16 lg:px-24 lg:py-24">
      <div className="relative mx-auto max-w-7xl rounded-[32px] border border-[#e7dcc8] bg-[#f4efe4] p-8 shadow-md sm:p-12 lg:p-16">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Détails */}
          <div className="flex flex-col items-start lg:col-span-5">
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
              Nous trouver
            </span>
            <h2 className="mt-3 text-2xl font-bold uppercase leading-tight tracking-tight text-[#804423] sm:text-3xl lg:text-[34px]">
              Au cœur du Centre Culturel et Artistique
            </h2>
            <div className="mb-10 mt-4 h-[2px] w-16 rounded-full bg-[#ffcc02]" />

            <div className="flex w-full flex-col gap-8">
              <InfoRow icon={MapPin} title="Adresse">
                Boulevard Triomphal, Kinshasa
                <br />
                En face du Palais du Peuple
              </InfoRow>
              <InfoRow icon={Clock} title="Horaires d'ouverture">
                Du lundi au samedi
                <br />
                08h00 – 22h00
              </InfoRow>
              <InfoRow icon={LogIn} title="Accès">
                Entrée principale du Centre Culturel
                <br />
                Accès facile et parking disponible
              </InfoRow>
            </div>
          </div>

          {/* Carte + branche botanique */}
          <div className="relative h-[320px] w-full sm:h-[400px] lg:col-span-7 lg:h-[440px]">
            <div className="relative isolate z-0 h-full w-full overflow-hidden rounded-2xl border border-[#e7dcc8] shadow-lg">
              <CafeteriaMap />
            </div>

            {/* Branche botanique décorative (coin bas-droit) */}
            <div className="pointer-events-none absolute -bottom-8 -right-8 z-30 h-44 w-44 select-none sm:h-56 sm:w-56">
              <svg
                viewBox="0 0 100 100"
                className="h-full w-full opacity-95 drop-shadow-[0_8px_16px_rgba(60,30,10,0.25)]"
              >
                {/* <path
                  d="M100,100 C80,80 50,55 35,40 C33,38 31,35 30,30"
                  stroke="#3a2014"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                /> */}
                {/* <path d="M35,40 C20,35 12,20 15,10 C25,12 35,22 40,35 Z" fill="#804423" />
                <path d="M50,55 C35,50 25,35 28,25 C38,27 48,38 52,50 Z" fill="#6a3a1e" />
                <path d="M68,70 C55,65 45,50 48,40 C58,42 68,53 72,65 Z" fill="#804423" />
                <path d="M35,40 C45,30 55,20 62,25 C60,35 50,45 40,50 Z" fill="#a0562a" />
                <path d="M52,55 C65,45 75,35 80,42 C78,52 68,62 58,68 Z" fill="#804423" />
                <path d="M72,75 C85,68 95,58 98,65 C95,75 85,82 76,85 Z" fill="#5a3418" /> */}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoRow({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof MapPin;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="grid h-10 w-10 flex-none place-items-center rounded-full border border-[#e7dcc8] bg-white text-primary shadow-sm">
        <Icon size={18} />
      </span>
      <div className="flex flex-col">
        <h4 className="text-sm font-bold uppercase tracking-wider text-[#804423]">
          {title}
        </h4>
        <p className="mt-1 text-sm leading-relaxed text-[#6b5b4f]">{children}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Bandeau citation                                                 */
/* ------------------------------------------------------------------ */
// function QuoteBanner() {
//   return (
//     <section className="w-full px-6 pb-16 sm:px-12 md:px-16 lg:px-24">
//       <div className="mx-auto max-w-7xl">
//         <div className="relative flex flex-col items-center justify-between gap-8 overflow-hidden rounded-[28px] border border-[#5a3418] bg-[#3a2014] px-8 py-12 shadow-xl sm:px-12 md:flex-row lg:px-20">
//           {/* Cercle décoratif */}
//           <div className="pointer-events-none absolute left-1/4 top-1/2 h-[350px] w-[350px] -translate-y-1/2 rounded-full bg-white/[0.02]" />

//           {/* Mug + citation */}
//           <div className="z-10 flex max-w-2xl flex-col items-center gap-6 text-center md:flex-row md:items-start md:text-left lg:gap-10">
//             <div className="flex-shrink-0 text-[#ffcc02]/60 md:mt-2">
//               <svg
//                 viewBox="0 0 100 100"
//                 fill="none"
//                 stroke="currentColor"
//                 strokeWidth="2.5"
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 className="h-16 w-16 opacity-80 sm:h-20 sm:w-20"
//               >
//                 <path d="M35,15 C37,10 33,5 35,2" />
//                 <path d="M50,15 C52,9 48,4 50,2" />
//                 <path d="M65,15 C67,10 63,5 65,2" />
//                 <path d="M22,25 L78,25 L72,82 C71,88 64,93 50,93 C36,93 29,88 28,82 Z" />
//                 <path d="M78,35 C88,35 94,42 94,50 C94,58 88,65 76,65" />
//                 <path d="M15,93 L85,93" strokeWidth="3" />
//               </svg>
//             </div>

//             <div className="flex flex-col items-center md:items-start">
//               <span className="h-6 select-none font-serif text-5xl font-bold leading-none text-[#ffcc02] md:h-8 lg:text-6xl">
//                 &ldquo;
//               </span>
//               <h3 className="mt-2 max-w-md text-xl font-semibold uppercase leading-normal tracking-wide text-white sm:max-w-xl sm:text-2xl lg:text-[27px]">
//                 Ici, chaque pause prend un autre goût.
//               </h3>
//             </div>
//           </div>

//           {/* Table & chaises bistro (desktop) */}
//           <div className="z-10 hidden flex-shrink-0 opacity-25 lg:block">
//             <svg
//               viewBox="0 0 240 120"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="2"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               className="h-auto w-48 text-[#e6c9a0]"
//             >
//               <line x1="85" y1="65" x2="155" y2="65" strokeWidth="2.5" />
//               <line x1="120" y1="65" x2="120" y2="108" />
//               <path d="M100,108 L140,108" />
//               <path d="M110,108 L120,98 L130,108" />
//               <path d="M40,35 C55,35 55,68 55,68" />
//               <path d="M28,68 L58,68" />
//               <path d="M52,68 L56,108" />
//               <path d="M34,68 L30,108" />
//               <path d="M32,88 L54,88" />
//               <path d="M200,35 C185,35 185,68 185,68" />
//               <path d="M182,68 L212,68" strokeWidth="2" />
//               <path d="M188,68 L184,108" />
//               <path d="M206,68 L210,108" />
//               <path d="M186,88 L208,88" />
//             </svg>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }
