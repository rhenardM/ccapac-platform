/**
 * Client de l'API de contenu éditorial exposée par NOTRE backend Symfony
 * (Fundraising-integration → /api/content/*).
 *
 * Toutes les URLs média renvoyées par le backend sont déjà absolues
 * (http(s)://<host>/uploads/media/...), donc aucune reconstruction n'est nécessaire.
 */

/**
 * Base de l'API contenu, sans slash final.
 *
 * Résolution (par priorité) :
 *  1. `NEXT_PUBLIC_CONTENT_API_URL` si définie (recommandé en prod comme en local) ;
 *  2. à défaut : backend public de production.
 *
 * Le frontend ne doit jamais supposer qu'un backend tourne sur le PC de
 * l'utilisateur. Pour travailler avec Symfony en local, il suffit de définir
 * NEXT_PUBLIC_CONTENT_API_URL dans `.env.local`.
 */
export const CONTENT_API_BASE_URL = (
  process.env.NEXT_PUBLIC_CONTENT_API_URL ||
  "https://api-fundraising.centreculturel.cd/api/content"
).replace(/\/+$/, "");

/**
 * Base de l'API du module Cinémathèque (indépendant du CMS, même backend).
 * Dérivée de CONTENT_API_BASE_URL en remplaçant le suffixe /api/content.
 */
export const CINEMATHEQUE_API_BASE_URL = CONTENT_API_BASE_URL.replace(
  /\/api\/content$/,
  "/api/cinematheque"
);

/**
 * Base de l'API du module Espaces du Grand Tambour (indépendant du CMS, même backend).
 */
export const ESPACES_API_BASE_URL = CONTENT_API_BASE_URL.replace(
  /\/api\/content$/,
  "/api/espaces"
);

/**
 * Dérive un identifiant numérique STABLE à partir d'un slug.
 * - Utilise le dernier groupe de chiffres du slug ("event-12" → 12, "edition-06" → 6).
 * - À défaut, repli sur un hash déterministe (djb2) borné.
 *
 * Doit rester identique côté service ET côté routes lecteur/téléchargement PDF
 * pour que les liens `/api/actualites/{id}/...` retombent sur le bon contenu.
 */
export function slugToId(slug: string): number {
  const matches = slug.match(/\d+/g);
  if (matches && matches.length > 0) {
    const n = parseInt(matches[matches.length - 1], 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  let h = 5381;
  for (let i = 0; i < slug.length; i++) {
    h = ((h << 5) + h + slug.charCodeAt(i)) >>> 0;
  }
  return (h % 1_000_000) + 1;
}

interface ContentListResult<T> {
  data: T[];
  meta?: { total: number; page: number; perPage: number; pages: number };
}

/**
 * Récupère une ressource JSON depuis la base donnée.
 * `cache: "no-store"` → contenu TOUJOURS frais (CMS) : une rubrique/programme
 * ajouté au dashboard apparaît immédiatement, sans attendre un cache.
 */
async function fetchJsonFrom<T>(base: string, path: string): Promise<T> {
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  let res: Response;

  try {
    res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    throw new Error(
      `Le serveur de contenu est indisponible (${base}). Vérifiez NEXT_PUBLIC_CONTENT_API_URL.`
    );
  }

  if (!res.ok) {
    throw new Error(`Erreur API: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

async function fetchJson<T>(path: string): Promise<T> {
  return fetchJsonFrom<T>(CONTENT_API_BASE_URL, path);
}

/** Variante de fetchJson pour le module Cinémathèque (base d'API différente). */
export async function fetchCinemathequeJson<T>(path: string): Promise<T> {
  return fetchJsonFrom<T>(CINEMATHEQUE_API_BASE_URL, path);
}

/** Variante de fetchJson pour le module Espaces du Grand Tambour. */
export async function fetchEspacesJson<T>(path: string): Promise<T> {
  return fetchJsonFrom<T>(ESPACES_API_BASE_URL, path);
}

/**
 * Récupère TOUTES les pages d'une liste paginée du backend et concatène les items.
 * Datasets volontairement petits (≤ quelques centaines) → coût négligeable.
 */
export async function fetchAll<T>(
  endpoint: string,
  { hardLimit = 50 }: { hardLimit?: number } = {}
): Promise<T[]> {
  const items: T[] = [];
  let page = 1;

  // Boucle jusqu'à épuisement (meta.pages) ou page vide, avec garde-fou.
  while (page <= hardLimit) {
    const sep = endpoint.includes("?") ? "&" : "?";
    const body = await fetchJson<ContentListResult<T>>(
      `${endpoint}${sep}page=${page}`
    );
    const batch = body?.data ?? [];
    items.push(...batch);

    const pages = body?.meta?.pages;
    if (pages !== undefined) {
      if (page >= pages) break;
    } else if (batch.length === 0) {
      // Endpoints sans meta (média) : on s'arrête sur une page vide.
      break;
    }
    page += 1;
  }

  return items;
}

export { fetchJson };
