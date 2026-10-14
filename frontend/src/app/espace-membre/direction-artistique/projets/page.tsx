"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  FileText,
  FolderKanban,
  Loader2,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import {
  projectProposalService,
  type ProjectProposal,
  type ProjectProposalStatus,
} from "@/services/projectProposalService";
import {
  spaceRequestService,
  type DepartmentAssistant,
} from "@/services/spaceRequestService";

const SUPERVISOR_ROLES = new Set([
  "ADMIN",
  "DIRECTION_ARTISTIQUE",
  "DIRECTION_ARTISTIQUE_SUPERVISEUR",
]);

const statusLabels: Record<ProjectProposalStatus, string> = {
  SUBMITTED: "Nouvelle proposition",
  ASSIGNED: "Affectée à un assistant",
  ASSISTANT_REVIEW: "Analyse de l’assistant",
  SUPERVISOR_REVIEW: "Décision du superviseur",
  CORRECTION_REQUESTED: "Correction demandée",
  APPROVED: "Approuvée",
  REJECTED: "Rejetée",
};

const statusClasses: Record<ProjectProposalStatus, string> = {
  SUBMITTED: "bg-amber-100 text-amber-800",
  ASSIGNED: "bg-blue-100 text-blue-800",
  ASSISTANT_REVIEW: "bg-blue-100 text-blue-800",
  SUPERVISOR_REVIEW: "bg-violet-100 text-violet-800",
  CORRECTION_REQUESTED: "bg-orange-100 text-orange-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
};

