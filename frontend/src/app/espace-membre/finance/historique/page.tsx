"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  Calendar,
  Eye,
  FileText,
  Gavel,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "../../../components/ui/card";
import RequestStatusBadge from "@/components/space-requests/RequestStatusBadge";
import {
  spaceRequestService,
  type SpaceRequest,
} from "@/services/spaceRequestService";

function formatDate(
  value?: string | null
): string {
  if (!value) {
    return "Date inconnue";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function LegalHistoryPage() {
  const [requests, setRequests] = useState<
    SpaceRequest[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);

      const data =
        await spaceRequestService.getDepartmentHistory();

      setRequests(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de charger l'historique"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-primary p-6 text-primary-foreground shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <Gavel className="mt-1 h-8 w-8" />

          <div>
            <p className="text-sm font-medium uppercase text-primary-foreground/80">
              Service juridique
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              Historique
            </h1>

            <p className="mt-2 text-primary-foreground/90">
              Retrouvez les dossiers examinés par le
              Service juridique.
            </p>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => void loadHistory()}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualiser
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-primary/40" />

              <h2 className="mt-4 font-semibold">
                Historique vide
              </h2>
            </div>
          ) : (
            <div className="divide-y">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col justify-between gap-4 p-5 hover:bg-muted/40 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="text-xs font-semibold text-primary">
                      {request.reference}
                    </p>

                    <h2 className="mt-1 font-semibold">
                      {request.eventName}
                    </h2>

                    <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />

                      {formatDate(
                        request.updatedAt ||
                          request.createdAt
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <RequestStatusBadge
                      status={request.status}
                    />

                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                    >
                      <Link
                        href={`/espace-membre/juridique/demandes/${request.id}`}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Consulter
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}