import { getUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { QueryClient, dehydrate } from "@tanstack/react-query";
import { getAdminStats } from "@/services/adminService";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminDashboard() {
  const user = await getUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/espace-membre");
  }

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => getAdminStats(),
  });

  const dehydratedState = dehydrate(queryClient);

  return <AdminDashboardClient dehydratedState={dehydratedState} />;
}
