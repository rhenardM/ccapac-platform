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
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileClock,
  FileText,
  RefreshCw,
  Search,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "../../../components/ui/card";
import { Input } from "@/components/ui/input";
import RequestStatusBadge from "@/components/space-requests/RequestStatusBadge";
import {
  spaceRequestService,
  type SpaceRequest,
} from "@/services/spaceRequestService";

const ITEMS_PER_PAGE = 10;

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

export default function ProgrammeHistoryPage() {
  const [requests, setRequests] = useState<
    SpaceRequest[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const loadHistory = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const data =
          await spaceRequestService.getDepartmentHistory();

        setRequests(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        console.error(
          "Programme history error:",
          error
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Impossible de charger l'historique"
        );

        setRequests([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const filteredRequests = useMemo(() => {
    const term = search
      .trim()
      .toLowerCase();

    if (!term) {
      return requests;
    }

    return requests.filter((request) =>
      [
        request.reference,
        request.eventName,
        request.user?.username,
        request.user?.email,
        request.status,
      ].some((value) =>
        value
          ?.toLowerCase()
          .includes(term)
      )
    );
  }, [requests, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRequests.length / ITEMS_PER_PAGE)
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, filteredRequests]);

  const visiblePages = useMemo(() => {
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    const adjustedStart = Math.max(1, end - 4);

    return Array.from(
      { length: end - adjustedStart + 1 },
      (_, index) => adjustedStart + index
    );
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-7 pb-8 text-[#5C4033]">
      <section className="relative overflow-hidden rounded-[2rem] bg-primary p-6 text-primary-foreground shadow-xl shadow-primary/10 sm:p-9">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-primary-foreground/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
              <FileClock className="h-7 w-7 text-primary-foreground" />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground/80">
                Service des Programmes
              </p>

              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                Historique des demandes
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
                Consultez les demandes déjà traitées et retrouvez chaque étape de leur parcours.
              </p>
            </div>
          </div>

          <div className="w-fit rounded-2xl border border-white/15 bg-white/10 px-5 py-3 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/55">
              Dossiers archivés
            </p>
            <p className="mt-1 text-3xl font-black text-primary-foreground">
              {requests.length}
            </p>
          </div>
        </div>
      </section>

      <Card className="rounded-2xl border border-[#D1965B]/15 bg-white shadow-sm">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="relative w-full sm:max-w-lg">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#D1965B]" />

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Référence, événement, demandeur..."
              className="h-11 rounded-xl border-[#D1965B]/20 bg-[#FBF8F3] pl-11 text-[#5C4033] placeholder:text-[#5C4033]/40 focus-visible:ring-[#D1965B]/30"
            />
          </div>

          <div className="flex items-center gap-3">
            {!loading && (
              <p className="hidden text-sm text-[#5C4033]/55 md:block">
                {filteredRequests.length} résultat(s)
              </p>
            )}

            <Button
              type="button"
              variant="outline"
              disabled={refreshing}
              onClick={() => void loadHistory(false)}
              className="h-11 rounded-xl border-[#D1965B]/25 bg-white text-[#5C4033] hover:bg-[#F3EEE5]"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 text-[#D1965B] ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      <section>
          {loading ? (
            <div className="rounded-3xl border border-[#D1965B]/15 bg-white p-14 text-center shadow-sm">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#D1965B]/25 border-t-[#D1965B]" />
              <p className="mt-4 text-sm text-[#5C4033]/60">
                Chargement de l&apos;historique...
              </p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#D1965B]/30 bg-white p-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F3EEE5]">
                <FileText className="h-8 w-8 text-[#D1965B]/60" />
              </div>
              <h2 className="mt-5 text-lg font-bold text-[#5C4033]">
                Historique vide
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#5C4033]/55">
                {search
                  ? "Aucune demande ne correspond à votre recherche."
                  : "Aucune demande n'a encore été traitée par le Programme."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedRequests.map((request) => (
                <article
                  key={request.id}
                  className="group rounded-3xl border border-[#D1965B]/15 bg-white p-5 shadow-sm transition duration-300 hover:border-[#D1965B]/35 hover:shadow-lg sm:p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#D1965B]">
                          {request.reference || `#${request.id}`}
                        </p>
                        <RequestStatusBadge status={request.status as never} />
                      </div>

                      <h2 className="mt-3 line-clamp-2 text-xl font-black leading-tight text-[#5C4033] transition group-hover:text-[#B97D47]">
                        {request.eventName || request.title || "Demande d'espace"}
                      </h2>

                      <div className="mt-4 flex flex-col gap-3 text-sm text-[#5C4033]/65 sm:flex-row sm:flex-wrap sm:gap-5">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="rounded-lg bg-[#F3EEE5] p-2 text-[#D1965B]">
                            <User className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <strong className="font-semibold text-[#5C4033]">
                              {request.user?.username || "Membre"}
                            </strong>
                            {request.user?.email && (
                              <span className="ml-2 text-xs text-[#5C4033]/45">
                                {request.user.email}
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-[#F3EEE5] p-2 text-[#D1965B]">
                            <Calendar className="h-4 w-4" />
                          </span>
                          <span>
                            Modifiée le{" "}
                            <strong className="font-semibold text-[#5C4033]">
                              {formatDate(request.updatedAt || request.createdAt)}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      asChild
                      className="shrink-0 rounded-full bg-[#D1965B] px-5 text-white hover:bg-[#B97D47]"
                    >
                      <Link href={`/espace-membre/programme/historique/${request.id}`}>
                        Consulter le traitement
                        <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                      </Link>
                    </Button>
                  </div>
                </article>
              ))}

              {totalPages > 1 && (
                <nav
                  className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#D1965B]/15 bg-white p-4 sm:flex-row"
                  aria-label="Pagination de l'historique"
                >
                  <p className="text-sm text-[#5C4033]/55">
                    Affichage de{" "}
                    <strong className="text-[#5C4033]">
                      {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                    </strong>{" "}
                    à{" "}
                    <strong className="text-[#5C4033]">
                      {Math.min(
                        currentPage * ITEMS_PER_PAGE,
                        filteredRequests.length
                      )}
                    </strong>{" "}
                    sur {filteredRequests.length}
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() =>
                        setCurrentPage((page) => Math.max(1, page - 1))
                      }
                      className="rounded-lg border-[#D1965B]/25"
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Précédent
                    </Button>

                    {visiblePages.map((page) => (
                      <Button
                        key={page}
                        type="button"
                        size="sm"
                        variant={page === currentPage ? "default" : "outline"}
                        onClick={() => setCurrentPage(page)}
                        className={
                          page === currentPage
                            ? "h-9 min-w-9 rounded-lg bg-[#D1965B] text-white hover:bg-[#B97D47]"
                            : "h-9 min-w-9 rounded-lg border-[#D1965B]/25"
                        }
                        aria-current={page === currentPage ? "page" : undefined}
                      >
                        {page}
                      </Button>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.min(totalPages, page + 1)
                        )
                      }
                      className="rounded-lg border-[#D1965B]/25"
                    >
                      Suivant
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </nav>
              )}
            </div>
          )}
      </section>
    </div>
  );
}
