import MainLayout from "@/app/components/layouts/MainLayout";
import EspacesPageClient from "./EspacesPageClient";
import { getSpaces, getSpacesHeroSettings } from "@/services/spaceService";

export const metadata = {
  title: "Espaces du Grand Tambour | Centre Culturel et Artistique pour les Pays d'Afrique Centrale",
  description:
    "Découvrez les espaces du Grand Tambour : théâtres, résidence d'artistes, cafétéria, pôle média et bien plus.",
};

export default async function EspacesGrandTambour() {
  const [espaces, hero] = await Promise.all([
    getSpaces(),
    getSpacesHeroSettings(),
  ]);

  return (
    <MainLayout>
      <EspacesPageClient espaces={espaces} hero={hero} />
    </MainLayout>
  );
}
