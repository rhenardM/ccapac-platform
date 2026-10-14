"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, FileText, Newspaper, TrendingUp } from "lucide-react";
import type { Article } from "@/types/article";
import ViewCount from "@/app/components/ViewCount";

interface ArticlesPageClientProps {
  articles: Article[];
  categories: string[];
}

const ALL = "Toutes les actualités";

export default function ArticlesPageClient({
  articles,
  categories,
}: ArticlesPageClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>(ALL);

  const filters = useMemo(() => [ALL, ...categories], [categories]);

  const featured = useMemo(
    () => articles.find((article) => article.featured) ?? articles[0],
    [articles]
  );

  const gridArticles = useMemo(() => {
    const rest = articles.filter((article) => article !== featured);
    const filtered =
      activeCategory === ALL
        ? rest
        : rest.filter((article) => article.category === activeCategory);
    return [...filtered].sort((a, b) => b.date.localeCompare(a.date));
  }, [articles, featured, activeCategory]);

  const showFeatured =
    activeCategory === ALL || featured?.category === activeCategory;

  const mostViewed = useMemo(
    () =>
      [...articles]
        .filter((article) => article.viewCount > 0)
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, 5),
    [articles]
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative mt-16 flex min-h-[280px] items-center justify-center overflow-hidden py-16 sm:mt-20 sm:py-20 lg:mt-24 lg:py-24">
        <div className="absolute inset-0 bg-[url('/motif-lub.png')] bg-cover bg-center opacity-[0.04]" />
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="mb-5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            <span className="h-2.5 w-2.5 bg-primary" />
            Le fil de l&apos;actualité
          </div>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Presse du Grand Tambour
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
            Découvrez les reportages, analyses et récits du Centre Culturel et
            Artistique pour les Pays d&apos;Afrique Centrale : expositions,
            patrimoine, culture et publications.
          </p>
        </div>
      </section>

      <main className="pb-16 sm:pb-20 md:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {/* Article à la une */}
            {showFeatured && featured && <FeaturedArticle article={featured} />}

            {/* Articles les plus lus */}
            {mostViewed.length > 0 && <MostViewedPanel articles={mostViewed} />}

            {/* Filtres par rubrique */}
            <div className="mt-12 flex flex-wrap gap-2 sm:mt-16">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveCategory(filter)}
                  className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                    activeCategory === filter
                      ? "bg-foreground text-white shadow-sm"
                      : "bg-white text-muted-foreground ring-1 ring-muted/20 hover:text-primary hover:ring-primary/40"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Grille d'articles */}
            <section className="mt-8 sm:mt-10">
              {gridArticles.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {gridArticles.map((article) => (
                    <ArticleCard key={article.slug} article={article} />
                  ))}
                </div>
              ) : (
                // On n'affiche l'état vide que si aucun article (ni « à la une »)
                // n'est visible pour la rubrique sélectionnée.
                !showFeatured && (
                  <div className="rounded-2xl border border-dashed border-muted/30 bg-white p-12 text-center shadow-sm">
                    <FileText className="mx-auto mb-5 h-12 w-12 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Aucun article dans cette rubrique pour le moment.
                    </p>
                  </div>
                )
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function FeaturedArticle({ article }: { article: Article }) {
  return (
    <section className="grid items-center gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
      <Link
        href={`/articles/${article.slug}`}
        className="group relative block aspect-[21/12] overflow-hidden rounded-2xl bg-muted/10 shadow-sm ring-1 ring-muted/10"
      >
        <Image
          src={article.image}
          alt={article.title}
          fill
          className="object-cover transition duration-700 group-hover:scale-105"
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
        />
      </Link>

      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
            <Newspaper size={12} />À la une
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {article.dateLabel}
          </span>
        </div>

        <h2 className="text-2xl font-bold uppercase leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl">
          {article.title}
        </h2>

        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {article.excerpt}
        </p>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="italic">Par {article.author}</span>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={13} />
            {article.readingTime} min de lecture
          </span>
          {article.viewCount > 0 && <ViewCount count={article.viewCount} />}
        </div>

        <Link
          href={`/articles/${article.slug}`}
          className="group mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-primary"
        >
          Découvrir le reportage
          <ArrowRight
            size={15}
            className="transition-transform group-hover:translate-x-1"
          />
        </Link>
      </div>
    </section>
  );
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-muted/10 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted/10">
        <Image
          src={article.image}
          alt={article.title}
          fill
          className="object-cover transition duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2.5 text-[10px] font-bold uppercase tracking-widest">
          <span className="text-primary">{article.category}</span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
          <span className="text-muted-foreground">{article.dateLabel}</span>
        </div>

        <h3 className="mt-3 text-lg font-bold uppercase leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary">
          {article.title}
        </h3>

        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {article.excerpt}
        </p>

        <div className="mt-auto flex items-center justify-between border-t border-muted/20 pt-4">
          <span className="text-xs italic text-muted-foreground">
            Par {article.author}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-foreground transition-colors group-hover:text-primary">
            Lire la suite
            <ArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-1"
            />
          </span>
        </div>
        {article.viewCount > 0 && (
          <ViewCount
            count={article.viewCount}
            className="mt-2 text-[11px] text-muted-foreground"
            iconSize={12}
          />
        )}
      </div>
    </Link>
  );
}

function MostViewedPanel({ articles }: { articles: Article[] }) {
  return (
    <section className="mt-12 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-muted/10 sm:mt-16 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <TrendingUp size={18} className="text-primary" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">
          Les plus lus
        </h2>
      </div>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {articles.map((article, index) => (
          <li key={article.slug}>
            <Link
              href={`/articles/${article.slug}`}
              className="group flex h-full flex-col gap-2"
            >
              <span className="text-2xl font-bold text-muted-foreground/30 transition-colors group-hover:text-primary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-sm font-bold uppercase leading-tight tracking-tight text-foreground line-clamp-2 transition-colors group-hover:text-primary">
                {article.title}
              </span>
              <ViewCount
                count={article.viewCount}
                className="mt-auto text-[11px] text-muted-foreground"
                iconSize={12}
              />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
