"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Inbox,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../../../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { cn } from "@/lib/utils";
import {
  suggestionCategories,
  suggestionCategoryLabels,
  suggestionStatuses,
  suggestionStatusLabels,
  type SuggestionCategoryValue,
  type SuggestionStatusValue,
} from "@/lib/suggestions";
import { useSuggestionsQuery } from "@/hooks/useAdminDashboardQuery";
import {
  updateSuggestionStatus,
  type AdminSuggestion,
  type SuggestionCategory,
  type SuggestionStatus,
} from "@/services/adminService";

const statusClasses: Record<SuggestionStatusValue, string> = {
  NEW: "bg-blue-50 text-blue-700 border-blue-100",
  READ: "bg-amber-50 text-amber-700 border-amber-100",
  RESOLVED: "bg-green-50 text-green-700 border-green-100",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SuggestionsPageClient() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SuggestionStatus | "all">("all");
  const [category, setCategory] = useState<SuggestionCategory | "all">("all");
  const { data, isLoading, isError, error } = useSuggestionsQuery({
    status,
    category,
  });

  const mutation = useMutation({
    mutationFn: ({
      suggestionId,
      nextStatus,
    }: {
      suggestionId: string;
      nextStatus: SuggestionStatus;
    }) => updateSuggestionStatus(suggestionId, nextStatus),
    onSuccess: async () => {
      toast.success("Statut mis à jour");
      await queryClient.invalidateQueries({ queryKey: ["admin", "suggestions"] });
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message || "Impossible de mettre à jour le statut");
    },
  });

  const suggestions = data?.suggestions ?? [];
  const totalSuggestions = data?.totalSuggestions ?? 0;
  const newSuggestions = suggestions.filter(
    (suggestion) => suggestion.status === "NEW"
  ).length;

  const handleStatusChange = (
    suggestion: AdminSuggestion,
    nextStatus: SuggestionStatus
  ) => {
    if (suggestion.status === nextStatus) return;
    mutation.mutate({ suggestionId: suggestion.id, nextStatus });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Suggestions des membres
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consultez les retours envoyés par les membres du CCAPAC.
        </p>
      </div>

      {isError && (
        <div className="p-4 rounded-lg bg-red-50 text-red-600 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">
            Impossible de charger les suggestions.
            {error && (
              <span className="block text-xs opacity-80 mt-1">
                {error.message}
              </span>
            )}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Suggestions
                </p>
                <div className="text-2xl font-bold">
                  {isLoading ? "..." : totalSuggestions}
                </div>
              </div>
              <div className="rounded-full p-2 bg-blue-50 text-blue-600">
                <MessageSquare className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Nouvelles
                </p>
                <div className="text-2xl font-bold">
                  {isLoading ? "..." : newSuggestions}
                </div>
              </div>
              <div className="rounded-full p-2 bg-amber-50 text-amber-600">
                <Inbox className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-gray-50 bg-gray-50/50 px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <CardTitle className="text-base font-semibold">
              Liste des suggestions
            </CardTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(value as SuggestionStatus | "all")
                }
              >
                <SelectTrigger className="w-full sm:w-44 bg-white">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {suggestionStatuses.map((item) => (
                    <SelectItem key={item} value={item}>
                      {suggestionStatusLabels[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={category}
                onValueChange={(value) =>
                  setCategory(value as SuggestionCategory | "all")
                }
              >
                <SelectTrigger className="w-full sm:w-48 bg-white">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  {suggestionCategories.map((item) => (
                    <SelectItem key={item} value={item}>
                      {suggestionCategoryLabels[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Chargement des suggestions...
              </p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium text-foreground">
                Aucune suggestion trouvée
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Les retours des membres apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {suggestions.map((suggestion) => {
                const suggestionCategory =
                  suggestion.category as SuggestionCategoryValue;
                const suggestionStatus = suggestion.status as SuggestionStatusValue;
                const isUpdating =
                  mutation.isPending &&
                  mutation.variables?.suggestionId === suggestion.id;

                return (
                  <div key={suggestion.id} className="p-5 sm:p-6 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="bg-white">
                            {suggestionCategoryLabels[suggestionCategory]}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={statusClasses[suggestionStatus]}
                          >
                            {suggestionStatusLabels[suggestionStatus]}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {suggestion.user.name}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {suggestion.user.email}
                            </span>
                            {suggestion.user.phone && (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {suggestion.user.phone}
                              </span>
                            )}
                            <span>{formatDate(suggestion.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Select
                          value={suggestion.status}
                          onValueChange={(value) =>
                            handleStatusChange(
                              suggestion,
                              value as SuggestionStatus
                            )
                          }
                          disabled={isUpdating}
                        >
                          <SelectTrigger className="w-36 bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {suggestionStatuses.map((item) => (
                              <SelectItem key={item} value={item}>
                                {suggestionStatusLabels[item]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {isUpdating && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    <p
                      className={cn(
                        "text-sm leading-relaxed text-foreground whitespace-pre-wrap",
                        "rounded-lg border border-gray-100 bg-gray-50/60 p-4"
                      )}
                    >
                      {suggestion.message}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
