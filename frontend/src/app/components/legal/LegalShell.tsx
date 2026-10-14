import type { ReactNode } from "react";
import Image from "next/image";
import { ScrollText } from "lucide-react";
import MainLayout from "../layouts/MainLayout";

/**
 * Gabarit commun aux pages légales (mentions légales, confidentialité).
 * Reprend la charte du site : hero avec image, fond crème, carte blanche.
 */
export function LegalShell({
  eyebrow,
  title,
  updated,
  intro,
  image = "/images/grand-tambour2.jpg",
  imageAlt = "Centre Culturel et Artistique — Grand Tambour",
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  intro?: string;
  image?: string;
  imageAlt?: string;
  children: ReactNode;
}) {
  return (
    <MainLayout>
      <header className="relative flex min-h-[50vh] items-end overflow-hidden pt-40 pb-14 text-white sm:min-h-[56vh] sm:pt-48 sm:pb-16">
        <div className="absolute inset-0 z-0">
          <Image
            src={image}
            alt={imageAlt}
            fill
            priority
            quality={90}
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#25150e]/88 via-[#25150e]/72 to-[#25150e]/90" />
        </div>
        <div className="pointer-events-none absolute -right-16 -top-10 z-0 h-56 w-56 rounded-full bg-[#ffcc02]/15 blur-3xl" />

        <div className="relative z-10 mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/12 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] backdrop-blur-md">
            <ScrollText className="h-4 w-4 text-[#ffcc02]" />
            {eyebrow}
          </div>
          <h1 className="text-3xl font-bold uppercase leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          {intro && (
            <p className="mt-4 max-w-2xl text-sm font-medium leading-relaxed text-white/82 sm:text-base">
              {intro}
            </p>
          )}
          <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-white/60">
            Dernière mise à jour : {updated}
          </p>
        </div>
      </header>

      <main className="bg-[#f4efe4] py-14 text-primary sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <article className="space-y-9 rounded-2xl border border-[#e3d2b8] bg-white p-6 shadow-sm sm:p-9 lg:p-10">
            {children}
          </article>
        </div>
      </main>
    </MainLayout>
  );
}

export function LegalSection({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="flex items-baseline gap-2 text-lg font-bold uppercase tracking-wide text-primary">
        <span className="text-sm font-bold text-secondary">
          {String(index).padStart(2, "0")}
        </span>
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-primary/75">
        {children}
      </div>
    </section>
  );
}
