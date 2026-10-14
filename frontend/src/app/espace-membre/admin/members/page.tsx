import { getUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { MembersPageClient } from "./MembersPageClient";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
  }>;
}

export default async function MembersPage({ searchParams }: PageProps) {
  const user = await getUser();

  // Rediriger les non-admins
  if (!user || user.role !== "ADMIN") {
    redirect("/espace-membre");
  }

  const params = await searchParams;
  const searchTerm = params.search || "";
  const filterStatus = params.status || "all";

  return (
    <MembersPageClient
      initialSearch={searchTerm}
      initialStatus={filterStatus}
    />
  );
}
