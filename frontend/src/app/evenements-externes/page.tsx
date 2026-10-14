import MainLayout from "@/app/components/layouts/MainLayout";
import ExternalEventsHero from "@/app/components/evenements-externes/ExternalEventsHero";
import ExternalEventsTabs from "@/app/components/evenements-externes/ExternalEventsTabs";
import FeaturedExternalEvent from "@/app/components/evenements-externes/FeaturedExternalEvent";
import UpcomingExternalEvents from "@/app/components/evenements-externes/UpcomingExternalEvents";
import PastExternalEvents from "@/app/components/evenements-externes/PastExternalEvents";
// import EventsNewsletterBand from "@/app/components/evenements-externes/EventsNewsletterBand";
import { getExternalProgrammes, isProgrammePast } from "@/lib/programmes-data";

export const metadata = {
  title:
    "Événements externes | Centre Culturel et Artistique pour les Pays d'Afrique Centrale",
  description:
    "Concerts, expositions, ateliers et spectacles portés par nos partenaires au Centre Culturel : découvrez et réservez vos places.",
};

export default async function EvenementsExternesPage() {
  const programmes = await getExternalProgrammes();

  const featuredEvents = programmes
    .filter((p) => p.featured && !isProgrammePast(p))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const upcomingEvents = programmes
    .filter((p) => !p.featured && !isProgrammePast(p))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const pastEvents = programmes
    .filter((p) => isProgrammePast(p))
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <MainLayout>
      <div className="mt-16 sm:mt-[4.5rem] lg:mt-20">
        <ExternalEventsHero backgroundImage={featuredEvents[0]?.image} />
        <ExternalEventsTabs />
        <FeaturedExternalEvent events={featuredEvents} />
        <UpcomingExternalEvents events={upcomingEvents} />
        <PastExternalEvents events={pastEvents} />
        {/* <EventsNewsletterBand /> */}
      </div>
    </MainLayout>
  );
}
