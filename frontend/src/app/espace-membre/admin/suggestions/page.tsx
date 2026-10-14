import { getUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { SuggestionsPageClient } from "./SuggestionsPageClient";

export default async function AdminSuggestionsPage() {
  const user = await getUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/espace-membre");
  }

  return <SuggestionsPageClient />;
}
