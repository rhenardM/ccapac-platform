import { getUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { EventsPageClient } from "./EventsPageClient";

export default async function AdminEventsPage() {
  const user = await getUser();

  // Rediriger les non-admins
  if (!user || user.role !== "ADMIN") {
    redirect("/espace-membre");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <EventsPageClient />
    </div>
  );
}
