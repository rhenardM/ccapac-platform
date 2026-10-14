"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Send,
  UserRound,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  projectProposalService,
  type ProjectProposal,
} from "@/services/projectProposalService";

const SUPERVISOR_ROLES = new Set([
  "ADMIN",
  "DIRECTION_ARTISTIQUE",
  "DIRECTION_ARTISTIQUE_SUPERVISEUR",
]);

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

function formatDateTime(value?: string | null) {
  if (!value) return "Date inconnue";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function documentUrl(path?: string | null) {
  if (!path) return "#";
  if (/^https?:\/\//i.test(path)) return path;

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000/api";

  return `${apiUrl.replace(/\/api\/?$/, "")}${
    path.startsWith("/") ? path : `/${path}`
  }`;
}

export default function ArtisticProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const proposalId = Number(params.id);

  const [proposal, setProposal] = useState<ProjectProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [comment, setComment] = useState("");

  const isSupervisor = SUPERVISOR_ROLES.has(
    String(user?.role || "").toUpperCase()
  );

  const loadProposal = useCallback(async () => {
    if (!Number.isInteger(proposalId) || proposalId <= 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await projectProposalService.getOne(proposalId);
      setProposal(data);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de charger la proposition."
      );
    } finally {
      setLoading(false);
    }
  }, [proposalId]);

  useEffect(() => {
    void loadProposal();
  }, [loadProposal]);

  const canReview = useMemo(
    () =>
      proposal &&
      !["APPROVED", "REJECTED"].includes(proposal.status),
    [proposal]
  );

  async function review(
    decision:
      | "APPROVE"
      | "REJECT"
      | "REQUEST_CORRECTION"
      | "RECOMMEND_APPROVAL"
      | "RECOMMEND_REJECTION"
  ) {
    if (comment.trim().length < 3) {
      toast.error("Ajoutez un commentaire motivant votre décision.");
      return;
    }

    try {
      setSubmitting(true);
      await projectProposalService.review(
        proposalId,
        decision,
        comment.trim()
      );
      toast.success("Décision artistique enregistrée.");
      setComment("");
      await loadProposal();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer la décision."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="rounded-3xl border bg-white p-12 text-center">
        <FileText className="mx-auto h-12 w-12 text-violet-300" />
        <h1 className="mt-4 text-xl font-bold">
          Proposition introuvable
        </h1>
        <Button
          type="button"
          className="mt-6"
          onClick={() => router.back()}
        >
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <Link
        href="/espace-membre/direction-artistique/projets"
        className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux propositions
      </Link>

      <section className="rounded-[2rem] bg-violet-700 p-6 text-white shadow-lg sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-200">
          {proposal.reference} · {proposal.category}
        </p>
        <h1 className="mt-3 text-3xl font-black">
          {proposal.title}
        </h1>
        <p className="mt-3 text-sm text-violet-100">
          {proposal.current_step}
        </p>

        <div className="mt-5 flex flex-wrap gap-4 text-sm text-violet-100">
          <span className="inline-flex items-center gap-2">
            <UserRound className="h-4 w-4" />
            {proposal.ownerName || proposal.ownerEmail}
          </span>
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            {formatDate(proposal.start_date)} – {formatDate(proposal.end_date)}
          </span>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-[#4B3429]">
              Présentation et intention
            </h2>

            <div className="mt-5 space-y-5 text-sm leading-7 text-[#5C4033]/75">
              <div>
                <h3 className="font-bold text-[#4B3429]">
                  Présentation générale
                </h3>
                <p className="mt-1 whitespace-pre-wrap">
                  {proposal.summary}
                </p>
              </div>
              <div>
                <h3 className="font-bold text-[#4B3429]">
                  Note d’intention
                </h3>
                <p className="mt-1 whitespace-pre-wrap">
                  {proposal.intention_note}
                </p>
              </div>
              <div>
                <h3 className="font-bold text-[#4B3429]">
                  Objectifs
                </h3>
                <p className="mt-1 whitespace-pre-wrap">
                  {proposal.objectives}
                </p>
              </div>
              <div>
                <h3 className="font-bold text-[#4B3429]">
                  Activités envisagées
                </h3>
                <p className="mt-1 whitespace-pre-wrap">
                  {proposal.planned_activities}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-[#4B3429]">
              Porteur, public et faisabilité
            </h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Info label="Public cible" value={proposal.target_audience} />
              <Info
                label="Budget prévisionnel"
                value={`${Number(proposal.estimated_budget || 0).toLocaleString("fr-FR")} USD`}
              />
              <Info
                label="Présentation du porteur"
                value={proposal.team}
                wide
              />
              <Info
                label="Besoins techniques et logistiques"
                value={proposal.technical_needs}
                wide
              />
              {proposal.expected_impact && (
                <Info
                  label="Impact attendu"
                  value={proposal.expected_impact}
                  wide
                />
              )}
              {proposal.previous_work && (
                <Info
                  label="Références antérieures"
                  value={proposal.previous_work}
                  wide
                />
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-black text-[#4B3429]">
              <FileText className="h-5 w-5 text-violet-600" />
              Documents du projet
            </h2>

            <div className="mt-5 space-y-3">
              {proposal.documents?.length ? (
                proposal.documents.map((document) => (
                  <a
                    key={document.id}
                    href={documentUrl(document.documentPath)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-2xl border border-violet-100 p-4 transition hover:border-violet-300 hover:bg-violet-50"
                  >
                    <div className="rounded-xl bg-violet-100 p-2 text-violet-700">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#4B3429]">
                        {document.documentName}
                      </p>
                      <p className="mt-1 text-xs text-[#5C4033]/50">
                        {formatDateTime(document.createdAt)}
                      </p>
                    </div>
                    <Download className="h-4 w-4 text-violet-600" />
                  </a>
                ))
              ) : (
                <p className="rounded-2xl bg-[#FCFAF8] p-5 text-center text-sm text-[#5C4033]/55">
                  Aucun document joint.
                </p>
              )}
            </div>
          </section>

          {canReview && (
            <section className="rounded-3xl border border-violet-200 bg-violet-50/60 p-6">
              <h2 className="text-xl font-black text-[#4B3429]">
                Décision artistique
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#5C4033]/65">
                Motivez votre avis avant de transmettre ou de prendre
                la décision finale.
              </p>

              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Commentaire, recommandation ou motif..."
                className="mt-5 min-h-32 w-full rounded-2xl border border-violet-200 bg-white p-4 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              />

              <div className="mt-4 grid gap-3">
                {isSupervisor ? (
                  <>
                    <Button
                      type="button"
                      disabled={submitting}
                      onClick={() => void review("APPROVE")}
                      className="bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Approuver le projet
                    </Button>
                    <Button
                      type="button"
                      disabled={submitting}
                      onClick={() => void review("REQUEST_CORRECTION")}
                      variant="outline"
                      className="border-amber-300 text-amber-800 hover:bg-amber-50"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Demander une correction
                    </Button>
                    <Button
                      type="button"
                      disabled={submitting}
                      onClick={() => void review("REJECT")}
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Rejeter le projet
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      disabled={submitting}
                      onClick={() => void review("RECOMMEND_APPROVAL")}
                      className="bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      Recommander l’approbation
                    </Button>
                    <Button
                      type="button"
                      disabled={submitting}
                      onClick={() => void review("RECOMMEND_REJECTION")}
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      Recommander le rejet
                    </Button>
                  </>
                )}
              </div>
            </section>
          )}

          <section className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-[#4B3429]">
              Historique du projet
            </h2>
            <div className="mt-5 space-y-4">
              {proposal.histories?.map((history) => (
                <div
                  key={history.id}
                  className="border-l-2 border-violet-300 pl-4"
                >
                  <p className="text-sm font-bold text-[#4B3429]">
                    {history.action}
                  </p>
                  <p className="mt-1 text-xs text-[#5C4033]/50">
                    {formatDateTime(history.performedAt)} · {history.performedByName || history.performedByEmail}
                  </p>
                  {history.comment && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-[#5C4033]/70">
                      {history.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  wide = false,
}: {
  label: string;
  value?: string | number | null;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "md:col-span-2" : undefined}>
      <p className="text-xs font-black uppercase tracking-wider text-violet-700">
        {label}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#5C4033]/75">
        {value || "Non renseigné"}
      </p>
    </div>
  );
}
