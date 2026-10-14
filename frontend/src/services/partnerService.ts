import { fetchJson } from "@/lib/content-api";

export interface Partner {
  name: string;
  logo: string;
  url?: string;
}

interface BackendPartner {
  name: string;
  logo?: string | null;
  url?: string | null;
}

/** Partenaires actifs (« Ils nous accompagnent »), servis par notre backend. */
export async function getPartners(): Promise<Partner[]> {
  try {
    const body = await fetchJson<{ data: BackendPartner[] }>("/partners");
    return (body?.data ?? [])
      .filter((p) => !!p.logo)
      .map((p) => ({
        name: p.name,
        logo: p.logo as string,
        url: p.url ?? undefined,
      }));
  } catch {
    return [];
  }
}