function formatDate(value?: string | null) {
  if (!value) return "Non renseignée";
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "Non renseignée";

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function assistantName(assistant: DepartmentAssistant) {
  return (
    `${assistant.firstName || ""} ${assistant.lastName || ""}`.trim() ||
    assistant.email
  );
}

export default function ArtisticProjectsPage() {
  const { user } = useAuth();
  const isSupervisor = SUPERVISOR_ROLES.has(
    String(user?.role || "").toUpperCase()
  );

  const [proposals, setProposals] = useState<ProjectProposal[]>([]);
  const [assistants, setAssistants] = useState<DepartmentAssistant[]>([]);
  const [selectedAssistants, setSelectedAssistants] = useState<
    Record<number, string>
  >({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ACTIVE");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assigningId, setAssigningId] = useState<number | null>(null);

  const loadData = useCallback(
    async (initial = false) => {
      try {
        if (initial) setLoading(true);
        else setRefreshing(true);

        const [proposalData, assistantData] = await Promise.all([
          projectProposalService.getArtisticProposals(),
          isSupervisor
            ? spaceRequestService.getArtisticAssistants()
            : Promise.resolve([]),
        ]);

        setProposals(proposalData);
        setAssistants(assistantData);

        setSelectedAssistants((current) => {
          const next = { ...current };
          proposalData.forEach((proposal) => {
            if (proposal.assigned_to_user_id) {
              next[proposal.id] = String(
                proposal.assigned_to_user_id
              );
            }
          });
          return next;
        });
      } catch (error) {
        console.error("Artistic projects error:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Impossible de charger les propositions."
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

  const filteredProposals = useMemo(() => {
    const term = search.trim().toLowerCase();

    return proposals.filter((proposal) => {
      const active = !["APPROVED", "REJECTED"].includes(
        proposal.status
      );

      if (filter === "ACTIVE" && !active) return false;
      if (filter === "COMPLETED" && active) return false;

      if (!term) return true;

      return [
        proposal.reference,
        proposal.title,
        proposal.category,
        proposal.ownerName,
        proposal.ownerEmail,
      ].some((value) =>
        String(value || "").toLowerCase().includes(term)
      );
    });
  }, [filter, proposals, search]);

  async function assignProposal(proposalId: number) {
    const assistantId = Number(selectedAssistants[proposalId]);

    if (!Number.isInteger(assistantId) || assistantId <= 0) {
      toast.error("Sélectionnez un assistant.");
      return;
    }

    try {
      setAssigningId(proposalId);
      await projectProposalService.assignAssistant(
        proposalId,
        assistantId
      );
      toast.success("Proposition affectée à l’assistant.");
      await loadData(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible d’affecter la proposition."
      );
    } finally {
      setAssigningId(null);
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <section className="rounded-[2rem] bg-violet-700 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 text-violet-200">
              <FolderKanban className="h-5 w-5" />
              <span className="text-xs font-black uppercase tracking-[0.16em]">
                Direction artistique
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-black">
              Propositions de projet
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-violet-100">
              Consultez les dossiers culturels séparément des
              réservations d’espace, affectez-les et suivez leur
              évaluation artistique.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => void loadData(false)}
            disabled={refreshing}
            className="bg-white text-violet-700 hover:bg-violet-50"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            Actualiser
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher une référence, un projet ou un porteur..."
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          {[
            ["ACTIVE", "À traiter"],
            ["COMPLETED", "Traitées"],
            ["ALL", "Toutes"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                filter === value
                  ? "bg-violet-600 text-white"
                  : "bg-violet-50 text-violet-700 hover:bg-violet-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-72 items-center justify-center rounded-3xl border bg-white">
          <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="rounded-3xl border border-dashed bg-white p-12 text-center">
          <FolderKanban className="mx-auto h-12 w-12 text-violet-300" />
          <h2 className="mt-4 font-bold text-[#4B3429]">
            Aucune proposition trouvée
          </h2>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProposals.map((proposal) => (
            <article
              key={proposal.id}
              className="rounded-[1.6rem] border border-violet-100 bg-white p-5 shadow-sm transition hover:border-violet-300 hover:shadow-md sm:p-6"
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-violet-700">
                      {proposal.reference}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        statusClasses[proposal.status]
                      }`}
                    >
                      {statusLabels[proposal.status]}
                    </span>
                    <span className="rounded-full bg-[#F5EEE8] px-2.5 py-1 text-[11px] font-bold text-[#805A43]">
                      {proposal.category}
                    </span>
                  </div>

                  <h2 className="mt-3 text-xl font-black text-[#4B3429]">
                    {proposal.title}
                  </h2>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#5C4033]/60">
                    <span className="inline-flex items-center gap-2">
                      <UserRound className="h-4 w-4 text-violet-600" />
                      {proposal.ownerName || proposal.ownerEmail}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-violet-600" />
                      {formatDate(proposal.start_date)} – {formatDate(proposal.end_date)}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <FileText className="h-4 w-4 text-violet-600" />
                      {Number(proposal.documentCount || 0)} document(s)
                    </span>
                  </div>

                  {proposal.assignedToName && (
                    <p className="mt-3 text-xs font-semibold text-violet-700">
                      Affectée à {proposal.assignedToName}
                    </p>
                  )}
                </div>

                <div className="flex w-full flex-col gap-3 xl:w-auto xl:min-w-[350px] xl:flex-row">
                  {isSupervisor &&
                    !["APPROVED", "REJECTED"].includes(proposal.status) && (
                      <div className="flex flex-1 gap-2">
                        <select
                          value={selectedAssistants[proposal.id] || ""}
                          onChange={(event) =>
                            setSelectedAssistants((current) => ({
                              ...current,
                              [proposal.id]: event.target.value,
                            }))
                          }
                          className="h-10 min-w-0 flex-1 rounded-xl border bg-white px-3 text-sm"
                        >
                          <option value="">Choisir un assistant</option>
                          {assistants.map((assistant) => (
                            <option key={assistant.id} value={assistant.id}>
                              {assistantName(assistant)}
                            </option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          size="sm"
                          disabled={assigningId === proposal.id}
                          onClick={() => void assignProposal(proposal.id)}
                          className="bg-violet-600 text-white hover:bg-violet-700"
                        >
                          {assigningId === proposal.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Affecter"
                          )}
                        </Button>
                      </div>
                    )}

                  <Button asChild variant="outline" className="shrink-0">
                    <Link
                      href={`/espace-membre/direction-artistique/projets/${proposal.id}`}
                    >
                      Consulter
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
