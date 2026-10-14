import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Retire les balises HTML d'un contenu riche (CKEditor) pour un aperçu en texte brut. */
export const stripHtml = (html: string): string =>
  html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const VIEW_COUNT_FMT = new Intl.NumberFormat("fr-FR");

/** Formate un nombre de vues à la française (ex. "1 245"). */
export const formatViewCount = (count: number): string =>
  VIEW_COUNT_FMT.format(count);

export const getMonthNumber = (monthName: string): string => {
  const months: Record<string, string> = {
    janvier: "01",
    février: "02",
    mars: "03",
    avril: "04",
    mai: "05",
    juin: "06",
    juillet: "07",
    août: "08",
    septembre: "09",
    octobre: "10",
    novembre: "11",
    décembre: "12",
  };
  return months[monthName.toLowerCase()] || "";
};
