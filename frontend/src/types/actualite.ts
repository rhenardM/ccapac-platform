export type ActualiteType = "NEWSLETTER" | "COMMUNIQUE" | "POINT_PRESSE";

export type ActualiteMois =
  | "Janvier"
  | "Fevrier"
  | "Février"
  | "Mars"
  | "Avril"
  | "Mai"
  | "Juin"
  | "Juillet"
  | "Aout"
  | "Août"
  | "Septembre"
  | "Octobre"
  | "Novembre"
  | "Decembre"
  | "Décembre";

export interface ActualiteMedia {
  name: string;

  size?: number;
  
  ext?: string;
}

export interface ActualiteBlock {
  __component: string;
  id?: number;
  title?: string;
  body?: string;
  file?: {
    url?: string;
    name?: string;
  };
  files?: Array<{
    url?: string;
    name?: string;
  }>;
}

export interface Actualite {
  id: number;
  documentId?: string;
  title: string;
  slug: string;
  type: ActualiteType;
  summary?: string;
  blocks?: ActualiteBlock[];
  pdf?: ActualiteMedia;
  coverImage?: string;
  mois?: ActualiteMois;
  annee?: number;
  pageCount?: number;
  isFeatured: boolean;
  datePublication?: string;
  createdAt: string;
  publishedAt?: string;
}

export interface ActualiteForDownload extends Actualite {
  pdfUrl: string;
  pdfName: string;
}
