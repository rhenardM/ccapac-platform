import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, FileText } from "lucide-react";
import MainLayout from "@/app/components/layouts/MainLayout";
import { getActualiteBySlug } from "@/services/actualiteService";
import ActualiteBlockRenderer from "./components/ActualiteBlockRenderer";
import BackButton from "@/app/components/BackButton";

const typeLabels = {
  NEWSLETTER: "Newsletter",
  COMMUNIQUE: "Communique",
  POINT_PRESSE: "Point de presse",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const actualite = await getActualiteBySlug(slug);

  return {
    title: actualite ? `${actualite.title} - CCAPAC` : "Actualite - CCAPAC",
    description: actualite?.summary,
  };
}

export default async function ActualiteDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const actualite = await getActualiteBySlug(slug);

  if (!actualite || actualite.type === "NEWSLETTER") {
    notFound();
  }

  return (
    <MainLayout>
      <article className="min-h-screen bg-background text-foreground">
        <section className="relative mt-16 flex min-h-[360px] items-center overflow-hidden sm:mt-20 lg:mt-24">
          <div className="absolute inset-0 z-10 bg-black/65" />
          <Image
            src={actualite.coverImage || "/motif-luba.png"}
            alt={actualite.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="container relative z-20 mx-auto px-4 py-16 sm:px-6 md:py-20 lg:px-8">
            <BackButton
              fallbackHref="/actualites"
              className="mb-6 flex w-fit items-center gap-2 text-xs font-medium uppercase tracking-widest text-white/80 transition-colors hover:text-white sm:text-sm"
            >
              <ArrowLeft size={14} />
              Retour
            </BackButton>
            <span className="inline-block rounded-full bg-primary px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">
              {typeLabels[actualite.type]}
            </span>
            <h1 className="mt-6 max-w-5xl text-3xl font-bold uppercase leading-tight tracking-tight text-white drop-shadow-2xl sm:text-4xl md:text-5xl">
              {actualite.title}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-widest text-white/85">
              <span className="inline-flex items-center gap-2">
                <Calendar size={13} />
                {actualite.mois && actualite.annee
                  ? `${actualite.mois} ${actualite.annee}`
                  : actualite.datePublication || "Date a venir"}
              </span>
            </div>
          </div>
        </section>

        <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
          {actualite.summary && (
            <p className="mb-10 border-l-4 border-primary pl-6 text-lg font-medium leading-relaxed text-muted-foreground sm:text-xl">
              {actualite.summary}
            </p>
          )}

          <div className="space-y-10">
            {actualite.blocks?.length ? (
              actualite.blocks.map((block) => (
                <ActualiteBlockRenderer
                  key={`${block.__component}-${block.id}`}
                  block={block}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-muted/30 bg-white p-10 text-center shadow-sm">
                <FileText className="mx-auto mb-4 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">
                  Le contenu détaillé sera bientôt disponible.
                </p>
              </div>
            )}
          </div>
        </div>
      </article>
    </MainLayout>
  );
}
