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
  ClipboardList,
  Gavel,
  RefreshCw,
  Search,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  spaceRequestService,
  type DepartmentAssistant,
  type SpaceRequest,
} from "@/services/spaceRequestService";

const SUPERVISOR_ROLES = [
  "ADMIN",
  "JURIDIQUE",
  "JURIDIQUE_SUPERVISEUR",
];

const statusLabels: Record<string, string> = {
  legal_review:
    "Examen par le Service juridique",
  program_review_after_legal:
    "Retournée au Programme",
  completed: "Terminée",
  rejected: "Rejetée",
};

function normalizeStatus(status?: string | null) {
  return String(status || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function assistantName(
  assistant?: DepartmentAssistant
) {
  if (!assistant) return "";

  return (
    `${assistant.firstName || ""} ${
      assistant.lastName || ""
    }`.trim() || assistant.email
  );
}

export default function LegalDashboardPage() {
  const { user } = useAuth();

  const isSupervisor = SUPERVISOR_ROLES.includes(
    user?.role || ""
  );

  const [requests, setRequests] = useState<
    SpaceRequest[]
  >([]);
  const [assistants, setAssistants] = useState<
    DepartmentAssistant[]
  >([]);
  const [selectedAssistants, setSelectedAssistants] =
    useState<Record<number, string>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assigningId, setAssigningId] = useState<
    number | null
  >(null);

  const loadData = useCallback(
    async (initial = false) => {
      try {
        if (initial) setLoading(true);
        else setRefreshing(true);

        const [requestData, assistantData] =
          await Promise.all([
            spaceRequestService.getDepartmentRequests(),
            isSupervisor
              ? spaceRequestService.getLegalAssistants()
              : Promise.resolve([]),
          ]);

        setRequests(
          Array.isArray(requestData) ? requestData : []
        );
        setAssistants(assistantData);

        setSelectedAssistants((current) => {
          const next = { ...current };

          for (const request of requestData) {
            if (request.legalAssignedToUserId) {
              next[request.id] = String(
                request.legalAssignedToUserId
              );
            }
          }

          return next;
        });
      } catch (error) {
        console.error("Legal dashboard error:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Impossible de charger le tableau de bord"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isSupervisor]
  );

  useEffect(() => {
    void loadData(true);
  }, [loadData]);

  const filteredRequests = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return requests;

    return requests.filter((request) =>
      [
        request.reference,
        request.eventName,
        request.user?.username,
        request.user?.email,
        request.legalAssignedTo?.username,
      ].some((field) =>
        String(field || "")
          .toLowerCase()
          .includes(value)
      )
    );
  }, [requests, search]);

  const unassigned = requests.filter(
    (request) => !request.legalAssignedToUserId
  ).length;

  const handleAssign = async (requestId: number) => {
    const assistantId = Number(
      selectedAssistants[requestId]
    );

    if (!assistantId) {
      toast.error("Sélectionnez un assistant juridique.");
      return;
    }

    try {
      setAssigningId(requestId);

      const updated =
        await spaceRequestService.assignLegalAssistant(
          requestId,
          assistantId
        );

      setRequests((current) =>
        current.map((request) =>
          request.id === requestId ? updated : request
        )
      );

      const assistant = assistants.find(
        (item) => item.id === assistantId
      );

      toast.success(
        `Demande affectée à ${assistantName(assistant)}`
      );

      await loadData(false);
    } catch (error) {
      console.error("Legal assignment error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible d'affecter la demande"
      );
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <div className="space-y-6 text-[#5C4033]">
      <section className="rounded-2xl bg-[#D1965B] p-6 text-white shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-white/80">
          Service juridique
        </p>

        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          {isSupervisor
            ? "Supervision et affectation juridique"
            : "Mes demandes juridiques assignées"}
        </h1>

        <p className="mt-2 max-w-3xl text-white/90">
          {isSupervisor
            ? "Répartissez les demandes entre les assistants et suivez leur charge de travail."
            : "Traitez uniquement les dossiers qui vous ont été confiés par votre superviseur."}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Demandes visibles"
          value={requests.length}
          icon={ClipboardList}
        />
        <Stat
          label={
            isSupervisor
              ? "Non affectées"
              : "À traiter"
          }
          value={isSupervisor ? unassigned : requests.length}
          icon={Gavel}
        />
        <Stat
          label="Assistants actifs"
          value={isSupervisor ? assistants.length : 1}
          icon={Users}
        />
        <Stat
          label="Affectées"
          value={
            isSupervisor
              ? requests.length - unassigned
              : requests.length
          }
          icon={UserCheck}
        />
      </section>

      <section className="rounded-2xl border border-[#D1965B]/15 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#D1965B]/15 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {isSupervisor
                ? "File des demandes juridiques"
                : "Mes dossiers"}
            </h2>
            <p className="mt-1 text-sm text-[#5C4033]/60">
              {filteredRequests.length} dossier
              {filteredRequests.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C4033]/45" />
              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Référence, activité, demandeur..."
                className="h-10 w-full rounded-lg border border-[#D1965B]/25 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#D1965B] sm:w-72"
              />
            </label>

            <Button
              type="button"
              variant="outline"
              disabled={refreshing}
              onClick={() => void loadData(false)}
              className="border-[#D1965B]/30"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              Actualiser
            </Button>
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="py-14 text-center">
              Chargement...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-14 text-center text-[#5C4033]/60">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-[#D1965B]/45" />
              Aucune demande disponible.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((request) => (
                <article
                  key={request.id}
                  className="rounded-xl border border-[#D1965B]/15 bg-[#FBF9F5] p-4"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#D1965B]">
                        {request.reference}
                      </p>
                      <h3 className="mt-1 truncate text-lg font-bold">
                        {request.eventName}
                      </h3>
                      <p className="mt-1 text-sm text-[#5C4033]/60">
                        {request.user?.username ||
                          request.user?.email}
                      </p>
                      <span className="mt-2 inline-flex rounded-full bg-[#D1965B]/10 px-2.5 py-1 text-xs font-semibold text-[#B97D47]">
                        {statusLabels[
                          normalizeStatus(request.status)
                        ] ||
                          request.currentStep ||
                          request.status}
                      </span>

                      {isSupervisor &&
                        request.legalReviewState ===
                          "assistant_validated" && (
                          <span className="ml-2 mt-2 inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                            Avis favorable reçu — décision requise
                          </span>
                        )}

                      {isSupervisor &&
                        request.legalReviewState ===
                          "assistant_rejected" && (
                          <span className="ml-2 mt-2 inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                            Rejet recommandé — décision requise
                          </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                      {isSupervisor &&
                        ![
                          "assistant_validated",
                          "assistant_rejected",
                        ].includes(
                          request.legalReviewState || ""
                        ) && (
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <select
                            value={
                              selectedAssistants[request.id] || ""
                            }
                            onChange={(event) =>
                              setSelectedAssistants((current) => ({
                                ...current,
                                [request.id]: event.target.value,
                              }))
                            }
                            className="h-10 min-w-60 rounded-lg border border-[#D1965B]/25 bg-white px-3 text-sm"
                          >
                            <option value="">
                              Sélectionner un assistant
                            </option>
                            {assistants.map((assistant) => (
                              <option
                                key={assistant.id}
                                value={assistant.id}
                              >
                                {assistantName(assistant)} - {assistant.activeRequests} dossier(s)
                              </option>
                            ))}
                          </select>

                          <Button
                            type="button"
                            disabled={assigningId === request.id}
                            onClick={() =>
                              void handleAssign(request.id)
                            }
                            className="bg-[#D1965B] text-white hover:bg-[#B97D47]"
                          >
                            {assigningId === request.id
                              ? "Affectation..."
                              : request.legalAssignedToUserId
                                ? "Réaffecter"
                                : "Affecter"}
                          </Button>
                        </div>
                      )}

                      <Button
                        asChild
                        variant="outline"
                        className="border-[#D1965B]/30"
                      >
                        <Link
                          href={`/espace-membre/juridique/demandes/${request.id}`}
                        >
                          {isSupervisor
                            ? "Consulter"
                            : "Traiter"}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof ClipboardList;
}) {
  return (
    <div className="rounded-2xl border border-[#D1965B]/15 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#5C4033]/60">
            {label}
          </p>
          <p className="mt-1 text-3xl font-bold">
            {value}
          </p>
        </div>
        <div className="rounded-xl bg-[#D1965B]/10 p-3">
          <Icon className="h-6 w-6 text-[#D1965B]" />
        </div>
      </div>
    </div>
  );
}