import type { Metadata } from "next";
import MainLayout from "../components/layouts/MainLayout";
import ArticlesPageClient from "./ArticlesPageClient";
import { getArticles, getArticleCategories } from "@/data/articles";

export const metadata: Metadata = {
  title: "Presse du Grand Tambour - CCAPAC",
  description:
    "Reportages, analyses et récits du Centre Culturel et Artistique pour les Pays d'Afrique Centrale : expositions, patrimoine, culture et publications.",
};

export default async function ArticlesPage() {
  const [articles, categories] = await Promise.all([
    getArticles(),
    getArticleCategories(),
  ]);

  return (
    <MainLayout>
      <ArticlesPageClient articles={articles} categories={categories} />
    </MainLayout>
  );
}
