/**
 * Interface pour les informations de date d'un événement
 */
export interface EventDateInfo {
  hasEndDate: boolean;
  isSameDay: boolean;
  formattedStart: string;
  formattedEnd?: string;
  shortStart: string;
  shortEnd?: string;
  dayMonth: { day: string; month: string };
}

/**
 * Formate une période d'événement (date début + date fin optionnelle)
 */
export function formatEventPeriod(
  startDate: string,
  endDate?: string,
  options: {
    format?: "full" | "short" | "compact";
  } = {}
): EventDateInfo {
  const { format = "full" } = options;

  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  const hasEndDate = !!end;
  const isSameDay = hasEndDate
    ? start.toDateString() === end!.toDateString()
    : false;

  // Formatage des dates selon le format demandé
  const getDateFormat = (formatType: string) => {
    switch (formatType) {
      case "full":
        return {
          weekday: "long" as const,
          year: "numeric" as const,
          month: "long" as const,
          day: "numeric" as const,
        };
      case "short":
        return {
          month: "short" as const,
          day: "numeric" as const,
        };
      case "compact":
        return {
          month: "numeric" as const,
          day: "numeric" as const,
        };
      default:
        return {
          weekday: "long" as const,
          year: "numeric" as const,
          month: "long" as const,
          day: "numeric" as const,
        };
    }
  };

  const dateFormatOptions = getDateFormat(format);

  const formattedStart = start.toLocaleDateString("fr-FR", dateFormatOptions);
  const formattedEnd = end?.toLocaleDateString("fr-FR", dateFormatOptions);

  const shortStart = start.toLocaleDateString("fr-FR", {
    month: "short",
    day: "numeric",
  });
  const shortEnd = end?.toLocaleDateString("fr-FR", {
    month: "short",
    day: "numeric",
  });

  const dayMonth = {
    day: start.getDate().toString().padStart(2, "0"),
    month: start.toLocaleDateString("fr-FR", { month: "long" }),
  };

  return {
    hasEndDate,
    isSameDay,
    formattedStart,
    formattedEnd,
    shortStart,
    shortEnd,
    dayMonth,
  };
}

/**
 * Formate une période horaire (heure début + heure fin optionnelle)
 */
export function formatTimePeriod(startTime: string, endTime?: string): string {
  if (!endTime) {
    return startTime;
  }

  return `${startTime} - ${endTime}`;
}

/**
 * Génère un texte descriptif complet pour un événement
 */
export function formatEventDateTime(
  startDate: string,
  endDate?: string,
  startTime?: string,
  endTime?: string
): string {
  const dateInfo = formatEventPeriod(startDate, endDate);
  const timeInfo = formatTimePeriod(startTime || "", endTime);

  if (!dateInfo.hasEndDate) {
    // Événement sur une seule date
    return `${dateInfo.formattedStart}${startTime ? ` à ${timeInfo}` : ""}`;
  }

  if (dateInfo.isSameDay) {
    // Même jour, mais avec heure de fin
    return `${dateInfo.formattedStart}${startTime ? ` de ${timeInfo}` : ""}`;
  }

  // Événement sur plusieurs jours
  const dateRange = `Du ${dateInfo.formattedStart} au ${dateInfo.formattedEnd}`;
  if (startTime) {
    return `${dateRange}, de ${timeInfo}`;
  }
  return dateRange;
}

/**
 * Génère un texte court pour l'affichage dans les cartes
 */
export function formatEventDateShort(
  startDate: string,
  endDate?: string
): string {
  const dateInfo = formatEventPeriod(startDate, endDate, { format: "short" });

  if (!dateInfo.hasEndDate) {
    return dateInfo.shortStart;
  }

  if (dateInfo.isSameDay) {
    return dateInfo.shortStart;
  }

  return `${dateInfo.shortStart} - ${dateInfo.shortEnd}`;
}

/**
 * Vérifie si un événement est en cours (aujourd'hui entre start et end)
 */
export function isEventOngoing(startDate: string, endDate?: string): boolean {
  const today = new Date();
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : start;

  // Mettre à minuit pour comparer seulement les dates
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return today >= start && today <= end;
}

/**
 * Calcule la durée d'un événement en jours
 */
export function getEventDuration(startDate: string, endDate?: string): number {
  if (!endDate) return 1;

  const start = new Date(startDate);
  const end = new Date(endDate);

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  return diffDays;
}

/**
 * Formate une date d'inscription (ex: 12 janv., 14:30)
 */
export function formatRegistrationDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
