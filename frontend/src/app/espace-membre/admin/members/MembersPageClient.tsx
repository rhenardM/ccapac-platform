"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { useSearchParams } from "next/navigation";
import { useMembersQuery } from "@/hooks/useAdminDashboardQuery";
import type { MembersStatusFilter } from "@/services/adminService";
import { MembersFilters } from "./MembersFilters";
import { MembersTable } from "./MembersTable";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface MembersPageClientProps {
  initialSearch: string;
  initialStatus: string;
}

export function MembersPageClient({
  initialSearch,
  initialStatus,
}: MembersPageClientProps) {
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? initialSearch ?? "";
  const statusParam =
    (searchParams.get("status") as MembersStatusFilter | null) ??
    (initialStatus as MembersStatusFilter) ??
    "all";

  const { data, isLoading, isError, error } = useMembersQuery({
    search,
    status: statusParam,
  });

  const members =
    data?.members.map((member) => ({
      ...member,
      name: member.name ?? "Membre sans nom",
      createdAt: new Date(member.createdAt),
    })) ?? [];

  const totalMembers = data?.totalMembers ?? 0;

  const stats = [
    {
      title: "Total Membres",
      value: isLoading ? "..." : totalMembers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Gestion des Membres
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez les inscriptions et suivez les activités des membres
        </p>
      </div>

      {isError && (
        <div className="p-4 rounded-lg bg-red-50 text-red-600 text-sm">
          Impossible de charger les membres : {error?.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="border-none shadow-sm bg-white hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <div
                    className={cn("rounded-full p-2", stat.bgColor, stat.color)}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-6">
        <MembersFilters currentSearch={search} currentStatus={statusParam} />

        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b border-gray-50 bg-gray-50/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Liste des membres
              </CardTitle>
              {!isLoading && (
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {members.length} résultats
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Chargement des membres...
                </p>
              </div>
            ) : (
              <MembersTable members={members} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
