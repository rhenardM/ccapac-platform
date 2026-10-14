import { getUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { FundraisingPageClient } from "./FundraisingPageClient";

export default async function AdminFundraisingPage() {
  const user = await getUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/espace-membre");
  }

  return <FundraisingPageClient />;
}
