import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, HandCoins, HeartHandshake, ShieldCheck } from "lucide-react";
import MainLayout from "../components/layouts/MainLayout";
import DonationExperience from "../components/don/DonationExperience";

export const metadata: Metadata = {
  title: "Faire un don — Centre Culturel et Artistique (CCAPAC)",
  description:
    "Soutenez la Biblio-Librairie du Grand Tambour. Faites un don en ligne par Mobile Money, carte bancaire ou virement, en quelques étapes sécurisées.",
};

export default function FaireUnDonPage() {
  return (
    <MainLayout>
      <main className="min-h-[calc(100vh-96px)]">
        {/* Section Hero */}
        <section className="relative flex h-[60vh] min-h-[460px] items-center justify-center sm:h-[68vh] sm:min-h-[540px] lg:min-h-[600px]">
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/hero-section.png"
              alt="Espace de lecture de la Biblio-Librairie du Grand Tambour"
              fill
              priority
              quality={90}
              className="object-cover object-center"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#25150e]/85 via-[#25150e]/70 to-[#25150e]/85" />
          </div>

          <div className="relative z-10 mx-auto mt-24 max-w-4xl px-4 text-center text-white sm:mt-28 sm:px-6 lg:px-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/12 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] backdrop-blur-md">
              <HandCoins className="h-4 w-4 text-[#ffcc02]" />
              Collecte Grand Tambour
            </div>

            <h1 className="text-3xl font-bold uppercase leading-[1.08] tracking-tight sm:text-4xl lg:text-5xl">
              Faites vivre la Biblio-Librairie
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm font-medium leading-relaxed text-white/82 sm:text-lg">
              Votre don soutient un espace de lecture, de transmission et de
              rencontre au service de la jeunesse d&apos;Afrique centrale.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="#faire-un-don"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#ffcc02] px-6 py-3 text-xs font-bold uppercase tracking-wide text-[#3a2014] transition hover:bg-white"
              >
                Faire un don
                <ArrowRight className="h-4 w-4" />
              </Link>
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/72">
                <ShieldCheck className="h-4 w-4 text-[#ffcc02]" />
                Paiement sécurisé
              </span>
            </div>

            <p className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-white/65">
              <HeartHandshake className="h-4 w-4 text-[#ffcc02]" />
              Mobile Money · Carte bancaire · Virement
            </p>
          </div>
        </section>

        <DonationExperience />
      </main>
    </MainLayout>
  );
}
