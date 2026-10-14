import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import MainLayout from "@/app/components/layouts/MainLayout";
import { getArticles, getArticleBySlug } from "@/data/articles";
import { getArticleComments } from "@/services/commentService";
import { getSession } from "@/lib/auth-server";
import { CONTENT_API_BASE_URL } from "@/lib/content-api";
import type { Article } from "@/types/article";
import ShareBar from "./ShareBar";
import CommentSection from "./CommentSection";
import ViewTracker from "@/app/components/ViewTracker";
import ViewCount from "@/app/components/ViewCount";
import BackButton from "@/app/components/BackButton";

interface ArticleDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const articles = await getArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: ArticleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return { title: "Article introuvable - CCAPAC" };
  }

  return {
    title: `${article.title} - CCAPAC`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: article.image ? [article.image] : undefined,
      type: "article",
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: ArticleDetailPageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const [comments, session] = await Promise.all([
    getArticleComments(article.slug),
    getSession(),
  ]);

  const all = await getArticles();
  const related = all
    .filter((item) => item.slug !== article.slug)
    .filter((item) => item.category === article.category)
    .concat(
      all.filter(
        (item) =>
          item.slug !== article.slug && item.category !== article.category
      )
    )
    .slice(0, 3);

  return (
    <MainLayout>
      <article className="min-h-screen bg-background text-foreground">
        <ViewTracker
          sessionKey={`article-viewed:${article.slug}`}
          url={`${CONTENT_API_BASE_URL}/articles/${encodeURIComponent(article.slug)}/view`}
        />

        {/* En-tête */}
        <header className="pt-24 sm:pt-28 md:pt-32 lg:pt-40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
              <Link
                href="/articles"
                className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-foreground shadow-sm ring-1 ring-muted/20 transition hover:text-primary hover:ring-primary/40"
              >
                <ArrowLeft size={14} />
                Tous les articles
              </Link>

              <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-widest">
                {article.category && (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                    {article.category}
                  </span>
                )}
                <span className="text-muted-foreground">
                  {article.dateLabel}
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Clock size={13} />
                  {article.readingTime} min
                </span>
                <ViewCount
                  count={article.viewCount}
                  className="text-muted-foreground"
                />
              </div>

              <h1 className="mt-5 text-3xl font-bold uppercase leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">
                {article.title}
              </h1>

              <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
                {article.excerpt}
              </p>

              {article.author && (
                <p className="mt-5 text-sm italic text-muted-foreground">
                  Par {article.author}
                </p>
              )}

              {/* Partage social */}
              <div className="mt-6 border-t border-muted/20 pt-6">
                <ShareBar title={article.title} />
              </div>
            </div>
          </div>
        </header>

        {/* Image de couverture */}
        <div className="container mx-auto mt-8 px-4 sm:mt-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted/10 shadow-sm ring-1 ring-muted/10 sm:aspect-[16/10]">
              <div className="absolute inset-0 z-10 bg-[url('/motif-lub.png')] bg-cover bg-center opacity-[0.04]" />
              <Image
                src={article.coverImage ?? article.image ?? "/placeholder.svg"}
                alt={article.title}
                fill
                className="object-contain"
                priority
                sizes="(max-width: 1024px) 100vw, 1024px"
                quality={90}
              />
            </div>
          </div>
        </div>

        {/* Corps de l'article (HTML riche) */}
        <div className="container mx-auto mt-10 px-4 sm:mt-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div
              className="article-body text-foreground/90 [&_a]:text-primary [&_a]:underline [&_blockquote]:my-8 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:bg-white [&_blockquote]:px-6 [&_blockquote]:py-5 [&_blockquote]:text-lg [&_blockquote]:font-medium [&_blockquote]:italic [&_blockquote]:shadow-sm [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-primary sm:[&_h2]:text-2xl [&_h3]:mt-8 [&_h3]:border-t [&_h3]:border-muted/20 [&_h3]:pt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:leading-snug [&_h3]:text-primary sm:[&_h3]:text-lg [&_li]:mt-2 [&_p]:mt-5 [&_p]:text-base [&_p]:leading-relaxed sm:[&_p]:text-lg [&_ul]:mt-5 [&_ul]:list-disc [&_ul]:pl-6"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-muted/20 pt-6">
              <BackButton
                fallbackHref="/articles"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-primary"
              >
                <ArrowLeft size={15} />
                Retour
              </BackButton>
              <ShareBar title={article.title} />
            </div>
          </div>
        </div>

        <CommentSection
          slug={article.slug}
          initialComments={comments}
          isLoggedIn={!!session}
        />

        {/* Articles liés */}
        {related.length > 0 && (
          <section className="container mx-auto mt-16 px-4 pb-16 sm:mt-20 sm:px-6 sm:pb-20 lg:px-8">
            <div className="mx-auto max-w-5xl">
              <div className="mb-8 flex items-center gap-3">
                <span className="h-2.5 w-2.5 bg-primary" />
                <h2 className="text-xl font-bold uppercase tracking-tight text-foreground sm:text-2xl">
                  À lire également
                </h2>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <RelatedCard key={item.slug} article={item} />
                ))}
              </div>
            </div>
          </section>
        )}
      </article>
    </MainLayout>
  );
}

function RelatedCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-muted/10 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted/10">
        <Image
          src={article.image || "/placeholder.svg"}
          alt={article.title}
          fill
          className="object-cover transition duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
          {article.category}
        </span>
        <h3 className="mt-2 text-base font-bold uppercase leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary">
          {article.title}
        </h3>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs font-bold uppercase tracking-wide text-foreground transition-colors group-hover:text-primary">
          Lire la suite
          <ArrowRight
            size={14}
            className="transition-transform group-hover:translate-x-1"
          />
        </span>
      </div>
    </Link>
  );
}
