"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  FileClock,
  History,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  spaceRequestService,
  type SpaceRequest,
  type ValidationHistory,
} from "@/services/spaceRequestService";

const departmentLabels: Record<string, string> = {
  MEMBER: "Demandeur",
  PROGRAMME: "Service des Programmes",
  REGISSEUR_GENERAL: "Régisseur général",
  DIRECTION_ARTISTIQUE: "Direction artistique",
  COMMUNICATION: "Service Communication",
  JURIDIQUE: "Service juridique",
  FINANCE: "Service des Finances",
  DG: "DG",
  ADMIN: "Administration",
};

function formatDateTime(value?: string | null) {
  if (!value) return "Date inconnue";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function departmentName(value?: string | null) {
  if (!value) return "Non renseigné";
  return departmentLabels[value] || value;
}

function performedByName(history: ValidationHistory) {
  if (!history.performedBy) {
    return "Utilisateur";
  }

  return (
    [
      history.performedBy.firstName,
      history.performedBy.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    history.performedBy.email ||
    "Utilisateur"
  );
}

export default function ProgrammeHistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const requestId = Number(params.id);

  const [histories, setHistories] = useState<
    ValidationHistory[]
  >([]);
  const [request, setRequest] = useState<SpaceRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    if (!Number.isInteger(requestId) || requestId <= 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [requestData, historyData] = await Promise.all([
        spaceRequestService.getOne(requestId),
        spaceRequestService.getHistory(requestId),
      ]);

      setRequest(requestData);
      setHistories(Array.isArray(historyData) ? historyData : []);
    } catch (error) {
      console.error("Programme history detail error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de charger l'historique de cette demande."
      );

      setRequest(null);
      setHistories([]);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  if (!Number.isInteger(requestId) || requestId <= 0) {
    return (
      <Card className="border-[#D1965B]/20 bg-white">
        <CardContent className="p-10 text-center">
          <FileClock className="mx-auto h-12 w-12 text-[#D1965B]" />

          <h1 className="mt-4 text-xl font-bold text-[#5C4033]">
            Identifiant invalide
          </h1>

          <Button asChild className="mt-6 bg-[#D1965B] text-white hover:bg-[#B97D47]">
            <Link href="/espace-membre/programme/historique">
              Retour à l&apos;historique
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/espace-membre/programme/historique"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#D1965B] transition hover:text-[#B97D47]"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à l&apos;historique
      </Link>

      <Card className="overflow-hidden rounded-3xl border border-[#D1965B]/20 bg-white shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <History className="h-6 w-6 text-[#D1965B]" />

            <div>
              <h1 className="text-xl font-bold text-[#5C4033] sm:text-2xl">
                {request?.eventName ||
                  request?.title ||
                  "Demande de réservation"}
              </h1>
              <p className="mt-1 text-sm text-[#5C4033]/55">
                Historique du traitement · {request?.reference || `#${requestId}`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-72 items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-9 w-9 animate-spin text-[#D1965B]" />
                <p className="mt-3 text-sm text-[#5C4033]/60">
                  Chargement des traitements...
                </p>
              </div>
            </div>
          ) : histories.length === 0 ? (
            <div className="py-14 text-center">
              <History className="mx-auto h-12 w-12 text-[#D1965B]/35" />
              <p className="mt-4 text-sm text-[#5C4033]/60">
                Aucun traitement n&apos;est enregistré pour cette demande.
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-0">
              {histories.map((history, index) => (
                <div
                  key={history.id}
                  className="relative flex gap-5 pb-7 last:pb-0"
                >
                  {index < histories.length - 1 && (
                    <div className="absolute left-[10px] top-7 h-[calc(100%-14px)] w-px bg-[#D1965B]/35" />
                  )}

                  <div className="relative z-10 mt-2 h-5 w-5 shrink-0 rounded-full bg-[#D1965B] ring-4 ring-white" />

                  <article className="min-w-0 flex-1 rounded-2xl bg-[#F3EEE5]/70 p-5 sm:p-6">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                      <h2 className="break-words font-bold text-[#5C4033]">
                        {history.action}
                      </h2>

                      <p className="shrink-0 text-sm text-[#5C4033]/45">
                        {formatDateTime(history.performedAt)}
                      </p>
                    </div>

                    <p className="mt-2 text-sm text-[#5C4033]/70 sm:text-base">
                      {departmentName(history.fromDepartment)} →{" "}
                      {departmentName(history.toDepartment)}
                    </p>

                    {history.comment && (
                      <p className="mt-3 whitespace-pre-wrap text-sm text-[#5C4033]/80 sm:text-base">
                        {history.comment}
                      </p>
                    )}

                    <p className="mt-3 text-sm text-[#5C4033]/45">
                      Traité par {performedByName(history)}
                    </p>
                  </article>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
