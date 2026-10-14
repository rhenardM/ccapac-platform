import { z } from "zod";

export const suggestionCategories = [
  "PROGRAMMATION",
  "ACCUEIL",
  "ESPACES",
  "COMMUNICATION",
  "AUTRE",
] as const;

export const suggestionStatuses = ["NEW", "READ", "RESOLVED"] as const;

export type SuggestionCategoryValue = (typeof suggestionCategories)[number];
export type SuggestionStatusValue = (typeof suggestionStatuses)[number];

export const suggestionCategoryLabels: Record<SuggestionCategoryValue, string> = {
  PROGRAMMATION: "Programmation",
  ACCUEIL: "Accueil",
  ESPACES: "Espaces",
  COMMUNICATION: "Communication",
  AUTRE: "Autre",
};

export const suggestionStatusLabels: Record<SuggestionStatusValue, string> = {
  NEW: "Nouveau",
  READ: "Lu",
  RESOLVED: "Traité",
};

export const suggestionSchema = z.object({
  category: z.enum(suggestionCategories, {
    message: "Veuillez choisir une catégorie",
  }),
  message: z
    .string()
    .trim()
    .min(10, "Le message doit contenir au moins 10 caractères")
    .max(2000, "Le message ne peut pas dépasser 2000 caractères"),
});

export type SuggestionFormValues = z.infer<typeof suggestionSchema>;
