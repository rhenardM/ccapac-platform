"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clapperboard,
  Drama,
  FileText,
  Lightbulb,
  Megaphone,
  Music2,
  Palette,
  Settings,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const FORM_URL =
  "/espace-membre/membre/proposer-projet/formulaire";

const projectHighlights = [
  {
    title: "Création et spectacle vivant",
    description:
      "Théâtre, danse, performance et créations scéniques conçus pour rapprocher les artistes et les publics.",
    category: "Scène",
    icon: Drama,
    className: "bg-[#D1965B] text-white",
    badgeClassName: "bg-white/15 text-white",
  },
  {
    title: "Musique et nouvelles voix",
    description:
      "Concerts, scènes ouvertes, rencontres musicales et initiatives qui accompagnent l’émergence des talents.",
    category: "Musique",
    icon: Music2,
    className: "bg-[#402C22] text-white",
    badgeClassName: "bg-white/15 text-white",
  },
  {
    title: "Cinéma et création audiovisuelle",
    description:
      "Projections, échanges et projets audiovisuels qui valorisent les récits, les auteurs et les images d’ici.",
    category: "Audiovisuel",
    icon: Clapperboard,
    className: "bg-[#EEE4DA] text-[#402C22]",
    badgeClassName: "bg-white/70 text-[#5C4033]",
  },
  {
    title: "Patrimoine, livre et transmission",
    description:
      "Initiatives autour de la mémoire, du livre, des savoirs et de la transmission culturelle entre générations.",
    category: "Transmission",
    icon: BookOpenText,
    className: "bg-[#F3D6B8] text-[#402C22]",
    badgeClassName: "bg-white/55 text-[#5C4033]",
  },
];

const culturalDomains = [
  "Musique",
  "Danse",
  "Théâtre",
  "Spectacle vivant",
  "Arts visuels",
  "Cinéma et audiovisuel",
  "Littérature",
  "Création numérique",
  "Patrimoine",
  "Projets interdisciplinaires",
];

const visionValues = [
  "Promotion de la création artistique et culturelle",
  "Valorisation des artistes et des talents",
  "Diversité des expressions culturelles",
  "Innovation et créativité",
  "Partage et transmission",
  "Collaboration entre acteurs culturels",
  "Ouverture aux échanges et aux coopérations",
  "Offre culturelle accessible et diversifiée",
];

const supportAreas = [
  {
    title: "Infrastructures",
    description:
      "Des espaces adaptés à la création, aux répétitions, aux ateliers, aux rencontres, aux expositions et aux spectacles.",
    icon: Building2,
  },
  {
    title: "Expertise culturelle",
    description:
      "Un accompagnement professionnel pour structurer le projet et renforcer sa qualité artistique.",
    icon: Palette,
  },
  {
    title: "Communication et marketing",
    description:
      "Un appui à la visibilité, à la promotion et à la valorisation du projet et de ses porteurs.",
    icon: Megaphone,
  },
  {
    title: "Support technique",
    description:
      "Un accompagnement technique adapté aux besoins des productions et des manifestations.",
    icon: Settings,
  },
  {
    title: "Régie professionnelle",
    description:
      "Un encadrement et une coordination des besoins techniques liés aux activités accueillies.",
    icon: CalendarDays,
  },
];

const requiredDocuments = [
  "Présentation générale du projet",
  "Note d’intention",
  "Objectifs du projet",
  "Activités envisagées",
  "Public cible",
  "Calendrier prévisionnel",
  "Budget prévisionnel",
  "Besoins techniques et logistiques",
  "Présentation du porteur ou de la structure",
  "Références ou réalisations antérieures, le cas échéant",
];

const selectionCriteria = [
  "Qualité et originalité de la proposition",
  "Pertinence culturelle et artistique",
  "Potentiel de développement",
  "Impact auprès des publics",
  "Faisabilité technique et financière",
  "Capacité du porteur à réaliser le projet",
  "Possibilités de collaboration et de partenariat",
];

