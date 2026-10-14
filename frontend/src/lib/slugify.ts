/**
 * Convertit une chaîne de caractères en slug SEO-friendly
 * Gère correctement les accents français et les caractères spéciaux
 * @param text - Le texte à convertir en slug
 * @returns Le slug généré
 *
 * @example
 * slugify("Théâtre & Arts de la scène") // → "theatre-arts-de-la-scene"
 * slugify("Musique & Arts vivants")     // → "musique-arts-vivants"
 * slugify("Cinéma & Audiovisuel")       // → "cinema-audiovisuel"
 */
export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      // Remplacer les caractères accentués par leur équivalent sans accent
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // Remplacer & par "et" pour un meilleur SEO
      .replace(/\s*&\s*/g, "-")
      // Remplacer les apostrophes et guillemets
      .replace(/['''"""]/g, "")
      // Remplacer les espaces, underscores et caractères spéciaux par des tirets
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      // Supprimer les tirets en début et fin
      .replace(/^-+|-+$/g, "")
  );
}

/**
 * Génère un slug unique en ajoutant un suffixe numérique si nécessaire
 * @param text - Le texte à convertir en slug
 * @param existingSlugs - Liste des slugs existants à éviter
 * @returns Le slug unique généré
 */
export function generateUniqueSlug(
  text: string,
  existingSlugs: string[] = []
): string {
  const baseSlug = slugify(text);

  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;

  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }

  return uniqueSlug;
}
