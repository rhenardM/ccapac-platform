import { redirect } from "next/navigation";
import { Lightbulb, MessageSquare } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { getUser } from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import {
  suggestionCategoryLabels,
  suggestionStatusLabels,
  type SuggestionCategoryValue,
  type SuggestionStatusValue,
} from "@/lib/suggestions";
import { SuggestionsForm } from "./SuggestionsForm";

const statusClasses: Record<SuggestionStatusValue, string> = {
  NEW: "bg-blue-50 text-blue-700 border-blue-100",
  READ: "bg-amber-50 text-amber-700 border-amber-100",
  RESOLVED: "bg-green-50 text-green-700 border-green-100",
};

export default async function SuggestionsPage() {
  const user = await getUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (user.role === "ADMIN") {
    redirect("/espace-membre/admin/suggestions");
  }

  const suggestions = await prisma.memberSuggestion.findMany({
    where: { userId: user.dbUserId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Suggestions
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Partagez vos idées et remarques avec l&apos;équipe du centre culturel.
        </p>
      </div>

      <Card className="border-none shadow-sm bg-white py-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Lightbulb className="h-5 w-5 text-primary" />
            Nouvelle suggestion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SuggestionsForm />
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-gray-50 bg-gray-50/50 px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <MessageSquare className="h-5 w-5 text-primary" />
            Mes suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium text-foreground">
                Aucune suggestion envoyée
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Vos messages apparaîtront ici après envoi.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {suggestions.map((suggestion) => {
                const category = suggestion.category as SuggestionCategoryValue;
                const status = suggestion.status as SuggestionStatusValue;

                return (
                  <div key={suggestion.id} className="p-5 sm:p-6 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-white">
                          {suggestionCategoryLabels[category]}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={statusClasses[status]}
                        >
                          {suggestionStatusLabels[status]}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(suggestion.createdAt).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
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