const steps = [
  {
    number: "01",
    title: "Préparez votre dossier",
    description:
      "Rassemblez la présentation du projet, la note d’intention, les objectifs, les activités, le public cible et le calendrier.",
  },
  {
    number: "02",
    title: "Soumettez votre proposition",
    description:
      "Complétez le formulaire et joignez vos références ou vos réalisations antérieures lorsqu’elles sont disponibles.",
  },
  {
    number: "03",
    title: "Examen par le Centre",
    description:
      "Le CCAPAC étudie la qualité artistique, la pertinence, l’impact et la faisabilité de votre projet.",
  },
  {
    number: "04",
    title: "Décision et accompagnement",
    description:
      "Si le projet est retenu, le Centre vous contacte pour définir les modalités de réalisation et d’accompagnement.",
  },
];

export default function ProposerProjetIntroductionPage() {
  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-10 pb-14">
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#33231C] text-white shadow-[0_28px_90px_rgba(64,44,34,0.24)]">
        <div className="grid min-h-[620px] lg:grid-cols-[0.92fr_1.08fr]">
          <div className="relative z-20 flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#F0C79F] backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Appel à projets culturels
            </div>

            <h1 className="mt-7 max-w-2xl text-4xl font-black leading-[1.05] tracking-[-0.03em] sm:text-5xl xl:text-6xl">
              Votre idée mérite
              <span className="mt-1 block text-[#E8B77F]">
                une scène pour grandir.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-sm leading-7 text-white/75 sm:text-base">
              Le CCAPAC Grand Tambour invite les artistes,
              créateurs, compagnies, collectifs, associations et
              opérateurs culturels à proposer des projets capables
              d’enrichir sa programmation et de rencontrer les
              publics.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
  <Button
    asChild
    className="h-12 rounded-xl bg-[#D1965B] px-6 font-bold text-white hover:bg-[#B97D47]"
  >
    <Link href={FORM_URL}>
      Remplir le formulaire
      <ArrowRight className="ml-2 h-4 w-4" />
    </Link>
  </Button>

  <Button
    asChild
    variant="outline"
    className="h-12 rounded-xl border-white/25 bg-white/10 px-6 font-bold text-white backdrop-blur transition hover:border-white/40 hover:bg-white/20 hover:text-white"
  >
    <Link href="/espace-membre/membre/proposer-projet/propositions">
      <FileText className="mr-2 h-4 w-4" />
      Suivre mes propositions
    </Link>
  </Button>
</div>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3 border-t border-white/10 pt-6">
              {[
                ["Créer", "Donner forme"],
                ["Accompagner", "Faire grandir"],
                ["Rayonner", "Rencontrer"],
              ].map(([title, description]) => (
                <div key={title}>
                  <p className="font-black text-[#E8B77F]">
                    {title}
                  </p>
                  <p className="mt-1 text-xs text-white/50">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[430px] overflow-hidden lg:min-h-full">
            <Image
              src="/images/appel-projets/appel-projets-hero.jpg"
              alt="Rencontre culturelle organisée au CCAPAC Grand Tambour"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#33231C] via-[#33231C]/15 to-transparent lg:from-[#33231C]/85" />
            <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/15 bg-black/30 p-4 backdrop-blur-md sm:inset-x-auto sm:bottom-7 sm:right-7 sm:max-w-xs">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F0C79F]">
                Grand Tambour
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-white">
                Un cadre de dialogue, de création et de coopération
                au service des cultures d’Afrique centrale.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid overflow-hidden rounded-[2rem] border border-[#D1965B]/15 bg-white shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative min-h-[360px] lg:min-h-full">
          <Image
            src="/images/appel-projets/appel-projets-dialogue.jpg"
            alt="Prise de parole lors d’une rencontre au Grand Tambour"
            fill
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#402C22]/80 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F0C79F]">
              Une mission culturelle
            </p>
            <p className="mt-2 max-w-md text-xl font-black leading-snug">
              Mettre les idées en dialogue avec les ressources, les
              professionnels et les publics.
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-9 lg:p-12">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D1965B]">
            Contexte et justification
          </p>
          <h2 className="mt-3 max-w-2xl text-2xl font-black leading-tight text-[#402C22] sm:text-3xl">
            Un environnement professionnel pour développer et faire
            rayonner la création
          </h2>
          <div className="mt-6 space-y-4 text-sm leading-7 text-[#5C4033]/70 sm:text-base">
            <p>
              Dans le cadre de sa mission de promotion et de
              valorisation de la culture et des expressions
              artistiques, le CCAPAC Grand Tambour renforce son
              soutien aux artistes, créateurs et acteurs du secteur.
            </p>
            <p>
              Le Centre met à leur disposition ses infrastructures,
              son expertise et ses ressources professionnelles afin
              de favoriser la création, la production, la diffusion
              et la rencontre avec les publics.
            </p>
            <p>
              Les projets retenus pourront bénéficier d’un cadre
              favorable à leur réalisation, à leur diffusion et à
              leur rayonnement.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              [Lightbulb, "Créer", "Faire émerger les idées"],
              [Users, "Relier", "Rassembler les acteurs"],
              [Target, "Déployer", "Concrétiser les projets"],
            ].map(([Icon, title, description]) => {
              const ItemIcon = Icon as typeof Lightbulb;
              return (
                <div
                  key={String(title)}
                  className="rounded-2xl bg-[#FCF8F4] p-4"
                >
                  <ItemIcon className="h-5 w-5 text-[#D1965B]" />
                  <p className="mt-3 font-bold text-[#402C22]">
                    {String(title)}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#5C4033]/55">
                    {String(description)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] bg-[#F4ECE4] p-6 sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B66F38]">
            Doctrine, charte, vision et valeurs
          </p>
          <h2 className="mt-3 text-2xl font-black text-[#402C22] sm:text-3xl">
            La culture et les artistes au cœur du projet
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#5C4033]/70 sm:text-base">
            Chaque proposition doit s’inscrire dans la vision du
            CCAPAC Grand Tambour et contribuer à une offre culturelle
            accessible, ambitieuse et ouverte sur la coopération.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {visionValues.map((value) => (
              <div
                key={value}
                className="flex items-start gap-3 rounded-2xl bg-white/75 p-4"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D1965B]" />
                <span className="text-sm font-semibold leading-6 text-[#5C4033]">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[480px] overflow-hidden rounded-[2rem]">
          <Image
            src="/images/appel-projets/appel-projets-vision.jpg"
            alt="Échange autour de l’art et de la culture"
            fill
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2B1E18]/90 via-[#2B1E18]/15 to-transparent" />
          <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/10 bg-black/20 p-5 text-white backdrop-blur-sm">
            <Palette className="h-7 w-7 text-[#E8B77F]" />
            <p className="mt-4 text-xl font-black">
              Des projets ancrés dans leur territoire et ouverts au
              monde.
            </p>
          </div>
        </div>
      </section>

      <section id="domaines" className="scroll-mt-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D1965B]">
              Venez avec vos projets
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#402C22] sm:text-3xl">
              Des expressions artistiques sous différentes formes
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#5C4033]/60">
            Les propositions interdisciplinaires, collaboratives et
            innovantes sont particulièrement encouragées.
          </p>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {projectHighlights.map((project) => {
            const Icon = project.icon;
            return (
              <article
                key={project.title}
                className={`group relative min-h-64 overflow-hidden rounded-[1.8rem] p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-7 ${project.className}`}
              >
                <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full border border-current opacity-10 transition duration-500 group-hover:scale-125" />
                <div className="relative flex h-full flex-col">
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${project.badgeClassName}`}
                    >
                      {project.category}
                    </span>
                    <div className="rounded-xl bg-white/10 p-2.5">
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-auto pt-12">
                    <h3 className="text-xl font-black sm:text-2xl">
                      {project.title}
                    </h3>
                    <p className="mt-3 max-w-xl text-sm leading-6 opacity-70">
                      {project.description}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap gap-2 rounded-2xl border border-[#E8DED5] bg-white p-5 shadow-sm">
          {culturalDomains.map((domain) => (
            <span
              key={domain}
              className="rounded-full bg-[#F8F2EC] px-3.5 py-2 text-xs font-bold text-[#5C4033]"
            >
              {domain}
            </span>
          ))}
        </div>
      </section>

      <section>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D1965B]">
          Ce que le CCAPAC met à disposition
        </p>
        <h2 className="mt-2 text-2xl font-black text-[#402C22] sm:text-3xl">
          Un accompagnement ajusté à la nature du projet
        </h2>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {supportAreas.map(({ title, description, icon: Icon }) => (
            <article
              key={title}
              className="group rounded-2xl border border-[#E8DED5] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#D1965B]/40 hover:shadow-lg"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5E8DC] text-[#B66F38] transition group-hover:bg-[#D1965B] group-hover:text-white">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-bold text-[#402C22]">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#5C4033]/65">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-[#D1965B]/15 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#F5E8DC] p-3 text-[#B66F38]">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#D1965B]">
                Comment soumettre un projet
              </p>
              <h2 className="text-2xl font-black text-[#402C22]">
                Contenu du dossier
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {requiredDocuments.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-xl bg-[#FCFAF8] p-3.5"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D1965B]" />
                <span className="text-sm font-semibold leading-5 text-[#5C4033]">
                  {item}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm leading-6 text-[#5C4033]/60">
            Des documents complémentaires peuvent être demandés
            selon la nature du projet.
          </p>
        </div>

        <div className="rounded-[2rem] bg-[#402C22] p-6 text-white sm:p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/10 p-3 text-[#E8B77F]">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#E8B77F]">
                Examen et sélection
              </p>
              <h2 className="text-2xl font-black">
                Critères d’examen
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {selectionCriteria.map((item, index) => (
              <div
                key={item}
                className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.06] p-3.5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#D1965B] text-xs font-black">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-semibold text-white/80">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[#D1965B]/15 bg-white p-6 shadow-sm sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D1965B]">
          Votre parcours
        </p>
        <h2 className="mt-2 text-2xl font-black text-[#402C22] sm:text-3xl">
          Quatre étapes, de l’idée à la réalisation
        </h2>

        <div className="relative mt-8 grid gap-4 lg:grid-cols-4">
          <div className="absolute left-[12.5%] right-[12.5%] top-6 hidden h-px bg-[#D1965B]/25 lg:block" />
          {steps.map((step) => (
            <article
              key={step.number}
              className="relative rounded-2xl bg-[#FCFAF8] p-5"
            >
              <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl bg-[#402C22] text-xs font-black text-white shadow-[0_0_0_7px_white]">
                {step.number}
              </span>
              <h3 className="mt-5 font-bold text-[#402C22]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#5C4033]/65">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid overflow-hidden rounded-[2rem] bg-[#FFF8F1] lg:grid-cols-[0.68fr_1.32fr]">
        <div className="relative min-h-[420px]">
          <Image
            src="/images/appel-projets/appel-projets-calendrier.jpg"
            alt="Participant prenant la parole pendant une rencontre culturelle"
            fill
            sizes="(max-width: 1024px) 100vw, 35vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#402C22]/70 via-transparent to-transparent" />
        </div>

        <div className="flex items-center p-6 sm:p-10 lg:p-12">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#B66F38] shadow-sm">
              <CalendarDays className="h-6 w-6" />
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-[#D1965B]">
              Calendrier et délai de réponse
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#402C22] sm:text-3xl">
              Un processus clair et un suivi structuré
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-[#D1965B]">
                  Date de lancement
                </p>
                <p className="mt-2 font-bold text-[#402C22]">
                  À communiquer par le CCAPAC
                </p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-[#D1965B]">
                  Date limite de dépôt
                </p>
                <p className="mt-2 font-bold text-[#402C22]">
                  À communiquer par le CCAPAC
                </p>
              </div>
            </div>

            <p className="mt-6 text-sm leading-7 text-[#5C4033]/70">
              Les porteurs recevront une réponse dans un délai
              maximal de 45 jours après la clôture de l’appel à
              projets. Les projets retenus feront ensuite l’objet
              d’un échange avec les équipes du Centre pour préciser
              les modalités de réalisation.
            </p>
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#D1965B] px-6 py-10 text-white sm:px-10 sm:py-12">
        <div className="absolute -right-20 -top-24 -z-10 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-24 left-1/3 -z-10 h-52 w-52 rounded-full bg-[#402C22]/15" />
        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">
              Créer • Accompagner • Valoriser • Rayonner
            </p>
            <h2 className="mt-3 text-2xl font-black sm:text-4xl">
              Votre projet peut commencer ici.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
              Préparez votre dossier, présentez votre vision et
              transmettez votre proposition à la Direction des
              Partenariats et du Marketing du CCAPAC Grand Tambour.
            </p>
          </div>

          <Button
            asChild
            className="h-12 shrink-0 rounded-xl bg-white px-7 font-bold text-[#5C4033] hover:bg-[#F6EEE7]"
          >
            <Link href={FORM_URL}>
              Remplir le formulaire
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
