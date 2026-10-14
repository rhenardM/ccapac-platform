"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  RefreshCw,
  Search,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RequestStatusBadge from "@/components/space-requests/RequestStatusBadge";
import type { SpaceRequest } from "@/services/spaceRequestService";
import { supervisorService } from "./supervisorService";

const departments: Record<string, string> = {
  MEMBER: "Membre",
  PROGRAMME: "Programmes",
  REGISSEUR_GENERAL: "Régisseur général",
  DIRECTION_ARTISTIQUE: "Direction artistique",
  COMMUNICATION: "Communication",
  COMMUNICATION_REGISSEUR:
    "Communication et Régisseur général",
  JURIDIQUE: "Juridique",
  FINANCE: "Finances",
  ADMIN: "Administration",
};

type RequestFilter =
  | "all"
  | "active"
  | "completed"
  | "stopped";

const stoppedStatuses = [
  "rejected",
  "stopped_by_member",
  "expired",
];

export default function SupervisorDashboardPage() {
  const [requests, setRequests] = useState<
    SpaceRequest[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] =
    useState("");
  const [selectedFilter, setSelectedFilter] =
    useState<RequestFilter>("all");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setRequests(
        await supervisorService.getOverview()
      );
    } catch (error) {
      console.error(error);
      toast.error(
        "Impossible de charger la vue globale."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(
    () => ({
      total: requests.length,
      active: requests.filter(
        (request) =>
          request.status !== "completed" &&
          !stoppedStatuses.includes(
            request.status
          )
      ).length,
      completed: requests.filter(
        (request) => request.status === "completed"
      ).length,
      rejected: requests.filter((request) =>
        stoppedStatuses.includes(request.status)
      ).length,
    }),
    [requests]
  );

  const filteredRequests = useMemo(() => {
    const query = searchQuery
      .trim()
      .toLowerCase();

    return requests
      .filter((request) => {
        if (selectedFilter === "completed") {
          return request.status === "completed";
        }

        if (selectedFilter === "stopped") {
          return stoppedStatuses.includes(
            request.status
          );
        }

        if (selectedFilter === "active") {
          return (
            request.status !== "completed" &&
            !stoppedStatuses.includes(
              request.status
            )
          );
        }

        return true;
      })
      .filter((request) => {
        if (!query) return true;

        const reference = String(
          request.reference || ""
        ).toLowerCase();
        const activity = String(
          request.eventName || request.title || ""
        ).toLowerCase();
        const applicant = String(
          request.user?.username ||
            request.user?.email ||
            ""
        ).toLowerCase();

        return (
          reference.includes(query) ||
          activity.includes(query) ||
          applicant.includes(query)
        );
      });
  }, [requests, searchQuery, selectedFilter]);

  return (
    <div className="space-y-7">
      <section className="rounded-2xl bg-[#D1965B] p-6 text-white shadow-sm sm:p-8">
        <p className="text-sm uppercase tracking-wider text-white/75">
          Supervision générale
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          Vue d’ensemble du processus
        </h1>
        <p className="mt-3 max-w-3xl text-white/85">
          Consultez toutes les demandes, leurs
          documents et le service responsable de
          chaque étape.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            filter: "all" as RequestFilter,
            label: "Total",
            value: stats.total,
            icon: FileText,
            iconStyle: "bg-blue-50 text-blue-700",
            activeStyle:
              "border-blue-400 bg-blue-50/60 ring-blue-100",
          },
          {
            filter: "active" as RequestFilter,
            label: "En traitement",
            value: stats.active,
            icon: Clock3,
            iconStyle: "bg-amber-50 text-amber-700",
            activeStyle:
              "border-amber-400 bg-amber-50/60 ring-amber-100",
          },
          {
            filter: "completed" as RequestFilter,
            label: "Terminées",
            value: stats.completed,
            icon: CheckCircle2,
            iconStyle: "bg-green-50 text-green-700",
            activeStyle:
              "border-green-400 bg-green-50/60 ring-green-100",
          },
          {
            filter: "stopped" as RequestFilter,
            label: "Arrêtées",
            value: stats.rejected,
            icon: ShieldAlert,
            iconStyle: "bg-red-50 text-red-700",
            activeStyle:
              "border-red-400 bg-red-50/60 ring-red-100",
          },
        ].map(({
          filter,
          label,
          value,
          icon: Icon,
          iconStyle,
          activeStyle,
        }) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              setSelectedFilter(filter);
              setSearchQuery("");
            }}
            aria-pressed={selectedFilter === filter}
            className={`rounded-2xl border p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 ${
              selectedFilter === filter
                ? activeStyle
                : "border-[#D1965B]/15 bg-white ring-transparent hover:border-[#D1965B]/35"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#5C4033]/60">
                  {label}
                </p>
                <p className="mt-1 text-3xl font-bold text-[#5C4033]">
                  {value}
                </p>
              </div>
              <div
                className={`rounded-xl p-3 ${iconStyle}`}
              >
                <Icon className="h-7 w-7" />
              </div>
            </div>
            <p className="mt-3 text-xs font-medium text-[#5C4033]/50">
              {selectedFilter === filter
                ? "Filtre actif"
                : "Cliquer pour afficher"}
            </p>
          </button>
        ))}
      </div>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#5C4033]">
            {selectedFilter === "active"
              ? "Demandes en traitement"
              : selectedFilter === "completed"
                ? "Demandes terminées"
                : selectedFilter === "stopped"
                  ? "Demandes arrêtées"
                  : "Toutes les demandes"}
          </h2>
          <p className="text-sm text-[#5C4033]/60">
            Ouvrez une demande pour consulter ses
            informations, ses documents et son
            historique.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void load()}
          className="border-[#D1965B]/40 text-[#5C4033]"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualiser
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-[#D1965B]/15 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C4033]/40" />
          <Input
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(event.target.value)
            }
            placeholder="Référence, activité ou demandeur..."
            className="border-[#D1965B]/25 bg-[#F8F5EF]/50 pl-10 pr-10 text-[#5C4033] focus-visible:ring-[#D1965B]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#5C4033]/50 hover:bg-[#F3EEE5] hover:text-[#5C4033]"
              aria-label="Effacer la recherche"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="shrink-0 text-sm text-[#5C4033]/60">
          {filteredRequests.length} résultat
          {filteredRequests.length > 1 ? "s" : ""}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#D1965B]/15 bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-[#5C4033]/60">
            Chargement...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-[#5C4033]/60">
            Aucune demande.
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <Search className="mx-auto h-10 w-10 text-[#D1965B]/40" />
            <p className="mt-3 font-semibold text-[#5C4033]">
              Aucune demande trouvée
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-[#F8F5EF] text-[#5C4033]">
                <tr>
                  <th className="p-4">Référence</th>
                  <th className="p-4">Activité</th>
                  <th className="p-4">Demandeur</th>
                  <th className="p-4">Département actuel</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1965B]/10">
                {filteredRequests.map((request) => {
                  const department =
                    request.assignedDepartment ||
                    request.currentDepartment;

                  return (
                    <tr
                      key={request.id}
                      className="hover:bg-[#F8F5EF]/60"
                    >
                      <td className="p-4">
                        <Link
                          href={`/espace-membre/superviseur/demandes/${request.id}`}
                          className="font-semibold text-[#D1965B] hover:underline"
                        >
                          {request.reference}
                        </Link>
                      </td>
                      <td className="p-4 font-medium text-[#5C4033]">
                        {request.eventName ||
                          request.title ||
                          "-"}
                      </td>
                      <td className="p-4 text-[#5C4033]/65">
                        {request.user?.username ||
                          request.user?.email ||
                          "-"}
                      </td>
                      <td className="p-4 text-[#5C4033]/65">
                        {departments[department] ||
                          department ||
                          "-"}
                      </td>
                      <td className="p-4">
                        <RequestStatusBadge
                          status={request.status}
                        />
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          asChild
                          size="sm"
                          className="bg-[#D1965B] text-white hover:bg-[#B97D47]"
                        >
                          <Link
                            href={`/espace-membre/superviseur/demandes/${request.id}`}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Consulter
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Button
        asChild
        className="bg-[#D1965B] text-white hover:bg-[#B97D47]"
      >
        <Link href="/espace-membre/superviseur/utilisateurs">
          <Users className="mr-2 h-4 w-4" />
          Gérer les rôles utilisateurs
        </Link>
      </Button>
    </div>
  );
}