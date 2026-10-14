"use client";

import type React from "react";
import Image from "next/image";
import Link from "next/link";
// import { ArrowLeft } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-background">
      <div className="relative flex flex-col justify-center px-6 sm:px-12 lg:px-20 xl:px-32 py-12 bg-white dark:bg-zinc-950">
        {/* <div className="absolute top-6 left-6 sm:top-12 sm:left-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Retour à l&apos;accueil
          </Link>
        </div> */}

        <div className="w-full max-w-[400px] mx-auto lg:max-w-[440px]">
          <div className="mb-12 text-center">
            <Link href="/">
              <Image
                src="/images/logo-primary.png"
                alt="Logo CCAPAC"
                width={140}
                height={100}
                className="mx-auto h-12 w-auto object-contain"
                priority
              />
            </Link>
          </div>

          {children}
        </div>
      </div>

      <div className="hidden lg:flex flex-col relative bg-muted text-white">
        <div className="absolute inset-0 bg-zinc-900/40 z-10" />
        <Image
          src="/images/grand-tambour-fond.jpg"
          alt="Grand Tambour CCAPAC"
          fill
          className="object-cover"
          priority
          quality={90}
        />

        <div className="relative z-20 flex flex-col items-center justify-center h-full px-12 text-center">
          <div className="space-y-6 max-w-xl backdrop-blur-sm bg-black/10 p-8 rounded-2xl border border-white/10">
            <h2 className="text-3xl xl:text-4xl font-bold tracking-tight text-white drop-shadow-md">
              Centre Culturel et Artistique pour les Pays d&apos;Afrique Centrale
            </h2>
            <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
            <p className="text-lg text-white/90 leading-relaxed font-light">
              &quot;Promouvoir, valoriser et transmettre le patrimoine culturel
              africain.&quot;
            </p>
          </div>
        </div>

        <div className="absolute bottom-8 w-full text-center z-20 text-xs text-white/50">
          © {new Date().getFullYear()} CCAPAC - Tous droits réservés
        </div>
      </div>
    </div>
  );
}
