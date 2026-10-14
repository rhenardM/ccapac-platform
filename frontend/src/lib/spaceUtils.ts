/** Formate la capacité d'accueil d'un espace (ex. "500 personnes"). */
export function formatCapacity(capacity: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(capacity)} personne${capacity > 1 ? "s" : ""}`;
}
